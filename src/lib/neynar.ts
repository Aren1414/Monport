import { NeynarAPIClient, Configuration, WebhookUserCreated } from '@neynar/nodejs-sdk';
import { APP_URL } from './constants';
import { calculatePoints, POINTS_RULES } from './points';

let neynarClient: NeynarAPIClient | null = null;

export function getNeynarClient() {
  if (!neynarClient) {
    const apiKey = process.env.NEYNARAPIKEY;
    if (!apiKey) {
      throw new Error('NEYNARAPIKEY not configured');
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
  | { state: "error"; error: unknown }
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
      notification,
    });

    if (result.notification_deliveries.length > 0) {
      return { state: "success" };
    } else {
      return { state: "no_token" };
    }
  } catch (error) {
    return { state: "error", error };
  }
}

export async function updateUserScore(fid: number, action: keyof typeof POINTS_RULES) {
  const points = calculatePoints(action);
  const user = await getNeynarUser(fid);

  if (user) {
    // Placeholder: leaderboard logic to be implemented later
    console.log(`[dev] +${points} pts → ${user.username}`);
  }
}
