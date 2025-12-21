/* js/state.js */

const State = {
    data: {
        schoolName: "", type: "", discipline: "",
        budget: 0, prestige: 0,
        day: 1, month: 7, year: 2025,
        faculty: [], students: [], emails: [],
        
        finance: {
            undergradCount: 350, // Boosted enrollment for tuition revenue
            weeklyLog: [], 
            history: [], 
            lastWeekSummary: { income: 0, expenses: 0, net: 0, details: {} }
        }
    },

    initNewGame: function(name, typeKey, discKey) {
        const config = INSTITUTION_TYPES[typeKey];
        this.data.schoolName = name;
        this.data.type = typeKey;
        this.data.discipline = discKey;
        this.data.budget = config.budget;
        this.data.prestige = config.prestige;
        this.data.year = 2025; this.data.month = 7; this.data.day = 1;
        
        this.data.emails = [{
            id: 1, sender: EMAILS_DB.welcome.sender, subject: EMAILS_DB.welcome.subject,
            date: "Aug 1", body: EMAILS_DB.welcome.body(name), read: false
        }];

        const min = config.facultyCount[0];
        const max = config.facultyCount[1];
        const count = Math.floor(Math.random() * (max - min + 1)) + min;
        
        const result = FacultyGenerator.generateRoster(count);
        this.data.faculty = result.faculty;
        this.data.students = result.students;
        
        this.data.finance.history.push({ 
            week: 0, balance: this.data.budget, net: 0 
        });

        console.log(`State Initialized: ${count} faculty.`);
    },

    advanceDay: function() {
        this.data.day++;
        if (this.data.day > CONSTANTS.DAYS_IN_MONTH[this.data.month]) {
            this.data.day = 1; 
            this.data.month++;
            if (this.data.month === 8 || this.data.month === 0) {
                FinanceSystem.processTuition(this.data);
            }
            if (this.data.month > 11) { this.data.month = 0; this.data.year++; }
        }
        if (this.data.day % 7 === 0) {
            FinanceSystem.processWeek(this.data);
        }
    },

    saveGame: function() {
        const json = JSON.stringify(this.data, null, 2);
        const blob = new Blob([json], {type: "application/json"});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `save_${this.data.schoolName.replace(/\s+/g, '_')}_${Date.now()}.json`;
        document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    },

    loadGame: function(inputElement) {
        const file = inputElement.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function(e) {
            try { State.data = JSON.parse(e.target.result); Game.launchLoadedGame(); }
            catch (err) { alert("Corrupt save file."); console.error(err); }
        };
        reader.readAsText(file);
    }
};

const FinanceSystem = {
    processWeek: function(data) {
        // 1. EXPENSES
        let totalSalaries = 0;
        data.faculty.forEach(p => totalSalaries += Math.round(p.salary / FINANCE.FACULTY_SALARY_DIVISOR));
        
        let taCost = 0;
        data.students.forEach(s => { if (s.funding === "TA") taCost += FINANCE.TA_COST; });
        
        const upkeep = data.faculty.length * FINANCE.LAB_UPKEEP_BASE;
        const totalExpenses = totalSalaries + taCost + upkeep;

        // 2. INCOME & GRANT DECAY
        const blockGrant = FINANCE.WEEKLY_BLOCK_GRANT;
        let totalGrantBurn = 0;
        
        data.faculty.forEach(prof => {
            const weeklyBurn = Math.round(prof.burnRate / 4);
            if (prof.funds >= weeklyBurn) {
                prof.funds -= weeklyBurn;
                if (prof.grants.length > 0) {
                    totalGrantBurn += weeklyBurn; 
                    prof.grants[0].remaining -= weeklyBurn;
                    if(prof.grants[0].remaining <= 0) {
                        prof.grants.shift();
                        if(prof.grants.length === 0) prof.fundingSourceLabel = "Dept. Reserves";
                        else if(prof.grants.length === 1) prof.fundingSourceLabel = prof.grants[0].name;
                    }
                }
            } else {
                prof.funds = 0; 
            }
            prof.runway = prof.burnRate > 0 ? (prof.funds / prof.burnRate).toFixed(1) : "Inf";
        });

        const idcIncome = Math.round(totalGrantBurn * FINANCE.IDC_RATE);
        const totalIncome = blockGrant + idcIncome;

        // 3. APPLY
        const net = totalIncome - totalExpenses;
        data.budget += net;

        // 4. LOG & HISTORY
        data.finance.lastWeekSummary = { 
            income: totalIncome, 
            expenses: totalExpenses, 
            net: net,
            details: { salaries: totalSalaries, ta: taCost, upkeep: upkeep, idc: idcIncome, block: blockGrant }
        };

        data.finance.weeklyLog.unshift({
            date: `${CONSTANTS.MONTHS[data.month]} ${data.day}`,
            net: net,
            details: `Exp: $${totalExpenses.toLocaleString()} | Inc: $${totalIncome.toLocaleString()}`
        });
        if (data.finance.weeklyLog.length > 20) data.finance.weeklyLog.pop();

        data.finance.history.push({ 
            week: data.finance.history.length, 
            balance: data.budget, 
            net: net 
        });
        if (data.finance.history.length > 52) data.finance.history.shift();
    },

    processTuition: function(data) {
        const amount = data.finance.undergradCount * FINANCE.TUITION_PER_STUDENT;
        data.budget += amount;
        data.finance.weeklyLog.unshift({
            date: `${CONSTANTS.MONTHS[data.month]} ${data.day}`,
            net: amount,
            details: `SEASONAL: Tuition ($${amount.toLocaleString()})`
        });
        data.emails.unshift({
            id: Date.now(), sender: "Bursar", subject: "Tuition Disbursement",
            date: `${CONSTANTS.MONTHS[data.month]} ${data.day}`,
            body: `Deposited $${amount.toLocaleString()} for enrollment.`, read: false
        });
    },

    getProjection: function(data) {
        const projection = [];
        let simBalance = data.budget;
        let simFaculty = JSON.parse(JSON.stringify(data.faculty.map(f => ({
            burnRate: f.burnRate,
            funds: f.funds,
            grants: f.grants
        }))));

        for(let w=1; w<=52; w++) {
            if (w === 1 || w === 20) simBalance += (data.finance.undergradCount * FINANCE.TUITION_PER_STUDENT);
            const weeklyExp = data.finance.lastWeekSummary.expenses || 5000;
            let simIDC = 0;
            
            simFaculty.forEach(p => {
                const burn = Math.round(p.burnRate / 4);
                if (p.funds >= burn) {
                    p.funds -= burn;
                    if(p.grants.length > 0) { 
                        p.grants[0].remaining -= burn;
                        if(p.grants[0].remaining <= 0) p.grants.shift();
                        simIDC += Math.round(burn * FINANCE.IDC_RATE); 
                    }
                }
            });

            const weeklyNet = (FINANCE.WEEKLY_BLOCK_GRANT + simIDC) - weeklyExp;
            simBalance += weeklyNet;
            projection.push(simBalance);
        }
        return projection;
    },
    
    getFiscalStatus: function(data) {
        const last = data.finance.lastWeekSummary;
        if(!last) return { net: 0, status: "Unknown" };
        const weeklyNetAnnualized = last.net * 52;
        const tuitionAnnual = data.finance.undergradCount * FINANCE.TUITION_PER_STUDENT * 2;
        const projectedAnnualNet = weeklyNetAnnualized + tuitionAnnual;
        return {
            net: projectedAnnualNet,
            status: projectedAnnualNet >= 0 ? "Surplus" : "Deficit"
        };
    }
};

const StudentGenerator = {
    generateLabGroup: function(advisorId, count) {
        const group = [];
        for(let i=0; i<count; i++) group.push(this.createStudent(advisorId));
        return group;
    },
    createStudent: function(advisorId) {
        const fname = FAC_DATA.names.first[Math.floor(Math.random() * FAC_DATA.names.first.length)];
        const lname = FAC_DATA.names.last[Math.floor(Math.random() * FAC_DATA.names.last.length)];
        const rand = Math.random();
        let year = rand > 0.3 ? (rand > 0.7 ? (rand > 0.9 ? 5 : 4) : 3) : 1; 
        if(rand > 0.95) year = 6;
        const funding = Math.random() > 0.4 ? "RA" : "TA";
        const trait = FAC_DATA.studentTraits[Math.floor(Math.random() * FAC_DATA.studentTraits.length)];
        return {
            id: Date.now() + Math.floor(Math.random()*100000),
            name: `${fname} ${lname}`, advisorId: advisorId, year: year, funding: funding,
            stats: { hands: Math.floor(Math.random()*100), brains: Math.floor(Math.random()*100), grit: Math.floor(Math.random()*100), stress: Math.floor(Math.random()*20) },
            trait: trait
        };
    }
};

const FacultyGenerator = {
    generateRoster: function(count) {
        const faculty = [];
        let allStudents = [];
        for(let i=0; i<count; i++) {
            const prof = this.createOne(i);
            if (prof.targetStudentCount > 0) {
                const students = StudentGenerator.generateLabGroup(prof.id, prof.targetStudentCount);
                prof.students = students.map(s => s.id); 
                allStudents = allStudents.concat(students);
            }
            const studentCost = prof.students.length * 3000; 
            if(prof.rank !== 'adjunct') {
                prof.burnRate = prof.baseLabCost + studentCost;
                prof.runway = prof.burnRate > 0 ? (prof.funds / prof.burnRate).toFixed(1) : "Inf";
            }
            faculty.push(prof);
        }
        return { faculty: faculty, students: allStudents };
    },
    createOne: function(id) {
        const rand = Math.random();
        let rankKey = rand < 0.1 ? 'adjunct' : (rand < 0.4 ? 'assistant' : (rand < 0.75 ? 'associate' : 'full'));
        const rank = FAC_DATA.ranks.find(r => r.id === rankKey);
        const age = Math.floor(Math.random() * (rank.ageMax - rank.ageMin + 1)) + rank.ageMin;
        const field = FAC_DATA.fields[Math.floor(Math.random() * FAC_DATA.fields.length)];
        const fname = FAC_DATA.names.first[Math.floor(Math.random() * FAC_DATA.names.first.length)];
        const lname = FAC_DATA.names.last[Math.floor(Math.random() * FAC_DATA.names.last.length)];
        
        let labTypeKey = field.typeBias;
        if(Math.random() > 0.8) labTypeKey = 'mix'; 
        if (rankKey === 'adjunct') labTypeKey = 'dry'; 
        const labType = FAC_DATA.labTypes.find(l => l.id === labTypeKey);

        let gradCount = 0;
        if (rankKey === 'assistant') gradCount = Math.floor(Math.random() * 3) + 1; 
        if (rankKey === 'associate') gradCount = Math.floor(Math.random() * 5) + 2; 
        if (rankKey === 'full') gradCount = Math.floor(Math.random() * 8) + 4;      

        let baseCash = 0;
        let fundingLabel = "None";
        if (rankKey === 'assistant') { baseCash = 300000 + (Math.random() * 500000); fundingLabel = "Startup Package"; } 
        else if (rankKey !== 'adjunct') { baseCash = 50000 + (Math.random() * 250000); fundingLabel = "Dept. Reserves"; }

        const grants = [];
        let numGrants = 0;
        if (rankKey === 'assistant') numGrants = Math.random() > 0.6 ? 1 : 0;
        else if (rankKey === 'associate') numGrants = Math.random() > 0.1 ? (Math.floor(Math.random() * 2) + 1) : 0;
        else if (rankKey === 'full') numGrants = Math.random() > 0.05 ? (Math.floor(Math.random() * 3) + 1) : 0;

        let totalGrantCash = 0;
        for(let g=0; g<numGrants; g++) {
            const source = FAC_DATA.grantSources[Math.floor(Math.random() * FAC_DATA.grantSources.length)];
            const remaining = Math.floor(source.amount * (Math.random() * 0.8 + 0.1));
            totalGrantCash += remaining;
            grants.push({ name: source.name, total: source.amount, remaining: remaining, endsInMonths: Math.floor(Math.random() * source.duration) + 6 });
        }
        const totalFunds = baseCash + totalGrantCash;
        if (grants.length > 0) fundingLabel = grants.length === 1 ? grants[0].name : "Multiple Grants";

        return {
            id: id, name: `${fname} ${lname}`, age: age, rank: rankKey, rankLabel: rank.label, field: field.name,
            salary: rank.baseSal + (Math.floor(Math.random() * 15) * 1000), tenured: rank.tenure,
            hIndex: Math.max(1, rank.baseH + Math.floor((Math.random() * 10) - 3)),
            citations: Math.max(0, (rank.baseH * 15) + Math.floor(Math.random() * 100)),
            teachScore: (2.5 + (Math.random() * 2.5)).toFixed(1),
            rmpTag: FAC_DATA.rmpTags[Math.floor(Math.random() * FAC_DATA.rmpTags.length)],
            recentPaper: "Analysis of " + FAC_DATA.compounds[Math.floor(Math.random()*FAC_DATA.compounds.length)],
            equipment: field.equipment[Math.floor(Math.random() * field.equipment.length)],
            labType: labType.label, baseLabCost: labType.costPerMonth, targetStudentCount: gradCount,
            students: [], burnRate: 0, funds: totalFunds, fundingSourceLabel: fundingLabel, runway: 0,
            grants: grants, grantRisk: (Math.random()).toFixed(2), burnout: Math.floor(Math.random() * 20), ego: 20
        };
    }
};