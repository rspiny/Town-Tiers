/**
 * Town Tiers API - Players Endpoint
 * 
 * Uses Supabase as the database backend
 * Server-side only - Supabase credentials are NEVER exposed to the browser
 */

// Supabase configuration (server-side only)
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const API_SECRET = process.env.API_SECRET;

// Validate required environment variables on startup
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('ERROR: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
}

if (!API_SECRET) {
  console.error('WARNING: API_SECRET is not set - write requests will be rejected');
}

/**
 * Authenticate write requests using API_SECRET
 * GET requests remain public
 */
function authenticateRequest(req) {
  const authHeader = req.headers.authorization || '';
  const expectedToken = `Bearer ${API_SECRET}`;
  return authHeader === expectedToken;
}

/**
 * Map Supabase column names (PascalCase) to API response (camelCase)
 */
function mapPlayerFromDB(dbPlayer) {
  if (!dbPlayer) return null;
  return {
    id: dbPlayer.id,
    username: dbPlayer.username,
    avatar: dbPlayer.avatar,
    region: dbPlayer.Region,
    faction: dbPlayer.faction,
    longRangeTier: dbPlayer.LongRangeTier,
    cqcTier: dbPlayer.CqcTier
  };
}

/**
 * Map API request body (camelCase) to Supabase columns (PascalCase)
 */
function mapPlayerToDB(player) {
  const dbPlayer = {
    username: player.username,
    avatar: player.avatar,
    Region: player.region,
    faction: player.faction || 'N/A',
    LongRangeTier: player.longRangeTier,
    CqcTier: player.cqcTier
  };
  return dbPlayer;
}

/**
 * GET all players from Supabase
 */
async function getAllPlayers() {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/players`, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Supabase error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return Array.isArray(data) ? data.map(mapPlayerFromDB) : [];
  } catch (error) {
    console.error('Error fetching players from Supabase:', error);
    throw error;
  }
}

/**
 * INSERT a new player into Supabase
 */
async function insertPlayer(playerData) {
  try {
    const dbPlayer = mapPlayerToDB(playerData);
    
    const response = await fetch(`${SUPABASE_URL}/rest/v1/players`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(dbPlayer)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || `Supabase error: ${response.status}`);
    }

    const data = await response.json();
    return Array.isArray(data) ? mapPlayerFromDB(data[0]) : mapPlayerFromDB(data);
  } catch (error) {
    console.error('Error inserting player:', error);
    throw error;
  }
}

/**
 * UPDATE a player in Supabase
 */
async function updatePlayer(playerId, playerData) {
  try {
    const dbPlayer = mapPlayerToDB(playerData);
    
    const response = await fetch(`${SUPABASE_URL}/rest/v1/players?id=eq.${playerId}`, {
      method: 'PATCH',
      headers: {
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(dbPlayer)
    });

    if (!response.ok) {
      throw new Error(`Supabase error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return Array.isArray(data) ? mapPlayerFromDB(data[0]) : mapPlayerFromDB(data);
  } catch (error) {
    console.error('Error updating player:', error);
    throw error;
  }
}

/**
 * DELETE a player from Supabase
 */
async function deletePlayer(playerId) {
  try {
    // First, get the player before deletion
    const response = await fetch(`${SUPABASE_URL}/rest/v1/players?id=eq.${playerId}`, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Supabase error: ${response.status}`);
    }

    const data = await response.json();
    const player = Array.isArray(data) ? data[0] : data;

    // Now delete
    const deleteResponse = await fetch(`${SUPABASE_URL}/rest/v1/players?id=eq.${playerId}`, {
      method: 'DELETE',
      headers: {
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!deleteResponse.ok) {
      throw new Error(`Supabase error: ${deleteResponse.status}`);
    }

    return mapPlayerFromDB(player);
  } catch (error) {
    console.error('Error deleting player:', error);
    throw error;
  }
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
    // GET /api/players - Get all players (PUBLIC, no auth required)
    if (req.method === 'GET') {
      const players = await getAllPlayers();
      return res.status(200).json(players);
    }

    // All write operations require authentication
    if (req.method === 'POST' || req.method === 'PATCH' || req.method === 'DELETE') {
      if (!authenticateRequest(req)) {
        return res.status(401).json({ error: 'Unauthorized: Invalid or missing API_SECRET' });
      }
    }

    // POST /api/players - Add a new player (PROTECTED)
    if (req.method === 'POST') {
      const { username, avatar, region, faction, longRangeTier, cqcTier } = req.body;

      if (!username || !region || !longRangeTier || !cqcTier) {
        return res.status(400).json({ 
          error: 'Missing required fields: username, region, longRangeTier, cqcTier' 
        });
      }

      const newPlayer = await insertPlayer({
        username,
        avatar: avatar || 'https://www.roblox.com/avatar/?userId=0&format=png&size=150x150',
        region,
        faction: faction || 'N/A',
        longRangeTier,
        cqcTier
      });

      return res.status(201).json(newPlayer);
    }

    // PATCH /api/players - Update a player (PROTECTED)
    if (req.method === 'PATCH') {
      const { id, username, avatar, region, faction, longRangeTier, cqcTier } = req.body;

      if (!id) {
        return res.status(400).json({ error: 'Player ID is required' });
      }

      // Build update object with only provided fields
      const updateData = {};
      if (username !== undefined) updateData.username = username;
      if (avatar !== undefined) updateData.avatar = avatar;
      if (region !== undefined) updateData.region = region;
      if (faction !== undefined) updateData.faction = faction;
      if (longRangeTier !== undefined) updateData.longRangeTier = longRangeTier;
      if (cqcTier !== undefined) updateData.cqcTier = cqcTier;

      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
      }

      const updatedPlayer = await updatePlayer(id, updateData);
      return res.status(200).json(updatedPlayer);
    }

    // DELETE /api/players - Delete a player (PROTECTED)
    if (req.method === 'DELETE') {
      const { id } = req.body;

      if (!id) {
        return res.status(400).json({ error: 'Player ID is required' });
      }

      const deletedPlayer = await deletePlayer(id);
      return res.status(200).json(deletedPlayer);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('API Error:', err);
    return res.status(500).json({ error: `Server error: ${err.message}` });
  }
}
