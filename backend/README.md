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
- `GET /api/download/:hash` - Download a file (optional IP restriction)
- `GET /api/download/:hash/check` - Check if download is allowed
- `GET /health` - Health check

## Configuration

Edit `src/config.ts` to configure:

- Optional IP whitelisting for downloads (via ALLOW_ALL_IPS env var)
- Upload directory
- Maximum file size
- Server port
