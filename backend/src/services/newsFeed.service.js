const { CATEGORY_DEFINITIONS, getNewsFeedConfig } = require('../config/newsFeeds');
const { ApiError } = require('../utils/apiResponse');

const cache = new Map();

function normalizeArticle(article, categoryKey) {
  return {
    id: article.article_id || article.link,
    title: article.title || 'Untitled article',
    description: article.description || article.content || '',
    url: article.link || null,
    imageUrl: article.image_url || null,
    source: article.source_name || article.source_id || 'Unknown source',
    sourceUrl: article.source_url || null,
    publishedAt: article.pubDate || null,
    category: categoryKey,
    categories: Array.isArray(article.category) ? article.category : [],
    country: Array.isArray(article.country) ? article.country : [],
    language: article.language || null,
  };
}

function dedupeArticles(articles) {
  const seen = new Set();
  return articles.filter((article) => {
    const key = article.id || article.url || article.title;
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function getCategory(key) {
  const category = CATEGORY_DEFINITIONS[key];
  if (!category) {
    throw new ApiError(`Unknown news feed category: ${key}`, 400, {
      allowedCategories: Object.keys(CATEGORY_DEFINITIONS),
    });
  }
  return category;
}

async function fetchCategory(categoryKey) {
  const config = getNewsFeedConfig();

  if (!config.apiKey) {
    throw new ApiError(
      'News feeds are not configured. Set NEWSDATA_API_KEY on the backend.',
      503
    );
  }

  const category = getCategory(categoryKey);
  const params = new URLSearchParams({
    apikey: config.apiKey,
    language: config.language,
    country: (category.countries?.length ? category.countries : config.defaultCountries).join(','),
  });

  if (category.category) params.set('category', category.category);
  if (category.query) params.set('q', category.query);

  const response = await fetch(`${config.baseUrl}?${params.toString()}`, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(10000),
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok || payload?.status === 'error') {
    const providerMessage =
      payload?.results?.message ||
      payload?.message ||
      `News provider returned HTTP ${response.status}`;

    throw new ApiError(`News provider error: ${providerMessage}`, 502);
  }

  const articles = Array.isArray(payload?.results) ? payload.results : [];
  return {
    category: {
      key: categoryKey,
      label: category.label,
      icon: category.icon,
    },
    articles: dedupeArticles(
      articles.map((article) => normalizeArticle(article, categoryKey))
    ).slice(0, config.limit),
    fetchedAt: new Date().toISOString(),
  };
}

async function listCategories() {
  return [
    ...Object.entries(CATEGORY_DEFINITIONS).map(([key, value]) => ({
      key,
      label: value.label,
      icon: value.icon,
    })),
  ];
}

async function listFeeds({ category, forceRefresh = false } = {}) {
  const config = getNewsFeedConfig();
  const now = Date.now();
  const ttl = Math.max(config.cacheMinutes, 1) * 60 * 1000;

  const categoryKeys = category ? [category] : Object.keys(CATEGORY_DEFINITIONS);
  const results = [];

  for (const categoryKey of categoryKeys) {
    getCategory(categoryKey);

    const cached = cache.get(categoryKey);
    if (!forceRefresh && cached && now - cached.cachedAt < ttl) {
      results.push({
        ...cached.data,
        cached: true,
        cacheExpiresAt: new Date(cached.cachedAt + ttl).toISOString(),
      });
      continue;
    }

    try {
      const data = await fetchCategory(categoryKey);
      cache.set(categoryKey, { cachedAt: now, data });
      results.push({
        ...data,
        cached: false,
        cacheExpiresAt: new Date(now + ttl).toISOString(),
      });
    } catch (error) {
      // If the provider is temporarily unavailable, keep serving the last
      // successful result rather than making the student page completely blank.
      if (cached?.data) {
        results.push({
          ...cached.data,
          cached: true,
          stale: true,
          cacheExpiresAt: new Date(cached.cachedAt + ttl).toISOString(),
        });
        continue;
      }
      throw error;
    }
  }

  return {
    provider: 'NewsData.io',
    updatedAt: new Date().toISOString(),
    cacheMinutes: config.cacheMinutes,
    categories: results,
  };
}

async function fetchNigeria() {
  const config = getNewsFeedConfig();

  if (!config.apiKey) {
    throw new ApiError(
      'News feeds are not configured. Set NEWSDATA_API_KEY on the backend.',
      503
    );
  }

  const params = new URLSearchParams({
    apikey: config.apiKey,
    country: 'ng',
    language: config.language,
  });

  const response = await fetch(`${config.baseUrl}?${params.toString()}`, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(10000),
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok || payload?.status === 'error') {
    const providerMessage =
      payload?.results?.message ||
      payload?.message ||
      `News provider returned HTTP ${response.status}`;

    throw new ApiError(`News provider error: ${providerMessage}`, 502);
  }

  const articles = Array.isArray(payload?.results) ? payload.results : [];

  return {
    category: {
      key: 'nigeria',
      label: 'Nigerian News',
      icon: '🇳🇬',
    },
    articles: dedupeArticles(
      articles.map((article) => normalizeArticle(article, 'nigeria'))
    ).slice(0, config.limit),
    fetchedAt: new Date().toISOString(),
  };
}

async function listNigeria({ forceRefresh = false } = {}) {
  const config = getNewsFeedConfig();
  const now = Date.now();
  const ttl = Math.max(config.cacheMinutes, 1) * 60 * 1000;
  const cacheKey = '__nigeria__';
  const cached = cache.get(cacheKey);

  if (!forceRefresh && cached && now - cached.cachedAt < ttl) {
    return {
      provider: 'NewsData.io',
      updatedAt: new Date().toISOString(),
      cacheMinutes: config.cacheMinutes,
      categories: [{
        ...cached.data,
        cached: true,
        cacheExpiresAt: new Date(cached.cachedAt + ttl).toISOString(),
      }],
    };
  }

  try {
    const data = await fetchNigeria();
    cache.set(cacheKey, { cachedAt: now, data });
    return {
      provider: 'NewsData.io',
      updatedAt: new Date().toISOString(),
      cacheMinutes: config.cacheMinutes,
      categories: [{
        ...data,
        cached: false,
        cacheExpiresAt: new Date(now + ttl).toISOString(),
      }],
    };
  } catch (error) {
    if (cached?.data) {
      return {
        provider: 'NewsData.io',
        updatedAt: new Date().toISOString(),
        cacheMinutes: config.cacheMinutes,
        categories: [{
          ...cached.data,
          cached: true,
          stale: true,
          cacheExpiresAt: new Date(cached.cachedAt + ttl).toISOString(),
        }],
      };
    }
    throw error;
  }
}

function clearCache() {
  cache.clear();
}

module.exports = {
  listCategories,
  listFeeds,
  listNigeria,
  clearCache,
};
