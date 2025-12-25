/* js/ui.js */
/* js/ui.js */
const UI = {
    
    elements: {
        menu: document.getElementById('main-menu'),
        setup: document.getElementById('setup-screen'),
        game: document.getElementById('game-interface'),
        date: document.getElementById('date-display'),
        budget: document.getElementById('stat-budget'),
        prestige: document.getElementById('stat-prestige'),
        screens: {
            office: document.getElementById('screen-office'),
            calendar: document.getElementById('screen-calendar'),
            faculty: document.getElementById('screen-faculty'),
            finance: document.getElementById('screen-finance'),
            students: document.getElementById('screen-students'),
            records: document.getElementById('screen-records'), // <--- CHECK THIS LINE
            admissions: document.getElementById('screen-admissions'),
            search: document.getElementById('screen-search'),
        },
        navItems: {
            office: document.getElementById('nav-office'),
            calendar: document.getElementById('nav-calendar'),
            faculty: document.getElementById('nav-faculty'),
            finance: document.getElementById('nav-finance'),
            students: document.getElementById('nav-students'),
            records: document.getElementById('nav-records'), // <--- AND THIS LINE
            admissions: document.getElementById('nav-admissions'),
            search: document.getElementById('nav-search'),
        }
    },

    setupNavigation: function() {
        // 1. Create Exit Button if it doesn't exist
        if(!document.getElementById('btn-exit-game')) {
            const sidebar = document.querySelector('.sidebar') || document.getElementById('main-nav')?.parentElement;
            
            if(sidebar) {
                const exitBtn = document.createElement('button');
                exitBtn.id = 'btn-exit-game';
                exitBtn.className = 'nav-item';
                exitBtn.style.marginTop = "auto"; 
                exitBtn.style.background = "#c0392b"; 
                exitBtn.style.color = "white";
                exitBtn.style.borderTop = "1px solid #a93226";
                exitBtn.innerHTML = `🚪 Exit to Menu`;
                
                exitBtn.onclick = () => {
                    Game.setSpeed(0);
                    State.saveGame(); 
                    this.elements.game.classList.add('hidden');
                    this.elements.menu.classList.remove('hidden');
                };
                
                sidebar.appendChild(exitBtn);
            }
        }
    },
    // ... rest of the code ...
    updateTopBar: function(stateData) {
        if(!this.elements.budget) return;
        this.elements.budget.innerText = "$" + stateData.budget.toLocaleString();
        this.elements.prestige.innerText = stateData.prestige;
        this.elements.date.innerText = CONSTANTS.MONTHS[stateData.month] + " " + stateData.day + ", " + stateData.year;
        this.elements.budget.style.color = stateData.budget < 0 ? '#c0392b' : '#2c2c2c';
    },

    updateSpeedButtons: function(speedIndex) {
        for(let i=0; i<=3; i++) {
            const btn = document.getElementById("btn-speed-" + i);
            if(btn) btn.classList.remove('active');
        }
        const activeBtn = document.getElementById("btn-speed-" + speedIndex);
        if(activeBtn) activeBtn.classList.add('active');
    },

    showScreen: function(screenName) {
        Object.keys(this.elements.screens).forEach(id => {
            if(this.elements.screens[id]) this.elements.screens[id].classList.add('hidden');
            if(this.elements.navItems[id]) this.elements.navItems[id].classList.remove('active');
        });
        
        if(this.elements.screens[screenName]) {
            this.elements.screens[screenName].classList.remove('hidden');
            this.elements.navItems[screenName].classList.add('active');
        }
        
        if (screenName === 'office') this.renderInbox(State.data.emails);
        if (screenName === 'calendar') this.renderCalendar(State.data, Game.viewState);
        if (screenName === 'faculty') this.renderFaculty(State.data.faculty, Game.rosterFilters);
        if (screenName === 'finance') this.renderFinance(State.data, Game.financeTab);
        if (screenName === 'admissions') this.renderAdmissions(State.data);
        if (screenName === 'search') this.renderFacultySearch(State.data);
        // AUTO-SAVE LOCATION
        localStorage.setItem('tenureTrackScreen', screenName);
        State.saveGame();
    },

    toggleGameView: function(isGameActive) {
        if (isGameActive) {
            this.elements.menu.classList.add('hidden');
            this.elements.setup.classList.add('hidden');
            this.elements.game.classList.remove('hidden');
        } else {
            this.elements.menu.classList.remove('hidden');
            this.elements.game.classList.add('hidden');
        }
    },

    notifyNewEmail: function(sender, subject) {
        const overlay = document.createElement('div');
        overlay.className = 'dossier-overlay';
        overlay.innerHTML = `
            <div class="dossier-paper" style="max-width:400px; text-align:center;">
                <h2 style="margin-top:0;">📨 New Message</h2>
                <div style="font-size:1.1rem; margin:20px 0;">
                    <div style="font-weight:bold; color:#2c3e50;">${sender}</div>
                    <div style="color:#666;">"${subject}"</div>
                </div>
                <div style="background:#eee; padding:5px; font-size:0.8rem; margin-bottom:20px;">Game Paused</div>
                <button class="btn-main">Go to Inbox</button>
            </div>
        `;
        document.body.appendChild(overlay);
        const btn = overlay.querySelector('button');
        btn.onclick = () => {
            overlay.remove();
            Game.navigate('office');
        };
    },

    showSettingsModal: function() {
        Game.setSpeed(0);
        const overlay = document.createElement('div');
        overlay.className = 'dossier-overlay';
        const s = State.data.settings || { pauseOnEmail: true, pauseOnPaper: false };
        overlay.innerHTML = `
            <div class="dossier-paper" style="max-width:400px;">
                <h2 style="margin-top:0; border-bottom:1px solid #ccc; padding-bottom:10px;">Game Settings</h2>
                <div style="margin:20px 0;">
                    <h4 style="margin-bottom:10px;">Auto-Pause Preferences</h4>
                    <label style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; padding:10px; background:#f9f9f9; border:1px solid #eee;">
                        <span>Pause on General Emails</span>
                        <input type="checkbox" id="set-pause-email" ${s.pauseOnEmail ? 'checked' : ''}>
                    </label>
                    <label style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; padding:10px; background:#f9f9f9; border:1px solid #eee;">
                        <span>Pause on Faculty Publications</span>
                        <input type="checkbox" id="set-pause-paper" ${s.pauseOnPaper ? 'checked' : ''}>
                    </label>
                    <div style="font-size:0.8rem; color:#666; font-style:italic;">
                        Note: "Urgent" emails and random events will always pause the game.
                    </div>
                </div>
                <div style="text-align:right;">
                    <button class="btn-main" id="close-settings">Save & Close</button>
                </div>
            </div>`;
        document.body.appendChild(overlay);
        document.getElementById('close-settings').onclick = () => {
            State.data.settings.pauseOnEmail = document.getElementById('set-pause-email').checked;
            State.data.settings.pauseOnPaper = document.getElementById('set-pause-paper').checked;
            overlay.remove();
        };
    },

    showRecruitmentSetupModal: function() {
        Game.setSpeed(0); 
        const overlay = document.createElement('div'); 
        overlay.className = 'dossier-overlay'; 
        overlay.style.zIndex = "200"; 
        
        const activeLabs = State.data.faculty.filter(f => f.rank !== 'Adjunct').length;
        const defaultTarget = Math.ceil(activeLabs * 1.3);

        let budgetsHtml = ""; 
        if(typeof RECRUITMENT !== 'undefined') {
            RECRUITMENT.BUDGETS.forEach(b => { 
                budgetsHtml += `<option value="${b.id}">${b.label} (-$${b.cost})</option>`; 
            });
        }

        overlay.innerHTML = `
            <div class="dossier-paper" style="max-width:500px;">
                <h2 style="margin-top:0;">Recruitment Strategy</h2>
                <p>Allocating budget for the Dec 1st application deadline.</p>
                <div class="form-group">
                    <label>Target Cohort Size (Students)</label>
                    <input type="number" id="recruit-target" value="${defaultTarget}" min="1" max="30" style="width:100px;">
                    <small style="color:#666;">Recommendation: ${Math.max(1, defaultTarget-2)} - ${defaultTarget+2}</small>
                </div>
                <div class="form-group">
                    <label>Marketing Budget</label>
                    <select id="recruit-budget">${budgetsHtml}</select>
                </div>
                <div style="margin-top:20px; text-align:right;">
                    <button class="btn-main" id="confirm-recruit">Confirm Strategy</button>
                </div>
            </div>`;
        
        document.body.appendChild(overlay);

        document.getElementById('confirm-recruit').onclick = () => {
            const target = document.getElementById('recruit-target').value;
            const strat = document.getElementById('recruit-budget').value;
            
            // This function now generates its own "Reply" email from the Chair
            State.setRecruitmentStrategy(target, strat);
            
            overlay.remove();
        };
    },

    renderFinance: function(data, tab) { 
        const container = this.elements.screens.finance; 
        const tabs = [{ id: 'overview', label: 'Dashboard' }, { id: 'budget', label: 'Ledger' }, { id: 'grants', label: 'Grants' }]; 
        
        let tabHtml = `<div style="display:flex; gap:10px; margin-bottom:20px; border-bottom:1px solid #ddd; padding-bottom:10px;">`; 
        tabs.forEach(t => { 
            const activeStyle = t.id === tab ? 'background:#2c3e50; color:white;' : 'background:#eee; color:#555;'; 
            tabHtml += `<button onclick="Game.setFinanceTab('${t.id}')" style="padding:8px 16px; border:none; border-radius:2px; cursor:pointer; font-family:inherit; ${activeStyle}">${t.label}</button>`; 
        }); 
        tabHtml += `</div>`; 
        
        container.innerHTML = `<h2 style="margin-top:0;">Financial Dashboard</h2>` + tabHtml + `<div id="fin-content"></div>`; 
        
        const content = document.getElementById('fin-content'); 
        if(tab === 'overview') this.renderFinanceOverview(content, data); 
        if(tab === 'budget') this.renderFinanceBudget(content, data); 
        if(tab === 'grants') this.renderFinanceGrants(content, data); 
    },

    renderFinanceOverview: function(container, data) {
        if (!data.finance || !data.finance.lastWeekSummary) {
            container.innerHTML = "Initializing...";
            return;
        }
        const fin = data.finance;
        const last = fin.lastWeekSummary;
        const pol = data.policy || { overheadRate: 0.50, salaryMod: 1.0, stipendMod: 1.0 };
        
        let projectedData = [];
        if(typeof FinanceSystem !== 'undefined') {
            projectedData = FinanceSystem.getProjection(data);
        } else {
            projectedData = [data.budget];
        }
        const endOfYearBalance = projectedData[projectedData.length - 1];
        const isSurplus = endOfYearBalance >= 0;
        const eoyColor = isSurplus ? '#27ae60' : '#c0392b';

        // Breakdown Stats
        const expFac = last.expense.faculty || 0;
        const expStaff = (last.expense.staff || 0) + (last.expense.facility || 0);
        const expRes = last.expense.research || 0;
        const totalExp = expFac + expStaff + expRes || 1; 

        const pFac = Math.round((expFac / totalExp) * 100);
        const pStaff = Math.round((expStaff / totalExp) * 100);
        const pRes = Math.round((expRes / totalExp) * 100);

        // Pipeline Stats
        const activeGrants = data.faculty.reduce((acc, f) => acc + f.grants.length, 0);
        const pendingApps = data.faculty.reduce((acc, f) => acc + f.pendingApps.length, 0);
        const totalReserves = data.faculty.reduce((acc, f) => acc + f.funds, 0);

        const breakdownHtml = `
            <div style="margin-bottom:20px; background:white; padding:15px; border:1px solid #ddd;">
                <h4 style="margin-top:0; color:#555; font-size:0.9rem;">Weekly Expenditure Breakdown</h4>
                <div style="display:flex; height:20px; width:100%; background:#eee; border-radius:10px; overflow:hidden; margin-bottom:10px;">
                    <div style="width:${pFac}%; background:#3498db;" title="Faculty Salaries"></div>
                    <div style="width:${pRes}%; background:#9b59b6;" title="Student Stipends & Research"></div>
                    <div style="width:${pStaff}%; background:#95a5a6;" title="Staff & Facilities"></div>
                </div>
                <div style="display:flex; justify-content:space-between; font-size:0.8rem; color:#666;">
                    <div style="display:flex; align-items:center;"><div style="width:10px; height:10px; background:#3498db; margin-right:5px;"></div> Faculty (${pFac}%)</div>
                    <div style="display:flex; align-items:center;"><div style="width:10px; height:10px; background:#9b59b6; margin-right:5px;"></div> Research (${pRes}%)</div>
                    <div style="display:flex; align-items:center;"><div style="width:10px; height:10px; background:#95a5a6; margin-right:5px;"></div> Overhead (${pStaff}%)</div>
                </div>
            </div>
        `;

        const pipelineHtml = `
            <div style="margin-bottom:20px; background:white; padding:15px; border:1px solid #ddd; display:flex; justify-content:space-between;">
                <div>
                    <div style="font-size:0.8rem; color:#888;">Active Grants</div>
                    <div style="font-weight:bold; font-size:1.1rem; color:#27ae60;">${activeGrants}</div>
                </div>
                <div>
                    <div style="font-size:0.8rem; color:#888;">Pending Apps</div>
                    <div style="font-weight:bold; font-size:1.1rem; color:#f39c12;">${pendingApps}</div>
                </div>
                <div>
                    <div style="font-size:0.8rem; color:#888;">Faculty Reserves</div>
                    <div style="font-weight:bold; font-size:1.1rem; color:#2c3e50;">$${(totalReserves/1000).toFixed(0)}k</div>
                </div>
            </div>
        `;

        const controlsHtml = `
            <div style="background:#f4f4f4; padding:15px; border:1px solid #ddd; margin-bottom:20px;">
                <h3 style="margin-top:0;">Fiscal Policy</h3>
                <div style="display:grid; grid-template-columns: 1fr 1fr 1fr; gap:20px;">
                    <div>
                        <label style="font-size:0.8rem; font-weight:bold;">Overhead: ${(pol.overheadRate*100).toFixed(0)}%</label>
                        <input type="range" min="0.20" max="0.65" step="0.05" value="${pol.overheadRate}" onchange="State.setPolicy('overheadRate', this.value)" style="width:100%;">
                        <div style="font-size:0.7rem; color:#666;">High overhead angers faculty.</div>
                    </div>
                    <div>
                        <label style="font-size:0.8rem; font-weight:bold;">Salaries: ${(pol.salaryMod*100).toFixed(0)}%</label>
                        <input type="range" min="0.95" max="1.10" step="0.01" value="${pol.salaryMod}" onchange="State.setPolicy('salaryMod', this.value)" style="width:100%;">
                        <div style="font-size:0.7rem; color:#666;">Impacts morale & retention.</div>
                    </div>
                    <div>
                        <label style="font-size:0.8rem; font-weight:bold;">Stipends: ${(pol.stipendMod*100).toFixed(0)}%</label>
                        <input type="range" min="0.90" max="1.10" step="0.01" value="${pol.stipendMod}" onchange="State.setPolicy('stipendMod', this.value)" style="width:100%;">
                        <div style="font-size:0.7rem; color:#666;">Impacts applicant quality.</div>
                    </div>
                </div>
            </div>
        `;

        container.innerHTML = `
            <div style="display:flex; gap:20px; margin-bottom:20px;">
                <div style="background:white; border:1px solid #ddd; padding:20px; flex:1; text-align:center;">
                    <div style="font-size:0.8rem; color:#888; text-transform:uppercase;">Current Balance</div>
                    <div style="font-size:1.8rem; font-weight:bold;">$${data.budget.toLocaleString()}</div>
                </div>
                <div style="background:white; border:1px solid #ddd; padding:20px; flex:1; text-align:center;">
                    <div style="font-size:0.8rem; color:#888; text-transform:uppercase;">Weekly Net</div>
                    <div style="font-size:1.8rem; font-weight:bold; color:${last.net >= 0 ? '#27ae60' : '#c0392b'}">
                        ${last.net >= 0 ? '+' : ''}$${Math.floor(last.net).toLocaleString()}
                    </div>
                </div>
                <div style="background:white; border:1px solid #ddd; padding:20px; flex:1; text-align:center; border-left: 5px solid ${eoyColor};">
                    <div style="font-size:0.8rem; color:#888; text-transform:uppercase;">Projected EOY</div>
                    <div style="font-size:1.8rem; font-weight:bold; color:${eoyColor}">
                        $${Math.floor(endOfYearBalance).toLocaleString()}
                    </div>
                </div>
            </div>
            
            <div style="display:flex; gap:20px;">
                <div style="flex:2;">
                    ${controlsHtml}
                    ${this.renderLineChart(projectedData, "52-Week Projection (Estimated)", isSurplus ? "#27ae60" : "#c0392b")}
                </div>
                <div style="flex:1;">
                    ${breakdownHtml}
                    ${pipelineHtml}
                </div>
            </div>
        `;
    },

    renderFinanceBudget: function(container, data) { 
        const fin = data.finance; 
        let rows = "";
        fin.weeklyLog.forEach(log => {
            if(log.summary) {
                const s = log.summary;
                rows += `
                <tr style="border-bottom:1px solid #eee; font-size:0.9rem;">
                    <td style="padding:8px;">${log.date}</td>
                    <td style="color:#27ae60;">
                        <div>State: $${Math.floor(s.income.state).toLocaleString()}</div>
                        <div>Overhead: $${Math.floor(s.income.overhead).toLocaleString()}</div>
                        ${s.income.tuition > 0 ? `<div style="font-weight:bold;">Tuition: $${s.income.tuition.toLocaleString()}</div>` : ''}
                    </td>
                    <td style="color:#c0392b;">
                        <div>Faculty: $${Math.floor(s.expense.faculty).toLocaleString()}</div>
                        <div>Staff/Ops: $${Math.floor(s.expense.staff + s.expense.facility).toLocaleString()}</div>
                        <div>Research: $${Math.floor(s.expense.research).toLocaleString()}</div>
                    </td>
                    <td style="font-weight:bold; color:${s.net >= 0 ? 'green' : 'red'};">
                        ${s.net >= 0 ? '+' : ''}$${Math.floor(s.net).toLocaleString()}
                    </td>
                </tr>`;
            } else {
                rows += `<tr><td colspan="4" style="padding:8px; font-weight:bold; text-align:center; color:#2980b9;">${log.date}: ${log.summary ? '' : 'Transaction'} (${log.net >= 0 ? '+' : ''}${log.net})</td></tr>`;
            }
        });
        container.innerHTML = `<h3>Transaction Ledger</h3><div style="max-height:500px; overflow-y:auto; border:1px solid #ccc;"><table style="width:100%; border-collapse:collapse; background:white;"><thead style="background:#eee;"><tr><th style="padding:8px; text-align:left;">Date</th><th style="padding:8px; text-align:left;">Income</th><th style="padding:8px; text-align:left;">Expenses</th><th style="padding:8px; text-align:left;">Net</th></tr></thead><tbody>${rows}</tbody></table></div>`; 
    },

    renderFinanceGrants: function(container, data) { 
        let html = `<table style="width:100%; border-collapse:collapse; background:white;"><thead style="background:#eee;"><tr><th style="padding:10px; text-align:left;">PI</th><th style="padding:10px; text-align:left;">Grant</th><th style="padding:10px; text-align:left;">Remaining</th></tr></thead><tbody>`; 
        data.faculty.forEach(prof => { 
            prof.grants.forEach(g => { 
                html += `<tr style="border-bottom:1px solid #eee;"><td style="padding:10px;">${prof.name}</td><td style="padding:10px;">${g.name}</td><td style="padding:10px;">$${g.remaining.toLocaleString()}</td></tr>`; 
            }); 
        }); 
        html += `</tbody></table>`; 
        container.innerHTML = html; 
    },

    renderFaculty: function(faculty, filters) {
        const container = this.elements.screens.faculty;
        
        // 1. Safety Check for Filters
        filters = filters || { rank: 'all', field: 'all', sort: 'name' };
        
        // 2. Define the Filter Bar HTML
        const rankSel = filters.rank === 'all' ? 'selected' : '';
        const rankAsst = filters.rank === 'Assistant' ? 'selected' : '';
        const rankAssoc = filters.rank === 'Associate' ? 'selected' : '';
        const rankFull = filters.rank === 'Full' ? 'selected' : '';

        const fieldSel = filters.field === 'all' ? 'selected' : '';
        const fieldOrg = filters.field === 'Organic' ? 'selected' : '';
        const fieldInorg = filters.field === 'Inorganic' ? 'selected' : '';
        const fieldPhys = filters.field === 'Physical' ? 'selected' : '';
        const fieldAna = filters.field === 'Analytical' ? 'selected' : '';
        const fieldMat = filters.field === 'Materials' ? 'selected' : '';

        const sortName = filters.sort === 'name' ? 'selected' : '';
        const sortH = filters.sort === 'hIndex' ? 'selected' : '';
        const sortFund = filters.sort === 'funds' ? 'selected' : '';

        const filterBarHtml = `
            <div class="filter-bar">
                <select onchange="Game.setRosterFilter('rank', this.value)">
                    <option value="all" ${rankSel}>All Ranks</option>
                    <option value="Assistant" ${rankAsst}>Assistant</option>
                    <option value="Associate" ${rankAssoc}>Associate</option>
                    <option value="Full" ${rankFull}>Full Prof</option>
                </select>
                <select onchange="Game.setRosterFilter('field', this.value)">
                    <option value="all" ${fieldSel}>All Fields</option>
                    <option value="Organic" ${fieldOrg}>Organic</option>
                    <option value="Inorganic" ${fieldInorg}>Inorganic</option>
                    <option value="Physical" ${fieldPhys}>Physical</option>
                    <option value="Analytical" ${fieldAna}>Analytical</option>
                    <option value="Materials" ${fieldMat}>Materials</option>
                </select>
                <select onchange="Game.setRosterSort(this.value)">
                    <option value="name" ${sortName}>Sort: Name</option>
                    <option value="hIndex" ${sortH}>Sort: H-Index</option>
                    <option value="funds" ${sortFund}>Sort: Funding</option>
                </select>
            </div>`;

        // 3. Filter the Data
        let filtered = faculty;
        if(filters.rank !== 'all') filtered = filtered.filter(f => f.rank === filters.rank);
        if(filters.field !== 'all') filtered = filtered.filter(f => f.field === filters.field);
        
        // 4. Sort the Data
        if(filters.sort === 'hIndex') filtered.sort((a,b) => b.hIndex - a.hIndex);
        if(filters.sort === 'funds') filtered.sort((a,b) => b.funds - a.funds);
        if(filters.sort === 'name') filtered.sort((a,b) => a.name.localeCompare(b.name));

        // 5. Generate Content HTML
        let contentHtml = "";

        if(filtered.length === 0) {
            contentHtml = `
                <div class="empty-state" style="margin-top:50px;">
                    No faculty match these filters.
                    <br><br>
                    <button class="btn-small" onclick="Game.setRosterFilter('rank', 'all'); Game.setRosterFilter('field', 'all');">Reset Filters</button>
                </div>`;
        } else {
            contentHtml = `<div class="faculty-grid">` + filtered.map(f => {
                const isTenured = f.rank === "Associate" || f.rank === "Full";
                const borderColor = isTenured ? '#34495e' : '#27ae60'; 

                let tenureSection = "";
                let bottomAction = "";

                if(f.rank === "Assistant" && f.tenureTrack) {
                    const pct = (f.tenureTrack.year / 6) * 100;
                    let barColor = "#2ecc71";
                    if(f.tenureTrack.year >= 5) barColor = "#e67e22";
                    
                    tenureSection = `
                    <div style="margin: 8px 0;">
                        <div style="display:flex; justify-content:space-between; font-size:0.75rem; color:#666; margin-bottom:3px;">
                            <strong>Tenure Track</strong>
                            <span>Yr ${f.tenureTrack.year}/6</span>
                        </div>
                        <div style="width:100%; height:6px; background:#f1f2f6; border-radius:3px; overflow:hidden;">
                            <div style="width:${pct}%; height:100%; background:${barColor};"></div>
                        </div>
                    </div>`;
                    
                    bottomAction = `<button class="btn-small" style="width:100%; margin-top:8px;" onclick="UI.viewTenureDossier(${f.id})">📂 View Dossier</button>`;
                } else {
                    bottomAction = `<div style="margin-top:auto; padding-top:10px; font-size:0.75rem; color:#95a5a6; text-align:center; border-top:1px solid #eee;">Tenured Faculty</div>`;
                }

                return `
                <div class="faculty-card" style="border-left: 4px solid ${borderColor};">
                    <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                        <div>
                            <div style="font-weight:bold; font-size:1rem; color:#2980b9; cursor:pointer; text-decoration:underline;" 
                                 onclick="UI.viewFacultyDetail(${f.id})" 
                                 title="View Lab Details">
                                 ${f.name}
                            </div>
                            <div style="font-size:0.8rem; color:#7f8c8d;">${f.rank}</div>
                        </div>
                        <div style="font-size:0.75rem; background:#f0f3f4; color:#2c3e50; padding:2px 8px; border-radius:12px; font-weight:bold;">${f.field}</div>
                    </div>
                    
                    ${tenureSection}

                    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:8px; font-size:0.85rem; background:#fafafa; padding:8px; border-radius:4px;">
                        <div>🧪 h-index: <strong>${f.hIndex}</strong></div>
                        <div>💰 Reserves: ${(f.funds/1000).toFixed(0)}k</div>
                        <div>👥 Grads: <strong>${f.students.length}</strong></div>
                        <div>⚡ Morale: <strong>${Math.round(f.happiness)}%</strong></div>
                    </div>
                    
                    ${bottomAction}
                </div>`;
            }).join('') + `</div>`;
        }

        container.innerHTML = filterBarHtml + contentHtml;
    },

    showDossier: function(prof) { 
        const overlay = document.createElement('div'); overlay.className = 'dossier-overlay'; 
        overlay.onclick = (e) => { if(e.target === overlay) overlay.remove(); }; 
        let grantHtml = `<div style="margin-top:5px; font-style:italic; color:#666;">Source: ${prof.fundingSourceLabel}</div>`; 
        if(prof.grants.length > 0) { 
            grantHtml = prof.grants.map(g => `<div style="display:flex; justify-content:space-between; border-bottom:1px dashed #ccc; padding:3px 0;"><span>${g.name}</span><span>$${g.remaining.toLocaleString()}</span></div>`).join(''); 
        } 
        if(prof.pendingApps && prof.pendingApps.length > 0) {
            grantHtml += `<div style="margin-top:10px; font-weight:bold; font-size:0.8rem; color:#2980b9;">PENDING APPLICATIONS</div>`;
            grantHtml += prof.pendingApps.map(a => `<div style="font-size:0.8rem; display:flex; justify-content:space-between;"><span>${a.agency} ($${(a.amount/1000).toFixed(0)}k)</span><span>${a.weeksToDecision - a.weeksPending} wks</span></div>`).join('');
        }
        const toGrade = (val) => val > 90 ? 'A' : (val > 80 ? 'B' : (val > 70 ? 'C' : 'D'));
        let studentHtml = `<div style="color:#999; font-style:italic;">No students.</div>`; 
        if(prof.students && prof.students.length > 0) { 
            const group = State.data.students.filter(s => prof.students.includes(s.id)); 
            studentHtml = group.map(s => {
                let fundColor = s.funding === 'RA' ? '#27ae60' : (s.funding === 'Fellowship' ? '#f1c40f' : '#7f8c8d');
                return `
                <div style="padding:8px 0; border-bottom:1px solid #eee;">
                    <div style="display:flex; justify-content:space-between;">
                        <strong>${s.name}</strong>
                        <span style="color:${fundColor}; font-weight:bold; font-size:0.8rem;">${s.funding}</span>
                    </div>
                    <div style="font-size:0.75rem; color:#555; margin-top:2px;">
                        🧠 ${toGrade(s.stats.brains)} | ✋ ${toGrade(s.stats.hands)} | 🛡️ ${toGrade(s.stats.grit)}
                    </div>
                </div>`;
            }).join(''); 
        } 
        overlay.innerHTML = `<div class="dossier-paper"><h2 style="margin-top:0; border-bottom:2px solid #333; padding-bottom:10px;">${prof.name}</h2><div class="dossier-section"><div class="dossier-label">Overview</div><div class="dossier-data">${prof.rankLabel} of ${prof.field} Chemistry</div><div class="dossier-data">Age: ${prof.age} | Salary: $${prof.salary.toLocaleString()}</div></div><div class="dossier-section"><div class="dossier-label">Financials</div><div class="dossier-data">Burn Rate: <span style="color:${FINANCE.COLORS.expense}">$${prof.burnRate.toLocaleString()}/mo</span></div><div class="dossier-data">Reserves: $${prof.funds.toLocaleString()}</div><div style="margin-top:10px; background:#eee; padding:10px; border-radius:4px;">${grantHtml}</div></div><div class="dossier-section"><div class="dossier-label">Lab Group (${prof.students ? prof.students.length : 0})</div><div style="max-height:200px; overflow-y:auto; border:1px solid #ddd; background:white; padding:10px;">${studentHtml}</div></div><button class="btn-main" onclick="document.querySelector('.dossier-overlay').remove()">Close Dossier</button></div>`; 
        document.body.appendChild(overlay); 
    },

    /* js/ui.js */

    /* js/ui.js */

    /* js/ui.js */

    /* js/ui.js */

/* js/ui.js */

    /* js/ui.js */

    /* js/ui.js */

renderAdmissions: function(data) {
    const screen = document.getElementById('screen-admissions');
    if(!screen || screen.classList.contains('hidden')) return;

    // 1. DASHBOARD
    const dashboard = document.getElementById('admissions-dashboard');
    if(dashboard && data.admissions.active) {
        const pool = data.admissions.pool;
        const target = data.admissions.targetSize || 7;
        const accepted = pool.filter(a => a.status === 'Accepted').length;
        const pending = pool.filter(a => a.status === 'Offer Extended').length;
        const declined = pool.filter(a => a.status === 'Declined').length;
        const totalOffers = accepted + pending + declined;
        const rejectionRate = totalOffers > 0 ? Math.round((declined / totalOffers) * 100) : 0;
        const yieldRate = totalOffers > 0 ? Math.round((accepted / totalOffers) * 100) : 0;
        const filledPct = Math.min(100, (accepted / target) * 100);
        const pendingPct = Math.min(100, (pending / target) * 100);
        
        dashboard.innerHTML = `
            <div style="flex:2; border-right:1px solid #ccc; padding-right:15px; margin-right:15px;">
                <div style="display:flex; justify-content:space-between; font-size:0.85rem; margin-bottom:5px; font-weight:bold; color:#2c3e50;">
                    <span>Cohort Progress</span><span>${accepted} / ${target} Seats</span>
                </div>
                <div style="height:14px; background:#e0e0e0; border-radius:7px; overflow:hidden; position:relative;">
                    <div style="width:${filledPct}%; background:#27ae60; height:100%; float:left;" title="Accepted"></div>
                    <div style="width:${pendingPct}%; background:#f1c40f; height:100%; float:left;" title="Offers Pending"></div>
                    <div style="position:absolute; left:${Math.min(100, (target/target)*100)}%; top:0; bottom:0; width:2px; background:rgba(0,0,0,0.2);"></div>
                </div>
            </div>
            <div style="flex:1; display:flex; justify-content:space-between; text-align:center; font-size:0.85rem;">
                <div><div style="font-weight:bold; font-size:1.1rem; color:#2c3e50;">${totalOffers}</div><div style="font-size:0.7rem; color:#7f8c8d;">OFFERS</div></div>
                <div><div style="font-weight:bold; font-size:1.1rem; color:${rejectionRate > 50 ? '#c0392b' : '#2c3e50'};">${rejectionRate}%</div><div style="font-size:0.7rem; color:#7f8c8d;">REJECTION</div></div>
                <div><div style="font-weight:bold; font-size:1.1rem; color:#27ae60;">${yieldRate}%</div><div style="font-size:0.7rem; color:#7f8c8d;">YIELD</div></div>
            </div>`;
    } else if (dashboard) { dashboard.innerHTML = "Admissions Closed."; }

    const container = document.getElementById('admissions-pool-container');
    container.innerHTML = '';

    if(!data.admissions.active) {
        container.innerHTML = '<div style="padding:20px; text-align:center; color:#7f8c8d;">Admissions portal is closed.</div>';
        return;
    }
    
    // 2. GET FILTER VALUES
    const fStatus = document.getElementById('adm-filter-status') ? document.getElementById('adm-filter-status').value : 'All';
    const fInterest = document.getElementById('adm-filter-interest') ? document.getElementById('adm-filter-interest').value : 'All';
    const fGpa = document.getElementById('adm-filter-gpa') ? document.getElementById('adm-filter-gpa').value : 'All';
    const fSop = document.getElementById('adm-filter-sop') ? document.getElementById('adm-filter-sop').value : 'All';
    const fRec = document.getElementById('adm-filter-rec') ? document.getElementById('adm-filter-rec').value : 'All';
    const sortMode = document.getElementById('adm-sort') ? document.getElementById('adm-sort').value : 'default';

    // 3. APPLY FILTERS & SORT
    let displayPool = data.admissions.pool.filter(app => {
        // Status & Interest
        if(fStatus !== 'All' && app.status !== fStatus) return false;
        if(fInterest !== 'All' && app.interest !== fInterest) return false;
        
        // GPA
        const gpa = parseFloat(app.application.gpa);
        if(fGpa === '3.8+' && gpa < 3.8) return false;
        if(fGpa === '3.5+' && gpa < 3.5) return false;
        if(fGpa === '3.0-3.5' && (gpa < 3.0 || gpa >= 3.5)) return false;
        if(fGpa === '<3.0' && gpa >= 3.0) return false;

        // SOP (Background might be null on old saves, handle safely)
        const sop = app.background ? app.background.sopScore : 50;
        if(fSop === '80+' && sop < 80) return false;
        if(fSop === '50-80' && (sop < 50 || sop >= 80)) return false;
        if(fSop === '<50' && sop >= 50) return false;

        // Recs
        const rec = app.application.recScore;
        if(fRec === '9+' && rec < 9) return false;
        if(fRec === '7+' && rec < 7) return false;
        if(fRec === '<7' && rec >= 7) return false;

        return true;
    });

    // Apply Sorting
    if(sortMode === 'gpa') displayPool.sort((a,b) => b.application.gpa - a.application.gpa);
    if(sortMode === 'rec') displayPool.sort((a,b) => b.application.recScore - a.application.recScore);
    if(sortMode === 'exp') displayPool.sort((a,b) => (b.background ? b.background.monthsExp : 0) - (a.background ? a.background.monthsExp : 0));
    if(sortMode === 'sop') displayPool.sort((a,b) => (b.background ? b.background.sopScore : 0) - (a.background ? a.background.sopScore : 0));

    // 4. RENDER CARDS
    displayPool.forEach(app => {
        const card = document.createElement('div');
        card.className = 'candidate-card';
        const bg = app.background || { school: "Unknown", tier: 3, monthsExp: 0, prevRole: "None", sopScore: 50 };

        const getSopLabel = (s) => {
            if(s >= 90) return `<span style="color:#8e44ad; font-weight:bold;">Stellar (${s})</span>`;
            if(s >= 75) return `<span style="color:#27ae60;">Strong (${s})</span>`;
            if(s >= 50) return `<span style="color:#f39c12;">Average (${s})</span>`;
            return `<span style="color:#c0392b;">Weak (${s})</span>`;
        };
        const schoolDisplay = bg.tier === 1 ? `<strong>⭐ ${bg.school}</strong>` : bg.school;
        
        // Stats Logic
        let statsHtml = "";
        let yieldBadge = "";

        if(app.statsVisible) {
            const chance = State.calculateYieldChance(app);
            let chanceColor = "#e74c3c"; 
            if(chance > 30) chanceColor = "#f1c40f"; 
            if(chance > 60) chanceColor = "#27ae60"; 
            
            yieldBadge = `
            <div style="background:#f4f6f7; border-top:1px solid #ddd; padding:5px 10px; font-size:0.85rem; display:flex; justify-content:space-between; align-items:center;">
                <span>Projected Yield:</span><span style="font-weight:bold; color:${chanceColor};">${chance}%</span>
            </div>`;

            statsHtml = `
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:5px; margin:10px 0; font-size:0.85rem;">
                <div>🧠 Brains: <strong>${app.stats.brains.toFixed(0)}</strong></div>
                <div>✋ Hands: <strong>${app.stats.hands.toFixed(0)}</strong></div>
                <div>🔥 Ambition: <strong>${app.stats.ambition.toFixed(0)}</strong></div>
                <div>🧱 Grit: <strong>${app.stats.grit.toFixed(0)}</strong></div>
                <div style="grid-column:span 2; border-top:1px solid #eee; margin-top:5px; padding-top:5px; text-align:center;">
                        Match Fit: <strong>${app.stats.fit.toFixed(0)}%</strong>
                </div>
            </div>`;
        } else if (app.flyoutPending) {
            statsHtml = `<div style="text-align:center; padding:15px; background:#e8f6f3; color:#16a085; border-radius:4px; margin:10px 0; border:1px solid #d4efdf;">
                <div style="font-size:1.5rem;">✈️</div><div>Visit Scheduled</div><div style="font-size:0.8rem;">${app.flyoutTimer} wks</div>
            </div>`;
        } else {
            statsHtml = `<div style="text-align:center; padding:15px; background:#f8f9fa; color:#7f8c8d; border-radius:4px; margin:10px 0; border:1px solid #eee;">
                <div style="font-size:1.5rem;">🔒</div><div style="font-size:0.8rem;">Flyout to Reveal</div>
            </div>`;
        }

        let lobbyHtml = "";
        if(app.lobbying) {
            const color = app.lobbying.type === 'support' ? '#d4edda' : '#f8d7da';
            const border = app.lobbying.type === 'support' ? '#c3e6cb' : '#f5c6cb';
            lobbyHtml = `<div style="background:${color}; border:1px solid ${border}; padding:5px; font-size:0.8rem; margin-bottom:5px; border-radius:3px;">${app.lobbying.text}</div>`;
        }

        let actions = '';
        let flyoutBtn = `<button class="btn-small" onclick="State.flyoutCandidate(${app.id})">✈️ Flyout ($500)</button>`;
        if(app.flyoutPending) flyoutBtn = `<button class="btn-small" disabled style="opacity:0.6;">⌛ Scheduled</button>`;
        if(app.flownOut) flyoutBtn = `<button class="btn-small" disabled style="opacity:0.6; background:#bdc3c7;">✔ Visited</button>`;

        if(app.status === 'Pending') {
            actions = `
                ${flyoutBtn}
                <button class="btn-small" style="background:#27ae60;" onclick="State.extendOffer(${app.id})">Accept</button>
                <button class="btn-small" style="background:#c0392b;" onclick="State.rejectCandidate(${app.id})">Reject</button>
            `;
        } else if(app.status === 'Offer Extended') {
            actions = `
            <div style="color:#f39c12; font-weight:bold; font-size:0.9rem; margin-bottom:5px;">Offer Pending</div>
            <div style="display:flex; gap:5px; justify-content:center;">
                ${!app.flownOut ? flyoutBtn : ''} 
                <button class="btn-small" onclick="State.sweetenOffer(${app.id})" title="Dept pays $5k bonus.">🏆 Fellowship (-$5k)</button>
            </div>`;
        } else {
            const statusColor = app.status === 'Accepted' ? '#27ae60' : '#c0392b';
            actions = `<div style="text-align:center; font-weight:bold; color:${statusColor}">${app.status}</div>`;
        }

        card.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                <div>
                    <h3 style="margin:0; color:#2c3e50; font-size:1rem;">${app.name} ${app.application.hasFellowship ? '🏆' : ''}</h3>
                    <div style="font-size:0.8rem; color:#666;">${app.interest}</div>
                </div>
                <div style="text-align:right; font-size:0.8rem;">
                    <div>GPA: <strong>${app.application.gpa}</strong></div>
                    <div>Recs: <strong>${app.application.recScore}/10</strong></div>
                </div>
            </div>
            <div style="margin-top:8px; font-size:0.85rem; background:#fff; border:1px solid #eee; padding:5px;">
                <div>🏛️ ${schoolDisplay}</div>
                <div>🧪 Exp: <strong>${bg.monthsExp}mo</strong> (${bg.prevRole})</div>
                <div>📝 SOP: ${getSopLabel(bg.sopScore)}</div>
            </div>
            ${lobbyHtml}
            <div style="font-size:0.8rem; color:#555; font-style:italic; margin:5px 0;">"${app.facultyNote}"</div>
            ${statsHtml}
            ${yieldBadge}
            <div style="margin-top:10px; display:flex; flex-direction:column; gap:5px; justify-content:center;">
                ${actions}
            </div>
        `;
        container.appendChild(card);
    });
},
// --- PASTE ALL OF THIS CODE ---
    
    renderStudents: function(data) {
        const container = this.elements.screens.students;
        const students = data.students;
        
        if(!students || students.length === 0) {
            container.innerHTML = `<div class="empty-state">No graduate students enrolled.<br>Wait for admissions season.</div>`;
            return;
        }

        // Calculate Stats
        const total = students.length;
        const fundingCounts = { RA: 0, TA: 0, Fellowship: 0 };
        let totalPubs = 0;
        let candidates = 0; 
        const cohorts = { 1: [], 2: [], 3: [], 4: [], 5: [] };

        students.forEach(s => {
            fundingCounts[s.funding] = (fundingCounts[s.funding] || 0) + 1;
            totalPubs += (s.pubs || 0);
            if(s.year > 2) candidates++;
            
            if(s.year >= 5) cohorts[5].push(s);
            else cohorts[s.year].push(s);
        });

        // Dashboard HTML
        const dashboard = `
            <div style="background:white; border-bottom:1px solid #ddd; padding:20px; display:flex; gap:30px; align-items:center;">
                <div style="flex:1;">
                    <h2 style="margin:0 0 10px 0;">Grad Student Life</h2>
                    <div style="font-size:0.9rem; color:#666;">
                        Total Students: <strong>${total}</strong><br>
                        PhD Candidates: <strong>${candidates}</strong> (Qualified)<br>
                        Student Papers: <strong>${totalPubs}</strong>
                    </div>
                </div>
                <div style="flex:1; border-left:1px solid #eee; padding-left:20px;">
                    <h4 style="margin:0 0 10px 0;">Funding Distribution</h4>
                    ${this.renderPieChart(fundingCounts)}
                </div>
                 <div style="flex:1; border-left:1px solid #eee; padding-left:20px; font-size:0.8rem; line-height:1.6;">
                    <div><span style="display:inline-block; width:10px; height:10px; background:#e74c3c;"></span> TA (Teaching)</div>
                    <div><span style="display:inline-block; width:10px; height:10px; background:#2ecc71;"></span> RA (Grant Funded)</div>
                    <div><span style="display:inline-block; width:10px; height:10px; background:#f1c40f;"></span> Fellowship (Free)</div>
                </div>
            </div>
        `;

        // Columns HTML
        let columnsHtml = "";
        for(let i=1; i<=5; i++) {
            const cohortList = cohorts[i];
            
            // --- NEW: Added Counts to Title ---
            const count = cohortList.length;
            const title = i === 5 ? `G5+ (${count})` : `G${i} (${count})`;
            const sub = i === 1 ? "Rotations/Classes" : (i === 2 ? "Quals Prep" : "Dissertation");
            
            let cards = cohortList.map(s => {
                const adv = data.faculty.find(f => f.id === s.advisorId);
                const advName = adv ? adv.name.split(' ').pop() : "Unknown";
                const fundColor = s.funding === 'RA' ? '#2ecc71' : (s.funding === 'TA' ? '#e74c3c' : '#f1c40f');
                const isCand = s.year > 2 ? "🎓" : "";
                
                return `
                <div style="background:white; border:1px solid #ddd; padding:10px; margin-bottom:10px; border-left:3px solid ${fundColor}; box-shadow:0 1px 3px rgba(0,0,0,0.05);">
                    <div style="font-weight:bold; font-size:0.9rem; display:flex; justify-content:space-between;">
                        <span>${s.name.split(' (')[0]} ${isCand}</span>
                        <span style="font-size:0.8rem; color:#666;">${s.funding}</span>
                    </div>
                    <div style="font-size:0.8rem; color:#666; margin-top:3px;">
                        Lab: ${advName}
                    </div>
                    <div style="display:flex; justify-content:space-between; margin-top:5px; font-size:0.75rem; color:#888;">
                        <span>🧠 ${s.stats.brains} | ✋ ${s.stats.hands}</span>
                        <span>📜 ${s.pubs || 0} Pubs</span>
                    </div>
                </div>`;
            }).join('');

            if(cohortList.length === 0) cards = `<div style="font-size:0.8rem; color:#aaa; font-style:italic; text-align:center; padding:20px;">Empty</div>`;

            columnsHtml += `
                <div style="flex:1; min-width:200px; background:#f8f9fa; border-right:1px solid #eee; display:flex; flex-direction:column;">
                    <div style="padding:10px; background:#eee; border-bottom:1px solid #ddd; text-align:center;">
                        <div style="font-weight:bold; color:#2c3e50;">${title}</div>
                        <div style="font-size:0.7rem; color:#666;">${sub}</div>
                    </div>
                    <div style="padding:10px; overflow-y:auto; flex:1;">
                        ${cards}
                    </div>
                </div>
            `;
        }

        container.innerHTML = `
            <div style="display:flex; flex-direction:column; height:100%;">
                ${dashboard}
                <div style="display:flex; flex:1; overflow-x:auto;">
                    ${columnsHtml}
                </div>
            </div>
        `;
    },
    renderPieChart: function(counts) {
        const total = counts.RA + counts.TA + counts.Fellowship || 1;
        const raP = (counts.RA / total) * 100;
        const taP = (counts.TA / total) * 100;
        const felP = (counts.Fellowship / total) * 100;

        return `
        <svg width="100" height="100" viewBox="0 0 42 42" class="donut">
          <circle class="donut-hole" cx="21" cy="21" r="15.91549430918954" fill="#fff"></circle>
          <circle class="donut-ring" cx="21" cy="21" r="15.91549430918954" fill="transparent" stroke="#dcdcdc" stroke-width="5"></circle>
          <circle cx="21" cy="21" r="15.91549430918954" fill="transparent" stroke="#e74c3c" stroke-width="5" stroke-dasharray="${taP} ${100-taP}" stroke-dashoffset="25"></circle>
          <circle cx="21" cy="21" r="15.91549430918954" fill="transparent" stroke="#2ecc71" stroke-width="5" stroke-dasharray="${raP} ${100-raP}" stroke-dashoffset="${25 - taP}"></circle>
          <circle cx="21" cy="21" r="15.91549430918954" fill="transparent" stroke="#f1c40f" stroke-width="5" stroke-dasharray="${felP} ${100-felP}" stroke-dashoffset="${25 - taP - raP}"></circle>
        </svg>
        `;
    },
renderRecords: function(data) {
        const container = this.elements.screens.records;
        const pubs = data.publications || [];

        if(pubs.length === 0) {
            container.innerHTML = `<div class="empty-state">No publications yet.<br>Research takes time!</div>`;
            return;
        }

        // Sort by Impact High -> Low
        const sortedPubs = [...pubs].sort((a, b) => b.impact - a.impact);
        
        // Find the "Star Professor" (Most Papers)
        const profCounts = {};
        let starProf = { name: "None", count: 0 };
        pubs.forEach(p => {
            profCounts[p.author] = (profCounts[p.author] || 0) + 1;
            if(profCounts[p.author] > starProf.count) {
                starProf = { name: p.author, count: profCounts[p.author] };
            }
        });

        // Generate Table Rows
        const rows = sortedPubs.map((p, index) => {
            let medal = "";
            if (index === 0) medal = "🥇";
            if (index === 1) medal = "🥈";
            if (index === 2) medal = "🥉";
            
            let impactColor = "#555";
            if(p.impact >= 9) impactColor = "#8e44ad"; // Purple
            else if(p.impact >= 6) impactColor = "#2980b9"; // Blue

            return `
            <tr style="border-bottom:1px solid #eee;">
                <td style="padding:12px;">${medal} ${p.year}</td>
                <td style="padding:12px;">
                    <div style="font-weight:bold; color:#2c3e50;">${p.title}</div>
                    <div style="font-size:0.85rem; color:#666; font-style:italic;">${p.journal}</div>
                </td>
                <td style="padding:12px;">${p.author}</td>
                <td style="padding:12px; font-weight:bold; color:${impactColor};">${p.impact.toFixed(1)}</td>
                <td style="padding:12px;">${p.citations}</td>
            </tr>`;
        }).join('');

        container.innerHTML = `
            <div style="padding:20px; background:white; border-bottom:1px solid #ddd; margin-bottom:20px;">
                <h2 style="margin-top:0;">Department Records</h2>
                <div style="display:flex; gap:20px; font-size:0.9rem; color:#666;">
                    <div>Total Publications: <strong style="color:#2c3e50;">${pubs.length}</strong></div>
                    <div>Most Prolific: <strong style="color:#2c3e50;">${starProf.name} (${starProf.count})</strong></div>
                </div>
            </div>
            
            <div style="padding:0 20px 20px 20px;">
                <table style="width:100%; background:white; border-collapse:collapse; box-shadow:0 1px 3px rgba(0,0,0,0.1);">
                    <thead style="background:#f8f9fa; border-bottom:2px solid #ddd;">
                        <tr>
                            <th style="text-align:left; padding:12px; color:#555;">Year</th>
                            <th style="text-align:left; padding:12px; color:#555;">Paper Details</th>
                            <th style="text-align:left; padding:12px; color:#555;">PI</th>
                            <th style="text-align:left; padding:12px; color:#555;">Impact (/10)</th>
                            <th style="text-align:left; padding:12px; color:#555;">Citations</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rows}
                    </tbody>
                </table>
            </div>
        `;
    },
    // --- END PASTE ---
    renderCalendar: function(gameState, viewState) { 
        const container = this.elements.screens.calendar; 
        container.innerHTML = ''; 
        const toolbar = document.createElement('div'); 
        toolbar.className = 'cal-toolbar'; 
        let title = `${CONSTANTS.MONTHS[viewState.month]} ${viewState.year}`; 
        toolbar.innerHTML = `<div><button class="cal-nav-btn" onclick="Game.shiftCalendar(-1)">&#9664;</button><button class="cal-nav-btn" onclick="Game.shiftCalendar(1)">&#9654;</button></div><div class="cal-title">${title}</div><div><button class="cal-nav-btn active">Month</button></div>`; 
        container.appendChild(toolbar); 
        
        const daysInMonth = CONSTANTS.DAYS_IN_MONTH[viewState.month]; 
        const startDayIndex = new Date(viewState.year, viewState.month, 1).getDay(); 
        
        let html = `<div class="calendar-grid">`; 
        CONSTANTS.DAYS_OF_WEEK.forEach(d => { html += `<div class="day-name">${d}</div>`; }); 
        
        for (let i = 0; i < startDayIndex; i++) { html += `<div class="cal-day empty"></div>`; } 
        
        for (let day = 1; day <= daysInMonth; day++) { 
            const isToday = (day === gameState.day && viewState.month === gameState.month && viewState.year === gameState.year); 
            const event = EVENTS_DB.find(e => e.month === viewState.month && e.day === day); 
            let markersHtml = ''; 
            
            if(viewState.month === 7 && day === 15) markersHtml += `<div style="background:#e67e22; color:white; font-size:0.7rem; padding:1px 3px; border-radius:2px; margin-top:2px;">Strategy Mtg</div>`;
            if(viewState.month === 11 && day === 1) markersHtml += `<div style="background:#2980b9; color:white; font-size:0.7rem; padding:1px 3px; border-radius:2px; margin-top:2px;">App Deadline</div>`;
            if(viewState.month === 2 && day === 1) markersHtml += `<div style="background:#8e44ad; color:white; font-size:0.7rem; padding:1px 3px; border-radius:2px; margin-top:2px;">Visit Wknd</div>`;
            if(viewState.month === 3 && day === 15) markersHtml += `<div style="background:#c0392b; color:white; font-size:0.7rem; padding:1px 3px; border-radius:2px; margin-top:2px;">Decisions</div>`;
            if(event) markersHtml += `<div style="background:#c0392b; color:white; font-size:0.7rem; padding:1px 3px; border-radius:2px; margin-top:2px;">${event.title}</div>`; 
            
            html += `<div class="cal-day ${isToday ? 'today' : ''}"><div class="day-num">${day}</div>${markersHtml}</div>`; 
        } 
        html += `</div>`; 
        const wrapper = document.createElement('div'); 
        wrapper.innerHTML = html; 
        container.appendChild(wrapper); 
    },

    showEventModal: function(event) {
        const overlay = document.createElement('div'); overlay.className = 'dossier-overlay'; overlay.style.zIndex = "200"; 
        let choiceHtml = ''; event.choices.forEach((c, idx) => { const isAffordable = State.data.budget >= c.cost; const btnClass = isAffordable ? 'btn-main' : 'btn-small'; const disabledAttr = isAffordable ? '' : 'disabled style="opacity:0.5; cursor:not-allowed;"'; choiceHtml += `<div style="margin-bottom:15px; padding:15px; border:1px solid #ccc; background:white;"><div style="display:flex; justify-content:space-between; margin-bottom:5px;"><span style="font-weight:bold;">${c.text}</span><span style="${c.cost > 0 ? 'color:#c0392b' : 'color:#27ae60'}">${c.cost > 0 ? '-$'+c.cost.toLocaleString() : 'Free'}</span></div><div style="font-size:0.9rem; color:#666; margin-bottom:10px;">${c.flavor}</div><button class="${btnClass}" ${disabledAttr} onclick="Game.resolveEvent(${idx})">Select</button></div>`; });
        overlay.innerHTML = `<div class="dossier-paper" style="max-width:500px;"><h2 style="margin-top:0; border-bottom:2px solid #333; padding-bottom:10px;">${event.title}</h2><p style="font-size:1.1rem; line-height:1.5; color:#444; margin-bottom:20px;">${event.desc}</p><div style="background:#f4f4f4; padding:20px; border:1px solid #ddd;">${choiceHtml}</div></div>`; document.body.appendChild(overlay);
    },

    /* js/ui.js */
    // Helper to categorize emails for the new filter system
    // PASTE THIS RIGHT BEFORE 'renderInbox:'
    getEmailType: function(e) {
        if (e.category === 'urgent' || e.subject.includes('Action:')) return 'urgent';
        if (e.category === 'paper' || e.subject.includes('Accepted')) return 'paper';
        if (e.sender.includes('Search') || e.subject.includes('Candidate') || e.subject.includes('Job Ad')) return 'search';
        if (e.sender.includes('Admissions') || e.sender.includes('Events') || e.subject.includes('Acceptance') || e.subject.includes('Declined') || e.subject.includes('Visit')) return 'admissions';
        if (e.sender === 'Bursar' || e.sender === 'OSP' || e.sender === 'Provost' || e.subject.includes('Grant') || e.subject.includes('Award')) return 'finance';
        return 'notification'; 
    },
    renderInbox: function(emails) { 
        const container = this.elements.screens.office; 
        
        // 1. SETUP LAYOUT (Run once)
        if (!container.querySelector('.outlook-layout')) { 
            container.innerHTML = `
                <div class="outlook-layout">
                    <div class="email-list-pane">
                        <div class="outlook-header" style="flex-direction:column; align-items:flex-start; gap:10px;">
                            <div style="display:flex; justify-content:space-between; width:100%;">
                                <span>Inbox</span><span id="unread-count"></span>
                            </div>
                            
                            <input type="text" placeholder="Search subject or sender..." 
                                oninput="Game.setEmailSearch(this.value)" 
                                style="width:100%; padding:8px; border:1px solid #ccc; border-radius:3px; font-size:0.85rem; box-sizing:border-box;">
                            
                            <div id="email-filter-badges" style="display:flex; flex-wrap:wrap; gap:5px; margin-top:5px;"></div>
                        </div>
                        <div class="email-list-scroll" id="email-list-container"></div>
                    </div>
                    <div class="email-view-pane">
                        <div id="email-reading-view" class="hidden">
                            <div class="email-view-header">
                                <div class="view-subject" id="view-subject"></div>
                                <div id="view-from" style="font-weight:bold; color:#2c3e50;"></div>
                                <div id="view-date" style="font-size:0.8rem; color:#888;"></div>
                            </div>
                            <div class="view-body" id="view-body"></div>
                        </div>
                        <div id="email-empty-view" class="empty-state">Select an email to read.</div>
                    </div>
                </div>`; 
        } 
        
        // 2. RENDER FILTERS (The Badges)
        const filterContainer = document.getElementById('email-filter-badges');
        if(filterContainer) {
            const filters = [
                { key: 'urgent', label: '⚠️ Urgent', color: '#c0392b' },
                { key: 'paper', label: '📄 Papers', color: '#2980b9' },
                { key: 'search', label: '🔎 Faculty Search', color: '#8e44ad' },
                { key: 'admissions', label: '🎓 Admissions', color: '#f1c40f' }, // Yellow needs dark text usually, handling below
                { key: 'finance', label: '💰 Money', color: '#27ae60' },
                { key: 'notification', label: '🔔 Misc', color: '#7f8c8d' }
            ];

            let html = "";
            filters.forEach(f => {
                const isActive = Game.emailFilters[f.key];
                // Visual Styles
                const bg = isActive ? f.color : '#ecf0f1';
                const fg = isActive ? '#fff' : '#95a5a6';
                const border = isActive ? f.color : '#bdc3c7';
                
                // Specific tweak for yellow (Admissions) to be readable
                const textCol = (isActive && f.key === 'admissions') ? '#333' : fg;

                html += `<div onclick="Game.toggleEmailFilter('${f.key}')" 
                          style="padding:3px 8px; border-radius:12px; font-size:0.75rem; cursor:pointer; user-select:none; border:1px solid ${border}; background:${bg}; color:${textCol}; font-weight:bold;">
                          ${f.label}
                         </div>`;
            });
            filterContainer.innerHTML = html;
        }

        const listContainer = document.getElementById('email-list-container'); 
        listContainer.innerHTML = ''; 
        
        // 3. FILTER LOGIC
        const searchFilter = Game.emailSearchQuery || '';
        
        const filteredEmails = emails.filter(e => {
            // A. Check Category using Helper
            const type = this.getEmailType(e);
            if (!Game.emailFilters[type]) return false; // Skip if toggle is OFF
            
            // B. Check Search
            let matchesSearch = true;
            if (searchFilter !== '') {
                matchesSearch = e.subject.toLowerCase().includes(searchFilter) || 
                                e.sender.toLowerCase().includes(searchFilter);
            }

            return matchesSearch;
        });

        // 4. RENDER LIST
        let unread = 0; 
        emails.forEach(e => { if(!e.read) unread++; }); 

        if (filteredEmails.length === 0) {
            listContainer.innerHTML = `<div style="padding:20px; text-align:center; color:#999; font-style:italic;">No emails match filters.</div>`;
        } else {
            filteredEmails.forEach(email => { 
                const item = document.createElement('div'); 
                item.className = `email-item ${email.read ? 'read' : 'unread'}`; 
                
                // Use helper to color code the left border
                const type = this.getEmailType(email);
                let borderColor = "transparent";
                if(type === 'urgent') borderColor = "#c0392b"; 
                else if(type === 'paper') borderColor = "#2980b9"; 
                else if(type === 'search') borderColor = "#8e44ad"; 
                else if(type === 'finance') borderColor = "#27ae60"; 
                else if(type === 'admissions') borderColor = "#f1c40f";

                item.style.borderLeftColor = borderColor;

                item.onclick = () => UI.openEmail(email.id); 
                item.innerHTML = `
                    <div class="email-sender">${email.sender}</div>
                    <div class="email-subject">${email.subject}</div>
                    <div class="email-date">${email.date}</div>`; 
                listContainer.appendChild(item); 
            }); 
        }
        
        const countSpan = document.getElementById('unread-count');
        if(countSpan) countSpan.innerText = unread > 0 ? `${unread} Unread` : ''; 
        
        // Restore focus to search bar if typing
        const input = container.querySelector('input');
        if(input && Game.emailSearchQuery.length > 0) {
            input.value = Game.emailSearchQuery;
            input.focus();
        }
    },

    openEmail: function(id) { 
        const email = State.data.emails.find(e => e.id === id); 
        if (!email) return; 
        email.read = true; 
        this.renderInbox(State.data.emails); 
        document.getElementById('email-empty-view').classList.add('hidden'); 
        document.getElementById('email-reading-view').classList.remove('hidden'); 
        document.getElementById('view-subject').innerText = email.subject; 
        document.getElementById('view-from').innerText = `From: ${email.sender}`; 
        document.getElementById('view-date').innerText = email.date; 
        document.getElementById('view-body').innerHTML = email.body; 
    },
    
    renderLineChart: function(data, label, color) { if (!data || data.length === 0) return ''; const width = 600; const height = 150; const maxVal = Math.max(...data, 10000); const minVal = Math.min(...data, 0); const range = maxVal - minVal || 1000; const points = data.map((val, i) => { let x = data.length > 1 ? (i / (data.length - 1)) * width : width / 2; const y = height - ((val - minVal) / range * height); return `${x},${y}`; }).join(' '); const zeroY = height - ((0 - minVal) / range * height); return `<div style="margin-bottom:20px; background:white; padding:10px; border:1px solid #ddd;"><div style="font-size:0.8rem; font-weight:bold; margin-bottom:5px;">${label}</div><svg width="100%" height="${height}" viewBox="0 0 ${width} ${height}"><line x1="0" y1="${zeroY}" x2="${width}" y2="${zeroY}" stroke="#ccc" stroke-dasharray="4" /><polyline fill="none" stroke="${color}" stroke-width="3" points="${points}" /></svg></div>`; },

    renderFacultySearch: function(data) {
        const container = this.elements.screens.search;
        const search = data.facultySearch;

        if(!search || !search.active) {
            container.innerHTML = `<div class="empty-state"><h2>No Active Search</h2><p>Wait for August 20th to request a faculty line.</p></div>`;
            return;
        }

        if(search.phase === "ads") {
             container.innerHTML = `<div class="empty-state"><h2>Advertising...</h2><p>Collecting CVs. <button class="btn-main" onclick="State.generateFacultyCandidates()">Fast Forward to October (Debug)</button></p></div>`;
             return;
        }

        // List View
        let listHtml = search.pool.map(c => {
            let tierBadge = "";
            if(c.pedigree.tier === 1) tierBadge = "⭐ Elite";
            let statusStyle = "";
            if(c.status === "Shortlist") statusStyle = "border-left: 4px solid #27ae60; background:#f0fcf4;";

            return `
            <div class="email-item" style="${statusStyle}" onclick="UI.viewCV(${c.id})">
                <div class="email-sender">${c.name} <span style="font-size:0.7rem; color:#f39c12">${tierBadge}</span></div>
                <div class="email-subject">${c.pedigree.phd} -> ${c.pedigree.postdoc}</div>
                <div class="email-date">H-Index: ${c.hIndex}</div>
            </div>`;
        }).join('');

        container.innerHTML = `
        <div class="outlook-layout">
            <div class="email-list-pane">
                <div class="outlook-header">Candidate Pool (${search.pool.length})</div>
                <div class="email-list-scroll">${listHtml}</div>
            </div>
            <div class="email-view-pane" id="cv-view-pane">
                <div class="empty-state">Select a candidate to review CV.</div>
            </div>
        </div>`;
    },

    viewCV: function(id) {
        const c = State.data.facultySearch.pool.find(x => x.id === id);
        const pane = document.getElementById('cv-view-pane');
        const phase = State.data.facultySearch.phase; // 'longlist' or 'interview' or 'complete'
        
        // --- 1. ACTION AREA LOGIC ---
        let actionArea = "";
        
        // PHASE 1: LONGLIST (October) - Only allow Shortlisting
        if(phase === 'longlist') {
            if(c.status === 'Applied') {
                actionArea = `<div style="background:#fff; border:1px solid #ddd; padding:15px; text-align:center;">
                    <p>Reviewing Applications (Oct)</p>
                    <button class="btn-main" onclick="State.shortlistCandidate(${c.id})">Shortlist Candidate</button>
                </div>`;
            } else if (c.status === 'Shortlist') {
                actionArea = `<div style="background:#e8f8f5; border:1px solid #2ecc71; padding:15px; text-align:center; color:#27ae60; font-weight:bold;">
                    ✅ Shortlisted for November
                </div>`;
            }
        
        // PHASE 2: INTERVIEWS (November+) - Allow Interviews & Offers
        } else if(phase === 'interview') {
            
            if(c.status === 'Shortlist') {
                // Generate Question Buttons
                let interviewButtons = "";
                if(typeof FACULTY_INTERVIEWS !== 'undefined') {
                    FACULTY_INTERVIEWS.QUESTIONS.forEach(q => {
                        const alreadyAsked = c.interviewLog.find(log => log.q === q.text);
                        if(!alreadyAsked) {
                            interviewButtons += `<button class="btn-small" style="margin:2px;" onclick="State.interviewFaculty(${c.id}, '${q.id}')">${q.text}</button> `;
                        }
                    });
                }
                if(interviewButtons === "") interviewButtons = "<small>All questions asked.</small>";

                // Generate Log
                let logHtml = "";
                if(c.interviewLog.length > 0) {
                    logHtml = c.interviewLog.map(l => `<div style="margin-bottom:8px; border-bottom:1px solid #eee; padding-bottom:5px;"><strong>Q: ${l.q}</strong><br><em style="color:#555;">"${l.a}"</em></div>`).join('');
                    logHtml = `<div style="margin-top:10px; background:#f9f9f9; padding:10px; border:1px solid #eee; max-height:150px; overflow-y:auto;">${logHtml}</div>`;
                }

                actionArea = `
                    <div style="background:#fdfbf7; padding:15px; border:1px solid #ccc; margin-bottom:20px;">
                        <h4 style="margin-top:0;">1. Interview Phase</h4>
                        <div style="margin-bottom:10px;">${interviewButtons}</div>
                        ${logHtml}
                    </div>

                    <div style="background:#f4f4f4; padding:15px; border:1px solid #ccc; border-radius:4px;">
                        <h4 style="margin-top:0;">2. Job Offer</h4>
                        <div style="margin-bottom:10px;">
                            <label>Startup Package Offer ($):</label><br>
                            <input type="number" id="offer-amt-${c.id}" value="${c.startupAsk}" style="font-size:1.1rem; padding:5px; width:150px;">
                        </div>
                        <button class="btn-main" style="background:#27ae60; color:white;" 
                            onclick="State.makeFacultyOffer(${c.id}, parseInt(document.getElementById('offer-amt-${c.id}').value))">
                            Send Final Offer
                        </button>
                    </div>`;
            } else {
                 actionArea = `<div style="padding:15px; text-align:center; color:#999;">Candidate Rejected (Not Shortlisted)</div>`;
            }
        } else {
            // Search Complete / Inactive
            let color = c.status === 'Declined' ? '#c0392b' : '#2c3e50';
            actionArea = `<button class="btn-main" disabled style="border-color:${color}; color:${color}; width:100%;">${c.status}</button>`;
        }

        // --- 2. RENDER THE CV ---
        pane.innerHTML = `
        <div class="dossier-paper" style="margin:20px; height:90%; overflow-y:auto;">
            <div style="border-bottom:2px solid #333; padding-bottom:10px; margin-bottom:20px; display:flex; justify-content:space-between; align-items:end;">
                <div>
                    <h1 style="margin:0; font-family:'Georgia', serif;">${c.name}</h1>
                    <div style="font-style:italic;">${c.field} Chemist</div>
                </div>
                <div style="text-align:right;">
                    <div style="background:#2c3e50; color:white; padding:2px 8px; font-size:0.8rem; border-radius:4px; display:inline-block; margin-bottom:5px;">${c.field}</div>
                    <div><strong>H-Index:</strong> ${c.hIndex}</div>
                </div>
            </div>

            <div class="dossier-section">
                <div class="dossier-label">Education & Training</div>
                <div style="margin-bottom:5px;"><strong>PhD:</strong> ${c.pedigree.phd}</div>
                <div style="margin-bottom:5px;"><strong>Postdoc:</strong> ${c.pedigree.postdoc}</div>
            </div>

            <div class="dossier-section">
                <div class="dossier-label">Lab Strategy</div>
                <div style="margin-bottom:5px;"><strong>Target Lab Size:</strong> ${c.labSize || "Medium"}</div>
                <p>My work in ${c.field} chemistry requires a ${c.startupAsk > 600000 ? "high-capital equipment setup" : "standard wet-lab setup"}. 
                I intend to pursue funding immediately upon arrival.</p>
            </div>

            <div class="dossier-section">
                <div class="dossier-label">Startup Demand</div>
                <div style="font-size:1.5rem; color:#c0392b; font-weight:bold;">$${c.startupAsk.toLocaleString()}</div>
            </div>

            <div style="margin-top:30px;">
                ${actionArea}
            </div>
        </div>`;
    },
    // --- PASTE THIS AT THE BOTTOM OF THE UI OBJECT in js/ui.js ---

    // 1. The Tenure Dossier (For the "View Dossier" button on Assistant Profs)
    viewTenureDossier: function(id) {
        const f = State.data.faculty.find(x => x.id === id);
        if(!f || !f.tenureTrack) return;
        
        const tt = f.tenureTrack;
        
        // Calculate Trajectory
        const pubsPerYear = tt.year > 0 ? (tt.stats.totalPubs / tt.year).toFixed(1) : "0.0";
        let status = "On Track";
        let statusColor = "#27ae60"; // Green
        if(pubsPerYear < 1.0) { status = "At Risk"; statusColor = "#e74c3c"; } // Red
        else if(pubsPerYear < 2.0) { status = "Borderline"; statusColor = "#f39c12"; } // Orange

        // Create History Rows
        const historyRows = tt.history.map(h => `
            <div style="display:flex; border-bottom:1px solid #eee; padding:5px 0; font-size:0.85rem;">
                <div style="width:50px;">Yr ${h.year}</div>
                <div style="flex:1;">H-Index: ${h.hIndex}</div>
                <div style="flex:1;">Cum. Pubs: ${h.pubs}</div>
            </div>`).join('');

        const overlay = document.createElement('div');
        overlay.className = 'dossier-overlay';
        overlay.innerHTML = `
            <div class="dossier-paper" style="width:700px; max-height:90vh; overflow-y:auto;">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; border-bottom:2px solid #333; padding-bottom:15px; margin-bottom:20px;">
                    <div>
                        <div style="font-size:0.9rem; text-transform:uppercase; color:#666; letter-spacing:1px;">Tenure & Promotion Dossier</div>
                        <h1 style="margin:5px 0; font-family:'Georgia', serif;">${f.name}</h1>
                        <div style="font-size:1.1rem; color:#2c3e50;">${f.field} Chemistry</div>
                    </div>
                    <div style="text-align:right;">
                        <div style="font-size:3rem; font-weight:bold; color:${statusColor}; line-height:1;">${tt.year}<span style="font-size:1rem; color:#999; font-weight:normal;">/6</span></div>
                        <div style="font-size:0.8rem; color:#666;">YEARS COMPLETED</div>
                    </div>
                </div>

                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:20px; margin-bottom:30px;">
                    <div style="background:#f8f9fa; padding:20px; border:1px solid #e9ecef;">
                        <h3 style="margin-top:0; border-bottom:1px solid #ddd; padding-bottom:5px;">Research Output</h3>
                        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:15px; margin-bottom:15px;">
                            <div>
                                <div style="font-size:2rem; font-weight:bold; color:#2c3e50;">${tt.stats.totalPubs}</div>
                                <div style="font-size:0.8rem; color:#666;">Total Publications</div>
                            </div>
                            <div>
                                <div style="font-size:2rem; font-weight:bold; color:#2c3e50;">${pubsPerYear}</div>
                                <div style="font-size:0.8rem; color:#666;">Avg Pubs/Year</div>
                            </div>
                        </div>
                        
                        <h3 style="margin-top:20px; border-bottom:1px solid #ddd; padding-bottom:5px;">Funding Secured</h3>
                        <div style="font-size:2rem; font-weight:bold; color:#27ae60;">$${tt.stats.totalGrants.toLocaleString()}</div>
                        <div style="font-size:0.8rem; color:#666;">Total Grant Revenue</div>
                    </div>

                    <div>
                        <h3 style="margin-top:0; border-bottom:1px solid #ddd; padding-bottom:5px;">Mentorship</h3>
                        <ul style="list-style:none; padding:0; line-height:2;">
                            <li><strong>Current Lab Size:</strong> ${f.students.length} Students</li>
                            <li><strong>Recruited (Total):</strong> ${tt.stats.studentsRecruited || f.students.length} Students</li>
                            <li><strong>Graduated:</strong> ${tt.stats.studentsGraduated || 0} PhDs</li>
                        </ul>

                        <div style="margin-top:20px; padding:15px; background:${statusColor}20; border-left:4px solid ${statusColor};">
                            <strong>Committee Projection:</strong> ${status}
                            <p style="font-size:0.85rem; margin:5px 0 0 0;">
                                To secure tenure, the candidate needs to maintain funding and publish ~2 papers/year.
                            </p>
                        </div>
                    </div>
                </div>

                <h3 style="border-bottom:1px solid #ddd; padding-bottom:5px;">Annual Progress History</h3>
                <div style="background:white; border:1px solid #eee; padding:10px;">
                    <div style="display:flex; font-weight:bold; color:#999; font-size:0.8rem; padding-bottom:5px;">
                        <div style="width:50px;">Year</div>
                        <div style="flex:1;">H-Index Growth</div>
                        <div style="flex:1;">Publications</div>
                    </div>
                    ${historyRows}
                    ${historyRows.length === 0 ? '<div style="padding:10px; color:#999;">No history yet.</div>' : ''}
                </div>

                <div style="margin-top:30px; text-align:right;">
                    <button class="btn-main" onclick="document.querySelector('.dossier-overlay').remove()">Close Dossier</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
    },

    // 2. The Faculty Detail (For clicking the Name of ANY professor)
    /* js/ui.js */

    viewFacultyDetail: function(id) {
        // This line is the key! It forces the new logic to run.
        this.refreshFacultyModal(id, true);
    },
    /* js/ui.js */

    /* js/ui.js */

    /* js/ui.js */

    /* js/ui.js */

    /* js/ui.js */

    refreshFacultyModal: function(id, createNew = false) {
        const f = State.data.faculty.find(x => x.id === id);
        if(!f) return;

        // Force Math Update (uses the new Stable Random logic)
        if(State.recalcFacultyFinances) State.recalcFacultyFinances(f);

        // -- DATA PREP --
        const students = State.data.students.filter(s => s.advisorId === id);
        students.sort((a,b) => {
            if(a.funding === 'RA' && b.funding !== 'RA') return -1;
            if(a.funding !== 'RA' && b.funding === 'RA') return 1;
            return b.year - a.year; 
        });

        // -- HTML: EXPENSES BREAKDOWN --
        let breakdownHtml = '<div style="color:#999; font-style:italic;">No active expenses.</div>';
        if (f.burnBreakdown) {
            breakdownHtml = f.burnBreakdown.split('\n').map(line => {
                const label = line.split(':')[0];
                const val = line.split(':')[1] || '';
                return `<div style="display:flex; justify-content:space-between; border-bottom:1px solid #eee; padding:2px 0;">
                            <span>${label}</span>
                            <span style="font-weight:bold;">${val}</span>
                        </div>`;
            }).join('');
        }

        // -- HTML: COMPACT GRANT LIST --
        let grantHtml = '<div style="color:#999; font-style:italic; font-size:0.8rem;">No active grants.</div>';
        if(f.grants && f.grants.length > 0) {
            grantHtml = f.grants.map(g => `
                <div style="display:flex; justify-content:space-between; font-size:0.8rem; border-bottom:1px dashed #ccc; padding:2px 0;">
                    <span style="color:#2c3e50; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:60%;" title="${g.name}">${g.name}</span>
                    <span style="font-weight:bold; color:#27ae60;">$${(g.remaining/1000).toFixed(0)}k</span>
                </div>`).join('');
        }

        // -- HTML: COMPACT PENDING APPS --
        let appHtml = '';
        if(f.pendingApps && f.pendingApps.length > 0) {
            appHtml = `<div style="margin-top:8px; border-top:1px solid #eee; padding-top:4px;">
                <div style="font-size:0.7rem; color:#f39c12; font-weight:bold; margin-bottom:2px;">PENDING</div>
                ${f.pendingApps.map(a => `
                    <div style="display:flex; justify-content:space-between; font-size:0.75rem; color:#666;">
                        <span>${a.agency} ($${(a.amount/1000).toFixed(0)}k)</span>
                        <span>${a.weeksToDecision - a.weeksPending}w</span>
                    </div>
                `).join('')}
            </div>`;
        }

        // -- LIVE UPDATE LOGIC --
        const existingOverlay = document.getElementById('modal-faculty-detail');
        if (!createNew && existingOverlay && existingOverlay.getAttribute('data-fac-id') == id) {
            
            // Stats
            const elReserves = document.getElementById('live-fac-reserves');
            if(elReserves) elReserves.innerText = "$" + f.funds.toLocaleString();
            
            const elBurn = document.getElementById('live-fac-burn');
            if(elBurn) elBurn.innerText = "$" + (f.burnRate/4.3).toFixed(0) + "/wk";
            
            const elRunway = document.getElementById('live-fac-runway');
            if(elRunway) {
                elRunway.innerText = f.runway;
                elRunway.style.color = f.runway.includes('0.0') ? '#e74c3c' : '#27ae60';
            }

            // HTML Blocks
            const elBreakdown = document.getElementById('live-burn-breakdown');
            if(elBreakdown) elBreakdown.innerHTML = breakdownHtml;

            const elGrants = document.getElementById('live-grant-list');
            if(elGrants) elGrants.innerHTML = grantHtml + appHtml;

            return; 
        }

        // -- HTML GENERATION (Structure) --
        const studentRows = students.map(s => {
            let badgeColor = "#7f8c8d";
            if(s.funding === "RA") badgeColor = "#27ae60"; 
            if(s.funding === "TA") badgeColor = "#c0392b"; 
            if(s.funding === "Fellowship") badgeColor = "#f1c40f"; 
            const title = s.year > 2 ? "Candidate" : "Student";

            return `
            <div style="display:flex; justify-content:space-between; border-bottom:1px solid #eee; padding:6px 0; align-items:center;">
                <div>
                    <div style="font-weight:bold; font-size:0.9rem;">${s.name.split(' (')[0]}</div>
                    <div style="font-size:0.75rem; color:#666;">Yr ${s.year} ${title}</div>
                </div>
                <div style="text-align:right;">
                    <span style="background:${badgeColor}; color:white; padding:1px 5px; border-radius:3px; font-size:0.7rem; font-weight:bold;">${s.funding}</span>
                    <div style="font-size:0.7rem; color:#999; margin-top:1px;">
                        🧠${s.stats.brains} ✋${s.stats.hands}
                    </div>
                </div>
            </div>`;
        }).join('');

        const htmlContent = `
            <div class="dossier-paper" style="width:650px; max-height:90vh; overflow-y:auto; font-family:'Helvetica Neue', sans-serif;">
                <div style="border-bottom:2px solid #2c3e50; padding-bottom:10px; margin-bottom:15px; display:flex; justify-content:space-between; align-items:center;">
                    <h2 style="margin:0; color:#2c3e50;">${f.name}</h2>
                    <span style="background:#eee; padding:4px 8px; border-radius:4px; font-size:0.9rem;">${f.field} Lab</span>
                </div>

                <div style="display:grid; grid-template-columns: 1fr 1fr 1fr; gap:10px; margin-bottom:15px; text-align:center;">
                    <div style="background:#f8f9fa; padding:8px; border:1px solid #ddd; border-radius:5px;">
                        <div style="font-size:0.75rem; color:#666; text-transform:uppercase;">Reserves</div>
                        <div id="live-fac-reserves" style="font-size:1.1rem; font-weight:bold; color:#2c3e50;">$${f.funds.toLocaleString()}</div>
                    </div>
                    <div style="background:#f8f9fa; padding:8px; border:1px solid #ddd; border-radius:5px;">
                        <div style="font-size:0.75rem; color:#666; text-transform:uppercase;">Burn Rate</div>
                        <div id="live-fac-burn" style="font-size:1.1rem; font-weight:bold; color:#c0392b;">$${(f.burnRate/4.3).toFixed(0)}/wk</div>
                    </div>
                    <div style="background:#f8f9fa; padding:8px; border:1px solid #ddd; border-radius:5px;">
                        <div style="font-size:0.75rem; color:#666; text-transform:uppercase;">Runway</div>
                        <div id="live-fac-runway" style="font-size:1.1rem; font-weight:bold; color:${f.runway.includes('0.0') ? '#e74c3c' : '#27ae60'};">${f.runway}</div>
                    </div>
                </div>

                <div style="display:flex; gap:15px; margin-bottom:15px;">
                    
                    <div style="flex:1; background:#f0fcf4; border:1px solid #2ecc71; border-radius:5px; padding:12px;">
                        <h4 style="margin-top:0; margin-bottom:8px; color:#27ae60; font-size:0.75rem; text-transform:uppercase; letter-spacing:1px; border-bottom:1px solid #c3e6cb; padding-bottom:4px;">Funding Sources</h4>
                        <div id="live-grant-list">
                            ${grantHtml}
                            ${appHtml}
                        </div>
                    </div>

                    <div style="flex:1; background:#fff5f5; border:1px solid #feb2b2; border-radius:5px; padding:12px;">
                        <h4 style="margin-top:0; margin-bottom:8px; color:#c0392b; font-size:0.75rem; text-transform:uppercase; letter-spacing:1px; border-bottom:1px solid #fecaca; padding-bottom:4px;">Weekly Expenses</h4>
                        <div id="live-burn-breakdown" style="font-size:0.85rem; color:#444;">
                            ${breakdownHtml}
                        </div>
                    </div>
                </div>

                <h3 style="margin-bottom:8px; border-bottom:1px solid #ddd; font-size:1rem;">Lab Roster (${students.length})</h3>
                <div style="max-height:250px; overflow-y:auto; background:white; padding:10px; border:1px solid #eee;">
                    ${studentRows.length > 0 ? studentRows : '<div style="color:#999; text-align:center;">No students currently in lab.</div>'}
                </div>

                <div style="margin-top:15px; text-align:right;">
                    <button class="btn-main" onclick="document.getElementById('modal-faculty-detail').remove()">Close Details</button>
                </div>
            </div>`;

        const existing = document.getElementById('modal-faculty-detail');
        if(existing) existing.remove();

        const overlay = document.createElement('div');
        overlay.className = 'dossier-overlay';
        overlay.id = 'modal-faculty-detail';
        overlay.setAttribute('data-fac-id', id);
        overlay.innerHTML = htmlContent;
        document.body.appendChild(overlay);
    }
};