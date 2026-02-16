// NBA Playoff Oracle - Main JavaScript File

// Configuration
const API_BASE_URL = ''; // Empty because we're using relative paths
const PREDICTIONS_FILE = 'predictions.json';
const REFRESH_INTERVAL = 300000; // 5 minutes (300,000 ms)

// State management
let playoffData = null;
let lastUpdated = null;
let teamsData = [];

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    console.log('NBA Playoff Oracle initializing...');
    loadPredictions();
    setupAutoRefresh();
    initializeEventListeners();
});

/**
 * Load predictions from JSON file
 */
function loadPredictions() {
    showLoadingState();
    
    fetch(PREDICTIONS_FILE)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Predictions loaded successfully:', data);
            validateAndProcessData(data);
            hideLoadingState();
            updateLastUpdated();
        })
        .catch(error => {
            console.error('Error loading predictions:', error);
            showErrorState('Failed to load playoff predictions. Please try again later.');
        });
}

/**
 * Validate and process the incoming data
 */
function validateAndProcessData(data) {
    // Check if data has the expected structure
    if (!data.teams || !Array.isArray(data.teams)) {
        throw new Error('Invalid data format: teams array not found');
    }

    // Store the data
    playoffData = data;
    teamsData = data.teams;
    lastUpdated = data.lastUpdated || new Date().toISOString();

    // Render the teams
    renderTeams(teamsData);
    
    // Update any summary statistics
    updateSummaryStats(teamsData);
}

/**
 * Render teams to the DOM
 */
function renderTeams(teams) {
    const container = document.getElementById('teams-container');
    if (!container) {
        console.error('Teams container not found!');
        return;
    }

    // Clear existing content
    container.innerHTML = '';

    // Sort teams by probability (highest first)
    const sortedTeams = [...teams].sort((a, b) => b.probability - a.probability);

    // Render each team
    sortedTeams.forEach(team => {
        const teamCard = createTeamCard(team);
        container.appendChild(teamCard);
    });

    // Log rendering completion
    console.log(`Rendered ${teams.length} teams`);
}

/**
 * Create an individual team card element
 */
function createTeamCard(team) {
    const card = document.createElement('div');
    card.className = 'team-card';
    card.setAttribute('data-team-id', team.id || team.name.replace(/\s+/g, '-').toLowerCase());

    // Determine probability color class
    const probabilityClass = getProbabilityClass(team.probability);

    // Build card HTML
    card.innerHTML = `
        <div class="team-header">
            ${team.logo ? `<img src="${team.logo}" alt="${team.name} logo" class="team-logo">` : ''}
            <h3 class="team-name">${team.name}</h3>
        </div>
        <div class="team-details">
            <div class="probability-container">
                <div class="probability-label">Playoff Probability</div>
                <div class="probability-value ${probabilityClass}">${team.probability}%</div>
                <div class="probability-bar">
                    <div class="probability-fill" style="width: ${team.probability}%"></div>
                </div>
            </div>
            <div class="team-stats">
                ${team.record ? `<div class="stat">Record: ${team.record}</div>` : ''}
                ${team.standing ? `<div class="stat">Conference: ${team.standing}</div>` : ''}
                ${team.gamesBack ? `<div class="stat">GB: ${team.gamesBack}</div>` : ''}
            </div>
        </div>
    `;

    // Add click event for detailed view
    card.addEventListener('click', () => showTeamDetails(team));

    return card;
}

/**
 * Determine CSS class based on probability value
 */
function getProbabilityClass(probability) {
    if (probability >= 90) return 'probability-high';
    if (probability >= 60) return 'probability-medium';
    if (probability >= 40) return 'probability-bubble';
    if (probability >= 10) return 'probability-low';
    return 'probability-eliminated';
}

/**
 * Show detailed team information
 */
function showTeamDetails(team) {
    console.log('Showing details for:', team.name);
    
    // Create modal or expand card with detailed info
    const detailModal = document.createElement('div');
    detailModal.className = 'team-detail-modal';
    detailModal.innerHTML = `
        <div class="modal-content">
            <span class="close-modal">&times;</span>
            <h2>${team.name} - Detailed Analysis</h2>
            <div class="detail-stats">
                <div class="stat-group">
                    <h3>Playoff Probability: ${team.probability}%</h3>
                    <p>${getProbabilityDescription(team.probability)}</p>
                </div>
                ${team.keyFactors ? `
                <div class="stat-group">
                    <h3>Key Factors</h3>
                    <ul>
                        ${team.keyFactors.map(factor => `<li>${factor}</li>`).join('')}
                    </ul>
                </div>` : ''}
                ${team.recentTrend ? `
                <div class="stat-group">
                    <h3>Recent Trend</h3>
                    <p>${team.recentTrend}</p>
                </div>` : ''}
            </div>
        </div>
    `;

    document.body.appendChild(detailModal);
    
    // Close modal functionality
    const closeBtn = detailModal.querySelector('.close-modal');
    closeBtn.onclick = () => detailModal.remove();
    window.onclick = (event) => {
        if (event.target === detailModal) {
            detailModal.remove();
        }
    };
}

/**
 * Get descriptive text for probability ranges
 */
function getProbabilityDescription(probability) {
    if (probability >= 90) return 'Lock for playoffs - barring catastrophe';
    if (probability >= 75) return 'Strong position - very likely to make it';
    if (probability >= 60) return 'Good position - control their own destiny';
    if (probability >= 50) return 'Coin flip - every game matters';
    if (probability >= 40) return 'Bubble team - need to make a push';
    if (probability >= 25) return 'Outside looking in - need help';
    if (probability >= 10) return 'Long shot - need miracle run';
    return 'Mathematically eliminated or extreme long shot';
}

/**
 * Update summary statistics
 */
function updateSummaryStats(teams) {
    const summaryContainer = document.getElementById('summary-stats');
    if (!summaryContainer) return;

    const totalTeams = teams.length;
    const avgProbability = teams.reduce((sum, team) => sum + team.probability, 0) / totalTeams;
    const locks = teams.filter(t => t.probability >= 90).length;
    const bubble = teams.filter(t => t.probability >= 40 && t.probability < 60).length;
    const eliminated = teams.filter(t => t.probability < 10).length;

    summaryContainer.innerHTML = `
        <div class="summary-grid">
            <div class="summary-item">
                <span class="summary-label">Average Probability</span>
                <span class="summary-value">${avgProbability.toFixed(1)}%</span>
            </div>
            <div class="summary-item">
                <span class="summary-label">Locks (90%+)</span>
                <span class="summary-value">${locks}</span>
            </div>
            <div class="summary-item">
                <span class="summary-label">Bubble Teams</span>
                <span class="summary-value">${bubble}</span>
            </div>
            <div class="summary-item">
                <span class="summary-label">Eliminated/Long Shots</span>
                <span class="summary-value">${eliminated}</span>
            </div>
        </div>
    `;
}

/**
 * Update the "last updated" timestamp
 */
function updateLastUpdated() {
    const lastUpdatedEl = document.getElementById('last-updated');
    if (lastUpdatedEl) {
        const date = lastUpdated ? new Date(lastUpdated) : new Date();
        lastUpdatedEl.textContent = date.toLocaleString();
    }
}

/**
 * Show loading state while fetching data
 */
function showLoadingState() {
    const container = document.getElementById('teams-container');
    if (container) {
        container.innerHTML = `
            <div class="loading-spinner">
                <div class="spinner"></div>
                <p>Loading playoff predictions...</p>
            </div>
        `;
    }
}

/**
 * Hide loading state
 */
function hideLoadingState() {
    // Loading state is automatically replaced when rendering teams
}

/**
 * Show error state if data fails to load
 */
function showErrorState(message) {
    const container = document.getElementById('teams-container');
    if (container) {
        container.innerHTML = `
            <div class="error-message">
                <p>⚠️ ${message}</p>
                <button onclick="loadPredictions()" class="retry-button">
                    Try Again
                </button>
            </div>
        `;
    }
}

/**
 * Set up automatic refresh of data
 */
function setupAutoRefresh() {
    setInterval(() => {
        console.log('Auto-refreshing predictions...');
        loadPredictions();
    }, REFRESH_INTERVAL);
}

/**
 * Initialize event listeners for UI interactions
 */
function initializeEventListeners() {
    // Refresh button
    const refreshBtn = document.getElementById('refresh-button');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', (e) => {
            e.preventDefault();
            loadPredictions();
        });
    }

    // Filter buttons (if implemented)
    const filterBtns = document.querySelectorAll('.filter-button');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const filter = e.target.dataset.filter;
            filterTeams(filter);
        });
    });

    // Search input (if implemented)
    const searchInput = document.getElementById('team-search');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchTeams(e.target.value);
        });
    }
}

/**
 * Filter teams by criteria
 */
function filterTeams(criteria) {
    if (!teamsData.length) return;

    let filteredTeams = [...teamsData];
    
    switch(criteria) {
        case 'locks':
            filteredTeams = teamsData.filter(t => t.probability >= 90);
            break;
        case 'bubble':
            filteredTeams = teamsData.filter(t => t.probability >= 40 && t.probability < 60);
            break;
        case 'longshots':
            filteredTeams = teamsData.filter(t => t.probability < 40);
            break;
        default:
            filteredTeams = teamsData;
    }

    renderTeams(filteredTeams);
}

/**
 * Search teams by name
 */
function searchTeams(query) {
    if (!query.trim() || !teamsData.length) {
        renderTeams(teamsData);
        return;
    }

    const searchTerm = query.toLowerCase().trim();
    const filteredTeams = teamsData.filter(team => 
        team.name.toLowerCase().includes(searchTerm)
    );

    renderTeams(filteredTeams);
}

/**
 * Manual refresh function (can be called from console)
 */
function refreshPredictions() {
    loadPredictions();
}

// Export functions for testing (if using modules)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        loadPredictions,
        filterTeams,
        searchTeams,
        getProbabilityClass
    };
}