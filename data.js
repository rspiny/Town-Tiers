// Supabase configuration
const SUPABASE_URL = 'https://okgnwaeszuihxmmjzbew.supabase.co';
const SUPABASE_KEY = 'sb_publishable_oiVJClYzpLqLCbqQKXNlng_AUJfaXi8';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

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

// Players array (will be loaded from Supabase)
let players = [];

// Initialize app - load players from Supabase
async function initializePlayers() {
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/players`, {
            headers: {
                'apikey': SUPABASE_KEY,
                'Content-Type': 'application/json',
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            // Map Supabase columns to our format
            players = data.map(p => ({
                id: p.id,
                username: p.username,
                avatar: p.avatar,
                region: p.region,
                faction: p.faction,
                longRangeTier: p.LongRangeTier,
                cqcTier: p.CqcTier
            }));
            console.log('Players loaded from Supabase:', players);
        } else {
            console.error('Failed to load players:', response.statusText);
            players = [];
        }
    } catch (error) {
        console.error('Error loading players:', error);
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

// Add a new player to Supabase
async function addPlayer(playerData) {
    try {
        const payload = {
            username: playerData.username,
            avatar: playerData.avatar,
            region: playerData.region,
            faction: playerData.faction || 'N/A',
            LongRangeTier: playerData.longRangeTier,
            CqcTier: playerData.cqcTier
        };

        console.log('Sending player data:', payload);

        const response = await fetch(`${SUPABASE_URL}/rest/v1/players`, {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_KEY,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify(payload)
        });
        
        const responseData = await response.json();
        console.log('Response:', responseData);

        if (response.ok) {
            const newPlayer = Array.isArray(responseData) ? responseData[0] : responseData;
            const mappedPlayer = {
                id: newPlayer.id,
                username: newPlayer.username,
                avatar: newPlayer.avatar,
                region: newPlayer.region,
                faction: newPlayer.faction,
                longRangeTier: newPlayer.LongRangeTier,
                cqcTier: newPlayer.CqcTier
            };
            players.push(mappedPlayer);
            return mappedPlayer;
        } else {
            console.error('Failed to add player:', responseData);
            return null;
        }
    } catch (error) {
        console.error('Error adding player:', error);
        return null;
    }
}

// Update a player in Supabase
async function updatePlayer(playerId, playerData) {
    try {
        const payload = {
            LongRangeTier: playerData.longRangeTier,
            CqcTier: playerData.cqcTier
        };

        const response = await fetch(`${SUPABASE_URL}/rest/v1/players?id=eq.${playerId}`, {
            method: 'PATCH',
            headers: {
                'apikey': SUPABASE_KEY,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });
        
        if (response.ok) {
            const index = players.findIndex(p => p.id === playerId);
            if (index !== -1) {
                players[index] = { ...players[index], ...playerData };
                return players[index];
            }
            return null;
        } else {
            console.error('Failed to update player:', response.statusText);
            return null;
        }
    } catch (error) {
        console.error('Error updating player:', error);
        return null;
    }
}

// Delete a player from Supabase
async function deletePlayer(playerId) {
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/players?id=eq.${playerId}`, {
            method: 'DELETE',
            headers: {
                'apikey': SUPABASE_KEY,
                'Content-Type': 'application/json',
            }
        });
        
        if (response.ok) {
            const index = players.findIndex(p => p.id === playerId);
            if (index !== -1) {
                players.splice(index, 1);
                return true;
            }
            return false;
        } else {
            console.error('Failed to delete player:', response.statusText);
            return false;
        }
    } catch (error) {
        console.error('Error deleting player:', error);
        return false;
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
