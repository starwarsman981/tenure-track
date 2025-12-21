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
            finance: document.getElementById('screen-finance')
        },
        navItems: {
            office: document.getElementById('nav-office'),
            calendar: document.getElementById('nav-calendar'),
            faculty: document.getElementById('nav-faculty'),
            finance: document.getElementById('nav-finance')
        }
    },

    updateTopBar: function(stateData) {
        this.elements.budget.innerText = `$${stateData.budget.toLocaleString()}`;
        this.elements.prestige.innerText = stateData.prestige;
        this.elements.date.innerText = `${CONSTANTS.MONTHS[stateData.month]} ${stateData.day}, ${stateData.year}`;
        this.elements.budget.style.color = stateData.budget < 0 ? '#c0392b' : '#2c2c2c';
    },

    updateSpeedButtons: function(speedIndex) {
        for(let i=0; i<=3; i++) {
            const btn = document.getElementById(`btn-speed-${i}`);
            if(btn) btn.classList.remove('active');
        }
        const activeBtn = document.getElementById(`btn-speed-${speedIndex}`);
        if(activeBtn) activeBtn.classList.add('active');
    },

    showScreen: function(screenName) {
        SCREEN_IDS.forEach(id => {
            this.elements.screens[id].classList.add('hidden');
            this.elements.navItems[id].classList.remove('active');
        });
        this.elements.screens[screenName].classList.remove('hidden');
        this.elements.navItems[screenName].classList.add('active');
        
        if (screenName === 'calendar') this.renderCalendar(State.data, Game.viewState);
        if (screenName === 'faculty') this.renderFaculty(State.data.faculty, Game.rosterFilters);
        if (screenName === 'finance') this.renderFinance(State.data, Game.financeTab);
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

    // --- GRAPH HELPER ---
    renderLineChart: function(data, label, color) {
        if (!data || data.length === 0) return `<div style="padding:20px; color:#999; text-align:center;">No data yet.</div>`;
        const width = 600; const height = 150;
        const maxVal = Math.max(...data, 10000); const minVal = Math.min(...data, 0);
        let range = maxVal - minVal; if(range === 0) range = 1000;
        const points = data.map((val, i) => {
            let x = data.length > 1 ? (i / (data.length - 1)) * width : width / 2;
            const y = height - ((val - minVal) / range * height);
            return `${x},${y}`;
        }).join(' ');
        let zeroLine = '';
        if (minVal < 0 && maxVal > 0) {
            const zeroY = height - ((0 - minVal) / range * height);
            zeroLine = `<line x1="0" y1="${zeroY}" x2="${width}" y2="${zeroY}" stroke="#999" stroke-dasharray="4" />`;
        }
        return `<div style="margin-bottom:20px;"><div style="font-size:0.8rem; font-weight:bold; color:#555; margin-bottom:5px;">${label}</div><svg width="100%" height="${height}" viewBox="0 0 ${width} ${height}" style="background:#f4f4f4; border-radius:4px; border:1px solid #ddd;">${zeroLine}<polyline fill="none" stroke="${color}" stroke-width="2" points="${points}" />${data.length === 1 ? `<circle cx="${width/2}" cy="${points.split(',')[1]}" r="3" fill="${color}" />` : ''}</svg></div>`;
    },

    // --- FINANCE RENDERER (MULTI-TAB) ---
    renderFinance: function(data, tab) {
        const container = this.elements.screens.finance;
        
        // Navigation Toolbar
        const tabs = [
            { id: 'overview', label: 'Overview' },
            { id: 'budget', label: 'Budget & Ledger' },
            { id: 'grants', label: 'Grant Watch' }
        ];
        
        let tabHtml = `<div style="display:flex; gap:10px; margin-bottom:20px; border-bottom:1px solid #ddd; padding-bottom:10px;">`;
        tabs.forEach(t => {
            const active = t.id === tab ? 'background:#2c3e50; color:white;' : 'background:#eee; color:#555;';
            tabHtml += `<button onclick="Game.setFinanceTab('${t.id}')" style="padding:8px 16px; border:none; border-radius:4px; cursor:pointer; font-family:inherit; ${active}">${t.label}</button>`;
        });
        tabHtml += `</div>`;

        container.innerHTML = `<h2 style="margin-top:0;">Financial Dashboard</h2>` + tabHtml + `<div id="fin-content"></div>`;
        const content = document.getElementById('fin-content');

        if(tab === 'overview') this.renderFinanceOverview(content, data);
        if(tab === 'budget') this.renderFinanceBudget(content, data);
        if(tab === 'grants') this.renderFinanceGrants(content, data);
    },

    renderFinanceOverview: function(container, data) {
        if (!data.finance || !data.finance.lastWeekSummary) { container.innerHTML = "Initializing..."; return; }
        const fin = data.finance;
        const last = fin.lastWeekSummary;
        const det = last.details || { salaries:0, ta:0, upkeep:0, idc:0, block:0 };
        const netColor = last.net >= 0 ? FINANCE.COLORS.income : FINANCE.COLORS.expense;
        
        const projectedData = FinanceSystem.getProjection(data);
        const historyData = fin.history.map(h => h.balance);

        container.innerHTML = `
            <div style="display:flex; gap:15px; margin-bottom:20px;">
                <div style="background:white; border:1px solid #ddd; padding:15px; border-radius:4px; flex:1; text-align:center; border-left:4px solid ${FINANCE.COLORS.balance}">
                    <div style="font-size:0.8rem; color:#888;">CASH BALANCE</div>
                    <div style="font-size:1.8rem; font-weight:bold;">$${data.budget.toLocaleString()}</div>
                </div>
                <div style="background:white; border:1px solid #ddd; padding:15px; border-radius:4px; flex:1; text-align:center; border-left:4px solid ${netColor}">
                    <div style="font-size:0.8rem; color:#888;">LAST WEEK NET</div>
                    <div style="font-size:1.8rem; font-weight:bold; color:${netColor}">
                        ${last.net >= 0 ? '+' : ''}$${last.net.toLocaleString()}
                    </div>
                </div>
                <div style="background:white; border:1px solid #ddd; padding:15px; border-radius:4px; flex:1; text-align:center; border-left:4px solid #f39c12">
                     <div style="font-size:0.8rem; color:#888;">WEEKLY OVERHEAD</div>
                    <div style="font-size:1.8rem; font-weight:bold;">$${(det.idc || 0).toLocaleString()}</div>
                </div>
            </div>
            <div style="display:grid; grid-template-columns: 2fr 1fr; gap:20px;">
                <div>${this.renderLineChart(projectedData, "52-Week Projection", FINANCE.COLORS.projection)}</div>
                <div>${this.renderLineChart(historyData, "Cash History", FINANCE.COLORS.balance)}</div>
            </div>
        `;
    },

    renderFinanceBudget: function(container, data) {
        const fiscal = FinanceSystem.getFiscalStatus(data);
        const fin = data.finance;
        const statusColor = fiscal.status === "Surplus" ? "green" : "red";

        let ledgerHtml = `<div style="max-height:400px; overflow-y:auto; font-family:'Courier New', monospace; font-size:0.85rem; border:1px solid #eee;">`;
        if(fin.weeklyLog.length === 0) ledgerHtml += `<div style="padding:10px;">No history.</div>`;
        fin.weeklyLog.forEach(log => {
            const logColor = log.net >= 0 ? FINANCE.COLORS.income : FINANCE.COLORS.expense;
            ledgerHtml += `
                <div style="padding:8px 10px; border-bottom:1px solid #f9f9f9; display:flex; justify-content:space-between;">
                    <div style="flex:1;"><strong>${log.date}</strong> <span style="color:#666;">${log.details}</span></div>
                    <div style="font-weight:bold; color:${logColor};">${log.net >= 0 ? '+' : ''}$${log.net.toLocaleString()}</div>
                </div>`;
        });
        ledgerHtml += `</div>`;

        container.innerHTML = `
            <div style="background:#f9f9f9; padding:20px; border-radius:4px; margin-bottom:20px; text-align:center; border:1px solid #ddd;">
                <h3>Projected Year-End Result</h3>
                <div style="font-size:2.5rem; font-weight:bold; color:${statusColor}">
                    ${fiscal.net >= 0 ? '+' : ''}$${Math.round(fiscal.net).toLocaleString()}
                </div>
                <div style="color:#666;">Based on current weekly net + expected tuition drops</div>
            </div>
            <h3>Transaction Ledger</h3>
            ${ledgerHtml}
        `;
    },

    renderFinanceGrants: function(container, data) {
        let html = `<table style="width:100%; border-collapse:collapse; font-size:0.9rem;">
            <thead style="background:#eee; text-align:left;">
                <tr><th style="padding:10px;">PI</th><th style="padding:10px;">Grant Name</th><th style="padding:10px;">Remaining</th><th style="padding:10px;">Runway</th></tr>
            </thead><tbody>`;
        
        data.faculty.forEach(prof => {
            if(prof.grants.length === 0) {
                // html += `<tr><td style="padding:10px;">${prof.name}</td><td colspan="3" style="color:#999;">No Active Grants</td></tr>`;
            } else {
                prof.grants.forEach(g => {
                    const runway = prof.burnRate > 0 ? (g.remaining / prof.burnRate).toFixed(1) : "Inf";
                    let color = "black";
                    if(parseFloat(runway) < 6) color = "red";
                    html += `
                        <tr style="border-bottom:1px solid #eee;">
                            <td style="padding:10px;">${prof.name}</td>
                            <td style="padding:10px;">${g.name}</td>
                            <td style="padding:10px;">$${g.remaining.toLocaleString()}</td>
                            <td style="padding:10px; color:${color}; font-weight:bold;">${runway} mo</td>
                        </tr>
                    `;
                });
            }
        });
        html += `</tbody></table>`;
        container.innerHTML = html;
    },

    // --- FACULTY, CALENDAR, INBOX (No Changes) ---
    renderFaculty: function(roster, filters) {
        const container = this.elements.screens.faculty;
        container.innerHTML = '';
        let displayList = [...roster];
        if (filters.rank !== 'all') displayList = displayList.filter(p => p.rank === filters.rank);
        if (filters.field !== 'all') displayList = displayList.filter(p => p.field === filters.field);
        if (filters.tenure !== 'all') { const isTenured = filters.tenure === 'tenured'; displayList = displayList.filter(p => p.tenured === isTenured); }
        displayList.sort((a, b) => { if (filters.sort === 'runway') { const rA = a.runway === 'Inf' ? 999 : parseFloat(a.runway); const rB = b.runway === 'Inf' ? 999 : parseFloat(b.runway); return rA - rB; } return b[filters.sort] - a[filters.sort]; });
        const toolbar = document.createElement('div');
        toolbar.style.cssText = "background:#f4f4f4; padding:15px; margin-bottom:20px; border-radius:4px; display:flex; gap:15px; align-items:center; flex-wrap:wrap;";
        toolbar.innerHTML = `<div><label style="font-size:0.8rem; font-weight:bold; display:block;">Rank</label><select id="filter-rank" onchange="Game.setRosterFilter('rank', this.value)"><option value="all" ${filters.rank === 'all' ? 'selected' : ''}>All Ranks</option><option value="adjunct" ${filters.rank === 'adjunct' ? 'selected' : ''}>Adjunct</option><option value="assistant" ${filters.rank === 'assistant' ? 'selected' : ''}>Assistant</option><option value="associate" ${filters.rank === 'associate' ? 'selected' : ''}>Associate</option><option value="full" ${filters.rank === 'full' ? 'selected' : ''}>Full Prof</option></select></div><div><label style="font-size:0.8rem; font-weight:bold; display:block;">Field</label><select id="filter-field" onchange="Game.setRosterFilter('field', this.value)"><option value="all" ${filters.field === 'all' ? 'selected' : ''}>All Fields</option><option value="Organic" ${filters.field === 'Organic' ? 'selected' : ''}>Organic</option><option value="Inorganic" ${filters.field === 'Inorganic' ? 'selected' : ''}>Inorganic</option><option value="Physical" ${filters.field === 'Physical' ? 'selected' : ''}>Physical</option><option value="Biochem" ${filters.field === 'Biochem' ? 'selected' : ''}>Biochem</option><option value="Analytical" ${filters.field === 'Analytical' ? 'selected' : ''}>Analytical</option></select></div><div><label style="font-size:0.8rem; font-weight:bold; display:block;">Tenure</label><select id="filter-tenure" onchange="Game.setRosterFilter('tenure', this.value)"><option value="all" ${filters.tenure === 'all' ? 'selected' : ''}>Any</option><option value="tenured" ${filters.tenure === 'tenured' ? 'selected' : ''}>Tenured</option><option value="untenured" ${filters.tenure === 'untenured' ? 'selected' : ''}>Un-Tenured</option></select></div><div style="margin-left:auto;"><label style="font-size:0.8rem; font-weight:bold; display:block;">Sort By</label><select id="sort-roster" onchange="Game.setRosterSort(this.value)"><option value="hIndex" ${filters.sort === 'hIndex' ? 'selected' : ''}>H-Index</option><option value="runway" ${filters.sort === 'runway' ? 'selected' : ''}>Grant Runway</option><option value="salary" ${filters.sort === 'salary' ? 'selected' : ''}>Salary</option><option value="age" ${filters.sort === 'age' ? 'selected' : ''}>Age</option></select></div>`;
        container.appendChild(toolbar);
        const grid = document.createElement('div');
        grid.className = 'roster-grid';
        displayList.forEach(prof => {
            const card = document.createElement('div'); card.className = `prof-card rank-${prof.rank}`; card.onclick = () => UI.showDossier(prof);
            let runwayColor = "#555"; if (prof.runway !== 'Inf') { const r = parseFloat(prof.runway); if (r < 6) runwayColor = "#c0392b"; else if (r < 12) runwayColor = "#f39c12"; else runwayColor = "#27ae60"; }
            let fundsDisplay = ""; if(prof.grants.length > 0) fundsDisplay = `${prof.grants.length} Active Grants`; else if(prof.rank !== 'adjunct') fundsDisplay = prof.fundingSourceLabel; else fundsDisplay = "No Lab";
            card.innerHTML = `<div class="prof-header"><div><div class="prof-name">Dr. ${prof.name}</div><div class="prof-title">${prof.rankLabel} (${prof.age})</div></div><div class="prof-field">${prof.field}</div></div><div class="prof-stats-row"><span>h-index: <strong>${prof.hIndex}</strong></span><span>Grads: <strong>${prof.students ? prof.students.length : 0}</strong></span></div><div class="prof-stats-row" style="color:#666; font-size:0.75rem;"><span>${fundsDisplay}</span><span style="color:${runwayColor}; font-weight:bold;">Runway: ${prof.runway} mo</span></div><div class="prof-tags"><span class="tag ${prof.rmpTag.type}">${prof.rmpTag.text}</span><span class="tag">${prof.labType}</span></div>`;
            grid.appendChild(card);
        });
        if(displayList.length === 0) grid.innerHTML = `<div style="padding:20px; color:#999; text-align:center;">No faculty match filters.</div>`;
        container.appendChild(grid);
    },
    showDossier: function(prof) {
        const existing = document.querySelector('.dossier-overlay'); if(existing) existing.remove();
        const overlay = document.createElement('div'); overlay.className = 'dossier-overlay'; overlay.onclick = (e) => { if(e.target === overlay) overlay.remove(); };
        let riskLabel = "Low"; let riskColor = "green"; if (prof.grantRisk > 0.4) { riskLabel = "Moderate"; riskColor = "orange"; } if (prof.grantRisk > 0.7) { riskLabel = "High"; riskColor = "red"; }
        let grantHtml = `<div style="margin-top:5px; font-size:0.9rem; color:#666; font-style:italic;">Funding Source: ${prof.fundingSourceLabel}</div>`;
        if (prof.grants.length > 0) { const list = prof.grants.map(g => `<div style="display:flex; justify-content:space-between; border-bottom:1px dashed #eee; padding:2px 0;"><span>${g.name}</span><span>$${g.remaining.toLocaleString()}</span></div>`).join(''); grantHtml = `<div style="margin-top:5px;">${list}</div>`; }
        let studentHtml = `<div style="margin-top:5px; font-size:0.9rem; color:#666;">No students.</div>`;
        if (prof.students && prof.students.length > 0) { const group = State.data.students.filter(s => prof.students.includes(s.id)); studentHtml = group.map(s => `<div style="padding: 5px; border-bottom:1px solid #eee; display:flex; justify-content:space-between; align-items:center;"><div><div style="font-weight:bold; font-size:0.9rem;">${s.name} (G${s.year})</div><div style="font-size:0.75rem; color:#666;">Hands: ${s.stats.hands} | Brains: ${s.stats.brains}</div></div><div style="text-align:right;"><span class="tag ${s.funding === 'RA' ? 'good' : 'neutral'}">${s.funding}</span><div style="font-size:0.7rem; margin-top:2px;">${s.trait.name}</div></div></div>`).join(''); }
        overlay.innerHTML = `<div class="dossier-paper"><h2 style="margin-top:0; border-bottom: 2px solid #333; padding-bottom:10px;">Academic Dossier</h2><div class="dossier-section"><div class="dossier-label">Identity</div><div class="dossier-data" style="font-size: 1.4rem; font-weight:bold;">Dr. ${prof.name} (${prof.age})</div><div>${prof.rankLabel} of ${prof.field} Chemistry</div><div>Salary: $${prof.salary.toLocaleString()}/yr</div></div><div class="dossier-section"><div class="dossier-label">Financial Health</div><div class="dossier-data" style="display:grid; grid-template-columns:1fr 1fr; gap:10px;"><div><strong>Burn Rate:</strong> <span style="color:#c0392b">$${prof.burnRate.toLocaleString()}/mo</span><br><span style="font-size:0.8rem; color:#666;">(${prof.students.length} Students + Lab Costs)</span></div><div><strong>Total Reserves:</strong> $${prof.funds.toLocaleString()}<br><strong>Runway:</strong> ${prof.runway} Months</div></div><div style="margin-top:10px; background:#f9f9f9; padding:10px; border-radius:4px;"><div class="dossier-label">Funding Sources</div>${grantHtml}</div></div><div class="dossier-section"><div class="dossier-label">Lab Personnel</div><div class="dossier-data" style="max-height:150px; overflow-y:auto; border:1px solid #eee; border-radius:4px;">${studentHtml}</div></div><div class="dossier-section"><div class="dossier-label">Research Impact</div><div class="dossier-data">h-index: <strong>${prof.hIndex}</strong> <br>Total Citations: ${prof.citations.toLocaleString()} <br><em>Recent Pub: "${prof.recentPaper}"</em></div></div><div class="dossier-section"><div class="dossier-label">Grant Writing Profile</div><div class="dossier-data">Application Risk: <strong style="color:${riskColor}">${riskLabel}</strong><br><span style="font-size:0.8rem; color:#666;">(Probability of proposal rejection)</span></div></div><div class="dossier-section"><div class="dossier-label">Teaching & Service</div><div class="dossier-data">Student Evaluation: <strong>${prof.teachScore} / 5.0</strong> <br>Common Feedback: <span class="tag ${prof.rmpTag.type}">${prof.rmpTag.text}</span></div></div><div class="dossier-section"><div class="dossier-label">Lab Resources</div><div class="dossier-data">Type: ${prof.labType} <br>Major Equipment: ${prof.equipment}</div></div><button class="btn-main" onclick="document.querySelector('.dossier-overlay').remove()">Close File</button></div>`;
        document.body.appendChild(overlay);
    },
    renderCalendar: function(gameState, viewState) {
        const container = this.elements.screens.calendar;
        container.innerHTML = ''; 
        const toolbar = document.createElement('div');
        toolbar.className = 'cal-toolbar';
        let title = '';
        if(viewState.mode === 'year') title = `${viewState.year}`;
        else if(viewState.mode === 'month') title = `${CONSTANTS.MONTHS[viewState.month]} ${viewState.year}`;
        else title = `Week of ${CONSTANTS.MONTHS[viewState.month]} ${viewState.day}`;
        toolbar.innerHTML = `<div><button class="cal-nav-btn" onclick="Game.shiftCalendar(-1)">&#9664;</button><button class="cal-nav-btn" onclick="Game.shiftCalendar(1)">&#9654;</button></div><div class="cal-title">${title}</div><div><button class="cal-nav-btn ${viewState.mode === 'week' ? 'active' : ''}" onclick="Game.setCalendarMode('week')">Week</button><button class="cal-nav-btn ${viewState.mode === 'month' ? 'active' : ''}" onclick="Game.setCalendarMode('month')">Month</button><button class="cal-nav-btn ${viewState.mode === 'year' ? 'active' : ''}" onclick="Game.setCalendarMode('year')">Year</button></div>`;
        container.appendChild(toolbar);
        if (viewState.mode === 'year') this.renderYearView(container, gameState, viewState);
        else if (viewState.mode === 'week') this.renderWeekView(container, gameState, viewState);
        else this.renderMonthView(container, gameState, viewState);
    },
    renderMonthView: function(container, gameState, viewState) {
        const daysInMonth = CONSTANTS.DAYS_IN_MONTH[viewState.month];
        const firstDayObj = new Date(viewState.year, viewState.month, 1);
        const startDayIndex = firstDayObj.getDay(); 
        let html = `<div class="calendar-grid">`;
        CONSTANTS.DAYS_OF_WEEK.forEach(d => { html += `<div class="day-name">${d}</div>`; });
        for (let i = 0; i < startDayIndex; i++) { html += `<div class="cal-day empty"></div>`; }
        for (let day = 1; day <= daysInMonth; day++) {
            const isToday = (day === gameState.day && viewState.month === gameState.month && viewState.year === gameState.year);
            html += `<div class="cal-day ${isToday ? 'today' : ''}"><div class="day-num">${day}</div></div>`;
        }
        html += `</div>`;
        const wrapper = document.createElement('div');
        wrapper.innerHTML = html;
        container.appendChild(wrapper);
    },
    renderYearView: function(container, gameState, viewState) {
        let html = `<div class="year-grid">`;
        CONSTANTS.MONTHS.forEach((name, index) => {
            const isCurrent = (index === gameState.month && viewState.year === gameState.year);
            html += `<div class="year-month-card ${isCurrent ? 'current' : ''}" onclick="Game.jumpToMonth(${index})">${name}</div>`;
        });
        html += `</div>`;
        const wrapper = document.createElement('div');
        wrapper.innerHTML = html;
        container.appendChild(wrapper);
    },
    renderWeekView: function(container, gameState, viewState) {
        let html = `<div class="week-grid">`;
        for(let i=0; i<7; i++) {
            const dayName = CONSTANTS.DAYS_OF_WEEK[i];
            const todayDate = new Date(gameState.year, gameState.month, gameState.day);
            const todayIndex = todayDate.getDay();
            const isToday = (gameState.year === viewState.year && gameState.month === viewState.month && i === todayIndex && Math.abs(gameState.day - viewState.day) < 7);
            html += `<div class="week-day-col ${isToday ? 'today' : ''}"><div class="week-header">${dayName}</div><div class="week-body"></div></div>`;
        }
        html += `</div>`;
        const wrapper = document.createElement('div');
        wrapper.innerHTML = html;
        container.appendChild(wrapper);
    },
    renderInbox: function(emails) {
        const container = this.elements.screens.office;
        if (!container.querySelector('.outlook-layout')) { container.innerHTML = `<div class="outlook-layout"><div class="email-list-pane"><div class="outlook-header"><span>Inbox</span><span id="unread-count">0 Unread</span></div><div class="email-list-scroll" id="email-list-container"></div></div><div class="email-view-pane"><div id="email-reading-view" class="hidden"><div class="email-view-header"><div class="view-subject" id="view-subject"></div><div class="view-meta"><span id="view-from"></span><span id="view-date"></span></div></div><div class="view-body" id="view-body"></div></div><div id="email-empty-view" class="empty-state">Select an email to read.</div></div></div>`; }
        const listContainer = document.getElementById('email-list-container'); listContainer.innerHTML = ''; let unread = 0; const sortedEmails = [...emails].sort((a, b) => b.id - a.id);
        sortedEmails.forEach(email => { if (!email.read) unread++; const item = document.createElement('div'); item.className = `email-item ${email.read ? 'read' : 'unread'}`; item.onclick = () => UI.openEmail(email.id); item.innerHTML = `<span class="email-date">${email.date}</span><div class="email-sender">${email.sender}</div><div class="email-subject">${email.subject}</div>`; listContainer.appendChild(item); });
        document.getElementById('unread-count').innerText = `${unread} Unread`;
    },
    openEmail: function(id) { const email = State.data.emails.find(e => e.id === id); if (!email) return; email.read = true; this.renderInbox(State.data.emails); document.getElementById('email-empty-view').classList.add('hidden'); document.getElementById('email-reading-view').classList.remove('hidden'); document.getElementById('view-subject').innerText = email.subject; document.getElementById('view-from').innerHTML = `From: <strong>${email.sender}</strong>`; document.getElementById('view-date').innerText = email.date; document.getElementById('view-body').innerHTML = email.body; }
};