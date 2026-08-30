// In-memory database (resets when server restarts)
let players = [];

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // GET /api/players - Get all players
  if (req.method === 'GET') {
    const sorted = [...players].sort((a, b) => b.score - a.score);
    return res.status(200).json(sorted);
  }

  // POST /api/players - Add a new player
  if (req.method === 'POST') {
    const { name, tier, score } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const newPlayer = {
      id: Date.now().toString(),
      name,
      tier: tier || 'Unranked',
      score: score || 0,
      createdAt: new Date()
    };

    players.push(newPlayer);
    return res.status(201).json(newPlayer);
  }

  // PUT /api/players?id=xxx - Update a player
  if (req.method === 'PUT') {
    const { id } = req.query;
    const { name, tier, score } = req.body;

    const player = players.find(p => p.id === id);
    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }

    if (name) player.name = name;
    if (tier) player.tier = tier;
    if (score !== undefined) player.score = score;

    return res.status(200).json(player);
  }

  // DELETE /api/players?id=xxx - Delete a player
  if (req.method === 'DELETE') {
    const { id } = req.query;

    const index = players.findIndex(p => p.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Player not found' });
    }

    const deleted = players.splice(index, 1);
    return res.status(200).json(deleted[0]);
  }

  res.status(405).json({ error: 'Method not allowed' });
}
