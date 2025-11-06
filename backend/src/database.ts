import Database from "better-sqlite3";
import { DATABASE_PATH } from "./config.js";

let db: Database.Database;

export function initDb(): Database.Database {
  db = new Database(DATABASE_PATH);

  db.exec(`
    CREATE TABLE IF NOT EXISTS files (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      hash TEXT UNIQUE NOT NULL,
      filename TEXT NOT NULL,
      filepath TEXT NOT NULL,
      filesize INTEGER NOT NULL,
      mimetype TEXT,
      uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      download_count INTEGER DEFAULT 0
    )
  `);

  return db;
}

export function saveFileMetadata(
  hash: string,
  filename: string,
  filepath: string,
  filesize: number,
  mimetype: string
): boolean {
  try {
    const stmt = db.prepare(`
      INSERT INTO files (hash, filename, filepath, filesize, mimetype)
      VALUES (?, ?, ?, ?, ?)
    `);
    stmt.run(hash, filename, filepath, filesize, mimetype);
    return true;
  } catch (error) {
    console.error("Error saving file metadata:", error);
    return false;
  }
}

export function getFileMetadata(hash: string): any {
  try {
    const stmt = db.prepare("SELECT * FROM files WHERE hash = ?");
    return stmt.get(hash);
  } catch (error) {
    console.error("Error getting file metadata:", error);
    return null;
  }
}

export function incrementDownloadCount(hash: string): void {
  try {
    const stmt = db.prepare(
      "UPDATE files SET download_count = download_count + 1 WHERE hash = ?"
    );
    stmt.run(hash);
  } catch (error) {
    console.error("Error incrementing download count:", error);
  }
}
