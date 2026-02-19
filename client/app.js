document.addEventListener('DOMContentLoaded', function() {
    console.log('NBA Oracle initializing...');
    
    // DOM elements
    const tableBody = document.getElementById('tableBody');
    const tabAll = document.getElementById('tabAll');
    const tabEast = document.getElementById('tabEast');
    const tabWest = document.getElementById('tabWest');
    
    let allTeamsData = [];
    let filteredData = [];

    if (tableBody) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 40px;">
                    <div class="loading-spinner">Loading 2026 playoff predictions...</div>
                </td>
            </tr>
        `;
    }

    // ALL 30 NBA teams
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

    // determine conference
    function getConference(teamName) {
        if (!teamName) return 'West';
        if (eastTeams.includes(teamName)) return 'East';
        if (westTeams.includes(teamName)) return 'West';
        return 'West';
    }

    function safeDisplay(value, defaultValue = '--', isPercentage = false) {
        if (value === undefined || value === null || value === '') {
            return defaultValue;
        }
        if (typeof value === 'number') {
            return isPercentage ? value.toFixed(1) + '%' : value.toFixed(1);
        }
        // convert to number if it's a string number
        const num = Number(value);
        if (!isNaN(num)) {
            return isPercentage ? num.toFixed(1) + '%' : num.toFixed(1);
        }
        return defaultValue;
    }

    // transform JSON data 
    function transformData(rawData) {
        if (!rawData || !Array.isArray(rawData)) {
            console.error('Invalid data format:', rawData);
            return [];
        }

        console.log(`Filtering ${rawData.length} records for 2025-26 season...`);

        // current year predictions
        const currentSeason = '2025-26';
        const seasonData = rawData.filter(item => item.Season_orig === currentSeason);
        
        console.log(`Found ${seasonData.length} records for ${currentSeason}`);

        
        const teamDataMap = new Map();
        seasonData.forEach(item => {
            teamDataMap.set(item.Team_orig, item);
        });

        
        const allTeams = [...eastTeams, ...westTeams];
        const transformed = [];

        allTeams.forEach(teamName => {
            const existingData = teamDataMap.get(teamName);
            
            if (existingData) {
                const playoffProb = existingData['1_predicted_proba'];
                let playoffPct = 0;
                
                if (playoffProb !== undefined && playoffProb !== null && !isNaN(playoffProb)) {
                    playoffPct = Math.round(playoffProb * 100 * 10) / 10;
                }
                
                transformed.push({
                    teamName: teamName,
                    wins: existingData.Wins_orig,
                    losses: existingData.Losses_orig,
                    defRating: existingData.Defensive_Rating_orig,
                    threePct: existingData.Three_Point_Percentage_orig,
                    playoffPct: playoffPct,
                    conference: getConference(teamName),
                    hasData: true
                });
            } else {
                transformed.push({
                    teamName: teamName,
                    wins: '',
                    losses: '',
                    defRating: '',
                    threePct: '',
                    playoffPct: 0,
                    conference: getConference(teamName),
                    hasData: false
                });
            }
        });

        // Sort by playoff percentage 
        transformed.sort((a, b) => {
            
            if (a.hasData && !b.hasData) return -1;
            if (!a.hasData && b.hasData) return 1;
            return b.playoffPct - a.playoffPct;
        });

        transformed.forEach((team, index) => {
            team.rank = index + 1;
        });

        const dataCount = transformed.filter(t => t.hasData).length;
        const blankCount = transformed.filter(t => !t.hasData).length;
        console.log(`Loaded ${dataCount} teams with data, ${blankCount} teams with blank stats`);
        
        return transformed;
    }

    // populate table
    function populateTable(data) {
        if (!tableBody) return;
        
        if (!data || data.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 40px;">No 2026 prediction data found</td></tr>`;
            return;
        }
        
        tableBody.innerHTML = '';
        
        data.forEach((team) => {
            const row = document.createElement('tr');
            
            
            const rank = team.rank || '-';
            const teamName = team.teamName || 'Unknown';
            
            // wins-losses
            const record = (team.wins !== '' && team.losses !== '') 
                ? `${team.wins}-${team.losses}` 
                : '--';
            
            // def rating and 3P%
            const defRatingDisplay = safeDisplay(team.defRating, '--');
            const threePctDisplay = team.threePct !== '' && team.threePct !== undefined 
                ? (typeof team.threePct === 'number' ? team.threePct.toFixed(1) + '%' : team.threePct + '%')
                : '--%';
            
            // playoff percentage
            let playoffPctDisplay = '--%';
            let pctClass = 'playoff-pct';
            
            if (team.hasData && team.playoffPct > 0) {
                playoffPctDisplay = team.playoffPct.toFixed(1) + '%';
                if (team.playoffPct >= 90) pctClass += ' high';
                else if (team.playoffPct >= 50) pctClass += ' medium';
                else pctClass += ' low';
            }
            
            
            const confClass = team.conference === 'East' ? 'east-team' : 'west-team';
            
            
            const rowClass = !team.hasData ? 'style="opacity: 0.7;"' : '';
            
            row.innerHTML = `
                <td ${rowClass}>${rank}</td>
                <td ${rowClass}>
                    <div class="team-placeholder">
                        <span class="logo ${confClass}"></span>
                        ${teamName}
                    </div>
                </td>
                <td ${rowClass}>${record}</td>
                <td ${rowClass}>${defRatingDisplay}</td>
                <td ${rowClass}>${threePctDisplay}</td>
                <td ${rowClass} class="${pctClass}">${playoffPctDisplay}</td>
            `;
            
            tableBody.appendChild(row);
        });
        
        const dataCount = data.filter(t => t.hasData).length;
        console.log(`Table showing ${data.length} teams (${dataCount} with data, ${data.length - dataCount} with blank stats)`);
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
            
            
            allTeamsData = transformData(data);
            
            
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