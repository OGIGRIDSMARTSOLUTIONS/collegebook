const dns = require('dns').promises;
const net = require('net');
const { ApiError } = require('../utils/apiResponse');
const sharedCache = require('./cache.service');

const memoryCache = new Map();
const CACHE_SECONDS = 30 * 60;
const MAX_HTML_BYTES = 5_000_000;
const MAX_ARTICLE_CHARS = 120_000;
const pendingReads = new Map();

function decodeEntities(value = '') {
  const named = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
  return String(value)
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&([a-z]+);/gi, (match, name) => named[name.toLowerCase()] ?? match);
}

function cleanText(value = '') {
  return decodeEntities(String(value).replace(/<[^>]*>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim();
}

function meta(html, key) {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const patterns = [
    new RegExp(`<meta[^>]+(?:property|name)=["']${escaped}["'][^>]+content=["']([^"']*)["'][^>]*>`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+(?:property|name)=["']${escaped}["'][^>]*>`, 'i'),
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return cleanText(match[1]);
  }
  return '';
}

function extractTitle(html) {
  return meta(html, 'og:title') || meta(html, 'twitter:title') || cleanText(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || '');
}

function extractImage(html, baseUrl) {
  const raw = meta(html, 'og:image') || meta(html, 'twitter:image');
  if (!raw) return null;
  try { return new URL(raw, baseUrl).toString(); } catch { return null; }
}

function extractPublishedAt(html) {
  return meta(html, 'article:published_time') || meta(html, 'datePublished') || meta(html, 'date') || null;
}

function splitArticleBody(value = '') {
  return decodeEntities(String(value))
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .split(/\n{2,}|(?<=[.!?])\s+(?=[A-Z0-9“"'])/)
    .map((part) => cleanText(part))
    .filter((part) => part.length >= 35);
}

function extractJsonLdArticleBody(html) {
  const scriptPattern = /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match;

  while ((match = scriptPattern.exec(html))) {
    try {
      const parsed = JSON.parse(decodeEntities(match[1]).trim());
      const queue = Array.isArray(parsed) ? [...parsed] : [parsed];

      while (queue.length) {
        const node = queue.shift();
        if (!node || typeof node !== 'object') continue;
        if (Array.isArray(node['@graph'])) queue.push(...node['@graph']);
        if (typeof node.articleBody === 'string' && node.articleBody.trim().length > 150) {
          return splitArticleBody(node.articleBody);
        }
      }
    } catch {
      // Some publishers expose malformed JSON-LD. The HTML extractor below
      // remains the safe fallback.
    }
  }

  return [];
}

function extractArticleText(html) {
  const jsonLdParagraphs = extractJsonLdArticleBody(html);
  if (jsonLdParagraphs.length) return jsonLdParagraphs;

  const withoutNoise = html
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<(script|style|noscript|svg|form|nav|footer|aside|button|dialog)[^>]*>[\s\S]*?<\/\1>/gi, ' ');

  const candidates = [
    withoutNoise.match(/<article\b[^>]*>([\s\S]*?)<\/article>/i)?.[1],
    withoutNoise.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1],
    withoutNoise.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i)?.[1],
    withoutNoise,
  ].filter(Boolean);

  let best = [];

  for (const candidate of candidates) {
    const paragraphs = [];
    const seen = new Set();
    const blockPattern = /<(p|h2|h3|h4|blockquote|li)\b[^>]*>([\s\S]*?)<\/\1>/gi;
    let match;
    let totalChars = 0;

    while ((match = blockPattern.exec(candidate))) {
      const text = cleanText(match[2]);
      if (text.length < 35 || seen.has(text)) continue;
      if (/^(advertisement|subscribe|sign up|cookie|privacy policy|read more|related articles?|recommended)$/i.test(text)) continue;
      if (/^(share|follow us|newsletter|all rights reserved)\b/i.test(text)) continue;

      seen.add(text);
      paragraphs.push(text);
      totalChars += text.length;
      if (totalChars >= MAX_ARTICLE_CHARS) break;
    }

    if (paragraphs.join(' ').length > best.join(' ').length) best = paragraphs;
    if (best.join(' ').length >= 2500) break;
  }

  return best;
}

function isPrivateIp(ip) {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split('.').map(Number);
    return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168);
  }
  if (net.isIPv6(ip)) {
    const normalized = ip.toLowerCase();
    return normalized === '::1' || normalized.startsWith('fc') || normalized.startsWith('fd') || normalized.startsWith('fe80:');
  }
  return true;
}

async function assertPublicUrl(rawUrl) {
  let url;
  try { url = new URL(rawUrl); } catch { throw new ApiError('Invalid news article URL.', 400); }
  if (!['http:', 'https:'].includes(url.protocol)) throw new ApiError('Only HTTP and HTTPS news links are supported.', 400);
  if (!url.hostname || url.username || url.password) throw new ApiError('Invalid news article URL.', 400);
  const records = await dns.lookup(url.hostname, { all: true });
  if (!records.length || records.some((record) => isPrivateIp(record.address))) throw new ApiError('This news address cannot be opened by the reader.', 400);
  return url;
}

async function fetchHtml(initialUrl) {
  let currentUrl = initialUrl;

  for (let redirectCount = 0; redirectCount <= 5; redirectCount += 1) {
    await assertPublicUrl(currentUrl);
    const response = await fetch(currentUrl, {
      redirect: 'manual',
      signal: AbortSignal.timeout(12_000),
      headers: {
        Accept: 'text/html,application/xhtml+xml',
        'User-Agent': 'Mozilla/5.0 (compatible; CollegeBookReader/1.0; +https://collegebook.app)',
      },
    });

    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get('location');
      if (!location) throw new ApiError('The publisher returned an invalid redirect.', 502);
      currentUrl = new URL(location, currentUrl).toString();
      continue;
    }

    if (!response.ok) throw new ApiError(`Publisher returned HTTP ${response.status}.`, 502);
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('text/html') && !contentType.includes('application/xhtml+xml')) throw new ApiError('The publisher did not return a readable web article.', 422);
    const length = Number(response.headers.get('content-length') || 0);
    if (length > MAX_HTML_BYTES) throw new ApiError('This article is too large for the in-app reader.', 413);
    const html = await response.text();
    if (Buffer.byteLength(html, 'utf8') > MAX_HTML_BYTES) throw new ApiError('This article is too large for the in-app reader.', 413);
    return { html, finalUrl: currentUrl };
  }

  throw new ApiError('The publisher redirected too many times.', 502);
}

async function loadArticle(rawUrl) {
  const safeUrl = await assertPublicUrl(rawUrl);
  const cacheKey = `news:reader:${Buffer.from(safeUrl.toString()).toString('base64url').slice(0, 180)}`;
  const local = memoryCache.get(cacheKey);
  if (local && Date.now() - local.cachedAt < CACHE_SECONDS * 1000) return { ...local.data, cached: true };

  const shared = await sharedCache.get(cacheKey);
  if (shared?.data) {
    memoryCache.set(cacheKey, shared);
    return { ...shared.data, cached: true };
  }

  const { html, finalUrl } = await fetchHtml(safeUrl.toString());
  const paragraphs = extractArticleText(html);
  if (!paragraphs.length) throw new ApiError('The publisher page could not be converted into readable article text.', 422);

  const data = {
    title: extractTitle(html),
    description: meta(html, 'og:description') || meta(html, 'description'),
    imageUrl: extractImage(html, finalUrl),
    publishedAt: extractPublishedAt(html),
    source: meta(html, 'og:site_name') || new URL(finalUrl).hostname.replace(/^www\./, ''),
    url: finalUrl,
    paragraphs,
    fetchedAt: new Date().toISOString(),
  };

  const entry = { cachedAt: Date.now(), data };
  memoryCache.set(cacheKey, entry);
  await sharedCache.set(cacheKey, entry, CACHE_SECONDS);
  return { ...data, cached: false };
}

async function readArticle(rawUrl) {
  const requestKey = String(rawUrl || '');
  if (pendingReads.has(requestKey)) return pendingReads.get(requestKey);

  const promise = loadArticle(rawUrl).finally(() => pendingReads.delete(requestKey));
  pendingReads.set(requestKey, promise);
  return promise;
}

module.exports = { readArticle };
