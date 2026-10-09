import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationService } from '../services/notification.service';

export function useNotifications() {
  return useQuery({ queryKey: ['notifications'], queryFn: () => notificationService.list(), staleTime: 15_000 });
}

// Polled rather than socket-pushed: the backend doesn't currently emit a
// real-time event when a notification is created (only broadcasts and
// messages do). A 30s interval is cheap and matches how the bell is
// normally glanced at, not watched continuously — worth wiring to a
// socket event later if that changes.
export function useUnreadCount() {
  return useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: notificationService.unreadCount,
    staleTime: 15_000,
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
  });
}

export function useNotificationActions() {
  const queryClient = useQueryClient();
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
  };

  const markRead = useMutation({ mutationFn: notificationService.markRead, onSuccess: invalidate });
  const markAllRead = useMutation({ mutationFn: notificationService.markAllRead, onSuccess: invalidate });

  return { markRead, markAllRead };
}
