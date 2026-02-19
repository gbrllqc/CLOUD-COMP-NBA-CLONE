// app.js - Fetches predictions.json and populates the table
// Shows ALL seasons from your JSON (2018-19 to 2025-26)

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
                    <div class="loading-spinner">⏳ Loading playoff predictions...</div>
                </td>
            </tr>
        `;
    }

    // Complete list of ALL NBA teams by conference
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

        console.log(`Transforming ${rawData.length} records from all seasons...`);

        
        const transformed = rawData.map(item => {
            const teamName = item.Team_orig;
            if (!teamName) return null; 
            
            // playoff probability
            const playoffProb = item['1_predicted_proba'];
            let playoffPct = 0;
            
            if (playoffProb !== undefined && playoffProb !== null && !isNaN(playoffProb)) {
                playoffPct = Math.round(playoffProb * 100 * 10) / 10;
            }
            
            // get numeric values (handling empty strings)
            const wins = safeNumber(item.Wins_orig);
            const losses = safeNumber(item.Losses_orig);
            
           
            const defRating = safeNumber(item.Defensive_Rating_orig);
            const threePct = safeNumber(item.Three_Point_Percentage_orig);
            
            return {
                teamName: teamName,
                season: item.Season_orig || 'Unknown',
                wins: wins,
                losses: losses,
                defRating: defRating,
                threePct: threePct,
                playoffPct: playoffPct,
                conference: getConference(teamName),
                
                madePlayoffs: item.MadePlayoffs_orig
            };
        }).filter(item => item !== null);


        const seasonOrder = {
            '2025-26': 1,
            '2024-25': 2,
            '2023-24': 3,
            '2022-23': 4,
            '2021-22': 5,
            '2020-21': 6,
            '2019-20': 7,
            '2018-19': 8
        };

        transformed.sort((a, b) => {
            // sort by season 
            const seasonA = seasonOrder[a.season] || 99;
            const seasonB = seasonOrder[b.season] || 99;
            if (seasonA !== seasonB) {
                return seasonA - seasonB;
            }

            return b.playoffPct - a.playoffPct;
        });

        let currentSeason = '';
        let seasonRank = 1;
        
        transformed.forEach((team, index) => {
            if (team.season !== currentSeason) {
                currentSeason = team.season;
                seasonRank = 1;
            }
            team.rank = seasonRank;
            seasonRank++;
        });

        console.log(`Transformed ${transformed.length} records from all seasons`);
        
        // Count by season for verification
        const seasonCount = {};
        transformed.forEach(item => {
            seasonCount[item.season] = (seasonCount[item.season] || 0) + 1;
        });
        console.log('Records by season:', seasonCount);
        
        return transformed;
    }

    function populateTable(data) {
        if (!tableBody) return;
        
        if (!data || data.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 40px;">No teams found</td></tr>`;
            return;
        }
        
        tableBody.innerHTML = '';
        
        let currentSeason = '';
        
        data.forEach((team) => {
            if (team.season !== currentSeason) {
                currentSeason = team.season;
                const seasonRow = document.createElement('tr');
                seasonRow.innerHTML = `<td colspan="6" style="background: #eef2f7; text-align: center; padding: 10px; font-weight: bold; color: #174c8f;">${currentSeason} SEASON</td>`;
                tableBody.appendChild(seasonRow);
            }
            
            const row = document.createElement('tr');
            
            
            const rank = team.rank || '-';
            const teamName = team.teamName || 'Unknown';
            
            // Convert to numbers
            const wins = typeof team.wins === 'number' ? team.wins : 0;
            const losses = typeof team.losses === 'number' ? team.losses : 0;
            const defRating = typeof team.defRating === 'number' ? team.defRating : 0;
            const threePct = typeof team.threePct === 'number' ? team.threePct : 0;
            const playoffPct = typeof team.playoffPct === 'number' ? team.playoffPct : 0;
            const conference = team.conference || 'West';
            
            
            const defRatingFormatted = defRating.toFixed(1);
            const threePctFormatted = threePct.toFixed(1);
            const playoffPctFormatted = playoffPct.toFixed(1);
            
            
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
                <td>${defRatingFormatted}</td>
                <td>${threePctFormatted}%</td>
                <td class="playoff-pct">${playoffPctFormatted}%</td>
            `;
            
            tableBody.appendChild(row);
        });
        
        console.log(`Table populated with ${data.length} records from all seasons`);
    }

    // Filter functions
    function filterAll() {
        filteredData = [...allTeamsData];
        populateTable(filteredData);
        updateActiveTab('all');
        console.log(`Showing all ${filteredData.length} records`);
    }

    function filterEast() {
        filteredData = allTeamsData.filter(team => team.conference === 'East');
        populateTable(filteredData);
        updateActiveTab('east');
        console.log(`Showing ${filteredData.length} Eastern Conference records`);
    }

    function filterWest() {
        filteredData = allTeamsData.filter(team => team.conference === 'West');
        populateTable(filteredData);
        updateActiveTab('west');
        console.log(`Showing ${filteredData.length} Western Conference records`);
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