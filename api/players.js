import { kv } from '@vercel/kv';

// Use Vercel KV for persistent data storage
const PLAYERS_KEY = 'town-tiers:players';

// Helper to get current player ID counter
async function getNextPlayerId() {
  let counter = await kv.get('town-tiers:player-id-counter');
  if (!counter) counter = 0;
  counter = Number(counter) + 1;
  await kv.set('town-tiers:player-id-counter', counter);
  return counter;
}

// Helper to get all players from KV
async function getAllPlayers() {
  try {
    const playersJson = await kv.get(PLAYERS_KEY);
    if (!playersJson) return [];
    return Array.isArray(playersJson) ? playersJson : [];
  } catch (error) {
    console.error('Error reading from KV:', error);
    return [];
  }
}

// Helper to save all players to KV
async function saveAllPlayers(players) {
  try {
    await kv.set(PLAYERS_KEY, players);
  } catch (error) {
    console.error('Error writing to KV:', error);
    throw new Error('Failed to save player data');
  }
}

// Verify API authentication for mutations
function verifyApiSecret(req) {
  const authHeader = req.headers.authorization;
  const expectedSecret = process.env.API_SECRET;
  
  // No secret configured = open API (development only)
  if (!expectedSecret) {
    return true;
  }
  
  if (!authHeader) {
    return false;
  }
  
  const [scheme, token] = authHeader.split(' ');
  return scheme === 'Bearer' && token === expectedSecret;
}

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // GET /api/players - Get all players (public, no auth required)
    if (req.method === 'GET') {
      const players = await getAllPlayers();
      return res.status(200).json(players);
    }

    // POST /api/players - Add a new player (requires auth)
    if (req.method === 'POST') {
      if (!verifyApiSecret(req)) {
        return res.status(401).json({ error: 'Unauthorized. API_SECRET required for mutations.' });
      }

      const { username, avatar, region, faction, longRangeTier, cqcTier } = req.body;

      if (!username || !region || !longRangeTier || !cqcTier) {
        return res.status(400).json({ error: 'Missing required fields: username, region, longRangeTier, cqcTier' });
      }

      const players = await getAllPlayers();
      
      // Check for duplicate username
      if (players.some(p => p.username.toLowerCase() === username.toLowerCase())) {
        return res.status(409).json({ error: 'Player with this username already exists' });
      }

      const newPlayer = {
        id: await getNextPlayerId(),
        username,
        avatar: avatar || 'https://www.roblox.com/avatar/?userId=0&format=png&size=150x150',
        region,
        faction: faction || 'N/A',
        longRangeTier,
        cqcTier,
        createdAt: new Date().toISOString()
      };

      players.push(newPlayer);
      await saveAllPlayers(players);

      return res.status(201).json(newPlayer);
    }

    // PATCH /api/players - Update a player (requires auth)
    if (req.method === 'PATCH') {
      if (!verifyApiSecret(req)) {
        return res.status(401).json({ error: 'Unauthorized. API_SECRET required for mutations.' });
      }

      const { id, username, avatar, region, faction, longRangeTier, cqcTier } = req.body;

      if (!id) {
        return res.status(400).json({ error: 'Player ID is required' });
      }

      const players = await getAllPlayers();
      const playerIndex = players.findIndex(p => p.id === Number(id));

      if (playerIndex === -1) {
        return res.status(404).json({ error: 'Player not found' });
      }

      const player = players[playerIndex];
      
      // Update only provided fields
      if (username) player.username = username;
      if (avatar) player.avatar = avatar;
      if (region) player.region = region;
      if (faction !== undefined) player.faction = faction;
      if (longRangeTier) player.longRangeTier = longRangeTier;
      if (cqcTier) player.cqcTier = cqcTier;
      player.updatedAt = new Date().toISOString();

      await saveAllPlayers(players);

      return res.status(200).json(player);
    }

    // DELETE /api/players - Delete a player (requires auth)
    if (req.method === 'DELETE') {
      if (!verifyApiSecret(req)) {
        return res.status(401).json({ error: 'Unauthorized. API_SECRET required for mutations.' });
      }

      const { id } = req.body;

      if (!id) {
        return res.status(400).json({ error: 'Player ID is required' });
      }

      const players = await getAllPlayers();
      const playerIndex = players.findIndex(p => p.id === Number(id));

      if (playerIndex === -1) {
        return res.status(404).json({ error: 'Player not found' });
      }

      const [deleted] = players.splice(playerIndex, 1);
      await saveAllPlayers(players);

      return res.status(200).json(deleted);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
}
