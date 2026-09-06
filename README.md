# InGroups

A multiplayer icebreaker game where teams try to align on a secret word without tipping off other groups.

## Quick Start

```bash
npm install
npm run dev
```

- **Client:** http://localhost:5173
- **Server:** http://localhost:3001

## How to Play

1. **Host** creates a room and shares the 4-letter room code
2. **Players** join with their name and room code (minimum 4 players)
3. Host configures groups and word set, then starts the game
4. Each round, one team becomes the **In Group** — they talk and try to agree on one word from a grid of 20
5. **Out Groups** listen silently and try to guess the In Group's word
6. Score points based on alignment and deduction!

## License Keys

Five demo license keys are seeded on first run. Check the server console or database for keys. Premium features include custom word sets and premium word categories.

## Tech Stack

- **Frontend:** React + TypeScript + Vite
- **Backend:** Express + Socket.io
- **Database:** SQLite (licenses, custom word sets)

## Design

Minimalist serif aesthetic with Cormorant Garamond, monochromatic palette (#262626, whites, grays) with accent colors from the brand diamond logo.
