/* js/data.js */

const CONSTANTS = {
    STARTING_BUDGET: 350000, // Boosted starting cash buffer
    STARTING_PRESTIGE: 10,
    MONTHS: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
    DAYS_IN_MONTH: [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31],
    DAYS_OF_WEEK: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
};

const SCREEN_IDS = ['office', 'calendar', 'faculty', 'finance'];

// ECONOMIC CONSTANTS (REBALANCED)
const FINANCE = {
    // 1. INCOME
    WEEKLY_BLOCK_GRANT: 12000,   // Was 5,000. Now covers ~80% of payroll.
    TUITION_PER_STUDENT: 2000,   // Was 1,500. Better revenue share.
    IDC_RATE: 0.25,              // Was 0.20. You keep more overhead.
    
    // 2. EXPENSES
    TA_COST: 600,                // Was 800. ($31k/yr stipend is more realistic)
    FACULTY_SALARY_DIVISOR: 52,  
    LAB_UPKEEP_BASE: 200,        // Was 500. Base cost to keep lights on is lower.
    
    // 3. VISUALS
    COLORS: {
        income: "#27ae60",
        expense: "#c0392b",
        balance: "#2980b9",
        projection: "#8e44ad",
        warning: "#f39c12"
    }
};

const INSTITUTION_TYPES = {
    "community": { label: "Community College", desc: "Tight budget. Survival mode.", budget: 75000, prestige: 5, facultyCount: [5, 8] },
    "state": { label: "State University", desc: "Standard experience.", budget: 350000, prestige: 25, facultyCount: [8, 12] },
    "ivy": { label: "Private Ivy", desc: "Massive budget, huge egos.", budget: 1500000, prestige: 80, facultyCount: [12, 18] }
};

const DISCIPLINES = {
    "chemistry": { label: "Chemistry", defaultName: "Dept. of Chemistry", flavor: "Lab equipment is expensive. Don't blow anything up." }
};

const FAC_DATA = {
    names: {
        first: ["James", "Mary", "Robert", "Patricia", "John", "Jennifer", "Michael", "Linda", "David", "Elizabeth", "William", "Barbara", "Richard", "Susan", "Joseph", "Jessica", "Thomas", "Sarah", "Charles", "Karen", "Christopher", "Nancy", "Daniel", "Lisa", "Kevin", "Laura", "Jason", "Kelly"],
        last: ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "White", "Harris"]
    },
    fields: [
        { id: "org", name: "Organic", equipment: ["Fume Hood", "NMR Spectrometer", "Rotavap"], typeBias: "wet" },
        { id: "inorg", name: "Inorganic", equipment: ["Glovebox", "X-Ray Diffractometer", "Furnace"], typeBias: "wet" },
        { id: "phys", name: "Physical", equipment: ["Laser Table", "Supercomputer Cluster", "Vacuum Chamber"], typeBias: "mix" },
        { id: "bio", name: "Biochem", equipment: ["Centrifuge", "Freezer Farm", "Microscope"], typeBias: "wet" },
        { id: "anal", name: "Analytical", equipment: ["Mass Spec", "Chromatograph", "Sensors"], typeBias: "mix" },
        { id: "comp", name: "Computational", equipment: ["Server Rack", "Workstations", "GPU Cluster"], typeBias: "dry" }
    ],
    ranks: [
        { id: "adjunct", label: "Adjunct Lecturer", tenure: false, baseH: 2, baseSal: 24000, ageMin: 26, ageMax: 65 },
        { id: "assistant", label: "Assistant Professor", tenure: false, baseH: 8, baseSal: 85000, ageMin: 29, ageMax: 38 },
        { id: "associate", label: "Associate Professor", tenure: true, baseH: 18, baseSal: 105000, ageMin: 36, ageMax: 55 },
        { id: "full", label: "Full Professor", tenure: true, baseH: 35, baseSal: 155000, ageMin: 45, ageMax: 75 }
    ],
    titles: ["Synthesis of {{compound}}", "Analysis of {{compound}}", "Review of {{compound}} derivatives", "Novel methods in {{field}}", "Mechanisms of {{compound}}"],
    compounds: ["Carbon Nanotubes", "Peptides", "Heavy Metals", "Polymers", "Catalysts", "Enzymes", "Graphene"],
    rmpTags: [
        { text: "Easy A", type: "good" }, { text: "Tough Grader", type: "risk" }, { text: "Inspirational", type: "good" },
        { text: "Monotone", type: "neutral" }, { text: "Impossible Exams", type: "risk" }, { text: "Hilarious", type: "good" },
        { text: "Ghost", type: "risk" }, { text: "Late Grader", type: "neutral" }
    ],
    grantSources: [
        { name: "NSF Career", amount: 500000, duration: 60 }, 
        { name: "NIH R01", amount: 1200000, duration: 48 },   
        { name: "DOE Seed", amount: 150000, duration: 24 },
        { name: "Industry Partner", amount: 75000, duration: 12 },
        { name: "Private Foundation", amount: 250000, duration: 36 }
    ],
    labTypes: [
        { id: "wet", label: "Experimental (Wet)", costPerMonth: 2000 },
        { id: "dry", label: "Computational (Dry)", costPerMonth: 500 },
        { id: "mix", label: "Hybrid (Wet/Dry)", costPerMonth: 1200 }
    ],
    studentTraits: [
        { name: "Golden Hands", effect: "High Output", type: "good" },
        { name: "Theory Wiz", effect: "High Writing", type: "good" },
        { name: "Night Owl", effect: "Workaholic", type: "good" },
        { name: "Butterfingers", effect: "Breaks Equipment", type: "bad" },
        { name: "Burned Out", effect: "Low Output", type: "bad" },
        { name: "Ghost", effect: "Never in Lab", type: "bad" }
    ]
};

const EMAILS_DB = {
    welcome: {
        sender: "Dean Halloway",
        subject: "ACTION REQUIRED: Department Onboarding",
        body: (schoolName) => `
            <p>Dear Chair,</p>
            <p>Welcome to <strong>${schoolName}</strong>.</p>
            <p>I have increased your block grant to cover basic payroll, but you are still reliant on Tuition drops in September and January to stay afloat.</p>
            <p>Do not lose students. Do not lose grants. Good luck.</p>
            <br><p>Regards,<br>Dean Halloway</p>
        `
    }
};