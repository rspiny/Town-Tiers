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

/**
 * Initialize app - load players from backend
 * Reads from Supabase players table via /api/players endpoint
 */
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

        // Map API fields to our format (API returns camelCase from Supabase columns)
        players = data.map(p => ({
            id: p.id,
            username: p.username,
            avatar: p.avatar,
            region: p.region,
            faction: p.faction,
            longRangeTier: p.longRangeTier,
            cqcTier: p.cqcTier
        }));
        console.log('✅ Players loaded from Supabase via /api/players:', players);
    } catch (error) {
        console.error('❌ Error loading players:', error);
        apiError = error.message;
        players = [];
    }
}

/**
 * Calculate points based on tier
 */
function getPointsForTier(tier) {
    return TIER_POINTS[tier] || 0;
}

/**
 * Calculate overall points for a player
 */
function calculatePlayerPoints(player) {
    const longRangePoints = getPointsForTier(player.longRangeTier);
    const cqcPoints = player.cqcTier === 'N/A' ? 0 : getPointsForTier(player.cqcTier);
    return longRangePoints + cqcPoints;
}

/**
 * Get all players sorted by category
 */
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

/**
 * Search players by username, region, or faction
 */
function searchPlayers(query) {
    return players.filter(p => 
        p.username.toLowerCase().includes(query.toLowerCase()) ||
        p.region.toLowerCase().includes(query.toLowerCase()) ||
        p.faction.toLowerCase().includes(query.toLowerCase())
    );
}

// Initialize players when page loads
initializePlayers();
