/* js/data.js */

const CONSTANTS = {
    MONTHS: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
    DAYS_IN_MONTH: [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31],
    DAYS_OF_WEEK: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
};

const FINANCE = {
    SALARIES: { "Adjunct": 45000, "Assistant": 85000, "Associate": 115000, "Full": 165000 },
    INCOME: { WEEKLY_BLOCK: 22000, SEMESTER_TUITION: 150000 },
    COLORS: { income: "#27ae60", expense: "#c0392b", neutral: "#7f8c8d" }
};

const FAC_DATA = {
    fields: [
        { name: "Organic", difficulty: 1.0 }, { name: "Inorganic", difficulty: 1.1 },
        { name: "Physical", difficulty: 1.2 }, { name: "Analytical", difficulty: 0.9 },
        { name: "Biological", difficulty: 1.0 }, { name: "Materials", difficulty: 1.1 }
    ]
};

// --- NEW: RESEARCH MADLIBS ---
const RESEARCH_DB = {
    ADJECTIVES: ["Facile", "Novel", "One-Pot", "Enantioselective", "High-Yield", "Green", "Biomimetic", "Computational", "Rapid", "Scalable", "Low-Temp", "Photo-Redox"],
    METHODS: ["Synthesis", "Catalysis", "Activation", "Analysis", "Spectroscopy", "Modeling", "Polymerization", "Crystallization", "Functionalization", "Deposition"],
    TARGETS: ["Carbon Nanotubes", "Chiral Ligands", "Antibiotic Precursors", "Solar Cells", "Rare Earth Metals", "Protein Folding", "Quantum Dots", "C-H Bonds", "Fluorinated Motifs", "Metal-Organic Frameworks"],
    APPLICATIONS: ["Drug Delivery", "Renewable Energy", "Cancer Therapy", "Industrial Coatings", "Quantum Computing", "Water Purification", "Next-Gen Batteries", "Bio-Imaging"]
};

// --- NEW: RANDOM MANAGEMENT ISSUES ---
const RANDOM_ISSUES = [
    {
        title: "Centrifuge War",
        desc: "Dr. Smith and Dr. Jones are fighting over centrifuge access. It's disrupting the whole floor.",
        choices: [
            { text: "Buy a new unit ($5k)", cost: 5000, flavor: "Peace is expensive.", effect: "morale_boost" },
            { text: "Make a schedule", cost: 0, flavor: "They grumble but comply.", effect: "morale_hit" }
        ]
    },
    {
        title: "Safety Violation",
        desc: "EHS caught a grad student eating a sandwich in the organic lab. They are threatening a fine.",
        choices: [
            { text: "Pay Fine ($1k)", cost: 1000, flavor: "Problem goes away.", effect: "none" },
            { text: "Mandatory Training", cost: 0, flavor: "Everyone loses a day of work.", effect: "productivity_hit" }
        ]
    },
    {
        title: "Freezer Failure",
        desc: "The -80C freezer in the hallway has died. Samples are thawing!",
        choices: [
            { text: "Emergency Repair ($2k)", cost: 2000, flavor: "Fixed within hours.", effect: "none" },
            { text: "Share Space", cost: 0, flavor: "Cram samples into other freezers. Risks contamination.", effect: "morale_hit" }
        ]
    },
    {
        title: "Alumni Donation",
        desc: "A successful alum wants to donate to the department, but wants to give a boring speech first.",
        choices: [
            { text: "Host Event ($500)", cost: 500, flavor: "You schmooze effectively. Donation secured.", effect: "donation_small" },
            { text: "Decline", cost: 0, flavor: "We don't have time for this.", effect: "none" }
        ]
    }
];

const RECRUITMENT = {
    BUDGETS: [
        { id: "none", cost: 0, label: "Passive (Post on website)", qualMod: 0.8, volMod: 0.8 },
        { id: "standard", cost: 2000, label: "Standard (Job Boards)", qualMod: 1.0, volMod: 1.0 },
        { id: "aggressive", cost: 7500, label: "Aggressive (Conferences & Ads)", qualMod: 1.2, volMod: 1.5 }
    ],
    REC_LETTERS: { 1: "Concerning", 3: "Weak", 5: "Average", 7: "Strong", 9: "Exceptional", 10: "Legendary" }
};

const ADMISSIONS = {
    DEADLINES: [
        { id: "early", label: "Early (Nov 1)", month: 10, day: 1, mod: 1.2 },
        { id: "standard", label: "Standard (Dec 1)", month: 11, day: 1, mod: 1.0 },
        { id: "late", label: "Late (Jan 15)", month: 0, day: 15, mod: 0.8 }
    ],
    QUESTIONS: [
        { id: "failure", text: "Tell us about a time an experiment failed.", reveals: "grit" },
        { id: "why_us", text: "Why this department specifically?", reveals: "fit" },
        { id: "technical", text: "How would you synthesize [Complex Molecule]?", reveals: "brains" },
        { id: "conflict", text: "Describe a conflict with a labmate.", reveals: "personality" },
        { id: "hours", text: "What is your ideal work schedule?", reveals: "hands" },
        { id: "future", text: "Where do you see yourself in 10 years?", reveals: "ambition" }
    ],
    ANSWERS: {
        grit: {
            low: ["I switch projects if it breaks.", "I get discouraged easily."],
            med: ["I troubleshoot for a week, then ask for help."],
            high: ["I spent three months debugging. I never gave up."]
        },
        brains: {
            low: ["Umm, I think I'd use a Suzuki coupling? Not sure."],
            med: ["I would start with a retro-synthetic analysis."],
            high: ["The literature suggests Pd-cycle, but I propose a radical cascade."]
        },
        hands: {
            low: ["I prefer computational work.", "I'm clumsy."],
            med: ["9 to 5. I treat it like a job."],
            high: ["I live at the bench. I run three reactions at once."]
        },
        fit: {
            low: ["I applied everywhere top 50.", "My partner lives here."],
            med: ["You have good funding.", "I like the location."],
            high: ["I specifically want to use your new NMR facility."]
        },
        personality: {
            low: ["I ignore people I don't like.", "I reported them immediately."],
            med: ["We talked it out.", "I ignored it."],
            high: ["I bought them coffee and we resolved the tension."]
        },
        ambition: {
            low: ["Industry maybe?", "Just want the degree."],
            med: ["Pharma company or teaching."],
            high: ["I want to run my own R1 research lab.", "Nobel Prize."]
        }
    },
    FACULTY_OPINIONS: {
        positive: ["I'd take them in my lab today.", "Strong publication record.", "Exactly the skillset we need."],
        neutral: ["Grades are fine, but do they have the drive?", "A safe bet, but not exciting."],
        negative: ["I don't see a fit.", "Recommendation letter is lukewarm.", "Too risky."]
    },
    FLYOUT_COST: 500, FLYOUT_BONUS: 15
};

// Date-specific events
const EVENTS_DB = [];