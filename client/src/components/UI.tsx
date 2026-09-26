import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';

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

const HOW_TO_PLAY_TITLES = ['How to Play', 'Host Settings', 'Premium Options'] as const;
const HOW_TO_PLAY_CARD_COUNT = HOW_TO_PLAY_TITLES.length;

function HowToPlayScrollShell({ children }: { children: ReactNode }) {
  const shellRef = useRef<HTMLDivElement>(null);
  const [fade, setFade] = useState({ top: false, bottom: false });

  const syncScrollFades = useCallback(() => {
    const scrollEl = shellRef.current?.querySelector('.how-to-play-card');
    if (!(scrollEl instanceof HTMLElement)) return;

    const { scrollTop, scrollHeight, clientHeight } = scrollEl;
    const canScroll = scrollHeight > clientHeight + 2;

    setFade({
      top: canScroll && scrollTop > 2,
      bottom: canScroll && scrollTop + clientHeight < scrollHeight - 2,
    });
  }, []);

  useEffect(() => {
    syncScrollFades();
    const scrollEl = shellRef.current?.querySelector('.how-to-play-card');
    if (!(scrollEl instanceof HTMLElement)) return;

    scrollEl.addEventListener('scroll', syncScrollFades, { passive: true });
    const resizeObserver = new ResizeObserver(syncScrollFades);
    resizeObserver.observe(scrollEl);

    return () => {
      scrollEl.removeEventListener('scroll', syncScrollFades);
      resizeObserver.disconnect();
    };
  }, [syncScrollFades, children]);

  const shellClass = [
    'how-to-play-scroll-shell',
    fade.top ? 'how-to-play-scroll-shell--fade-top' : '',
    fade.bottom ? 'how-to-play-scroll-shell--fade-bottom' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div ref={shellRef} className={shellClass}>
      {children}
    </div>
  );
}

function HowToPlaySection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <p className="how-to-play-block">
      <span className="how-to-play-heading">{title}</span> {children}
    </p>
  );
}

function HowToPlayCardHowToPlay() {
  return (
    <div className="how-to-play-card">
      <HowToPlaySection title="Setup:">
        Players are divided into groups. Each round, one group is the In Group. Click on one of the 20
        word buttons that appear to lock in your guess.
      </HowToPlaySection>
      <HowToPlaySection title="In Group:">
        Talk out loud and try to agree on one word from the grid of 20 words. Leverage personal
        backgrounds, shared memories, or obscure knowledge – anything that won&apos;t tip off the Out
        Groups!
      </HowToPlaySection>
      <HowToPlaySection title="Out Groups:">
        Pay attention to the In Group and guess which word the In Group will choose.
      </HowToPlaySection>
      <p className="how-to-play-block">
        When playing with a timer, the In Group has until the timer is up to select a word, after
        which the Out Groups have a minute to guess. When playing without a timer, the round ends when
        all players have selected a word.
      </p>
      <p className="how-to-play-block">
        <span className="how-to-play-heading">Scoring:</span>
      </p>
      <p className="how-to-play-block how-to-play-lead">
        The following scoring rules are checked in order and stops at the first matched rule. If no
        rules are matched, no points are scored.
      </p>
      <ul className="how-to-play-list">
        <li>
          Every member of an Out Group guesses the In Group&apos;s most popular word → +2 to each
          member of that Out Group
        </li>
        <li>
          At least as many members of an Out Group guess the In Group&apos;s most popular word → +1
          to each member of that Out Group
        </li>
        <li>All In Group members choose the same word → +2 to each In Group member</li>
        <li>2+ In Group members agree on a word, but not all → +1 to each In Group member</li>
      </ul>
      <p className="how-to-play-block">
        The host can optionally enable an &ldquo;In Group Speed Bonus&rdquo; on timed rounds, which
        grants the In Group bonus points, but only if the In Group wins the round (i.e., the In Group
        scores points based on the rules above):
      </p>
      <ul className="how-to-play-list">
        <li>75%+ of timer remaining → +3 points extra</li>
        <li>50%+ of timer remaining → +2 points extra</li>
        <li>25%+ of timer remaining → +1 point extra</li>
      </ul>
    </div>
  );
}

function HowToPlayCardHostSettings() {
  return (
    <div className="how-to-play-card">
      <p className="how-to-play-block">
        Click &ldquo;Host Game&rdquo; to start a lobby. Give other players the Room Code so they can
        join the lobby.
      </p>
      <p className="how-to-play-block">
        On the lobby waiting screen, you can set the number of points to win, or turn off the win
        condition to have the game go on indefinitely.
      </p>
      <p className="how-to-play-block">
        The Host controls the teams, the timer, the scoring, and the word set between rounds. There
        must be at least 2 players in the In Group and at least 1 player in each Out Group to play.
      </p>
      <ul className="how-to-play-list">
        <li>
          <strong>Shuffle Group:</strong> Randomly shuffles players into the selected number of
          groups.
        </li>
        <li>
          <strong>Switch In Group:</strong> Keeps existing group assignments while &ldquo;shifting&rdquo;
          groups – the In Group becomes the first Out Group and the last Out Group becomes the In
          Group.
        </li>
        <li>
          <strong>Clicking on Players in the In Group / Out Group / Scoreboard Menus:</strong> Brings
          up a menu where you can manually move the player to another group or remove them from the
          game.
        </li>
        <li>
          <strong>Reset Scores (under Scoreboard):</strong> resets all scores
        </li>
        <li>
          <strong>Select Word Sets:</strong> choose the word set to play in the next round
        </li>
        <li>
          <strong>Round Timer:</strong> Set the amount of time the In Group has to lock in their
          guesses (Off is an option).
        </li>
        <li>
          <strong>In Group Speed Bonus:</strong> When the timer is enabled, set whether the In Group
          gets a bonus for locking in quickly (see &ldquo;Scoring&rdquo;)
        </li>
      </ul>
    </div>
  );
}

function HowToPlayCardPremiumOptions() {
  return (
    <div className="how-to-play-card">
      <p className="how-to-play-block">
        When signed in to an account (not playing as Guest), go to the License tab to obtain a
        license. This is a one-time purchase that unlocks:
      </p>
      <ul className="how-to-play-list">
        <li>50+ premium word sets</li>
        <li>
          The ability to create custom word sets:
          <ul className="how-to-play-sublist">
            <li>
              From the main menu (before Hosting or Joining a game), click Create Word Set
            </li>
            <li>
              Give your new Word Set a name, and either type or paste in a list of words (one word
              per line, minimum 20)
            </li>
            <li>Click Save.</li>
            <li>You can edit and delete your Word Sets from this menu as well</li>
          </ul>
        </li>
      </ul>
      <p className="how-to-play-block">
        One license per account. Share additional unused licenses with others – send them the license
        key, which they can paste into the License tab.
      </p>
    </div>
  );
}

const HOW_TO_PLAY_CARDS = [
  HowToPlayCardHowToPlay,
  HowToPlayCardHostSettings,
  HowToPlayCardPremiumOptions,
];

export function HowToPlayModal({ onClose }: { onClose: () => void }) {
  const [cardIndex, setCardIndex] = useState(0);

  const goPrev = () => {
    setCardIndex((index) => (index + HOW_TO_PLAY_CARD_COUNT - 1) % HOW_TO_PLAY_CARD_COUNT);
  };

  const goNext = () => {
    setCardIndex((index) => (index + 1) % HOW_TO_PLAY_CARD_COUNT);
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') {
        setCardIndex((index) => (index + HOW_TO_PLAY_CARD_COUNT - 1) % HOW_TO_PLAY_CARD_COUNT);
      }
      if (event.key === 'ArrowRight') {
        setCardIndex((index) => (index + 1) % HOW_TO_PLAY_CARD_COUNT);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const Card = HOW_TO_PLAY_CARDS[cardIndex];

  return (
    <Modal title={HOW_TO_PLAY_TITLES[cardIndex]} onClose={onClose}>
      <div className="how-to-play-carousel">
        <div className="how-to-play-viewport">
          <HowToPlayScrollShell key={cardIndex}>
            <Card />
          </HowToPlayScrollShell>
        </div>
        <div className="how-to-play-footer">
          <button
            type="button"
            className="how-to-play-nav how-to-play-nav--prev"
            onClick={goPrev}
            aria-label="Previous card"
          />
          <p className="how-to-play-progress" aria-live="polite">
            {cardIndex + 1} / {HOW_TO_PLAY_CARD_COUNT}
          </p>
          <button
            type="button"
            className="how-to-play-nav how-to-play-nav--next"
            onClick={goNext}
            aria-label="Next card"
          />
        </div>
      </div>
      <div className="modal-actions">
        <button className="btn btn-primary" onClick={onClose}>
          Got it
        </button>
      </div>
    </Modal>
  );
}
