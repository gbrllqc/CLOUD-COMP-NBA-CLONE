// NBA Playoff Oracle - Main JavaScript

// Configuration
const CONFIG = {
    predictionsFile: 'predictions.json',
    refreshInterval: 300000, // 5 minutes
    animationDuration: 500,
    defaultConference: 'all',
    defaultFilter: 'all'
};

// State Management
let state = {
    teams: [],
    filteredTeams: [],
    lastUpdated: null,
    currentConference: CONFIG.defaultConference,
    currentFilter: CONFIG.defaultFilter,
    searchQuery: '',
    isLoading: true,
    error: null
};

// DOM Elements
const elements = {
    teamsContainer: document.getElementById('teams-container'),
    lastUpdated: document.getElementById('last-updated'),
    teamSearch: document.getElementById('team-search'),
    probabilityFilter: document.getElementById('probability-filter'),
    refreshButton: document.getElementById('refresh-button'),
    lockCount: document.getElementById('lock-count'),
    bubbleCount: document.getElementById('bubble-count'),
    longshotCount: document.getElementById('longshot-count'),
    eliminatedCount: document.getElementById('eliminated-count'),
    tabButtons: document.querySelectorAll('.tab-button')
};

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
    console.log('🏀 NBA Playoff Oracle initializing...');
    initializeApp();
});

/**
 * Initialize the application
 */
async function initializeApp() {
    setupEventListeners();
    await loadPredictions();
    setupAutoRefresh();
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
    // Search input
    if (elements.teamSearch) {
        elements.teamSearch.addEventListener('input', debounce((e) => {
            state.searchQuery = e.target.value.toLowerCase();
            filterAndRenderTeams();
        }, 300));
    }

    // Probability filter
    if (elements.probabilityFilter) {
        elements.probabilityFilter.addEventListener('change', (e) => {
            state.currentFilter = e.target.value;
            filterAndRenderTeams();
        });
    }

    // Refresh button
    if (elements.refreshButton) {
        elements.refreshButton.addEventListener('click', (e) => {
            e.preventDefault();
            refreshData();
        });
    }

    // Conference tabs
    elements.tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const conference = button.dataset.conference;
            switchConference(conference);
        });
    });
}

/**
 * Switch conference tab
 */
function switchConference(conference) {
    state.currentConference = conference;
    
    // Update active tab
    elements.tabButtons.forEach(btn => {
        if (btn.dataset.conference === conference) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    filterAndRenderTeams();
}

/**
 * Load predictions from JSON file
 */
async function loadPredictions() {
    showLoading();
    
    try {
        const response = await fetch(CONFIG.predictionsFile);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data.teams || !Array.isArray(data.teams)) {
            throw new Error('Invalid data format: teams array not found');
        }
        
        // Process and enrich team data
        state.teams = data.teams.map(team => ({
            ...team,
            probabilityClass: getProbabilityClass(team.probability),
            trend: determineTrend(team),
            displayName: formatTeamName(team.name),
            id: team.id || team.name.replace(/\s+/g, '-').toLowerCase()
        }));
        
        state.lastUpdated = data.lastUpdated || new Date().toISOString();
        state.error = null;
        
        filterAndRenderTeams();
        updateLastUpdated();
        updateSummaryStats();
        
    } catch (error) {
        console.error('Error loading predictions:', error);
        state.error = error.message;
        showError(error.message);
    } finally {
        state.isLoading = false;
    }
}

/**
 * Filter teams based on current criteria
 */
function filterTeams() {
    let filtered = [...state.teams];
    
    // Filter by conference
    if (state.currentConference !== 'all') {
        filtered = filtered.filter(team => 
            team.conference?.toLowerCase() === state.currentConference
        );
    }
    
    // Filter by probability
    if (state.currentFilter !== 'all') {
        filtered = filtered.filter(team => {
            switch(state.currentFilter) {
                case 'high':
                    return team.probability >= 90;
                case 'medium':
                    return team.probability >= 60 && team.probability < 90;
                case 'bubble':
                    return team.probability >= 40 && team.probability < 60;
                case 'low':
                    return team.probability >= 10 && team.probability < 40;
                case 'eliminated':
                    return team.probability < 10;
                default:
                    return true;
            }
        });
    }
    
    // Filter by search query
    if (state.searchQuery) {
        filtered = filtered.filter(team =>
            team.name.toLowerCase().includes(state.searchQuery) ||
            team.displayName.toLowerCase().includes(state.searchQuery)
        );
    }
    
    return filtered;
}

/**
 * Filter and render teams
 */
function filterAndRenderTeams() {
    const filtered = filterTeams();
    state.filteredTeams = filtered;
    renderTeams(filtered);
}

/**
 * Render teams to the DOM
 */
function renderTeams(teams) {
    if (!elements.teamsContainer) return;
    
    if (teams.length === 0) {
        renderEmptyState();
        return;
    }
    
    // Clear container
    elements.teamsContainer.innerHTML = '';
    
    // Render each team card
    teams.forEach(team => {
        const card = createTeamCard(team);
        elements.teamsContainer.appendChild(card);
    });
    
    console.log(`✅ Rendered ${teams.length} teams`);
}

/**
 * Create a team card element
 */
function createTeamCard(team) {
    const card = document.createElement('div');
    card.className = 'team-card';
    card.dataset.teamId = team.id;
    card.dataset.probability = team.probabilityClass;
    
    // Determine trend icon
    const trendIcon = getTrendIcon(team.trend);
    
    card.innerHTML = `
        <div class="team-card-header">
            <img src="${team.logo || 'https://via.placeholder.com/60?text=NBA'}" 
                 alt="${team.name} logo" 
                 class="team-logo"
                 onerror="this.src='https://via.placeholder