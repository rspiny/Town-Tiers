import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // GET /api/players - Get all players
    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('players')
        .select('*')
        .order('id', { ascending: false });

      if (error) {
        return res.status(400).json({ error: error.message });
      }

      return res.status(200).json(data || []);
    }

    // POST /api/players - Add a new player
    if (req.method === 'POST') {
      const { username, avatar, region, faction, longRangeTier, cqcTier } = req.body;

      if (!username || !region || !longRangeTier || !cqcTier) {
        return res.status(400).json({ error: 'Username, region, longRangeTier, and cqcTier are required' });
      }

      const { data, error } = await supabase
        .from('players')
        .insert([
          {
            username,
            avatar: avatar || 'https://www.roblox.com/avatar/?userId=0&format=png&size=150x150',
            region,
            faction: faction || 'N/A',
            LongRangeTier: longRangeTier,
            CqcTier: cqcTier
          }
        ])
        .select();

      if (error) {
        return res.status(400).json({ error: error.message });
      }

      return res.status(201).json(data[0]);
    }

    // PATCH /api/players - Update a player
    if (req.method === 'PATCH') {
      const { id, username, avatar, region, faction, longRangeTier, cqcTier } = req.body;

      if (!id) {
        return res.status(400).json({ error: 'Player ID is required' });
      }

      const updateData = {};
      if (username) updateData.username = username;
      if (avatar) updateData.avatar = avatar;
      if (region) updateData.region = region;
      if (faction) updateData.faction = faction;
      if (longRangeTier) updateData.LongRangeTier = longRangeTier;
      if (cqcTier) updateData.CqcTier = cqcTier;

      const { data, error } = await supabase
        .from('players')
        .update(updateData)
        .eq('id', id)
        .select();

      if (error) {
        return res.status(400).json({ error: error.message });
      }

      if (!data || data.length === 0) {
        return res.status(404).json({ error: 'Player not found' });
      }

      return res.status(200).json(data[0]);
    }

    // DELETE /api/players - Delete a player
    if (req.method === 'DELETE') {
      const { id } = req.body;

      if (!id) {
        return res.status(400).json({ error: 'Player ID is required' });
      }

      const { data, error } = await supabase
        .from('players')
        .delete()
        .eq('id', id)
        .select();

      if (error) {
        return res.status(400).json({ error: error.message });
      }

      if (!data || data.length === 0) {
        return res.status(404).json({ error: 'Player not found' });
      }

      return res.status(200).json(data[0]);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('API Error:', err);
    return res.status(500).json({ error: err.message });
  }
}
