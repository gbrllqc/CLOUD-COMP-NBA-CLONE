fetch('predictions.json')
    .then(response => response.json())
    .then(data => {
        console.log('Loaded predictions from JSON:', data);
        
        const eastTeams = ['Atlanta Hawks', 'Boston Celtics', 'Brooklyn Nets', /* add all east teams */];
        
        const transformedData = data.map((item, index) => {
            const conference = eastTeams.includes(item.Team_orig) ? 'East' : 'West';
            
            return {
                teamName: item.Team_orig,
                wins: item.Wins_orig,
                losses: item.Losses_orig,
                defRating: item['Defensive Rating_orig'],
                threePct: item['Three Point %_orig'],
                playoffPct: Math.round(item['1_predicted_proba'] * 100 * 10) / 10, // Round to 1 decimal
                conference: conference
            };
        });
        
        // Sort by playoff percentage
        transformedData.sort((a, b) => b.playoffPct - a.playoffPct);
        
        // Add rank
        transformedData.forEach((team, idx) => {
            team.rank = idx + 1;
        });
        
        allTeamsData = transformedData;
        filterAll(); // Show all teams by default
    })
    .catch(error => {
        console.error('Error loading predictions.json:', error);
    });
