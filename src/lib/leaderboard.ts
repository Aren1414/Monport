import sqlite3 from "sqlite3";

const db = new sqlite3.Database("./database.sqlite");

export function initializeLeaderboard() {
  db.run(`CREATE TABLE IF NOT EXISTS leaderboard (
    fid TEXT PRIMARY KEY,
    username TEXT,
    avatarUrl TEXT,
    points INTEGER
  )`);
}

export function addUserScore(fid: string, username: string, avatarUrl: string, points: number) {
  db.run(
    `INSERT INTO leaderboard (fid, username, avatarUrl, points)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(fid) DO UPDATE SET points = leaderboard.points + ?`,
    [fid, username, avatarUrl, points, points]
  );
}

export function getLeaderboard(): Promise<{ fid: string; username: string; avatarUrl: string; points: number }[]> {
  return new Promise((resolve, reject) => {
    db.all(`SELECT * FROM leaderboard ORDER BY points DESC LIMIT 200`, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

export function getUserRank(fid: string): Promise<number> {
  return new Promise((resolve, reject) => {
    db.get(
      `SELECT COUNT(*) + 1 AS rank FROM leaderboard WHERE points > (SELECT points FROM leaderboard WHERE fid = ?)`,
      [fid],
      (err, row) => {
        if (err) reject(err);
        else resolve(row?.rank || -1);
      }
    );
  });
}
