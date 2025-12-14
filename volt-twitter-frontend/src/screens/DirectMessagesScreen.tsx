import { FormEvent, useEffect, useState } from 'react';
import { fetchConversation, fetchConversations, sendDirectMessage } from '../api/feedApi';
import { ConversationSummary, ConversationThread, DirectMessage, User } from '../types/feed';
import '../styles/DirectMessagesScreen.css';

interface Props {
  onOpenProfile: (user: User) => void;
  initialThreadTarget?: { handle: string; ts: number } | null;
  onThreadViewed?: () => void;
}

const DirectMessagesScreen: React.FC<Props> = ({ onOpenProfile, initialThreadTarget, onThreadViewed }) => {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [conversationError, setConversationError] = useState<string | null>(null);
  const [activeHandle, setActiveHandle] = useState<string | null>(null);
  const [thread, setThread] = useState<ConversationThread | null>(null);
  const [isThreadLoading, setIsThreadLoading] = useState(false);
  const [threadError, setThreadError] = useState<string | null>(null);
  const [messageText, setMessageText] = useState('');
  const [isSending, setIsSending] = useState(false);

  const loadConversations = async () => {
    setIsLoadingConversations(true);
    setConversationError(null);
    try {
      const data = await fetchConversations();
      setConversations(data);
    } catch (error) {
      setConversationError((error as Error).message);
    } finally {
      setIsLoadingConversations(false);
    }
  };

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (initialThreadTarget) {
      void openConversation(initialThreadTarget.handle);
      onThreadViewed?.();
    }
  }, [initialThreadTarget?.ts]);

  const openConversation = async (handle: string) => {
    if (handle === activeHandle && thread) {
      return;
    }

    setActiveHandle(handle);
    setThread(null);
    setThreadError(null);
    setIsThreadLoading(true);

    try {
      const data = await fetchConversation(handle);
      setThread(data);
      setMessageText('');
      void loadConversations();
    } catch (error) {
      setThreadError((error as Error).message);
    } finally {
      setIsThreadLoading(false);
    }
  };

  const handleSendMessage = async (event: FormEvent) => {
    event.preventDefault();
    if (!messageText.trim() || !activeHandle) {
      return;
    }

    setIsSending(true);
    setThreadError(null);
    try {
      const message = await sendDirectMessage(activeHandle, messageText);
      setThread((prev) =>
        prev
          ? {
              ...prev,
              messages: [...prev.messages, message],
            }
          : prev,
      );
      setMessageText('');
      void loadConversations();
    } catch (error) {
      setThreadError((error as Error).message);
    } finally {
      setIsSending(false);
    }
  };

  const renderMessage = (message: DirectMessage) => (
    <div
      key={message.id}
      className={
        message.isMine ? 'dm-screen__message dm-screen__message--outgoing' : 'dm-screen__message dm-screen__message--incoming'
      }
    >
      <p>{message.content}</p>
      <span>{new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
    </div>
  );

  return (
    <section className="dm-screen">
      <div className="dm-screen__sidebar">
        <header>
          <h2>Messages</h2>
          <button type="button" onClick={() => loadConversations()} disabled={isLoadingConversations}>
            Refresh
          </button>
        </header>
        {isLoadingConversations && <p className="dm-screen__status">Loading conversations...</p>}
        {conversationError && <p className="dm-screen__status dm-screen__status--error">{conversationError}</p>}
        {!isLoadingConversations && !conversationError && conversations.length === 0 && (
          <p className="dm-screen__status">No conversations yet.</p>
        )}
        <ul>
          {conversations.map((conversation) => (
            <li key={conversation.user.id}>
              <button
                type="button"
                className={
                  activeHandle === conversation.user.handle
                    ? 'dm-screen__conversation dm-screen__conversation--active'
                    : 'dm-screen__conversation'
                }
                onClick={() => openConversation(conversation.user.handle)}
              >
                <div>
                  <span className="dm-screen__conversation-name">{conversation.user.displayName}</span>
                  <span className="dm-screen__conversation-handle">@{conversation.user.handle}</span>
                </div>
                <p className="dm-screen__conversation-preview">{conversation.lastMessage.content}</p>
                {conversation.unreadCount > 0 && <span className="dm-screen__conversation-badge">{conversation.unreadCount}</span>}
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="dm-screen__thread">
        {!activeHandle && <p className="dm-screen__status">Select a conversation to start messaging.</p>}
        {activeHandle && isThreadLoading && <p className="dm-screen__status">Loading thread...</p>}
        {activeHandle && threadError && <p className="dm-screen__status dm-screen__status--error">{threadError}</p>}
        {thread && !isThreadLoading && (
          <>
            <header className="dm-screen__thread-header">
              <button
                type="button"
                className="dm-screen__thread-avatar"
                onClick={() => onOpenProfile(thread.user)}
                aria-label={`View @${thread.user.handle}`}
              >
                <img src={thread.user.avatar} alt={thread.user.displayName} />
              </button>
              <div>
                <h3>{thread.user.displayName}</h3>
                <p>@{thread.user.handle}</p>
              </div>
            </header>

            <div className="dm-screen__messages">
              {thread.messages.length === 0 && <p className="dm-screen__status">No messages yet.</p>}
              {thread.messages.map(renderMessage)}
            </div>

            <form className="dm-screen__composer" onSubmit={handleSendMessage}>
              <textarea
                placeholder={`Message @${thread.user.handle}`}
                value={messageText}
                onChange={(event) => setMessageText(event.target.value)}
                rows={3}
              />
              <button type="submit" disabled={isSending}>
                {isSending ? 'Sending...' : 'Send'}
              </button>
            </form>
          </>
        )}
      </div>
    </section>
  );
};

export default DirectMessagesScreen;
