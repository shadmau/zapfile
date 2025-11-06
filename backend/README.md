# Zapfile Backend

TypeScript backend for Zapfile

## Setup

```bash
npm install
npm run dev
```

The server will run on `http://localhost:8000`

## API Endpoints

- `POST /api/upload` - Upload a file
- `GET /api/download/:hash` - Download a file (IP-restricted)
- `GET /api/download/:hash/check` - Check if download is allowed
- `GET /health` - Health check

## Configuration

Edit `src/config.ts` to configure:

- Allowed IP ranges for downloads
- Upload directory
- Maximum file size
- Server port
