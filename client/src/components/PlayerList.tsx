import type { ClientPlayer } from '@shared/types';

interface Props {
  players: ClientPlayer[];
  title?: string;
}

export function PlayerList({ players, title = 'Players' }: Props) {
  return (
    <div className="section">
      <div className="section-label">{title} ({players.length})</div>
      <ul className="player-list">
        {players.map((p) => (
          <li key={p.id} className="player-item">
            <span className="player-icon">
              {p.name.charAt(0).toUpperCase()}
            </span>
            <span className="player-name">
              {p.name}
              {p.isHost && <span className="host-badge">Host</span>}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
