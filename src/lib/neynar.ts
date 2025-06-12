import { NeynarAPIClient, Configuration, WebhookUserCreated } from '@neynar/nodejs-sdk';
import { APP_URL } from './constants';
import { addUserScore, getLeaderboard, getUserRank } from './leaderboard';
import { calculatePoints } from './points';

let neynarClient: NeynarAPIClient | null = null;

// Example usage:
// const client = getNeynarClient();
// const user = await client.lookupUserByFid(fid); 
export function getNeynarClient() {
  if (!neynarClient) {
    const apiKey = process.env.NEYNAR_API_KEY;
    if (!apiKey) {
      throw new Error('NEYNAR_API_KEY not configured');
    }
    const config = new Configuration({ apiKey });
    neynarClient = new NeynarAPIClient(config);
  }
  return neynarClient;
}

type User = WebhookUserCreated['data'];

export async function getNeynarUser(fid: number): Promise<User | null> {
  try {
    const client = getNeynarClient();
    const usersResponse = await client.fetchBulkUsers({ fids: [fid] });
    return usersResponse.users[0];
  } catch (error) {
    console.error('Error getting Neynar user:', error);
    return null;
  }
}

type SendFrameNotificationResult =
  | {
      state: "error";
      error: unknown;
    }
  | { state: "no_token" }
  | { state: "rate_limit" }
  | { state: "success" };

export async function sendNeynarFrameNotification({
  fid,
  title,
  body,
}: {
  fid: number;
  title: string;
  body: string;
}): Promise<SendFrameNotificationResult> {
  try {
    const client = getNeynarClient();
    const targetFids = [fid];
    const notification = {
      title,
      body,
      target_url: APP_URL,
    };

    const result = await client.publishFrameNotifications({ 
      targetFids, 
      notification 
    });

    if (result.notification_deliveries.length > 0) {
      return { state: "success" };
    } else if (result.notification_deliveries.length === 0) {
      return { state: "no_token" };
    } else {
      return { state: "error", error: result || "Unknown error" };
    }
  } catch (error) {
    return { state: "error", error };
  }
}

// ✅ **Leaderboard integration without removing any original functionality**
export async function updateUserScore(fid: number, action: keyof typeof POINTS_RULES) {
  const points = calculatePoints(action);
  const user = await getNeynarUser(fid);

  if (user) {
    addUserScore(fid, user.username, user.pfp_url ?? "", points);
  }
}

export async function getLeaderboardData(fid: number) {
  const leaderboard = await getLeaderboard();
  const userRank = await getUserRank(fid);
  return { leaderboard, userRank };
}

export async function sendLeaderboardNotification(fid: number, pointsEarned: number) {
  try {
    const client = getNeynarClient();
    const targetFids = [fid];
    const notification = {
      title: "🔥 New Points Earned!",
      body: `You earned ${pointsEarned} points! Your new rank: ${await getUserRank(fid)} 🎉`,
      target_url: APP_URL,
    };

    const result = await client.publishFrameNotifications({ 
      targetFids, 
      notification 
    });

    return result.notification_deliveries.length > 0 ? { state: "success" } : { state: "no_token" };
  } catch (error) {
    return { state: "error", error };
  }
}
