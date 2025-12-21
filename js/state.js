/* js/state.js */
const State = {
    data: {
        year: 2025, month: 7, day: 1,
        budget: 0, prestige: 0, deptName: "", type: "", discipline: "",
        faculty: [], students: [], emails: [],
        pendingEvent: null,
        settings: { 
            pauseOnEmail: true, 
            pauseOnPaper: false 
        },
        policy: { overheadRate: 0.50, salaryMod: 1.0, stipendMod: 1.0 },
        finance: { history: [], weeklyLog: [], lastWeekSummary: { net: 0, income: 0, expense: 0 } },
        admissions: { active: false, setupComplete: false, targetSize: 7, strategy: "standard", pool: [], selectedApplicantId: null }
    },

    COSTS: {
        RA_WEEKLY: 1250, TA_WEEKLY: 850, FELLOW_WEEKLY: 100,
        LAB_BASE: 250, SUPPLIES_WEEKLY: 150, STAFF_WEEKLY: 2500, FACILITY_WEEKLY: 1500
    },

    initNewGame: function(name, typeKey, discKey) {
        this.data.year = 2025; this.data.month = 7; this.data.day = 1;
        this.data.deptName = name; this.data.type = typeKey; this.data.discipline = discKey;
        this.data.students = []; this.data.admissions.active = false; this.data.admissions.pool = [];
        this.data.policy = { overheadRate: 0.50, salaryMod: 1.0, stipendMod: 1.0 };
        this.data.emails = [];
        this.data.settings = { pauseOnEmail: true, pauseOnPaper: false };

        if(typeKey === 'state') { this.data.budget = 250000; this.data.prestige = 30; }
        else if(typeKey === 'ivy') { this.data.budget = 750000; this.data.prestige = 80; }
        else { this.data.budget = 100000; this.data.prestige = 10; }

        this.data.faculty = [];
        const targetCount = Math.floor(Math.random() * 5) + 8; 
        const ranks = ["Adjunct", "Assistant", "Assistant", "Associate", "Associate", "Full", "Full", "Full"];
        const fields = ["Organic", "Inorganic", "Physical", "Analytical", "Materials"];
        
        for(let i=0; i<targetCount; i++) {
            let r = ranks[Math.floor(Math.random()*ranks.length)];
            let f = fields[Math.floor(Math.random()*fields.length)];
            if(i==0) r="Full"; if(i==1) r="Associate";
            
            const prof = FacultyGenerator.generate(r, f);
            const studentCount = StudentGenerator.getCountForRank(r);
            
            for(let s=0; s<studentCount; s++) {
                const newStudent = StudentGenerator.generate(prof.id, prof.name);
                this.data.students.push(newStudent);
                prof.students.push(newStudent.id);
            }
            this.data.faculty.push(prof);
        }
        
        this.data.faculty.forEach(f => this.recalcFacultyFinances(f));
        
        this.addEmail("Outgoing Chair", "Handover Notes (Tutorial)", 
            `Welcome to the big chair! Here is what you need to know to survive:<br><br>
            1. <strong>The Budget:</strong> We burn money weekly. If we go broke, the Dean fires you. Keep an eye on the <span style='color:#c0392b'>Finance Tab</span>.<br>
            2. <strong>Research:</strong> Faculty need Grants (Blue bars on their cards). If they run out of money, they get angry and leave. Encourage them to apply for grants.<br>
            3. <strong>Students:</strong> They do the work, but they cost money (Stipends). Admission season starts in the Fall.<br><br>
            Good luck. You're going to need it.`);
            
        this.addEmail("Provost", "Fiscal Year Start", `Welcome. Expenses are deducted weekly.`);
    },

    advanceDay: function() {
        this.data.day++;
        
        if(this.data.day % 7 === 0) {
            this.processWeeklyFinances();
            this.processGrantCycle();
            this.processMorale();
            this.processRandomEvents();
        }

        this.processResearchOutput();

        if(this.data.month === 8 && this.data.day === 1) this.processTuitionDrop();
        if(this.data.month === 0 && this.data.day === 15) this.processTuitionDrop();

        if(this.data.month === 7 && this.data.day === 15 && !this.data.admissions.setupComplete) {
            this.calculateAndNotifyCohortTarget();
        }
        
        const isSeason = (this.data.month === 11 || this.data.month === 0 || this.data.month === 1 || this.data.month === 2);
        if (isSeason && !this.data.admissions.active) {
            if(!this.data.admissions.setupComplete) this.setRecruitmentStrategy(7, "standard");
            this.startAdmissionsSeason();
        }

        if(this.data.month === 2 && this.data.day === 1) {
            this.createInteractiveEmailEvent({
                title: "Visit Weekend",
                desc: "March 1st is approaching. Should we host the admitted students for a recruitment weekend?",
                choices: [
                    { text: "Host Event ($2,000)", cost: 2000, flavor: "Boosts acceptance rate significantly.", effect: "visit_weekend" },
                    { text: "Skip It", cost: 0, flavor: "Saves money, looks cheap.", effect: "none" }
                ]
            }, "Admissions Cmte");
        }

        if((this.data.month === 2 && this.data.day >= 15) || (this.data.month === 3 && this.data.day < 15)) this.processGradualDecisions();
        if(this.data.month === 3 && this.data.day === 15) this.processDecisionDay();

        if (this.data.day > 30) {
            this.data.day = 1; this.data.month++;
            if(this.data.month > 11) { this.data.month = 0; this.data.year++; }
        }
    },

    calculateAndNotifyCohortTarget: function() {
        const activeLabs = this.data.faculty.filter(f => f.rank !== 'Adjunct').length;
        const baseEstimate = activeLabs * 1.3;
        let estimatedCapacity = Math.floor(baseEstimate + (Math.random() * 2) - 1);
        if (estimatedCapacity < 2) estimatedCapacity = 2;
        const low = Math.max(1, estimatedCapacity - 2);
        const high = estimatedCapacity + 2;
        
        this.addEmail("Grad Admissions Cmte", "ACTION REQUIRED: Set Cohort Size", 
            `We have analyzed the department's lab capacity.<br><br>
            <strong>Active Research Labs:</strong> ${activeLabs}<br>
            <strong>Recommended Cohort:</strong> ${low} - ${high} students<br><br>
            <button class="btn-main" onclick="UI.showRecruitmentSetupModal()">Configure Recruitment</button>`);
    },

    processRandomEvents: function() {
        if(this.data.pendingEvent) return; 
        if(Math.random() < 0.05) { 
            const event = RANDOM_ISSUES[Math.floor(Math.random() * RANDOM_ISSUES.length)];
            this.createInteractiveEmailEvent(event, "Dean's Office");
        }
    },

    createInteractiveEmailEvent: function(event, sender) {
        this.data.pendingEvent = event;
        let choicesHtml = "";
        event.choices.forEach((c, idx) => {
            const costColor = c.cost > 0 ? '#c0392b' : '#27ae60';
            const costText = c.cost > 0 ? `-$${c.cost.toLocaleString()}` : 'Free';
            choicesHtml += `
            <div style="border:1px solid #ccc; padding:15px; margin-bottom:10px; background:#fff;">
                <div style="display:flex; justify-content:space-between; margin-bottom:5px; font-weight:bold;">
                    <span>${c.text}</span>
                    <span style="color:${costColor}">${costText}</span>
                </div>
                <div style="font-size:0.9rem; color:#666; margin-bottom:10px;">${c.flavor}</div>
                <button class="btn-main" style="width:100%;" onclick="Game.resolveEvent(${idx})">Select Option</button>
            </div>`;
        });
        const body = `<div style="background:#fffbf0; border:1px solid #f39c12; padding:15px; margin-bottom:15px;"><strong>Issue:</strong> ${event.title}<p>${event.desc}</p></div><div id="email-choices-container">${choicesHtml}</div>`;
        this.addEmail(sender, `Action: ${event.title}`, body, 'urgent');
    },

    resolveEventChoice: function(event, choice) {
        this.data.budget -= choice.cost;
        if(choice.effect === 'morale_hit') this.modifyMorale(-5);
        if(choice.effect === 'morale_boost') this.modifyMorale(5);
        if(choice.effect === 'donation_small') { this.data.budget += 10000; this.addEmail("Dean's Office", "Donation Received", "The alumni event was a success. +$10,000."); }
        if(choice.effect === 'visit_weekend') this.hostVisitWeekend();
        this.data.pendingEvent = null;
        const email = this.data.emails[0]; 
        if(email && email.body.includes('onclick="Game.resolveEvent')) {
             email.body = `<div style="background:#ecf0f1; border:1px solid #bdc3c7; padding:15px;"><strong>${event.title} Resolved</strong><p>${event.desc}</p><div style="margin-top:10px; padding:10px; background:#fff; border:1px solid #ccc;">Selected: <strong>${choice.text}</strong><br><span style="font-size:0.8rem; color:#666;">${choice.flavor}</span></div></div>`;
             if(typeof UI !== 'undefined') UI.openEmail(email.id);
        }
    },

    processResearchOutput: function() {
        this.data.faculty.forEach(f => {
            const myStudents = this.data.students.filter(s => s.advisorId === f.id);
            if(myStudents.length === 0) return;
            let totalBrains = 0; let totalHands = 0;
            myStudents.forEach(s => { totalBrains += s.stats.brains; totalHands += s.stats.hands; });
            const power = totalBrains + totalHands;
            if(Math.random() < (power / 42000)) { this.triggerDiscovery(f); }
        });
    },

    triggerDiscovery: function(prof) {
        const adj = RESEARCH_DB.ADJECTIVES[Math.floor(Math.random() * RESEARCH_DB.ADJECTIVES.length)];
        const method = RESEARCH_DB.METHODS[Math.floor(Math.random() * RESEARCH_DB.METHODS.length)];
        const target = RESEARCH_DB.TARGETS[Math.floor(Math.random() * RESEARCH_DB.TARGETS.length)];
        const app = RESEARCH_DB.APPLICATIONS[Math.floor(Math.random() * RESEARCH_DB.APPLICATIONS.length)];
        const title = `A ${adj} ${method} of ${target} for ${app}`;
        
        const journals = [
            { name: "Nature", impact: 50 },
            { name: "Science", impact: 45 },
            { name: "JACS", impact: 15 },
            { name: "Angewandte", impact: 14 },
            { name: "Chem. Sci.", impact: 9 },
            { name: "Tetrahedron", impact: 2 }
        ];
        
        const roll = (prof.hIndex / 3) + (Math.random() * 20); 
        let journal = journals[5]; 
        if(roll > 40) journal = journals[0];
        else if(roll > 35) journal = journals[1];
        else if(roll > 25) journal = journals[2];
        else if(roll > 20) journal = journals[3];
        else if(roll > 10) journal = journals[4];

        const myStudents = this.data.students.filter(s => s.advisorId === prof.id);
        let firstAuthor = "Postdoc J. Doe";
        let coAuthors = "";
        
        if (myStudents.length > 0) {
            myStudents.sort((a,b) => b.stats.hands - a.stats.hands);
            firstAuthor = myStudents[0].name;
            if(myStudents.length > 1) {
                coAuthors = ", " + myStudents.slice(1, Math.min(4, myStudents.length)).map(s => s.name.split(' ')[1]).join(', ');
            }
        }

        prof.hIndex += Math.ceil(journal.impact / 5); 
        this.data.prestige += Math.ceil(journal.impact / 10);

        let comment = "";
        let color = "#7f8c8d";
        if (journal.impact > 40) {
            comment = "This is career-defining work. The press office needs to run a story on this.";
            color = "#8e44ad";
        } else if (journal.impact > 10) {
            comment = "Solid work. The students really ground this one out over the holidays.";
            color = "#2980b9";
        } else {
            comment = "It's a small contribution, but good for the first-year students to get their names on a paper.";
            color = "#7f8c8d";
        }

        const body = `
            <div style="border-left: 4px solid ${color}; padding-left: 10px; margin-bottom: 15px;">
                <div style="font-size:1.1rem; font-weight:bold; color:${color};">${journal.name} Accepted</div>
                <div style="font-style:italic; margin-bottom:5px;">"${title}"</div>
                <div style="font-size:0.9rem;">
                    <strong>Authors:</strong> ${firstAuthor}${coAuthors}, ${prof.name}*<br>
                    <strong>Projected Impact:</strong> ${journal.impact.toFixed(1)}
                </div>
            </div>
            <p>"${comment}"</p>
            <p>Best,<br>${prof.name.split(' ').slice(-1)[0]}</p>
        `;

        this.addEmail(prof.name, `Pub Accepted: ${journal.name}`, body, 'paper');
    },

    modifyMorale: function(amount) { this.data.faculty.forEach(f => f.happiness = Math.max(0, Math.min(100, f.happiness + amount))); },

    processWeeklyFinances: function() {
        const pol = this.data.policy;
        let expFaculty = 0; let expResearch = 0; let overheadGenerated = 0;
        this.data.faculty.forEach(f => {
            expFaculty += (f.salary * pol.salaryMod) / 52;
            let grantBurnNeeded = this.COSTS.LAB_BASE; 
            const myStudents = this.data.students.filter(s => s.advisorId === f.id);
            myStudents.forEach(s => {
                if(s.funding === "RA") grantBurnNeeded += (this.COSTS.RA_WEEKLY * pol.stipendMod) + this.COSTS.SUPPLIES_WEEKLY;
                else if (s.funding === "TA") { expResearch += (this.COSTS.TA_WEEKLY * pol.stipendMod); grantBurnNeeded += this.COSTS.SUPPLIES_WEEKLY; }
                else if (s.funding === "Fellowship") grantBurnNeeded += this.COSTS.SUPPLIES_WEEKLY; 
            });
            let actualGrantBurn = 0;
            if(f.grants.length > 0) {
                f.grants.forEach(g => {
                    if(grantBurnNeeded > 0 && g.remaining > 0) {
                        const amount = Math.min(grantBurnNeeded, g.remaining);
                        g.remaining -= amount; grantBurnNeeded -= amount; actualGrantBurn += amount;
                    }
                });
                f.grants = f.grants.filter(g => g.remaining > 0);
                overheadGenerated += (actualGrantBurn * pol.overheadRate);
            }
            this.recalcFacultyFinances(f);
        });
        const incState = 12000; const totalIncome = incState + overheadGenerated;
        const totalExpense = expFaculty + expResearch + this.COSTS.STAFF_WEEKLY + this.COSTS.FACILITY_WEEKLY;
        const net = totalIncome - totalExpense;
        this.data.budget += net;
        const summary = { net: net, income: { state: incState, overhead: overheadGenerated, tuition: 0 }, expense: { faculty: expFaculty, staff: this.COSTS.STAFF_WEEKLY, research: expResearch, facility: this.COSTS.FACILITY_WEEKLY } };
        this.data.finance.lastWeekSummary = summary;
        this.data.finance.weeklyLog.unshift({ date: `${this.data.month+1}/${this.data.day}`, summary: summary });
        if(this.data.finance.weeklyLog.length > 50) this.data.finance.weeklyLog.pop();
        this.data.finance.history.push(this.data.budget);
    },

    recalcFacultyFinances: function(prof) {
        let weeklyBurn = this.COSTS.LAB_BASE;
        const myStudents = this.data.students.filter(s => s.advisorId === prof.id);
        const pol = this.data.policy; 
        myStudents.forEach(s => {
            if(s.funding === "RA") weeklyBurn += (this.COSTS.RA_WEEKLY * pol.stipendMod) + this.COSTS.SUPPLIES_WEEKLY;
            else weeklyBurn += this.COSTS.SUPPLIES_WEEKLY;
        });
        prof.burnRate = weeklyBurn * 4.3; 
        const totalFunds = prof.grants.reduce((sum, g) => sum + g.remaining, 0);
        prof.funds = totalFunds;
        if(weeklyBurn > 0) {
            const weeksLeft = totalFunds / weeklyBurn;
            if(weeksLeft > 104) prof.runway = "> 2 yrs";
            else prof.runway = (weeksLeft / 4.3).toFixed(1) + " mo";
        } else { prof.runway = "Stable"; }
    },

    processTuitionDrop: function() {
        const amount = FINANCE.INCOME.SEMESTER_TUITION;
        this.data.budget += amount;
        this.addEmail("Bursar", "Tuition Disbursement", `Received $${amount.toLocaleString()} from tuition revenue.`);
        this.data.finance.weeklyLog.unshift({
            date: `${this.data.month+1}/${this.data.day}`,
            summary: { net: amount, income: { state: 0, overhead: 0, tuition: amount }, expense: { faculty: 0, staff: 0, research: 0, facility: 0 } },
            isTuition: true
        });
    },

    processMorale: function() {
        const pol = this.data.policy;
        this.data.faculty.forEach(f => {
            let change = 0;
            if(pol.salaryMod > 1.0) change += 0.5; if(pol.salaryMod < 1.0) change -= 1.0;
            if(pol.overheadRate > 0.50) change -= 0.5; if(pol.overheadRate < 0.40) change += 0.2;
            if(f.runway !== "Inf" && parseFloat(f.runway) < 6) change -= 1.0;
            f.happiness = Math.max(0, Math.min(100, f.happiness + change));
        });
    },

    setPolicy: function(key, value) { 
        this.data.policy[key] = parseFloat(value); 
        if(typeof UI !== 'undefined') UI.renderFinance(this.data, "overview"); 
    },

    processGrantCycle: function() {
        this.data.faculty.forEach(f => {
            const needsMoney = parseFloat(f.runway) < 12 || f.runway === "0.0"; const canApply = f.pendingApps.length < 2; 
            if (canApply && Math.random() < (needsMoney ? 0.08 : 0.01)) { const agency = ["NSF", "NIH", "DOE", "DOD"][Math.floor(Math.random()*4)]; f.pendingApps.push({ agency: agency, amount: 350000 + Math.floor(Math.random()*400000), weeksPending: 0, weeksToDecision: 10 + Math.floor(Math.random()*10) }); }
            for (let i = f.pendingApps.length - 1; i >= 0; i--) {
                const app = f.pendingApps[i]; app.weeksPending++;
                if (app.weeksPending >= app.weeksToDecision) {
                    const successChance = 0.15 + (f.hIndex / 150); 
                    if(Math.random() < successChance) { 
                        f.grants.push({ name: `${app.agency} Grant`, remaining: app.amount }); 
                        f.hIndex += 2; 
                        
                        const overheadRate = this.data.policy.overheadRate;
                        const indirects = app.amount * overheadRate;
                        const direct = app.amount - indirects;
                        
                        const body = `
                        <div style="font-family:monospace; background:#f4f4f4; padding:10px; border:1px solid #ccc;">
                            <strong>NOTICE OF AWARD: ${app.agency}-2026-${Math.floor(Math.random()*1000)}</strong><br>
                            ------------------------------------------------<br>
                            PI: ${f.name}<br>
                            Total Award: &nbsp;&nbsp;&nbsp;<strong>$${app.amount.toLocaleString()}</strong><br>
                            <span style="color:#c0392b;">Indirects (${(overheadRate*100).toFixed(0)}%): -$${indirects.toLocaleString()}</span><br>
                            ------------------------------------------------<br>
                            <strong>NET TO LAB: &nbsp;&nbsp;&nbsp;<span style="color:#27ae60;">$${direct.toLocaleString()}</span></strong>
                        </div>
                        <p>Funds available immediately.</p>`;
                        
                        this.addEmail("OSP", `Award Notice: ${f.name} (${app.agency})`, body, 'notification');
                    }
                    f.pendingApps.splice(i, 1);
                }
            }
        });
    },

    setRecruitmentStrategy: function(target, strategyKey) { const cost = (strategyKey === 'aggressive') ? 7500 : (strategyKey === 'standard' ? 2000 : 0); this.data.budget -= cost; this.data.admissions.targetSize = parseInt(target); this.data.admissions.strategy = strategyKey; this.data.admissions.setupComplete = true; },
    
    startAdmissionsSeason: function() { 
        this.data.admissions.active = true; 
        const stratKey = this.data.admissions.strategy || "standard"; 
        let qualMod = stratKey === 'aggressive' ? 1.2 : (stratKey === 'none' ? 0.8 : 1.0); 
        let volMod = stratKey === 'aggressive' ? 1.5 : (stratKey === 'none' ? 0.8 : 1.0); 
        this.data.admissions.pool = ApplicantGenerator.generatePool(this.data.faculty, qualMod, volMod); 
        this.addEmail("Grad Admissions", "Applications Received", `The portal is closed. We have received <strong>${this.data.admissions.pool.length}</strong> applications.<br><br>Please review them over the next two months. You can access the pool via the Admissions tab.`, "urgent");
        if(typeof UI !== 'undefined' && document.getElementById('screen-admissions')) UI.renderAdmissions(this.data); 
    },

    hostVisitWeekend: function() { this.data.admissions.pool.forEach(app => { if(app.status === 'Pending' || app.status === 'Offer Extended') { app.flownOut = true; app.statsVisible = true; app.yieldBonus += 15; app.facultyNote += " (Visited)"; } }); this.addEmail("Events", "Visit Weekend", "Candidates visited."); },
    
    processGradualDecisions: function() { let chance = 0.05; if(this.data.month === 3) chance = 0.25; if(this.data.month === 3 && this.data.day > 10) chance = 0.60; this.data.admissions.pool.forEach(app => { if(app.status === 'Offer Extended' && Math.random() < chance) this.resolveApplication(app, "Early Decision"); }); },
    
    processDecisionDay: function() { let count = 0; this.data.admissions.pool.forEach(app => { if(app.status === 'Offer Extended') { this.resolveApplication(app, "Deadline Decision"); if(app.status === "Accepted") count++; } }); this.data.pendingEvent = { title: "Decision Day Results", desc: `${count} candidates accepted offers.`, choices: [{ text: "View Roster", cost: 0, flavor: "Done.", effect: "none" }] }; UI.renderAdmissions(this.data); },
    
    resolveApplication: function(app, reason) { 
        const chance = 0.3 + (app.yieldBonus / 100) + (this.data.prestige / 200) + (app.stats.fit / 200); 
        const accepted = Math.random() < chance; 
        app.status = accepted ? "Accepted" : "Declined"; 
        
        let subject = "";
        let body = "";

        if (accepted) {
            subject = `Acceptance: ${app.name}`;
            const excitement = app.yieldBonus > 20 ? "thrilled" : "pleased";
            const why = app.application.hasFellowship ? "your department's willingness to support my fellowship" : "the strong alignment with the faculty";
            body = `<p>Dear Chair,</p><p>I am <strong>${excitement}</strong> to accept your offer. The deciding factor was ${why}. I look forward to the Fall.</p><br><div style="background:#e8f8f5; border-left:4px solid #2ecc71; padding:10px;"><strong>Admin Note:</strong><br>Candidate confirmed.</div>`;
        } else {
            subject = `Declined: ${app.name}`;
            let rejectionReason = "Fit";
            let specificFeedback = "I have chosen another program.";

            if (this.data.policy.stipendMod < 1.0) {
                rejectionReason = "Financial";
                specificFeedback = "The stipend is not competitive compared to other offers.";
            } else if (this.data.prestige < 50 && app.stats.brains > 80) {
                rejectionReason = "Prestige";
                specificFeedback = "I accepted an offer from a higher-ranked program.";
            } else if (app.stats.fit < 40) {
                rejectionReason = "Research Fit";
                specificFeedback = "I didn't feel a strong scientific connection.";
            }

            body = `<p>Dear Chair,</p><p>Thank you for the offer. I have decided to decline.</p><div style="background:#fdedec; border:1px solid #ebccd1; padding:10px; margin:10px 0;"><strong>Reason: ${rejectionReason}</strong><br><em>"${specificFeedback}"</em></div>`;
        }

        this.addEmail(app.name, subject, body, 'notification'); 
        
        if(app.lobbying) {
            const fac = this.data.faculty.find(f => f.id === app.lobbying.facultyId);
            if(fac) {
                if (app.lobbying.type === 'support' && app.status === 'Rejected') { 
                    fac.happiness -= 15;
                    this.addEmail(fac.name, "Disappointed", `I am very disappointed we let ${app.name} go.`, 'notification');
                }
                if (app.lobbying.type === 'oppose' && app.status === 'Accepted') { 
                    fac.happiness -= 15;
                    this.addEmail(fac.name, "Concerned", `I strongly disagree with admitting ${app.name}.`, 'notification');
                }
            }
        }

        if(typeof UI !== 'undefined' && document.getElementById('screen-admissions')) UI.renderAdmissions(this.data); 
    },
    
    sweetenOffer: function(appId) { const app = this.data.admissions.pool.find(a => a.id === appId); if(!app || this.data.budget < 5000) return; this.data.budget -= 5000; app.yieldBonus += 25; app.facultyNote += " (Dean's Fellowship)"; this.addEmail("Admin", "Fellowship Approved", `authorized $5k fellowship for ${app.name}.`); if(typeof UI !== 'undefined') UI.renderAdmissions(this.data); },
    performInterview: function(appId, qId) { const app = this.data.admissions.pool.find(a => a.id === appId); if(!app || app.interview.points <= 0) return null; app.interview.points--; let qText = qId; let reveals = "fit"; if(typeof ADMISSIONS !== 'undefined') { const realQ = ADMISSIONS.QUESTIONS.find(q => q.id === qId); if(realQ) { qText = realQ.text; reveals = realQ.reveals; } } let answerKey = "med"; let statVal = 50; if(app.stats && app.stats[reveals] !== undefined) statVal = app.stats[reveals]; if(statVal > 70) answerKey = "high"; else if(statVal < 40) answerKey = "low"; let answerText = "Generic answer."; if(typeof ADMISSIONS !== 'undefined' && ADMISSIONS.ANSWERS[reveals] && ADMISSIONS.ANSWERS[reveals][answerKey]) { const options = ADMISSIONS.ANSWERS[reveals][answerKey]; answerText = options[Math.floor(Math.random() * options.length)]; } const entry = { question: qText, answer: answerText }; app.interview.log.push(entry); return entry; },
    flyoutCandidate: function(appId) { const app = this.data.admissions.pool.find(a => a.id === appId); if(!app) return; this.data.budget -= 500; app.flownOut = true; app.statsVisible = true; app.yieldBonus += 10; this.addEmail("Travel", `Flyout: ${app.name}`, "Candidate visited."); },
    
    extendOffer: function(appId, withFlyout=false) { 
        const app = this.data.admissions.pool.find(a => a.id === appId); 
        if(app) { 
            app.status = "Offer Extended"; 
            if(withFlyout) {
                if (this.data.budget >= 500) {
                    this.data.budget -= 500;
                    app.flownOut = true;
                    app.statsVisible = true;
                    app.yieldBonus += 10;
                    app.facultyNote += " (Invited)";
                } else {
                    alert("Not enough budget for flyout!");
                }
            }
            if(typeof UI !== 'undefined') UI.renderAdmissions(this.data); 
        } 
    },
    
    rejectCandidate: function(appId) { const app = this.data.admissions.pool.find(a => a.id === appId); if(app) app.status = "Rejected"; },
    
    addEmail: function(sender, subject, body, category='normal') { 
        this.data.emails.unshift({ id: Date.now() + Math.random(), date: `${this.data.month+1}/${this.data.day}`, sender: sender, subject: subject, body: body, read: false }); 
        
        let shouldPause = false;
        const s = this.data.settings || { pauseOnEmail: true, pauseOnPaper: false };

        if (category === 'urgent') shouldPause = true; 
        else if (category === 'paper' && s.pauseOnPaper) shouldPause = true;
        else if (category === 'notification') shouldPause = false;
        else if (category === 'normal' && s.pauseOnEmail) shouldPause = true;

        if (shouldPause && typeof Game !== 'undefined') {
             Game.setSpeed(0);
             if(typeof UI !== 'undefined') UI.notifyNewEmail(sender, subject);
        }

        if(typeof UI !== 'undefined' && document.getElementById('screen-office') && !document.getElementById('screen-office').classList.contains('hidden')) { 
            UI.renderInbox(this.data.emails); 
        }
    },
    
    saveGame: function() { localStorage.setItem('tenureTrackSave', JSON.stringify(this.data)); alert("Game Saved!"); },
    loadGame: function(input) { const load = (json) => { this.data = JSON.parse(json); UI.toggleGameView(true); UI.updateTopBar(this.data); Game.navigate('office'); }; if(input && input.files[0]) { const r = new FileReader(); r.onload = (e) => load(e.target.result); r.readAsText(input.files[0]); } else if (localStorage.getItem('tenureTrackSave')) load(localStorage.getItem('tenureTrackSave')); }
};

const FinanceSystem = { getProjection: (d) => [d.budget] };

const ApplicantGenerator = {
    firstNames: [
        "James","Mary","John","Patricia","Robert","Jennifer","Michael","Linda","William","Elizabeth",
        "David","Barbara","Richard","Susan","Joseph","Jessica","Thomas","Sarah","Charles","Karen",
        "Wei","Li","Hao","Min","Jun","Ying","Lei","Jin","Sora","Haruto","Yuna","Kenji",
        "Aarav","Priya","Vihaan","Ananya","Aditya","Diya","Arjun","Saanvi","Rohan","Ishaan",
        "Lukas","Emma","Matteo","Sofia","Hugo","Camille","Lars","Anna","Dimitri","Elena"
    ],
    lastNames: [
        "Smith","Johnson","Williams","Brown","Jones","Garcia","Miller","Davis","Rodriguez","Martinez",
        "Wang","Li","Zhang","Liu","Chen","Yang","Huang","Zhao","Wu","Zhou",
        "Patel","Singh","Sharma","Kumar","Gupta","Rao","Shah","Mehta",
        "Müller","Schmidt","Dubois","Leroy","Rossi","Russo","Ivanov","Smirnov"
    ],

    generateName: function(isInternational) {
        const f = this.firstNames[Math.floor(Math.random() * this.firstNames.length)];
        const l = this.lastNames[Math.floor(Math.random() * this.lastNames.length)];
        return `${f} ${l}`;
    },

    generatePool: function(facultyList, qualityMod, volumeMod) {
        const pool = [];
        const baseVolume = 25; 
        const count = Math.floor(baseVolume * volumeMod) + Math.floor(Math.random() * 10);
        const safeFacList = (facultyList && facultyList.length > 0) ? facultyList : [{id: 999, name: "Dr. Default", field: "Organic"}];

        for(let i=0; i<count; i++) {
            const isInternational = Math.random() < 0.35; 
            const statBonus = isInternational ? 5 : 0;
            const baseStat = (30 * qualityMod) + statBonus; 
            
            const brains = Math.min(100, Math.floor(Math.random() * (100-baseStat)) + baseStat);
            let gpa = 2.8 + (brains / 100) + ((Math.random() * 0.4) - 0.1);
            gpa = Math.max(2.7, Math.min(4.0, gpa));
            let recScore = Math.floor((brains/10) - 2 + (Math.random()*4));
            recScore = Math.max(1, Math.min(10, recScore));

            const hasFellowship = isInternational ? false : (Math.random() < 0.08); 
            const interest = safeFacList[Math.floor(Math.random() * safeFacList.length)].field;
            const matches = safeFacList.filter(f => f.field === interest).map(f => ({ name: f.name, reason: "Direct Fit" }));
            
            let facultyNote = "No strong faculty interest.";
            let lobbying = null;
            if (safeFacList.length > 0 && Math.random() < 0.20) {
                const fac = safeFacList[Math.floor(Math.random() * safeFacList.length)];
                const type = Math.random() > 0.5 ? 'support' : 'oppose';
                lobbying = {
                    facultyId: fac.id,
                    facultyName: fac.name,
                    type: type,
                    text: type === 'support' ? `Dr. ${fac.name} says: "I met them at a conference. We MUST recruit them."` : `Dr. ${fac.name} says: "I heard bad things from their previous PI. Do not admit."`
                };
            }

            if(matches.length > 0 && !lobbying) {
                 if(recScore >= 8) facultyNote = "Faculty are fighting over this student.";
                 else if(recScore >= 6) facultyNote = "Several faculty are interested.";
            }
            if(hasFellowship) facultyNote = "HAS FELLOWSHIP. FREE TO LAB.";

            pool.push({
                id: Date.now() + i,
                name: this.generateName(isInternational),
                isInternational: isInternational,
                stats: { brains, hands: Math.random()*100, grit: Math.random()*100, ambition: Math.random()*100, fit: Math.random()*100 },
                statsVisible: false, yieldBonus: 0,
                application: { gpa: gpa.toFixed(2), recScore: recScore, gre: 310, hasFellowship: hasFellowship },
                interest: interest, matches: matches, facultyNote: facultyNote, 
                lobbying: lobbying,
                status: "Pending", flownOut: false, interview: { points: 3, log: [] }
            });
        }
        return pool;
    },
    getFuzzyStat: function(val) { return val >= 85 ? "Exceptional" : (val >= 70 ? "Strong" : (val >= 50 ? "Average" : "Weak")); }
};

const StudentGenerator = {
    generate: function(advisorId, advisorName) {
        const year = Math.floor(Math.random() * 6) + 1; 
        const name = ApplicantGenerator.generateName(false);
        let funding = "TA";
        if(Math.random() < 0.05) { funding = "Fellowship"; } 
        else { const raChance = (year - 1) * 0.25; if(Math.random() < raChance) { funding = "RA"; } else { funding = "TA"; } }
        return { 
            id: Date.now()+Math.random(), 
            name: `${name} (G${year})`, 
            year: year, 
            advisorId: advisorId, 
            funding: funding,
            stats: { brains: Math.floor(Math.random()*100), hands: Math.floor(Math.random()*100), grit: Math.floor(Math.random()*100) }
        };
    },
    getCountForRank: function(rank) { return rank === "Adjunct" ? 0 : 5 + Math.floor(Math.random() * 6); }
};

const FacultyGenerator = {
    generate: function(rank, field) {
        const salary = FINANCE.SALARIES[rank] || 85000;
        const grants = [];
        const agencies = ["NSF", "NIH", "DOE", "DOD"];
        let grantCount = 0;
        if(rank === "Full") grantCount = Math.floor(Math.random() * 3) + 2; 
        if(rank === "Associate") grantCount = Math.floor(Math.random() * 2) + 1;
        if(rank === "Assistant" && Math.random() > 0.5) grantCount = 1;

        for(let i=0; i<grantCount; i++) {
            const agency = agencies[Math.floor(Math.random()*agencies.length)];
            grants.push({ name: `${agency} Grant`, remaining: 200000 + Math.floor(Math.random() * 400000) });
        }

        // --- FIXED: Uses generateName to avoid "Dr. Dr. Smith" ---
        const fullName = ApplicantGenerator.generateName(false);

        return {
            id: Date.now() + Math.random(),
            name: `Dr. ${fullName}`,
            rank: rank, rankLabel: rank, field: field, tenured: (rank === "Full" || rank === "Associate"),
            salary: salary, age: 30 + Math.floor(Math.random()*25), hIndex: Math.floor(Math.random()*30),
            students: [], grants: grants, pendingApps: [], funds: 10000, burnRate: 0, fundingSourceLabel: "Grants", runway: "Inf",
            happiness: 80
        };
    },
    recalcFinances: function(prof, allStudents) {}
};