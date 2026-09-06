/**
 * Town Tiers API - Config Endpoint
 * 
 * Fetches configuration data from Supabase (e.g., Discord link)
 * Uses Supabase as the database backend
 * Server-side only - Supabase credentials are NEVER exposed to the browser
 */

// Supabase configuration (server-side only)
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Validate required environment variables on startup
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('ERROR: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
}

/**
 * GET config from Supabase
 */
async function getConfig() {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/configs?limit=1`, {
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
    const config = Array.isArray(data) ? data[0] : data;
    
    if (!config) {
      return { discordLink: 'https://discord.gg' };
    }

    return {
      discordLink: config.discord_link || 'https://discord.gg'
    };
  } catch (error) {
    console.error('Error fetching config from Supabase:', error);
    // Return fallback on error
    return { discordLink: 'https://discord.gg' };
  }
}

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // GET /api/config - Get config (PUBLIC, no auth required)
    if (req.method === 'GET') {
      const config = await getConfig();
      return res.status(200).json(config);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('API Error:', err);
    return res.status(500).json({ error: `Server error: ${err.message}` });
  }
}
