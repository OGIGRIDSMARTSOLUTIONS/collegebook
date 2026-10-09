import { api } from './api';

const articleCache = new Map();
const articleRequests = new Map();

async function fetchArticle(url) {
  if (!url) return null;
  if (articleCache.has(url)) return articleCache.get(url);
  if (articleRequests.has(url)) return articleRequests.get(url);

  const request = api
    .get('/news-feeds/reader', { params: { url } })
    .then((article) => {
      articleCache.set(url, article);
      return article;
    })
    .finally(() => articleRequests.delete(url));

  articleRequests.set(url, request);
  return request;
}

/**
 * CollegeBook News & Feeds API.
 * Article reads use a small in-memory client cache so a prefetched story opens
 * instantly and repeated opens do not make another network request.
 */
export const newsFeedService = {
  readArticle: fetchArticle,
  prefetchArticle: (url) => {
    if (!url || articleCache.has(url) || articleRequests.has(url)) return;
    fetchArticle(url).catch(() => {});
  },
  list: async (params = {}) => {
    const endpoint = params?.category === 'nigeria' ? '/news-feeds/nigeria' : '/news-feeds';
    const requestParams = params?.category === 'nigeria'
      ? { refresh: params.refresh }
      : params;
    const data = await api.get(endpoint, { params: requestParams });

    const categories = Array.isArray(data?.categories) ? data.categories : [];
    const items = categories.flatMap((group) => {
      const key = group?.category?.key;
      const label = group?.category?.label;
      const icon = group?.category?.icon;

      return (Array.isArray(group?.articles) ? group.articles : []).map((article) => ({
        ...article,
        category: article?.category || key,
        categoryLabel: label,
        categoryIcon: icon,
      }));
    });

    return {
      ...data,
      categories,
      items,
    };
  },
};
