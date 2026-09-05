// Tier point values
const TIER_POINTS = {
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

// API Base URL - Uses relative path to always hit same deployment
const API_URL = '/api/players';

// Players array (will be loaded from backend)
let players = [];
let apiError = null;

// Admin authentication token stored in sessionStorage (NOT persistent, clears on browser close)
let adminToken = null;

/**
 * Check if user has a valid admin token in sessionStorage
 * Token format: server-issued session token from /api/auth/login
 * This prevents simple localStorage/DevTools manipulation
 */
function isAdminAuthenticated() {
  const token = sessionStorage.getItem('admin_token');
  return token !== null && token !== undefined;
}

/**
 * Get admin token for requests
 * Returns null if not authenticated
 */
function getAdminToken() {
  return sessionStorage.getItem('admin_token');
}

/**
 * Set admin token after successful login
 * Uses sessionStorage (not persistent across browser close)
 */
function setAdminToken(token) {
  sessionStorage.setItem('admin_token', token);
}

/**
 * Clear admin token on logout
 */
function clearAdminToken() {
  sessionStorage.removeItem('admin_token');
}

// Initialize app - load players from backend
async function initializePlayers() {
    try {
        apiError = null;
        const response = await fetch(API_URL);
        
        if (!response.ok) {
            throw new Error(`API returned ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        
        if (!Array.isArray(data)) {
            throw new Error('API returned invalid data format');
        }

        // Map API fields to our format (API now returns camelCase)
        players = data.map(p => ({
            id: p.id,
            username: p.username,
            avatar: p.avatar,
            region: p.region,
            faction: p.faction,
            longRangeTier: p.longRangeTier,
            cqcTier: p.cqcTier
        }));
        console.log('Players loaded from backend:', players);
    } catch (error) {
        console.error('Error loading players:', error);
        apiError = error.message;
        players = [];
    }
}

// Calculate points based on tier
function getPointsForTier(tier) {
    return TIER_POINTS[tier] || 0;
}

// Calculate overall points for a player
function calculatePlayerPoints(player) {
    const longRangePoints = getPointsForTier(player.longRangeTier);
    const cqcPoints = player.cqcTier === 'N/A' ? 0 : getPointsForTier(player.cqcTier);
    return longRangePoints + cqcPoints;
}

// Get all players sorted by category
function getPlayersSortedBy(category) {
    let sorted = [...players];
    
    if (category === 'overall') {
        sorted.sort((a, b) => calculatePlayerPoints(b) - calculatePlayerPoints(a));
    } else if (category === 'long-range') {
        sorted.sort((a, b) => getPointsForTier(b.longRangeTier) - getPointsForTier(a.longRangeTier));
    } else if (category === 'cqc') {
        sorted = sorted.filter(p => p.cqcTier !== 'N/A');
        sorted.sort((a, b) => getPointsForTier(b.cqcTier) - getPointsForTier(a.cqcTier));
    }
    
    return sorted.slice(0, 100); // Top 100
}

// Add a new player via backend
async function addPlayer(playerData) {
    try {
        // Admin operations require authentication token
        if (!isAdminAuthenticated()) {
            throw new Error('Admin authentication required');
        }

        const token = getAdminToken();

        const payload = {
            username: playerData.username,
            avatar: playerData.avatar,
            region: playerData.region,
            faction: playerData.faction || 'N/A',
            longRangeTier: playerData.longRangeTier,
            cqcTier: playerData.cqcTier
        };

        console.log('Sending player data:', payload);

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });
        
        const responseData = await response.json();
        console.log('Response:', responseData);

        if (response.ok) {
            const mappedPlayer = {
                id: responseData.id,
                username: responseData.username,
                avatar: responseData.avatar,
                region: responseData.region,
                faction: responseData.faction,
                longRangeTier: responseData.longRangeTier,
                cqcTier: responseData.cqcTier
            };
            players.push(mappedPlayer);
            return mappedPlayer;
        } else {
            console.error('Failed to add player:', responseData);
            throw new Error(responseData.error || 'Failed to add player');
        }
    } catch (error) {
        console.error('Error adding player:', error);
        throw error;
    }
}

// Update a player via backend
async function updatePlayer(playerId, playerData) {
    try {
        // Admin operations require authentication token
        if (!isAdminAuthenticated()) {
            throw new Error('Admin authentication required');
        }

        const token = getAdminToken();

        const payload = {
            id: playerId,
            longRangeTier: playerData.longRangeTier,
            cqcTier: playerData.cqcTier
        };

        const response = await fetch(API_URL, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to update player');
        }

        const responseData = await response.json();
        
        const index = players.findIndex(p => p.id === playerId);
        if (index !== -1) {
            players[index] = {
                ...players[index],
                longRangeTier: responseData.longRangeTier,
                cqcTier: responseData.cqcTier
            };
            return players[index];
        }
        return null;
    } catch (error) {
        console.error('Error updating player:', error);
        throw error;
    }
}

// Delete a player via backend
async function deletePlayer(playerId) {
    try {
        // Admin operations require authentication token
        if (!isAdminAuthenticated()) {
            throw new Error('Admin authentication required');
        }

        const token = getAdminToken();

        const response = await fetch(API_URL, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ id: playerId })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to delete player');
        }

        const index = players.findIndex(p => p.id === playerId);
        if (index !== -1) {
            players.splice(index, 1);
            return true;
        }
        return false;
    } catch (error) {
        console.error('Error deleting player:', error);
        throw error;
    }
}

// Search players
function searchPlayers(query) {
    return players.filter(p => 
        p.username.toLowerCase().includes(query.toLowerCase()) ||
        p.region.toLowerCase().includes(query.toLowerCase()) ||
        p.faction.toLowerCase().includes(query.toLowerCase())
    );
}

// Initialize players when page loads
initializePlayers();
