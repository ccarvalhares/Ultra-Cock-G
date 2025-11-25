# Ultra Cock G - RPG Fighting Game

## Setup

1. Install dependencies:
   ```bash
   npm install
   cd client
   npm install
   cd ..
   ```

2. Configure Environment:
   - Rename `.env.example` to `.env` (if applicable, currently `.env` is created).
   - Fill in `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET`, and `MONGO_URI`.

3. Run Development Server:
   - Backend: `npm start` (Runs on port 3000)
   - Frontend: `cd client && npm run dev` (Runs on port 5173)

## Deployment (Render)

1. Connect repository to Render.
2. Set `Build Command` to `npm run build`.
3. Set `Start Command` to `npm start`.
4. Add Environment Variables in Render Dashboard.

## Features Implemented
- Hexagonal Architecture
- Discord Authentication
- Character System (9 Characters, 3 Classes)
- Weapon & Skill Systems
- Balancing Logic
