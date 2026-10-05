import { Link } from 'react-router-dom';
import { useSavedPosts } from '../../hooks/useSavedPosts';
import { PostCard } from '../feed/FeedPage';
import { LoadingState } from '../../components/loading/Spinner';

export default function SavedPostsPage() {
  const savedQuery = useSavedPosts();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-text">Saved posts</h1>
        <Link to="/" className="text-sm text-text-secondary hover:text-text">
          ← Back to feed
        </Link>
      </div>

      {savedQuery.isLoading && <LoadingState message="Loading saved posts…" />}

      {savedQuery.data?.length === 0 && (
        <p className="text-sm text-text-secondary">
          Nothing saved yet — use the ··· menu on any post to save it for later.
        </p>
      )}

      {savedQuery.data?.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
}