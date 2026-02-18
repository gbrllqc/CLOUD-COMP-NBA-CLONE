(function() {
    // fetch('predictions.json')
    //   .then(res => res.json())
    //   .then(data => { populateTable(data); })
    //   .catch(err => console.warn('prediction data not loaded yet — layout mode'));

    console.log('app.js: layout scaffold ready. No data loaded — awaiting predictions.json');

    const tabAll = document.getElementById('tabAll');
    const tabEast = document.getElementById('tabEast');
    const tabWest = document.getElementById('tabWest');

    function removeActiveClass() {
        [tabAll, tabEast, tabWest].forEach(t => {
            if (t) t.classList.remove('active-conf');
        });
    }

    if (tabAll) {
        tabAll.addEventListener('click', function(e) {
            removeActiveClass();
            tabAll.classList.add('active-conf');
            console.log('tab ALL (ui only) — data not yet bound');
        });
    }
    if (tabEast) {
        tabEast.addEventListener('click', function(e) {
            removeActiveClass();
            tabEast.classList.add('active-conf');
            console.log('tab EAST (ui only)');
        });
    }
    if (tabWest) {
        tabWest.addEventListener('click', function(e) {
            removeActiveClass();
            tabWest.classList.add('active-conf');
            console.log('tab WEST (ui only)');
        });
    }

    // prepare table body reference for future data population
    const tableBody = document.getElementById('tableBody');
    if (tableBody) {
        console.log('Table body found, ready for predictions.json injection later.');
    }
})();