// State
let currentTab = 'overall';
let discordLink = 'https://discord.gg';

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
        openAdminPanel();
    });

    document.getElementById('addPlayerBtn').addEventListener('click', () => {
        openAddPlayerModal();
    });

    // Add player form
    document.getElementById('addPlayerForm').addEventListener('submit', (e) => {
        e.preventDefault();
        handleAddPlayer();
    });

    // Discord link save
    document.getElementById('saveLinkBtn').addEventListener('click', () => {
        const link = document.getElementById('discordLink').value;
        if (link) {
            discordLink = link;
            localStorage.setItem('discordLink', link);
            alert('Discord link saved!');
        }
    });

    // Close buttons
    document.querySelectorAll('.close').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.target.closest('.modal').classList.remove('show');
            if (document.getElementById('addPlayerForm')) {
                document.getElementById('addPlayerForm').reset();
            }
        });
    });

    document.getElementById('cancelAddBtn').addEventListener('click', () => {
        document.getElementById('addPlayerModal').classList.remove('show');
        document.getElementById('addPlayerForm').reset();
    });

    // Modal click outside to close
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.classList.remove('show');
            if (document.getElementById('addPlayerForm')) {
                document.getElementById('addPlayerForm').reset();
            }
        }
    });
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
                    <div class="player-meta">${player.region}${player.faction ? ' • ' + player.faction : ''}</div>
                </div>
                <div class="player-row-points">${points}</div>
                <div class="player-row-chevron">›</div>
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

        return `
            <div class="player-row" onclick="openPlayerModal(${player.id})">
                <img src="${player.avatar}" alt="${player.username}" class="player-avatar" onerror="this.src='https://www.roblox.com/avatar/?userId=0&format=png&size=150x150'">
                <div class="player-info-section">
                    <div class="player-name">${player.username}</div>
                    <div class="player-meta">${player.region}${player.faction ? ' • ' + player.faction : ''}</div>
                </div>
                <div class="player-row-points">${points}</div>
                <div class="player-row-chevron">›</div>
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
    const cqcPoints = player.cqcTier === 'N/A' ? 'N/A' : `${getPointsForTier(player.cqcTier)}pts`;
    
    document.getElementById('playerLongRange').innerHTML = `<span class="tier-badge">${player.longRangeTier}- ${longRangePoints}pts</span>`;
    document.getElementById('playerCQC').innerHTML = `<span class="tier-badge" style="background: ${player.cqcTier === 'N/A' ? '#666' : 'var(--accent-purple)'}">${player.cqcTier}</span>`;
    
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
                <button class="player-item-btn edit" onclick="editPlayer(${player.id})" title="Edit">✏️</button>
                <button class="player-item-btn delete" onclick="deletePlayerConfirm(${player.id})" title="Delete">🗑️</button>
            </div>
        </div>
    `).join('');
}

// Add player
function openAddPlayerModal() {
    document.getElementById('addPlayerForm').reset();
    document.getElementById('addPlayerModal').classList.add('show');
}

async function handleAddPlayer() {
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

    const result = await addPlayer({
        username,
        avatar: avatarUrl || 'https://www.roblox.com/avatar/?userId=0&format=png&size=150x150',
        region,
        faction: faction || 'N/A',
        longRangeTier,
        cqcTier,
        notes
    });

    if (result) {
        document.getElementById('addPlayerForm').reset();
        document.getElementById('addPlayerModal').classList.remove('show');
        renderLeaderboards();
        openAdminPanel();
        alert('Player added successfully!');
    } else {
        alert('Error adding player. Please try again.');
    }
}

// Edit player
function editPlayer(playerId) {
    alert('Edit functionality coming soon!');
}

// Delete player
async function deletePlayerConfirm(playerId) {
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
