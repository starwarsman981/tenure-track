/* js/state.js */
const State = {
    data: {
        year: 2025, month: 7, day: 1,
        budget: 0, prestige: 0, deptName: "", type: "", discipline: "",
        faculty: [], students: [], emails: [],
        pendingEvent: null,
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
        this.addEmail("Provost", "Fiscal Year Start", `Welcome. Expenses are deducted weekly.`);
    },

    advanceDay: function() {
        this.data.day++;
        if(this.data.day % 7 === 0) {
            this.processWeeklyFinances();
            this.processGrantCycle();
            this.processResearchOutput(); // NEW: Check for papers
            this.processMorale();
        }

        if(this.data.month === 8 && this.data.day === 1) this.processTuitionDrop();
        if(this.data.month === 0 && this.data.day === 15) this.processTuitionDrop();

        if(this.data.month === 7 && this.data.day === 15 && !this.data.admissions.setupComplete) UI.showRecruitmentSetupModal();
        
        const isSeason = (this.data.month === 11 || this.data.month === 0 || this.data.month === 1 || this.data.month === 2);
        if (isSeason && !this.data.admissions.active) {
            if(!this.data.admissions.setupComplete) this.setRecruitmentStrategy(7, "standard");
            this.startAdmissionsSeason();
        }

        if(this.data.month === 2 && this.data.day === 1) {
            this.data.pendingEvent = {
                title: "Visit Weekend", desc: "March 1st. Host the admitted students?",
                choices: [{ text: "Host ($2,000)", cost: 2000, flavor: "Boosts yield.", effect: "visit_weekend" }, { text: "Skip", cost: 0, flavor: "Saves money.", effect: "none" }]
            };
        }

        if((this.data.month === 2 && this.data.day >= 15) || (this.data.month === 3 && this.data.day < 15)) this.processGradualDecisions();
        if(this.data.month === 3 && this.data.day === 15) this.processDecisionDay();

        if (this.data.day > 30) {
            this.data.day = 1; this.data.month++;
            if(this.data.month > 11) { this.data.month = 0; this.data.year++; }
        }
        if(typeof EVENTS_DB !== 'undefined') {
            const event = EVENTS_DB.find(e => e.month === this.data.month && e.day === this.data.day);
            if(event) this.data.pendingEvent = event;
        }
    },

    // --- NEW: RESEARCH ENGINE ---
    processResearchOutput: function() {
        this.data.faculty.forEach(f => {
            const myStudents = this.data.students.filter(s => s.advisorId === f.id);
            if(myStudents.length === 0) return;

            // Calculate "Lab Power"
            let totalBrains = 0;
            let totalHands = 0;
            myStudents.forEach(s => {
                totalBrains += s.stats.brains;
                totalHands += s.stats.hands;
            });

            // Probability of breakthrough per week
            // e.g. 5 students w/ 50 stats = 500 power. 
            // 500 / 8000 = 6% chance per week.
            const power = totalBrains + totalHands;
            const chance = power / 8000; 

            if(Math.random() < chance) {
                this.triggerDiscovery(f);
            }
        });
    },

    triggerDiscovery: function(prof) {
        // Madlib Generation
        const adj = RESEARCH_DB.ADJECTIVES[Math.floor(Math.random() * RESEARCH_DB.ADJECTIVES.length)];
        const method = RESEARCH_DB.METHODS[Math.floor(Math.random() * RESEARCH_DB.METHODS.length)];
        const target = RESEARCH_DB.TARGETS[Math.floor(Math.random() * RESEARCH_DB.TARGETS.length)];
        const app = RESEARCH_DB.APPLICATIONS[Math.floor(Math.random() * RESEARCH_DB.APPLICATIONS.length)];
        
        const title = `A ${adj} ${method} of ${target} for ${app}`;
        const journal = ["Nature", "Science", "JACS", "Angewandte", "Tetrahedron"][Math.floor(Math.random()*5)];
        
        prof.hIndex += 1;
        this.data.prestige += 1;
        
        // Send Email
        this.addEmail(
            prof.name, 
            `PAPER PUBLISHED: ${target}`, 
            `We are excited to announce our latest work: "${title}", published today in <em>${journal}</em>.<br><br>The grad students worked hard on this one.`
        );
    },

    // ... (Existing Processors: WeeklyFinances, Tuition, Morale, GrantCycle - Unchanged) ...
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
    setPolicy: function(key, value) { this.data.policy[key] = parseFloat(value); if(typeof UI !== 'undefined') UI.renderFinance(this.data, "budget"); },
    processGrantCycle: function() {
        this.data.faculty.forEach(f => {
            const needsMoney = parseFloat(f.runway) < 12 || f.runway === "0.0"; const canApply = f.pendingApps.length < 2; 
            if (canApply && Math.random() < (needsMoney ? 0.08 : 0.01)) { const agency = ["NSF", "NIH", "DOE", "DOD"][Math.floor(Math.random()*4)]; f.pendingApps.push({ agency: agency, amount: 350000 + Math.floor(Math.random()*400000), weeksPending: 0, weeksToDecision: 10 + Math.floor(Math.random()*10) }); }
            for (let i = f.pendingApps.length - 1; i >= 0; i--) {
                const app = f.pendingApps[i]; app.weeksPending++;
                if (app.weeksPending >= app.weeksToDecision) {
                    const successChance = 0.15 + (f.hIndex / 150); 
                    if(Math.random() < successChance) { f.grants.push({ name: `${app.agency} Grant`, remaining: app.amount }); this.addEmail("OSP", `Award: ${f.name}`, `$${(app.amount/1000).toFixed(0)}k from ${app.agency}.`); f.hIndex += 2; }
                    f.pendingApps.splice(i, 1);
                }
            }
        });
    },
    // ... (Standard Admissions/Event helpers unchanged) ...
    setRecruitmentStrategy: function(target, strategyKey) { const cost = (strategyKey === 'aggressive') ? 7500 : (strategyKey === 'standard' ? 2000 : 0); this.data.budget -= cost; this.data.admissions.targetSize = parseInt(target); this.data.admissions.strategy = strategyKey; this.data.admissions.setupComplete = true; },
    startAdmissionsSeason: function() { this.data.admissions.active = true; const stratKey = this.data.admissions.strategy || "standard"; let qualMod = stratKey === 'aggressive' ? 1.2 : (stratKey === 'none' ? 0.8 : 1.0); let volMod = stratKey === 'aggressive' ? 1.5 : (stratKey === 'none' ? 0.8 : 1.0); this.data.admissions.pool = ApplicantGenerator.generatePool(this.data.faculty, qualMod, volMod); this.data.pendingEvent = { title: "Applications Received", desc: `${this.data.admissions.pool.length} applications received.`, choices: [{ text: "Open Files", cost: 0, flavor: "View candidates.", effect: "none" }] }; if(typeof UI !== 'undefined' && document.getElementById('screen-admissions')) UI.renderAdmissions(this.data); },
    hostVisitWeekend: function() { this.data.admissions.pool.forEach(app => { if(app.status === 'Pending' || app.status === 'Offer Extended') { app.flownOut = true; app.statsVisible = true; app.yieldBonus += 15; app.facultyNote += " (Visited)"; } }); this.addEmail("Events", "Visit Weekend", "Candidates visited."); },
    processGradualDecisions: function() { let chance = 0.05; if(this.data.month === 3) chance = 0.25; if(this.data.month === 3 && this.data.day > 10) chance = 0.60; this.data.admissions.pool.forEach(app => { if(app.status === 'Offer Extended' && Math.random() < chance) this.resolveApplication(app, "Early Decision"); }); },
    processDecisionDay: function() { let count = 0; this.data.admissions.pool.forEach(app => { if(app.status === 'Offer Extended') { this.resolveApplication(app, "Deadline Decision"); if(app.status === "Accepted") count++; } }); this.data.pendingEvent = { title: "Decision Day Results", desc: `${count} candidates accepted offers.`, choices: [{ text: "View Roster", cost: 0, flavor: "Done.", effect: "none" }] }; UI.renderAdmissions(this.data); },
    resolveApplication: function(app, reason) { const chance = 0.3 + (app.yieldBonus / 100) + (this.data.prestige / 200) + (app.stats.fit / 200); const accepted = Math.random() < chance; app.status = accepted ? "Accepted" : "Declined"; this.addEmail(app.name, accepted ? "Accepting Offer" : "Declining Offer", accepted ? `I accept! (${reason})` : `I decline. (${reason})`); if(typeof UI !== 'undefined' && document.getElementById('screen-admissions')) UI.renderAdmissions(this.data); },
    sweetenOffer: function(appId) { const app = this.data.admissions.pool.find(a => a.id === appId); if(!app || this.data.budget < 5000) return; this.data.budget -= 5000; app.yieldBonus += 25; app.facultyNote += " (Dean's Fellowship)"; this.addEmail("Admin", "Fellowship Approved", `authorized $5k fellowship for ${app.name}.`); if(typeof UI !== 'undefined') UI.renderAdmissions(this.data); },
    performInterview: function(appId, qId) { const app = this.data.admissions.pool.find(a => a.id === appId); if(!app || app.interview.points <= 0) return null; app.interview.points--; let qText = qId; let reveals = "fit"; if(typeof ADMISSIONS !== 'undefined') { const realQ = ADMISSIONS.QUESTIONS.find(q => q.id === qId); if(realQ) { qText = realQ.text; reveals = realQ.reveals; } } let answerKey = "med"; let statVal = 50; if(app.stats && app.stats[reveals] !== undefined) statVal = app.stats[reveals]; if(statVal > 70) answerKey = "high"; else if(statVal < 40) answerKey = "low"; let answerText = "Generic answer."; if(typeof ADMISSIONS !== 'undefined' && ADMISSIONS.ANSWERS[reveals] && ADMISSIONS.ANSWERS[reveals][answerKey]) { const options = ADMISSIONS.ANSWERS[reveals][answerKey]; answerText = options[Math.floor(Math.random() * options.length)]; } const entry = { question: qText, answer: answerText }; app.interview.log.push(entry); return entry; },
    flyoutCandidate: function(appId) { const app = this.data.admissions.pool.find(a => a.id === appId); if(!app) return; this.data.budget -= 500; app.flownOut = true; app.statsVisible = true; app.yieldBonus += 10; this.addEmail("Travel", `Flyout: ${app.name}`, "Candidate visited."); },
    extendOffer: function(appId) { const app = this.data.admissions.pool.find(a => a.id === appId); if(app) { app.status = "Offer Extended"; UI.renderAdmissions(this.data); } },
    rejectCandidate: function(appId) { const app = this.data.admissions.pool.find(a => a.id === appId); if(app) app.status = "Rejected"; },
    resolveEventChoice: function(event, choice) { this.data.budget -= choice.cost; if(choice.effect === 'visit_weekend') this.hostVisitWeekend(); this.data.pendingEvent = null; },
    addEmail: function(sender, subject, body) { this.data.emails.unshift({ id: Date.now() + Math.random(), date: `${this.data.month+1}/${this.data.day}`, sender: sender, subject: subject, body: body, read: false }); },
    saveGame: function() { localStorage.setItem('tenureTrackSave', JSON.stringify(this.data)); alert("Game Saved!"); },
    loadGame: function(input) { const load = (json) => { this.data = JSON.parse(json); UI.toggleGameView(true); UI.updateTopBar(this.data); Game.navigate('office'); }; if(input && input.files[0]) { const r = new FileReader(); r.onload = (e) => load(e.target.result); r.readAsText(input.files[0]); } else if (localStorage.getItem('tenureTrackSave')) load(localStorage.getItem('tenureTrackSave')); }
};

const FinanceSystem = { getProjection: (d) => [d.budget] };

const ApplicantGenerator = {
    generatePool: function(facultyList, qualityMod, volumeMod) {
        const pool = [];
        const baseVolume = 25; 
        const count = Math.floor(baseVolume * volumeMod) + Math.floor(Math.random() * 10);
        const safeFacList = (facultyList && facultyList.length > 0) ? facultyList : [{name: "Dr. Default", field: "Organic"}];

        for(let i=0; i<count; i++) {
            const baseStat = 30 * qualityMod; 
            const brains = Math.min(100, Math.floor(Math.random() * (100-baseStat)) + baseStat);
            let gpa = 2.8 + (brains / 100) + ((Math.random() * 0.4) - 0.1);
            gpa = Math.max(2.7, Math.min(4.0, gpa));
            let recScore = Math.floor((brains/10) - 2 + (Math.random()*4));
            recScore = Math.max(1, Math.min(10, recScore));

            const hasFellowship = Math.random() < 0.08; 
            const interest = safeFacList[Math.floor(Math.random() * safeFacList.length)].field;
            const matches = safeFacList.filter(f => f.field === interest).map(f => ({ name: f.name, reason: "Direct Fit" }));
            
            let facultyNote = "No strong faculty interest.";
            if(matches.length > 0) {
                 if(recScore >= 8) facultyNote = "Faculty are fighting over this student.";
                 else if(recScore >= 6) facultyNote = "Several faculty are interested.";
            }
            if(hasFellowship) facultyNote = "HAS FELLOWSHIP. FREE TO LAB.";

            pool.push({
                id: Date.now() + i,
                name: `Candidate ${i+1}`,
                stats: { brains, hands: Math.random()*100, grit: Math.random()*100, ambition: Math.random()*100, fit: Math.random()*100 },
                statsVisible: false, yieldBonus: 0,
                application: { gpa: gpa.toFixed(2), recScore: recScore, gre: 310, hasFellowship: hasFellowship },
                interest: interest, matches: matches, facultyNote: facultyNote, 
                status: "Pending", flownOut: false, interview: { points: 3, log: [] }
            });
        }
        return pool;
    },
    getFuzzyStat: function(val) { return val >= 85 ? "Exceptional" : (val >= 70 ? "Strong" : (val >= 50 ? "Average" : "Weak")); }
};

const StudentGenerator = {
    generate: function(advisorId, advisorName) {
        // --- NEW: LAST NAMES & STATS ---
        const year = Math.floor(Math.random() * 6) + 1; 
        const first = ["Alex", "Jordan", "Taylor", "Casey", "Morgan", "Riley", "Jamie", "Robin", "Sam", "Pat"];
        const last = ["Chen", "Smith", "Kim", "Patel", "Johnson", "Nguyen", "Garcia", "Li", "Brown", "Davis"];
        const name = `${first[Math.floor(Math.random()*first.length)]} ${last[Math.floor(Math.random()*last.length)]} (G${year})`;
        
        let funding = "TA";
        if(Math.random() < 0.05) { funding = "Fellowship"; } 
        else { const raChance = (year - 1) * 0.25; if(Math.random() < raChance) { funding = "RA"; } else { funding = "TA"; } }
        
        return { 
            id: Date.now()+Math.random(), 
            name: name, 
            year: year, 
            advisorId: advisorId, 
            funding: funding,
            stats: { 
                brains: Math.floor(Math.random()*100), 
                hands: Math.floor(Math.random()*100), 
                grit: Math.floor(Math.random()*100) 
            }
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

        return {
            id: Date.now() + Math.random(),
            name: `Dr. ${["Smith","Jones","Doe","Lee","Chen","Patel"][Math.floor(Math.random()*6)]}`,
            rank: rank, rankLabel: rank, field: field, tenured: (rank === "Full" || rank === "Associate"),
            salary: salary, age: 30 + Math.floor(Math.random()*25), hIndex: Math.floor(Math.random()*30),
            students: [], grants: grants, pendingApps: [], funds: 10000, burnRate: 0, fundingSourceLabel: "Grants", runway: "Inf",
            happiness: 80
        };
    },
    recalcFinances: function(prof, allStudents) {}
};