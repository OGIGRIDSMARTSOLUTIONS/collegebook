import { api } from './api';

/**
 * CollegeBook News & Feeds API.
 *
 * The backend returns feeds grouped by category:
 * { provider, updatedAt, categories: [{ category, articles: [] }] }
 *
 * The page works with one flat `items` collection, so the adapter below
 * keeps that API-shape difference in one place.
 */
export const newsFeedService = {
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
