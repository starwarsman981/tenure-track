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

    /* js/state.js */

    /* js/state.js */
    // 1. Helper to Find or Assign a Committee Chair (Lazy Load)
    getCommitteeChair: function(type) {
        // Type = 'search' (Full Prof only) or 'admissions' (Assoc/Full)
        
        let chair = this.data.faculty.find(f => (type === 'search' ? f.isSearchChair : f.isAdmissionsChair));
        
        if (!chair) {
            // No chair assigned yet? Assign one now.
            const candidates = this.data.faculty.filter(f => {
                if (type === 'search') return f.rank === 'Full';
                return f.rank === 'Full' || f.rank === 'Associate';
            });
            
            // If no Full profs exist for search, fallback to anyone (shouldn't happen in normal gen)
            const pool = candidates.length > 0 ? candidates : this.data.faculty;
            
            // Prefer someone who isn't already a chair of the other thing
            chair = pool.find(f => !f.isSearchChair && !f.isAdmissionsChair) || pool[0];
            
            if (chair) {
                if (type === 'search') chair.isSearchChair = true;
                else chair.isAdmissionsChair = true;
            }
        }
        return chair || { name: "Dr. Interim", rank: "Professor" }; // Fallback safety
    },

    // 2. Centralized Signature Generator
    getProfSignature: function(prof) {
        let roleTitle = "Professor of Chemistry"; 
        if (prof.rank === "Assistant") roleTitle = "Assistant Professor of Chemistry";
        else if (prof.rank === "Associate") roleTitle = "Associate Professor of Chemistry";
        else if (prof.rank === "Adjunct") roleTitle = "Adjunct Professor of Chemistry";

        const lastName = prof.name.split(' ').pop();
        const labName = `${lastName} Lab`;

        let extraLine = "";
        // --- NEW: Add Committee Roles to Signature ---
        if (prof.isSearchChair) extraLine += "Chair, Faculty Search Committee<br>";
        if (prof.isAdmissionsChair) extraLine += "Chair, Graduate Admissions<br>";
        
        // Add Research Traits if not already crowded
        if (extraLine === "") {
            if (prof.hIndex > 45) extraLine = "Distinguished Fellow, ACS<br>";
            else if (prof.grants.length > 3) extraLine = "Director, Center for Chemical Innovation<br>";
        }

        return `
            <div style="margin-top:20px; padding-top:10px; border-top:1px solid #ccc; color:#555; font-family:'Georgia', serif; font-size:0.9rem;">
                <strong>${prof.name}</strong><br>
                ${roleTitle}<br>
                Principal Investigator, ${labName}<br>
                ${extraLine}
                ${prof.field} Division
            </div>
        `;
    },
    // CHANGED: Added playerName argument
    initNewGame: function(name, typeKey, discKey, playerName) {
        this.data.year = 2025; this.data.month = 7; this.data.day = 1;
        this.data.deptName = name; this.data.type = typeKey; this.data.discipline = discKey;
        this.data.playerName = playerName; // Store it
        
        this.data.students = []; this.data.admissions.active = false; this.data.admissions.pool = [];
        this.data.publications = [];
        this.data.policy = { overheadRate: 0.50, salaryMod: 1.0, stipendMod: 1.0 };
        this.data.emails = [];
        this.data.settings = { pauseOnEmail: true, pauseOnPaper: false };

        if(typeKey === 'state') { this.data.budget = 250000; this.data.prestige = 30; }
        else if(typeKey === 'ivy') { this.data.budget = 750000; this.data.prestige = 80; }
        else { this.data.budget = 100000; this.data.prestige = 10; }

        this.data.admissions = {
            active: false,
            pool: [],
            setupComplete: false,
            strategyRequested: false 
        };
        
        this.data.faculty = [];
        const targetCount = Math.floor(Math.random() * 5) + 8; 
        const assistantCount = 1 + (Math.random() < 0.5 ? 1 : 0); 
        let ranks = [];
        for(let i=0; i<assistantCount; i++) ranks.push("Assistant");
        while(ranks.length < targetCount) {
            const r = Math.random();
            if(r < 0.45) ranks.push("Associate");
            else if(r < 0.90) ranks.push("Full");
            else ranks.push("Adjunct");
        }
        ranks.sort(() => Math.random() - 0.5);
        if(ranks[0] === "Assistant" || ranks[0] === "Adjunct") {
            const seniorIdx = ranks.findIndex(r => r === "Full" || r === "Associate");
            if(seniorIdx !== -1) { [ranks[0], ranks[seniorIdx]] = [ranks[seniorIdx], ranks[0]]; }
        }

        let availableYears = [0, 1, 2, 3, 4];
        availableYears.sort(() => Math.random() - 0.5);
        let assistantIndex = 0;
        const fields = ["Organic", "Inorganic", "Physical", "Analytical", "Materials"];
        
        for(let i=0; i<targetCount; i++) {
            let r = ranks[i];
            let f = fields[Math.floor(Math.random()*fields.length)];
            let forcedYear = null;
            if(r === "Assistant") { forcedYear = availableYears[assistantIndex]; assistantIndex++; }
            const prof = FacultyGenerator.generate(r, f, forcedYear);
            const studentCount = StudentGenerator.getCountForRank(r);
            for(let s=0; s<studentCount; s++) {
                const newStudent = StudentGenerator.generate(prof.id, prof.name);
                this.data.students.push(newStudent);
                prof.students.push(newStudent.id);
            }
            this.data.faculty.push(prof);
        }
        
        this.data.faculty.forEach(f => this.recalcFacultyFinances(f));
        
        // --- 1. TUTORIAL EMAIL ---
        this.addEmail("Prof. Vance", "Subject: Handover Notes / Good Luck", 
            `<p>Dear Dr. ${playerName},</p>
            <p>I left the office keys under the mat. The department is yours now. Before I drive off into retirement, here is the unvarnished truth about keeping this ship afloat:</p>
            
            <div style="background:#f9f9f9; padding:15px; border-left:4px solid #c0392b; margin:10px 0;">
                <strong>1. The Money Pit (Finance Tab)</strong><br>
                We burn cash every week. If the balance hits $0, the Dean fires you.
                <ul style="margin-top:5px; padding-left:20px; font-size:0.9rem;">
                    <li><strong>Tuition</strong> drops twice a year (Aug 1 & Jan 15). Hoard it.</li>
                    <li><strong>Grants</strong> are life. If faculty run dry, <em>you</em> have to pay their students' salaries (TA lines).</li>
                </ul>
            </div>

            <div style="background:#f9f9f9; padding:15px; border-left:4px solid #2980b9; margin:10px 0;">
                <strong>2. The Cats (Faculty)</strong><br>
                They have egos. They need money. If they are happy, they publish papers. If they publish, we gain <strong>Prestige</strong>.
                <br><em>Tip: Click their names in the Roster to see their specific burn rates.</em>
            </div>

            <p>Try not to burn the building down.</p>
            <br>
            <div style="color:#555; font-family:'Georgia', serif; border-top:1px solid #ccc; padding-top:10px;">
                <strong>Alistair Vance, PhD</strong><br>
                <span style="font-size:0.9rem; color:#777;">Emeritus Professor of Chemistry<br>
                Former Department Chair (Survivor 2015-2025)</span>
            </div>`, "urgent");
            
        // --- 2. MECHANICS EMAIL ---
        this.addEmail("Office of the Provost", "FY26 Fiscal Guidelines & Overhead Policy", 
            `<div style="font-family:'Georgia', serif; border-bottom:1px solid #ccc; margin-bottom:10px; padding-bottom:5px;">
                <strong>MEMORANDUM</strong><br>
                <span style="font-size:0.8rem; color:#666;">TO: Dr. ${playerName}, Dept. Chair | FROM: University Finance Office</span>
            </div>
            <p>Welcome to the 2025-2026 Fiscal Year. As Chair, you have autonomous control over department policies, provided you remain solvent.</p>
            
            <p><strong><u>Revenue Streams</u></strong></p>
            <ul style="font-size:0.9rem;">
                <li><strong>State Stipend:</strong> Disbursed weekly. Covers basic facility costs only.</li>
                <li><strong>Tuition Revenue:</strong> Lump sum transfers on <strong>Aug 1</strong> and <strong>Jan 15</strong>.</li>
                <li><strong>Indirect Costs (Overhead):</strong> You receive a cut of every research grant won by your faculty.</li>
            </ul>

            <p><strong><u>Action Required</u></strong><br>
            Please review the <span style="color:#c0392b; font-weight:bold;">Finance Tab</span> immediately. You must configure:</p>
            <ol style="font-size:0.9rem;">
                <li><strong>Overhead Rate:</strong> How much grant money the Dept takes vs the Lab keeps.</li>
                <li><strong>Salary/Stipends:</strong> Higher pay improves morale and recruitment, but drains the budget faster.</li>
            </ol>
            
            <br>
            <div style="color:#555; font-family:'Georgia', serif; border-top:1px solid #ccc; padding-top:10px;">
                <strong>Eleanor Sterling, MBA, CPA</strong><br>
                <span style="font-size:0.9rem; color:#777;">Provost & Executive Vice President<br>
                Office of Budgetary Compliance</span>
            </div>`, "urgent");
    },

  advanceDay: function() {
    // --- NEW: PROCESS TIMED EVENTS ---
        if(this.data.timedEvents && this.data.timedEvents.length > 0) {
            for (let i = this.data.timedEvents.length - 1; i >= 0; i--) {
                const ev = this.data.timedEvents[i];
                const isTime = (this.data.year > ev.year) || (this.data.year === ev.year && this.data.month > ev.month) || (this.data.year === ev.year && this.data.month === ev.month && this.data.day >= ev.day);

                if (isTime) {
                    if (ev.type === 'late_apps') {
                        const prof = this.data.faculty.find(f => f.id === ev.profId);
                        if (prof) {
                            const newApps = ApplicantGenerator.generatePool([prof], 1.1, 0.2); 
                            newApps.forEach(app => {
                                app.facultyNote = "Late Applicant (Heard about new hire)";
                                app.interest = ev.profField;
                                app.matches = [{ name: ev.profName, reason: "New Lab Opening" }];
                            });
                            this.data.admissions.pool.push(...newApps);
                            
                            // Get Chair for Email
                            const admChair = this.getCommitteeChair('admissions');
                            const playerName = this.data.playerName || "Chair";
                            
                            const body = `Dear Dr. ${playerName},<br><br>Word has spread about ${ev.profName}'s hiring. We just received <strong>${newApps.length} late applications</strong> specifically targeting their lab.<br><br>You should review them immediately in the Admissions tab.<br><br>Best,<br>${this.getProfSignature(admChair)}`;

                            this.addEmail(admChair.name, "Late Applications Arrived", body, "urgent");
                        }
                    }
                    this.data.timedEvents.splice(i, 1);
                }
            }
        }
        
        // 1. INCREMENT TIME
        this.data.day++;
        if (this.data.day > 30) {
            this.data.day = 1; 
            this.data.month++;
            if(this.data.month > 11) { this.data.month = 0; this.data.year++; }
        }

        // 2. CHECK EVENTS
        if(this.data.month === 7 && this.data.day === 1) {
            this.processTuitionDrop(); 
            if(this.data.year > 2025) this.processAcademicYearRollover(); 
        }
        if(this.data.month === 0 && this.data.day === 15) this.processTuitionDrop();

        if(this.data.day % 7 === 0) {
           this.processWeeklyFinances();
           this.processGrantCycle();
           this.processMorale();
           this.updateCitations();
           this.processAdmissionsQueue(); 
        }
        this.processResearchOutput();
        if(this.data.day % 7 === 3) this.processRandomEvents();

        // --- SCHEDULED EMAILS WITH REAL CHAIRS ---
        
        // AUG 15: ADMISSIONS RECRUITMENT STRATEGY
        if(this.data.month === 7 && this.data.day >= 15 && !this.data.admissions.setupComplete && !this.data.admissions.strategyRequested) {
            this.data.admissions.strategyRequested = true;
            
            const admChair = this.getCommitteeChair('admissions');
            const playerName = this.data.playerName || "Chair";
            
            const activeLabs = this.data.faculty.filter(f => f.rank !== 'Adjunct').length;
            const baseEstimate = activeLabs * 1.3; 
            let estimatedCapacity = Math.floor(baseEstimate + (Math.random() * 2) - 1);
            if (estimatedCapacity < 2) estimatedCapacity = 2;
            const low = Math.max(1, estimatedCapacity - 2);
            const high = estimatedCapacity + 2;

            const body = `Dear Dr. ${playerName},<br><br>
            As we approach the new cycle, the committee has analyzed the department's lab capacity. We recommend targeting between <strong>${low} and ${high} students</strong>.<br><br>
            Please authorize the recruitment budget so we can begin advertising to prospective students.<br><br>
            <button class="btn-main" onclick="UI.showRecruitmentSetupModal()">Configure Recruitment</button>
            ${this.getProfSignature(admChair)}`;

            this.addEmail(admChair.name, "ACTION REQUIRED: Set Cohort Size", body, "urgent");
            Game.setSpeed(0); 
        }
        
        // AUG 20: FACULTY SEARCH AUTHORIZATION (Still from Dean)
        if(this.data.month === 7 && this.data.day === 20 && !this.data.facultySearch.active) {
            const playerName = this.data.playerName || "Chair";
            this.addEmail("Dean's Office", "Authorization for Faculty Search", 
                `Dear Dr. ${playerName},<br><br>You have permission to open <strong>1 Tenure-Track Position</strong> this year.<br>
                Do you want to run a search?<br><br>
                <button class='btn-main' onclick='State.startFacultySearch()'>Yes, Open Search</button>
                <button class='btn-small' onclick='State.skipFacultySearch()'>No, save money</button>
                <div style="margin-top:20px; padding-top:10px; border-top:1px solid #ccc; color:#555; font-family:'Georgia', serif;"><strong>Office of the Dean</strong><br>College of Arts & Sciences</div>`);
            Game.setSpeed(0); 
        }

        // OCT 1: APPLICATIONS ARRIVE
        if(this.data.month === 9 && this.data.day === 1 && this.data.facultySearch.active && this.data.facultySearch.phase === 'ads') {
            this.generateFacultyCandidates();
            Game.setSpeed(0);
        }

        // OCT 25: SHORTLIST DEADLINE WARNING
        if(this.data.month === 9 && this.data.day === 25 && this.data.facultySearch.phase === 'longlist') {
            const shortlistCount = this.data.facultySearch.pool.filter(c => c.status === 'Shortlist').length;
            if(shortlistCount < 3) {
                const searchChair = this.getCommitteeChair('search');
                const playerName = this.data.playerName || "Chair";
                const body = `Dear Dr. ${playerName},<br><br>The interview phase begins in 5 days (Nov 1). You currently have <strong>${shortlistCount} candidates</strong> shortlisted.<br><br>Please select at least 3 candidates to fly out.<br><br>Best,<br>${this.getProfSignature(searchChair)}`;
                
                this.addEmail(searchChair.name, "URGENT: Shortlist Deadline", body, "urgent");
                Game.setSpeed(0); 
            }
        }

        // NOV 1: LOCK SHORTLIST & START INTERVIEWS
        if(this.data.month === 10 && this.data.day === 1 && this.data.facultySearch.active && this.data.facultySearch.phase === 'longlist') {
            let shortlistCount = 0;
            this.data.facultySearch.pool.forEach(c => {
                if(c.status === 'Applied') c.status = 'Rejected';
                if(c.status === 'Shortlist') shortlistCount++;
            });

            const searchChair = this.getCommitteeChair('search');
            const playerName = this.data.playerName || "Chair";

            if(shortlistCount === 0) {
                this.addEmail("Dean's Office", "Search Canceled", "You failed to select any candidates for interviews. The faculty line has been revoked.", "urgent");
                this.data.facultySearch.active = false;
                this.data.facultySearch.phase = "failed";
            } else {
                this.data.facultySearch.phase = "interview";
                const body = `Dear Dr. ${playerName},<br><br>The shortlist is locked with <strong>${shortlistCount} finalists</strong>.<br><br>
                    <strong>Action Required:</strong> Conduct interviews and extend an offer.<br>
                    <strong>Hard Deadline:</strong> February 15th.<br><br>
                    ${this.getProfSignature(searchChair)}`;
                this.addEmail(searchChair.name, "Interview Phase Started", body, "search");
            }
            Game.setSpeed(0); 
        }

        // FEB 1: HIRE DEADLINE WARNING
        if(this.data.month === 1 && this.data.day === 1 && this.data.facultySearch.active && this.data.facultySearch.phase === 'interview') {
            const searchChair = this.getCommitteeChair('search');
            const playerName = this.data.playerName || "Chair";
            const body = `Dear Dr. ${playerName},<br><br>We have 15 days left to secure a candidate for the Tenure-Track position. If no offer is accepted by <strong>Feb 15</strong>, the Dean will pull the funding.<br><br>${this.getProfSignature(searchChair)}`;
            
            this.addEmail(searchChair.name, "URGENT: Hiring Deadline Approaching", body, "urgent");
            Game.setSpeed(0); 
        }

        // FEB 15: SEARCH EXPIRED
        if(this.data.month === 1 && this.data.day === 15 && this.data.facultySearch.active && this.data.facultySearch.phase === 'interview') {
            this.addEmail("Dean's Office", "Search Failed", `The deadline has passed. The search is officially closed without a hire.`, "urgent");
            this.data.facultySearch.active = false;
            this.data.facultySearch.phase = "failed";
            Game.setSpeed(0); 
        }
        
        // DEC 1: ADMISSIONS SEASON START
        if (this.data.month === 11 && this.data.day === 1 && !this.data.admissions.active) {
            if(!this.data.admissions.setupComplete) this.setRecruitmentStrategy(7, "standard");
            this.startAdmissionsSeason();
        }

        // JAN 20: VISIT WEEKEND
        if(this.data.month === 0 && this.data.day === 20) {
            const admChair = this.getCommitteeChair('admissions');
            const playerName = this.data.playerName || "Chair";
            
            this.createInteractiveEmailEvent({
                title: "Admissions: Visit Weekend",
                desc: `Dear Dr. ${playerName},<br><br>It is time to host the recruitment weekend for our top applicants. This event can tip the scales for undecided students.<br><br>What is your directive?`,
                choices: [
                    { text: "Host Full Event ($8,000)", cost: 8000, flavor: "Hotel, flights, and dinners. Significantly boosts yield.", effect: "visit_weekend" },
                    { text: "Skip Event", cost: 0, flavor: "Saves money, but we may lose top talent to rivals.", effect: "none" }
                ]
            }, admChair.name);
            Game.setSpeed(0);
        }

        // DECISIONS
        if((this.data.month === 2 && this.data.day >= 15) || (this.data.month === 3 && this.data.day < 15)) this.processGradualDecisions();
        if(this.data.month === 3 && this.data.day === 15) this.processDecisionDay();
    },
    processRandomEvents: function() {
        if(Math.random() > 0.45) return; // 15% chance
        if(typeof RANDOM_EVENTS === 'undefined') return;
        
        const ev = RANDOM_EVENTS[Math.floor(Math.random() * RANDOM_EVENTS.length)];
        if(this.data.pendingEvent) return; // Don't overwrite existing events

        this.createInteractiveEmailEvent(ev, ev.sender);
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
        // A. Handle Cost
        if (choice.cost > 0) this.data.budget -= choice.cost;

        // B. Handle New Effects Object
        if (choice.effects) {
            if (choice.effects.budget) this.data.budget += choice.effects.budget;
            if (choice.effects.prestige) this.data.prestige += choice.effects.prestige;
            if (choice.effects.morale) this.modifyMorale(choice.effects.morale);
        }

        // C. Legacy Effects
        if(choice.effect === 'morale_hit') this.modifyMorale(-5);
        if(choice.effect === 'morale_boost') this.modifyMorale(5);
        if(choice.effect === 'donation_small') { this.data.budget += 10000; this.addEmail("Dean's Office", "Donation Received", "The alumni event was a success. +$10,000."); }
        if(choice.effect === 'visit_weekend') this.hostVisitWeekend();

        // D. Clear Event & Update Email to look like a Reply
        this.data.pendingEvent = null;
        const email = this.data.emails.find(e => e.body.includes('onclick="Game.resolveEvent')); 
        
        if(email) {
             let summary = "";
             if(choice.effects) {
                 if(choice.effects.budget !== 0) summary += `Budget: ${choice.effects.budget > 0 ? '+' : ''}$${choice.effects.budget} `;
                 if(choice.effects.morale !== 0) summary += `Morale: ${choice.effects.morale > 0 ? '+' : ''}${choice.effects.morale} `;
                 if(choice.effects.prestige !== 0) summary += `Prestige: ${choice.effects.prestige > 0 ? '+' : ''}${choice.effects.prestige} `;
             }

             // Try to find the faculty sender to generate a signature
             const senderName = email.sender;
             const senderFac = this.data.faculty.find(f => f.name === senderName);
             let signature = "";
             
             if(senderFac) {
                 signature = this.getProfSignature(senderFac);
             } else {
                 // Fallback for non-faculty senders (Facilities, Dean, etc.)
                 signature = `<div style="margin-top:20px; padding-top:10px; border-top:1px solid #ccc; color:#555; font-family:'Georgia', serif; font-size:0.9rem;"><strong>${senderName}</strong></div>`;
             }

             const playerName = this.data.playerName || "Chair";

             // Update the email body to look like a threaded reply/confirmation
             email.body = `
                <div style="background:#f9f9f9; padding:15px; border-bottom:1px solid #eee; color:#666; font-style:italic;">
                    <strong>Original Issue:</strong> ${event.title}<br>
                    ${event.desc}
                </div>
                <div style="padding:20px; background:#fff;">
                    Dear Dr. ${playerName},<br><br>
                    ${choice.flavor}<br><br>
                    <strong>Action Taken:</strong> ${choice.text}<br>
                    <span style="font-size:0.8rem; color:#999;">${summary}</span>
                    <br><br>
                    Best,<br>
                    ${signature}
                </div>`;
             
             // Mark as read/notification so it doesn't pause game again
             email.category = 'notification';
             
             if(typeof UI !== 'undefined') UI.openEmail(email.id);
        }
    },

    /* js/state.js */

    processResearchOutput: function() {
        this.data.faculty.forEach(f => {
            const myStudents = this.data.students.filter(s => s.advisorId === f.id);
            if(myStudents.length === 0) return;
            
            let totalBrains = 0; let totalHands = 0;
            myStudents.forEach(s => { totalBrains += s.stats.brains; totalHands += s.stats.hands; });
            
            // OLD FORMULA: Linear (10 students = 2x output of 5)
            // const power = totalBrains + totalHands;
            // if(Math.random() < (power / 42000)) ...

            // NEW FORMULA: Weighted by Size (10 students = ~2.5x output of 5)
            // We multiply raw stat power by the square root of the student count.
            // This simulates that larger teams have more synergy/resources.
            const power = (totalBrains + totalHands) * Math.sqrt(myStudents.length);
            
            // Lower divisor = More frequent papers overall
            if(Math.random() < (power / 25000)) { this.triggerDiscovery(f); }
        });
    },

    /* js/state.js */

    /* js/state.js */

    triggerDiscovery: function(prof) {
        // 1. Generate Title & Context
        const adj = RESEARCH_DB.ADJECTIVES[Math.floor(Math.random() * RESEARCH_DB.ADJECTIVES.length)];
        const method = RESEARCH_DB.METHODS[Math.floor(Math.random() * RESEARCH_DB.METHODS.length)];
        const target = RESEARCH_DB.TARGETS[Math.floor(Math.random() * RESEARCH_DB.TARGETS.length)];
        const app = RESEARCH_DB.APPLICATIONS[Math.floor(Math.random() * RESEARCH_DB.APPLICATIONS.length)];
        const title = `A ${adj} ${method} of ${target} for ${app}`;
        
        // 2. Journal Selection
        const journals = [
            { name: "Nature", base: 9.5, variance: 0.5, type: "high" },
            { name: "Science", base: 9.2, variance: 0.6, type: "high" },
            { name: "JACS", base: 6.2, variance: 0.8, type: "med" },
            { name: "Angewandte", base: 5.8, variance: 0.8, type: "med" },
            { name: "Chem. Sci.", base: 3.2, variance: 1.5, type: "low" },
            { name: "Tetrahedron", base: 1.0, variance: 1.2, type: "low" }
        ];
        
        const roll = (prof.hIndex / 3) + (Math.random() * 20); 
        let jObj = journals[5]; 
        if(roll > 40) jObj = journals[0];
        else if(roll > 35) jObj = journals[1];
        else if(roll > 25) jObj = journals[2];
        else if(roll > 20) jObj = journals[3];
        else if(roll > 10) jObj = journals[4];

        const realImpact = jObj.base + (Math.random() * jObj.variance);
        
        // 3. Authors
        const myStudents = this.data.students.filter(s => s.advisorId === prof.id);
        let authorString = `${prof.name}*`; 
        let firstAuthorName = "my postdoc"; 
        
        if (myStudents.length > 0) {
            const sortedStudents = [...myStudents].sort((a,b) => b.stats.hands - a.stats.hands);
            const firstAuthor = sortedStudents[0];
            firstAuthorName = firstAuthor.name.split(' ')[0]; 

            const fmt = (s) => {
                const parts = s.name.split(' ');
                if(s.name.includes('(G')) return `${parts[0].charAt(0)}. ${parts.slice(1).join(' ')}`;
                return `${parts[0].charAt(0)}. ${parts[1]} (G${s.year})`;
            };

            firstAuthor.pubs = (firstAuthor.pubs || 0) + 1;
            const potentialMiddle = myStudents.filter(s => s.id !== firstAuthor.id);
            let targetCount = Math.floor(Math.random() * 4) + 2; 
            targetCount = Math.min(targetCount, potentialMiddle.length);
            const middleAuthors = potentialMiddle.sort(() => 0.5 - Math.random()).slice(0, targetCount).map(s => fmt(s));
            let midStr = "";
            if (middleAuthors.length > 0) midStr = ", " + middleAuthors.join(", ");
            authorString = `${fmt(firstAuthor)}${midStr}, ${prof.name}*`;
        }

        // 4. Rewards
        prof.hIndex += Math.ceil(realImpact); 
        this.data.prestige += Math.ceil(realImpact / 2);
        if(prof.tenureTrack && prof.tenureTrack.active) prof.tenureTrack.stats.totalPubs++;

        // 5. Grant Supplement
        const supplementChance = Math.max(0.02, Math.min(0.40, realImpact * 0.04));
        let bonusHtml = "";
        
        if (Math.random() < supplementChance) {
            const variableCap = 80000 * (realImpact / 10);
            const bonusAmount = 20000 + Math.floor(Math.random() * variableCap);
            prof.funds += bonusAmount; 
            
            bonusHtml = `
            <div style="margin-top:15px; background:#e8f8f5; border:1px solid #2ecc71; padding:10px; color:#219150; font-size:0.9rem;">
                <strong>💰 Grant Extension Approved</strong><br>
                Citing the high impact of this work, the program officer has authorized a <strong>$${bonusAmount.toLocaleString()}</strong> supplement.
                <div style="font-size:0.75rem; margin-top:5px; color:#27ae60;">(<strong>Tax-Free:</strong> 100% deposited to Lab Reserves.)</div>
            </div>`;
        }

        // Save Record
        if(!this.data.publications) this.data.publications = [];
        this.data.publications.push({ title: title, journal: jObj.name, impact: realImpact, citations: 0, age: 0, author: prof.name, authorHIndex: prof.hIndex, year: this.data.year });

        // 6. Email Generation
        const chairName = this.data.playerName || "Chair";
        const TEMPLATES = {
            high: [
                `Dear Dr. ${chairName},<br><br>I am thrilled to share that <strong>${jObj.name}</strong> has accepted our latest manuscript without further revision. This is a career-defining moment for ${firstAuthorName}.`,
                `Dear Dr. ${chairName},<br><br>Big news. The editors at <strong>${jObj.name}</strong> just gave us the green light. We beat the scoop from the competing group at Caltech.`,
                `Dr. ${chairName},<br><br>I wanted you to be the first to know: <strong>${jObj.name}</strong> is publishing our work. This validates the risky direction we took two years ago.`
            ],
            med: [
                `Dear Dr. ${chairName},<br><br>Just forwarding the acceptance letter from <strong>${jObj.name}</strong>. It was a long review process, but we answered all queries.`,
                `Hi Dr. ${chairName},<br><br>Good news—our paper on ${method} was accepted in <strong>${jObj.name}</strong>. It's a consistent, high-quality output.`,
                `Dr. ${chairName},<br><br>We have another one in the bag. <strong>${jObj.name}</strong> accepted the manuscript on ${target}. It keeps the funding agencies happy.`
            ],
            low: [
                `Dear Dr. ${chairName},<br><br>We managed to find a home for the ${target} project in <strong>${jObj.name}</strong>. Better published than in a drawer.`,
                `Dr. ${chairName},<br><br>Just a heads up that the technical note on ${method} was accepted by <strong>${jObj.name}</strong>. We keep the momentum moving.`,
                `Hi Dr. ${chairName},<br><br>Accepted in <strong>${jObj.name}</strong>. It was an invited submission for a special issue. Low-hanging fruit, but good for the report.`
            ]
        };

        let type = realImpact > 9 ? "high" : (realImpact > 6 ? "med" : "low");
        let color = realImpact > 9 ? "#8e44ad" : (realImpact > 6 ? "#2980b9" : "#7f8c8d");
        const bodyContent = TEMPLATES[type][Math.floor(Math.random() * TEMPLATES[type].length)];

        // --- USE NEW SIGNATURE HELPER ---
        const signature = this.getProfSignature(prof);

        const fullBody = `
            <div style="border-left: 4px solid ${color}; padding-left: 10px; margin-bottom: 15px; background:#f9f9f9; padding:10px;">
                <div style="font-size:1.1rem; font-weight:bold; color:${color};">${jObj.name} Accepted</div>
                <div style="font-style:italic; margin-bottom:5px;">"${title}"</div>
                <div style="font-size:0.85rem; color:#666;">
                    <strong>Authors:</strong> ${authorString}<br>
                    <strong>Impact Factor:</strong> ${realImpact.toFixed(2)} / 10
                </div>
            </div>
            ${bodyContent}
            ${bonusHtml}
            ${signature}
        `;

        this.addEmail(prof.name, `Pub Accepted: ${jObj.name}`, fullBody, 'paper');
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

    /* js/state.js */

    recalcFacultyFinances: function(prof) {
        let weeklyBurn = this.COSTS.LAB_BASE;
        const myStudents = this.data.students.filter(s => s.advisorId === prof.id);
        const pol = this.data.policy; 
        
        // Counters
        let suppliesCost = 0;
        let raCost = 0;
        let raCount = 0;
        let taCount = 0;
        let fellowCount = 0;

        myStudents.forEach(s => {
            suppliesCost += this.COSTS.SUPPLIES_WEEKLY;
            weeklyBurn += this.COSTS.SUPPLIES_WEEKLY;
            
            if(s.funding === "RA") {
                const stip = (this.COSTS.RA_WEEKLY * pol.stipendMod);
                weeklyBurn += stip;
                raCost += stip;
                raCount++;
            } else if (s.funding === "TA") {
                taCount++;
            } else {
                fellowCount++;
            }
        });

        // Store monthly for the simulation
        prof.burnRate = weeklyBurn * 4.3; 
        
        // Store Weekly Breakdown string for the UI
        let parts = [];
        
        // --- UPDATED LABEL HERE ---
        parts.push(`Lab Maintenance & General Needs: $${this.COSTS.LAB_BASE}`);
        // --------------------------
        
        if(suppliesCost > 0) parts.push(`Chemicals & Supplies: $${suppliesCost} (${myStudents.length} students)`);
        
        if(raCost > 0) parts.push(`RA Stipends: $${raCost.toFixed(0)} (${raCount} students)`);
        
        if(taCount > 0) parts.push(`TA Support: ${taCount} (Paid by Dept)`);
        
        if(fellowCount > 0) parts.push(`Fellowships: ${fellowCount} (Free)`);
        
        prof.burnBreakdown = parts.join('\n');

        // Runway Calc
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

    setRecruitmentStrategy: function(target, strategyKey) { 
        // 1. Deduct Cost
        const cost = (strategyKey === 'aggressive') ? 7500 : (strategyKey === 'standard' ? 2000 : 0); 
        this.data.budget -= cost; 
        
        // 2. Set State
        this.data.admissions.targetSize = parseInt(target); 
        this.data.admissions.strategy = strategyKey; 
        this.data.admissions.setupComplete = true; 

        // 3. Identify Sender (Admissions Chair)
        const admChair = this.getCommitteeChair('admissions');
        const playerName = this.data.playerName || "Chair";
        const signature = this.getProfSignature(admChair);

        // 4. Draft Personalized Reply
        let confirmText = "";
        let subjectLine = "Recruitment Strategy Confirmed";

        if(strategyKey === 'aggressive') {
            confirmText = "I have instructed the committee to book travel for the major conferences and purchase premium ad space in C&E News. We are casting a wide net.";
        } else if(strategyKey === 'standard') {
            confirmText = "We will post to the standard job boards (Science/Nature Careers) and reach out to our colleague networks. This should give us a healthy applicant pool.";
        } else {
            confirmText = "We will proceed with a passive strategy, relying on our website and word-of-mouth. It saves money, though we may see fewer applicants.";
        }

        const body = `Dear Dr. ${playerName},<br><br>Understood. We have locked in a cohort target of <strong>${target} students</strong>.<br><br>${confirmText}<br><br>We will begin reviewing applications in December.<br><br>Best,<br>${signature}`;

        // 5. Send Email
        this.addEmail(admChair.name, `Re: ${subjectLine}`, body, "notification");
    },
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
    
    processDecisionDay: function() { 
        let count = 0; 
        this.data.admissions.pool.forEach(app => { 
            if(app.status === 'Offer Extended') { 
                this.resolveApplication(app, "Deadline Decision"); 
                if(app.status === "Accepted") count++; 
            } 
        }); 
        // Line deleted here.
        UI.renderAdmissions(this.data); 
    },
    /* js/state.js */

    // NEW: Centralized Math for Acceptance Probability
    /* js/state.js */

    /* js/state.js */

    calculateYieldChance: function(app) {
        // 1. BASE CHANCE (40%)
        let chance = 40; 

        // 2. POSITIVE MODIFIERS
        if (app.flownOut) chance += 15;      
        if (app.yieldBonus > 0) chance += 25;
        chance += (app.stats.fit / 5);       

        // 3. NEGATIVE MODIFIERS
        
        // A. SCHOOL TIER PENALTY
        if (app.background && app.background.tier === 1) chance -= 15; 
        if (app.background && app.background.tier === 2) chance -= 5;

        // B. BRAINS PENALTY (Scaled > 85)
        if (app.stats.brains > 85) {
            chance -= (app.stats.brains - 85); 
        }

        // C. STIPEND VARIANCE (The Fix)
        // We calculate the difference from 100% (1.0)
        const stipDiff = this.data.policy.stipendMod - 1.0;

        if (stipDiff < 0) {
            // PENALTY: Linear scaling (1.5x multiplier)
            // 99% pay (-0.01) -> -1.5% chance
            // 90% pay (-0.10) -> -15% chance
            // 70% pay (-0.30) -> -45% chance
            chance += (stipDiff * 150);
        } else if (stipDiff > 0) {
            // BONUS: Small reward for overpaying (0.5x multiplier)
            // 110% pay (+0.10) -> +5% chance
            chance += (stipDiff * 50);
        }

        // 4. CLAMP
        return Math.max(10, Math.min(95, Math.floor(chance)));
    },
    rejectCandidate: function(appId) { 
        const app = this.data.admissions.pool.find(a => a.id === appId); 
        if(app) {
            app.status = "Rejected";
            // FIX: Refresh the UI immediately
            if(typeof UI !== 'undefined') UI.renderAdmissions(this.data);
        }
    },

    resolveApplication: function(app, reason) { 
        const percentage = this.calculateYieldChance(app);
        
        // Roll the dice (0 to 100)
        const roll = Math.random() * 100;
        const accepted = roll < percentage; 
        
        app.status = accepted ? "Accepted" : "Declined"; 
        
        let subject = "";
        let body = "";

        if (accepted) {
            subject = `Acceptance: ${app.name}`;
            const excitement = percentage > 80 ? "thrilled" : "pleased";
            const why = app.application.hasFellowship ? "the generous fellowship offer" : "the research fit";
            body = `<p>Dear Chair,</p><p>I am <strong>${excitement}</strong> to accept your offer. The deciding factor was ${why}. I look forward to the Fall.</p><br><div style="background:#e8f8f5; border-left:4px solid #2ecc71; padding:10px;"><strong>Admin Note:</strong><br>Candidate confirmed.</div>`;
        } else {
            subject = `Declined: ${app.name}`;
            let rejectionReason = "Fit";
            let specificFeedback = "I have chosen another program.";

            if (this.data.policy.stipendMod < 1.0) {
                rejectionReason = "Financial";
                specificFeedback = "The stipend is not competitive compared to other offers.";
            } else if (app.stats.brains > 85 && this.data.prestige < 50) {
                rejectionReason = "Prestige";
                specificFeedback = "I accepted an offer from a higher-ranked institution (Ivy/Tier 1).";
            } else if (app.stats.fit < 50) {
                rejectionReason = "Research Fit";
                specificFeedback = "I didn't feel a strong scientific connection.";
            } else {
                rejectionReason = "Other Options";
                specificFeedback = "It was a difficult choice, but I found a better fit elsewhere.";
            }

            body = `<p>Dear Chair,</p><p>Thank you for the offer. I have decided to decline.</p><div style="background:#fdedec; border:1px solid #ebccd1; padding:10px; margin:10px 0;"><strong>Reason: ${rejectionReason}</strong><br><em>"${specificFeedback}"</em></div>`;
        }

        this.addEmail(app.name, subject, body, 'notification'); 
        
        // Morale Impacts for Lobbying
        if(app.lobbying) {
            const fac = this.data.faculty.find(f => f.id === app.lobbying.facultyId);
            if(fac) {
                if (app.lobbying.type === 'support' && app.status === 'Rejected') { 
                    fac.happiness -= 15;
                    this.addEmail(fac.name, "Disappointed", `I am very disappointed we let ${app.name} go.`, 'notification');
                }
            }
        }

        if(typeof UI !== 'undefined' && document.getElementById('screen-admissions')) UI.renderAdmissions(this.data); 
    },
    
    sweetenOffer: function(appId) { const app = this.data.admissions.pool.find(a => a.id === appId); if(!app || this.data.budget < 5000) return; this.data.budget -= 5000; app.yieldBonus += 25; app.facultyNote += " (Dean's Fellowship)"; this.addEmail("Admin", "Fellowship Approved", `authorized $5k fellowship for ${app.name}.`); if(typeof UI !== 'undefined') UI.renderAdmissions(this.data); },
    performInterview: function(appId, qId) { const app = this.data.admissions.pool.find(a => a.id === appId); if(!app || app.interview.points <= 0) return null; app.interview.points--; let qText = qId; let reveals = "fit"; if(typeof ADMISSIONS !== 'undefined') { const realQ = ADMISSIONS.QUESTIONS.find(q => q.id === qId); if(realQ) { qText = realQ.text; reveals = realQ.reveals; } } let answerKey = "med"; let statVal = 50; if(app.stats && app.stats[reveals] !== undefined) statVal = app.stats[reveals]; if(statVal > 70) answerKey = "high"; else if(statVal < 40) answerKey = "low"; let answerText = "Generic answer."; if(typeof ADMISSIONS !== 'undefined' && ADMISSIONS.ANSWERS[reveals] && ADMISSIONS.ANSWERS[reveals][answerKey]) { const options = ADMISSIONS.ANSWERS[reveals][answerKey]; answerText = options[Math.floor(Math.random() * options.length)]; } const entry = { question: qText, answer: answerText }; app.interview.log.push(entry); return entry; },
    /* js/state.js */

    /* js/state.js - Replace flyoutCandidate */

    flyoutCandidate: function(appId) { 
    const app = this.data.admissions.pool.find(a => a.id === appId); 
    if(!app || app.flownOut || app.flyoutPending) return; 

    if(this.data.budget < 500) {
        alert("Not enough budget ($500 needed).");
        return;
    }

    // Deduct cost now
    this.data.budget -= 500; 
    
    // Set Pending State
    app.flyoutPending = true;
    app.flyoutTimer = Math.floor(Math.random() * 4) + 2; // 2 to 5 weeks delay

    // Send Confirmation Email
    this.addEmail("Travel Office", `Flyout Scheduled: ${app.name}`, 
        `We have booked the flights for ${app.name}. (-$500)<br><br>
        Due to scheduling conflicts, they will visit the department in <strong>${app.flyoutTimer} weeks</strong>.<br>
        Their stats and interview feedback will populate after the visit is complete.`, "notification");

    // Refresh UI
    if(typeof UI !== 'undefined') UI.renderAdmissions(this.data);
    },
    /* js/state.js - Add this new function */

    processAdmissionsQueue: function() {
    if(!this.data.admissions.active) return;

    this.data.admissions.pool.forEach(app => {
        if(app.flyoutPending) {
            app.flyoutTimer--;
            
            // Timer hits 0: Visit Happens
            if(app.flyoutTimer <= 0) {
                app.flyoutPending = false;
                app.flownOut = true;     // Mark as visited
                app.statsVisible = true; // Reveal Stats
                app.yieldBonus += 10;
                app.facultyNote += " (Visited)";
                
                // Notify Player
                this.addEmail("Grad Admissions", `Visit Complete: ${app.name}`, 
                    `<strong>${app.name}</strong> has finished their campus visit.<br>
                    We have updated their file with their detailed stats and faculty impressions.<br>
                    <button class="btn-small" onclick="UI.toggleGameView(true); UI.navigate('admissions')">View Profile</button>`, "notification");
            }
        }
    });
    },
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
        this.data.emails.unshift({ 
            id: Date.now() + Math.random(), 
            date: `${this.data.month+1}/${this.data.day}`, 
            sender: sender, 
            subject: subject, 
            body: body, 
            read: false,
            category: category // <--- THE CRITICAL MISSING PIECE
        });
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
        
        this.data.facultySearch.shortlist = []; 
        this.data.facultySearch.pool = []; 

        // 1. Get Chair & Signature
        const searchChair = this.getCommitteeChair('search');
        const playerName = this.data.playerName || "Chair";
        const signature = this.getProfSignature(searchChair);

        // 2. Draft Email
        const body = `Dear Dr. ${playerName},<br><br>
        Per your authorization, I have officially posted the Tenure-Track ad in <em>Science Careers</em> and <em>Nature Jobs</em>.<br><br>
        We expect the first batch of CVs to arrive in October. I will filter them for the "Longlist" and present them to you then.<br><br>
        Best,<br>${signature}`;

        this.addEmail(searchChair.name, "Job Ad Posted", body, "notification");
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
            
            const fieldObj = FAC_DATA.fields[Math.floor(Math.random() * FAC_DATA.fields.length)];
            
            pool.push({
                id: Date.now() + i,
                name: ApplicantGenerator.generateName(false),
                pedigree: { phd: school, tier: tier, postdoc: postdocLab },
                stats: { research: Math.random()*100, teaching: Math.random()*100 },
                hIndex: Math.floor((5 - tier) * 3 + (Math.random() * 5)),
                startupAsk: Math.floor(baseStartup),
                field: fieldObj.name,
                labSize: sizes[Math.floor(Math.random() * sizes.length)],
                interviewLog: [], 
                status: "Applied"
            });
        }
        this.data.facultySearch.pool = pool;
        this.data.facultySearch.phase = "longlist";
        
        // 1. Get Chair & Signature
        const searchChair = this.getCommitteeChair('search');
        const playerName = this.data.playerName || "Chair";
        const signature = this.getProfSignature(searchChair);

        // 2. Draft Email
        const body = `Dear Dr. ${playerName},<br><br>
        The portal has closed. We have received <strong>${count} applications</strong> for the open position.<br><br>
        <strong>Task:</strong> Please review the pool and Shortlist 3-5 candidates for flyouts.<br>
        <strong>Deadline:</strong> November 1st.<br><br>
        <div style="background:#fff5f5; border:1px solid #feb2b2; padding:10px; font-size:0.85rem; color:#c0392b;">
            <strong>Warning:</strong> Any candidate not shortlisted by Nov 1 will be automatically rejected.
        </div>
        <br>Best,<br>${signature}`;

        this.addEmail(searchChair.name, "Applications Received", body, "search");
    },

    /* js/state.js */

    shortlistCandidate: function(id) {
        const c = this.data.facultySearch.pool.find(x => x.id === id);
        if(this.data.facultySearch.shortlist.length >= 3) { alert("You can only fly out 3 candidates."); return; }
        if(this.data.budget < 1500) { alert("Not enough budget for flyout."); return; }
        
        c.status = "Shortlist";
        this.data.facultySearch.shortlist.push(c);
        this.data.budget -= 1500;

        // 1. Get Chair & Signature
        const searchChair = this.getCommitteeChair('search');
        const playerName = this.data.playerName || "Chair";
        const signature = this.getProfSignature(searchChair);

        // 2. Draft Email
        const body = `Dear Dr. ${playerName},<br><br>
        Excellent choice. Dr. ${c.name} has a strong pedigree.<br><br>
        I have instructed the admin team to book their flights and hotel for a weekend visit. We will schedule their job talk for Friday afternoon.<br><br>
        Best,<br>${signature}`;
        
        this.addEmail(searchChair.name, `Flyout Booked: ${c.name}`, body, 'notification');
        
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

    /* js/state.js */

    /* js/state.js */

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
            const newProf = FacultyGenerator.generate("Assistant", c.field || "Physical"); 
            newProf.name = "Dr. " + c.name; // <--- NEW (Dr. John Smith)
            newProf.funds = offerAmount; 
            newProf.runway = "2.0 yrs";
            newProf.happiness = 100;
            
            newProf.tenureTrack = {
                active: true, year: 1, 
                stats: { totalPubs: 0, totalGrants: 0, studentsRecruited: 0, studentsGraduated: 0 },
                history: []
            };
            
            this.data.faculty.push(newProf);
            
            // 3. IMMEDIATE EMAILS (Hiring Confirmation)
            this.addEmail(c.name, "Offer Accepted", 
                `I am thrilled to accept. I will begin setting up my lab immediately.`);

            this.addEmail("Dean's Office", "New Faculty Hire Confirmed", 
                `Dr. ${newProf.name} has been added to the payroll. Start Date: Immediate.`);
            
            // 4. CLOSE SEARCH
            this.data.facultySearch.active = false;
            this.data.facultySearch.phase = "complete";
            this.data.facultySearch.pool = []; 

            // --- 5. SCHEDULE DELAYED LATE APPLICANTS (3 WEEKS) ---
            if(this.data.admissions.active) {
                // Calculate Target Date (Current + 21 Days)
                let tDay = this.data.day + 21;
                let tMonth = this.data.month;
                let tYear = this.data.year;
                
                // Handle Month Rollover
                if (tDay > 30) {
                    tDay -= 30;
                    tMonth++;
                    if(tMonth > 11) { tMonth = 0; tYear++; }
                }

                // Initialize array if missing
                if(!this.data.timedEvents) this.data.timedEvents = [];

                // Push Event
                this.data.timedEvents.push({
                    type: 'late_apps',
                    year: tYear, month: tMonth, day: tDay,
                    profId: newProf.id,
                    profName: newProf.name,
                    profField: newProf.field
                });
            }
            // ----------------------------------------------------

        } else {
            this.addEmail(c.name, "Offer Declined", `The startup package was insufficient.`);
            c.status = "Declined";
        }

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
        // ADD THIS LINE:
        this.data.admissions.strategyRequested = false; // <--- RESET THE TRIGGER
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

/* js/state.js */

/* PASTE THIS INTO js/state.js */

/* js/state.js */

const ApplicantGenerator = {
    firstNames: [ "James","Mary","John","Patricia","Robert","Jennifer","Michael","Linda","William","Elizabeth","David","Barbara","Richard","Susan","Joseph","Jessica","Thomas","Sarah","Charles","Karen","Christopher","Lisa","Daniel","Nancy","Matthew","Betty","Anthony","Margaret","Mark","Sandra","Steven","Ashley","Paul","Kimberly","Andrew","Emily","Joshua","Donna","Kenneth","Michelle","Kevin","Carol","Brian","Amanda","George","Melissa","Edward","Deborah","Ronald","Stephanie","Timothy","Rebecca","Jason","Laura","Jeffrey","Helen","Ryan","Sharon","Jacob","Cynthia","Wei","Li","Hao","Min","Jun","Ying","Lei","Jin","Xiang","Bo","Cheng","Dong","Fang","Gang","Sora","Haruto","Yuna","Kenji","Hiro","Akira","Yuki","Ren","Sakura","Hina","Kaito","Riku","Ji-woo","Min-jun","Seo-jun","Ha-eun","Do-yun","Ji-yoo","Si-woo","Su-ah","Joo-won","Ye-jun","Aarav","Priya","Vihaan","Ananya","Aditya","Diya","Arjun","Saanvi","Rohan","Ishaan","Sai","Aarya","Reyansh","Myra","Krishna","Zara","Ishita","Vivaan","Kavya","Dhruv","Lukas","Emma","Matteo","Sofia","Hugo","Camille","Lars","Anna","Dimitri","Elena","Gabriel","Alice","Leo","Chloé","Louis","Ines","Adam","Lena","Noah","Mia","Luca","Giulia","Alessandro","Martina","Lorenzo","Chiara","Leonardo","Aurora","Santiago","Mateo","Sebastian","Valentina","Matias","Isabella","Nicolas","Camila","Ivan","Maria","Maxim","Anastasia","Artem","Daria","Mikhail","Polina","Mohammed","Fatima","Ahmed","Aisha","Ali","Maryam","Omar","Layla","Youssef","Noor","Ibrahim","Zainab","Hassan","Salma","Hussein","Sara","Abdullah","Jana" ],
    lastNames: [ "Smith","Johnson","Williams","Brown","Jones","Garcia","Miller","Davis","Rodriguez","Martinez","Hernandez","Lopez","Gonzalez","Wilson","Anderson","Thomas","Taylor","Moore","Jackson","Martin","Lee","Perez","Thompson","White","Harris","Sanchez","Clark","Ramirez","Lewis","Robinson","Walker","Young","Allen","King","Wright","Scott","Torres","Nguyen","Hill","Flores","Wang","Li","Zhang","Liu","Chen","Yang","Huang","Zhao","Wu","Zhou","Xu","Sun","Ma","Zhu","Hu","Guo","He","Lin","Gao","Luo","Patel","Singh","Sharma","Kumar","Gupta","Rao","Shah","Mehta","Jain","Verma","Mishra","Reddy","Nair","Kapoor","Malhotra","Bhat","Saxena","Iyer","Chopra","Das","Sato","Suzuki","Takahashi","Tanaka","Watanabe","Ito","Yamamoto","Nakamura","Kobayashi","Kato","Kim","Park","Jeong","Choi","Kang","Yoon","Lim","Shin","Han","Oh","Müller","Schmidt","Schneider","Fischer","Weber","Meyer","Wagner","Becker","Schulz","Hoffmann","Dubois","Leroy","Moreau","Simon","Laurent","Lefebvre","Michel","Garcia","David","Bertrand","Rossi","Russo","Ferrari","Esposito","Bianchi","Romano","Colombo","Ricci","Marino","Greco","Ivanov","Smirnov","Kuznetsov","Popov","Vasiliev","Petrov","Sokolov","Mikhailov","Fedorov","Morozov","Ahmed","Ali","Mohamed","Youssef","Ibrahim","Mahmoud","Hassan","Hussein","Ismail","Khan" ],

    // --- NEW: School Database & Experience Types ---
    schools: [
        { name: "MIT", tier: 1 }, { name: "Stanford", tier: 1 }, { name: "Berkeley", tier: 1 }, { name: "CalTech", tier: 1 }, { name: "Harvard", tier: 1 },
        { name: "U. Michigan", tier: 2 }, { name: "Georgia Tech", tier: 2 }, { name: "UIUC", tier: 2 }, { name: "UT Austin", tier: 2 }, { name: "UNC Chapel Hill", tier: 2 },
        { name: "State Univ", tier: 3 }, { name: "City College", tier: 3 }, { name: "Regional Tech", tier: 3 }, { name: "Liberal Arts Coll.", tier: 3 }
    ],

    expTypes: ["REU Program", "Senior Thesis", "Industry Intern", "Lab Tech", "Summer Research"],
    // -----------------------------------------------

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
            
            // 1. Core Stats
            const brains = Math.min(100, Math.floor(Math.random() * (100-baseStat)) + baseStat);
            let gpa = 2.8 + (brains / 100) + ((Math.random() * 0.4) - 0.1);
            gpa = Math.max(2.7, Math.min(4.0, gpa));
            let recScore = Math.floor((brains/10) - 2 + (Math.random()*4));
            recScore = Math.max(1, Math.min(10, recScore));

            const hasFellowship = isInternational ? false : (Math.random() < 0.08); 
            
            // 2. NEW: Background Generation
            const school = this.schools[Math.floor(Math.random() * this.schools.length)];
            
            // Experience: 30% chance of 0 experience. 70% chance of 3-36 months.
            let monthsExp = 0;
            let prevRole = "None";
            if(Math.random() > 0.3) {
                monthsExp = 3 + Math.floor(Math.random() * 33);
                prevRole = this.expTypes[Math.floor(Math.random() * this.expTypes.length)];
            }
            
            // SOP: Base is random, boosted by brains/experience
            let sopScore = Math.floor(Math.random() * 60) + 20; // Base 20-80
            if(brains > 80) sopScore += 10;
            if(monthsExp > 12) sopScore += 10;
            sopScore = Math.min(100, sopScore);

            // 3. Match Logic
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
                
                // NEW: Background Object
                background: {
                    school: school.name,
                    tier: school.tier,
                    monthsExp: monthsExp,
                    prevRole: prevRole,
                    sopScore: sopScore
                },

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
    
    getFuzzyStat: function(val) { 
        return val >= 85 ? "Exceptional" : (val >= 70 ? "Strong" : (val >= 50 ? "Average" : "Weak")); 
    }
};

/* js/state.js */

const StudentGenerator = {
    generate: function(advisorId, advisorName) {
        const year = Math.floor(Math.random() * 6) + 1; // Years 1-6
        const name = ApplicantGenerator.generateName(false);
        
        // 1. Funding Logic
        let funding = "TA";
        if(Math.random() < 0.05) { funding = "Fellowship"; } 
        else { 
            const raChance = (year - 1) * 0.25; 
            if(Math.random() < raChance) { funding = "RA"; } 
            else { funding = "TA"; } 
        }

        // 2. Generate Stats (Using new logic logic)
        // Students who survived to Year 4+ usually have better stats
        const survivalBonus = year > 2 ? 10 : 0;
        const brains = Math.min(100, Math.floor(Math.random() * 70) + 20 + survivalBonus);
        
        // 3. Generate Background (So they match the new Applicant system)
        // We use the ApplicantGenerator's database so the world is consistent
        const schoolList = ApplicantGenerator.schools || [ { name: "State Univ", tier: 3 } ];
        const school = schoolList[Math.floor(Math.random() * schoolList.length)];
        
        const expTypes = ApplicantGenerator.expTypes || ["Research Assistant"];
        const prevRole = expTypes[Math.floor(Math.random() * expTypes.length)];
        const monthsExp = 3 + Math.floor(Math.random() * 24);

        return { 
            id: Date.now() + Math.random(), 
            name: `${name} (G${year})`, 
            year: year, 
            advisorId: advisorId, 
            funding: funding,
            
            // Stats
            pubs: year === 1 ? 0 : Math.floor((year - 1) * (0.3 + Math.random() * 1.5)), 
            stats: { 
                brains: brains, 
                hands: Math.floor(Math.random()*100), 
                grit: Math.floor(Math.random()*100),
                ambition: Math.floor(Math.random()*100),
                fit: Math.floor(Math.random()*100)
            },

            // NEW: Background Data for Starting Students
            background: {
                school: school.name,
                tier: school.tier,
                monthsExp: monthsExp,
                prevRole: prevRole,
                sopScore: Math.floor(Math.random() * 40) + 50 // Existing students generally had decent SOPs to get in
            }
        };
    },
    
    // Helper to determine how many students a prof starts with
    getCountForRank: function(rank) { 
        return rank === "Adjunct" ? 0 : 5 + Math.floor(Math.random() * 6); 
    }
};

/* js/state.js */

/* js/state.js */

/* js/state.js */

/* js/state.js */

const FacultyGenerator = {
    // UPDATED: Now accepts 'forcedYearsIn' to manually set tenure progress
    generate: function(rank, field, forcedYearsIn = null) {
        
        // 1. Setup Basics
        const salary = (typeof FINANCE !== 'undefined' && FINANCE.SALARIES) ? (FINANCE.SALARIES[rank] || 85000) : 85000;
        const agencies = ["NSF", "NIH", "DOE", "DOD"];
        const fullName = ApplicantGenerator.generateName(false);
        
        let age = 30 + Math.floor(Math.random() * 5);
        let hIndex = 4 + Math.floor(Math.random() * 8);
        
        // Randomize reserves
        let funds = 50000 + Math.floor(Math.random() * 200000); 
        
        if (rank === "Associate") { age += 7; hIndex += 15; funds += 150000; }
        if (rank === "Full") { age += 15; hIndex += 25; funds += 300000; }

        const grants = [];
        let tenureTrack = null;
        let yearsIn = 0;

        // --- ASSISTANT PROFESSOR LOGIC ---
        if (rank === "Assistant") {
            // LOGIC CHANGE: Use forced year if provided, otherwise random
            if (forcedYearsIn !== null) {
                yearsIn = forcedYearsIn;
            } else {
                yearsIn = Math.floor(Math.random() * 5); 
            }
            
            let currentYear = 1;
            if (typeof State !== 'undefined' && State.data && State.data.year) {
                currentYear = State.data.year;
            }

            // Backfill Stats
            // BUFFED: Increased multiplier slightly to ensure they have history
            const pastPubs = Math.floor(yearsIn * (2.0 + Math.random())); 
            const pastGrants = Math.floor(yearsIn * 0.4); 
            
            hIndex += pastPubs; 

            tenureTrack = {
                active: true,
                year: yearsIn + 1, 
                startYear: currentYear - yearsIn,
                clock: 7,
                nextReview: currentYear + (7 - yearsIn),
                stats: {
                    totalPubs: pastPubs,
                    totalGrants: pastGrants,
                    studentsGraduated: 0 
                },
                history: [] 
            };

            // Starter Grant
            if (yearsIn > 1 || Math.random() > 0.6) {
                const totalAmount = 450000;
                grants.push({
                    name: "NSF Standard Grant",
                    source: "NSF",
                    amount: totalAmount, 
                    remaining: 200000 + Math.floor(Math.random() * 150000),
                    duration: 3,
                    yearAwarded: currentYear - 1
                });
            }
            
            if (yearsIn === 0) funds += 300000; 
            else funds += 50000;

        } else {
            // --- SENIOR FACULTY LOGIC ---
            let grantCount = 0;
            if (rank === "Full") grantCount = Math.floor(Math.random() * 3) + 2; 
            if (rank === "Associate") grantCount = Math.floor(Math.random() * 2) + 1;

            for(let i=0; i<grantCount; i++) {
                const agency = agencies[Math.floor(Math.random()*agencies.length)];
                const totalAmount = 300000 + Math.floor(Math.random() * 500000);
                
                grants.push({ 
                    name: `${agency} Grant`, 
                    source: agency,
                    amount: totalAmount, 
                    remaining: Math.floor(totalAmount * (0.2 + Math.random() * 0.6)) 
                });
            }
        }

        return {
            id: Date.now() + Math.random(),
            name: `Dr. ${fullName}`,
            rank: rank, 
            rankLabel: rank, 
            field: field, 
            tenured: (rank === "Full" || rank === "Associate"),
            salary: salary, 
            age: age, 
            hIndex: hIndex,
            students: [], 
            grants: grants, 
            pendingApps: [], 
            funds: funds, 
            burnRate: 0, 
            burnBreakdown: "", 
            fundingSourceLabel: "Grants", 
            runway: "Inf",
            happiness: 80,
            tenureTrack: tenureTrack
        };
    },
    /* js/state.js */

    /* js/state.js */

    /* js/state.js */

    /* js/state.js */

    /* js/state.js */

    /* js/state.js */

    recalcFacultyFinances: function(prof) {
        let weeklyBurn = this.COSTS.LAB_BASE;
        const myStudents = this.data.students.filter(s => s.advisorId === prof.id);
        const pol = this.data.policy; 
        
        let suppliesCost = 0;
        let raCost = 0;
        let raCount = 0;
        let taCount = 0;
        let fellowCount = 0;

        myStudents.forEach(s => {
            // --- STABLE RANDOMIZATION ---
            // We use the student ID + Current Day as a seed. 
            // This ensures the cost is fixed for the day (no flickering) but changes over time.
            const seed = (s.id || 0) + (this.data.day * 100) + (this.data.year * 1000);
            const pseudoRand = Math.abs(Math.sin(seed) * 10000) % 1; // 0.0 to 1.0
            
            // Range: $350 to $750 (Average $550)
            const chemCost = 350 + Math.floor(pseudoRand * 401);

            suppliesCost += chemCost;
            weeklyBurn += chemCost;
            
            if(s.funding === "RA") {
                const stip = (this.COSTS.RA_WEEKLY * pol.stipendMod);
                weeklyBurn += stip;
                raCost += stip;
                raCount++;
            } else if (s.funding === "TA") {
                taCount++;
            } else {
                fellowCount++;
            }
        });

        // Store monthly burn
        prof.burnRate = weeklyBurn * 4.3; 
        
        // Build the Display String
        let parts = [];
        parts.push(`Lab Maintenance: $${this.COSTS.LAB_BASE}`);
        
        if(suppliesCost > 0) {
            // Calculate average for the display
            const avg = Math.round(suppliesCost / myStudents.length);
            parts.push(`Chemicals & Supplies: $${suppliesCost} (Avg $${avg}/student)`);
        }
        
        if(raCost > 0) parts.push(`RA Stipends: $${raCost.toFixed(0)} (${raCount} students)`);
        if(taCount > 0) parts.push(`TA Support: ${taCount} (Paid by Dept)`);
        if(fellowCount > 0) parts.push(`Fellowships: ${fellowCount} (Free)`);
        
        prof.burnBreakdown = parts.join('\n');

        // Update Reserves & Runway
        const totalFunds = prof.grants.reduce((sum, g) => sum + g.remaining, 0);
        prof.funds = totalFunds;
        
        if(weeklyBurn > 0) {
            const weeksLeft = totalFunds / weeklyBurn;
            if(weeksLeft > 104) prof.runway = "> 2 yrs";
            else prof.runway = (weeksLeft / 4.3).toFixed(1) + " mo";
        } else { prof.runway = "Stable"; }
    },
};