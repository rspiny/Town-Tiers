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
        discordBtn.addEventListener('click', async () => {
            try {
                const response = await fetch('/api/config');
                const config = await response.json();
                if (config.discordLink) {
                    window.open(config.discordLink, '_blank');
                }
            } catch (error) {
                console.error('Error fetching Discord link:', error);
                window.open('https://discord.gg', '_blank');
            }
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

// ===== Tier guide button + popup =====
// Adds a "Tiers" button next to the search bar. Clicking it opens a popup
// listing every tier from worst to best, built automatically from TIER_POINTS
// in data.js (so new tiers like MT show up by themselves).
document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput');
    if (!searchInput || typeof TIER_POINTS === 'undefined') return;

    // Styles for the button and popup
    const style = document.createElement('style');
    style.textContent = `
        #tierGuideBtn {
            margin-left: 10px;
            padding: 10px 16px;
            border: none;
            border-radius: 8px;
            background: var(--accent-purple, #b44cff);
            color: #fff;
            font-weight: 700;
            cursor: pointer;
        }
        #tierGuideBtn:hover { opacity: 0.85; }
        #tierGuideOverlay {
            display: none;
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.7);
            z-index: 9999;
            align-items: center;
            justify-content: center;
        }
        #tierGuideOverlay.show { display: flex; }
        #tierGuideBox {
            background: #1a1a1a;
            border: 1px solid #333;
            border-radius: 12px;
            width: 90%;
            max-width: 360px;
            max-height: 80vh;
            overflow-y: auto;
            padding: 20px;
            color: #fff;
        }
        #tierGuideBox .tg-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 4px;
        }
        #tierGuideBox h3 { margin: 0; font-size: 18px; }
        #tierGuideBox .tg-close {
            background: none;
            border: none;
            color: #aaa;
            font-size: 24px;
            cursor: pointer;
            line-height: 1;
        }
        #tierGuideBox .tg-sub {
            color: #999;
            font-size: 13px;
            margin: 0 0 14px 0;
        }
        #tierGuideBox .tg-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 12px;
            border-bottom: 1px solid #2a2a2a;
        }
        #tierGuideBox .tg-name { font-weight: 700; }
        #tierGuideBox .tg-pts { color: #999; }
        #tierGuideBox .tg-legend {
            color: #777;
            font-size: 12px;
            margin: 14px 0 0 0;
        }
    `;
    document.head.appendChild(style);

    // The button, placed right after the search bar
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.id = 'tierGuideBtn';
    btn.textContent = 'Tiers';
    searchInput.insertAdjacentElement('afterend', btn);

    // The popup
    const overlay = document.createElement('div');
    overlay.id = 'tierGuideOverlay';

    const box = document.createElement('div');
    box.id = 'tierGuideBox';

    const header = document.createElement('div');
    header.className = 'tg-header';
    const title = document.createElement('h3');
    title.textContent = 'All Tiers';
    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'tg-close';
    closeBtn.textContent = '\u00D7';
    header.appendChild(title);
    header.appendChild(closeBtn);

    const sub = document.createElement('p');
    sub.className = 'tg-sub';
    sub.textContent = 'Worst \u2192 Best';

    box.appendChild(header);
    box.appendChild(sub);

    // Sort by points, lowest first (worst to best)
    Object.entries(TIER_POINTS)
        .sort((a, b) => a[1] - b[1])
        .forEach(([tier, points]) => {
            const row = document.createElement('div');
            row.className = 'tg-row';
            const name = document.createElement('span');
            name.className = 'tg-name';
            name.textContent = tier;
            const pts = document.createElement('span');
            pts.className = 'tg-pts';
            pts.textContent = points + ' pts';
            row.appendChild(name);
            row.appendChild(pts);
            box.appendChild(row);
        });

    const legend = document.createElement('p');
    legend.className = 'tg-legend';
    legend.textContent = 'LT = Low Tier, MT = Medium Tier, HT = High Tier';
    box.appendChild(legend);

    overlay.appendChild(box);
    document.body.appendChild(overlay);

    // Open / close behaviour
    const open = () => overlay.classList.add('show');
    const close = () => overlay.classList.remove('show');
    btn.addEventListener('click', open);
    closeBtn.addEventListener('click', close);
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) close();
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') close();
    });
});
