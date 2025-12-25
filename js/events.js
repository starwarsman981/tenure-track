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
    }
];