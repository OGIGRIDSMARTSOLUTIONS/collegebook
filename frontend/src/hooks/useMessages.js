import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { messageService } from '../services/message.service';
import { getSocket } from '../services/socket';

export function useConversations() {
  return useQuery({ queryKey: ['conversations'], queryFn: messageService.listConversations, staleTime: 15_000 });
}

export function useMessages(conversationId) {
  return useQuery({
    queryKey: ['messages', conversationId],
    queryFn: () => messageService.getMessages(conversationId),
    enabled: !!conversationId,
    staleTime: 60_000,
  });
}

export function useStartConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: messageService.startConversation,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['conversations'] }),
  });
}

export function useSendMessage(conversationId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => messageService.sendMessage(conversationId, payload),
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: ['messages', conversationId] });
      const previous = queryClient.getQueryData(['messages', conversationId]);
      const optimistic = {
        id: `optimistic-${Date.now()}`,
        conversationId,
        body: payload.body || null,
        attachmentUrl: payload.attachmentUrl || null,
        createdAt: new Date().toISOString(),
        optimistic: true,
      };
      queryClient.setQueryData(['messages', conversationId], (current) => {
        if (!current?.items) return current;
        return { ...current, items: [...current.items, optimistic] };
      });
      return { previous, optimisticId: optimistic.id };
    },
    onError: (_error, _payload, context) => {
      if (context?.previous) queryClient.setQueryData(['messages', conversationId], context.previous);
    },
    onSuccess: (message, _payload, context) => {
      queryClient.setQueryData(['messages', conversationId], (current) => {
        if (!current?.items) return current;
        const withoutOptimistic = current.items.filter((item) => item.id !== context?.optimisticId && item.id !== message.id);
        return { ...current, items: [...withoutOptimistic, message] };
      });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

export function useMarkRead(conversationId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => messageService.markRead(conversationId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['conversations'] }),
  });
}

/**
 * useConversationSocket — joins the conversation's room (server-side
 * verified via assertParticipant, see backend/src/websocket/socket.js) and
 * merges incoming messages straight into the React Query cache rather than
 * waiting for a refetch, so a reply appears the instant it arrives.
 */
export function useConversationSocket(conversationId, currentStudentId) {
  const queryClient = useQueryClient();
  const [typingStudentId, setTypingStudentId] = useState(null);

  useEffect(() => {
    if (!conversationId) return undefined;
    const socket = getSocket();

    socket.emit('conversation:join', conversationId, (res) => {
      if (!res?.ok) {
        // eslint-disable-next-line no-console
        console.warn('Could not join conversation room:', res?.error);
      }
    });

    function handleMessage(message) {
      if (message.conversationId !== conversationId) return;

      const result = queryClient.setQueryData(['messages', conversationId], (old) => {
        if (!old) return old; // initial GET hasn't resolved yet — see invalidate below
        if (old.items.some((m) => m.id === message.id)) return old;
        return { ...old, items: [...old.items, message] };
      });

      // If the cache wasn't populated yet (a real race: the initial GET and
      // the socket 'conversation:join' both fire on mount, and a message
      // can arrive before that GET resolves), the optimistic append above
      // is a no-op and the message would otherwise be silently lost until
      // some unrelated refetch happened to occur. Explicitly invalidating
      // here guarantees it's picked up — the backend always persists the
      // message to the database BEFORE emitting this event, so any
      // subsequent fetch is guaranteed to include it.
      if (result === undefined) {
        queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
      }

      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    }

    function handleTypingStart({ studentId }) {
      if (studentId !== currentStudentId) setTypingStudentId(studentId);
    }
    function handleTypingStop({ studentId }) {
      setTypingStudentId((current) => (current === studentId ? null : current));
    }

    socket.on('message:received', handleMessage);
    socket.on('typing:start', handleTypingStart);
    socket.on('typing:stop', handleTypingStop);

    return () => {
      socket.off('message:received', handleMessage);
      socket.off('typing:start', handleTypingStart);
      socket.off('typing:stop', handleTypingStop);
    };
  }, [conversationId, currentStudentId, queryClient]);

  return {
    typingStudentId,
    emitTypingStart: () => getSocket().emit('typing:start', { conversationId }),
    emitTypingStop: () => getSocket().emit('typing:stop', { conversationId }),
  };
}
