// State
let currentTab = 'overall';
let discordLink = 'https://discord.gg';
let isAdminLoggedIn = false;
let editingPlayerId = null;

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

// Initialize app
document.addEventListener('DOMContentLoaded', async () => {
    await initializePlayers();
    loadDiscordLink();
    checkAdminStatus();
    renderLeaderboards();
    setupEventListeners();
});

// Check if user is already logged in (sessionStorage)
function checkAdminStatus() {
    const token = sessionStorage.getItem('admin_token');
    isAdminLoggedIn = token !== null && token !== undefined;
    updateAdminUI();
}

// Update UI based on admin status
function updateAdminUI() {
    const adminBtn = document.getElementById('adminBtn');
    if (adminBtn) {
        if (isAdminLoggedIn) {
            adminBtn.textContent = '👤 Admin Panel';
            adminBtn.style.backgroundColor = '#667eea';
        } else {
            adminBtn.textContent = '🔐 Admin Login';
            adminBtn.style.backgroundColor = '#666';
        }
    }
}

// Event listeners
function setupEventListeners() {
    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            switchTab(e.target.dataset.tab);
        });
    });

    // Search
    document.getElementById('searchInput').addEventListener('input', (e) => {
        handleSearch(e.target.value);
    });

    // Modals
    document.getElementById('discordBtn').addEventListener('click', () => {
        if (discordLink) window.open(discordLink, '_blank');
    });

    // Admin button - Login or open admin panel
    const adminBtn = document.getElementById('adminBtn');
    if (adminBtn) {
        adminBtn.addEventListener('click', () => {
            if (isAdminLoggedIn) {
                openAdminModal();
            } else {
                openAdminLoginModal();
            }
        });
    }

    document.getElementById('addPlayerBtn').addEventListener('click', () => {
        if (!isAdminLoggedIn) {
            alert('You must be logged in as an admin to add players.');
            return;
        }
        editingPlayerId = null;
        openAddPlayerModal();
    });

    // Add/Edit player form
    document.getElementById('addPlayerForm').addEventListener('submit', (e) => {
        e.preventDefault();
        handleAddOrEditPlayer();
    });

    // Admin login form
    const adminLoginForm = document.getElementById('adminLoginForm');
    if (adminLoginForm) {
        adminLoginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            handleAdminLogin();
        });
    }

    // Discord link save
    document.getElementById('saveLinkBtn').addEventListener('click', () => {
        const link = document.getElementById('discordLink').value;
        if (link) {
            discordLink = link;
            localStorage.setItem('discordLink', link);
            alert('Discord link saved!');
        }
    });

    // Logout button
    const logoutBtn = document.getElementById('adminLogoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            handleAdminLogout();
        });
    }

    // Close buttons - specific modal handling
    document.querySelectorAll('.close').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const modal = e.target.closest('.modal');
            modal.classList.remove('show');
            
            // Reset form if it exists
            if (modal.id === 'addPlayerModal' && document.getElementById('addPlayerForm')) {
                document.getElementById('addPlayerForm').reset();
                editingPlayerId = null;
            }
            if (modal.id === 'adminLoginModal' && document.getElementById('adminLoginForm')) {
                document.getElementById('adminLoginForm').reset();
            }
        });
    });

    document.getElementById('cancelAddBtn').addEventListener('click', () => {
        document.getElementById('addPlayerModal').classList.remove('show');
        document.getElementById('addPlayerForm').reset();
        editingPlayerId = null;
    });

    // Modal click outside to close
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.classList.remove('show');
            if (document.getElementById('addPlayerForm')) {
                document.getElementById('addPlayerForm').reset();
                editingPlayerId = null;
            }
        }
    });
}

/**
 * Handle admin login
 */
async function handleAdminLogin() {
    const email = document.getElementById('adminEmail').value.trim();
    const password = document.getElementById('adminPassword').value;

    if (!email || !password) {
        alert('Please enter both email and password.');
        return;
    }

    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            alert(`Login failed: ${data.error || 'Invalid credentials'}`);
            return;
        }

        // Store token in sessionStorage (temporary, clears on browser close)
        setAdminToken(data.token);
        isAdminLoggedIn = true;
        updateAdminUI();

        // Close login modal
        document.getElementById('adminLoginModal').classList.remove('show');
        document.getElementById('adminLoginForm').reset();

        alert(`Welcome back, ${data.email}!`);
        openAdminModal();
    } catch (error) {
        console.error('Login error:', error);
        alert(`Error: ${error.message}`);
    }
}

/**
 * Handle admin logout
 */
function handleAdminLogout() {
    if (confirm('Are you sure you want to logout?')) {
        clearAdminToken();
        isAdminLoggedIn = false;
        updateAdminUI();
        document.getElementById('adminModal').classList.remove('show');
        alert('You have been logged out.');
    }
}

// Tab switching
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

// Render leaderboards
function renderLeaderboards() {
    renderLeaderboard('overall');
    renderLeaderboard('long-range');
    renderLeaderboard('cqc');
}

function renderLeaderboard(category) {
    const elementId = category === 'overall' ? 'overallLeaderboard' : 
                      category === 'long-range' ? 'longRangeLeaderboard' : 
                      'cqcLeaderboard';
    const container = document.getElementById(elementId);
    
    // Check for API error
    if (apiError && players.length === 0) {
        container.innerHTML = `<p style="text-align: center; color: #ff6b6b; padding: 40px;">⚠️ Unable to load leaderboard data. ${apiError}</p>`;
        return;
    }

    const sortedPlayers = getPlayersSortedBy(category);
    
    if (sortedPlayers.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 40px;">No players yet.</p>';
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
                    <span class="tier-small" style="background: ${player.cqcTier === 'N/A' ? '#666' : 'var(--accent-purple)'}; border-color: ${player.cqcTier === 'N/A' ? '#666' : 'var(--accent-pu)'};">${player.cqcTier}</span>
                </div>
            </div>
        `;
    }).join('');

    container.innerHTML = header + rows;
}

// Search handling
function handleSearch(query) {
    const container = document.getElementById(currentTab === 'overall' ? 'overallLeaderboard' : 
                                             currentTab === 'long-range' ? 'longRangeLeaderboard' : 
                                             'cqcLeaderboard');
    
    if (!query) {
        renderLeaderboard(currentTab);
        return;
    }

    const results = searchPlayers(query);
    
    if (results.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 40px;">No players found.</p>';
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

    container.innerHTML = header + results.map((player, index) => {
        const regionConfig = REGION_CONFIG[player.region] || { abbr: 'UN', color: '#999' };

        return `
            <div class="player-row" onclick="openPlayerModal(${player.id})">
                <div class="rank-badge rank-other" aria-label="N/A">—</div>
                <div class="player-info-section">
                    <img src="${player.avatar}" alt="${player.username}" class="player-avatar" onerror="this.src='https://www.roblox.com/avatar/?userId=0&format=png&size=150x150'">
                    <div class="player-name">${player.username}</div>
                </div>
                <div class="region-badge" style="background: ${regionConfig.color}">${regionConfig.abbr}</div>
                <div class="player-tiers">
                    <span class="tier-small">${player.longRangeTier}</span>
                    <span class="tier-small" style="background: ${player.cqcTier === 'N/A' ? '#666' : 'var(--accent-purple)'}; border-color: ${player.cqcTier === 'N/A' ? '#666' : 'var(--accent-pu)'};">${player.cqcTier}</span>
                </div>
            </div>
        `;
    }).join('');
}

// Player modal
function openPlayerModal(playerId) {
    const player = players.find(p => p.id === playerId);
    if (!player) return;

    document.getElementById('playerName').textContent = player.username;
    document.getElementById('playerAvatar').src = player.avatar;
    document.getElementById('playerRegion').textContent = player.region;
    document.getElementById('playerFaction').textContent = player.faction !== 'N/A' ? player.faction : '';
    document.getElementById('playerFaction').style.display = player.faction !== 'N/A' ? '' : 'none';
    document.getElementById('playerPoints').textContent = `${calculatePlayerPoints(player)} TOTAL POINTS`;
    
    const longRangePoints = getPointsForTier(player.longRangeTier);
    const cqcPoints = player.cqcTier === 'N/A' ? 'N/A' : getPointsForTier(player.cqcTier);
    
    document.getElementById('playerLongRange').innerHTML = `<span class="tier-badge">${player.longRangeTier} - ${longRangePoints}pts</span>`;
    document.getElementById('playerCQC').innerHTML = `<span class="tier-badge" style="${player.cqcTier === 'N/A' ? 'background: #666; border-color: #666; color: #ccc;' : ''}">${player.cqcTier} - ${cqcPoints}pts</span>`;
    
    // Only show edit/delete if admin is logged in
    const editDeleteSection = document.getElementById('playerEditDelete');
    if (editDeleteSection) {
        if (isAdminLoggedIn) {
            editDeleteSection.innerHTML = `
                <button class="btn btn-edit" onclick="startEditPlayer(event, ${player.id})">✎ Edit</button>
                <button class="btn btn-delete" onclick="deletePlayerConfirm(event, ${player.id})">🗑 Delete</button>
            `;
        } else {
            editDeleteSection.innerHTML = '';
        }
    }
    
    document.getElementById('playerModal').classList.add('show');
}

// Add player
function openAddPlayerModal() {
    document.getElementById('addPlayerForm').reset();
    document.querySelector('#addPlayerModal h2').textContent = 'Add New Player';
    document.getElementById('addPlayerModal').classList.add('show');
}

// Open admin login modal
function openAdminLoginModal() {
    document.getElementById('adminLoginForm').reset();
    document.getElementById('adminLoginModal').classList.add('show');
}

// Open admin panel modal
function openAdminModal() {
    if (!isAdminLoggedIn) {
        alert('You must be logged in to access the admin panel.');
        return;
    }
    document.getElementById('adminModal').classList.add('show');
}

// Start edit player
function startEditPlayer(event, playerId) {
    event.stopPropagation();
    if (!isAdminLoggedIn) {
        alert('You must be logged in as an admin to edit players.');
        return;
    }

    const player = players.find(p => p.id === playerId);
    if (!player) return;

    editingPlayerId = playerId;
    
    // Fill form with player data
    document.getElementById('username').value = player.username;
    document.getElementById('avatarUrl').value = player.avatar;
    document.getElementById('region').value = player.region;
    document.getElementById('faction').value = player.faction === 'N/A' ? '' : player.faction;
    document.getElementById('longRangeTier').value = player.longRangeTier;
    document.getElementById('cqcTier').value = player.cqcTier;
    document.getElementById('notes').value = player.notes || '';
    
    document.querySelector('#addPlayerModal h2').textContent = `Edit ${player.username}`;
    document.getElementById('addPlayerModal').classList.add('show');
    document.getElementById('playerModal').classList.remove('show');
}

// Handle add or edit player
async function handleAddOrEditPlayer() {
    if (!isAdminLoggedIn) {
        alert('Admin authentication required.');
        return;
    }

    const username = document.getElementById('username').value.trim();
    const avatarUrl = document.getElementById('avatarUrl').value.trim();
    const region = document.getElementById('region').value;
    const faction = document.getElementById('faction').value.trim();
    const longRangeTier = document.getElementById('longRangeTier').value;
    const cqcTier = document.getElementById('cqcTier').value;

    if (!username || !region || !longRangeTier || !cqcTier) {
        alert('Please fill in all required fields!');
        return;
    }

    const playerData = {
        username,
        avatar: avatarUrl || 'https://www.roblox.com/avatar/?userId=0&format=png&size=150x150',
        region,
        faction: faction || 'N/A',
        longRangeTier,
        cqcTier
    };

    try {
        let result;
        if (editingPlayerId) {
            // Edit existing player
            result = await updatePlayer(editingPlayerId, playerData);
            if (result) {
                alert('Player updated successfully!');
            }
        } else {
            // Add new player
            result = await addPlayer(playerData);
            if (result) {
                alert('Player added successfully!');
            }
        }

        if (result) {
            document.getElementById('addPlayerForm').reset();
            document.getElementById('addPlayerModal').classList.remove('show');
            renderLeaderboards();
            editingPlayerId = null;
        }
    } catch (error) {
        alert(`Error: ${error.message}`);
    }
}

// Delete player
async function deletePlayerConfirm(event, playerId) {
    event.stopPropagation();
    if (!isAdminLoggedIn) {
        alert('Admin authentication required.');
        return;
    }

    if (confirm('Are you sure you want to delete this player?')) {
        try {
            const result = await deletePlayer(playerId);
            if (result) {
                document.getElementById('playerModal').classList.remove('show');
                renderLeaderboards();
                alert('Player deleted successfully!');
            }
        } catch (error) {
            alert(`Error: ${error.message}`);
        }
    }
}

// Discord link
function loadDiscordLink() {
    const saved = localStorage.getItem('discordLink');
    if (saved) discordLink = saved;
}
