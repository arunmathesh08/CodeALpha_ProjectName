/**
 * Dynamic Avatar Resolution System
 * Automatically generates high-definition vector SVG Boy vs Girl avatars
 * and provides realistic curated portrait presets matching the modern UI style.
 */

export interface AvatarUserOptions {
  name?: string | null;
  gender?: string | null;
  email?: string | null;
  avatar?: string | null;
}

export interface AvatarPreset {
  id: string;
  name: string;
  gender: 'MALE' | 'FEMALE';
  url: string;
}

export const MALE_AVATAR_PRESETS: AvatarPreset[] = [
  {
    id: 'male-1',
    name: 'Alex (Short Brown Hair)',
    gender: 'MALE',
    url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80'
  },
  {
    id: 'male-2',
    name: 'Michael (Minimalist Studio)',
    gender: 'MALE',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80'
  },
  {
    id: 'male-3',
    name: 'David (Modern Undercut)',
    gender: 'MALE',
    url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&auto=format&fit=crop&q=80'
  },
  {
    id: 'male-4',
    name: 'Daniel (Professional Portrait)',
    gender: 'MALE',
    url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&auto=format&fit=crop&q=80'
  },
  {
    id: 'male-5',
    name: 'James (Curly Hair Casual)',
    gender: 'MALE',
    url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&auto=format&fit=crop&q=80'
  },
  {
    id: 'male-6',
    name: 'Ryan (Student Studio Portrait)',
    gender: 'MALE',
    url: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=200&auto=format&fit=crop&q=80'
  },
  {
    id: 'male-7',
    name: 'Lucas (Warm Creative)',
    gender: 'MALE',
    url: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=200&auto=format&fit=crop&q=80'
  },
  {
    id: 'male-8',
    name: 'Ethan (Clean Slate)',
    gender: 'MALE',
    url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&auto=format&fit=crop&q=80'
  }
];

export const FEMALE_AVATAR_PRESETS: AvatarPreset[] = [
  {
    id: 'female-1',
    name: 'Sophia (Studio Ambient Blue)',
    gender: 'FEMALE',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80'
  },
  {
    id: 'female-2',
    name: 'Sarah (High Bun Smile)',
    gender: 'FEMALE',
    url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80'
  },
  {
    id: 'female-3',
    name: 'Emma (Wavy Hair Headshot)',
    gender: 'FEMALE',
    url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80'
  },
  {
    id: 'female-4',
    name: 'Olivia (Modern Bob Cut)',
    gender: 'FEMALE',
    url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=200&auto=format&fit=crop&q=80'
  },
  {
    id: 'female-5',
    name: 'Maya (Long Flowing Hair)',
    gender: 'FEMALE',
    url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80'
  },
  {
    id: 'female-6',
    name: 'Zoe (Curly Chic)',
    gender: 'FEMALE',
    url: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=200&auto=format&fit=crop&q=80'
  },
  {
    id: 'female-7',
    name: 'Chloe (Ponytail Casual)',
    gender: 'FEMALE',
    url: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=200&auto=format&fit=crop&q=80'
  },
  {
    id: 'female-8',
    name: 'Lily (Straight Hair Studio)',
    gender: 'FEMALE',
    url: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=200&auto=format&fit=crop&q=80'
  }
];

export const ALL_AVATAR_PRESETS: AvatarPreset[] = [
  ...MALE_AVATAR_PRESETS,
  ...FEMALE_AVATAR_PRESETS
];

const FEMALE_NAMES = new Set([
  'sarah', 'sara', 'emma', 'olivia', 'sophia', 'sofia', 'ava', 'isabella', 'mia', 'charlotte',
  'amelia', 'harper', 'evelyn', 'abigail', 'emily', 'elizabeth', 'mila', 'ella', 'avery',
  'camila', 'aria', 'scarlett', 'victoria', 'madison', 'luna', 'grace', 'chloe', 'penelope',
  'layla', 'riley', 'zoey', 'zoe', 'nora', 'lily', 'eleanor', 'hannah', 'lillian', 'addison',
  'aubrey', 'ellie', 'stella', 'natalie', 'leah', 'hazel', 'violet', 'aurora', 'savannah',
  'audrey', 'brooklyn', 'bella', 'claire', 'skylar', 'lucy', 'paisley', 'everly', 'anna',
  'caroline', 'nova', 'genesis', 'emilia', 'kennedy', 'samantha', 'maya', 'willow', 'kinsley',
  'naomi', 'aaliyah', 'elena', 'priya', 'ananya', 'deepa', 'divya', 'pooja', 'sneha', 'neha',
  'kavita', 'shreya', 'swati', 'sunita', 'radha', 'rita', 'geeta', 'meena', 'anita', 'mary',
  'patricia', 'jennifer', 'linda', 'barbara', 'susan', 'jessica', 'karen', 'nancy', 'lisa',
  'betty', 'margaret', 'sandra', 'ashley', 'kimberly', 'donna', 'carol', 'michelle', 'dorothy',
  'amanda', 'melissa', 'deborah', 'stephanie', 'rebecca', 'sharon', 'laura', 'cynthia',
  'kathleen', 'amy', 'shirley', 'angela', 'helen', 'brenda', 'pamela', 'nicole', 'ruth',
  'katherine', 'christine', 'debra', 'rachel', 'carolyn', 'janet', 'maria', 'heather', 'diane',
  'virginia', 'julie', 'joyce', 'kelly', 'christina', 'joan', 'judith', 'megan', 'cheryl',
  'andrea', 'martha', 'jacqueline', 'frances', 'gloria', 'ann', 'teresa', 'kathryn', 'janice',
  'jean', 'alice', 'doris', 'julia', 'judy', 'denise', 'amber', 'marilyn', 'beverly',
  'danielle', 'theresa', 'marie', 'diana', 'brittany', 'rose', 'kayla', 'alexis', 'lilly',
  'shree', 'lakshmi', 'monica', 'phoebe', 'daenerys', 'elsa', 'jasmine', 'cinderella',
  'ariel', 'mulan', 'belle', 'tiana', 'merida', 'moana', 'rapunzel', 'barbie', 'katniss',
  'hermione', 'girl', 'female', 'woman', 'lady', 'she', 'her', 'miss', 'mrs', 'ms', 'madam', 'sathya'
]);

const MALE_NAMES = new Set([
  'arun', 'alex', 'michael', 'john', 'david', 'james', 'robert', 'william', 'joseph',
  'charles', 'thomas', 'daniel', 'matthew', 'anthony', 'mark', 'donald', 'steven', 'paul',
  'andrew', 'joshua', 'kenneth', 'kevin', 'brian', 'george', 'timothy', 'ronald', 'jason',
  'edward', 'jeffrey', 'ryan', 'jacob', 'gary', 'nicholas', 'eric', 'jonathan', 'stephen',
  'larry', 'justin', 'scott', 'brandon', 'benjamin', 'samuel', 'gregory', 'alexander',
  'frank', 'patrick', 'raymond', 'jack', 'dennis', 'jerry', 'tyler', 'aaron', 'jose',
  'adam', 'nathan', 'henry', 'douglas', 'zachary', 'peter', 'kyle', 'walter', 'ethan',
  'jeremy', 'harold', 'keith', 'christian', 'roger', 'noah', 'gerald', 'carl', 'terry',
  'sean', 'austin', 'arthur', 'lawrence', 'jesse', 'dylan', 'bryan', 'joe', 'jordan',
  'billy', 'albert', 'bruce', 'willie', 'gabriel', 'logan', 'alan', 'juan', 'wayne',
  'roy', 'ralph', 'randy', 'eugene', 'vincent', 'russell', 'louis', 'philip', 'bobby',
  'johnny', 'rahul', 'rohit', 'amit', 'vijay', 'sanjay', 'raj', 'rajesh', 'vikram',
  'ajay', 'ramesh', 'suresh', 'manoj', 'alok', 'anil', 'deepak', 'karan', 'varun',
  'karthik', 'prasad', 'naveen', 'chandler', 'ross', 'harry', 'ron', 'luke', 'anakin',
  'tony', 'clark', 'steve', 'thor', 'mathesh', 'boy', 'male', 'man', 'guy', 'dude', 'mr', 'he', 'him', 'sir'
]);

/**
 * Accurately determines if the user is Female / Girl based on explicit gender or name heuristics
 */
export function isFemaleUser(userOrName?: AvatarUserOptions | string | null, explicitGender?: string | null): boolean {
  const genderToCheck = explicitGender || (typeof userOrName === 'object' && userOrName !== null ? userOrName.gender : null);
  
  if (genderToCheck) {
    const g = String(genderToCheck).trim().toLowerCase();
    if (['female', 'girl', 'woman', 'f', 'lady', 'she'].includes(g)) return true;
    if (['male', 'boy', 'man', 'm', 'he', 'guy'].includes(g)) return false;
  }

  const nameStr = typeof userOrName === 'object' && userOrName !== null 
    ? (userOrName.name || userOrName.email?.split('@')[0] || '')
    : (userOrName || '');

  return isFemaleNameString(nameStr);
}

function isFemaleNameString(nameStr: string): boolean {
  if (!nameStr) return false;
  const clean = nameStr.trim().toLowerCase();

  // Direct exact keyword matches
  if (/\b(female|girl|woman|lady|miss|mrs|ms|she|her|queen|princess)\b/i.test(clean)) return true;
  if (/\b(male|boy|man|guy|mr|he|him|dude|bro|sir|king|prince)\b/i.test(clean)) return false;

  const parts = clean.split(/[\s._-]+/);
  
  // Check tokens against name dictionaries
  for (const part of parts) {
    if (FEMALE_NAMES.has(part)) return true;
    if (MALE_NAMES.has(part)) return false;
  }

  // Suffix heuristic for common feminine name endings
  const firstName = parts[0] || clean;
  if (
    firstName.endsWith('a') || 
    firstName.endsWith('ee') || 
    firstName.endsWith('ya') || 
    firstName.endsWith('ita') || 
    firstName.endsWith('ina') ||
    firstName.endsWith('ette') ||
    firstName.endsWith('elle')
  ) {
    if (['joshua', 'ezra', 'luca', 'luka', 'elijah', 'isaiah'].includes(firstName)) {
      return false;
    }
    return true;
  }

  return false;
}

/**
 * Generates an ultra-crisp, self-contained SVG Boy profile avatar
 */
export function createBoySvg(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  const hue = Math.abs(hash % 40) + 210; // Royal blues / Indigo spectrum

  return `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="100%" height="100%">
  <defs>
    <linearGradient id="bgG" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="hsl(${hue}, 85%, 58%)" />
      <stop offset="100%" stop-color="hsl(${hue + 35}, 90%, 42%)" />
    </linearGradient>
    <linearGradient id="skinG" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ffd5b5" />
      <stop offset="100%" stop-color="#f7b788" />
    </linearGradient>
    <linearGradient id="shirtG" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#3b82f6" />
      <stop offset="100%" stop-color="#1d4ed8" />
    </linearGradient>
    <linearGradient id="hairG" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#2d3748" />
      <stop offset="100%" stop-color="#1a202c" />
    </linearGradient>
  </defs>

  <circle cx="60" cy="60" r="60" fill="url(#bgG)" />
  <circle cx="60" cy="60" r="56" fill="white" opacity="0.1" />

  <path d="M22 120 C22 92 40 84 60 84 C80 84 98 92 98 120 Z" fill="url(#shirtG)" />
  <path d="M50 84 L60 98 L70 84 Z" fill="#ffd5b5" />
  <path d="M60 98 L60 120" stroke="#60a5fa" stroke-width="2.5" stroke-linecap="round" />

  <rect x="52" y="68" width="16" height="18" rx="4" fill="url(#skinG)" />

  <circle cx="37" cy="55" r="7" fill="url(#skinG)" />
  <circle cx="83" cy="55" r="7" fill="url(#skinG)" />

  <ellipse cx="60" cy="53" rx="23" ry="26" fill="url(#skinG)" />

  <path d="M35 48 C34 33 42 22 60 22 C78 22 86 33 85 48 C85 48 80 34 68 34 C56 34 50 40 35 48 Z" fill="url(#hairG)" />
  <path d="M48 24 C58 17 72 20 78 26 C82 30 84 38 85 44 C81 38 73 33 62 33 C49 33 44 40 40 44 C42 36 44 28 48 24 Z" fill="#4a5568" opacity="0.5" />

  <path d="M45 44 Q51 41 55 43" stroke="#2d3748" stroke-width="2.5" stroke-linecap="round" fill="none" />
  <path d="M65 43 Q69 41 75 44" stroke="#2d3748" stroke-width="2.5" stroke-linecap="round" fill="none" />

  <ellipse cx="50" cy="50" rx="3" ry="3.5" fill="#1e293b" />
  <circle cx="49" cy="49" r="1" fill="#ffffff" />
  <ellipse cx="70" cy="50" rx="3" ry="3.5" fill="#1e293b" />
  <circle cx="69" cy="49" r="1" fill="#ffffff" />

  <path d="M59 51 Q60 56 63 56" stroke="#e29b68" stroke-width="1.8" stroke-linecap="round" fill="none" />
  <path d="M51 63 Q60 70 69 63" stroke="#9a3412" stroke-width="2.2" stroke-linecap="round" fill="none" />
</svg>
`)}`;
}

/**
 * Generates an ultra-crisp, self-contained SVG Girl profile avatar
 */
export function createGirlSvg(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  const hue = Math.abs(hash % 35) + 325; // Pink / Rose / Violet spectrum

  return `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="100%" height="100%">
  <defs>
    <linearGradient id="bgGirl" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="hsl(${hue}, 85%, 62%)" />
      <stop offset="100%" stop-color="hsl(${hue + 40}, 85%, 46%)" />
    </linearGradient>
    <linearGradient id="skinGirl" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ffe2cc" />
      <stop offset="100%" stop-color="#f8c39f" />
    </linearGradient>
    <linearGradient id="dressG" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ec4899" />
      <stop offset="100%" stop-color="#a855f7" />
    </linearGradient>
    <linearGradient id="girlHairG" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#4a2810" />
      <stop offset="100%" stop-color="#2c1507" />
    </linearGradient>
  </defs>

  <circle cx="60" cy="60" r="60" fill="url(#bgGirl)" />
  <circle cx="60" cy="60" r="56" fill="white" opacity="0.12" />

  <path d="M28 48 C24 72 26 100 38 120 L82 120 C94 100 96 72 92 48 C92 25 28 25 28 48 Z" fill="url(#girlHairG)" />

  <path d="M24 120 C24 94 40 86 60 86 C80 86 96 94 96 120 Z" fill="url(#dressG)" />
  <path d="M48 86 Q60 100 72 86 Z" fill="#ffe2cc" />

  <rect x="53" y="68" width="14" height="20" rx="4" fill="url(#skinGirl)" />

  <path d="M50 86 Q60 93 70 86" stroke="#fbcfe8" stroke-width="2" stroke-dasharray="3,3" fill="none" />

  <circle cx="36" cy="55" r="6" fill="url(#skinGirl)" />
  <circle cx="84" cy="55" r="6" fill="url(#skinGirl)" />
  <circle cx="36" cy="62" r="2.5" fill="#fbbf24" />
  <circle cx="84" cy="62" r="2.5" fill="#fbbf24" />

  <ellipse cx="60" cy="53" rx="22" ry="25" fill="url(#skinGirl)" />

  <path d="M36 46 C34 26 44 19 60 19 C76 19 86 26 84 46 C79 32 68 31 60 38 C52 31 41 32 36 46 Z" fill="url(#girlHairG)" />
  <path d="M35 44 Q31 65 37 80 Q39 65 39 48 Z" fill="url(#girlHairG)" />
  <path d="M85 44 Q89 65 83 80 Q81 65 81 48 Z" fill="url(#girlHairG)" />

  <path d="M45 44 Q50 40 55 42" stroke="#4a2810" stroke-width="1.8" stroke-linecap="round" fill="none" />
  <path d="M65 42 Q70 40 75 44" stroke="#4a2810" stroke-width="1.8" stroke-linecap="round" fill="none" />

  <ellipse cx="50" cy="50" rx="3.2" ry="3.8" fill="#1e293b" />
  <circle cx="49" cy="49" r="1.3" fill="#ffffff" />
  <path d="M47 47 L44 45" stroke="#1e293b" stroke-width="1.5" stroke-linecap="round" />
  <path d="M51 46 L51 44" stroke="#1e293b" stroke-width="1.5" stroke-linecap="round" />

  <ellipse cx="70" cy="50" rx="3.2" ry="3.8" fill="#1e293b" />
  <circle cx="69" cy="49" r="1.3" fill="#ffffff" />
  <path d="M73 47 L76 45" stroke="#1e293b" stroke-width="1.5" stroke-linecap="round" />
  <path d="M69 46 L69 44" stroke="#1e293b" stroke-width="1.5" stroke-linecap="round" />

  <circle cx="44" cy="56" r="3.5" fill="#f43f5e" opacity="0.3" />
  <circle cx="76" cy="56" r="3.5" fill="#f43f5e" opacity="0.3" />

  <path d="M59 52 Q60 55 62 55" stroke="#e29b68" stroke-width="1.6" stroke-linecap="round" fill="none" />
  <path d="M52 63 Q60 70 68 63" stroke="#e11d48" stroke-width="2.2" stroke-linecap="round" fill="none" />
</svg>
`)}`;
}

/**
 * Main function to get the dynamic profile avatar for any user or name.
 */
export function getUserAvatar(userOrName?: AvatarUserOptions | string | null, fallbackName = 'User'): string {
  if (
    typeof userOrName === 'object' && 
    userOrName !== null && 
    userOrName.avatar && 
    !userOrName.avatar.includes('api.dicebear.com')
  ) {
    return userOrName.avatar;
  }

  const name = (typeof userOrName === 'object' && userOrName !== null ? userOrName.name : userOrName) || fallbackName;
  const isFemale = isFemaleUser(userOrName);

  if (isFemale) {
    return createGirlSvg(name || 'Girl');
  } else {
    return createBoySvg(name || 'Boy');
  }
}
