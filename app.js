// State
let currentTab = 'overall';
let discordLink = 'https://discord.gg';
let isAdminLoggedIn = false;
let editingPlayerId = null;

// Admin credentials (stored locally - you can add more)
const ADMIN_CREDENTIALS = [
    { email: 'redlineproductionss@gmail.com', password: 'r51684420' }
    // Add more admins like: { email: 'user@example.com', password: 'pass123' }
];

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
    renderLeaderboards();
    setupEventListeners();
});

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

    document.getElementById('adminBtn').addEventListener('click', () => {
        if (isAdminLoggedIn) {
            openAdminPanel();
        } else {
            showAdminLoginModal();
        }
    });

    document.getElementById('addPlayerBtn').addEventListener('click', () => {
        editingPlayerId = null;
        openAddPlayerModal();
    });

    // Add/Edit player form
    document.getElementById('addPlayerForm').addEventListener('submit', (e) => {
        e.preventDefault();
        handleAddOrEditPlayer();
    });

    // Admin login form
    if (document.getElementById('adminLoginForm')) {
        document.getElementById('adminLoginForm').addEventListener('submit', (e) => {
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

// Admin login handler
function handleAdminLogin() {
    const email = document.getElementById('adminEmail').value.trim();
    const password = document.getElementById('adminPassword').value.trim();

    console.log('Login attempt:', email);
    console.log('Credentials available:', ADMIN_CREDENTIALS);

    // Check credentials
    const isValid = ADMIN_CREDENTIALS.some(admin => 
        admin.email === email && admin.password === password
    );

    if (isValid) {
        console.log('Login successful!');
        isAdminLoggedIn = true;
        localStorage.setItem('adminLoggedIn', 'true');
        document.getElementById('adminLoginModal').classList.remove('show');
        document.getElementById('adminLoginForm').reset();
        openAdminPanel();
    } else {
        console.log('Login failed - invalid credentials');
        alert('Invalid email or password!');
        document.getElementById('adminLoginForm').reset();
    }
}

// Show admin login modal
function showAdminLoginModal() {
    console.log('Opening login modal');
    document.getElementById('adminLoginModal').classList.add('show');
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
    
    const sortedPlayers = getPlayersSortedBy(category);
    
    if (sortedPlayers.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 40px;">No players yet. Add one in the Admin Panel!</p>';
        return;
    }

    container.innerHTML = sortedPlayers.map((player, index) => {
        const rank = index + 1;
        const points = category === 'overall' ? calculatePlayerPoints(player) :
                       category === 'long-range' ? getPointsForTier(player.longRangeTier) :
                       getPointsForTier(player.cqcTier);

        const regionConfig = REGION_CONFIG[player.region] || { abbr: 'UN', color: '#999' };

        let rankClass = 'rank-other';
        if (rank === 1) rankClass = 'rank-1';
        else if (rank === 2) rankClass = 'rank-2';
        else if (rank === 3) rankClass = 'rank-3';

        return `
            <div class="player-row" onclick="openPlayerModal(${player.id})">
                <div class="rank-badge ${rankClass}">${rank}</div>
                <img src="${player.avatar}" alt="${player.username}" class="player-avatar" onerror="this.src='https://www.roblox.com/avatar/?userId=0&format=png&size=150x150'">
                <div class="player-info-section">
                    <div class="player-name">${player.username}</div>
                    <div class="player-meta">${player.faction}</div>
                </div>
                <div class="player-points-display">${points} pts</div>
                <div class="player-tiers">
                    <span class="tier-small">${player.longRangeTier}</span>
                    <span class="tier-small" style="background: ${player.cqcTier === 'N/A' ? '#666' : 'var(--accent-purple)'}; border-color: ${player.cqcTier === 'N/A' ? '#666' : 'var(--accent-purple)'}">${player.cqcTier}</span>
                </div>
                <div class="region-badge" style="background: ${regionConfig.color}">${regionConfig.abbr}</div>
            </div>
        `;
    }).join('');
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

    container.innerHTML = results.map((player, index) => {
        const points = currentTab === 'overall' ? calculatePlayerPoints(player) :
                       currentTab === 'long-range' ? getPointsForTier(player.longRangeTier) :
                       getPointsForTier(player.cqcTier);

        const regionConfig = REGION_CONFIG[player.region] || { abbr: 'UN', color: '#999' };

        return `
            <div class="player-row" onclick="openPlayerModal(${player.id})">
                <img src="${player.avatar}" alt="${player.username}" class="player-avatar" onerror="this.src='https://www.roblox.com/avatar/?userId=0&format=png&size=150x150'">
                <div class="player-info-section">
                    <div class="player-name">${player.username}</div>
                    <div class="player-meta">${player.faction}</div>
                </div>
                <div class="player-points-display">${points} pts</div>
                <div class="player-tiers">
                    <span class="tier-small">${player.longRangeTier}</span>
                    <span class="tier-small" style="background: ${player.cqcTier === 'N/A' ? '#666' : 'var(--accent-purple)'}; border-color: ${player.cqcTier === 'N/A' ? '#666' : 'var(--accent-purple)'}">${player.cqcTier}</span>
                </div>
                <div class="region-badge" style="background: ${regionConfig.color}">${regionConfig.abbr}</div>
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
    document.getElementById('playerPoints').textContent = `${calculatePlayerPoints(player)} TOTAL POINTS`;
    
    const longRangePoints = getPointsForTier(player.longRangeTier);
    const cqcPoints = player.cqcTier === 'N/A' ? 'N/A' : getPointsForTier(player.cqcTier);
    
    document.getElementById('playerLongRange').innerHTML = `<span class="tier-badge">${player.longRangeTier}- ${longRangePoints}pts</span>`;
    document.getElementById('playerCQC').innerHTML = `<span class="tier-badge" style="background: ${player.cqcTier === 'N/A' ? '#666' : 'var(--accent-purple)'};">${player.cqcTier}${player.cqcTier !== 'N/A' ? '- ' + cqcPoints + 'pts' : ''}</span>`;
    
    document.getElementById('playerModal').classList.add('show');
}

// Admin panel
function openAdminPanel() {
    const count = players.length;
    document.querySelector('.admin-modal h2').innerHTML = `Admin Panel (${count} players)`;
    document.getElementById('discordLink').value = discordLink;
    renderPlayersList();
    document.getElementById('adminModal').classList.add('show');
}

function renderPlayersList() {
    const list = document.getElementById('playersList');
    
    if (players.length === 0) {
        list.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 20px;">No players added yet.</p>';
        return;
    }

    list.innerHTML = players.map(player => `
        <div class="player-item">
            <div class="player-item-info">
                <img src="${player.avatar}" alt="${player.username}" class="player-item-avatar" onerror="this.src='https://www.roblox.com/avatar/?userId=0&format=png&size=150x150'">
                <div class="player-item-details">
                    <div class="player-item-name">${player.username}</div>
                    <div class="player-item-region">${player.region}</div>
                </div>
            </div>
            <div class="player-item-actions">
                <button class="player-item-btn edit" onclick="startEditPlayer(event, ${player.id})" title="Edit">✏️</button>
                <button class="player-item-btn delete" onclick="deletePlayerConfirm(event, ${player.id})" title="Delete">🗑️</button>
            </div>
        </div>
    `).join('');
}

// Add player
function openAddPlayerModal() {
    document.getElementById('addPlayerForm').reset();
    document.querySelector('#addPlayerModal h2').textContent = 'Add New Player';
    document.getElementById('addPlayerModal').classList.add('show');
}

// Start edit player
function startEditPlayer(event, playerId) {
    event.stopPropagation();
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
}

// Handle add or edit player
async function handleAddOrEditPlayer() {
    const username = document.getElementById('username').value.trim();
    const avatarUrl = document.getElementById('avatarUrl').value.trim();
    const region = document.getElementById('region').value;
    const faction = document.getElementById('faction').value.trim();
    const longRangeTier = document.getElementById('longRangeTier').value;
    const cqcTier = document.getElementById('cqcTier').value;
    const notes = document.getElementById('notes').value.trim();

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
        cqcTier,
        notes
    };

    let result;
    if (editingPlayerId) {
        // Edit existing player
        result = await updatePlayer(editingPlayerId, playerData);
        if (result) {
            alert('Player updated successfully!');
        } else {
            alert('Error updating player. Please try again.');
        }
    } else {
        // Add new player
        result = await addPlayer(playerData);
        if (result) {
            alert('Player added successfully!');
        } else {
            alert('Error adding player. Please try again.');
        }
    }

    if (result) {
        document.getElementById('addPlayerForm').reset();
        document.getElementById('addPlayerModal').classList.remove('show');
        renderLeaderboards();
        renderPlayersList();
        editingPlayerId = null;
    }
}

// Delete player
async function deletePlayerConfirm(event, playerId) {
    event.stopPropagation();
    if (confirm('Are you sure you want to delete this player?')) {
        const result = await deletePlayer(playerId);
        if (result) {
            renderLeaderboards();
            renderPlayersList();
        } else {
            alert('Error deleting player. Please try again.');
        }
    }
}

// Discord link
function loadDiscordLink() {
    const saved = localStorage.getItem('discordLink');
    if (saved) discordLink = saved;
}

// Check if admin is logged in on page load
window.addEventListener('load', () => {
    if (localStorage.getItem('adminLoggedIn') === 'true') {
        isAdminLoggedIn = true;
    }
});