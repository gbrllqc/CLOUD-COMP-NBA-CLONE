// app.js - Fetches predictions.json and shows ONLY 2026 forecast
// Your HTML and CSS remain UNCHANGED

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
                    <div class="loading-spinner">⏳ Loading 2026 playoff predictions...</div>
                </td>
            </tr>
        `;
    }

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

    // convert " " value to number
    function safeNumber(value, defaultValue = 0) {
        if (value === undefined || value === null || value === '') {
            return defaultValue;
        }
        const num = Number(value);
        return isNaN(num) ? defaultValue : num;
    }

    function transformData(rawData) {
        if (!rawData || !Array.isArray(rawData)) {
            console.error('Invalid data format:', rawData);
            return [];
        }

        console.log(`Filtering ${rawData.length} records for 2025-26 season...`);


        const currentSeason = '2025-26';
        const seasonData = rawData.filter(item => item.Season_orig === currentSeason);
        
        console.log(`Found ${seasonData.length} records for ${currentSeason}`);

        // Transform the data
        const transformed = seasonData.map(item => {
            const teamName = item.Team_orig;
            if (!teamName) return null;
            
            // playoff probability
            const playoffProb = item['1_predicted_proba'];
            let playoffPct = 0;
            
            if (playoffProb !== undefined && playoffProb !== null && !isNaN(playoffProb)) {
                playoffPct = Math.round(playoffProb * 100 * 10) / 10;
            }
            
            
            const wins = safeNumber(item.Wins_orig);
            const losses = safeNumber(item.Losses_orig);
            const defRating = safeNumber(item.Defensive_Rating_orig);
            const threePct = safeNumber(item.Three_Point_Percentage_orig);
            
            return {
                teamName: teamName,
                wins: wins,
                losses: losses,
                defRating: defRating,
                threePct: threePct,
                playoffPct: playoffPct,
                conference: getConference(teamName)
            };
        }).filter(item => item !== null);

        // Sort by playoff percentage
        transformed.sort((a, b) => b.playoffPct - a.playoffPct);
        transformed.forEach((team, index) => {
            team.rank = index + 1;
        });

        console.log('Top 5 teams:', transformed.slice(0, 5));
        
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
            
            // Extract values with defaults
            const rank = team.rank || '-';
            const teamName = team.teamName || 'Unknown';
            const wins = typeof team.wins === 'number' ? team.wins : 0;
            const losses = typeof team.losses === 'number' ? team.losses : 0;
            const defRating = typeof team.defRating === 'number' ? team.defRating : 0;
            const threePct = typeof team.threePct === 'number' ? team.threePct : 0;
            const playoffPct = typeof team.playoffPct === 'number' ? team.playoffPct : 0;
            const conference = team.conference || 'West';
            
            // Format numbers
            const defRatingFormatted = defRating.toFixed(1);
            const threePctFormatted = threePct.toFixed(1);
            const playoffPctFormatted = playoffPct.toFixed(1);
            
            // Determine conference class for logo
            const confClass = conference === 'East' ? 'east-team' : 'west-team';
            
            // Add color coding based on playoff probability
            let pctColor = '';
            if (playoffPct >= 90) pctColor = 'style="color: #0e6b0e; font-weight: 800;"';
            else if (playoffPct >= 50) pctColor = 'style="color: #b97c0d; font-weight: 800;"';
            else pctColor = 'style="color: #a1282a; font-weight: 800;"';
            
            row.innerHTML = `
                <td>${rank}</td>
                <td>
                    <div class="team-placeholder">
                        <span class="logo ${confClass}"></span>
                        ${teamName}
                    </div>
                </td>
                <td>${wins}-${losses}</td>
                <td>${defRatingFormatted}</td>
                <td>${threePctFormatted}%</td>
                <td ${pctColor}>${playoffPctFormatted}%</td>
            `;
            
            tableBody.appendChild(row);
        });
        
        console.log(`Table showing ${data.length} teams for 2026 playoff forecast`);
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
            console.log('✅ Successfully loaded predictions.json');
            
            // Transform the data - ONLY 2025-26 season
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