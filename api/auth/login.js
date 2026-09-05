/**
 * Admin Authentication Endpoint
 * 
 * Validates admin credentials against Supabase admins table
 * Issues server-side session token for subsequent requests
 * Token is NOT an API_SECRET - it's a temporary session credential
 */

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Validate required environment variables
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('ERROR: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
}

/**
 * Generate a simple session token
 * In production, use JWT or proper session management
 * For now, this is a temporary token tied to the admin's ID
 */
function generateSessionToken(adminId) {
  // Format: base64(adminId:timestamp:random)
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  const token = `${adminId}:${timestamp}:${random}`;
  return Buffer.from(token).toString('base64');
}

/**
 * Validate admin credentials against Supabase
 * Returns admin record if valid, throws error if invalid
 */
async function validateAdminCredentials(email, password) {
  try {
    // Query admins table for email
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/admins?email=eq.${encodeURIComponent(email)}`,
      {
        method: 'GET',
        headers: {
          'apikey': SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      throw new Error('Database query failed');
    }

    const data = await response.json();
    
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error('Invalid email or password');
    }

    const admin = data[0];

    // IMPORTANT: In production, passwords should be hashed (bcrypt, argon2, etc.)
    // This is a simple comparison - DO NOT use in production without proper hashing
    // For now, we assume the password in the database is plain text (not secure)
    // TODO: Implement proper password hashing
    if (admin.password !== password) {
      throw new Error('Invalid email or password');
    }

    return admin;
  } catch (error) {
    console.error('Admin credential validation error:', error);
    throw error;
  }
}

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only POST allowed for login
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Email and password are required' 
      });
    }

    // Validate credentials
    const admin = await validateAdminCredentials(email, password);

    // Generate session token
    const token = generateSessionToken(admin.id);

    // Return token to client
    // Client stores this in sessionStorage for subsequent requests
    return res.status(200).json({
      token,
      adminId: admin.id,
      email: admin.email,
      expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString() // 12 hours
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(401).json({ 
      error: error.message || 'Authentication failed' 
    });
  }
}
