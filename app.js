// State
let currentTab = 'overall';

// Region abbreviations and colors
const REGION_CONFIG = {
    'Europe': { abbr: 'EU', color: '#FF4444' },
    'North America': { abbr: 'NA', color: '#4A90E2' },
    'South America': { abbr: 'SA', color: '#7ED321' },
    'Asia': { abbr: 'AS', color: '#FFD700' },
    'Middle East': { abbr: 'ME', color: '#FF6B6B' },
    'Africa': { abbr: 'AF', color: '#F5A623' },
    'Oceania': { abbr: 'OC', color: '#50E3C2' }
};

// Initialize app when page loads
document.addEventListener('DOMContentLoaded', async () => {
    await initializePlayers();
    renderLeaderboards();
    setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            switchTab(e.target.dataset.tab);
        });
    });

    // Search
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            handleSearch(e.target.value);
        });
    }

    // Discord button
    const discordBtn = document.getElementById('discordBtn');
    if (discordBtn) {
        discordBtn.addEventListener('click', () => {
            const discordLink = localStorage.getItem('discordLink') || 'https://discord.gg';
            if (discordLink) window.open(discordLink, '_blank');
        });
    }

    // Close player modal
    const playerModal = document.getElementById('playerModal');
    if (playerModal) {
        const closeBtn = playerModal.querySelector('.close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                playerModal.classList.remove('show');
            });
        }

        // Close modal when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target === playerModal) {
                playerModal.classList.remove('show');
            }
        });
    }
}

// Switch tabs
function switchTab(tab) {
    currentTab = tab;
    
    // Update active tab button
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.tab === tab) btn.classList.add('active');
    });

    // Update active tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(tab).classList.add('active');

    renderLeaderboards();
}

// Render all leaderboards
function renderLeaderboards() {
    renderLeaderboard('overall');
    renderLeaderboard('long-range');
    renderLeaderboard('cqc');
}

// Render a single leaderboard
function renderLeaderboard(category) {
    const elementId = category === 'overall' ? 'overallLeaderboard' : 
                      category === 'long-range' ? 'longRangeLeaderboard' : 
                      'cqcLeaderboard';
    const container = document.getElementById(elementId);
    
    if (!container) return;

    // Check for API error
    if (apiError && players.length === 0) {
        container.innerHTML = `<p style="text-align: center; color: #ff6b6b; padding: 40px;">⚠️ Unable to load leaderboard data. ${apiError}</p>`;
        return;
    }

    const sortedPlayers = getPlayersSortedBy(category);
    
    if (sortedPlayers.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #999; padding: 40px;">No players yet.</p>';
        return;
    }

    const header = `
        <div class="leaderboard-header">
            <div>#</div>
            <div>PLAYER</div>
            <div>REGION</div>
            <div>TIERS</div>
        </div>
    `;

    const rows = sortedPlayers.map((player, index) => {
        const rank = index + 1;
        const regionConfig = REGION_CONFIG[player.region] || { abbr: 'UN', color: '#999' };

        let rankClass = 'rank-other';
        if (rank === 1) rankClass = 'rank-1';
        else if (rank === 2) rankClass = 'rank-2';
        else if (rank === 3) rankClass = 'rank-3';

        return `
            <div class="player-row" onclick="openPlayerModal(${player.id})">
                <div class="rank-badge ${rankClass}">${rank}</div>
                <div class="player-info-section">
                    <img src="${player.avatar}" alt="${player.username}" class="player-avatar" onerror="this.src='https://www.roblox.com/avatar/?userId=0&format=png&size=150x150'">
                    <div class="player-name">${player.username}</div>
                </div>
                <div class="region-badge" style="background: ${regionConfig.color}">${regionConfig.abbr}</div>
                <div class="player-tiers">
                    <span class="tier-small">${player.longRangeTier}</span>
                    <span class="tier-small" style="background: ${player.cqcTier === 'N/A' ? '#666' : 'var(--accent-purple)'};">${player.cqcTier}</span>
                </div>
            </div>
        `;
    }).join('');

    container.innerHTML = header + rows;
}

// Handle search
function handleSearch(query) {
    const container = document.getElementById(currentTab === 'overall' ? 'overallLeaderboard' : 
                                             currentTab === 'long-range' ? 'longRangeLeaderboard' : 
                                             'cqcLeaderboard');
    
    if (!container) return;

    if (!query) {
        renderLeaderboard(currentTab);
        return;
    }

    const results = searchPlayers(query);
    
    if (results.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #999; padding: 40px;">No players found.</p>';
        return;
    }

    const header = `
        <div class="leaderboard-header">
            <div>#</div>
            <div>PLAYER</div>
            <div>REGION</div>
            <div>TIERS</div>
        </div>
    `;

    const rows = results.map((player) => {
        const regionConfig = REGION_CONFIG[player.region] || { abbr: 'UN', color: '#999' };

        return `
            <div class="player-row" onclick="openPlayerModal(${player.id})">
                <div class="rank-badge rank-other">—</div>
                <div class="player-info-section">
                    <img src="${player.avatar}" alt="${player.username}" class="player-avatar" onerror="this.src='https://www.roblox.com/avatar/?userId=0&format=png&size=150x150'">
                    <div class="player-name">${player.username}</div>
                </div>
                <div class="region-badge" style="background: ${regionConfig.color}">${regionConfig.abbr}</div>
                <div class="player-tiers">
                    <span class="tier-small">${player.longRangeTier}</span>
                    <span class="tier-small" style="background: ${player.cqcTier === 'N/A' ? '#666' : 'var(--accent-purple)'};">${player.cqcTier}</span>
                </div>
            </div>
        `;
    }).join('');

    container.innerHTML = header + rows;
}

// Open player details modal
function openPlayerModal(playerId) {
    const player = players.find(p => p.id === playerId);
    if (!player) return;

    document.getElementById('playerName').textContent = player.username;
    document.getElementById('playerAvatar').src = player.avatar;
    document.getElementById('playerRegion').textContent = player.region;
    
    const factionElement = document.getElementById('playerFaction');
    if (factionElement) {
        factionElement.textContent = player.faction !== 'N/A' ? player.faction : '';
        factionElement.style.display = player.faction !== 'N/A' ? '' : 'none';
    }
    
    document.getElementById('playerPoints').textContent = `${calculatePlayerPoints(player)} TOTAL POINTS`;
    
    const longRangePoints = getPointsForTier(player.longRangeTier);
    const cqcPoints = player.cqcTier === 'N/A' ? 'N/A' : getPointsForTier(player.cqcTier);
    
    document.getElementById('playerLongRange').innerHTML = `<span class="tier-badge">${player.longRangeTier} - ${longRangePoints}pts</span>`;
    document.getElementById('playerCQC').innerHTML = `<span class="tier-badge" style="${player.cqcTier === 'N/A' ? 'background: #666; border-color: #666; color: #ccc;' : ''}">${player.cqcTier} - ${cqcPoints}pts</span>`;
    
    // Remove edit/delete buttons - read-only mode
    const editDeleteSection = document.getElementById('playerEditDelete');
    if (editDeleteSection) {
        editDeleteSection.innerHTML = '';
    }
    
    document.getElementById('playerModal').classList.add('show');
}
