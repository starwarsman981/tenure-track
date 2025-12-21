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
            admissions: document.getElementById('screen-admissions')
        },
        navItems: {
            office: document.getElementById('nav-office'),
            calendar: document.getElementById('nav-calendar'),
            faculty: document.getElementById('nav-faculty'),
            finance: document.getElementById('nav-finance'),
            admissions: document.getElementById('nav-admissions')
        }
    },

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
            State.setRecruitmentStrategy(target, strat);
            State.addEmail("Admin", "Strategy Confirmed", `We have set the target to ${target} students and authorized the marketing budget.`);
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

    renderFaculty: function(roster, filters) { 
        const container = this.elements.screens.faculty; 
        container.innerHTML = ''; 
        let displayList = [...roster]; 
        if (filters.rank !== 'all') displayList = displayList.filter(p => p.rank === filters.rank); 
        if (filters.field !== 'all') displayList = displayList.filter(p => p.field === filters.field); 
        displayList.sort((a, b) => { 
            if (filters.sort === 'runway') { 
                const rA = a.runway === 'Inf' ? 999 : parseFloat(a.runway); 
                const rB = b.runway === 'Inf' ? 999 : parseFloat(b.runway); 
                return rA - rB; 
            } 
            return b[filters.sort] - a[filters.sort]; 
        }); 
        const isSel = (cat, val) => filters[cat] === val ? 'selected' : '';
        const toolbar = document.createElement('div'); 
        toolbar.className = 'cal-toolbar'; 
        toolbar.innerHTML = `
            <div style="display:flex; gap:10px;">
                <select onchange="Game.setRosterFilter('rank', this.value)" style="padding:5px;">
                    <option value="all" ${isSel('rank','all')}>Rank: All</option>
                    <option value="Adjunct" ${isSel('rank','Adjunct')}>Adjunct</option>
                    <option value="Assistant" ${isSel('rank','Assistant')}>Assistant</option>
                    <option value="Associate" ${isSel('rank','Associate')}>Associate</option>
                    <option value="Full" ${isSel('rank','Full')}>Full</option>
                </select>
                <select onchange="Game.setRosterFilter('field', this.value)" style="padding:5px;">
                    <option value="all" ${isSel('field','all')}>Field: All</option>
                    <option value="Organic" ${isSel('field','Organic')}>Organic</option>
                    <option value="Inorganic" ${isSel('field','Inorganic')}>Inorganic</option>
                    <option value="Physical" ${isSel('field','Physical')}>Physical</option>
                    <option value="Analytical" ${isSel('field','Analytical')}>Analytical</option>
                    <option value="Materials" ${isSel('field','Materials')}>Materials</option>
                </select>
            </div>
            <div style="font-weight:bold; color:#666;">${displayList.length} Faculty</div>
            <div>
                <select onchange="Game.setRosterSort(this.value)" style="padding:5px;">
                    <option value="hIndex" ${filters.sort === 'hIndex' ? 'selected' : ''}>Sort: H-Index</option>
                    <option value="runway" ${filters.sort === 'runway' ? 'selected' : ''}>Sort: Runway</option>
                    <option value="salary" ${filters.sort === 'salary' ? 'selected' : ''}>Sort: Salary</option>
                </select>
            </div>`; 
        container.appendChild(toolbar); 
        const grid = document.createElement('div'); 
        grid.className = 'roster-grid'; 
        displayList.forEach(prof => { 
            const card = document.createElement('div'); 
            card.className = `prof-card rank-${prof.rank}`; 
            card.onclick = () => UI.showDossier(prof); 
            let runwayColor = "#555"; 
            if (prof.runway !== 'Inf' && prof.runway !== 'Stable') { 
                const r = parseFloat(prof.runway); 
                if (r < 6) runwayColor = "#c0392b"; 
                else if (r < 12) runwayColor = "#f39c12"; 
                else runwayColor = "#27ae60"; 
            } 
            let fundsDisplay = prof.rank === 'Adjunct' ? "No Lab" : `$${(prof.funds/1000).toFixed(0)}k Reserves`;
            if (prof.grants.length > 0) fundsDisplay = `${prof.grants.length} Active Grants`;
            let happyColor = "#27ae60";
            if(prof.happiness < 70) happyColor = "#f39c12";
            if(prof.happiness < 40) happyColor = "#c0392b";
            card.innerHTML = `
                <div class="prof-header">
                    <div><div class="prof-name">Dr. ${prof.name}</div><div class="prof-title">${prof.rankLabel}</div></div>
                    <div class="prof-field">${prof.field}</div>
                </div>
                <div class="prof-stats-row"><span>h-index: <strong>${prof.hIndex}</strong></span><span>Grads: <strong>${prof.students ? prof.students.length : 0}</strong></span></div>
                <div class="prof-stats-row" style="margin-top:5px;"><span style="font-size:0.75rem;">${fundsDisplay}</span><span style="color:${runwayColor}; font-weight:bold; font-size:0.75rem;">Runway: ${prof.runway}</span></div>
                <div style="margin-top:5px; font-size:0.7rem;">Morale: <span style="color:${happyColor}; font-weight:bold;">${Math.floor(prof.happiness || 100)}%</span></div>`; 
            grid.appendChild(card); 
        }); 
        container.appendChild(grid); 
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

    renderAdmissions: function(data) {
        const existingList = document.getElementById('adm-list-container');
        let scrollPos = 0; if(existingList) scrollPos = existingList.scrollTop;
        const container = this.elements.screens.admissions; const adm = data.admissions;

        if (!adm.pool || adm.pool.length === 0) {
            let status = "Admissions Cycle"; let subtext = "";
            if (data.month === 7 && data.day < 15) { status = "Pre-Season"; subtext = "Recruitment Strategy meeting is on Aug 15."; } 
            else if (!adm.setupComplete) { status = "Strategy Needed"; subtext = "Check your email to set the recruitment strategy."; } 
            else { status = "Recruitment Active"; subtext = `Target Cohort: ${adm.targetSize} Students. Applications arrive Dec 1.`; }
            container.innerHTML = `<div class="empty-state"><h2>${status}</h2><p>${subtext}</p></div>`; return;
        }

        let displayPool = adm.pool;
        const f = Game.admissionsFilters;
        if(f.field !== 'all') displayPool = displayPool.filter(a => a.interest === f.field);
        if(f.gpa !== 'all') {
            if(f.gpa === 'high') displayPool = displayPool.filter(a => parseFloat(a.application.gpa) >= 3.8);
            if(f.gpa === 'mid') displayPool = displayPool.filter(a => parseFloat(a.application.gpa) >= 3.3 && parseFloat(a.application.gpa) < 3.8);
            if(f.gpa === 'low') displayPool = displayPool.filter(a => parseFloat(a.application.gpa) < 3.3);
        }
        if(f.rec !== 'all') {
            if(f.rec === 'strong') displayPool = displayPool.filter(a => a.application.recScore >= 8);
            if(f.rec === 'avg') displayPool = displayPool.filter(a => a.application.recScore >= 5 && a.application.recScore < 8);
            if(f.rec === 'weak') displayPool = displayPool.filter(a => a.application.recScore < 5);
        }

        const offersCount = adm.pool.filter(a => a.status === "Offer Extended" || a.status === "Accepted").length;
        const targetOffers = Math.ceil(adm.targetSize * 1.5);
        const offersPercent = Math.min(100, (offersCount / targetOffers) * 100);

        container.innerHTML = `
        <div class="outlook-layout">
            <div class="email-list-pane">
                <div style="background:#2c3e50; color:white; padding:10px; font-size:0.8rem;">
                    <div>Offers Extended: <strong>${offersCount}</strong> / Target: <strong>${targetOffers}</strong></div>
                    <div style="background:rgba(255,255,255,0.2); height:5px; margin-top:5px; border-radius:3px;">
                        <div style="width:${offersPercent}%; background:#2ecc71; height:100%; border-radius:3px;"></div>
                    </div>
                </div>
                <div class="outlook-header" style="flex-wrap:wrap; gap:5px; padding:5px;">
                    <select onchange="Game.setAdmissionsFilter('field', this.value)" style="font-size:0.75rem; flex:1;">
                        <option value="all" ${f.field==='all'?'selected':''}>Field: All</option>
                        <option value="Organic" ${f.field==='Organic'?'selected':''}>Organic</option>
                        <option value="Inorganic" ${f.field==='Inorganic'?'selected':''}>Inorganic</option>
                        <option value="Physical" ${f.field==='Physical'?'selected':''}>Physical</option>
                    </select>
                    <select onchange="Game.setAdmissionsFilter('gpa', this.value)" style="font-size:0.75rem; flex:1;">
                        <option value="all" ${f.gpa==='all'?'selected':''}>GPA: All</option>
                        <option value="high" ${f.gpa==='high'?'selected':''}>High (3.8+)</option>
                        <option value="mid" ${f.gpa==='mid'?'selected':''}>Mid (3.3+)</option>
                        <option value="low" ${f.gpa==='low'?'selected':''}>Low</option>
                    </select>
                    <select onchange="Game.setAdmissionsFilter('rec', this.value)" style="font-size:0.75rem; flex:1;">
                        <option value="all" ${f.rec==='all'?'selected':''}>Rec: All</option>
                        <option value="strong" ${f.rec==='strong'?'selected':''}>Strong (8+)</option>
                        <option value="avg" ${f.rec==='avg'?'selected':''}>Avg (5-7)</option>
                        <option value="weak" ${f.rec==='weak'?'selected':''}>Weak</option>
                    </select>
                </div>
                <div class="email-list-scroll" id="adm-list-container"></div>
            </div>
            <div class="email-view-pane" id="adm-detail-container"><div class="empty-state">Select an applicant.</div></div>
        </div>`;
        
        const listContainer = document.getElementById('adm-list-container');
        const detailContainer = document.getElementById('adm-detail-container');

        displayPool.forEach(app => {
            const item = document.createElement('div'); item.className = 'email-item'; 
            if (adm.selectedApplicantId === app.id) item.classList.add('active');
            item.onclick = () => { adm.selectedApplicantId = app.id; UI.renderAdmissions(data); };
            
            let tags = "";
            if(app.isInternational) tags += `<span style="background:#8e44ad; color:#fff; padding:1px 4px; font-size:0.7rem; border-radius:3px; margin-right:5px;">INTL</span>`;
            if(app.application.hasFellowship) tags += `<span style="background:#f1c40f; color:#fff; padding:1px 4px; font-size:0.7rem; border-radius:3px; margin-right:5px;">Fellowship</span>`;
            
            let statusBadge = app.status;
            if(app.status === 'Offer Extended') statusBadge = '📜 Offer Sent';
            if(app.status === 'Accepted') statusBadge = '✅ Accepted';
            if(app.status === 'Declined' || app.status === 'Rejected') statusBadge = '❌ Closed';

            item.innerHTML = `<div class="email-sender">${app.name}</div><div class="email-subject">${tags}${app.interest} | GPA: ${app.application.gpa}</div><div class="email-date">${statusBadge}</div>`;
            listContainer.appendChild(item);
        });
        if(listContainer) listContainer.scrollTop = scrollPos;

        if (adm.selectedApplicantId) {
            const app = adm.pool.find(a => a.id === adm.selectedApplicantId);
            if (app) {
                let chatHtml = "";
                app.interview.log.forEach(e => { chatHtml += `<div style="margin-bottom:10px; font-size:0.9rem;"><strong>${e.question}</strong><br><i>${e.answer}</i></div>`; });
                
                let actionsHtml = "";
                if(app.status === 'Pending' && app.interview.points > 0 && typeof ADMISSIONS !== 'undefined') {
                    ADMISSIONS.QUESTIONS.forEach(q => {
                        if(!app.interview.log.find(l => l.question === q.text)) {
                            actionsHtml += `<button class="btn-small" style="margin-right:5px; margin-bottom:5px;" onclick="Game.runInterview('${app.id}', '${q.id}')">${q.text}</button>`;
                        }
                    });
                }

                let statsHtml = `<div style="color:#999; font-style:italic;">Hidden (Requires Flyout/Visit)</div>`;
                if(app.statsVisible) {
                    let fuzzyFunc = (v) => "Unknown";
                    if(typeof ApplicantGenerator !== 'undefined') fuzzyFunc = ApplicantGenerator.getFuzzyStat;
                    statsHtml = `<div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; font-size:0.9rem;"><div>Brains: <strong>${fuzzyFunc(app.stats.brains)}</strong></div><div>Hands: <strong>${fuzzyFunc(app.stats.hands)}</strong></div><div>Grit: <strong>${fuzzyFunc(app.stats.grit)}</strong></div><div>Ambition: <strong>${fuzzyFunc(app.stats.ambition)}</strong></div></div>`;
                }

                let matchHtml = `<div style="color:#999;">No specific faculty match.</div>`;
                if(app.matches && app.matches.length > 0) {
                    matchHtml = app.matches.map(m => `<div><strong style="color:#2c3e50;">${m.name}</strong>: ${m.reason}</div>`).join('');
                }
                
                // --- FACULTY OPINIONS UI ---
                let opinionHtml = "";
                if (app.lobbying) {
                    const color = app.lobbying.type === 'support' ? '#d4edda' : '#f8d7da';
                    const border = app.lobbying.type === 'support' ? '#c3e6cb' : '#f5c6cb';
                    const icon = app.lobbying.type === 'support' ? '👍' : '👎';
                    opinionHtml = `<div style="background:${color}; border:1px solid ${border}; padding:10px; margin-bottom:10px; border-radius:4px; font-size:0.9rem;"><strong>${icon} Faculty Opinion:</strong> ${app.lobbying.text}</div>`;
                }

                let felHtml = "";
                if(app.application.hasFellowship) felHtml = `<div style="background:#fffbf0; border:1px solid #f1c40f; padding:10px; margin-bottom:10px; color:#b7950b;"><strong>🌟 External Fellowship:</strong> Free to department!</div>`;
                if(app.isInternational) felHtml += `<div style="background:#f3e5f5; border:1px solid #8e44ad; padding:10px; margin-bottom:10px; color:#6c3483;"><strong>🌍 International Student:</strong> Cannot use Federal Grants. Visa Risk: Moderate.</div>`;

                const rs = app.application.recScore;
                const recColor = rs >= 8 ? '#27ae60' : (rs <= 4 ? '#c0392b' : '#f39c12');

                let mainButtons = '';
                if(app.status === 'Pending') {
                    mainButtons = `
                        <div style="display:flex; gap:10px; margin-bottom:10px;">
                            <button class="btn-main" style="background:#27ae60; flex:1;" onclick="Game.offer('${app.id}', false)">Extend Offer</button>
                            <button class="btn-main" style="background:#2980b9; flex:1;" onclick="Game.offer('${app.id}', true)">Offer + Flyout (-$500)</button>
                        </div>
                        <div style="display:flex; gap:10px;">
                            <button class="btn-main" style="background:#f39c12; flex:1;" onclick="State.sweetenOffer('${app.id}')">Sweeten (Dean's Bonus)</button>
                            <button class="btn-main" style="background:#c0392b; flex:1;" onclick="Game.reject('${app.id}')">Reject</button>
                        </div>
                    `;
                    if(!app.flownOut) { 
                        mainButtons += `<div style="margin-top:10px; text-align:center;"><button class="btn-small" onclick="Game.flyout('${app.id}')">Just Flyout (No Offer yet) - $500</button></div>`; 
                    }
                } else mainButtons = `<div style="font-weight:bold;">Status: ${app.status}</div>`;

                detailContainer.innerHTML = `<div class="email-view-header"><div class="view-subject">${app.name}</div><div class="view-meta"><span>Field: <strong>${app.interest}</strong></span><span>Rec Letter: <strong style="color:${recColor}">${rs}/10</strong></span></div><div style="margin-top:15px;">${mainButtons}</div></div><div class="view-body">${felHtml}${opinionHtml}<div style="display:flex; gap:20px; margin-bottom:20px; border-bottom:1px solid #eee; padding-bottom:20px;"><div style="flex:1;"><div class="dossier-label">Record</div><div>GPA: ${app.application.gpa}</div><div>GRE: ${app.application.gre}</div><div style="margin-top:5px; font-style:italic; font-size:0.9rem;">"${app.facultyNote}"</div></div><div style="flex:1; background:#fffdf5; padding:10px; border:1px solid #efe8d0;"><div class="dossier-label">Faculty Alignment</div>${matchHtml}</div></div><div style="margin-bottom:20px; background:#f0f4f8; padding:10px; border-radius:4px;"><div class="dossier-label">True Potential (Evaluations)</div>${statsHtml}</div><div class="dossier-label">Interview (${app.interview.points} pts remaining)</div><div style="margin-bottom:10px;">${actionsHtml}</div><div style="background:#fff; border:1px solid #eee; padding:15px; max-height:200px; overflow-y:auto;">${chatHtml}</div></div>`;
            }
        }
    },

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

    renderInbox: function(emails) { 
        const container = this.elements.screens.office; 
        
        if (!container.querySelector('.outlook-layout')) { 
            container.innerHTML = `
                <div class="outlook-layout">
                    <div class="email-list-pane">
                        <div class="outlook-header">
                            <span>Inbox</span><span id="unread-count"></span>
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
        
        const listContainer = document.getElementById('email-list-container'); 
        listContainer.innerHTML = ''; 
        
        let unread = 0; 
        emails.forEach(email => { 
            if(!email.read) unread++; 
            const item = document.createElement('div'); 
            item.className = `email-item ${email.read ? 'read' : 'unread'}`; 
            item.onclick = () => UI.openEmail(email.id); 
            item.innerHTML = `
                <div class="email-sender">${email.sender}</div>
                <div class="email-subject">${email.subject}</div>
                <div class="email-date">${email.date}</div>`; 
            listContainer.appendChild(item); 
        }); 
        
        const countSpan = document.getElementById('unread-count');
        if(countSpan) countSpan.innerText = unread > 0 ? `${unread} Unread` : ''; 
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
    
    renderLineChart: function(data, label, color) { if (!data || data.length === 0) return ''; const width = 600; const height = 150; const maxVal = Math.max(...data, 10000); const minVal = Math.min(...data, 0); const range = maxVal - minVal || 1000; const points = data.map((val, i) => { let x = data.length > 1 ? (i / (data.length - 1)) * width : width / 2; const y = height - ((val - minVal) / range * height); return `${x},${y}`; }).join(' '); const zeroY = height - ((0 - minVal) / range * height); return `<div style="margin-bottom:20px; background:white; padding:10px; border:1px solid #ddd;"><div style="font-size:0.8rem; font-weight:bold; margin-bottom:5px;">${label}</div><svg width="100%" height="${height}" viewBox="0 0 ${width} ${height}"><line x1="0" y1="${zeroY}" x2="${width}" y2="${zeroY}" stroke="#ccc" stroke-dasharray="4" /><polyline fill="none" stroke="${color}" stroke-width="3" points="${points}" /></svg></div>`; }
};