# nirvana-cms

MERN stack project: MongoDB, Express, React (Vite + TypeScript + Tailwind CSS), Node.js.

## Structure

- `client/` — React app (Vite, TypeScript, Tailwind CSS)
- `server/` — Express API (Mongoose, sample `items` CRUD resource)

## Setup

1. Make sure MongoDB is running locally (or set `MONGO_URI` to a remote instance).
2. Copy `server/.env.example` to `server/.env` and adjust as needed.
3. Install dependencies:

   ```bash
   npm install
   npm install --prefix client
   npm install --prefix server
   ```

## Development

Run both client and server together:

```bash
npm run dev
```

- Client: http://localhost:5173
- Server: http://localhost:5001 (proxied from client under `/api`)

Or run them individually with `npm run dev:client` / `npm run dev:server`.

## API

- `GET /api/health` — health check
