# Zapfile

Quick file sharing for Claude Code Web.

## Features

- Drag & drop file upload (max 150MB)
- Shareable links with 24-char hash
- Optional IP-based access control

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
ALLOW_ALL_IPS=true  # Set to false to enable IP whitelisting
```

Optional: Enable IP whitelisting by setting `ALLOW_ALL_IPS=false` and configure IP ranges in `backend/src/config.ts`:

```typescript
export const ALLOWED_IP_RANGES = [
  "192.168.1.0/24",   // Example: Your network
];
```

## License

MIT
