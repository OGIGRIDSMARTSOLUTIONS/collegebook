import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useProfile } from "../../hooks/useProfile";
import {
  useConversations,
  useMessages,
  useStartConversation,
  useSendMessage,
  useMarkRead,
  useConversationSocket,
} from "../../hooks/useMessages";
import { Button } from "../../components/Button";
import { FloatingAvatars } from "./FloatingAvatars";
import { LoadingState } from '../../components/loading/Spinner';
import { studentService } from "../../services/student.service";
import { useQuery } from "@tanstack/react-query";

function BackIcon(props) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      {...props}
    >
      <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MessageIcon(props) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      {...props}
    >
      <path
        d="M5 5.5h14A2.5 2.5 0 0 1 21.5 8v7A2.5 2.5 0 0 1 19 17.5H10l-5 3v-3.1A2.5 2.5 0 0 1 2.5 15V8A2.5 2.5 0 0 1 5 5.5Z"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function initials(firstName, lastName) {
  return `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`;
}

function formatTime(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function mentionHandle(student) {
  return student?.user?.username ? `@${student.user.username}` : null;
}

function MessageBody({ message }) {
  const navigate = useNavigate();
  const mentions = [...(message.mentions ?? [])].sort((a, b) => a.startOffset - b.startOffset);
  if (!message.body || !mentions.length) return <p className="whitespace-pre-wrap">{message.body}</p>;

  const parts = [];
  let cursor = 0;
  mentions.forEach((mention, index) => {
    if (mention.startOffset < cursor || mention.endOffset > message.body.length) return;
    if (mention.startOffset > cursor) parts.push(<span key={`text-${index}`}>{message.body.slice(cursor, mention.startOffset)}</span>);
    parts.push(
      <button
        key={`mention-${index}`}
        type="button"
        onClick={() => navigate(`/profile/${mention.studentId}`)}
        className="font-semibold underline decoration-current/40 underline-offset-2 hover:opacity-80"
      >
        {message.body.slice(mention.startOffset, mention.endOffset)}
      </button>,
    );
    cursor = mention.endOffset;
  });
  if (cursor < message.body.length) parts.push(<span key="tail">{message.body.slice(cursor)}</span>);
  return <p className="whitespace-pre-wrap">{parts}</p>;
}

function MentionComposer({ value, onChange, onSelectMention, disabled }) {
  const textareaRef = useRef(null);
  const [mentionState, setMentionState] = useState(null);
  const query = mentionState?.query ?? "";
  const suggestionsQuery = useQuery({
    queryKey: ["message-mention-search", query],
    queryFn: () => studentService.search({ q: query, page: 1, pageSize: 20 }),
    enabled: !!mentionState,
    staleTime: 15000,
  });

  function inspectMention(text, cursor) {
    const before = text.slice(0, cursor);
    const match = before.match(/(^|\s)@([a-zA-Z0-9._-]*)$/);
    if (!match) return setMentionState(null);
    const tokenStart = cursor - match[2].length - 1;
    setMentionState({ start: tokenStart, query: match[2] });
  }

  function handleChange(e) {
    onChange(e);
    inspectMention(e.target.value, e.target.selectionStart ?? e.target.value.length);
  }

  function choose(student) {
    const textarea = textareaRef.current;
    const start = mentionState.start;
    const cursor = textarea?.selectionStart ?? value.length;
    const token = mentionHandle(student);
    const next = `${value.slice(0, start)}${token} ${value.slice(cursor)}`;
    onChange({ target: { value: next } });
    onSelectMention({ studentId: student.id, token });
    setMentionState(null);
    requestAnimationFrame(() => {
      if (!textarea) return;
      const nextCursor = start + token.length + 1;
      textarea.focus();
      textarea.setSelectionRange(nextCursor, nextCursor);
    });
  }

  const suggestions = (suggestionsQuery.data?.items ?? []).filter((student) => {
    const handle = mentionHandle(student);
    return !query || handle.slice(1).includes(query.toLowerCase());
  }).slice(0, 6);

  return (
    <div className="relative min-w-0 flex-1">
      {mentionState && suggestions.length > 0 && (
        <div className="absolute bottom-full left-0 right-0 z-30 mb-2 max-h-64 overflow-y-auto rounded-2xl border border-border bg-surface p-1.5 shadow-xl">
          {suggestions.map((student) => (
            <button
              key={student.id}
              type="button"
              disabled={disabled}
              onMouseDown={(e) => { e.preventDefault(); choose(student); }}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-bg"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-soft text-xs font-semibold text-brand">
                {initials(student.firstName, student.lastName)}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium text-text">{student.firstName} {student.lastName}</span>
                <span className="block truncate text-xs text-text-secondary">{mentionHandle(student)}</span>
              </span>
            </button>
          ))}
        </div>
      )}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={(e) => {
          if (e.key === "Escape") setMentionState(null);
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            e.currentTarget.form?.requestSubmit();
          }
        }}
        rows={1}
        placeholder="Type a message… Use @ to mention someone"
        disabled={disabled}
        className="max-h-28 min-h-10 w-full resize-none rounded-2xl border border-border bg-bg px-4 py-2.5 text-sm leading-5 text-text placeholder:text-text-secondary focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/10"
        aria-label="Message"
      />
    </div>
  );
}

function ConversationList({ activeId, onSelect }) {
  const conversationsQuery = useConversations();

  if (conversationsQuery.isLoading) {
    return (
      <LoadingState message="Loading conversations…" compact />
    );
  }

  if (!conversationsQuery.data?.length) {
    return (
      <p className="p-4 text-sm text-text-secondary">
        No conversations yet — start one from a connection's profile in Network.
      </p>
    );
  }

  return (
    <div className="divide-y divide-border">
      {conversationsQuery.data.map((conversation) => {
        const other = conversation.participants[0];
        if (!other) return null;
        const isActive = conversation.conversationId === activeId;
        return (
          <button
            key={conversation.conversationId}
            onClick={() => onSelect(conversation.conversationId)}
            className={`flex w-full items-center gap-3 px-3.5 py-3.5 text-left transition-colors sm:px-4 ${
              isActive ? "bg-brand-soft" : "hover:bg-bg"
            }`}
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-soft text-sm font-semibold text-brand">
              {initials(other.firstName, other.lastName)}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <p className="truncate text-sm font-medium text-text">
                  {other.firstName} {other.lastName}
                </p>
                {conversation.unreadCount > 0 && (
                  <span className="ml-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1 text-xs font-semibold text-white">
                    {conversation.unreadCount}
                  </span>
                )}
              </div>
              <p className="truncate text-xs text-text-secondary">
                {conversation.lastMessage?.body ?? "Say hello…"}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}

function ConversationThread({
  conversationId,
  currentStudentId,
  otherParticipant,
  onBack,
}) {
  const messagesQuery = useMessages(conversationId);
  const sendMessage = useSendMessage(conversationId);
  const markRead = useMarkRead(conversationId);
  const { typingStudentId, emitTypingStart, emitTypingStop } =
    useConversationSocket(conversationId, currentStudentId);
  const [body, setBody] = useState("");
  const [mentionTokens, setMentionTokens] = useState([]);
  const bottomRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    if (conversationId) markRead.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messagesQuery.data?.items?.length]);

  function handleChange(e) {
    setBody(e.target.value);
    emitTypingStart();
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(emitTypingStop, 1500);
  }

  function handleSelectMention({ studentId, token }) {
    setMentionTokens((current) => [...current.filter((item) => item.token !== token), { studentId, token }]);
  }

  function handleSubmit(e) {
    e.preventDefault();
    const trimmed = body.trim();
    if (!trimmed) return;
    const mentions = [];
    let searchFrom = 0;
    for (const mention of mentionTokens) {
      const startOffset = trimmed.toLowerCase().indexOf(mention.token.toLowerCase(), searchFrom);
      if (startOffset >= 0) {
        mentions.push({ studentId: mention.studentId, startOffset, endOffset: startOffset + mention.token.length });
        searchFrom = startOffset + mention.token.length;
      }
    }
    sendMessage.mutate({ body: trimmed, mentions });
    setBody("");
    setMentionTokens([]);
    emitTypingStop();
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-surface">
      <div className="flex shrink-0 items-center gap-3 border-b border-border px-3 py-3 sm:px-4">
        <button
          type="button"
          onClick={onBack}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-text-secondary hover:bg-bg hover:text-text md:hidden"
          aria-label="Back to conversations"
        >
          <BackIcon className="h-5 w-5" />
        </button>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-soft text-sm font-semibold text-brand">
          {otherParticipant ? (
            initials(otherParticipant.firstName, otherParticipant.lastName)
          ) : (
            <MessageIcon className="h-4 w-4" />
          )}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-text">
            {otherParticipant
              ? `${otherParticipant.firstName} ${otherParticipant.lastName}`
              : "Conversation"}
          </p>
          <p className="text-xs text-text-secondary">Private message</p>
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain p-3 sm:p-4">
        {messagesQuery.isLoading && (
          <LoadingState message="Loading messages…" />
        )}
        {messagesQuery.data?.items?.map((message) => {
          const isMine = message.senderId === currentStudentId;
          return (
            <div
              key={message.id}
              className={`flex ${isMine ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] wrap-break-word rounded-2xl px-3 py-2 text-sm sm:max-w-[70%] ${
                  isMine ? "bg-brand text-white" : "bg-bg text-text"
                }`}
              >
                <MessageBody message={message} />
                <p
                  className={`mt-1 text-xs ${isMine ? "text-white/70" : "text-text-secondary"}`}
                >
                  {formatTime(message.createdAt)}
                </p>
              </div>
            </div>
          );
        })}
        {typingStudentId && (
          <p className="text-xs italic text-text-secondary">Typing…</p>
        )}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex shrink-0 items-end gap-2 border-t border-border bg-surface p-2.5 sm:p-3"
      >
        <MentionComposer
          value={body}
          onChange={handleChange}
          onSelectMention={handleSelectMention}
          disabled={sendMessage.isPending}
        />
        <Button
          type="submit"
          disabled={!body.trim() || sendMessage.isPending}
          className="shrink-0"
        >
          <span className="hidden sm:inline">Send</span>
          <span className="sm:hidden">↑</span>
        </Button>
      </form>
    </div>
  );
}

export default function MessagesPage() {
  const { data: profile } = useProfile();
  const conversationsQuery = useConversations();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeId, setActiveId] = useState(null);
  const startConversation = useStartConversation();
  const startedRef = useRef(false);

  // Deep-link support:
  //  - Network's "Message" button -> /messages?with=<studentId>, which
  //    starts (or reuses, per the backend's idempotent
  //    findFirst-then-create) a private conversation.
  //  - MESSAGE notifications carry a conversationId directly ->
  //    /messages?conversation=<id>, opened straight away with no extra
  //    request needed since we already have the id.
  useEffect(() => {
    const conversationId = searchParams.get("conversation");
    if (conversationId && !startedRef.current) {
      startedRef.current = true;
      setActiveId(conversationId);
      searchParams.delete("conversation");
      setSearchParams(searchParams, { replace: true });
      return;
    }

    const withId = searchParams.get("with");
    if (!withId || startedRef.current) return;
    startedRef.current = true;
    startConversation.mutate(withId, {
      onSuccess: (conversation) => {
        setActiveId(conversation.id);
        searchParams.delete("with");
        setSearchParams(searchParams, { replace: true });
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  return (
    <>
      <FloatingAvatars conversations={conversationsQuery.data} side="left" />
      <FloatingAvatars conversations={conversationsQuery.data} side="right" />

      <section className="mx-auto w-full max-w-6xl overflow-hidden rounded-2xl border border-border bg-surface shadow-[0_8px_30px_rgba(20,40,45,0.05)] md:h-[calc(100dvh-8rem)]">
        <div className="grid h-[calc(100dvh-9rem)] min-h-115 grid-cols-1 md:h-full md:grid-cols-[280px_minmax(0,1fr)]">
          <div
            className={`${activeId ? "hidden md:block" : "block"} min-w-0 overflow-y-auto border-border md:border-r`}
          >
            <div className="sticky top-0 z-10 border-b border-border bg-surface px-4 py-3">
              <h1 className="text-base font-semibold text-text">Messages</h1>
              <p className="mt-0.5 text-xs text-text-secondary">
                Your private conversations
              </p>
            </div>
            <ConversationList activeId={activeId} onSelect={setActiveId} />
          </div>

          <div
            className={`${activeId ? "block" : "hidden md:block"} min-w-0 min-h-0`}
          >
            {activeId ? (
              <ConversationThread
                conversationId={activeId}
                currentStudentId={profile?.id}
                otherParticipant={
                  conversationsQuery.data?.find(
                    (conversation) => conversation.conversationId === activeId,
                  )?.participants?.[0]
                }
                onBack={() => setActiveId(null)}
              />
            ) : (
              <div className="flex h-full min-h-115 flex-col items-center justify-center px-6 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-soft text-brand">
                  <MessageIcon className="h-7 w-7" />
                </div>
                <h2 className="mt-4 text-base font-semibold text-text">
                  Select a conversation
                </h2>
                <p className="mt-1 max-w-xs text-sm leading-6 text-text-secondary">
                  Choose someone from your conversations to start chatting.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}