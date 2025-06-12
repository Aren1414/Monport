import { useEffect, useState } from "react";
import { getLeaderboardData } from "../lib/leaderboard";

export default function Leaderboard({ fid }: { fid: string }) {
  const [leaderboard, setLeaderboard] = useState<{ fid: string; username: string; avatarUrl: string; points: number }[]>([]);
  const [userRank, setUserRank] = useState<number | null>(null);

  useEffect(() => {
    async function fetchLeaderboard() {
      const data = await getLeaderboardData(fid);
      setLeaderboard(data.leaderboard);
      setUserRank(data.userRank);
    }
    fetchLeaderboard();
  }, [fid]);

  return (
    <div className="leaderboard-container">
      <h1>Leaderboard</h1>
      {userRank !== null && (
        <div className="user-rank">
          <p>Your Rank: <strong>{userRank}</strong></p>
        </div>
      )}
      <ul>
        {leaderboard.map((user, index) => (
          <li key={user.fid}>
            <img src={user.avatarUrl} alt={user.username} />
            <span>{index + 1}. {user.username} - {user.points} points</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
