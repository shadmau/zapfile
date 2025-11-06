# Zapfile

Quick file sharing for Claude Code Web.

## Features

- Drag & drop file upload (max 150MB)
- Shareable links with 24-char hash
- IP-restricted downloads (Claude Code Web only)

## Quick Start

```bash
# Frontend
cd frontend
npm install
npm run dev  # http://localhost:3000

# Backend
cd backend
npm install
npm run dev  # http://localhost:8000
```

## Configuration

### Frontend

```bash
cd frontend
cp .env.example .env.local
```

Edit `.env.local`:

```bash
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000  # Dev
```

### Backend

```bash
cd backend
cp .env.example .env
```

Edit `.env`:

```bash
PORT=8000
```

Edit `backend/src/config.ts` for IP whitelist:

```typescript
export const ALLOWED_IP_RANGES = [
  "0.0.0.0/0", // Allow all (testing only)
];
```

## License

MIT
