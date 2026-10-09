import { messageService } from './message.service';
import { groupService } from './group.service';
import { notificationService } from './notification.service';
import { newsFeedService } from './newsFeed.service';
import { postService } from './post.service';

export function prefetchRoute(queryClient, route) {
  const jobs = {
    '/home': () => queryClient.prefetchQuery({ queryKey: ['feed'], queryFn: () => postService.getFeed(), staleTime: 30_000 }),
    '/messages': () => queryClient.prefetchQuery({ queryKey: ['conversations'], queryFn: messageService.listConversations, staleTime: 15_000 }),
    '/groups': () => queryClient.prefetchQuery({ queryKey: ['groups'], queryFn: groupService.list, staleTime: 120_000 }),
    '/notifications': () => Promise.all([
      queryClient.prefetchQuery({ queryKey: ['notifications'], queryFn: () => notificationService.list(), staleTime: 15_000 }),
      queryClient.prefetchQuery({ queryKey: ['notifications', 'unread-count'], queryFn: notificationService.unreadCount, staleTime: 15_000 }),
    ]),
    '/news-feeds': () => queryClient.prefetchQuery({ queryKey: ['news-feeds', {}], queryFn: () => newsFeedService.list({}), staleTime: 300_000 }),
  };
  return jobs[route]?.();
}
