/* js/main.js */
const Game = {
    timer: null,
    currentSpeed: 0, 
    SPEEDS: { 0: null, 1: 2000, 2: 1000, 3: 250 },
    viewState: { mode: 'month', year: 2025, month: 7, day: 1 },
    rosterFilters: { rank: 'all', field: 'all', tenure: 'all', sort: 'hIndex' },
    financeTab: 'overview', // Default sub-tab

    showSetup: function() {
        document.getElementById('main-menu').classList.add('hidden');
        document.getElementById('setup-screen').classList.remove('hidden');
        this.updateSetupFlavor();
    },

    updateSetupFlavor: function() {
        const typeKey = document.getElementById('setup-type').value;
        const discKey = document.getElementById('setup-discipline').value;
        const descBox = document.getElementById('setup-desc');
        const institution = INSTITUTION_TYPES[typeKey];
        const discipline = DISCIPLINES[discKey];
        if (institution && discipline) {
            descBox.innerHTML = `
                <div style="margin-bottom: 5px;"><strong>${institution.label}:</strong> ${institution.desc}</div>
                <div style="color: #666; font-style: italic;">${discipline.flavor}</div>
            `;
        }
    },

    initGameFromSetup: function() {
        try {
            const name = document.getElementById('setup-name').value;
            const typeKey = document.getElementById('setup-type').value;
            const discKey = document.getElementById('setup-discipline').value;
            if(!name || name.trim() === "") { alert("Please name your department."); return; }
            State.initNewGame(name, typeKey, discKey);
            this.viewState.year = State.data.year;
            this.viewState.month = State.data.month;
            this.viewState.day = State.data.day;
            document.getElementById('setup-screen').classList.add('hidden');
            this.enterGameInterface();
        } catch (error) {
            console.error("Critical Error starting game:", error);
            alert("Error starting game: " + error.message);
        }
    },

    launchLoadedGame: function() {
        document.getElementById('main-menu').classList.add('hidden');
        document.getElementById('setup-screen').classList.add('hidden');
        this.viewState.year = State.data.year;
        this.viewState.month = State.data.month;
        this.viewState.day = State.data.day;
        this.enterGameInterface();
    },

    enterGameInterface: function() {
        UI.toggleGameView(true);
        document.querySelector('.dept-brand').innerText = State.data.schoolName;
        UI.updateTopBar(State.data);
        UI.renderInbox(State.data.emails || []); 
        this.navigate('office');
        this.setSpeed(0);
    },
    
    setSpeed: function(speedIndex) {
        this.currentSpeed = speedIndex;
        UI.updateSpeedButtons(speedIndex);
        if (this.timer) clearInterval(this.timer);
        if (speedIndex > 0) {
            const ms = this.SPEEDS[speedIndex];
            this.timer = setInterval(() => this.tick(), ms);
        }
    },

    tick: function() {
        State.advanceDay();
        UI.updateTopBar(State.data);
        const calScreen = document.getElementById('screen-calendar');
        if (!calScreen.classList.contains('hidden')) {
            UI.renderCalendar(State.data, this.viewState);
        }
        if (!document.getElementById('screen-finance').classList.contains('hidden')) {
             UI.renderFinance(State.data, this.financeTab);
        }
    },
    
    navigate: function(screenId) {
        UI.showScreen(screenId);
        if(screenId === 'calendar') UI.renderCalendar(State.data, this.viewState);
        if(screenId === 'faculty') UI.renderFaculty(State.data.faculty, this.rosterFilters);
        if(screenId === 'finance') UI.renderFinance(State.data, this.financeTab);
    },
    
    setCalendarMode: function(mode) {
        this.viewState.mode = mode;
        UI.renderCalendar(State.data, this.viewState);
    },

    shiftCalendar: function(direction) {
        const v = this.viewState;
        if (v.mode === 'year') {
            v.year += direction;
        } 
        else if (v.mode === 'month') {
            v.month += direction;
            if(v.month > 11) { v.month = 0; v.year++; }
            if(v.month < 0) { v.month = 11; v.year--; }
        } 
        else if (v.mode === 'week') {
            v.day += (direction * 7);
            if (v.day > 30) { v.day = 1; v.month++; }
            if (v.day < 1) { v.day = 25; v.month--; }
            if (v.month > 11) { v.month = 0; v.year++; }
            if (v.month < 0) { v.month = 11; v.year--; }
        }
        UI.renderCalendar(State.data, this.viewState);
    },

    jumpToMonth: function(monthIndex) {
        this.viewState.month = monthIndex;
        this.setCalendarMode('month');
    },

    setRosterFilter: function(key, value) {
        this.rosterFilters[key] = value;
        UI.renderFaculty(State.data.faculty, this.rosterFilters);
    },

    setRosterSort: function(value) {
        this.rosterFilters.sort = value;
        UI.renderFaculty(State.data.faculty, this.rosterFilters);
    },

    setFinanceTab: function(tab) {
        this.financeTab = tab;
        UI.renderFinance(State.data, this.financeTab);
    }
};

window.onerror = function(message, source, lineno, colno, error) {
    console.error(`Global Error: ${message} at line ${lineno}`);
};