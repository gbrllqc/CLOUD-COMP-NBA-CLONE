
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
                    <div class="loading-spinner">⏳ Loading playoff predictions...</div>
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
        if (eastTeams.includes(teamName)) return 'East';
        if (westTeams.includes(teamName)) return 'West';
        return 'West'; // Default to West if not found
    }

    // Function to transform your JSON data
    function transformData(rawData) {
        if (!rawData || !Array.isArray(rawData)) {
            console.error('Invalid data format:', rawData);
            return [];
        }

        // Get most recent season for each team
        const teamMap = new Map();
        
        rawData.forEach(item => {
            const teamName = item.Team_orig;
            if (!teamMap.has(teamName) || item.Season_orig > teamMap.get(teamName).Season_orig) {
                teamMap.set(teamName, item);
            }
        });

        // Transform each team's data
        const transformed = Array.from(teamMap.values()).map(item => {
            const playoffPct = Math.round(item['1_predicted_proba'] * 100 * 10) / 10;
            
            return {
                teamName: item.Team_orig,
                wins: item.Wins_orig,
                losses: item.Losses_orig,
                defRating: item['Defensive Rating_orig'],
                threePct: item['Three Point %_orig'],
                playoffPct: playoffPct,
                conference: getConference(item.Team_orig)
            };
        });

        // Sort by playoff percentage (highest first) and add rank
        transformed.sort((a, b) => b.playoffPct - a.playoffPct);
        transformed.forEach((team, index) => {
            team.rank = index + 1;
        });

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
            
            // Determine conference class for logo
            const confClass = team.conference === 'East' ? 'east-team' : 'west-team';
            
            row.innerHTML = `
                <td>${team.rank}</td>
                <td>
                    <div class="team-placeholder">
                        <span class="logo ${confClass}"></span>
                        ${team.teamName}
                    </div>
                </td>
                <td>${team.wins}-${team.losses}</td>
                <td>${team.defRating.toFixed(1)}</td>
                <td>${team.threePct.toFixed(1)}%</td>
                <td class="playoff-pct">${team.playoffPct.toFixed(1)}%</td>
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
        [tabAll, tabEast, tabWest].forEach(t => t?.classList.remove('active-conf'));
        if (tab === 'all') tabAll?.classList.add('active-conf');
        if (tab === 'east') tabEast?.classList.add('active-conf');
        if (tab === 'west') tabWest?.classList.add('active-conf');
    }

    // Tab click handlers
    tabAll?.addEventListener('click', filterAll);
    tabEast?.addEventListener('click', filterEast);
    tabWest?.addEventListener('click', filterWest);

    // Fetch predictions.json
    fetch('predictions.json')
        .then(response => {
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return response.json();
        })
        .then(data => {
            console.log('✅ Successfully loaded predictions.json');
            allTeamsData = transformData(data);
            filterAll();
        })
        .catch(error => {
            console.error('❌ Error loading predictions.json:', error);
            if (tableBody) {
                tableBody.innerHTML = `
                    <tr>
                        <td colspan="6" style="text-align: center; padding: 40px;">
                            <div style="color: #a1282a;">
                                ⚠️ Error loading predictions.json<br>
                                <button onclick="location.reload()" style="margin-top: 10px; padding: 5px 15px; background: #174c8f; color: white; border: none; border-radius: 5px; cursor: pointer;">Retry</button>
                            </div>
                        </td>
                    </tr>
                `;
            }
        });
});
