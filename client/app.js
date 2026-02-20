// app.js - Fetches predictions.json and populates the table with ALL 30 teams

document.addEventListener('DOMContentLoaded', function() {
    console.log('NBA Oracle initializing...');
    
    // DOM elements
    const tableBody = document.getElementById('tableBody');
    const tabAll = document.getElementById('tabAll');
    const tabEast = document.getElementById('tabEast');
    const tabWest = document.getElementById('tabWest');
    
    let allTeamsData = [];
    let filteredData = [];

    // Show loading state
    if (tableBody) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 40px;">
                    <div class="loading-spinner">Loading 2026 playoff predictions...</div>
                </td>
            </tr>
        `;
    }

    // Complete list of ALL 30 NBA teams by conference
    const eastTeams = [
        'Atlanta Hawks', 'Boston Celtics', 'Brooklyn Nets', 'Charlotte Hornets', 'Chicago Bulls',
        'Cleveland Cavaliers', 'Detroit Pistons', 'Indiana Pacers', 'Miami Heat', 'Milwaukee Bucks',
        'New York Knicks', 'Orlando Magic', 'Philadelphia 76ers', 'Toronto Raptors', 'Washington Wizards'
    ];

    const westTeams = [
        'Dallas Mavericks', 'Denver Nuggets', 'Golden State Warriors', 'Houston Rockets', 'LA Clippers',
        'LA Lakers', 'Memphis Grizzlies', 'Minnesota Timberwolves', 'New Orleans Pelicans', 
        'Oklahoma City Thunder', 'Phoenix Suns', 'Portland Trail Blazers', 'Sacramento Kings', 
        'San Antonio Spurs', 'Utah Jazz'
    ];

    // Function to determine conference
    function getConference(teamName) {
        if (!teamName) return 'West';
        if (eastTeams.includes(teamName)) return 'East';
        if (westTeams.includes(teamName)) return 'West';
        return 'West';
    }

    // Helper function to safely convert value to number
    function safeNumber(value, defaultValue = 0) {
        if (value === undefined || value === null || value === '') {
            return defaultValue;
        }
        const num = Number(value);
        return isNaN(num) ? defaultValue : num;
    }

    // Function to transform your JSON data - SHOWS ALL 30 TEAMS for 2025-26
    function transformData(rawData) {
        if (!rawData || !Array.isArray(rawData)) {
            console.error('Invalid data format:', rawData);
            return [];
        }

        console.log(`Processing ${rawData.length} records to build complete 2025-26 dataset...`);

        // Create a map to store the latest data for each team
        const teamDataMap = new Map();
        
        // First pass: collect all 2025-26 data (your primary predictions)
        rawData.forEach(item => {
            if (item.Season_orig === '2025-26') {
                teamDataMap.set(item.Team_orig, {
                    source: 'current',
                    data: item
                });
            }
        });
        
        console.log(`Found ${teamDataMap.size} teams with 2025-26 data`);
        
        // Second pass: for missing teams, use their most recent historical data
        const allTeams = [...eastTeams, ...westTeams];
        const missingTeams = allTeams.filter(team => !teamDataMap.has(team));
        
        console.log(`Missing ${missingTeams.length} teams, filling with historical data...`);
        
        // Group historical data by team to find most recent season
        const historicalData = {};
        rawData.forEach(item => {
            if (item.Season_orig !== '2025-26') {
                if (!historicalData[item.Team_orig]) {
                    historicalData[item.Team_orig] = [];
                }
                historicalData[item.Team_orig].push(item);
            }
        });
        
        // For each missing team, find their most recent historical data
        missingTeams.forEach(team => {
            if (historicalData[team] && historicalData[team].length > 0) {
                // Sort by season (newest first) and take the most recent
                const sorted = historicalData[team].sort((a, b) => {
                    return b.Season_orig.localeCompare(a.Season_orig);
                });
                teamDataMap.set(team, {
                    source: 'historical',
                    data: sorted[0]
                });
            }
        });

        // Transform the data for display
        const transformed = [];
        
        teamDataMap.forEach((item, teamName) => {
            const data = item.data;
            const source = item.source;
            
            // Get playoff probability (1_predicted_proba)
            const playoffProb = data['1_predicted_proba'];
            let playoffPct = 0;
            
            if (playoffProb !== undefined && playoffProb !== null && !isNaN(playoffProb)) {
                playoffPct = Math.round(playoffProb * 100 * 10) / 10;
            }
            
            // Get stats (handle empty strings in 2025-26 data)
            const wins = safeNumber(data.Wins_orig);
            const losses = safeNumber(data.Losses_orig);
            const defRating = safeNumber(data.Defensive_Rating_orig);
            const threePct = safeNumber(data.Three_Point_Percentage_orig);
            
            transformed.push({
                teamName: teamName,
                wins: wins,
                losses: losses,
                defRating: defRating,
                threePct: threePct,
                playoffPct: playoffPct,
                conference: getConference(teamName),
                source: source, // 'current' or 'historical'
                season: data.Season_orig
            });
        });

        // Sort by playoff percentage (highest first) and add rank
        transformed.sort((a, b) => b.playoffPct - a.playoffPct);
        transformed.forEach((team, index) => {
            team.rank = index + 1;
        });

        const currentCount = transformed.filter(t => t.source === 'current').length;
        const historicalCount = transformed.filter(t => t.source === 'historical').length;
        
        console.log(`Loaded ${transformed.length} total teams for 2025-26`);
        console.log(`   - ${currentCount} teams with current 2025-26 data`);
        console.log(`   - ${historicalCount} teams with historical data (most recent season)`);
        
        return transformed;
    }

    // Function to populate table
    function populateTable(data) {
        if (!tableBody) return;
        
        if (!data || data.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 40px;">No 2026 prediction data found</td></tr>`;
            return;
        }
        
        tableBody.innerHTML = '';
        
        data.forEach((team) => {
            const row = document.createElement('tr');
            
            // Extract values
            const rank = team.rank || '-';
            const teamName = team.teamName || 'Unknown';
            const wins = typeof team.wins === 'number' ? team.wins : 0;
            const losses = typeof team.losses === 'number' ? team.losses : 0;
            const defRating = typeof team.defRating === 'number' ? team.defRating : 0;
            const threePct = typeof team.threePct === 'number' ? team.threePct : 0;
            const playoffPct = typeof team.playoffPct === 'number' ? team.playoffPct : 0;
            const conference = team.conference || 'West';
            
            // Format record (show -- if both wins and losses are 0)
            const recordDisplay = (wins === 0 && losses === 0) ? '--' : `${wins}-${losses}`;
            
            // Format numbers
            const defRatingFormatted = defRating > 0 ? defRating.toFixed(1) : '--';
            const threePctFormatted = threePct > 0 ? threePct.toFixed(1) + '%' : '--%';
            const playoffPctFormatted = playoffPct.toFixed(1) + '%';
            
            // Determine playoff percentage class for color coding
            let pctClass = 'playoff-pct';
            if (playoffPct >= 90) pctClass += ' high';
            else if (playoffPct >= 50) pctClass += ' medium';
            else pctClass += ' low';
            
            // Determine conference class for logo
            const confClass = conference === 'East' ? 'east-team' : 'west-team';
            
            // Add subtle indicator for historical data
            const seasonHint = team.source === 'historical' ? 
                `<small style="color: #999; margin-left: 5px;">(based on ${team.season} data)</small>` : '';
            
            row.innerHTML = `
                <td>${rank}</td>
                <td>
                    <div class="team-placeholder">
                        <span class="logo ${confClass}"></span>
                        ${teamName} ${seasonHint}
                    </div>
                </td>
                <td>${recordDisplay}</td>
                <td>${defRatingFormatted}</td>
                <td>${threePctFormatted}</td>
                <td class="${pctClass}">${playoffPctFormatted}</td>
            `;
            
            tableBody.appendChild(row);
        });
    }

    // Filter functions
    function filterAll() {
        filteredData = [...allTeamsData];
        populateTable(filteredData);
        updateActiveTab('all');
    }

    function filterEast() {
        filteredData = allTeamsData.filter(team => team.conference === 'East');
        populateTable(filteredData);
        updateActiveTab('east');
    }

    function filterWest() {
        filteredData = allTeamsData.filter(team => team.conference === 'West');
        populateTable(filteredData);
        updateActiveTab('west');
    }

    function updateActiveTab(tab) {
        [tabAll, tabEast, tabWest].forEach(t => {
            if (t) t.classList.remove('active-conf');
        });
        if (tab === 'all' && tabAll) tabAll.classList.add('active-conf');
        if (tab === 'east' && tabEast) tabEast.classList.add('active-conf');
        if (tab === 'west' && tabWest) tabWest.classList.add('active-conf');
    }

    // Tab click handlers
    if (tabAll) tabAll.addEventListener('click', filterAll);
    if (tabEast) tabEast.addEventListener('click', filterEast);
    if (tabWest) tabWest.addEventListener('click', filterWest);

    // Fetch predictions.json
    fetch('predictions.json')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Successfully loaded predictions.json');
            
            // Transform the data - builds complete 30-team dataset
            allTeamsData = transformData(data);
            
            // Show all teams by default
            filterAll();
        })
        .catch(error => {
            console.error('Error loading predictions.json:', error);
            if (tableBody) {
                tableBody.innerHTML = `
                    <tr>
                        <td colspan="6" style="text-align: center; padding: 40px;">
                            <div style="color: #a1282a;">
                                Error loading 2026 predictions<br>
                                <small style="color: #666;">${error.message}</small><br>
                                <button onclick="location.reload()" style="margin-top: 10px; padding: 5px 15px; background: #174c8f; color: white; border: none; border-radius: 5px; cursor: pointer;">Retry</button>
                            </div>
                        </td>
                    </tr>
                `;
            }
        });
});