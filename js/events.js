/* js/events.js */

const RANDOM_EVENTS = [
    // --- FACULTY EGOS ---
    {
        id: "parking_war",
        title: "The Parking Spot Feud",
        sender: "Facilities Mgmt",
        desc: "Emeritus Prof. Jenkins retired, leaving 'Spot #1' open. Two tenure-track stars are fighting over it in the hallway.",
        choices: [
            { text: "Give to Highest Grant Earner", cost: 0, flavor: "Money talks. The other prof is furious.", effects: { morale: -5, prestige: 0, budget: 0 } },
            { text: "Make it 'Visitor Only'", cost: 500, flavor: "You pay to repaint the lines. Everyone hates it, but it's fair.", effects: { morale: -10, prestige: 0, budget: -500 } },
            { text: "Auction for Dept Funds", cost: 0, flavor: "We raised $2k, but the winner is now insufferable.", effects: { morale: -5, prestige: 0, budget: 2000 } }
        ]
    },
    {
        id: "reply_all",
        title: "Reply-All Apocalypse",
        sender: "IT Helpdesk",
        desc: "An adjunct hit 'Reply All' complaining about the Dean. A senior prof replied correcting their grammar. The server is melting.",
        choices: [
            { text: "Shut down email server", cost: 0, flavor: "Silence... but no work gets done today.", effects: { morale: 0, prestige: 0, budget: 0 } },
            { text: "Send 'Cease & Desist'", cost: 0, flavor: "You assert dominance. They resent you.", effects: { morale: -5, prestige: 0, budget: 0 } },
            { text: "Ignore it", cost: 0, flavor: "It burns itself out, but the Dean is not amused.", effects: { morale: 0, prestige: -5, budget: 0 } }
        ]
    },
    
    // --- FACILITIES & SAFETY ---
    {
        id: "nmr_quench",
        title: "NMR Magnet Quench",
        sender: "Lab Manager",
        desc: "The 500 MHz NMR magnet lost superconductivity. The liquid helium boiled off!",
        choices: [
            { text: "Emergency Refill", cost: 15000, flavor: "Expensive, but we are back online.", effects: { morale: 5, prestige: 0, budget: -15000 } },
            { text: "Leave it broken", cost: 0, flavor: "Organic chemists are rioting. Research halts.", effects: { morale: -25, prestige: -10, budget: 0 } }
        ]
    },
    {
        id: "freezer_fail",
        title: "Freezer Farm Failure",
        sender: "Safety Officer",
        desc: "The -80°C freezer holding 5 years of samples is currently at -20°C and rising.",
        choices: [
            { text: "Buy Backup Unit", cost: 8000, flavor: "Crisis averted, wallet empty.", effects: { morale: 0, prestige: 0, budget: -8000 } },
            { text: "Cram samples in others", cost: 0, flavor: "Cross-contamination is likely.", effects: { morale: -10, prestige: -5, budget: 0 } }
        ]
    },

    // --- STUDENTS & ETHICS ---
    {
        id: "retraction",
        title: "Potential Retraction",
        sender: "Journal Editor",
        desc: "A post-doc admits they 'smoothed out' data in a paper published last year.",
        choices: [
            { text: "Full Retraction", cost: 0, flavor: "Painful, but we keep our integrity.", effects: { morale: -5, prestige: -10, budget: 0 } },
            { text: "Issue Correction", cost: 0, flavor: "A slap on the wrist. Rumors will fly.", effects: { morale: 0, prestige: -5, budget: 0 } },
            { text: "Ignore it", cost: 0, flavor: "Risky. If caught later, you're fired.", effects: { morale: 0, prestige: 0, budget: 0 } } // Logic for firing not implemented, but adds flavor
        ]
    },
    {
        id: "lab_accident",
        title: "Minor Explosion",
        sender: "EHS",
        desc: "A G1 student mixed nitric acid with organic waste. No injuries, but the hood is destroyed.",
        choices: [
            { text: "Report to Safety Board", cost: 0, flavor: "Mandatory retraining for everyone.", effects: { morale: -10, prestige: 0, budget: 0 } },
            { text: "Quiet Repairs", cost: 5000, flavor: "Shh. Just fix it.", effects: { morale: 0, prestige: 0, budget: -5000 } }
        ]
    },

    // --- BUREAUCRACY ---
    {
        id: "surplus",
        title: "Use It or Lose It",
        sender: "Finance Dept",
        desc: "Fiscal year end is approaching. We have a surplus that vanishes if not spent.",
        choices: [
            { text: "New Faculty Laptops", cost: 0, flavor: "Everyone loves new gear.", effects: { morale: 10, prestige: 0, budget: 5000 } }, // +Budget here implies getting value, but technically 'spending' the surplus.
            { text: "Pre-pay Chemical Stock", cost: 0, flavor: "Sensible. Reduces future burn rate slightly.", effects: { morale: 0, prestige: 0, budget: 5000 } },
            { text: "Renovate Your Office", cost: 0, flavor: "Nice mahogany desk. Faculty judge you.", effects: { morale: -15, prestige: 0, budget: 0 } }
        ]
    },
    {
        id: "weird_donor",
        title: "Eccentric Donor",
        sender: "Development Office",
        desc: "A wealthy alum offers a donation, but only if we research 'Alchemy'.",
        choices: [
            { text: "Take the money", cost: 0, flavor: "We'll call it 'Transmutation Physics'.", effects: { morale: -5, prestige: -15, budget: 50000 } },
            { text: "Decline", cost: 0, flavor: "We have standards.", effects: { morale: 5, prestige: 5, budget: 0 } }
        ]
    },
    {
        id: "ehs_audit",
        title: "Surprise Safety Inspection",
        sender: "EHS Officer",
        desc: "Environmental Health & Safety found coffee cups in the synthesis lab and a cylinder of H2 gas unchained. They are threatening to shut us down.",
        choices: [
            { text: "Pay the Fine", cost: 2500, flavor: "You write a check to make the problem go away.", effects: { budget: -2500, morale: 0, prestige: 0 } },
            { text: "Blame the Grad Students", cost: 0, flavor: "You force them to attend a 6-hour safety seminar on Saturday.", effects: { budget: 0, morale: -15, prestige: 0 } },
            { text: "Bribe the Inspector", cost: 0, flavor: "You take them to a steak dinner. Risky, but it worked.", effects: { budget: -200, morale: 5, prestige: 0 } }
        ]
    },
    {
        id: "helium_crisis",
        title: "Global Helium Shortage",
        sender: "NMR Facility Manager",
        desc: "The price of liquid helium has quadrupled overnight. If we don't refill the magnets, they will quench (break permanently).",
        choices: [
            { text: "Pay Market Rate", cost: 12000, flavor: "It bleeds the budget, but the instruments stay running.", effects: { budget: -12000, morale: 0, prestige: 0 } },
            { text: "Decommission the Old Magnet", cost: 2000, flavor: "We sacrifice the 300 MHz machine to save the others.", effects: { budget: -2000, morale: -10, prestige: -2 } },
            { text: "Vent the System", cost: 0, flavor: "Total shutdown. Research halts for weeks.", effects: { budget: 0, morale: -20, prestige: -10 } }
        ]
    },
    {
        id: "twitter_rant",
        title: "The Twitter Scandal",
        sender: "Public Relations",
        desc: "One of the faculty members tweeted something very rude about the National Science Foundation. It's trending.",
        choices: [
            { text: "Hire PR Crisis Team", cost: 5000, flavor: "They bury the story with SEO magic.", effects: { budget: -5000, morale: 0, prestige: 0 } },
            { text: "Public Apology", cost: 0, flavor: "Humiliating, but free.", effects: { budget: 0, morale: -10, prestige: -5 } },
            { text: "Defend 'Academic Freedom'", cost: 0, flavor: "The faculty love you; the funding agencies hate you.", effects: { budget: 0, morale: 15, prestige: -10 } }
        ]
    },
    {
        id: "mold_bloom",
        title: "Black Mold",
        sender: "Building Manager",
        desc: "It's growing in the ceiling tiles of the interaction lounge. Students are complaining of 'brain fog'.",
        choices: [
            { text: "Professional Remediation", cost: 6000, flavor: "Men in hazmat suits arrive. Problem solved.", effects: { budget: -6000, morale: 5, prestige: 0 } },
            { text: "Paint Over It", cost: 500, flavor: "The 'Landlord Special'. It looks clean, for now.", effects: { budget: -500, morale: 0, prestige: 0 } }, // Hidden risk?
            { text: "Ignore It", cost: 0, flavor: "Tell them it's just 'character'.", effects: { budget: 0, morale: -10, prestige: 0 } }
        ]
    },
    {
        id: "journal_cover",
        title: "Pay for Play",
        sender: "Nature Chemistry",
        desc: "The editors loved our latest paper. They are offering us the Cover Art spot... for a 'small' fee.",
        choices: [
            { text: "Pay the Fee", cost: 4500, flavor: "It costs as much as a used car, but the prestige is real.", effects: { budget: -4500, morale: 5, prestige: 15 } },
            { text: "Polite Refusal", cost: 0, flavor: "We take the publication, but lose the spotlight.", effects: { budget: 0, morale: 0, prestige: 5 } },
            { text: "Ask Undergrad to Draw It", cost: 0, flavor: "It looks terrible. They reject it. Embarrassing.", effects: { budget: 0, morale: -5, prestige: 0 } }
        ]
    },
    {
        id: "visiting_nobel",
        title: "The VIP Visit",
        sender: "Dean's Office",
        desc: "A Nobel Laureate is touring the campus today. They want to see our department.",
        choices: [
            { text: "Catered Lunch & Wine", cost: 1500, flavor: "We impress them with our hospitality.", effects: { budget: -1500, morale: 5, prestige: 5 } },
            { text: "Potluck", cost: 0, flavor: "Prof. Smith brought his famous 'mystery casserole'. The Laureate is unimpressed.", effects: { budget: -100, morale: -5, prestige: -2 } },
            { text: "Hide Everyone", cost: 0, flavor: "We pretend we are busy doing 'very important science'.", effects: { budget: 0, morale: -5, prestige: 0 } }
        ]
    },
    {
        id: "ta_strike",
        title: "Grad Student Strike",
        sender: "Grad Union Rep",
        desc: "The TAs are refusing to grade exams until the coffee machine is fixed and stipends are adjusted for inflation.",
        choices: [
            { text: "Cave to Demands", cost: 0, flavor: "You buy a fancy espresso machine. Morale skyrockets.", effects: { budget: -3000, morale: 20, prestige: 0 } },
            { text: "Hard Line", cost: 0, flavor: "You threaten to revoke funding. The grading gets done, but the resentment is palpable.", effects: { budget: 0, morale: -20, prestige: 0 } },
            { text: "Professors Grade Exams", cost: 0, flavor: "The faculty are furious at doing menial labor.", effects: { budget: 0, morale: -15, prestige: 0 } } // Faculty morale hit
        ]
    },

    
];