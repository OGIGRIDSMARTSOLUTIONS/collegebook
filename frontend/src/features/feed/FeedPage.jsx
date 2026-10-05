import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { postService } from '../../services/post.service';
import { getSocket } from '../../services/socket';
import { Button } from '../../components/Button';
import { CommentSection } from './CommentSection';
import { useToggleSavedPost } from '../../hooks/useSavedPosts';
import { ImageDropzone } from '../../components/ImageDropzone';
import { useSubmitReport } from '../../hooks/useReports';
import { useYearbooks } from '../../hooks/useYearbook';
import { LoadingState } from '../../components/loading/Spinner';

const VISIBILITY_OPTIONS = [
  { value: 'INSTITUTION', label: 'My institution' },
  { value: 'SET', label: 'My set' },
  { value: 'CONNECTIONS', label: 'Connections' },
  { value: 'PUBLIC', label: 'Public' },
];

function PhotoIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" {...props}>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="8.5" cy="9.5" r="1.5" />
      <path d="M21 15l-5-5-9 9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}


function YearbookSpotlight() {
  const { data: yearbooks, isLoading } = useYearbooks();
  const latest = yearbooks?.[0];

  if (isLoading || !latest) return null;

  return (
    <Link
      to="/yearbook"
      className="group block overflow-hidden rounded-2xl border border-[#d9c7a9] bg-[#f8f2e8] shadow-[0_8px_28px_rgba(75,55,25,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_34px_rgba(75,55,25,0.1)]"
    >
      <div className="flex items-center gap-4 p-4 sm:p-5">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-yearbook shadow-sm">
          <BookIcon />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-yearbook">Your institution’s archive</p>
          <p className="mt-0.5 truncate text-base font-bold text-yearbook-ink">
            Class of {latest.year} YearBook
          </p>
          <p className="mt-0.5 text-xs text-[#76664d]">Open the official digital record of your graduating class.</p>
        </div>
        <span className="hidden shrink-0 rounded-full bg-yearbook px-3 py-2 text-xs font-bold text-white sm:inline-flex">
          Explore
        </span>
      </div>
    </Link>
  );
}

function BookIcon() {
  return (
    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5v-16Z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 19a2.5 2.5 0 0 1 2.5-2.5H20" strokeLinecap="round" />
    </svg>
  );
}

export default function FeedPage() {
  const queryClient = useQueryClient();
  const feedQuery = useQuery({ queryKey: ['feed'], queryFn: () => postService.getFeed() });

  // Live updates: the backend emits a lightweight 'feed:new-post' nudge
  // (postId only, no content — see post.controller.js's
  // notifyFeedSubscribers) whenever a post is created that this student
  // could plausibly see. We never trust the socket payload as data; we
  // just use it as a signal to refetch through the real, permission-
  // checked GET /posts/feed endpoint, so a post can never be shown here
  // that the backend wouldn't have included in a normal fetch anyway.
  useEffect(() => {
    const socket = getSocket();
    function handleNewPost() {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    }
    socket.on('feed:new-post', handleNewPost);
    return () => socket.off('feed:new-post', handleNewPost);
  }, [queryClient]);

  const [body, setBody] = useState('');
  const [images, setImages] = useState([]);
  const [showImageAdd, setShowImageAdd] = useState(false);
  const [visibility, setVisibility] = useState('INSTITUTION');

  const createPost = useMutation({
    mutationFn: postService.create,
    onSuccess: () => {
      setBody('');
      setImages([]);
      setShowImageAdd(false);
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
  });

  function handleSubmit(e) {
    e.preventDefault();
    if (!body.trim() && images.length === 0) return;
    createPost.mutate({
      body: body.trim() || undefined,
      images: images.length ? images : undefined,
      visibility,
    });
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <YearbookSpotlight />
      <div className="flex justify-end">
        <Link to="/saved" className="text-sm text-text-secondary hover:text-text">
          Saved posts
        </Link>
      </div>
      <form onSubmit={handleSubmit} className="rounded-lg border border-border bg-surface p-4">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="What's on your mind?"
          rows={3}
          className="w-full resize-none border-0 bg-transparent text-text placeholder:text-text-secondary focus:outline-none"
        />

        {images.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {images.map((url, i) => (
              <div key={url} className="relative h-16 w-16 overflow-hidden rounded-md border border-border">
                <img src={url} alt="" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => setImages((imgs) => imgs.filter((_, idx) => idx !== i))}
                  className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-surface/90 text-xs text-text-secondary hover:text-danger"
                  aria-label="Remove image"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        {showImageAdd && images.length < 10 && (
          <div className="mt-2">
            <ImageDropzone
              purpose="post"
              onUploaded={(url) => {
                setImages((imgs) => [...imgs, url]);
                setShowImageAdd(false);
              }}
              className="h-20 w-20"
            />
          </div>
        )}

        <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowImageAdd((v) => !v)}
              className="rounded-md p-1.5 text-text-secondary hover:bg-bg hover:text-brand"
              title="Add a photo"
            >
              <PhotoIcon className="h-5 w-5" />
            </button>
            <select
              value={visibility}
              onChange={(e) => setVisibility(e.target.value)}
              className="rounded-md border border-border bg-surface px-2 py-1 text-sm text-text-secondary"
            >
              {VISIBILITY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <Button type="submit" disabled={(!body.trim() && images.length === 0) || createPost.isPending}>
            {createPost.isPending ? 'Posting…' : 'Post'}
          </Button>
        </div>
      </form>

      {feedQuery.isLoading && <LoadingState message="Loading your feed…" />}
      {feedQuery.isError && <p className="text-danger">Couldn't load the feed.</p>}

      {feedQuery.data?.items?.length === 0 && (
        <div className="rounded-lg border border-border bg-surface p-8 text-center text-text-secondary">
          No posts yet — be the first to share something with your institution.
        </div>
      )}

      <div className="space-y-4">
        {feedQuery.data?.items?.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    </div>
  );
}

function ReportForm({ postId, onDone }) {
  const [reason, setReason] = useState('');
  const submitReport = useSubmitReport();

  function handleSubmit(e) {
    e.preventDefault();
    if (!reason.trim()) return;
    submitReport.mutate(
      { targetType: 'POST', postId, reason },
      { onSuccess: onDone }
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-2 space-y-2 rounded-md border border-border bg-bg p-3">
      <textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Why are you reporting this post?"
        className="w-full resize-none rounded-md border border-border bg-surface p-2 text-sm text-text placeholder:text-text-secondary/70"
        rows={2}
        autoFocus
      />
      {submitReport.isError && <p className="text-sm text-danger">{submitReport.error.message}</p>}
      {submitReport.isSuccess ? (
        <p className="text-sm text-success">Reported — thanks, an admin will review it.</p>
      ) : (
        <div className="flex gap-2">
          <Button type="submit" variant="secondary" disabled={submitReport.isPending || !reason.trim()}>
            {submitReport.isPending ? 'Sending…' : 'Submit report'}
          </Button>
          <Button type="button" variant="ghost" onClick={onDone}>
            Cancel
          </Button>
        </div>
      )}
    </form>
  );
}

function PostMenu({ postId }) {
  const [open, setOpen] = useState(false);
  const [reporting, setReporting] = useState(false);
  const { save } = useToggleSavedPost();

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="rounded px-1.5 text-text-secondary hover:bg-bg hover:text-text"
        aria-label="Post options"
      >
        ···
      </button>
      {open && (
        <div className="absolute right-0 z-10 mt-1 w-36 overflow-hidden rounded-md border border-border bg-surface shadow-sm">
          <button
            onClick={() => {
              save.mutate(postId);
              setOpen(false);
            }}
            className="block w-full px-3 py-2 text-left text-sm text-text hover:bg-bg"
          >
            {save.isSuccess ? 'Saved ✓' : 'Save post'}
          </button>
          <button
            onClick={() => {
              setReporting(true);
              setOpen(false);
            }}
            className="block w-full px-3 py-2 text-left text-sm text-danger hover:bg-bg"
          >
            Report
          </button>
        </div>
      )}
      {reporting && <ReportForm postId={postId} onDone={() => setReporting(false)} />}
    </div>
  );
}

export function PostCard({ post }) {
  const queryClient = useQueryClient();
  const [showComments, setShowComments] = useState(false);
  const react = useMutation({
    mutationFn: () => postService.react(post.id, 'LIKE'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['feed'] }),
  });

  return (
    <article className="rounded-lg border border-border bg-surface p-4">
      <div className="flex items-start justify-between">
        <Link to={`/profile/${post.author?.id}`} className="flex items-center gap-3 hover:opacity-80">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-soft text-sm font-semibold text-brand">
            {post.author?.firstName?.[0]}
            {post.author?.lastName?.[0]}
          </span>
          <div>
            <p className="text-sm font-medium text-text">
              {post.author?.firstName} {post.author?.lastName}
            </p>
            <p className="text-xs text-text-secondary">
              {post.author?.academicSet?.name} · {post.author?.institution?.name}
            </p>
          </div>
        </Link>
        <PostMenu postId={post.id} />
      </div>
      {post.body && <p className="mt-3 whitespace-pre-wrap text-text">{post.body}</p>}
      {post.images?.length > 0 && (
        <div className={`mt-3 grid gap-1 ${post.images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
          {post.images.map((url) => (
            <img key={url} src={url} alt="" className="max-h-96 w-full rounded-md object-cover" />
          ))}
        </div>
      )}
      <div className="mt-3 flex items-center gap-4 border-t border-border pt-3 text-sm text-text-secondary">
        <button onClick={() => react.mutate()} className="hover:text-brand">
          Like
        </button>
        <button onClick={() => setShowComments((s) => !s)} className="hover:text-brand">
          Comment
        </button>
      </div>
      {showComments && <CommentSection postId={post.id} />}
    </article>
  );
}