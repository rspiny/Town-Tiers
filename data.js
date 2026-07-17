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

// Players array (will be loaded from local storage or Supabase)
let players = [
    { id: 1, username: 'KABRATEAM', avatar: 'https://www.roblox.com/avatar/?userId=1&format=png&size=150x150', region: 'Europe', faction: 'N/A', longRangeTier: 'LT3', cqcTier: 'HT3', notes: '' }
];

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

// Add a new player
async function addPlayer(playerData) {
    try {
        const newPlayer = {
            id: Math.max(...players.map(p => p.id), 0) + 1,
            ...playerData
        };
        players.push(newPlayer);
        localStorage.setItem('players', JSON.stringify(players));
        return newPlayer;
    } catch (error) {
        console.error('Error adding player:', error);
        return null;
    }
}

// Update a player
async function updatePlayer(playerId, playerData) {
    try {
        const index = players.findIndex(p => p.id === playerId);
        if (index !== -1) {
            players[index] = { ...players[index], ...playerData };
            localStorage.setItem('players', JSON.stringify(players));
            return players[index];
        }
        return null;
    } catch (error) {
        console.error('Error updating player:', error);
        return null;
    }
}

// Delete a player
async function deletePlayer(playerId) {
    try {
        const index = players.findIndex(p => p.id === playerId);
        if (index !== -1) {
            players.splice(index, 1);
            localStorage.setItem('players', JSON.stringify(players));
            return true;
        }
        return false;
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
        (p.faction && p.faction.toLowerCase().includes(query.toLowerCase()))
    );
}

// Initialize players from localStorage
async function initializePlayers() {
    try {
        const saved = localStorage.getItem('players');
        if (saved) {
            players = JSON.parse(saved);
        }
    } catch (error) {
        console.error('Error loading players:', error);
    }
}
