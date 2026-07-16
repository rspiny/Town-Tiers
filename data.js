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

// Sample player data (you can modify this)
let players = [
    {
        id: 1,
        username: 'Kabrateam',
        avatar: 'https://tr.rbxcdn.com/d40106ab2f28e25f3c6b4f7e5e8c9f1a/150/150/Avatar.png',
        region: 'Europe',
        faction: 'N/A',
        longRangeTier: 'HT3',
        cqcTier: 'N/A',
        notes: ''
    }
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
function addPlayer(playerData) {
    const newPlayer = {
        id: players.length + 1,
        ...playerData
    };
    players.push(newPlayer);
    return newPlayer;
}

// Update a player
function updatePlayer(playerId, playerData) {
    const index = players.findIndex(p => p.id === playerId);
    if (index !== -1) {
        players[index] = { ...players[index], ...playerData };
        return players[index];
    }
    return null;
}

// Delete a player
function deletePlayer(playerId) {
    const index = players.findIndex(p => p.id === playerId);
    if (index !== -1) {
        players.splice(index, 1);
        return true;
    }
    return false;
}

// Search players
function searchPlayers(query) {
    return players.filter(p => 
        p.username.toLowerCase().includes(query.toLowerCase()) ||
        p.region.toLowerCase().includes(query.toLowerCase()) ||
        p.faction.toLowerCase().includes(query.toLowerCase())
    );
}
