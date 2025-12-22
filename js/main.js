/* js/main.js */
const Game = {
    timer: null,
    currentSpeed: 0, 
    SPEEDS: { 0: null, 1: 2000, 2: 1000, 3: 250 },
    viewState: { mode: 'month', year: 2025, month: 7, day: 1 },
    rosterFilters: { rank: 'all', field: 'all', tenure: 'all', sort: 'hIndex' },
    // Add these two lines to the Game object:
    emailFilter: 'all',
    setEmailFilter: function(val) { this.emailFilter = val; UI.renderInbox(State.data.emails); },
    
    // --- UPDATED: ADMISSIONS FILTERS ---
    admissionsFilters: { field: 'all', gpa: 'all', rec: 'all' }, 
    financeTab: 'overview',

    showSetup: function() {
        document.getElementById('main-menu').classList.add('hidden');
        document.getElementById('setup-screen').classList.remove('hidden');
        this.updateSetupFlavor();
    },

    updateSetupFlavor: function() {
        const type = document.getElementById('setup-type').value;
        const descDiv = document.getElementById('setup-desc');
        let text = "";
        if(type === 'state') text = "High teaching load, moderate funding, lots of bureaucracy.";
        else if(type === 'ivy') text = "Massive endowment, high research expectations, cutthroat politics.";
        else if(type === 'community') text = "Focus on education, low research budget, heavy course load.";
        descDiv.innerText = text;
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

    enterGameInterface: function() {
        UI.toggleGameView(true);
        UI.updateTopBar(State.data);
        this.navigate('office');
        this.setSpeed(0); 
    },

    tick: function() {
        const oldMonth = State.data.month;
        State.advanceDay();
        UI.updateTopBar(State.data);
        
        if (State.data.month !== oldMonth) {
            this.viewState.month = State.data.month;
            this.viewState.year = State.data.year;
            this.viewState.day = 1;
        }

        const calScreen = document.getElementById('screen-calendar');
        if (!calScreen.classList.contains('hidden')) UI.renderCalendar(State.data, this.viewState);
        if (!document.getElementById('screen-finance').classList.contains('hidden')) UI.renderFinance(State.data, this.financeTab);
        if (!document.getElementById('screen-admissions').classList.contains('hidden')) UI.renderAdmissions(State.data);
    },
    
    resolveEvent: function(choiceIdx) {
        if (!State.data.pendingEvent) return;
        const choice = State.data.pendingEvent.choices[choiceIdx];
        if (State.data.budget < choice.cost) { alert("Insufficient funds."); return; }
        State.resolveEventChoice(State.data.pendingEvent, choice);
        UI.updateTopBar(State.data); 
    },

    runInterview: function(appId, qId) {
        const result = State.performInterview(parseInt(appId), qId);
        if(result) UI.renderAdmissions(State.data);
    },

    // --- UPDATED: Offer Handling ---
    offer: function(appId, withFlyout=false) {
        if(withFlyout && State.data.budget < 500) {
            alert("Insufficient funds for flyout ($500).");
            return;
        }
        State.extendOffer(parseInt(appId), withFlyout);
        UI.updateTopBar(State.data);
        UI.renderAdmissions(State.data);
    },

    reject: function(appId) {
        State.rejectCandidate(parseInt(appId));
        UI.renderAdmissions(State.data);
    },

    flyout: function(appId) {
        if (State.data.budget < 500) { alert("Insufficient funds for flyout."); return; }
        State.flyoutCandidate(parseInt(appId));
        UI.updateTopBar(State.data);
        UI.renderAdmissions(State.data);
    },

    triggerVisitWeekend: function() {
        const cost = State.calculateVisitWeekendCost ? State.calculateVisitWeekendCost() : 2000;
        if(State.data.budget < cost) { alert(`Insufficient funds. Cost: $${cost.toLocaleString()}`); return; }
        if(confirm(`Host Visit Weekend for all pending candidates? Cost: $${cost.toLocaleString()}`)) {
            State.hostVisitWeekend();
            UI.updateTopBar(State.data);
            UI.renderAdmissions(State.data);
        }
    },

    // --- UPDATED: Filter Setter ---
    setAdmissionsFilter: function(key, value) {
        this.admissionsFilters[key] = value;
        UI.renderAdmissions(State.data);
    },

    navigate: function(screenId) {
        UI.showScreen(screenId);
        if(screenId === 'calendar') UI.renderCalendar(State.data, this.viewState);
        if(screenId === 'faculty') UI.renderFaculty(State.data.faculty, this.rosterFilters);
        if(screenId === 'finance') UI.renderFinance(State.data, this.financeTab);
        if(screenId === 'students') UI.renderStudents(State.data);
        if(screenId === 'records') UI.renderRecords(State.data);
        if(screenId === 'admissions') UI.renderAdmissions(State.data);
    },

    setCalendarMode: function(mode) {
        this.viewState.mode = mode;
        UI.renderCalendar(State.data, this.viewState);
    },

    shiftCalendar: function(direction) {
        const v = this.viewState;
        if (v.mode === 'year') {
            v.year += direction;
        } else if (v.mode === 'month') {
            v.month += direction;
            if(v.month > 11) { v.month = 0; v.year++; }
            if(v.month < 0) { v.month = 11; v.year--; }
        } else if (v.mode === 'week') {
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
    },

    setSpeed: function(speedIndex) {
        this.currentSpeed = speedIndex;
        UI.updateSpeedButtons(speedIndex);
        if (this.timer) clearInterval(this.timer);
        if (speedIndex > 0) {
            const ms = this.SPEEDS[speedIndex];
            this.timer = setInterval(() => this.tick(), ms);
        }
    }
};

window.onerror = function(message, source, lineno, colno, error) {
    console.error(`Global Error: ${message} at line ${lineno}`);
};

document.addEventListener('DOMContentLoaded', () => {
    const buttons = document.querySelectorAll('button');
    buttons.forEach(btn => {
        if(btn.innerText.includes('Settings')) {
            btn.onclick = () => UI.showSettingsModal();
        }
    });
});