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
        <ul style={{ paddingLeft: 20, marginTop: 8 }}>
          <li>All Out Group members guess the In Group's most popular word → +2 each</li>
          <li>2+ In Group agree AND another group matches → +1 each in that group</li>
          <li>All In Group choose the same word → +2 each</li>
          <li>Some In Group agree → +1 each who matched</li>
        </ul>
        <br />
        <p>Rounds end when everyone locks in a guess, when the timer runs out, or when the host ends the round early.</p>
      </div>
      <div className="modal-actions">
        <button className="btn btn-primary" onClick={onClose}>Got it</button>
      </div>
    </Modal>
  );
}
