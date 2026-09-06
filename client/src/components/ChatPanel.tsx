import { useState, useRef, useEffect } from 'react';
import type { ChatMessage } from '@shared/types';
import { sendChat, onChatUpdate } from '../api';

interface Props {
  messages: ChatMessage[];
  canSend: boolean;
  myPlayerId: string;
  roomCode: string;
}

export function ChatPanel({ messages, canSend, myPlayerId, roomCode }: Props) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [localMessages, setLocalMessages] = useState<ChatMessage[]>(messages);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLocalMessages(messages);
  }, [messages]);

  useEffect(() => {
    const unsub = onChatUpdate(setLocalMessages);
    return unsub;
  }, []);

  useEffect(() => {
    if (open && listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [localMessages, open]);

  const handleSend = () => {
    const text = draft.trim();
    if (!text || !canSend) return;

    const optimistic: ChatMessage = {
      id: `pending-${Date.now()}`,
      playerId: myPlayerId,
      playerName: 'You',
      text,
      timestamp: Date.now(),
    };
    setLocalMessages((prev) => [...prev, optimistic]);
    sendChat(text, myPlayerId, roomCode);
    setDraft('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="chat-layer">
      <div className={`chat-drawer ${open ? 'open' : ''}`}>
        {!open && (
          <button
            type="button"
            className="chat-tab"
            onClick={() => setOpen(true)}
            aria-expanded={open}
          >
            Chat
          </button>
        )}

        <aside className="chat-panel" aria-hidden={!open}>
          <div className="chat-panel-header">
            <span>In Group Chat</span>
            <button type="button" className="chat-close" onClick={() => setOpen(false)} aria-label="Close chat">
              ×
            </button>
          </div>

          <div className="chat-messages" ref={listRef}>
            {localMessages.length === 0 ? (
              <p className="chat-empty">
                {canSend
                  ? 'Coordinate with your In Group here. Out Groups can see this chat.'
                  : 'Listen in on the In Group conversation…'}
              </p>
            ) : (
              localMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`chat-message ${msg.playerId === myPlayerId ? 'own' : ''}`}
                >
                  <span className="chat-author">{msg.playerName}</span>
                  <span className="chat-text">{msg.text}</span>
                </div>
              ))
            )}
          </div>

          <div className="chat-input-area">
            {canSend ? (
              <>
                <textarea
                  className="chat-input"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Message your In Group…"
                  rows={2}
                  maxLength={500}
                />
                <button
                  type="button"
                  className="btn btn-primary chat-send"
                  onClick={handleSend}
                  disabled={!draft.trim()}
                >
                  Send
                </button>
              </>
            ) : (
              <p className="chat-readonly">View only — In Group members can chat during the round.</p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
