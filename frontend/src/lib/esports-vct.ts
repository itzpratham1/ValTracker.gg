// VCT 2026 Season Data & Constants

export interface VCTWinner {
  region: string;
  team: string;
  tag: string;
  logo: string;
  color: string;
}

export interface VCTTeam {
  name: string;
  tag: string;
  region: string;
  id: string;
}

export interface VCTRegionData {
  winners: VCTWinner[];
  teams: VCTTeam[];
}

export interface VCTStage {
  title: string;
  dates: string;
  regions: Record<string, VCTRegionData>;
}

export const VCT_STAGE_DATA: Record<string, VCTStage> = {
  kickoff: {
    title: "VCT Kickoff 2026",
    dates: "Jan - Feb 2026",
    regions: {
      global: {
        winners: [
          { region: "Pacific Winner", team: "Nongshim RedForce", tag: "NS", logo: "https://owcdn.net/img/6399bb707aacb.png", color: "#fa4454" },
          { region: "Americas Winner", team: "FURIA", tag: "FUR", logo: "https://owcdn.net/img/632be843b7d51.png", color: "#3b82f6" },
          { region: "EMEA Winner", team: "BBL Esports", tag: "BBL", logo: "https://owcdn.net/img/65b8ccef5e273.png", color: "#fbbf24" },
          { region: "China Winner", team: "All Gamers", tag: "AG", logo: "https://owcdn.net/img/6549c2b905061.png", color: "#a855f7" }
        ],
        teams: [
          { name: "Nongshim RedForce", tag: "NS", region: "ov-pacific", id: "11060" },
          { name: "FURIA", tag: "FUR", region: "ov-americas", id: "2406" },
          { name: "BBL Esports", tag: "BBL", region: "ov-emea", id: "397" },
          { name: "All Gamers", tag: "AG", region: "ov-china", id: "1119" }
        ]
      },
      americas: {
        winners: [
          { region: "Champion", team: "FURIA", tag: "FUR", logo: "https://owcdn.net/img/632be843b7d51.png", color: "#fa4454" }
        ],
        teams: [
          { name: "FURIA", tag: "FUR", region: "ov-americas", id: "2406" },
          { name: "G2 Esports", tag: "G2", region: "ov-americas", id: "11058" },
          { name: "NRG", tag: "NRG", region: "ov-americas", id: "1034" }
        ]
      },
      pacific: {
        winners: [
          { region: "Champion", team: "Nongshim RedForce", tag: "NS", logo: "https://owcdn.net/img/6399bb707aacb.png", color: "#fa4454" }
        ],
        teams: [
          { name: "Nongshim RedForce", tag: "NS", region: "ov-pacific", id: "11060" },
          { name: "T1", tag: "T1", region: "ov-pacific", id: "14" },
          { name: "Paper Rex", tag: "PRX", region: "ov-pacific", id: "624" }
        ]
      },
      emea: {
        winners: [
          { region: "Champion", team: "BBL Esports", tag: "BBL", logo: "https://owcdn.net/img/65b8ccef5e273.png", color: "#fa4454" }
        ],
        teams: [
          { name: "BBL Esports", tag: "BBL", region: "ov-emea", id: "397" },
          { name: "Gentle Mates", tag: "M8", region: "ov-emea", id: "11181" },
          { name: "Team Liquid", tag: "TL", region: "ov-emea", id: "474" }
        ]
      },
      china: {
        winners: [
          { region: "Champion", team: "All Gamers", tag: "AG", logo: "https://owcdn.net/img/6549c2b905061.png", color: "#fa4454" }
        ],
        teams: [
          { name: "All Gamers", tag: "AG", region: "ov-china", id: "1119" },
          { name: "XLG Esports", tag: "XLG", region: "ov-china", id: "xlg_esports" },
          { name: "EDward Gaming", tag: "EDG", region: "ov-china", id: "1120" }
        ]
      }
    }
  },
  masters_santiago: {
    title: "Masters Santiago 2026",
    dates: "Feb 28 - Mar 15, 2026",
    regions: {
      global: {
        winners: [
          { region: "Champion", team: "Nongshim RedForce", tag: "NS", logo: "https://owcdn.net/img/6399bb707aacb.png", color: "#fa4454" },
          { region: "Runner-up", team: "Paper Rex", tag: "PRX", logo: "https://owcdn.net/img/62bbeba74d5cb.png", color: "#db2777" }
        ],
        teams: [
          { name: "Nongshim RedForce", tag: "NS", region: "ov-pacific", id: "11060" },
          { name: "T1", tag: "T1", region: "ov-pacific", id: "14" },
          { name: "Paper Rex", tag: "PRX", region: "ov-pacific", id: "624" },
          { name: "FURIA", tag: "FUR", region: "ov-americas", id: "2406" },
          { name: "G2 Esports", tag: "G2", region: "ov-americas", id: "11058" },
          { name: "NRG", tag: "NRG", region: "ov-americas", id: "1034" },
          { name: "BBL Esports", tag: "BBL", region: "ov-emea", id: "397" },
          { name: "Gentle Mates", tag: "M8", region: "ov-emea", id: "11181" },
          { name: "Team Liquid", tag: "TL", region: "ov-emea", id: "474" },
          { name: "All Gamers", tag: "AG", region: "ov-china", id: "1119" },
          { name: "XLG Esports", tag: "XLG", region: "ov-china", id: "xlg_esports" },
          { name: "EDward Gaming", tag: "EDG", region: "ov-china", id: "1120" }
        ]
      }
    }
  },
  stage1: {
    title: "VCT Stage 1 2026",
    dates: "Mar - May 24, 2026",
    regions: {
      global: {
        winners: [
          { region: "Pacific Winner", team: "Paper Rex", tag: "PRX", logo: "https://owcdn.net/img/62bbeba74d5cb.png", color: "#fa4454" },
          { region: "EMEA Winner", team: "Team Heretics", tag: "TH", logo: "https://owcdn.net/img/637b755224c12.png", color: "#fbbf24" },
          { region: "China Winner", team: "EDward Gaming", tag: "EDG", logo: "https://owcdn.net/img/62c82049253b2.png", color: "#a855f7" },
          { region: "Americas Winner", team: "Leviatán", tag: "LEV", logo: "https://owcdn.net/img/61b8888cc3860.png", color: "#3b82f6" }
        ],
        teams: [
          { name: "Paper Rex", tag: "PRX", region: "ov-pacific", id: "624" },
          { name: "FULL SENSE", tag: "FS", region: "ov-pacific", id: "4050" },
          { name: "Global Esports", tag: "GE", region: "ov-pacific", id: "918" },
          { name: "Team Heretics", tag: "TH", region: "ov-emea", id: "1001" },
          { name: "Team Vitality", tag: "VIT", region: "ov-emea", id: "2059" },
          { name: "FUT Esports", tag: "FUT", region: "ov-emea", id: "1184" },
          { name: "EDward Gaming", tag: "EDG", region: "ov-china", id: "1120" },
          { name: "Xi Lai Gaming", tag: "XLG", region: "ov-china", id: "13581" },
          { name: "Dragon Ranger Gaming", tag: "DRG", region: "ov-china", id: "11981" },
          { name: "Leviatán", tag: "LEV", region: "ov-americas", id: "2359" },
          { name: "G2 Esports", tag: "G2", region: "ov-americas", id: "11058" },
          { name: "NRG", tag: "NRG", region: "ov-americas", id: "1034" }
        ]
      },
      americas: {
        winners: [
          { region: "Champion", team: "Leviatán", tag: "LEV", logo: "https://owcdn.net/img/61b8888cc3860.png", color: "#3b82f6" }
        ],
        teams: [
          { name: "Leviatán", tag: "LEV", region: "ov-americas", id: "2359" },
          { name: "G2 Esports", tag: "G2", region: "ov-americas", id: "11058" },
          { name: "NRG", tag: "NRG", region: "ov-americas", id: "1034" }
        ]
      },
      pacific: {
        winners: [
          { region: "Champion", team: "Paper Rex", tag: "PRX", logo: "https://owcdn.net/img/62bbeba74d5cb.png", color: "#fa4454" },
          { region: "Runner-up", team: "FULL SENSE", tag: "FS", logo: "https://owcdn.net/img/6537a7954d915.png", color: "#ff5757" }
        ],
        teams: [
          { name: "Paper Rex", tag: "PRX", region: "ov-pacific", id: "624" },
          { name: "FULL SENSE", tag: "FS", region: "ov-pacific", id: "4050" },
          { name: "Global Esports", tag: "GE", region: "ov-pacific", id: "918" }
        ]
      },
      emea: {
        winners: [
          { region: "Champion", team: "Team Heretics", tag: "TH", logo: "https://owcdn.net/img/637b755224c12.png", color: "#fa4454" },
          { region: "Runner-up", team: "Team Vitality", tag: "VIT", logo: "https://owcdn.net/img/6466d79e1ed40.png", color: "#fbbf24" }
        ],
        teams: [
          { name: "Team Heretics", tag: "TH", region: "ov-emea", id: "1001" },
          { name: "Team Vitality", tag: "VIT", region: "ov-emea", id: "2059" },
          { name: "FUT Esports", tag: "FUT", region: "ov-emea", id: "1184" }
        ]
      },
      china: {
        winners: [
          { region: "Champion", team: "EDward Gaming", tag: "EDG", logo: "https://owcdn.net/img/62c82049253b2.png", color: "#fa4454" },
          { region: "Runner-up", team: "Xi Lai Gaming", tag: "XLG", logo: "https://owcdn.net/img/671742f863b9b.png", color: "#a855f7" }
        ],
        teams: [
          { name: "EDward Gaming", tag: "EDG", region: "ov-china", id: "1120" },
          { name: "Xi Lai Gaming", tag: "XLG", region: "ov-china", id: "13581" },
          { name: "Dragon Ranger Gaming", tag: "DRG", region: "ov-china", id: "11981" }
        ]
      }
    }
  },
  masters_london: {
    title: "Masters London 2026",
    dates: "June 6 - June 21, 2026",
    regions: {
      global: {
        winners: [
          { region: "Status", team: "Playoffs Ongoing", tag: "LIVE", logo: "", color: "#22c55e" }
        ],
        teams: [
          { name: "Paper Rex", tag: "PRX", region: "ov-pacific", id: "624" },
          { name: "Leviatán", tag: "LEV", region: "ov-americas", id: "2359" },
          { name: "Team Heretics", tag: "TH", region: "ov-emea", id: "1001" },
          { name: "EDward Gaming", tag: "EDG", region: "ov-china", id: "1120" },
          { name: "G2 Esports", tag: "G2", region: "ov-americas", id: "11058" },
          { name: "Team Vitality", tag: "VIT", region: "ov-emea", id: "2059" },
          { name: "Xi Lai Gaming", tag: "XLG", region: "ov-china", id: "13581" },
          { name: "FUT Esports", tag: "FUT", region: "ov-emea", id: "1184" },
          { name: "NRG", tag: "NRG", region: "ov-americas", id: "1034" },
          { name: "Global Esports", tag: "GE", region: "ov-pacific", id: "918" },
          { name: "FULL SENSE", tag: "FS", region: "ov-pacific", id: "4050" },
          { name: "Dragon Ranger Gaming", tag: "DRG", region: "ov-china", id: "11981" }
        ]
      }
    }
  },
  stage2: {
    title: "VCT Stage 2 2026",
    dates: "June - September 2026",
    regions: {
      global: {
        winners: [
          { region: "Status", team: "Upcoming Regional Splits", tag: "TBD", logo: "", color: "#3b82f6" }
        ],
        teams: [
          { name: "Paper Rex", tag: "PRX", region: "ov-pacific", id: "624" },
          { name: "Team Heretics", tag: "TH", region: "ov-emea", id: "1001" },
          { name: "EDward Gaming", tag: "EDG", region: "ov-china", id: "1120" },
          { name: "Leviatán", tag: "LEV", region: "ov-americas", id: "2359" }
        ]
      },
      americas: {
        winners: [
          { region: "Status", team: "Upcoming regional split", tag: "TBD", logo: "", color: "#3b82f6" }
        ],
        teams: [
          { name: "Leviatán", tag: "LEV", region: "ov-americas", id: "2359" },
          { name: "G2 Esports", tag: "G2", region: "ov-americas", id: "11058" },
          { name: "NRG", tag: "NRG", region: "ov-americas", id: "1034" }
        ]
      },
      pacific: {
        winners: [
          { region: "Status", team: "Upcoming regional split", tag: "TBD", logo: "", color: "#ef4444" }
        ],
        teams: [
          { name: "Paper Rex", tag: "PRX", region: "ov-pacific", id: "624" },
          { name: "FULL SENSE", tag: "FS", region: "ov-pacific", id: "4050" },
          { name: "Global Esports", tag: "GE", region: "ov-pacific", id: "918" }
        ]
      },
      emea: {
        winners: [
          { region: "Status", team: "Upcoming regional split", tag: "TBD", logo: "", color: "#fbbf24" }
        ],
        teams: [
          { name: "Team Heretics", tag: "TH", region: "ov-emea", id: "1001" },
          { name: "Team Vitality", tag: "VIT", region: "ov-emea", id: "2059" },
          { name: "FUT Esports", tag: "FUT", region: "ov-emea", id: "1184" }
        ]
      },
      china: {
        winners: [
          { region: "Status", team: "Upcoming regional split", tag: "TBD", logo: "", color: "#a855f7" }
        ],
        teams: [
          { name: "EDward Gaming", tag: "EDG", region: "ov-china", id: "1120" },
          { name: "Xi Lai Gaming", tag: "XLG", region: "ov-china", id: "13581" },
          { name: "Dragon Ranger Gaming", tag: "DRG", region: "ov-china", id: "11981" }
        ]
      }
    }
  },
  champions: {
    title: "Champions Shanghai 2026",
    dates: "Sept 24 - Oct 18, 2026",
    regions: {
      global: {
        winners: [
          { region: "Status", team: "The Ultimate Crown", tag: "TBD", logo: "", color: "#fbbf24" }
        ],
        teams: [
          { name: "TBD - Qualified Teams", tag: "VAL", region: "ov-pacific", id: "624" }
        ]
      }
    }
  }
};

export const VCT_VLR_EVENTS: Record<string, Record<string, number>> = {
  kickoff: {
    americas: 2682,
    pacific: 2683,
    emea: 2684,
    china: 2685
  },
  masters_santiago: {
    global: 2760
  },
  stage1: {
    americas: 2860,
    pacific: 2775,
    emea: 2863,
    china: 2864
  },
  masters_london: {
    global: 2765
  },
  stage2: {
    americas: 2977,
    pacific: 2776,
    emea: 2976,
    china: 2978
  },
  champions: {
    global: 2766
  }
};
