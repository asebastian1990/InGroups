import { useState } from 'react';

interface Props {
  title: string;
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

export function Collapsible({
  title,
  defaultOpen = true,
  open: controlledOpen,
  onOpenChange,
  children,
}: Props) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const open = controlledOpen ?? internalOpen;

  const toggle = () => {
    const next = !open;
    if (controlledOpen === undefined) {
      setInternalOpen(next);
    }
    onOpenChange?.(next);
  };

  return (
    <div className="section">
      <div className="section-header" onClick={toggle}>
        <h3>{title}</h3>
        <span className={`section-chevron ${open ? 'open' : ''}`}>▼</span>
      </div>
      {open && <div className="section-body">{children}</div>}
    </div>
  );
}

interface ModalProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

export function Modal({ title, onClose, children }: ModalProps) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ position: 'relative' }}>
        <h2>{title}</h2>
        {children}
      </div>
    </div>
  );
}

interface ConfirmModalProps {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({ message, onConfirm, onCancel }: ConfirmModalProps) {
  return (
    <Modal title="Confirm" onClose={onCancel}>
      <p className="confirm-text">{message}</p>
      <div className="modal-actions">
        <button className="btn" onClick={onCancel}>Cancel</button>
        <button className="btn btn-danger" onClick={onConfirm}>Confirm</button>
      </div>
    </Modal>
  );
}

export function HowToPlayModal({ onClose }: { onClose: () => void }) {
  return (
    <Modal title="How to Play" onClose={onClose}>
      <div style={{ fontSize: '0.95rem', lineHeight: 1.7 }}>
        <p><strong>Goal:</strong> Align with your group on a secret word—without giving it away to other groups!</p>
        <br />
        <p><strong>Setup:</strong> Players are divided into teams. Each round, one team becomes the <em>In Group</em>.</p>
        <br />
        <p><strong>In Group:</strong> Talk out loud and try to agree on one word from the grid of 20 words. Don't tip off the Out Groups!</p>
        <br />
        <p><strong>Out Groups:</strong> Listen silently. Try to guess which word the In Group will choose.</p>
        <br />
        <p><strong>Scoring:</strong></p>
        <p style={{ marginTop: 12 }}><strong>Out Groups score (checked first):</strong></p>
        <ul style={{ paddingLeft: 20, marginTop: 8 }}>
          <li>Every member of an Out Group guesses the In Group's most popular word → +2 each in that Out Group</li>
          <li>At least as many members of an Out Group guess the In Group's most popular word → +1 each in that Out Group</li>
        </ul>
        <p style={{ marginTop: 12 }}><strong>In Group scores</strong> (only if no Out Group scored):</p>
        <ul style={{ paddingLeft: 20, marginTop: 8 }}>
          <li>All In Group members choose the same word → +2 each</li>
          <li>2+ In Group members agree on a word, but not all → +1 each</li>
        </ul>
        <br />
        <p>Rounds end when everyone locks in a guess, when the timer runs out, or when the host ends the round early.</p>
        <br />
        <p><strong>Timer (optional):</strong> The host can turn on a round timer between rounds. When active, the In Group gets the full timer to align on a word. Once every In Group member locks in, each Out Group gets one minute to choose.</p>
        <br />
        <p><strong>In Group Speed Bonus (optional):</strong> When the timer is on, the host can enable a bonus for In Group wins based on how much time remains when the In Group locks in:</p>
        <ul style={{ paddingLeft: 20, marginTop: 8 }}>
          <li>75%+ of timer remaining → +3 points</li>
          <li>50%+ of timer remaining → +2 points</li>
          <li>25%+ of timer remaining → +1 point</li>
        </ul>
        <p style={{ marginTop: 8 }}>The bonus only applies when the In Group wins the round — not to Out Group scoring.</p>
      </div>
      <div className="modal-actions">
        <button className="btn btn-primary" onClick={onClose}>Got it</button>
      </div>
    </Modal>
  );
}
