import fs from 'fs';
import path from 'path';

// The deployed bundle directory is read-only on Vercel, so writes must go to
// /tmp instead. On first read in a cold start, seed /tmp from the bundled
// players.json (which was included via the "includeFiles" config).
const BUNDLED_FILE = path.join(process.cwd(), 'players.json');
const DATA_FILE = path.join('/tmp', 'players.json');

function readPlayers() {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    // Not in /tmp yet (cold start) - fall back to the bundled file.
    try {
      const raw = fs.readFileSync(BUNDLED_FILE, 'utf-8');
      return JSON.parse(raw);
    } catch (err2) {
      return [];
    }
  }
}

function writePlayers(players) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(players, null, 2));
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const players = readPlayers();

    // GET /api/players - Get all players
    if (req.method === 'GET') {
      return res.status(200).json(players);
    }

    // POST /api/players - Add a new player
    if (req.method === 'POST') {
      const { username, avatar, region, faction, longRangeTier, cqcTier } = req.body;

      if (!username || !region || !longRangeTier || !cqcTier) {
        return res.status(400).json({ error: 'Username, region, longRangeTier, and cqcTier are required' });
      }

      const nextId = players.reduce((max, p) => (p.id > max ? p.id : max), 0) + 1;

      const newPlayer = {
        id: nextId,
        username,
        avatar: avatar || 'https://www.roblox.com/avatar/?userId=0&format=png&size=150x150',
        region,
        faction: faction || 'N/A',
        LongRangeTier: longRangeTier,
        CqcTier: cqcTier
      };

      players.push(newPlayer);
      writePlayers(players);

      return res.status(201).json(newPlayer);
    }

    // PATCH /api/players - Update a player
    if (req.method === 'PATCH') {
      const { id, username, avatar, region, faction, longRangeTier, cqcTier } = req.body;

      if (!id) {
        return res.status(400).json({ error: 'Player ID is required' });
      }

      const player = players.find(p => p.id === Number(id));

      if (!player) {
        return res.status(404).json({ error: 'Player not found' });
      }

      if (username) player.username = username;
      if (avatar) player.avatar = avatar;
      if (region) player.region = region;
      if (faction) player.faction = faction;
      if (longRangeTier) player.LongRangeTier = longRangeTier;
      if (cqcTier) player.CqcTier = cqcTier;

      writePlayers(players);

      return res.status(200).json(player);
    }

    // DELETE /api/players - Delete a player
    if (req.method === 'DELETE') {
      const { id } = req.body;

      if (!id) {
        return res.status(400).json({ error: 'Player ID is required' });
      }

      const index = players.findIndex(p => p.id === Number(id));

      if (index === -1) {
        return res.status(404).json({ error: 'Player not found' });
      }

      const [deleted] = players.splice(index, 1);
      writePlayers(players);

      return res.status(200).json(deleted);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('API Error:', err);
    return res.status(500).json({ error: err.message });
  }
}
