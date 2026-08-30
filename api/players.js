import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

const PLAYERS_KEY = 'town-tiers:players';
const PLAYER_ID_COUNTER_KEY = 'town-tiers:player-id-counter';
const API_SECRET = process.env.API_SECRET;

// Verify API_SECRET is configured
if (!API_SECRET) {
  console.error('ERROR: API_SECRET environment variable is not set. API will reject all write requests.');
}

/**
 * Authenticate write requests using API_SECRET
 * GET requests are always allowed (public read)
 */
function authenticateWriteRequest(req) {
  const authHeader = req.headers.authorization || '';
  const expectedToken = `Bearer ${API_SECRET}`;
  
  if (authHeader !== expectedToken) {
    return false;
  }
  return true;
}

async function getPlayers() {
  const players = await redis.get(PLAYERS_KEY);
  return players || [];
}

async function setPlayers(players) {
  await redis.set(PLAYERS_KEY, players);
}

async function getNextPlayerId() {
  const nextId = await redis.incr(PLAYER_ID_COUNTER_KEY);
  return nextId;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // GET /api/players - Get all players (PUBLIC, no auth required)
    if (req.method === 'GET') {
      const players = await getPlayers();
      return res.status(200).json(players);
    }

    // All write operations require authentication
    if (req.method === 'POST' || req.method === 'PATCH' || req.method === 'DELETE') {
      if (!authenticateWriteRequest(req)) {
        return res.status(401).json({ error: 'Unauthorized: Invalid or missing API_SECRET' });
      }
    }

    // POST /api/players - Add a new player (PROTECTED)
    if (req.method === 'POST') {
      const { username, avatar, region, faction, longRangeTier, cqcTier } = req.body;

      if (!username || !region || !longRangeTier || !cqcTier) {
        return res.status(400).json({ error: 'Username, region, longRangeTier, and cqcTier are required' });
      }

      const nextId = await getNextPlayerId();

      const newPlayer = {
        id: nextId,
        username,
        avatar: avatar || 'https://www.roblox.com/avatar/?userId=0&format=png&size=150x150',
        region,
        faction: faction || 'N/A',
        longRangeTier,
        cqcTier,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const players = await getPlayers();
      players.push(newPlayer);
      await setPlayers(players);

      return res.status(201).json(newPlayer);
    }

    // PATCH /api/players - Update a player (PROTECTED)
    if (req.method === 'PATCH') {
      const { id, username, avatar, region, faction, longRangeTier, cqcTier } = req.body;

      if (!id) {
        return res.status(400).json({ error: 'Player ID is required' });
      }

      const players = await getPlayers();
      const playerIndex = players.findIndex(p => p.id === Number(id));

      if (playerIndex === -1) {
        return res.status(404).json({ error: 'Player not found' });
      }

      const player = players[playerIndex];

      if (username !== undefined) player.username = username;
      if (avatar !== undefined) player.avatar = avatar;
      if (region !== undefined) player.region = region;
      if (faction !== undefined) player.faction = faction;
      if (longRangeTier !== undefined) player.longRangeTier = longRangeTier;
      if (cqcTier !== undefined) player.cqcTier = cqcTier;
      player.updatedAt = new Date().toISOString();

      players[playerIndex] = player;
      await setPlayers(players);

      return res.status(200).json(player);
    }

    // DELETE /api/players - Delete a player (PROTECTED)
    if (req.method === 'DELETE') {
      const { id } = req.body;

      if (!id) {
        return res.status(400).json({ error: 'Player ID is required' });
      }

      const players = await getPlayers();
      const playerIndex = players.findIndex(p => p.id === Number(id));

      if (playerIndex === -1) {
        return res.status(404).json({ error: 'Player not found' });
      }

      const [deleted] = players.splice(playerIndex, 1);
      await setPlayers(players);

      return res.status(200).json(deleted);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('API Error:', err);
    return res.status(500).json({ error: `Server error: ${err.message}` });
  }
}
