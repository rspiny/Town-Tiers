// In-memory database (resets when server restarts)
let players = [];
let nextId = 1;

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // GET /api/players - Get all players
  if (req.method === 'GET') {
    const sorted = [...players].sort((a, b) => {
      const pointsA = getPlayerPoints(a);
      const pointsB = getPlayerPoints(b);
      return pointsB - pointsA;
    });
    return res.status(200).json(sorted);
  }

  // POST /api/players - Add a new player
  if (req.method === 'POST') {
    const { username, avatar, region, faction, longRangeTier, cqcTier } = req.body;

    if (!username || !region || !longRangeTier || !cqcTier) {
      return res.status(400).json({ error: 'Username, region, longRangeTier, and cqcTier are required' });
    }

    const newPlayer = {
      id: nextId++,
      username,
      avatar: avatar || 'https://www.roblox.com/avatar/?userId=0&format=png&size=150x150',
      region,
      faction: faction || 'N/A',
      LongRangeTier: longRangeTier,
      CqcTier: cqcTier,
      createdAt: new Date().toISOString()
    };

    players.push(newPlayer);
    return res.status(201).json(newPlayer);
  }

  // PATCH /api/players - Update a player
  if (req.method === 'PATCH') {
    const { id, username, avatar, region, faction, longRangeTier, cqcTier } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'Player ID is required' });
    }

    const player = players.find(p => p.id === id);
    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }

    if (username) player.username = username;
    if (avatar) player.avatar = avatar;
    if (region) player.region = region;
    if (faction) player.faction = faction;
    if (longRangeTier) player.LongRangeTier = longRangeTier;
    if (cqcTier) player.CqcTier = cqcTier;

    return res.status(200).json(player);
  }

  // DELETE /api/players - Delete a player
  if (req.method === 'DELETE') {
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'Player ID is required' });
    }

    const index = players.findIndex(p => p.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Player not found' });
    }

    const deleted = players.splice(index, 1);
    return res.status(200).json(deleted[0]);
  }

  res.status(405).json({ error: 'Method not allowed' });
}

function getPlayerPoints(player) {
  const tierPoints = {
    'LT5': 10,
    'HT5': 20,
    'LT4': 30,
    'HT4': 40,
    'LT3': 50,
    'HT3': 60,
    'LT2': 70,
    'HT2': 80,
    'LT1': 90,
    'HT1': 100
  };

  const longRangePoints = tierPoints[player.LongRangeTier] || 0;
  const cqcPoints = player.CqcTier === 'N/A' ? 0 : (tierPoints[player.CqcTier] || 0);
  return longRangePoints + cqcPoints;
}
