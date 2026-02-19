
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
                    <div class="loading-spinner">Loading playoff predictions...</div>
                </td>
            </tr>
        `;
    }

    // ALL NBA teams
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
        if (eastTeams.includes(teamName)) return 'East';
        if (westTeams.includes(teamName)) return 'West';
        return 'West'; // Default to West if not found
    }

    // Function for JSON data
    function transformData(rawData) {
        if (!rawData || !Array.isArray(rawData)) {
            console.error('Invalid data format:', rawData);
            return [];
        }

        console.log(`Transforming ${rawData.length} records...`);

        const teamMap = new Map();
        
        rawData.forEach(item => {
            const teamName = item.Team_orig;
            if (!teamMap.has(teamName) || item.Season_orig > teamMap.get(teamName).Season_orig) {
                teamMap.set(teamName, item);
            }
        });

        console.log(`Found ${teamMap.size} unique teams`);

        
        const transformed = Array.from(teamMap.values()).map(item => {
            const playoffProb = item['1_predicted_proba'] !== undefined ? item['1_predicted_proba'] : 0;
            const playoffPct = Math.round(playoffProb * 100 * 10) / 10;
            
            return {
                teamName: item.Team_orig || 'Unknown Team',
                wins: item.Wins_orig || 0,
                losses: item.Losses_orig || 0,
                defRating: item['Defensive Rating_orig'] || 0,
                threePct: item['Three Point %_orig'] || 0,
                playoffPct: playoffPct,
                conference: getConference(item.Team_orig)
            };
        });

        // Sort by playoff percentage
        transformed.sort((a, b) => b.playoffPct - a.playoffPct);
        transformed.forEach((team, index) => {
            team.rank = index + 1;
        });

        console.log(`✅ Transformed ${transformed.length} teams for display`);
        return transformed;
    }

    // Function to populate table
    function populateTable(data) {
        if (!tableBody) return;
        
        if (!data || data.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 40px;">No teams found</td></tr>`;
            return;
        }
        
        tableBody.innerHTML = '';
        
        data.forEach((team) => {
            const row = document.createElement('tr');
            
            // checks for all values
            const rank = team.rank || 0;
            const teamName = team.teamName || 'Unknown';
            const wins = team.wins || 0;
            const losses = team.losses || 0;
            const defRating = team.defRating || 0;
            const threePct = team.threePct || 0;
            const playoffPct = team.playoffPct || 0;
            const conference = team.conference || 'West';
            
            const confClass = conference === 'East' ? 'east-team' : 'west-team';
            
            row.innerHTML = `
                <td>${rank}</td>
                <td>
                    <div class="team-placeholder">
                        <span class="logo ${confClass}"></span>
                        ${teamName}
                    </div>
                </td>
                <td>${wins}-${losses}</td>
                <td>${defRating.toFixed(1)}</td>
                <td>${threePct.toFixed(1)}%</td>
                <td class="playoff-pct">${playoffPct.toFixed(1)}%</td>
            `;
            
            tableBody.appendChild(row);
        });
        
        console.log(`Table populated with ${data.length} teams`);
    }

    // Filter functions
    function filterAll() {
        filteredData = [...allTeamsData];
        populateTable(filteredData);
        updateActiveTab('all');
        console.log(`Showing all ${filteredData.length} teams`);
    }

    function filterEast() {
        filteredData = allTeamsData.filter(team => team.conference === 'East');
        populateTable(filteredData);
        updateActiveTab('east');
        console.log(`Showing ${filteredData.length} Eastern Conference teams`);
    }

    function filterWest() {
        filteredData = allTeamsData.filter(team => team.conference === 'West');
        populateTable(filteredData);
        updateActiveTab('west');
        console.log(`Showing ${filteredData.length} Western Conference teams`);
    }

    function updateActiveTab(tab) {
        [tabAll, tabEast, tabWest].forEach(t => t?.classList.remove('active-conf'));
        if (tab === 'all') tabAll?.classList.add('active-conf');
        if (tab === 'east') tabEast?.classList.add('active-conf');
        if (tab === 'west') tabWest?.classList.add('active-conf');
    }


    if (tabAll) tabAll.addEventListener('click', filterAll);
    if (tabEast) tabEast.addEventListener('click', filterEast);
    if (tabWest) tabWest.addEventListener('click', filterWest);

    fetch('predictions.json')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log(`Loaded ${data.length} total records`);
            
            
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
                                Error loading predictions.json<br>
                                <small style="color: #666;">${error.message}</small><br>
                                <button onclick="location.reload()" style="margin-top: 10px; padding: 5px 15px; background: #174c8f; color: white; border: none; border-radius: 5px; cursor: pointer;">Retry</button>
                            </div>
                        </td>
                    </tr>
                `;
            }
        });
});