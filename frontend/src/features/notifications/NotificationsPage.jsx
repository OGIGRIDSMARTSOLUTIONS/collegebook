import { useNavigate } from 'react-router-dom';
import { useNotifications, useNotificationActions } from '../../hooks/useNotifications';
import { Button } from '../../components/Button';
import { LoadingState } from '../../components/loading/Spinner';

function formatTime(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// Only MESSAGE, MENTION, and INSTITUTION_BROADCAST are actually created
// anywhere in the backend today (see post.service.js/message.service.js/
// broadcast.service.js) — the schema's other NotificationType values
// (CONNECTION, COMMENT, LIKE, SHARE, YEARBOOK, SYSTEM) are defined for
// future use but never triggered yet. describe() below handles those
// gracefully with a generic fallback rather than assuming every enum
// value has a real, tested payload shape to read from.
function describe(notification) {
  const { type, payload } = notification;
  if (type === 'MESSAGE') return 'You have a new message';
  if (type === 'MENTION') return 'You were mentioned in a post';
  if (type === 'INSTITUTION_BROADCAST') return payload?.title ? `Announcement: ${payload.title}` : 'New institution announcement';
  return 'New notification';
}

function targetPath(notification) {
  if (notification.type === 'MESSAGE' && notification.payload?.conversationId) {
    return `/messages?conversation=${notification.payload.conversationId}`;
  }
  if (notification.type === 'MENTION' && notification.payload?.postId) {
    return '/'; // the post itself isn't individually routable yet — lands on the feed
  }
  if (notification.type === 'INSTITUTION_BROADCAST' && notification.payload?.broadcastId) {
    return `/institution-news?broadcast=${encodeURIComponent(notification.payload.broadcastId)}`;
  }
  return null;
}

export default function NotificationsPage() {
  const notificationsQuery = useNotifications();
  const { markRead, markAllRead } = useNotificationActions();
  const navigate = useNavigate();

  function handleClick(notification) {
    if (!notification.readAt) markRead.mutate(notification.id);
    const path = targetPath(notification);
    if (path) navigate(path);
  }

  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-text">Notifications</h1>
        <Button variant="ghost" onClick={() => markAllRead.mutate()} disabled={markAllRead.isPending}>
          Mark all as read
        </Button>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-surface">
        {notificationsQuery.isLoading && <LoadingState message="Loading notifications…" compact />}

        {notificationsQuery.data?.items?.length === 0 && (
          <p className="p-4 text-sm text-text-secondary">You're all caught up.</p>
        )}

        <div className="divide-y divide-border">
          {notificationsQuery.data?.items?.map((notification) => (
            <button
              key={notification.id}
              onClick={() => handleClick(notification)}
              className={`flex w-full items-start justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-bg ${
                !notification.readAt ? 'bg-brand-soft/40' : ''
              }`}
            >
              <div>
                <p className="text-sm text-text">{describe(notification)}</p>
                <p className="mt-0.5 text-xs text-text-secondary">{formatTime(notification.createdAt)}</p>
              </div>
              {!notification.readAt && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-brand" />}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}