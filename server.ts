import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { Idea } from "./src/types";

// Initialize Firebase
import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";

let currentFilename = "";
let currentDirname = "";

try {
  if (typeof import.meta !== "undefined" && import.meta.url) {
    currentFilename = fileURLToPath(import.meta.url);
    currentDirname = path.dirname(currentFilename);
  } else {
    currentFilename = __filename;
    currentDirname = __dirname;
  }
} catch (e) {
  currentFilename = typeof __filename !== "undefined" ? __filename : "";
  currentDirname = typeof __dirname !== "undefined" ? __dirname : process.cwd();
}

const __filenameVar = currentFilename;
const __dirnameVar = currentDirname;

// Load firebase-applet-config
const configPath = path.join(__dirnameVar, "firebase-applet-config.json");
const firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));

const appInstance = admin.initializeApp({
  projectId: firebaseConfig.projectId
});
const db = getFirestore(appInstance, firebaseConfig.firestoreDatabaseId);

// Helper shims to map client firestore calls to firebase-admin, with in-memory fallback for local development sandbox
let useMemoryFallback = false;

const memoryStore = {
  ideas: [] as any[],
  forumThreads: [] as any[],
  notifications: [] as any[],
  votes: [] as any[],
  ratings: [] as any[],
  forumVotes: [] as any[],
  forumRatings: [] as any[],
  commentReactions: [] as any[]
};

function ensureMemoryStorePopulated() {
  if (memoryStore.ideas.length === 0 && typeof initialIdeas !== "undefined") {
    memoryStore.ideas = JSON.parse(JSON.stringify(initialIdeas));
  }
  if (memoryStore.forumThreads.length === 0 && typeof initialForumThreads !== "undefined") {
    memoryStore.forumThreads = JSON.parse(JSON.stringify(initialForumThreads));
  }
}

class CollectionRef {
  type = "collection" as const;
  ref: any;
  collectionName: string;
  constructor(ref: any, collectionName: string) {
    this.ref = ref;
    this.collectionName = collectionName;
  }
}

class DocRef {
  type = "document" as const;
  ref: any;
  collectionName: string;
  docId: string;
  constructor(ref: any, collectionName: string, docId: string) {
    this.ref = ref;
    this.collectionName = collectionName;
    this.docId = docId;
  }
}

class QueryRef {
  type = "query" as const;
  ref: any;
  collectionName: string;
  clauses: any[];
  constructor(ref: any, collectionName: string, clauses: any[]) {
    this.ref = ref;
    this.collectionName = collectionName;
    this.clauses = clauses;
  }
}

function collection(_db: any, path: string): CollectionRef {
  return new CollectionRef(db.collection(path), path);
}

function doc(parent: any, ...paths: string[]): DocRef {
  if (parent instanceof CollectionRef) {
    return new DocRef(parent.ref.doc(paths[0]), parent.collectionName, paths[0]);
  } else if (parent && parent.ref && typeof parent.ref.doc === "function") {
    return new DocRef(parent.ref.doc(paths[0]), parent.collectionName, paths[0]);
  } else {
    return new DocRef(db.collection(paths[0]).doc(paths[1]), paths[0], paths[1]);
  }
}

function query(base: CollectionRef | QueryRef, ...clauses: any[]): QueryRef {
  let q: any = base.ref;
  const allClauses = base instanceof QueryRef ? [...base.clauses, ...clauses] : clauses;
  for (const clause of clauses) {
    if (clause.type === "where") {
      q = q.where(clause.field, clause.operator, clause.value);
    } else if (clause.type === "limit") {
      q = q.limit(clause.limit);
    } else if (clause.type === "orderBy") {
      q = q.orderBy(clause.field, clause.direction);
    }
  }
  return new QueryRef(q, base.collectionName, allClauses);
}

function where(field: string, opStr: any, value: any) {
  return { type: "where", field, operator: opStr, value };
}

function limit(n: number) {
  return { type: "limit", limit: n };
}

function orderBy(field: string, direction?: "asc" | "desc") {
  return { type: "orderBy", field, direction };
}

async function getDoc(docRef: DocRef) {
  if (useMemoryFallback) {
    ensureMemoryStorePopulated();
    const list = memoryStore[docRef.collectionName as keyof typeof memoryStore] || [];
    const item = list.find((x: any) => x.id === docRef.docId);
    return {
      exists: () => !!item,
      data: () => item ? JSON.parse(JSON.stringify(item)) : undefined,
      id: docRef.docId
    };
  }
  try {
    const snap = await docRef.ref.get();
    return {
      exists: () => snap.exists,
      data: () => snap.data(),
      id: snap.id
    };
  } catch (err) {
    console.warn("⚠️ Firestore getDoc failed, falling back to in-memory store. Error:", err);
    useMemoryFallback = true;
    return getDoc(docRef);
  }
}

async function getDocs(ref: CollectionRef | QueryRef) {
  if (useMemoryFallback) {
    ensureMemoryStorePopulated();
    let list = [...(memoryStore[ref.collectionName as keyof typeof memoryStore] || [])];
    
    // Apply query clauses if any
    if (ref instanceof QueryRef) {
      for (const clause of ref.clauses) {
        if (clause.type === "where") {
          const { field, operator, value } = clause;
          list = list.filter((item: any) => {
            const val = item[field];
            if (operator === "==") return val === value;
            if (operator === ">=") return val >= value;
            if (operator === "<=") return val <= value;
            if (operator === ">") return val > value;
            if (operator === "<") return val < value;
            return true;
          });
        }
      }
      // Apply limit
      const limitClause = ref.clauses.find(c => c.type === "limit");
      if (limitClause) {
        list = list.slice(0, limitClause.limit);
      }
    }

    const docs = list.map((item: any) => ({
      id: item.id,
      data: () => JSON.parse(JSON.stringify(item)),
      ref: new DocRef(null, ref.collectionName, item.id)
    }));

    return {
      empty: docs.length === 0,
      docs,
      forEach: (cb: (d: any) => void) => {
        docs.forEach(cb);
      }
    };
  }

  try {
    const snap = await ref.ref.get();
    const docs: any[] = [];
    snap.forEach(d => {
      docs.push({
        id: d.id,
        data: () => d.data(),
        ref: new DocRef(d.ref, ref.collectionName, d.id)
      });
    });
    return {
      empty: snap.empty,
      docs,
      forEach: (cb: (d: any) => void) => {
        docs.forEach(cb);
      }
    };
  } catch (err) {
    console.warn("⚠️ Firestore getDocs failed, falling back to in-memory store. Error:", err);
    useMemoryFallback = true;
    return getDocs(ref);
  }
}

async function setDoc(docRef: DocRef, data: any) {
  if (useMemoryFallback) {
    ensureMemoryStorePopulated();
    const listName = docRef.collectionName as keyof typeof memoryStore;
    if (!memoryStore[listName]) {
      (memoryStore as any)[listName] = [];
    }
    const list = memoryStore[listName] as any[];
    const index = list.findIndex((x: any) => x.id === docRef.docId);
    const docData = { ...data, id: docRef.docId }; // Ensure id matches
    if (index >= 0) {
      list[index] = docData;
    } else {
      list.push(docData);
    }
    return;
  }

  try {
    await docRef.ref.set(data);
  } catch (err) {
    console.warn("⚠️ Firestore setDoc failed, falling back to in-memory store. Error:", err);
    useMemoryFallback = true;
    await setDoc(docRef, data);
  }
}

async function updateDoc(docRef: DocRef, data: any) {
  if (useMemoryFallback) {
    ensureMemoryStorePopulated();
    const listName = docRef.collectionName as keyof typeof memoryStore;
    const list = memoryStore[listName] as any[];
    const item = list.find((x: any) => x.id === docRef.docId);
    if (item) {
      Object.assign(item, data);
    }
    return;
  }

  try {
    await docRef.ref.update(data);
  } catch (err) {
    console.warn("⚠️ Firestore updateDoc failed, falling back to in-memory store. Error:", err);
    useMemoryFallback = true;
    await updateDoc(docRef, data);
  }
}

async function deleteDoc(docRef: DocRef) {
  if (useMemoryFallback) {
    ensureMemoryStorePopulated();
    const listName = docRef.collectionName as keyof typeof memoryStore;
    if (memoryStore[listName]) {
      const list = memoryStore[listName] as any[];
      const index = list.findIndex((x: any) => x.id === docRef.docId);
      if (index >= 0) {
        list.splice(index, 1);
      }
    }
    return;
  }

  try {
    await docRef.ref.delete();
  } catch (err) {
    console.warn("⚠️ Firestore deleteDoc failed, falling back to in-memory store. Error:", err);
    useMemoryFallback = true;
    await deleteDoc(docRef);
  }
}

// Error handling types and helper as specified in the Firebase Skill MD
enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
  };
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {},
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Default Seed Data
const initialIdeas: Idea[] = [
  {
    id: "1",
    title: "Continuous Direct Democracy Portal",
    description: "Building an offline-first decentralized citizen voting portal utilizing local wireless hotspots and regional ledger logs, allowing secure, anonymous voting and instant proxy delegation countrywide.",
    creator: "EcoDemos",
    cost: 150000,
    image: "https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&q=80&w=1200",
    category: "main" as const,
    stats: { informed: 4.8, effective: 4.6 },
    votes: 19800,
    startingInvestedAmount: 30000,
    investedAmount: 124000,
    upgrades: [
      {
        id: "u1",
        user: "ZKP_Nodes",
        title: "Zero-Knowledge Voter Verification",
        description: "Integrate zero-knowledge credentials to verify voter eligibility without revealing personal identity or specific voting history.",
        cost: 195000,
        timestamp: "3h ago",
        status: "pending" as const
      },
      {
        id: "u2",
        user: "MeshSkeptic",
        title: "Offline Mesh Voting Sync",
        description: "Enabling encrypted peer-to-peer packet synchronization so that remote mountain communities and isolated Aegean islands can sync vote records off-grid.",
        cost: 260000,
        timestamp: "1d ago",
        status: "pending" as const
      }
    ],
    comments: [
      { 
        id: 'c1', 
        user: 'HeleneVoter', 
        text: 'This is the true foundation of liquid democracy. Direct control over proxies is essential.', 
        timestamp: '2h ago',
        reactions: { like: 45, dislike: 1, informed: 24, uninformed: 0, effective: 18, ineffective: 0 },
        replies: []
      },
      { 
        id: 'c2', 
        user: 'AthensNode', 
        text: 'Using zero-knowledge verification prevents any corporate or government tracing.', 
        timestamp: '1h ago',
        reactions: { like: 32, dislike: 0, informed: 15, uninformed: 0, effective: 12, ineffective: 0 },
        replies: []
      }
    ]
  },
  {
    id: "2",
    title: "Autonomous Self-Sustained Civic Commune",
    description: "Creating a model physical settlement governed completely by direct-democracy assemblies and local cooperative resource pools, showcasing a highly competent parallel society.",
    creator: "Koinotis",
    cost: 950000,
    image: "https://images.unsplash.com/photo-1558449028-b53a39d100fc?w=800&q=80",
    category: "main" as const,
    stats: { informed: 4.2, effective: 3.8 },
    votes: 1240,
    startingInvestedAmount: 150000,
    investedAmount: 420000,
    upgrades: [
      {
        id: "u3",
        user: "SolarSphere",
        title: "Cooperative Solar Energy Ledger",
        description: "Integrate a real-time smart power grid managed directly by assembly vote, keeping all generated power in direct common property.",
        cost: 1100000,
        timestamp: "5h ago",
        status: "pending" as const
      }
    ],
    comments: [
      { 
        id: 'c3', 
        user: 'SpartanVoter', 
        text: 'A competent self-sustained mini-society proves the system works in practice before scaling nationwide.', 
        timestamp: '30m ago',
        reactions: { like: 58, dislike: 2, informed: 12, uninformed: 1, effective: 24, ineffective: 2 },
        replies: []
      }
    ]
  },
  {
    id: "3",
    title: "Decentralized Assembly Hall Hubs",
    description: "Solar-powered physical centers in remote Greek villages acting as local direct-democracy assembly rooms, ledger verification nodes, and community voting hubs.",
    creator: "SolarLearn",
    cost: 250000,
    image: "https://images.unsplash.com/photo-1509391366360-fe5bb658582f?w=800&q=80",
    category: "main" as const,
    stats: { informed: 4.5, effective: 4.2 },
    votes: 3200,
    startingInvestedAmount: 50000,
    investedAmount: 180000,
    upgrades: [],
    comments: []
  },
  {
    id: "4",
    title: "Consensus Cascade Protocol",
    description: "An advanced real-time algorithm that automatically recalculates proxy delegation cascades when a voter decides to bypass their proxy and vote directly.",
    creator: "PureDemocracy",
    cost: 120000,
    image: "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&q=80&w=1200",
    category: "main" as const,
    stats: { informed: 4.6, effective: 4.8 },
    votes: 5400,
    startingInvestedAmount: 25000,
    investedAmount: 115000,
    upgrades: [],
    comments: []
  },
  {
    id: "5",
    title: "Collaborative Community Resource Ledger",
    description: "A decentralized public ledger where Greek citizens register direct resource contributions, municipal tools, and emergency supplies managed entirely by local vote.",
    creator: "BioLedger",
    cost: 280000,
    image: "https://images.unsplash.com/photo-1550985543-f47f38aee65e?auto=format&fit=crop&q=80&w=1200",
    category: "main" as const,
    stats: { informed: 3.9, effective: 4.9 },
    votes: 9100,
    startingInvestedAmount: 60000,
    investedAmount: 210000,
    upgrades: [],
    comments: []
  },
  {
    id: "10",
    title: "Decentralized Solar Mesh Grid (Cyclades Islands)",
    description: "A completed initiative to link over 400 households in remote Aegean islands to an autonomous solar grid with localized battery backups. Managed via direct liquid democracy. Fully dispatched and generating power.",
    creator: "AegeanSun",
    cost: 350000,
    image: "https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=800&q=80",
    category: "main" as const,
    stats: { informed: 4.9, effective: 5.0 },
    votes: 15400,
    startingInvestedAmount: 70000,
    investedAmount: 350000,
    upgrades: [],
    comments: [
      {
        id: 'done-c1',
        user: 'NaxosCitizen',
        text: 'This works flawlessly. Our electricity costs dropped to zero and excess storage fuels community pumps.',
        timestamp: '1mo ago',
        reactions: { like: 140, dislike: 0, informed: 80, uninformed: 0, effective: 72, ineffective: 0 },
        replies: []
      }
    ]
  },
  {
    id: "7",
    title: "Immediate Mutual Aid: Pediatric Cardiac Surgery for Sophia P.",
    description: "Sophia is a 6-year-old from Patras requiring urgent cardiovascular surgical intervention for a complex septal defect. This direct consensus allocation funds her immediate treatment at the Onassis Cardiac Surgery Center in Athens, completely bypassing the 18-month state public hospital waiting list.",
    creator: "HealDemos",
    cost: 42000,
    image: "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=800&q=80",
    category: "emergency" as const,
    stats: { informed: 4.8, effective: 4.9 },
    votes: 14500,
    startingInvestedAmount: 10000,
    investedAmount: 42000,
    upgrades: [],
    comments: [
      {
        id: 'ec1',
        user: 'AthensNode',
        text: 'This is exactly what our direct emergency pool is for. No child should wait in a line for critical cardiac care.',
        timestamp: '1h ago',
        reactions: { like: 88, dislike: 0, informed: 44, uninformed: 0, effective: 38, ineffective: 0 },
        replies: []
      }
    ]
  },
  {
    id: "8",
    title: "Displacement Response: Immediate Winter Shelter & Warm Food Pool",
    description: "A rapid direct-consensus initiative to secure warm temporary hostel shelter, thermal clothing, and hot daily meals for over 150 displaced individuals and families in the center of Athens who are experiencing severe seasonal winter frost and sub-zero temperatures.",
    creator: "Koinonia",
    cost: 18500,
    image: "https://images.unsplash.com/photo-1544027993-37dbfe43562a?w=800&q=80",
    category: "emergency" as const,
    stats: { informed: 4.6, effective: 4.8 },
    votes: 19800,
    startingInvestedAmount: 3000,
    investedAmount: 18500,
    upgrades: [],
    comments: [
      {
        id: 'ec2',
        user: 'SpartanVoter',
        text: 'Direct logistics already set up with regional hostels. Approving immediately to dispatch resources.',
        timestamp: '3h ago',
        reactions: { like: 120, dislike: 1, informed: 60, uninformed: 0, effective: 54, ineffective: 0 },
        replies: []
      }
    ]
  },
  {
    id: "9",
    title: "Universal Direct Representative Lottery",
    description: "An automated lottery assembly system selecting diverse Greek citizen cohorts to deliberate on key local legislation, completely neutralizing lobbying.",
    creator: "DemosSort",
    cost: 480000,
    image: "https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?auto=format&fit=crop&q=80&w=1200",
    category: "political" as const,
    stats: { informed: 4.4, effective: 4.1 },
    votes: 6100,
    startingInvestedAmount: 90000,
    investedAmount: 260000,
    upgrades: [],
    comments: []
  },
  {
    id: "11",
    title: "Decentralized Aegean Marine Sanctuaries",
    description: "Deploying an automated citizen-patrolled sonar and camera buoy mesh across critical Cycladic marine zones, governed via community votes to dynamically declare seasonal fishing sanctuaries and protect bio-habitats.",
    creator: "EcoPelagos",
    cost: 135000,
    image: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&q=80",
    category: "main" as const,
    stats: { informed: 4.7, effective: 4.5 },
    votes: 6800,
    startingInvestedAmount: 20000,
    investedAmount: 95000,
    upgrades: [],
    comments: []
  },
  {
    id: "12",
    title: "AI-Assisted Legislative Deliberation Framework",
    description: "An open-source legislative analysis platform powered by specialized open LLMs that synthesizes citizen arguments, maps direct-democracy proposals into legal draft templates, and flags conflicts with existing constitutional codes.",
    creator: "NomosCoder",
    cost: 210000,
    image: "https://images.unsplash.com/photo-1450133064473-71024230f91b?w=800&q=80",
    category: "political" as const,
    stats: { informed: 4.9, effective: 4.4 },
    votes: 8900,
    startingInvestedAmount: 45000,
    investedAmount: 180000,
    upgrades: [],
    comments: []
  },
  {
    id: "13",
    title: "Aegean Cooperative Solar Desalination Network",
    description: "Establishing community-owned, solar-thermal desalination hubs on smaller dry Cyclades islands, generating 200,000 liters of pure irrigation water daily, controlled and funded entirely via micro-pledges.",
    creator: "HydroSun",
    cost: 410000,
    image: "https://images.unsplash.com/photo-1548613053-220676212202?w=800&q=80",
    category: "main" as const,
    stats: { informed: 4.6, effective: 4.7 },
    votes: 12100,
    startingInvestedAmount: 80000,
    investedAmount: 310000,
    upgrades: [],
    comments: []
  },
  {
    id: "14",
    title: "Direct Community-Led Fire Detection Mesh Network",
    description: "Deploying thousands of low-cost, low-power thermal sensor nodes and micro-cameras in national park forest margins (Parnitha, Taygetos), connecting to local direct-democracy emergency volunteer dispatch hubs.",
    creator: "HellasRescue",
    cost: 85000,
    image: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=800&q=80",
    category: "emergency" as const,
    stats: { informed: 4.8, effective: 4.9 },
    votes: 24500,
    startingInvestedAmount: 15000,
    investedAmount: 85000,
    upgrades: [],
    comments: []
  },
  {
    id: "15",
    title: "Citizen-Led Cooperative Banking Union",
    description: "Establish a public-owned cooperative micro-credit union governed entirely via direct-democracy local assembly voting. This provides debt refinancing and interest-free small-business loans directly to registered citizens, bypassing traditional banking conglomerates.",
    creator: "DemosBank",
    cost: 550000,
    image: "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=800&q=80",
    category: "political" as const,
    stats: { informed: 4.6, effective: 4.5 },
    votes: 1800,
    startingInvestedAmount: 120000,
    investedAmount: 120000,
    upgrades: [],
    comments: []
  },
  {
    id: "16",
    title: "Agrophotovoltaic Cooperative Solar Farm",
    description: "Deploying elevated solar panel grids above communal crop fields in Thessaly. This provides dual-use land for clean energy generation and shade-enhanced crop/sheep farming, managed directly by local cooperative collectives.",
    creator: "AgroVolt",
    cost: 680000,
    image: "https://images.unsplash.com/photo-1509391366360-fe5bb658582f?w=800&q=80",
    category: "main" as const,
    stats: { informed: 4.7, effective: 4.8 },
    votes: 3500,
    startingInvestedAmount: 150000,
    investedAmount: 150000,
    upgrades: [],
    comments: []
  },
  {
    id: "17",
    title: "Post-Fire Seed-Dropping Reforestation Fleet",
    description: "Deploying a fleet of automated seed-dropping quadcopters to distribute over 1.2 million native pine and oak seeds across fire-damaged regions of Mt. Penteli, before the winter rains cause severe soil erosion.",
    creator: "ReForest",
    cost: 48000,
    image: "https://images.unsplash.com/photo-1448375240586-882707db888b?w=800&q=80",
    category: "emergency" as const,
    stats: { informed: 4.9, effective: 4.8 },
    votes: 1100,
    startingInvestedAmount: 5000,
    investedAmount: 5000,
    upgrades: [],
    comments: []
  }
];

const initialForumThreads = [
  {
    id: "t4",
    title: "Build a decentralized mobile voting app with cryptographic signature validation",
    description: "We need a robust React-Native or Flutter application that parses our decentralized IdeaSwipe public domain ledger, allowing citizens to vote or delegate proxies natively with biometric authentication and zero-knowledge proofs.",
    creator: "NomosCoder",
    timestamp: "2h ago",
    likes: 142,
    dislikes: 2,
    forumCategory: "app-building",
    stats: { informed: 4.9, effective: 4.8 },
    comments: [
      {
        id: "tc5",
        user: "TechDemocracy",
        text: "Yes, utilizing zero-knowledge proofs is perfect here so that a citizen's ballot remains private while we can still mathematically verify they are a registered voter.",
        timestamp: "1h ago",
        reactions: { like: 45, dislike: 1, informed: 32, uninformed: 0, effective: 28, ineffective: 0 },
        replies: []
      }
    ]
  },
  {
    id: "t1",
    title: "Should we mandate decentralized rainwater collection on Cyclades roofs?",
    description: "Many dry Cyclades islands rely on water tankers. An decentralized rainwater collection mesh with smart filtration could supply non-drinking needs. What are your thoughts on cost and local governance of this model?",
    creator: "YannisEco",
    timestamp: "4h ago",
    likes: 48,
    dislikes: 3,
    forumCategory: "aesthetics",
    stats: { informed: 4.2, effective: 3.9 },
    comments: [
      {
        id: "tc1",
        user: "AegeanSkeptic",
        text: "Very interesting, but do we have enough surface area on typical cycladic roofs? Rainfall is very sparse between May and September.",
        timestamp: "3h ago",
        reactions: { like: 12, dislike: 1, informed: 8, uninformed: 0, effective: 5, ineffective: 0 },
        replies: []
      },
      {
        id: "tc2",
        user: "YannisEco",
        text: "True, but catching winter rains can fill cisterns for summer usage. A 50m2 roof can yield 20,000 liters in winter.",
        timestamp: "2h ago",
        reactions: { like: 18, dislike: 0, informed: 12, uninformed: 0, effective: 9, ineffective: 0 },
        replies: []
      }
    ]
  },
  {
    id: "t2",
    title: "Mobile dental clinics for remote mountainous parts of Epirus",
    description: "Elderly residents in Zagori and Tzoumerka have to travel hours for basic dental care. A cooperative mobile clinic van could visit bi-weekly. We should design a proposal to secure €50,000 in main pool funding.",
    creator: "DrDemos",
    timestamp: "12h ago",
    likes: 85,
    dislikes: 1,
    forumCategory: "health",
    stats: { informed: 4.8, effective: 4.7 },
    comments: [
      {
        id: "tc3",
        user: "EpirusLife",
        text: "This would make an incredible difference. My grandfather hasn't seen a dentist in 3 years because of transport issues.",
        timestamp: "10h ago",
        reactions: { like: 24, dislike: 0, informed: 10, uninformed: 0, effective: 15, ineffective: 0 },
        replies: []
      }
    ]
  },
  {
    id: "t5",
    title: "Cooperative solar EV micro-buses connecting small Thessaly farming villages",
    description: "Older farmers in the plains of Thessaly often lack transit between tiny farming communities and regional hubs. Let us launch a shared micro-grid fleet of community-owned autonomous/EV shuttles managed by our local agricultural cooperatives.",
    creator: "ThessalyGrower",
    timestamp: "18h ago",
    likes: 67,
    dislikes: 4,
    forumCategory: "transportation",
    stats: { informed: 4.4, effective: 4.2 },
    comments: []
  },
  {
    id: "t3",
    title: "Public registry of corporate lobbying meetings with parliament members",
    description: "Let's build a real-time decentralized tracker of all corporate lobby visits, keeping public records on IPFS. This would directly support our universal representatives and increase democratic transparency.",
    creator: "PolisTransparent",
    timestamp: "1d ago",
    likes: 112,
    dislikes: 4,
    forumCategory: "philosophy",
    stats: { informed: 4.5, effective: 4.3 },
    comments: [
      {
        id: "tc4",
        user: "NomosCoder",
        text: "This is brilliant. We can map the data directly to legislative drafts to see which lobbyists are writing the laws.",
        timestamp: "18h ago",
        reactions: { like: 35, dislike: 0, informed: 20, uninformed: 0, effective: 18, ineffective: 0 },
        replies: []
      }
    ]
  }
];

// Seed Firestore with baseline values if empty
async function seedDatabaseIfNeeded() {
  try {
    const ideasCollection = collection(db, "ideas");
    const ideasSnapshot = await getDocs(query(ideasCollection, limit(1)));
    if (ideasSnapshot.empty) {
      console.log("🚀 Firestore 'ideas' is empty. Seeding baseline ideas...");
      for (const idea of initialIdeas) {
        await setDoc(doc(db, "ideas", idea.id), idea);
      }
    }

    const threadsCollection = collection(db, "forumThreads");
    const threadsSnapshot = await getDocs(query(threadsCollection, limit(1)));
    if (threadsSnapshot.empty) {
      console.log("🚀 Firestore 'forumThreads' is empty. Seeding baseline discussions...");
      for (const thread of initialForumThreads) {
        await setDoc(doc(db, "forumThreads", thread.id), thread);
      }
    }
  } catch (error) {
    console.warn("⚠️ Baseline seeding failed on Firestore (using in-memory fallback):", error instanceof Error ? error.message : error);
    useMemoryFallback = true;
  }
}

// Reconstruct live vote/ratings trackers directly from Firestore to power the client views
async function loadTrackers() {
  const commentUserReactions: Record<string, Record<string, string[]>> = {};
  const ideaVotesTracker: Record<string, Record<string, 'up' | 'down'>> = {};
  const ideaRatingsTracker: Record<string, Record<string, { informed: number, effective: number }>> = {};
  const threadVotesTracker: Record<string, Record<string, 'like' | 'dislike'>> = {};
  const threadRatingsTracker: Record<string, Record<string, { informed: number, effective: number }>> = {};

  try {
    const [crSnap, ivSnap, irSnap, tvSnap, trSnap] = await Promise.all([
      getDocs(collection(db, "commentReactions")),
      getDocs(collection(db, "votes")),
      getDocs(collection(db, "ratings")),
      getDocs(collection(db, "forumVotes")),
      getDocs(collection(db, "forumRatings"))
    ]);

    crSnap.forEach(doc => {
      const data = doc.data();
      if (data.commentId && data.reaction && data.user) {
        if (!commentUserReactions[data.commentId]) {
          commentUserReactions[data.commentId] = {
            like: [], dislike: [], informed: [], uninformed: [], effective: [], ineffective: []
          };
        }
        if (!commentUserReactions[data.commentId][data.reaction]) {
          commentUserReactions[data.commentId][data.reaction] = [];
        }
        commentUserReactions[data.commentId][data.reaction].push(data.user);
      }
    });

    ivSnap.forEach(doc => {
      const data = doc.data();
      if (data.ideaId && data.user && data.direction) {
        if (!ideaVotesTracker[data.ideaId]) ideaVotesTracker[data.ideaId] = {};
        ideaVotesTracker[data.ideaId][data.user] = data.direction;
      }
    });

    irSnap.forEach(doc => {
      const data = doc.data();
      if (data.ideaId && data.user && typeof data.informed === 'number' && typeof data.effective === 'number') {
        if (!ideaRatingsTracker[data.ideaId]) ideaRatingsTracker[data.ideaId] = {};
        ideaRatingsTracker[data.ideaId][data.user] = { informed: data.informed, effective: data.effective };
      }
    });

    tvSnap.forEach(doc => {
      const data = doc.data();
      if (data.threadId && data.user && data.direction) {
        if (!threadVotesTracker[data.threadId]) threadVotesTracker[data.threadId] = {};
        threadVotesTracker[data.threadId][data.user] = data.direction;
      }
    });

    trSnap.forEach(doc => {
      const data = doc.data();
      if (data.threadId && data.user && typeof data.informed === 'number' && typeof data.effective === 'number') {
        if (!threadRatingsTracker[data.threadId]) threadRatingsTracker[data.threadId] = {};
        threadRatingsTracker[data.threadId][data.user] = { informed: data.informed, effective: data.effective };
      }
    });

  } catch (error) {
    console.error("Error loading trackers from Firestore:", error);
  }

  return {
    commentUserReactions,
    ideaVotesTracker,
    ideaRatingsTracker,
    threadVotesTracker,
    threadRatingsTracker
  };
}

// Find comments recursively across replies
const findCommentRecursive = (commentList: any[], commentId: string): any => {
  for (const c of commentList) {
    if (c.id === commentId) return c;
    if (c.replies && c.replies.length > 0) {
      const found = findCommentRecursive(c.replies, commentId);
      if (found) return found;
    }
  }
  return null;
};

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Run Seed logic immediately on startup
  await seedDatabaseIfNeeded();

  // --- API Handlers ---

  // Get all proposals
  app.get("/api/ideas", async (req, res) => {
    const { user = 'Citizen_M' } = req.query;
    try {
      const ideasCollection = collection(db, "ideas");
      const ideasSnapshot = await getDocs(ideasCollection);
      const ideasList: Idea[] = [];
      ideasSnapshot.forEach(doc => {
        ideasList.push(doc.data() as Idea);
      });

      const trackers = await loadTrackers();

      const mapCommentReactions = (comments: any[], u: string): any[] => {
        if (!comments) return [];
        return comments.map(c => {
          const reactionsMap = trackers.commentUserReactions[c.id] || {
            like: [], dislike: [], informed: [], uninformed: [], effective: [], ineffective: []
          };
          const userReactions = Object.keys(reactionsMap).filter(k => reactionsMap[k]?.includes(u));
          return {
            ...c,
            userReactions,
            replies: c.replies ? mapCommentReactions(c.replies, u) : []
          };
        });
      };

      const mapped = ideasList.map(i => ({
        ...i,
        comments: mapCommentReactions(i.comments || [], user as string)
      }));

      // Sort ideas by ID or custom sorting
      res.json(mapped.sort((a, b) => Number(b.id) - Number(a.id) || b.id.localeCompare(a.id)));
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch ideas" });
    }
  });

  // Submit a new idea/emergency situation
  app.post("/api/ideas", async (req, res) => {
    const { title, description, cost, creator, category, image } = req.body;
    if (!title || !description) {
      return res.status(400).json({ error: "Title and description are required" });
    }

    const defaultImages = {
      emergency: "https://images.unsplash.com/photo-1469571486040-4b9b17502b2a?w=800&q=80",
      political: "https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?w=800&q=80",
      main: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80"
    };

    const costVal = Number(cost) || 0;
    const seedFunding = Math.floor(costVal * 0.15);
    const newId = "idea_" + Math.random().toString(36).substring(2, 9);

    const newIdea: Idea = {
      id: newId,
      title,
      description,
      creator: creator || "Anonymous",
      cost: costVal,
      image: image || defaultImages[category as 'main' | 'emergency' | 'political'] || defaultImages.main,
      category: (category as 'main' | 'emergency' | 'political') || 'main',
      stats: {
        informed: 5.0,
        effective: 5.0
      },
      votes: 1,
      startingInvestedAmount: seedFunding,
      investedAmount: seedFunding,
      comments: [],
      upgrades: []
    };

    try {
      await setDoc(doc(db, "ideas", newId), newIdea);
      res.status(201).json(newIdea);
    } catch (error) {
      res.status(500).json({ error: "Failed to save proposal" });
    }
  });

  // Invest/pledge support to a project/idea
  app.post("/api/ideas/:id/invest", async (req, res) => {
    const { id } = req.params;
    const { amount } = req.body;
    try {
      const ideaRef = doc(db, "ideas", id);
      const ideaSnap = await getDoc(ideaRef);
      if (!ideaSnap.exists()) return res.status(404).json({ error: "Idea not found" });

      const idea = ideaSnap.data() as Idea;
      const investVal = Number(amount) || 0;
      idea.investedAmount = Math.min(idea.cost, (idea.investedAmount || 0) + investVal);

      await setDoc(ideaRef, idea);
      res.json({ success: true, idea });
    } catch (error) {
      res.status(500).json({ error: "Failed to process pledge" });
    }
  });

  // Propose a new upgrade
  app.post("/api/ideas/:id/upgrades", async (req, res) => {
    const { id } = req.params;
    const { user, title, description, cost } = req.body;
    try {
      const ideaRef = doc(db, "ideas", id);
      const ideaSnap = await getDoc(ideaRef);
      if (!ideaSnap.exists()) return res.status(404).json({ error: "Idea not found" });

      const idea = ideaSnap.data() as Idea;
      const newUpgrade = {
        id: "u_" + Math.random().toString(36).substring(2, 9),
        user: user || "Anonymous",
        title: title || "New Upgrade Proposal",
        description: description || "",
        cost: Number(cost) || idea.cost,
        timestamp: "Just now",
        status: "pending" as const
      };

      if (!idea.upgrades) idea.upgrades = [];
      idea.upgrades.push(newUpgrade);

      await setDoc(ideaRef, idea);
      res.json({ success: true, upgrade: newUpgrade });
    } catch (error) {
      res.status(500).json({ error: "Failed to create upgrade proposal" });
    }
  });

  // Accept upgrade (OP update)
  app.post("/api/ideas/:id/upgrades/:upgradeId/accept", async (req, res) => {
    const { id, upgradeId } = req.params;
    try {
      const ideaRef = doc(db, "ideas", id);
      const ideaSnap = await getDoc(ideaRef);
      if (!ideaSnap.exists()) return res.status(404).json({ error: "Idea not found" });

      const idea = ideaSnap.data() as Idea;
      if (!idea.upgrades) idea.upgrades = [];
      const upgrade = idea.upgrades.find(u => u.id === upgradeId);
      if (!upgrade) return res.status(404).json({ error: "Upgrade suggestion not found" });

      upgrade.status = "accepted";
      idea.title = upgrade.title;
      idea.description = upgrade.description;
      idea.cost = upgrade.cost;

      await setDoc(ideaRef, idea);
      res.json({ success: true, idea });
    } catch (error) {
      res.status(500).json({ error: "Failed to accept upgrade" });
    }
  });

  // Fork an idea to create a copy with this upgrade
  app.post("/api/ideas/:id/upgrades/:upgradeId/fork", async (req, res) => {
    const { id, upgradeId } = req.params;
    try {
      const originalIdeaRef = doc(db, "ideas", id);
      const originalIdeaSnap = await getDoc(originalIdeaRef);
      if (!originalIdeaSnap.exists()) return res.status(404).json({ error: "Original idea not found" });

      const originalIdea = originalIdeaSnap.data() as Idea;
      if (!originalIdea.upgrades) originalIdea.upgrades = [];
      const upgrade = originalIdea.upgrades.find(u => u.id === upgradeId);
      if (!upgrade) return res.status(404).json({ error: "Upgrade suggestion not found" });

      const newForkId = "idea_fork_" + Math.random().toString(36).substring(2, 9);
      const seedFunding = Math.floor(upgrade.cost * 0.15);
      
      const newForkIdea: Idea = {
        id: newForkId,
        title: upgrade.title,
        description: upgrade.description,
        creator: `${upgrade.user}`,
        cost: upgrade.cost,
        image: originalIdea.image,
        category: originalIdea.category,
        stats: {
          informed: 3.0,
          effective: 3.0
        },
        votes: 1,
        startingInvestedAmount: seedFunding,
        investedAmount: seedFunding,
        comments: [
          {
            id: "c_" + Math.random().toString(36).substring(2, 9),
            user: "System",
            text: `Forked from "${originalIdea.title}" with upgrade proposed by ${upgrade.user}.`,
            timestamp: "Just now",
            reactions: { like: 1, dislike: 0, informed: 1, uninformed: 0, effective: 1, ineffective: 0 },
            replies: []
          }
        ],
        parentId: originalIdea.id,
        parentTitle: originalIdea.title,
        upgrades: []
      };

      await setDoc(doc(db, "ideas", newForkId), newForkIdea);
      res.json({ success: true, newIdea: newForkIdea });
    } catch (error) {
      res.status(500).json({ error: "Failed to fork project" });
    }
  });

  // Submit comments directly to ideas
  app.post("/api/ideas/:id/comment", async (req, res) => {
    const { id } = req.params;
    const { text, user } = req.body;
    try {
      const ideaRef = doc(db, "ideas", id);
      const ideaSnap = await getDoc(ideaRef);
      if (!ideaSnap.exists()) return res.status(404).json({ error: "Idea not found" });

      const idea = ideaSnap.data() as Idea;
      const newComment = {
        id: "c_" + Math.random().toString(36).substring(2, 9),
        user: user || 'Anonymous',
        text,
        timestamp: 'Just now',
        reactions: { like: 0, dislike: 0, informed: 0, uninformed: 0, effective: 0, ineffective: 0 },
        replies: []
      };
      if (!idea.comments) idea.comments = [];
      idea.comments.push(newComment);

      await setDoc(ideaRef, idea);
      res.json(newComment);
    } catch (error) {
      res.status(500).json({ error: "Failed to submit comment" });
    }
  });

  // Update a swipe card/proposal title/description/image
  app.post("/api/ideas/:id/update", async (req, res) => {
    const { id } = req.params;
    const { title, description, image, user = 'Citizen_M' } = req.body;
    try {
      const ideaRef = doc(db, "ideas", id);
      const ideaSnap = await getDoc(ideaRef);
      if (!ideaSnap.exists()) return res.status(404).json({ error: "Proposal not found" });

      const idea = ideaSnap.data() as Idea;
      if (!idea.versions) {
        idea.versions = [];
      }

      idea.versions.push({
        id: "v_" + Math.random().toString(36).substring(2, 9),
        timestamp: "Version " + (idea.versions.length + 1) + " (Edited " + new Date().toLocaleTimeString() + ")",
        title: idea.title,
        description: idea.description,
        image: idea.image,
        editor: user
      });

      if (title) idea.title = title;
      if (description) idea.description = description;
      if (image) idea.image = image;

      await setDoc(ideaRef, idea);
      res.json({ success: true, idea });
    } catch (error) {
      res.status(500).json({ error: "Failed to update proposal details" });
    }
  });

  // Update comment (recursive)
  app.post("/api/ideas/:ideaId/comments/:commentId/update", async (req, res) => {
    const { ideaId, commentId } = req.params;
    const { text } = req.body;
    try {
      const ideaRef = doc(db, "ideas", ideaId);
      const ideaSnap = await getDoc(ideaRef);
      if (!ideaSnap.exists()) return res.status(404).json({ error: "Proposal not found" });

      const idea = ideaSnap.data() as Idea;
      const comment = findCommentRecursive(idea.comments || [], commentId);
      if (!comment) return res.status(404).json({ error: "Comment not found" });

      if (!comment.versions) {
        comment.versions = [];
      }

      comment.versions.push({
        id: "v_" + Math.random().toString(36).substring(2, 9),
        timestamp: comment.timestamp || "Original",
        text: comment.text,
        editor: comment.user
      });

      comment.text = text;
      comment.timestamp = "Updated just now";

      await setDoc(ideaRef, idea);
      res.json({ success: true, comment });
    } catch (error) {
      res.status(500).json({ error: "Failed to update comment text" });
    }
  });

  // Reply to nested comments in ideas
  app.post("/api/ideas/:ideaId/comments/:commentId/reply", async (req, res) => {
    const { ideaId, commentId } = req.params;
    const { text, user } = req.body;
    try {
      const ideaRef = doc(db, "ideas", ideaId);
      const ideaSnap = await getDoc(ideaRef);
      if (!ideaSnap.exists()) return res.status(404).json({ error: "Idea not found" });

      const idea = ideaSnap.data() as Idea;
      const comment = findCommentRecursive(idea.comments || [], commentId);
      if (!comment) return res.status(404).json({ error: "Comment not found" });

      const newReply = {
        id: "tc_" + Math.random().toString(36).substring(2, 9),
        user: user || 'Anonymous',
        text,
        timestamp: 'Just now',
        reactions: { like: 0, dislike: 0, informed: 0, uninformed: 0, effective: 0, ineffective: 0 },
        replies: []
      };

      if (!comment.replies) comment.replies = [];
      comment.replies.push(newReply);

      await setDoc(ideaRef, idea);
      res.json(newReply);
    } catch (error) {
      res.status(500).json({ error: "Failed to post nested reply" });
    }
  });

  // Vote on an Idea (Swipe Left/Right)
  app.post("/api/ideas/:id/vote", async (req, res) => {
    const { id } = req.params;
    const { direction, ratings, user = 'Citizen_M', intuitionPoints = 50 } = req.body;
    try {
      const ideaRef = doc(db, "ideas", id);
      const ideaSnap = await getDoc(ideaRef);
      if (!ideaSnap.exists()) return res.status(404).json({ error: "Idea not found" });

      const idea = ideaSnap.data() as Idea;
      const voteId = `${id}_${user}`;
      const voteRef = doc(db, "votes", voteId);
      const voteSnap = await getDoc(voteRef);

      const previousVote = voteSnap.exists() ? voteSnap.data().direction : null;
      const weight = parseFloat((1 + Math.max(0, Math.floor(intuitionPoints / 100) * 0.1)).toFixed(1));

      if (direction === 'up' || direction === 'down') {
        if (previousVote === direction) {
          // Toggle off
          await deleteDoc(voteRef);
          if (direction === 'up') {
            idea.votes = Math.max(0, parseFloat((idea.votes - weight).toFixed(1)));
          }
        } else {
          // Change vote or vote first time
          if (previousVote === 'up') {
            idea.votes = Math.max(0, parseFloat((idea.votes - weight).toFixed(1)));
          }
          if (direction === 'up') {
            idea.votes = parseFloat((idea.votes + weight).toFixed(1));
          }
          await setDoc(voteRef, { id: voteId, ideaId: id, user, direction });
        }
      }

      // Save user rating
      if (ratings && typeof ratings.informed === 'number' && typeof ratings.effective === 'number') {
        const ratingId = `${id}_${user}`;
        await setDoc(doc(db, "ratings", ratingId), {
          id: ratingId,
          ideaId: id,
          user,
          informed: ratings.informed,
          effective: ratings.effective
        });

        // Recalculate average ratings
        const ratingsQuery = query(collection(db, "ratings"), where("ideaId", "==", id));
        const ratingsSnap = await getDocs(ratingsQuery);
        const ratingsList: any[] = [];
        ratingsSnap.forEach(d => ratingsList.push(d.data()));

        if (ratingsList.length > 0) {
          const sumInformed = ratingsList.reduce((sum, r) => sum + r.informed, 0);
          const sumEffective = ratingsList.reduce((sum, r) => sum + r.effective, 0);
          idea.stats = {
            informed: parseFloat((sumInformed / ratingsList.length).toFixed(1)),
            effective: parseFloat((sumEffective / ratingsList.length).toFixed(1))
          };
        }
      }

      await setDoc(ideaRef, idea);

      const trackers = await loadTrackers();
      res.json({ 
        success: true, 
        votes: idea.votes, 
        userVote: trackers.ideaVotesTracker[id]?.[user] || null,
        stats: idea.stats 
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to record vote" });
    }
  });

  // React to comment on an Idea
  app.post("/api/ideas/:ideaId/comments/:commentId/react", async (req, res) => {
    const { ideaId, commentId } = req.params;
    const { reaction, user = 'Citizen_M' } = req.body;
    try {
      const ideaRef = doc(db, "ideas", ideaId);
      const ideaSnap = await getDoc(ideaRef);
      if (!ideaSnap.exists()) return res.status(404).json({ error: "Idea not found" });

      const idea = ideaSnap.data() as Idea;
      const comment = findCommentRecursive(idea.comments || [], commentId);
      if (!comment) return res.status(404).json({ error: "Comment not found" });

      const reactionId = `${commentId}_${reaction}_${user}`;
      const reactionRef = doc(db, "commentReactions", reactionId);
      const reactionSnap = await getDoc(reactionRef);

      if (!comment.reactions) {
        comment.reactions = { like: 0, dislike: 0, informed: 0, uninformed: 0, effective: 0, ineffective: 0 };
      }

      if (reactionSnap.exists()) {
        await deleteDoc(reactionRef);
        comment.reactions[reaction] = Math.max(0, (comment.reactions[reaction] || 0) - 1);
      } else {
        await setDoc(reactionRef, { id: reactionId, commentId, reaction, user });
        comment.reactions[reaction] = (comment.reactions[reaction] || 0) + 1;
      }

      await setDoc(ideaRef, idea);

      const trackers = await loadTrackers();
      const reactionsMap = trackers.commentUserReactions[commentId] || {};
      const userReactions = Object.keys(reactionsMap).filter(k => reactionsMap[k]?.includes(user));

      res.json({ 
        success: true, 
        reactions: comment.reactions, 
        userReactions 
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to apply reaction" });
    }
  });

  // --- Forum Thread Handlers ---

  // Get forum threads
  app.get("/api/forum", async (req, res) => {
    const { user = 'Citizen_M' } = req.query;
    try {
      const threadsSnapshot = await getDocs(collection(db, "forumThreads"));
      const threadsList: any[] = [];
      threadsSnapshot.forEach(d => threadsList.push(d.data()));

      const trackers = await loadTrackers();

      const mapCommentReactions = (comments: any[], u: string): any[] => {
        if (!comments) return [];
        return comments.map(c => {
          const reactionsMap = trackers.commentUserReactions[c.id] || {
            like: [], dislike: [], informed: [], uninformed: [], effective: [], ineffective: []
          };
          const userReactions = Object.keys(reactionsMap).filter(k => reactionsMap[k]?.includes(u));
          return {
            ...c,
            userReactions,
            replies: c.replies ? mapCommentReactions(c.replies, u) : []
          };
        });
      };

      const mapped = threadsList.map(t => ({
        ...t,
        userVote: trackers.threadVotesTracker[t.id]?.[user as string] || null,
        userRatings: trackers.threadRatingsTracker[t.id]?.[user as string] || null,
        comments: mapCommentReactions(t.comments || [], user as string)
      }));

      // Sort newest threads first
      res.json(mapped.sort((a, b) => b.id.localeCompare(a.id)));
    } catch (error) {
      res.status(500).json({ error: "Failed to retrieve forum discussions" });
    }
  });

  // Submit new forum thread
  app.post("/api/forum", async (req, res) => {
    const { title, description, creator, forumCategory } = req.body;
    if (!title || !description) {
      return res.status(400).json({ error: "Title and description are required" });
    }

    const newId = "t_" + Math.random().toString(36).substring(2, 9);
    const newThread = {
      id: newId,
      title,
      description,
      creator: creator || "Anonymous",
      forumCategory: forumCategory || "other",
      timestamp: "Just now",
      likes: 1,
      dislikes: 0,
      stats: {
        informed: 5.0,
        effective: 5.0
      },
      comments: []
    };

    try {
      await setDoc(doc(db, "forumThreads", newId), newThread);
      res.status(201).json(newThread);
    } catch (error) {
      res.status(500).json({ error: "Failed to post thread" });
    }
  });

  // Rate or Vote on a forum thread
  app.post("/api/forum/:id/rate", async (req, res) => {
    const { id } = req.params;
    const { direction, ratings, user = 'Citizen_M' } = req.body;
    try {
      const threadRef = doc(db, "forumThreads", id);
      const threadSnap = await getDoc(threadRef);
      if (!threadSnap.exists()) return res.status(404).json({ error: "Forum thread not found" });

      const thread = threadSnap.data() as any;
      const voteId = `${id}_${user}`;
      const voteRef = doc(db, "forumVotes", voteId);
      const voteSnap = await getDoc(voteRef);

      const prevVote = voteSnap.exists() ? voteSnap.data().direction : null;

      if (direction === 'like' || direction === 'dislike' || direction === null) {
        if (direction === null) {
          if (prevVote === 'like') {
            thread.likes = Math.max(0, thread.likes - 1);
          } else if (prevVote === 'dislike') {
            thread.dislikes = Math.max(0, thread.dislikes - 1);
          }
          await deleteDoc(voteRef);
        } else if (prevVote === direction) {
          await deleteDoc(voteRef);
          if (direction === 'like') {
            thread.likes = Math.max(0, thread.likes - 1);
          } else {
            thread.dislikes = Math.max(0, thread.dislikes - 1);
          }
        } else {
          if (prevVote === 'like') {
            thread.likes = Math.max(0, thread.likes - 1);
          } else if (prevVote === 'dislike') {
            thread.dislikes = Math.max(0, thread.dislikes - 1);
          }

          if (direction === 'like') {
            thread.likes++;
          } else {
            thread.dislikes++;
          }
          await setDoc(voteRef, { id: voteId, threadId: id, user, direction });
        }
      }

      if (ratings && typeof ratings.informed === 'number' && typeof ratings.effective === 'number') {
        const ratingId = `${id}_${user}`;
        await setDoc(doc(db, "forumRatings", ratingId), {
          id: ratingId,
          threadId: id,
          user,
          informed: ratings.informed,
          effective: ratings.effective
        });

        const rQuery = query(collection(db, "forumRatings"), where("threadId", "==", id));
        const rSnap = await getDocs(rQuery);
        const rList: any[] = [];
        rSnap.forEach(d => rList.push(d.data()));

        if (rList.length > 0) {
          const sumInformed = rList.reduce((sum, r) => sum + r.informed, 0);
          const sumEffective = rList.reduce((sum, r) => sum + r.effective, 0);
          thread.stats = {
            informed: parseFloat((sumInformed / rList.length).toFixed(1)),
            effective: parseFloat((sumEffective / rList.length).toFixed(1))
          };
        }
      }

      await setDoc(threadRef, thread);

      const trackers = await loadTrackers();
      res.json({
        success: true,
        likes: thread.likes,
        dislikes: thread.dislikes,
        stats: thread.stats,
        userVote: trackers.threadVotesTracker[id]?.[user] || null,
        userRatings: trackers.threadRatingsTracker[id]?.[user] || null
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to rate forum discussion" });
    }
  });

  // Comment on a forum thread
  app.post("/api/forum/:id/comment", async (req, res) => {
    const { id } = req.params;
    const { text, user } = req.body;
    try {
      const threadRef = doc(db, "forumThreads", id);
      const threadSnap = await getDoc(threadRef);
      if (!threadSnap.exists()) return res.status(404).json({ error: "Forum thread not found" });

      const thread = threadSnap.data() as any;
      const newComment = {
        id: "tc_" + Math.random().toString(36).substring(2, 9),
        user: user || 'Anonymous',
        text,
        timestamp: 'Just now',
        reactions: { like: 0, dislike: 0, informed: 0, uninformed: 0, effective: 0, ineffective: 0 },
        replies: []
      };

      if (!thread.comments) thread.comments = [];
      thread.comments.push(newComment);

      await setDoc(threadRef, thread);
      res.json(newComment);
    } catch (error) {
      res.status(500).json({ error: "Failed to submit comment" });
    }
  });

  // Reply to comments on a forum thread (recursive)
  app.post("/api/forum/:threadId/comment/:commentId/reply", async (req, res) => {
    const { threadId, commentId } = req.params;
    const { text, user = 'Citizen_M' } = req.body;
    try {
      const threadRef = doc(db, "forumThreads", threadId);
      const threadSnap = await getDoc(threadRef);
      if (!threadSnap.exists()) return res.status(404).json({ error: "Thread not found" });

      const thread = threadSnap.data() as any;
      const comment = findCommentRecursive(thread.comments || [], commentId);
      if (!comment) return res.status(404).json({ error: "Comment not found" });

      if (!comment.replies) {
        comment.replies = [];
      }

      const newReply = {
        id: "tc_" + Math.random().toString(36).substring(2, 9),
        user: user || 'Anonymous',
        text,
        timestamp: "Just now",
        reactions: { like: 0, dislike: 0, informed: 0, uninformed: 0, effective: 0, ineffective: 0 },
        replies: []
      };

      comment.replies.push(newReply);

      await setDoc(threadRef, thread);
      res.json({ success: true, reply: newReply });
    } catch (error) {
      res.status(500).json({ error: "Failed to post reply" });
    }
  });

  // React/Rate forum comments (recursive)
  app.post("/api/forum/:threadId/comment/:commentId/rate", async (req, res) => {
    const { threadId, commentId } = req.params;
    const { direction, ratings, user = 'Citizen_M' } = req.body;
    try {
      const threadRef = doc(db, "forumThreads", threadId);
      const threadSnap = await getDoc(threadRef);
      if (!threadSnap.exists()) return res.status(404).json({ error: "Thread not found" });

      const thread = threadSnap.data() as any;
      const comment = findCommentRecursive(thread.comments || [], commentId);
      if (!comment) return res.status(404).json({ error: "Comment not found" });

      if (!comment.reactions) {
        comment.reactions = { like: 0, dislike: 0, informed: 0, uninformed: 0, effective: 0, ineffective: 0 };
      }

      const reactionId = `${commentId}_${direction}_${user}`;
      const reactionRef = doc(db, "commentReactions", reactionId);
      const reactionSnap = await getDoc(reactionRef);

      if (direction === 'like' || direction === 'dislike') {
        if (reactionSnap.exists()) {
          await deleteDoc(reactionRef);
          comment.reactions[direction] = Math.max(0, (comment.reactions[direction] || 0) - 1);
        } else {
          await setDoc(reactionRef, { id: reactionId, commentId, reaction: direction, user });
          comment.reactions[direction] = (comment.reactions[direction] || 0) + 1;
        }
      }

      if (ratings) {
        if (ratings.informed === 'informed' || ratings.informed === 'uninformed') {
          const infId = `${commentId}_${ratings.informed}_${user}`;
          const infRef = doc(db, "commentReactions", infId);
          const infSnap = await getDoc(infRef);
          if (infSnap.exists()) {
            await deleteDoc(infRef);
            comment.reactions[ratings.informed] = Math.max(0, (comment.reactions[ratings.informed] || 0) - 1);
          } else {
            await setDoc(infRef, { id: infId, commentId, reaction: ratings.informed, user });
            comment.reactions[ratings.informed] = (comment.reactions[ratings.informed] || 0) + 1;
          }
        }
        if (ratings.effective === 'effective' || ratings.effective === 'ineffective') {
          const effId = `${commentId}_${ratings.effective}_${user}`;
          const effRef = doc(db, "commentReactions", effId);
          const effSnap = await getDoc(effRef);
          if (effSnap.exists()) {
            await deleteDoc(effRef);
            comment.reactions[ratings.effective] = Math.max(0, (comment.reactions[ratings.effective] || 0) - 1);
          } else {
            await setDoc(effRef, { id: effId, commentId, reaction: ratings.effective, user });
            comment.reactions[ratings.effective] = (comment.reactions[ratings.effective] || 0) + 1;
          }
        }
      }

      await setDoc(threadRef, thread);

      const trackers = await loadTrackers();
      const reactionsMap = trackers.commentUserReactions[commentId] || {};
      const userReactions = Object.keys(reactionsMap).filter(k => reactionsMap[k]?.includes(user));

      res.json({ success: true, comment, userReactions });
    } catch (error) {
      res.status(500).json({ error: "Failed to record comment feedback" });
    }
  });

  // Elevate a forum discussion thread to a live proposal (Swipe Queue)
  app.post("/api/forum/:id/elevate", async (req, res) => {
    const { id } = req.params;
    const { category = 'main', cost = 100000, image } = req.body;
    try {
      const threadRef = doc(db, "forumThreads", id);
      const threadSnap = await getDoc(threadRef);
      if (!threadSnap.exists()) return res.status(404).json({ error: "Forum thread not found" });

      const thread = threadSnap.data() as any;
      if (thread.elevatedToProposalId) {
        return res.status(400).json({ error: "Thread is already elevated to a proposal", proposalId: thread.elevatedToProposalId });
      }

      const defaultImages = {
        emergency: "https://images.unsplash.com/photo-1469571486040-4b9b17502b2a?w=800&q=80",
        political: "https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?w=800&q=80",
        main: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80"
      };

      const costVal = Number(cost) || 100000;
      const seedFunding = Math.floor(costVal * 0.15);

      const newIdeaId = "idea_elevated_" + Math.random().toString(36).substring(2, 9);
      const newIdea: Idea = {
        id: newIdeaId,
        title: thread.title,
        description: thread.description,
        creator: thread.creator,
        cost: costVal,
        image: image || defaultImages[category as 'main' | 'emergency' | 'political'] || defaultImages.main,
        category: category as 'main' | 'emergency' | 'political',
        stats: {
          informed: thread.stats.informed || 5.0,
          effective: thread.stats.effective || 5.0
        },
        votes: thread.likes || 1,
        startingInvestedAmount: seedFunding,
        investedAmount: seedFunding,
        comments: (thread.comments || []).map((c: any) => ({
          ...c,
          id: "c_" + Math.random().toString(36).substring(2, 9)
        })),
        upgrades: []
      };

      await setDoc(doc(db, "ideas", newIdeaId), newIdea);

      thread.elevatedToProposalId = newIdeaId;
      thread.category = category;
      await setDoc(threadRef, thread);

      // Save user notification to Firestore
      const noteId = "note_" + Math.random().toString(36).substring(2, 9);
      const newNote = {
        id: noteId,
        user: thread.creator,
        type: "elevation",
        title: "👑 Thread Elevated to Proposal!",
        message: `Your thread "${thread.title}" has been elevated to the live Swipe queue under the ${category === 'political' ? 'Socioeconomics' : category === 'emergency' ? 'Emergencies' : 'Main Pool'} registry!`,
        timestamp: "Just Now",
        read: false
      };
      await setDoc(doc(db, "notifications", noteId), newNote);

      res.json({ success: true, idea: newIdea });
    } catch (error) {
      res.status(500).json({ error: "Failed to elevate discussion" });
    }
  });

  // Get funding stats
  app.get("/api/funding-stats", async (req, res) => {
    try {
      const ideasCollection = collection(db, "ideas");
      const ideasSnapshot = await getDocs(ideasCollection);
      const ideasList: Idea[] = [];
      ideasSnapshot.forEach(doc => {
        ideasList.push(doc.data() as Idea);
      });

      const totalUsers = 125000;
      const fundedIdeas = ideasList.filter(i => i.votes > 5000);
      const totalCost = fundedIdeas.reduce((acc, i) => acc + i.cost, 0);

      res.json({
        totalUsers,
        totalCost,
        costPerUser: totalCost / totalUsers,
        fundedIdeasCount: fundedIdeas.length
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to get funding stats" });
    }
  });

  // Get notifications
  app.get("/api/notifications", async (req, res) => {
    const { user = 'Citizen_M' } = req.query;
    try {
      const notesCollection = collection(db, "notifications");
      const notesQuery = query(notesCollection, where("user", "==", user));
      const notesSnapshot = await getDocs(notesQuery);
      const notesList: any[] = [];
      notesSnapshot.forEach(doc => {
        notesList.push(doc.data());
      });

      if (notesList.length === 0) {
        // Return default welcome note
        const defaultNote = {
          id: "n_default1",
          user: user as string,
          type: "system",
          title: "⚡ Welcome to CivicSwipe Sandbox!",
          message: "Your voice directly guides direct-democracy proposals. Swipe on proposals, check out representative recommendations, or create a debate in the Deliberation Forum!",
          timestamp: "Just now",
          read: false
        };
        res.json([defaultNote]);
      } else {
        res.json(notesList);
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to get notifications" });
    }
  });

  // Clear notifications
  app.post("/api/notifications/clear", async (req, res) => {
    const { user = 'Citizen_M' } = req.body;
    try {
      const q = query(collection(db, "notifications"), where("user", "==", user));
      const snap = await getDocs(q);
      for (const d of snap.docs) {
        await deleteDoc(d.ref);
      }
      res.json({ success: true, notifications: [] });
    } catch (error) {
      res.status(500).json({ error: "Failed to clear notifications" });
    }
  });

  // Read notification
  app.post("/api/notifications/read", async (req, res) => {
    const { id, user = 'Citizen_M' } = req.body;
    try {
      await updateDoc(doc(db, "notifications", id), { read: true });

      const notesQuery = query(collection(db, "notifications"), where("user", "==", user));
      const notesSnapshot = await getDocs(notesQuery);
      const notesList: any[] = [];
      notesSnapshot.forEach(doc => {
        notesList.push(doc.data());
      });

      res.json({ success: true, notifications: notesList });
    } catch (error) {
      res.status(500).json({ error: "Failed to mark notification as read" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
