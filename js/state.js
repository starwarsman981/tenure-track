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
        admissions: { active: false, setupComplete: false, targetSize: 7, strategy: "standard", pool: [], selectedApplicantId: null },
        facultySearch: { active: false, phase: "idle", budget: 0, pool: [], shortlist: [], offer: null },
    },

    // --- UPDATED COSTS (Realistic 2025 Numbers) ---
    COSTS: {
        // RAs cost Grants; TAs cost the Department Budget.
        RA_WEEKLY: 655, 
        TA_WEEKLY: 655, 
        
        // Fellowship Top-up (Bonus to attract students)
        FELLOW_WEEKLY: 100,

        // Lab Operations (Chemicals, etc per student)
        SUPPLIES_WEEKLY: 300, 
        
        // Base cost to keep the lights on per lab
        LAB_BASE: 500, 
        
        // Departmental Overhead
        STAFF_WEEKLY: 3500, 
        FACILITY_WEEKLY: 2000 
    },

    initNewGame: function(name, typeKey, discKey) {
        this.data.year = 2025; this.data.month = 7; this.data.day = 1;
        this.data.deptName = name; this.data.type = typeKey; this.data.discipline = discKey;
        this.data.students = []; this.data.admissions.active = false; this.data.admissions.pool = [];
        this.data.publications = [];
        this.data.policy = { overheadRate: 0.50, salaryMod: 1.0, stipendMod: 1.0 };
        this.data.emails = [];
        this.data.settings = { pauseOnEmail: true, pauseOnPaper: false };

        if(typeKey === 'state') { this.data.budget = 250000; this.data.prestige = 30; }
        else if(typeKey === 'ivy') { this.data.budget = 750000; this.data.prestige = 80; }
        else { this.data.budget = 100000; this.data.prestige = 10; }
// Inside initNewGame...
        this.data.admissions = {
            active: false,
            pool: [],
            setupComplete: false,
            strategyRequested: false // <--- Ensure this line exists!
        };
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
            2. <strong>Research:</strong> Faculty need Grants. If they run out of money, it's a downward spiral from there. <br>
            3. <strong>Grad Students:</strong> They do the real work. They'll fight for prized RA positions, and if professors don't have the cash, you'll be funding them on a TA instead. Every year, you'll bring in a new admissions class and graduate the senior canidates. <br><br>
            Good luck. You're going to need it.`);
            
        this.addEmail("Provost", "Fiscal Year Start", `Welcome. Expenses are deducted weekly.
            Tuition revenue arrives twice a year: August 1 and January 15. Additionally, we recieve overhead from grants as they are awarded, and state funding is disbursed weekly.<br>
            In order to keep steady revenues, adjust overhead rates and salary/stipend policies in the <span style='color:#c0392b'>Finance Tab</span>.`);
    },

  advanceDay: function() {
        // 1. INCREMENT TIME
        this.data.day++;
        
        // 2. CALENDAR MATH
        if (this.data.day > 30) {
            this.data.day = 1; 
            this.data.month++;
            if(this.data.month > 11) { 
                this.data.month = 0; 
                this.data.year++; 
            }
        }

        // 3. CHECK EVENTS
        
        // --- AUGUST 1st: NEW ACADEMIC YEAR ---
        if(this.data.month === 7 && this.data.day === 1) {
            console.log("📅 Aug 1: Academic Year Rollover");
            this.processTuitionDrop(); 
            if(this.data.year > 2025) this.processAcademicYearRollover(); 
        }
        
        // Jan 15 Tuition
        if(this.data.month === 0 && this.data.day === 15) this.processTuitionDrop();

        // Weekly/Daily Loops
        if(this.data.day % 7 === 0) {
            this.processWeeklyFinances();
            this.processGrantCycle();
            this.processMorale();
            this.processRandomEvents();
            this.updateCitations();
        }
        this.processResearchOutput();

        // --- SPECIFIC DATES ---
        
        // AUG 15: ADMISSIONS RECRUITMENT STRATEGY
        if(this.data.month === 7 && this.data.day >= 15 && !this.data.admissions.setupComplete && !this.data.admissions.strategyRequested) {
            this.data.admissions.strategyRequested = true;
            
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
                <button class="btn-main" onclick="UI.showRecruitmentSetupModal()">Configure Recruitment</button>`, "urgent");
            
            Game.setSpeed(0); // Force Pause
        }
        
        // AUG 20: FACULTY SEARCH AUTHORIZATION
        if(this.data.month === 7 && this.data.day === 20 && !this.data.facultySearch.active) {
            this.addEmail("Dean", "Authorization for Faculty Search", 
                `You have permission to open <strong>1 Tenure-Track Position</strong> this year.<br>
                Do you want to run a search?<br><br>
                <button class='btn-main' onclick='State.startFacultySearch()'>Yes, Open Search</button>
                <button class='btn-small' onclick='State.skipFacultySearch()'>No, save money</button>`);
            Game.setSpeed(0); // Force Pause
        }

        // --- FACULTY SEARCH TIMELINE ---

        // OCT 1: APPLICATIONS ARRIVE (Start Shortlisting)
        if(this.data.month === 9 && this.data.day === 1 && this.data.facultySearch.active && this.data.facultySearch.phase === 'ads') {
            this.generateFacultyCandidates();
            // generateFacultyCandidates sends the email, but let's force pause here too
            Game.setSpeed(0);
        }

        // OCT 25: SHORTLIST DEADLINE WARNING
        if(this.data.month === 9 && this.data.day === 25 && this.data.facultySearch.phase === 'longlist') {
            const shortlistCount = this.data.facultySearch.pool.filter(c => c.status === 'Shortlist').length;
            if(shortlistCount < 3) {
                this.addEmail("Search Chair", "URGENT: Shortlist Deadline", 
                    `The interview phase begins in 5 days (Nov 1).<br>
                    You currently have <strong>${shortlistCount} candidates</strong> shortlisted.<br><br>
                    Please select at least 3 candidates to fly out.`, "urgent");
                Game.setSpeed(0); // Force Pause
            }
        }

        // NOV 1: LOCK SHORTLIST & START INTERVIEWS
        if(this.data.month === 10 && this.data.day === 1 && this.data.facultySearch.active && this.data.facultySearch.phase === 'longlist') {
            let shortlistCount = 0;
            this.data.facultySearch.pool.forEach(c => {
                if(c.status === 'Applied') c.status = 'Rejected';
                if(c.status === 'Shortlist') shortlistCount++;
            });

            if(shortlistCount === 0) {
                this.addEmail("Dean", "Search Canceled", "You failed to select any candidates for interviews. The faculty line has been revoked.", "urgent");
                this.data.facultySearch.active = false;
                this.data.facultySearch.phase = "failed";
            } else {
                this.data.facultySearch.phase = "interview";
                this.addEmail("Search Chair", "Interview Phase Started", 
                    `The shortlist is locked with <strong>${shortlistCount} finalists</strong>.<br>
                    <strong>Action Required:</strong> Conduct interviews and extend an offer.<br>
                    <strong>Hard Deadline:</strong> February 15th.`, "search");
            }
            Game.setSpeed(0); // Force Pause
        }

        // FEB 1: HIRE DEADLINE WARNING
        if(this.data.month === 1 && this.data.day === 1 && this.data.facultySearch.active && this.data.facultySearch.phase === 'interview') {
            this.addEmail("Search Chair", "URGENT: Hiring Deadline Approaching", 
                `We have 15 days left to secure a candidate for the Tenure-Track position.<br>
                If no offer is accepted by <strong>Feb 15</strong>, the Dean will pull the funding.`, "urgent");
            Game.setSpeed(0); // Force Pause
        }

        // FEB 15: SEARCH EXPIRED
        if(this.data.month === 1 && this.data.day === 15 && this.data.facultySearch.active && this.data.facultySearch.phase === 'interview') {
            this.addEmail("Dean", "Search Failed", 
                `The deadline has passed. We cannot keep the faculty line open indefinitely.<br>
                The search is officially closed without a hire. We can try again next year.`, "urgent");
            this.data.facultySearch.active = false;
            this.data.facultySearch.phase = "failed";
            Game.setSpeed(0); // Force Pause
        }
        
        // --- ADMISSIONS SEASON ---
        const isSeason = (this.data.month === 10 || this.data.month === 11 || this.data.month === 0 || this.data.month === 1 || this.data.month === 2);
        if (isSeason && !this.data.admissions.active) {
            if(!this.data.admissions.setupComplete) this.setRecruitmentStrategy(7, "standard");
            this.startAdmissionsSeason();
        }

        // JAN 20: VISIT WEEKEND (Moved from March)
        if(this.data.month === 0 && this.data.day === 20) {
            this.createInteractiveEmailEvent({
                title: "Admissions: Visit Weekend",
                desc: "It is time to host the recruitment weekend for our top applicants. This event can tip the scales for undecided students.",
                choices: [
                    { text: "Host Full Event ($8,000)", cost: 8000, flavor: "Hotel, flights, and dinners. Significantly boosts yield.", effect: "visit_weekend" },
                    { text: "Skip Event", cost: 0, flavor: "Saves money, but we may lose top talent to rivals.", effect: "none" }
                ]
            }, "Admissions Cmte");
            // Interactive events auto-pause, but just in case:
            Game.setSpeed(0);
        }

        // DECISIONS
        if((this.data.month === 2 && this.data.day >= 15) || (this.data.month === 3 && this.data.day < 15)) this.processGradualDecisions();
        if(this.data.month === 3 && this.data.day === 15) this.processDecisionDay();
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
        // Generate Title
        const adj = RESEARCH_DB.ADJECTIVES[Math.floor(Math.random() * RESEARCH_DB.ADJECTIVES.length)];
        const method = RESEARCH_DB.METHODS[Math.floor(Math.random() * RESEARCH_DB.METHODS.length)];
        const target = RESEARCH_DB.TARGETS[Math.floor(Math.random() * RESEARCH_DB.TARGETS.length)];
        const app = RESEARCH_DB.APPLICATIONS[Math.floor(Math.random() * RESEARCH_DB.APPLICATIONS.length)];
        const title = `A ${adj} ${method} of ${target} for ${app}`;
        
        // NEW 1-10 Scale Logic
        const journals = [
            { name: "Nature", impact: 9.9 },
            { name: "Science", impact: 9.5 },
            { name: "JACS", impact: 6.5 },
            { name: "Angewandte", impact: 6.0 },
            { name: "Chem. Sci.", impact: 3.5 },
            { name: "Tetrahedron", impact: 1.2 }
        ];
        
        const roll = (prof.hIndex / 3) + (Math.random() * 20); 
        let journal = journals[5]; 
        if(roll > 40) journal = journals[0];
        else if(roll > 35) journal = journals[1];
        else if(roll > 25) journal = journals[2];
        else if(roll > 20) journal = journals[3];
        else if(roll > 10) journal = journals[4];

        // Give credit to students
        const myStudents = this.data.students.filter(s => s.advisorId === prof.id);
        let firstAuthor = "Postdoc J. Doe";
        let coAuthors = "";
        
        if (myStudents.length > 0) {
            myStudents.sort((a,b) => b.stats.hands - a.stats.hands);
            firstAuthor = myStudents[0].name;
            myStudents[0].pubs = (myStudents[0].pubs || 0) + 1; // Increment student paper count
            if(myStudents.length > 1) {
                coAuthors = ", " + myStudents.slice(1, Math.min(4, myStudents.length)).map(s => s.name.split(' ')[1]).join(', ');
            }
        }

        // Apply Rewards
        prof.hIndex += Math.ceil(journal.impact); 
        this.data.prestige += Math.ceil(journal.impact / 2);

        // Calculate Citations & Save Record
        const citations = Math.floor(journal.impact * (5 + Math.random() * 20));
        
        // Ensure the list exists before pushing (safety check)
        if(!this.data.publications) this.data.publications = [];

       this.data.publications.push({
         title: title,
         journal: journal.name,
          impact: journal.impact,
           citations: 0,              // Start at 0
           age: 0,                    // New paper (0 weeks old)
           author: prof.name,
          authorHIndex: prof.hIndex, // Capture author fame at time of publishing
          year: this.data.year
        });

        // Email Notification Logic
        let comment = "";
        let color = "#7f8c8d";
        if (journal.impact > 9) {
            comment = "This is career-defining work. The press office needs to run a story on this.";
            color = "#8e44ad"; 
        } else if (journal.impact > 6) {
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
                    <strong>Impact Factor:</strong> ${journal.impact.toFixed(1)} / 10
                </div>
            </div>
            <p>"${comment}"</p>
            <p>Best,<br>${prof.name.split(' ').slice(-1)[0]}</p>
        `;

        this.addEmail(prof.name, `Pub Accepted: ${journal.name}`, body, 'paper');
    },

    /* Paste this AFTER triggerDiscovery, inside the State object */

    updateCitations: function() {
        if (!this.data.publications) return;

        this.data.publications.forEach(pub => {
            pub.age++; // Increment age in weeks

            // 1. Ramp-Up Factor (Accelerates over first 8 weeks)
            // Starts slow (12%) and reaches 100% speed by week 8
            const rampUp = Math.min(1, pub.age / 8);

            // 2. Base Velocity (Impact driven)
            // Low Impact (1.2): ~0.14 cites/week
            // High Impact (9.9): ~9.8 cites/week
            const impactVelocity = (pub.impact * pub.impact) / 10;

            // 3. Prestige Bonus (Author Fame)
            // Adds a small flat bonus based on how famous the PI is
            const prestigeBonus = (pub.authorHIndex || 10) / 50;

            // Calculate Potential Citations this week
            const potential = (impactVelocity + prestigeBonus) * rampUp;
            
            // Apply Randomness (Handle decimals)
            // e.g., 0.4 potential = 40% chance of 1 citation
            const base = Math.floor(potential);
            const chance = potential - base;
            
            let gained = base;
            if(Math.random() < chance) gained++;
            
            // Random "Viral" Spike (1% chance for a burst)
            if(Math.random() < 0.01) {
                gained += Math.floor(Math.random() * 5 * pub.impact);
            }

            pub.citations += gained;
        });
    },
    modifyMorale: function(amount) { this.data.faculty.forEach(f => f.happiness = Math.max(0, Math.min(100, f.happiness + amount))); },

    /* Inside state.js -> Replace processWeeklyFinances */

processWeeklyFinances: function() {
    const pol = this.data.policy;
    let expFaculty = 0; 
    let expResearch = 0; 
    
    // OVERHEAD IS NOW LUMP SUM ONLY.
    // We keep the variable so the ledger structure doesn't break, but it is 0 weekly.
    let overheadGenerated = 0; 

    this.data.faculty.forEach(f => {
        // 1. Faculty Salary
        expFaculty += (f.salary * pol.salaryMod) / 52;

        // 2. Lab Costs
        let grantBurnNeeded = this.COSTS.LAB_BASE; 
        const myStudents = this.data.students.filter(s => s.advisorId === f.id);
        
        myStudents.forEach(s => {
            grantBurnNeeded += this.COSTS.SUPPLIES_WEEKLY;

            if(s.funding === "RA") {
                // RA: Grant pays Stipend + Supplies.
                // Overhead is NO LONGER collected here. It was taken upfront.
                const stipendCost = (this.COSTS.RA_WEEKLY * pol.stipendMod);
                grantBurnNeeded += stipendCost;
            } 
            else if (s.funding === "TA") {
                // TA: Dept pays Stipend.
                expResearch += (this.COSTS.TA_WEEKLY * pol.stipendMod);
            } 
        });

        // 3. Deduct from Grants
        if(f.grants.length > 0) {
            f.grants.forEach(g => {
                if(grantBurnNeeded > 0 && g.remaining > 0) {
                    const amount = Math.min(grantBurnNeeded, g.remaining);
                    g.remaining -= amount; 
                    grantBurnNeeded -= amount; 
                }
            });
            f.grants = f.grants.filter(g => g.remaining > 0);
        }
        
        this.recalcFacultyFinances(f);
    });

    const incState = 65000; 
    const totalIncome = incState + overheadGenerated;
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
            weeklyBurn += this.COSTS.SUPPLIES_WEEKLY;
            if(s.funding === "RA") weeklyBurn += (this.COSTS.RA_WEEKLY * pol.stipendMod);
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
    
    // Force immediate redraw of the Finance screen to show "Live" projection
    if(typeof UI !== 'undefined' && document.getElementById('screen-finance')) {
        UI.renderFinance(this.data, "overview"); 
    }
},
    /* Inside state.js -> Replace processGrantCycle */

processGrantCycle: function() {
    this.data.faculty.forEach(f => {
        // 1. Check if they apply
        const needsMoney = parseFloat(f.runway) < 12 || f.runway === "0.0"; 
        const canApply = f.pendingApps.length < 2; 
        
        // Chance to apply (Higher if they are desperate)
        if (canApply && Math.random() < (needsMoney ? 0.08 : 0.01)) { 
            const agency = ["NSF", "NIH", "DOE", "DOD"][Math.floor(Math.random()*4)]; 
            f.pendingApps.push({ 
                agency: agency, 
                amount: 350000 + Math.floor(Math.random()*400000), 
                weeksPending: 0, 
                weeksToDecision: 10 + Math.floor(Math.random()*10) 
            }); 
        }

        // 2. Process Pending Applications
        for (let i = f.pendingApps.length - 1; i >= 0; i--) {
            const app = f.pendingApps[i]; 
            app.weeksPending++;
            
            if (app.weeksPending >= app.weeksToDecision) {
                const successChance = 0.15 + (f.hIndex / 150); 
                
                if(Math.random() < successChance) { 
                    // --- SUCCESS LOGIC START ---
                    
                    // 1. Calculate Lump Sums
                    const overheadRate = this.data.policy.overheadRate;
                    const totalAward = app.amount;
                    const indirects = Math.floor(totalAward * overheadRate); // Money for YOU
                    const direct = totalAward - indirects;                   // Money for LAB
                    
                    // 2. Transfer Funds
                    f.grants.push({ name: `${app.agency} Grant`, remaining: direct }); 
                    f.hIndex += 2; 
                    
                    this.data.budget += indirects; // <--- INSTANT DEPOSIT TO DEPT

                    // 3. Send Email
                    const body = `
                    <div style="font-family:monospace; background:#f4f4f4; padding:10px; border:1px solid #ccc;">
                        <strong>NOTICE OF AWARD: ${app.agency}-2026-${Math.floor(Math.random()*1000)}</strong><br>
                        ------------------------------------------------<br>
                        PI: ${f.name}<br>
                        Total Award: &nbsp;&nbsp;&nbsp;<strong>$${totalAward.toLocaleString()}</strong><br>
                        <span style="color:#27ae60;">Indirects To Dept (${(overheadRate*100).toFixed(0)}%): +$${indirects.toLocaleString()}</span><br>
                        ------------------------------------------------<br>
                        <strong>NET TO LAB: &nbsp;&nbsp;&nbsp;<span>$${direct.toLocaleString()}</span></strong>
                    </div>
                    <p>The overhead funds have been transferred to the Department account.</p>`;
                    
                    this.addEmail("OSP", `Award Notice: ${f.name} (${app.agency})`, body, 'notification');
                    // --- SUCCESS LOGIC END ---
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
    startFacultySearch: function() {
        this.data.facultySearch.active = true;
        this.data.facultySearch.phase = "ads";
        this.data.budget -= 5000;
        this.addEmail("Search Cmte", "Job Ad Posted", "We have posted the ad in Science and Nature Jobs. Applications will arrive in October. (-$5,000)");
        // Trigger pool generation later
        this.data.pendingEvent = { title: "Search Active", desc: "Ads are running.", choices: [{text:"OK", cost:0, flavor:"Good", effect:"none"}]};
    },
    
    skipFacultySearch: function() {
        this.addEmail("Dean", "Acknowledged", "We will save the line for next year.");
    },

    generateFacultyCandidates: function() {
        const count = 10 + Math.floor(Math.random() * 5);
        const pool = [];
        const sizes = ["Small (3-5)", "Medium (6-10)", "Massive (15+)"];
        
        for(let i=0; i<count; i++) {
            const tierRoll = Math.random();
            let tier = 4;
            if(tierRoll > 0.9) tier = 1; else if(tierRoll > 0.7) tier = 2; else if(tierRoll > 0.4) tier = 3;
            
            const school = FACULTY_SEARCH.TIERS[tier].schools[Math.floor(Math.random() * FACULTY_SEARCH.TIERS[tier].schools.length)];
            const postdocLab = FACULTY_SEARCH.LABS[Math.floor(Math.random() * FACULTY_SEARCH.LABS.length)];
            const baseStartup = 400000 + ((5-tier) * 100000) + (Math.random() * 200000);
            
            // NEW: Random Field & Lab Size
            const fieldObj = FAC_DATA.fields[Math.floor(Math.random() * FAC_DATA.fields.length)];
            
            pool.push({
                id: Date.now() + i,
                name: ApplicantGenerator.generateName(false),
                pedigree: { phd: school, tier: tier, postdoc: postdocLab },
                stats: { research: Math.random()*100, teaching: Math.random()*100 },
                hIndex: Math.floor((5 - tier) * 3 + (Math.random() * 5)),
                startupAsk: Math.floor(baseStartup),
                
                // DATA FOR INTERVIEWS
                field: fieldObj.name,
                labSize: sizes[Math.floor(Math.random() * sizes.length)],
                interviewLog: [], 
                
                status: "Applied"
            });
        }
        this.data.facultySearch.pool = pool;
        this.data.facultySearch.phase = "longlist";
        
        // UPDATED EMAIL WITH DEADLINE
        this.addEmail("Search Chair", "Applications Received", 
            `We have received ${count} applications.<br><br>
            <strong>Task:</strong> Shortlist 3-5 candidates.<br>
            <strong>Deadline:</strong> November 1st.<br><br>
            <span style="color:#c0392b">Warning: Any candidate not shortlisted by Nov 1 will be automatically rejected.</span>`, "search");
    },

    shortlistCandidate: function(id) {
        const c = this.data.facultySearch.pool.find(x => x.id === id);
        if(this.data.facultySearch.shortlist.length >= 3) { alert("You can only fly out 3 candidates."); return; }
        if(this.data.budget < 1500) { alert("Not enough budget for flyout."); return; }
        
        c.status = "Shortlist";
        this.data.facultySearch.shortlist.push(c);
        this.data.budget -= 1500;
        this.addEmail("Travel", "Flyout Booked", `Flight booked for ${c.name}. (-$1,500)`);
        if(typeof UI !== 'undefined') UI.renderFacultySearch(this.data);
    },
    interviewFaculty: function(cId, qId) {
        // Safety Check: Ensure data exists
        if(typeof FACULTY_INTERVIEWS === 'undefined') {
            console.error("Missing FACULTY_INTERVIEWS in data.js");
            return;
        }

        const c = this.data.facultySearch.pool.find(x => x.id === cId);
        if(!c) return;
        
        const qObj = FACULTY_INTERVIEWS.QUESTIONS.find(q => q.id === qId);
        const answers = FACULTY_INTERVIEWS.ANSWERS[qId];
        const ansText = answers[Math.floor(Math.random() * answers.length)];
        
        c.interviewLog.push({ q: qObj.text, a: ansText });
        
        // Refresh UI and KEEP PROFILE OPEN
        if(typeof UI !== 'undefined') {
            UI.renderFacultySearch(this.data);
            UI.viewCV(cId); 
        }
    },

    makeFacultyOffer: function(id, offerAmount) {
        const c = this.data.facultySearch.pool.find(x => x.id === id);
        if(!c) return;

        const gap = offerAmount - c.startupAsk;
        let chance = 0.5;
        if(gap >= 0) chance = 0.95; 
        else if(gap > -25000) chance = 0.75;
        else if(gap > -50000) chance = 0.50;
        else chance = 0.05;

        if(Math.random() < chance) {
            // 1. DEDUCT BUDGET
            this.data.budget -= offerAmount;
            
            // 2. CREATE PROFESSOR
            // Use their specific field (Organic, Physical, etc)
            const newProf = FacultyGenerator.generate("Assistant", c.field || "Physical"); 
            newProf.name = "Dr. " + c.name.split(' ')[1]; 
            newProf.funds = offerAmount; 
            newProf.runway = "2.0 yrs";
            newProf.happiness = 100;
            
            // 3. ATTACH TENURE TRACKER (CRITICAL FIX)
            newProf.tenureTrack = {
                active: true,
                year: 1, // They start at Year 1
                stats: {
                    totalPubs: 0,
                    totalGrants: 0,
                    studentsRecruited: 0,
                    studentsGraduated: 0
                },
                history: []
            };
            
            this.data.faculty.push(newProf);
            
            // 4. SEND EMAILS
            // Candidate Acceptance
            this.addEmail(c.name, "Offer Accepted", 
                `I am thrilled to accept. The startup package of $${offerAmount.toLocaleString()} is generous. I will begin setting up my lab immediately.`);

            // Formal Announcement (The one you requested)
            this.addEmail("Dean's Office", "New Faculty Hire Confirmed", 
                `<div style="padding:15px; background:#f4fef6; border:1px solid #2ecc71; color:#27ae60;">
                    <strong>HR Notification</strong><br>
                    Dr. ${newProf.name} has been added to the payroll.<br>
                    <strong>Rank:</strong> Assistant Professor (Tenure-Track)<br>
                    <strong>Clock:</strong> Year 1 of 6<br>
                    <strong>Start Date:</strong> Immediate
                </div>
                <p>Please assign them office space and ensure they begin recruiting students next cycle.</p>`);
            
            // 5. CLOSE SEARCH
            this.data.facultySearch.active = false;
            this.data.facultySearch.phase = "complete";
            this.data.facultySearch.pool = []; 

        } else {
            this.addEmail(c.name, "Offer Declined", `The startup package ($${offerAmount.toLocaleString()}) is insufficient for my needs ($${c.startupAsk.toLocaleString()}).`);
            c.status = "Declined";
        }
        //PUT IT HERE?!?!?
        if(typeof UI !== 'undefined') UI.renderFacultySearch(this.data);
    },
    processAcademicYearRollover: function() {
        const log = [];
        let prestigeGain = 0;

        // 1. GRADUATION (G5 -> Graduate)
        const graduating = this.data.students.filter(s => s.year >= 5);
        graduating.forEach(g => {
            const advisor = this.data.faculty.find(f => f.id === g.advisorId);
            if(advisor) {
                advisor.students = advisor.students.filter(id => id !== g.id);
            }
            prestigeGain += 5; 
        });
        
        this.data.students = this.data.students.filter(s => s.year < 5);
        this.data.prestige += prestigeGain;
        if(graduating.length > 0) log.push(`🎓 Graduated: ${graduating.length} PhDs (+${prestigeGain} Prestige)`);

        // 2. PROMOTION (G1-G4 -> G2-G5)
        this.data.students.forEach(s => {
            s.year++;
            s.name = s.name.replace(/\(G\d\)/, `(G${s.year})`);
        });
        if(this.data.students.length > 0) log.push(`📈 Promoted: ${this.data.students.length} students`);

        // 3. INTAKE (Accepted Applicants -> G1)
        const newCohort = this.data.admissions.pool.filter(a => a.status === 'Accepted');
        
        if(newCohort.length > 0) {
            newCohort.forEach(a => {
                let assignedFac = null;
                // Match Logic
                if (a.matches && a.matches.length > 0) {
                    assignedFac = this.data.faculty.find(f => f.name.includes(a.matches[0].name.split(' ')[1]));
                }
                // Fallback Logic
                if (!assignedFac) assignedFac = this.data.faculty[Math.floor(Math.random() * this.data.faculty.length)];

                const newStudent = {
                    id: Date.now() + Math.random(),
                    name: `${a.name} (G1)`,
                    year: 1,
                    advisorId: assignedFac.id,
                    funding: a.application.hasFellowship ? "Fellowship" : "TA",
                    stats: a.stats,
                    pubs: 0
                };
                
                this.data.students.push(newStudent);
                assignedFac.students.push(newStudent.id);
            });
            log.push(`✨ New Cohort: ${newCohort.length} G1s joined.`);
        } else {
            // Optional warning if you had 0 recruits
            // log.push(`<span style="color:red">Warning: No new students joined this year.</span>`);
        }

        // --- 4. RESET ADMISSIONS (CRITICAL FIX) ---
        this.data.admissions.pool = [];
        this.data.admissions.active = false;
        this.data.admissions.setupComplete = false; // <--- THIS LINE FIXES THE BUG
        // ------------------------------------------

        // 5. FUNDING SHUFFLE (Re-evaluate RA/TA status)
        let raCount = 0;
        let taCount = 0;

        this.data.faculty.forEach(prof => {
            const myStudents = this.data.students.filter(s => s.advisorId === prof.id);
            let availableGrantMoney = prof.funds - 50000;
            const costPerRA = this.COSTS.RA_WEEKLY * 52; 

            myStudents.sort((a,b) => b.year - a.year); // Seniors first

            myStudents.forEach(s => {
                if(s.funding === "Fellowship") return;
                if(s.year === 1) { s.funding = "TA"; taCount++; return; } // G1s always TA

                if(availableGrantMoney >= costPerRA) {
                    s.funding = "RA";
                    availableGrantMoney -= costPerRA; 
                    raCount++;
                } else {
                    s.funding = "TA";
                    taCount++;
                }
            });
            this.recalcFacultyFinances(prof);
        });
        
        log.push(`💰 Funding Re-evaluated: ${raCount} RAs (Grant Funded), ${taCount} TAs (Dept Funded)`);

        // 6. TENURE CLOCK TICK
        this.data.faculty.forEach(f => {
            if(f.rank === "Assistant" && f.tenureTrack && f.tenureTrack.active) {
                f.tenureTrack.history.push({ year: f.tenureTrack.year, pubs: f.tenureTrack.stats.totalPubs, hIndex: f.hIndex });
                f.tenureTrack.year++;
                if(f.tenureTrack.year === 3) {
                    this.addEmail("Dean", `Mid-Term Review: ${f.name}`, `It is Year 3 for Dr. ${f.name.split(' ')[1]}. Review their Dossier.`, "urgent");
                }
                if(f.tenureTrack.year === 7) {
                    this.triggerTenureVote(f);
                }
            }
        });

        // 7. NOTIFY
        const summary = log.length > 0 ? log.join('<br>') : "No significant changes.";
        this.addEmail("Dean", `Academic Year ${this.data.year}-${this.data.year+1}`, 
            `<div style="padding:15px; background:#f9f9f9; border:1px solid #ddd;"><h3>Annual Report</h3>${summary}</div>`, "urgent");
    },
    saveGame: function() {
        localStorage.setItem('tenureTrackData', JSON.stringify(this.data));
        localStorage.setItem('tenureTrackMeta', Date.now());
        // console.log("💾 Game Auto-Saved"); <--- COMMENTED OUT TO STOP SPAM
    },
    loadGame: function(input) { const load = (json) => { this.data = JSON.parse(json); UI.toggleGameView(true); UI.updateTopBar(this.data); Game.navigate('office'); }; if(input && input.files[0]) { const r = new FileReader(); r.onload = (e) => load(e.target.result); r.readAsText(input.files[0]); } else if (localStorage.getItem('tenureTrackSave')) load(localStorage.getItem('tenureTrackSave')); }
};

/* REPLACE THE BOTTOM 'FinanceSystem' CONST WITH THIS: */

/* Inside state.js (Bottom of file) */

const FinanceSystem = { 
    getProjection: function(data) {
        const pol = data.policy;
        const costs = State.COSTS;

        // 1. Calculate Weekly Burn/Profit based on CURRENT sliders
        // Income
        const stateIncome = 65000; 
        let overheadIncome = 0;
        
        // Expenses
        let facultyCost = 0;
        let studentCost = 0;
        const fixedCost = costs.STAFF_WEEKLY + costs.FACILITY_WEEKLY;

        // Calculate Faculty Salaries (Heavy impact from Slider)
        data.faculty.forEach(f => {
            facultyCost += (f.salary * pol.salaryMod) / 52;
        });

        // Calculate Student Costs
        data.students.forEach(s => {
            // Supply cost (always paid by someone)
            const supplies = costs.SUPPLIES_WEEKLY; 
            // Stipend cost (affected by Slider)
            const stipend = costs.RA_WEEKLY * pol.stipendMod; 

            if (s.funding === "RA") {
                // RA: Grant pays Stipend + Supplies. 
                // Dept gets Overhead on that total.
                // Higher Stipend = Higher Overhead for you (Good!)
                overheadIncome += (stipend + supplies) * pol.overheadRate;
            } else if (s.funding === "TA") {
                // TA: Dept pays Stipend.
                // Higher Stipend = Higher Expense for you (Bad!)
                studentCost += stipend;
            }
        });

        const weeklyNet = (stateIncome + overheadIncome) - (facultyCost + studentCost + fixedCost);

        // 2. Simulate Forward (Projecting the line)
        let simBudget = data.budget;
        const projection = [simBudget];
        let simDay = data.day;
        let simMonth = data.month;
        let simYear = data.year;

        // Look ahead 52 weeks
        for(let w=0; w<52; w++) {
            simBudget += weeklyNet; // Apply the calculated burn rate
            
            simDay += 7;
            if(simDay > 30) {
                simDay = 1; 
                simMonth++;
                if(simMonth > 11) { simMonth = 0; simYear++; }
            }

            // Tuition Injections (Big jumps)
            if(simMonth === 0 && simDay < 8) simBudget += 150000; // Jan
            if(simMonth === 7 && simDay < 8) simBudget += 150000; // Aug

            projection.push(simBudget);
        }

        return projection;
    }
};

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
            pubs: year === 1 ? 0 : Math.floor((year - 1) * (0.3 + Math.random() * 1.5)), 
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