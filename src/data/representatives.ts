import { Representative } from '../types';

export const POPULAR_REPRESENTATIVES: Representative[] = [
  {
    name: "EcoRoot",
    avatar: "ER",
    bio: "Pioneering community-led urban agriculture & circular economy models. Focuses on ecological resilience, zero waste, and hyper-local resource loops.",
    alignment: "Ecology & Sustainability",
    matchScore: 94,
    followersCount: 1420,
    recommendations: {
      "1": {
        vote: "up",
        informed: 5,
        effective: 5,
        comment: "This is our gold standard. Hyper-local food production is the cornerstone of metabolic civic security."
      },
      "2": {
        vote: "up",
        informed: 4,
        effective: 3,
        comment: "Excellent climate adaptation model, although the high upfront budget requires strict municipal oversight."
      },
      "3": {
        vote: "up",
        informed: 5,
        effective: 4,
        comment: "Splendid dual-use canopy structure. Resolves local urban shade problems while feeding the neighborhood micro-grids."
      },
      "4": {
        vote: "down",
        informed: 2,
        effective: 2,
        comment: "Inefficient compared to standard solar/wind assets. Let's direct our public funds to high-yield thermal structures."
      },
      "5": {
        vote: "up",
        informed: 5,
        effective: 5,
        comment: "Biodegradable, low-carbon building blocks are exactly what our urban spaces need to break away from concrete dependency."
      },
      "6": {
        vote: "up",
        informed: 4,
        effective: 4,
        comment: "Highly effective baseline transition to break free from fossil-driven district heating schemes."
      },
      "7": {
        vote: "up",
        informed: 4,
        effective: 5,
        comment: "Crucial defensive infrastructure. The non-toxic suppressants prevent immediate forest margin fires with zero environment impact."
      },
      "8": {
        vote: "up",
        informed: 4,
        effective: 4,
        comment: "Enables neighborhood assemblies to fund ecological mini-parks and circular hubs directly."
      },
      "9": {
        vote: "up",
        informed: 5,
        effective: 5,
        comment: "Neutralizing industrial lobbyists ensures our local environmental legislation is actually written by citizens."
      }
    }
  },
  {
    name: "CivicFlow",
    avatar: "CF",
    bio: "Decentralized treasury expert & administrative critic. Prioritizes maximum budget transparency, citizen accountability, and cutting municipal overhead.",
    alignment: "Budget & Direct Democracy",
    matchScore: 89,
    followersCount: 2150,
    recommendations: {
      "1": {
        vote: "up",
        informed: 4,
        effective: 4,
        comment: "Great municipal return, but we must mandate that 30% of harvested output is distributed directly to lower-income citizens."
      },
      "2": {
        vote: "down",
        informed: 3,
        effective: 2,
        comment: "An extreme capital risk ($1.2M) with high maintenance overhead. The floating infrastructure could easily turn into a fiscal black hole."
      },
      "3": {
        vote: "up",
        informed: 4,
        effective: 5,
        comment: "Remarkable return on capital. High transparency, direct savings on municipal electric bills, and immediate community payback."
      },
      "4": {
        vote: "down",
        informed: 5,
        effective: 1,
        comment: "Fails basic cost-benefit analysis. The cost-per-watt is astronomical. We must refuse cosmetic green tech-larping."
      },
      "5": {
        vote: "up",
        informed: 4,
        effective: 4,
        comment: "Very low capital requirement to scale up production. Fantastic candidate for local cooperatively owned plants."
      },
      "6": {
        vote: "up",
        informed: 4,
        effective: 3,
        comment: "Substantial capital barrier ($1.2M), but long-term sovereign energy security justifies this direct public investment."
      },
      "7": {
        vote: "up",
        informed: 5,
        effective: 4,
        comment: "Autonomous early suppression completely eliminates billion-dollar commercial wildfire insurance payouts."
      },
      "8": {
        vote: "up",
        informed: 5,
        effective: 5,
        comment: "Our signature proposal. Direct community budgeting completely eliminates intermediary political administrators."
      },
      "9": {
        vote: "up",
        informed: 5,
        effective: 4,
        comment: "Lottery-based civic assembly creates highly accurate demographic representation, far superior to career politicians."
      }
    }
  },
  {
    name: "BlueAnchor",
    avatar: "BA",
    bio: "Emergency mitigation commander & coastal risk specialist. Dedicated to urban survival, climate resilience, disaster relief, and decentralized utility grids.",
    alignment: "Emergency & Disaster Resilience",
    matchScore: 82,
    followersCount: 980,
    delegatedTo: "EcoRoot", // Delegates to EcoRoot
    recommendations: {
      "1": {
        vote: "up",
        informed: 3,
        effective: 4,
        comment: "Ensures neighborhood food resilience when industrial agricultural supply chains collapse during extreme weather events."
      },
      "2": {
        vote: "up",
        informed: 5,
        effective: 5,
        comment: "Absolute masterclass in flood-ready modular planning. This is the blueprint for future high-density amphibious housing."
      },
      "3": {
        vote: "up",
        informed: 4,
        effective: 3,
        comment: "Acts as emergency neighborhood power stations and clean water distribution centers during major grid blackouts."
      },
      "4": {
        vote: "down",
        informed: 3,
        effective: 2,
        comment: "Far too fragile. Severe weather, debris, or flooding will completely disable these physical sidewalk generators."
      },
      "5": {
        vote: "up",
        informed: 4,
        effective: 4,
        comment: "Mycelium blocks provide exceptional thermal barriers and flame resistance. Perfect for emergency relief shelter panels."
      },
      "6": {
        vote: "up",
        informed: 3,
        effective: 4,
        comment: "Provides a reliable municipal backup water supply completely immune to winter deep-freeze grid failure events."
      },
      "7": {
        vote: "up",
        informed: 5,
        effective: 5,
        comment: "Our absolute priority. Autonomous early intervention prevents minor bushfire spots from growing into uncontrollable disasters."
      },
      "8": {
        vote: "down",
        informed: 2,
        effective: 3,
        comment: "Too fragmented. Emergency disaster responses require a centralized planning office, not slow local ledger voting."
      },
      "9": {
        vote: "up",
        informed: 4,
        effective: 4,
        comment: "Guarantees that emergency relief funds are allocated directly to affected citizens rather than captured by lobbyists."
      }
    }
  },
  {
    name: "UrbanistA",
    avatar: "UA",
    bio: "Architect & micro-mobility developer. Passionate about transforming public spaces, reclaiming roads, and maximizing density with aesthetic design.",
    alignment: "Urban Architecture & Space",
    matchScore: 87,
    followersCount: 1650,
    delegatedTo: "CivicFlow", // Delegates to CivicFlow
    recommendations: {
      "1": {
        vote: "up",
        informed: 5,
        effective: 4,
        comment: "Splendid reuse of abandoned grain elevators and silos. Keeps the industrial history of the harbor alive."
      },
      "2": {
        vote: "up",
        informed: 4,
        effective: 4,
        comment: "Bold architectural frontier. Reclaims aquatic zones to create vibrant, highly engaging waterfront communities."
      },
      "3": {
        vote: "up",
        informed: 5,
        effective: 5,
        comment: "A superb conversion of dead roof space into a beautiful solar canopy. Increases thermal comfort inside classrooms."
      },
      "4": {
        vote: "up",
        informed: 4,
        effective: 3,
        comment: "A highly educational urban art installation. While net power yield is modest, it makes citizens active kinetic agents."
      },
      "5": {
        vote: "up",
        informed: 4,
        effective: 5,
        comment: "Sustainable biomaterials are crucial to lighten the physical weight and thermal mass of our dense skyscraper districts."
      },
      "6": {
        vote: "up",
        informed: 5,
        effective: 4,
        comment: "Replacing massive central boilers frees up thousands of square meters of space for neighborhood pocket parks."
      },
      "7": {
        vote: "up",
        informed: 3,
        effective: 4,
        comment: "Autonomous drones keep peri-urban residential margins safe without ugly concrete firebreak clearings."
      },
      "8": {
        vote: "up",
        informed: 4,
        effective: 5,
        comment: "Allows localized communities to quickly finance public benches, trees, and micro-transit hubs without state delays."
      },
      "9": {
        vote: "up",
        informed: 4,
        effective: 4,
        comment: "Provides a diverse citizen perspective that prioritizes public parks over commercial retail real estate developer lobby."
      }
    }
  }
];
