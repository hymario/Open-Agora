/**
 * Civic Numbering System for the Hellenic Direct Democracy Portal.
 * Simplified as requested: forget the letters, just numbers.
 * - Me (the user, index 0) gets: "0" (Totality/Source).
 * - All other IDs or quantities represent their standard numeric values.
 */

/**
 * Returns the deep pure-civic representation (just the string of the number).
 */
export function getDeepCivicCode(num: number): string {
  return num.toString();
}

/**
 * Returns the alternate/hybrid representation (just the string of the number).
 */
export function getAlternateCivicCode(num: number): string {
  return num.toString();
}

/**
 * Formats a number beautifully using the Hellenic Civic system.
 * Example:
 * - 0 -> "0 (Me)"
 * - 25 -> "25"
 * - 20025 -> "20,025"
 */
export function formatCivicNumber(num: number): string {
  if (num === 0) return "0 (Me)";
  return num.toLocaleString();
}

const USER_MAPPING: Record<string, number> = {
  'hazizimarios98': 0,
  'Citizen_M': 0,
  'EcoRoot': 1,
  'CivicFlow': 2,
  'BlueAnchor': 3,
  'UrbanistA': 4,
  'HeleneVoter': 5,
  'AthensNode': 6,
  'SpartanVoter': 7,
  'ZKP_Nodes': 8,
  'MeshSkeptic': 9,
  'SolarSphere': 10,
  'EcoDemos': 11,
  'Koinotis': 12,
  'SolarLearn': 13,
  'PureDemocracy': 14,
  'BioLedger': 15,
  'IgnisShield': 16,
  'DemosSort': 17,
  'System': 24,
  'Anonymous': 25,
};

/**
 * Maps any user/representative/participant name to a stable Civic ID number.
 */
export function getUserCivicNumber(username: string): number {
  const normalized = username.trim();
  if (USER_MAPPING[normalized] !== undefined) {
    return USER_MAPPING[normalized];
  }
  // Stable fallback hash between 26 and 9999
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    hash = normalized.charCodeAt(i) + ((hash << 5) - hash);
  }
  return (Math.abs(hash) % 9974) + 26;
}

/**
 * Returns a beautiful badge code for the user (just the number prefixed with #).
 */
export function getUserCivicBadge(username: string): string {
  const num = getUserCivicNumber(username);
  return `#${num}`;
}

const REAL_NAMES: Record<string, string> = {
  'hazizimarios98': "Marios Hazizis",
  'Citizen_M': "Marios Hazizis",
  'EcoRoot': "Sophia Papadaki",
  'CivicFlow': "Giorgos Dimitriadis",
  'BlueAnchor': "Eleni Kostopoulou",
  'UrbanistA': "Nikos Stefanatos",
  'HeleneVoter': "Helene Venizelou",
  'AthensNode': "Dimitris Pappas",
  'SpartanVoter': "Leonidas Karas",
  'ZKP_Nodes': "Andreas Georgiou",
  'MeshSkeptic': "Ioanna Mavrou",
  'SolarSphere': "Konstantinos Sgouras",
  'EcoDemos': "Vasilis Makris",
  'Koinotis': "Maria Spanou",
  'SolarLearn': "Thanasis Lalas",
  'PureDemocracy': "Spyros Filippou",
  'BioLedger': "Georgia Petrou",
  'IgnisShield': "Pavlos Fotopoulos",
  'DemosSort': "Alkiviadis Synodinos",
  'System': "System Ledger",
  'Anonymous': "Anonymous Citizen"
};

/**
 * Returns the real name of a user for friend transparency.
 */
export function getUserRealName(username: string): string {
  const normalized = username.trim();
  if (REAL_NAMES[normalized] !== undefined) {
    return REAL_NAMES[normalized];
  }
  // Fallback real name based on username
  const cleanName = normalized.replace(/[^a-zA-Z0-9]/g, ' ');
  return cleanName.charAt(0).toUpperCase() + cleanName.slice(1) + " (Citizen)";
}

