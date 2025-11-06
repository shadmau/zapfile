import dotenv from "dotenv";
dotenv.config();

export const ALLOWED_IP_RANGES = [
  // "0.0.0.0/0", // Allow all (for testing)
  // Add Claude Code Web IP ranges here
];

export const UPLOAD_DIR = "uploads";
export const MAX_FILE_SIZE = 150 * 1024 * 1024; // 150MB
export const MAX_TOTAL_FILES = 1000;

export const DATABASE_PATH = "zapfile.db";

export const PORT = parseInt(process.env.PORT || "8000");
