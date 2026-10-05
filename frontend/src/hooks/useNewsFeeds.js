import { useQuery } from '@tanstack/react-query';
import { newsFeedService } from '../services/newsFeed.service';

export function useNewsFeeds(params = {}) {
  return useQuery({
    queryKey: ['news-feeds', params],
    queryFn: () => newsFeedService.list(params),
    staleTime: 5 * 60 * 1000,
    refetchInterval: 15 * 60 * 1000,
    refetchIntervalInBackground: true,
    retry: 1,
  });
}
