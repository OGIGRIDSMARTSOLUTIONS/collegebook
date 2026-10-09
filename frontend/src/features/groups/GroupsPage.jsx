import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '../../components/Button';
import { TextField } from '../../components/TextField';
import { useProfile } from '../../hooks/useProfile';
import {
  useGroups,
  useGroup,
  useGroupMembers,
  useGroupPosts,
  useCreateGroup,
  useCreateGroupPost,
  useGroupMembership,
} from '../../hooks/useGroups';
import { LoadingState } from '../../components/loading/Spinner';

function initials(firstName, lastName) {
  return `${firstName?.[0] ?? ''}${lastName?.[0] ?? ''}`;
}

function CreateGroupForm({ onCreated }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', kind: 'PUBLIC' });
  const createGroup = useCreateGroup();

  function handleSubmit(e) {
    e.preventDefault();
    createGroup.mutate(form, {
      onSuccess: (group) => {
        setForm({ name: '', description: '', kind: 'PUBLIC' });
        setOpen(false);
        onCreated?.(group.id);
      },
    });
  }

  if (!open) {
    return (
      <Button variant="secondary" onClick={() => setOpen(true)}>
        Create a group
      </Button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-border bg-surface p-4 space-y-3">
      <TextField
        label="Name"
        value={form.name}
        onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
        required
      />
      <TextField
        label="Description (optional)"
        value={form.description}
        onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
      />
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-text">Visibility</span>
        <select
          value={form.kind}
          onChange={(e) => setForm((f) => ({ ...f, kind: e.target.value }))}
          className="w-full rounded-md border border-border bg-surface px-3 py-2 text-text"
        >
          <option value="PUBLIC">Public — anyone can find and join</option>
          <option value="PRIVATE">Private — only added members can see it</option>
        </select>
      </label>
      {createGroup.isError && <p className="text-sm text-danger">{createGroup.error.message}</p>}
      <div className="flex gap-2">
        <Button type="submit" disabled={createGroup.isPending}>
          {createGroup.isPending ? 'Creating…' : 'Create'}
        </Button>
        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

function GroupsList({ onSelect }) {
  const groupsQuery = useGroups();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-text">Groups</h1>
        <CreateGroupForm onCreated={onSelect} />
      </div>

      {groupsQuery.isLoading && <LoadingState message="Loading groups…" />}
      {groupsQuery.data?.length === 0 && (
        <p className="text-sm text-text-secondary">No groups yet — be the first to create one.</p>
      )}

      <div className="space-y-2">
        {groupsQuery.data?.map((group) => (
          <button
            key={group.id}
            onClick={() => onSelect(group.id)}
            className="block w-full rounded-lg border border-border bg-surface p-4 text-left transition-colors hover:border-brand"
          >
            <div className="flex items-center gap-2">
              <span className="font-medium text-text">{group.name}</span>
              <span className="rounded-full border border-border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-text-secondary">
                {group.kind}
              </span>
            </div>
            {group.description && <p className="mt-1 text-sm text-text-secondary">{group.description}</p>}
          </button>
        ))}
      </div>
    </div>
  );
}

function GroupPostComposer({ groupId }) {
  const [body, setBody] = useState('');
  const createPost = useCreateGroupPost(groupId);

  function handleSubmit(e) {
    e.preventDefault();
    if (!body.trim()) return;
    createPost.mutate(
      { body },
      { onSuccess: () => setBody('') }
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-border bg-surface p-4">
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Share something with the group…"
        className="w-full resize-none rounded-md border border-border bg-surface p-2 text-text placeholder:text-text-secondary/70 focus:border-brand"
        rows={3}
      />
      <div className="mt-2 flex justify-end">
        <Button type="submit" disabled={createPost.isPending || !body.trim()}>
          {createPost.isPending ? 'Posting…' : 'Post'}
        </Button>
      </div>
      {createPost.isError && <p className="mt-1 text-sm text-danger">{createPost.error.message}</p>}
    </form>
  );
}

function GroupDetail({ groupId, onBack }) {
  const { data: me } = useProfile();
  const groupQuery = useGroup(groupId);
  const membersQuery = useGroupMembers(groupId);
  const postsQuery = useGroupPosts(groupId);
  const { join, leave } = useGroupMembership(groupId);

  const isMember = membersQuery.data?.some((m) => m.id === me?.id);

  if (groupQuery.isError) {
    return (
      <div className="space-y-4">
        <button onClick={onBack} className="text-sm text-text-secondary hover:text-text">
          ← Back to groups
        </button>
        <p className="text-sm text-danger">This group isn't available.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <button onClick={onBack} className="text-sm text-text-secondary hover:text-text">
        ← Back to groups
      </button>

      <div className="rounded-lg border border-border bg-surface p-4">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-lg font-semibold text-text">{groupQuery.data?.name}</h1>
            {groupQuery.data?.description && (
              <p className="mt-1 text-sm text-text-secondary">{groupQuery.data.description}</p>
            )}
          </div>
          {isMember ? (
            <Button variant="secondary" onClick={() => leave.mutate()} disabled={leave.isPending}>
              Leave
            </Button>
          ) : (
            <Button onClick={() => join.mutate()} disabled={join.isPending}>
              Join
            </Button>
          )}
        </div>
        {join.isError && <p className="mt-2 text-sm text-danger">{join.error.message}</p>}

        {membersQuery.data && (
          <div className="mt-4 flex -space-x-2">
            {membersQuery.data.slice(0, 8).map((m) => (
              <span
                key={m.id}
                title={`${m.firstName ?? ''} ${m.lastName ?? ''}`}
                className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-surface bg-brand-soft text-xs font-semibold text-brand"
              >
                {initials(m.firstName, m.lastName)}
              </span>
            ))}
            {membersQuery.data.length > 8 && (
              <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-surface bg-bg text-xs text-text-secondary">
                +{membersQuery.data.length - 8}
              </span>
            )}
          </div>
        )}
      </div>

      {isMember && <GroupPostComposer groupId={groupId} />}

      <div className="space-y-3">
        {postsQuery.data?.length === 0 && (
          <p className="text-sm text-text-secondary">No posts in this group yet.</p>
        )}
        {postsQuery.data?.map((post) => (
          <div key={post.id} className="rounded-lg border border-border bg-surface p-4">
            <p className="text-sm font-medium text-text">
              {post.author?.firstName} {post.author?.lastName}
            </p>
            <p className="mt-1 text-text">{post.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function GroupsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedId = searchParams.get('id');

  function selectGroup(id) {
    setSearchParams(id ? { id } : {});
  }

  return selectedId ? (
    <GroupDetail groupId={selectedId} onBack={() => selectGroup(null)} />
  ) : (
    <GroupsList onSelect={selectGroup} />
  );
}