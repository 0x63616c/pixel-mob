// =============================================================================
// Pixel Office — src/data/company.js   (DATA agent)
// The single up-front definition of the whole world. Pure data + a deterministic
// builder (no Math.random, no DOM). Severance-style pivot: infinite white void,
// furniture islands, an elevator as the only way in/out, 24/7 work.
//
//   import data, { calendarFor, DAYS, toMin, fromMin } from './data/company.js';
//
// SCHEMA (full version + rationale: /CONTRACT-data.md)
// -----------------------------------------------------------------------------
// Coordinates are TILES (1 tile = 16 px). rect = {x,y,w,h} covers x..x+w-1.
// facing: "up"|"down"|"left"|"right" (direction the person LOOKS on that tile).
// Times "HH:MM" (24h; "24:00" allowed as an end). Items never cross midnight.
// Days "mon".."sun". 24/7: nobody leaves; weekends run the same rhythm.
//
// default export {
//   meta:    { tileSize, startTime, startDay, days, version }
//   company: { name, tagline, mission, product, productDescription, stage, version,
//              founded, founder:{name,title,portraitQuote}, values[], quotas[], rivalries[], prizes[] }
//   orgs:    [{ id, name, leadId }]
//   teams:   [{ id, name, shortName, org, color, sectionId, leadId, standup:{time,roomId}, quota:{label,start} }]
//   people:  [{ id, name, first, pronouns, role, teamId, org, managerId, deskId,
//               kind:"staff"|"receptionist"|"cleaner"|"security",
//               arrive:"HH:MM" (day-1 elevator arrival only), leave:null (24/7),
//               traits[], needs:{energy,hunger,social,stress,focus} 0..1,
//               look:{skin,hair,hairStyle,shirt,pants,shoes,accessory,extra?,outfit},
//               belongings[], quirk, task, seed, calendar:[CalItem] }]
//   CalItem: { start, end, title, type, roomId, attendees[], organizerId?, days?[],
//              eventId?, mismatch?, visitors?[] }
//            roomId = rooms[].id | layout.poi key | "desk" | "floor"
//            days omitted = every day.  calendarFor(person, day) filters + sorts.
//   visitors:[{ id, name, kind:"visitor"|"courier", purpose, day, arrive, leave, hostId, look, calendar[] }]
//   pets:    [{ id, name, species, look, bed, traits, quirk, appearsFromNowhere? }]
//   layout:  { w, h, tileSize, legend, tiles[], blocked[], sections[], tables[], desks[],
//              furniture[], poi{}, queues{}, elevator{}, signs[], voidProps[],
//              patrolRoute[], tidyRoute[], wanderSpots[], muster{rect,tiles[]} }
//   rooms:   [{ id, name, size:"booth"|"huddle"|"team"|"boardroom"|"allhands"|"special",
//               capacity, rect, interior, doorTile, waitTiles[], seats[{x,y,facing}],
//               standTiles?, sign:{x,y,text}, purpose? }]
//   events:  [{ id, name, kind, manual, panel?, schedule?, chance?, window?, cooldown,
//               trigger?, location:{type,ref?}, radius|null, duration, participants?,
//               effects:{needs,output,progress?,version?}, joinBehavior, anim:{join,react},
//               emotes[], lineKey, gossipable, reactions:{default:{join,ignore,gossip,flee}, <trait>:{...}},
//               chainsTo:[{id,delay,chance}], tickerTemplates[] }]
//   lines:   { bubbles:{<context|eventId>:[str]}, ticker:{<eventId|context>:[tpl]},
//              signs[], founderQuotes[], wellnessFacts[], tasks:{<teamId>|default:[str]}, memoHeaders[] }
// }
// Ticker/bubble placeholders: {name} {other} {room} {team} {title} {version} {prize} {quota} {time} {n}
// =============================================================================

import {
  LEGEND_EXTRA, relocateVoidProps, addIslands, paintExtra,
  addMeetings, ensureDirector, moreEvents, idleActions, applyPeopleExtras,
  buildObjects, mergeLines, FISH,
} from "./expand.js";

export const DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
export const WEEKDAYS = ["mon", "tue", "wed", "thu", "fri"];
export const toMin = (t) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };
export const fromMin = (m) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;

/** Calendar for one person on one day ("mon".."sun"), sorted by start. */
export function calendarFor(person, day) {
  return (person.calendar || [])
    .filter((it) => !it.days || it.days.includes(day))
    .sort((a, b) => toMin(a.start) - toMin(b.start));
}

// deterministic PRNG (mulberry32) for build-time variety only
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const hash = (s) => { let h = 2166136261; for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; };

// -----------------------------------------------------------------------------
// COMPANY
// -----------------------------------------------------------------------------
const company = {
  name: "Plenum Industries",
  tagline: "We refine. We align. We are grateful.",
  mission: "To bring the numbers into alignment, for reasons that will become clear.",
  product: "The Outputs™",
  productDescription:
    "An end-to-end, AI-native, mission-critical platform for outputs that need refining. Enterprise-ready. Purpose undisclosed. Customers love it (we assume).",
  stage: "Series C (Spiritual)",
  version: "0.41.7",
  founded: 1891,
  hq: "Floor 0, The Void",
  founder: {
    name: "Cornelius T. Plenum",
    title: "Founder, Visionary, Portrait",
    portraitQuote: "A number left unrefined is a number left alone. Do not leave them alone.",
  },
  values: [
    "Alignment is its own reward.",
    "Please enjoy each metric equally.",
    "Gratitude scales.",
    "Ship calmly.",
    "The numbers know when you are tired.",
    "Bias for action. Bias for more action.",
  ],
  quotas: [], // filled from teams below
  rivalries: [
    { a: "producteng", b: "data", name: "Refinement vs Calibration" },
    { a: "sales", b: "marketing", name: "Who Gets Credit For The Logo" },
    { a: "platform", b: "infra", name: "Whose Fault Is The Latency" },
  ],
  prizes: [
    { id: "melon-hour", name: "Melon Hour", emoji: "🍈", desc: "One (1) hour of supervised melon." },
    { id: "finger-trap-social", name: "Finger-Trap Social", emoji: "🪢", desc: "Mingle. You may not leave until you relax." },
    { id: "waffle-ceremony", name: "Waffle Ceremony", emoji: "🧇", desc: "Syrup is distributed in order of tenure." },
    { id: "eraser-gala", name: "Eraser Gala", emoji: "🩹", desc: "Everyone receives a novelty eraser. Some are shaped like the Founder." },
    { id: "caricature-hour", name: "Caricature Hour", emoji: "🖼️", desc: "A pencil artist draws you looking more grateful than you are." },
    { id: "chime-of-recognition", name: "The Chime of Recognition", emoji: "🔔", desc: "A small bell is rung near you. Once." },
  ],
};

const orgs = [
  { id: "exec", name: "The Office of the Founder's Vision", leadId: "margot" },
  { id: "eng", name: "Engineering", leadId: "dev" },
  { id: "product", name: "Product", leadId: "clara" },
  { id: "design", name: "Design", leadId: "yuki" },
  { id: "gtm", name: "Go-To-Market", leadId: "chad" },
  { id: "ops", name: "Operations", leadId: "bianca" },
  { id: "support", name: "Support", leadId: "destiny" },
];

// teams: standup time is when the daily standup is booked (room chosen by the builder)
const TEAM_DEFS = [
  ["exec", "Office of the Founder's Vision", "Exec", "exec", "#2f3b52", "sec-vista", "margot", "10:00", "Visionary Clarity Index"],
  ["platform", "Foundational Alignment", "Platform", "eng", "#3f7d6e", "sec-shelf", "hiroshi", "11:30", "Abstractions Aligned"],
  ["infra", "Continuity & Uptime", "Infra", "eng", "#5a6fa8", "sec-shelf", "ingrid", "09:30", "Nines of Uptime"],
  ["producteng", "Product Refinement", "Product Eng", "eng", "#c2703d", "sec-row", "sofia", "11:30", "Q4 Refinement"],
  ["data", "Output Calibration", "Data/AI", "eng", "#7b5ea7", "sec-commons", "analucia", "10:15", "Outputs Calibrated"],
  ["product", "Intent Stewardship", "Product", "product", "#d4a23a", "sec-row", "clara", "10:30", "Intents Stewarded"],
  ["design", "Aesthetic Compliance", "Design", "design", "#d16a8e", "sec-commons", "yuki", "10:45", "Corners Rounded"],
  ["sales", "Gratitude Acquisition", "Sales", "gtm", "#3c8dbc", "sec-floor", "chad", "09:15", "Gratitude Booked"],
  ["marketing", "Message Harmony", "Marketing", "gtm", "#e07a5f", "sec-floor", "olivia", "10:30", "Messages Harmonized"],
  ["people", "Wellbeing & Belonging", "People", "ops", "#81a96b", "sec-ring", "grace", "09:45", "Belonging Delivered"],
  ["finance", "Numbers Custody", "Finance", "ops", "#4e7f8c", "sec-ring", "henrik", "09:00", "Receipts Reconciled"],
  ["workplace", "Spatial Serenity", "Workplace", "ops", "#9c8a6b", "sec-vista", "martin", "08:30", "Snacks Stocked"],
  ["support", "Customer Reassurance", "Support", "support", "#4fa3a5", "sec-ring", "destiny", "11:15", "Customers Reassured"],
];
const teams = TEAM_DEFS.map(([id, name, shortName, org, color, sectionId, leadId, standup, quota], i) => ({
  id, name, shortName, org, color, sectionId, leadId,
  standup: { time: standup, roomId: null /* filled by builder */ },
  quota: { label: `${quota}`, start: [0.73, 0.41, 0.88, 0.73, 0.69, 0.52, 0.6, 0.35, 0.47, 0.8, 0.95, 0.64, 0.58][i] },
}));
company.quotas = teams.map((t) => ({ teamId: t.id, label: `Q4 ${t.quota.label}`, target: 1, start: t.quota.start }));

// -----------------------------------------------------------------------------
// PEOPLE — 50 staff (incl. receptionist) + 2 Facilities (cleaner) + 1 Floor Supervisor (security)
// -----------------------------------------------------------------------------
const SKIN = ["#f6d7c3", "#efc3a4", "#e0ac8a", "#c68863", "#a5694a", "#7d4b32", "#5a3423"];
const HAIR = {
  black: "#1f1a17", dark: "#3b2a20", brown: "#6b4a2f", auburn: "#8a3b1e", blonde: "#d9b46a",
  ginger: "#c0622b", grey: "#9a9a9a", white: "#e6e2da", pink: "#e48fb0", blue: "#4f7fd1", platinum: "#efe6c8", none: "#000000",
};
const C = { // calm corporate wardrobe
  navy: "#2c3e63", white: "#f1efe8", oat: "#e6dcc8", sage: "#9db59a", sky: "#9cc3e0", blush: "#e8b4b0",
  mustard: "#d9a640", rust: "#b4553a", plum: "#6e4a7e", teal: "#3f8f8c", charcoal: "#3b3d42", grey: "#8e9096",
  forest: "#3e6b48", denim: "#4a6a94", khaki: "#b9a77f", black: "#24262b", cream: "#f4ead2", coral: "#e9806e",
  lilac: "#b8a3d6", olive: "#7a7d45", brick: "#9a4a36", fleece: "#56708c", uniform: "#a7a9ac", slate: "#5b6470",
};
const SHOES = ["#2a2a2a", "#f2f2f2", "#6b4a2f", "#1e2a44"];

// [id, name, pronouns, role, team, manager, arrive, traits, quirk,
//  [skinIdx, hair, hairStyle, shirt, pants, accessory, outfit, extra?], belongings]
const ROSTER = [
  // Exec
  ["margot", "Margot Ellery-Vance", "she/her", "Chief Executive Officer & Keeper of the Vision", "exec", null, "07:30",
    ["early-bird", "pacer", "meeting-lover", "devout"], "Paces while on calls with 'the Board'. Nobody has met the Board.",
    [0, "platinum", "bob", C.cream, C.navy, "earrings", "blazer"], ["photo", "trophy", "candle"]],
  ["dev", "Dev Raghunathan", "he/him", "Chief Technology Officer (Acting, Permanently)", "exec", "margot", "09:15",
    ["focused", "night-owl", "caffeinated"], "Has said 'it's just a config change' 412 times. It was never just a config change.",
    [4, "black", "short", C.charcoal, C.black, "glasses", "hoodie", "beard"], ["mug", "rubberduck", "books"]],
  ["bianca", "Bianca Okafor", "she/her", "Chief Operating Officer of Operations", "exec", "margot", "08:00",
    ["overachiever", "meeting-lover", "early-bird"], "Color-codes her color codes. The legend has a legend.",
    [6, "black", "long", C.plum, C.charcoal, "earrings", "blazer"], ["plant", "photo", "waterbottle"]],
  ["theo", "Theo Lindqvist", "he/him", "Chief of Staff to the Chief", "exec", "margot", "07:45",
    ["anxious", "meeting-lover", "gossip", "early-bird"], "Writes the meeting notes for meetings about meeting notes.",
    [0, "blonde", "sidepart", C.sky, C.khaki, "glasses", "cardigan"], ["mug", "stressball", "books"]],
  // Platform
  ["hiroshi", "Hiroshi Tanaka", "he/him", "Staff Engineer, Foundational Abstractions", "platform", "dev", "09:00",
    ["focused", "devout"], "Believes every problem is one more layer of abstraction away from solved.",
    [1, "black", "short", C.slate, C.black, "headphones", "tee"], ["figurine", "mug", "books"]],
  ["priya", "Priya Natarajan", "she/her", "Senior Engineer, Things Calling Other Things", "platform", "hiroshi", "09:30",
    ["chatty", "caffeinated", "gossip"], "Can draw the entire architecture from memory. Draws it differently each time.",
    [4, "black", "long", C.teal, C.denim, "glasses", "tee"], ["mug", "cactus", "photo"]],
  ["lucas", "Lucas Ferreira", "he/him", "Backend Engineer (Mostly YAML)", "platform", "hiroshi", "10:00",
    ["slacker", "snacker", "rebel"], "Indentation is his love language. Tabs are his enemy.",
    [3, "dark", "curly", C.mustard, C.denim, "airpods", "hoodie"], ["snowglobe", "mug"]],
  ["amara", "Amara Nwosu", "she/her", "Engineer, Migrations That Never End", "platform", "hiroshi", "09:10",
    ["overachiever", "focused"], "Started a database migration in 2023. Says it is 'almost there'.",
    [5, "black", "afro", C.coral, C.charcoal, "earrings", "tee"], ["plant", "trophy", "waterbottle"]],
  ["kai", "Kai Mahoe", "he/him", "Junior Engineer, Learning Where Things Are", "platform", "hiroshi", "11:05",
    ["napper", "snacker", "chatty"], "Still not sure what the product does. Too late to ask now.",
    [3, "black", "mohawk", C.sage, C.khaki, "headphones", "hoodie"], ["rubberduck", "mug", "eraser"]],
  // Infra
  ["ingrid", "Ingrid Solberg", "she/her", "Head of Continuity & Uptime", "infra", "dev", "07:40",
    ["early-bird", "focused", "devout"], "Sleeps with the pager. Has named the pager. The pager's name is Fiona.",
    [0, "blonde", "pony", C.navy, C.black, "glasses", "vest"], ["waterbottle", "lamp", "plant"]],
  ["tomas", "Tomás Ortega", "he/him", "Site Reliability Engineer, Pager Whisperer", "infra", "ingrid", "09:05",
    ["anxious", "caffeinated"], "Flinches at the sound of any chime, including the Chime of Recognition.",
    [2, "dark", "short", C.rust, C.denim, "none", "tee", "mustache"], ["mug", "stressball"]],
  ["nadia", "Nadia Petrova", "she/her", "Cloud Cost Ascetic", "infra", "ingrid", "09:25",
    ["focused", "rebel"], "Turns off servers she doesn't recognise. Has turned off a vending machine.",
    [0, "auburn", "bun", C.forest, C.charcoal, "glasses", "cardigan"], ["cactus", "books"]],
  ["ben", "Ben Abernathy", "he/him", "DevOps Engineer, Pipelines of Pipelines", "infra", "ingrid", "10:15",
    ["night-owl", "slacker", "snacker"], "His pipeline has a pipeline. That pipeline is on fire, calmly.",
    [1, "ginger", "long", C.olive, C.khaki, "beanie", "hoodie", "beard"], ["figurine", "mug", "snowglobe"]],
  // Product Eng
  ["sofia", "Sofia Marchetti", "she/her", "Engineering Manager, Product Refinement", "producteng", "dev", "08:45",
    ["meeting-lover", "devout", "chatty"], "Says 'let's take this offline' while already offline.",
    [1, "dark", "long", C.blush, C.navy, "earrings", "blazer"], ["photo", "plant", "candle"]],
  ["jamal", "Jamal Whitaker", "he/him", "Senior Frontend Engineer, Button Placement", "producteng", "sofia", "09:20",
    ["chatty", "rebel", "snacker"], "Moved a button 2px left. Called it a redesign. Got promoted.",
    [5, "black", "buzz", C.white, C.black, "sunglasses", "tee"], ["figurine", "mug", "caricature"]],
  ["mei", "Mei Chen", "she/her", "Full-Stack Engineer, Both Stacks", "producteng", "sofia", "09:00",
    ["focused", "overachiever"], "Owns both stacks. Neither stack knows about the other.",
    [1, "black", "bob", C.lilac, C.charcoal, "glasses", "cardigan"], ["cactus", "books", "waterbottle"]],
  ["oskar", "Oskar Brandt", "he/him", "Engineer, Feature Flags & Their Feelings", "producteng", "sofia", "09:45",
    ["gossip", "chatty"], "Every flag is on for him and off for everyone else. He's very happy.",
    [0, "brown", "sidepart", C.sky, C.denim, "none", "tee", "mustache"], ["rubberduck", "photo"]],
  ["leila", "Leila Haddad", "she/her", "Mobile Engineer, Small Screens", "producteng", "sofia", "09:35",
    ["caffeinated", "pacer"], "Tests everything on a phone from 2014 'for empathy'.",
    [2, "dark", "hijab", C.teal, C.khaki, "none", "dress"], ["mug", "plant", "stressball"]],
  ["rory", "Rory McAllister", "he/him", "Night Owl Engineer, Ships at 1 AM", "producteng", "sofia", "11:20",
    ["night-owl", "focused", "caffeinated"], "Most productive at 3 AM. Least explainable at 3 PM.",
    [0, "ginger", "curly", C.black, C.black, "headphones", "hoodie", "beard"], ["lamp", "mug", "figurine"]],
  // Data / AI
  ["analucia", "Dr. Ana Lucía Reyes", "she/her", "Head of Output Calibration", "data", "dev", "08:30",
    ["overachiever", "devout", "focused"], "Has a confidence interval for her confidence intervals.",
    [3, "dark", "pony", C.plum, C.navy, "glasses", "blazer"], ["trophy", "books", "plant"]],
  ["wen", "Wen Zhao", "he/him", "Data Scientist, Correlation Enthusiast", "data", "analucia", "09:15",
    ["focused", "anxious"], "Found a correlation between standup length and lunch. Will not share which way.",
    [1, "black", "short", C.oat, C.slate, "glasses", "tee"], ["books", "waterbottle"]],
  ["felix", "Felix Adeyemi", "he/him", "ML Engineer, Prompt Sommelier", "data", "analucia", "09:50",
    ["chatty", "caffeinated", "rebel"], "Says 'please' and 'thank you' to the model. Just in case.",
    [5, "black", "afro", C.mustard, C.charcoal, "airpods", "tee"], ["rubberduck", "mug", "photo"]],
  ["greta", "Greta Vogel", "she/her", "Analytics Engineer, Dashboard Gardener", "data", "analucia", "09:05",
    ["devout", "focused", "early-bird"], "Every dashboard is green. She will not say how.",
    [0, "white", "bun", C.sage, C.navy, "glasses", "cardigan"], ["plant", "plant", "candle"]],
  ["sam", "Sam Okonkwo-Reid", "they/them", "Data Engineer, Number Plumber", "data", "analucia", "10:30",
    ["snacker", "napper"], "Can tell a number's origin by looking at it. Calls numbers 'little guys'.",
    [4, "blue", "short", C.denim, C.khaki, "earrings", "hoodie"], ["figurine", "snowglobe", "mug"]],
  // Product
  ["clara", "Clara Beaumont", "she/her", "VP of Product Intent", "product", "margot", "08:15",
    ["meeting-lover", "pacer", "overachiever"], "Her roadmap has three quarters: Now, Next, and Spiritually.",
    [0, "brown", "long", C.navy, C.oat, "glasses", "blazer"], ["photo", "trophy"]],
  ["arjun", "Arjun Mehta", "he/him", "Senior PM, Roadmaps (Directional)", "product", "clara", "09:00",
    ["meeting-lover", "chatty", "gossip"], "Books a meeting to decide whether to book a meeting.",
    [3, "black", "sidepart", C.white, C.navy, "lanyard", "vest"], ["mug", "books", "stressball"]],
  ["hannah", "Hannah Kowalski", "she/her", "PM, Alignment Workflows", "product", "clara", "09:40",
    ["anxious", "overachiever"], "Has 31 tabs open. One of them is playing music. She can't find it.",
    [0, "auburn", "pony", C.coral, C.denim, "none", "cardigan"], ["plant", "mug", "eraser"]],
  ["diego", "Diego Salazar", "he/him", "Product Ops, Ticket Taxonomist", "product", "clara", "09:55",
    ["devout", "pacer"], "Has invented a ticket status called 'Spiritually Done'.",
    [3, "dark", "short", C.forest, C.khaki, "none", "tee", "beard"], ["books", "candle"]],
  // Design
  ["yuki", "Yuki Morimoto", "she/her", "Head of Aesthetic Compliance", "design", "clara", "09:10",
    ["focused", "rebel"], "Can see 1px misalignment from across the void.",
    [1, "black", "bob", C.black, C.black, "glasses", "tee"], ["cactus", "figurine", "lamp"]],
  ["zara", "Zara Ahmed", "she/her", "Product Designer, Rounded Corners", "design", "yuki", "09:30",
    ["chatty", "dog-lover", "snacker"], "Rounds everything. Has rounded a spreadsheet.",
    [3, "black", "hijab", C.blush, C.oat, "none", "dress"], ["plant", "photo", "caricature"]],
  ["elliot", "Elliot Park", "he/him", "Brand Designer, Logo Custodian", "design", "yuki", "10:05",
    ["rebel", "night-owl"], "Has 74 versions of the logo. All of them are 'final_FINAL'.",
    [1, "pink", "mohawk", C.white, C.black, "earrings", "tee"], ["figurine", "snowglobe"]],
  ["marisol", "Marisol Vega", "she/her", "UX Researcher, Asks 'And Why?'", "design", "yuki", "09:20",
    ["gossip", "chatty", "dog-lover"], "Asks 'and why?' until the room achieves enlightenment or leaves.",
    [2, "dark", "curly", C.mustard, C.denim, "earrings", "cardigan"], ["books", "mug", "photo"]],
  // Sales
  ["chad", "Chad Brennan", "he/him", "VP of Gratitude Acquisition", "sales", "margot", "08:00",
    ["pacer", "chatty", "early-bird", "meeting-lover"], "Rings a gong for every deal. There is no gong. He brings his own.",
    [0, "blonde", "sidepart", C.fleece, C.khaki, "airpods", "vest"], ["trophy", "trophy", "photo"]],
  ["fatima", "Fatima Al-Sayed", "she/her", "Enterprise Account Executive, Big Logos", "sales", "chad", "08:50",
    ["overachiever", "pacer"], "Closed a deal with a company that may not exist. Revenue is real though.",
    [3, "black", "hijab", C.navy, C.charcoal, "none", "blazer"], ["trophy", "plant", "waterbottle"]],
  ["jordan", "Jordan Blake", "they/them", "Sales Development Rep, Cold Outreach", "sales", "chad", "09:00",
    ["caffeinated", "chatty"], "Has emailed every person in the void. Twice. 'Just bumping this!'",
    [4, "brown", "buzz", C.fleece, C.denim, "airpods", "vest"], ["mug", "stressball"]],
  ["nikolai", "Nikolai Ivanov", "he/him", "Solutions Engineer, Demo Survivor", "sales", "chad", "09:35",
    ["anxious", "focused"], "The demo works every time except when anyone is watching.",
    [0, "brown", "short", C.slate, C.black, "glasses", "tee", "beard"], ["rubberduck", "mug"]],
  // Marketing
  ["olivia", "Olivia Grant", "she/her", "Head of Message Harmony", "marketing", "margot", "09:00",
    ["meeting-lover", "chatty"], "Has a brand voice. Uses it at home. Her family has filed feedback.",
    [6, "black", "long", C.coral, C.black, "earrings", "blazer"], ["photo", "candle", "plant"]],
  ["ravi", "Ravi Shah", "he/him", "Content Marketer, Thought Leadership Ghost", "marketing", "olivia", "10:10",
    ["gossip", "night-owl", "slacker"], "Ghostwrites the CEO's thoughts. Sometimes before she has them.",
    [4, "black", "curly", C.oat, C.denim, "glasses", "cardigan", "beard"], ["books", "mug", "lamp"]],
  ["camille", "Camille Dubois", "she/her", "Growth Marketer, Funnel Tender", "marketing", "olivia", "09:45",
    ["caffeinated", "overachiever"], "Has A/B tested her own name. 'Camille' won by 0.3%.",
    [0, "dark", "bob", C.lilac, C.charcoal, "sunglasses", "tee"], ["mug", "snowglobe", "eraser"]],
  // People
  ["grace", "Grace Mensah", "she/her", "Head of Wellbeing & Belonging", "people", "bianca", "08:20",
    ["chatty", "devout", "dog-lover"], "Has a calming fact for every crisis. The facts are not always true.",
    [5, "black", "long", C.sage, C.oat, "earrings", "cardigan"], ["plant", "candle", "photo"]],
  ["tyler", "Tyler Nguyen", "he/him", "Recruiter, Talent Whisperer", "people", "grace", "08:55",
    ["chatty", "gossip", "meeting-lover"], "Describes every role as 'a rocketship'. Several are filing cabinets.",
    [2, "black", "sidepart", C.sky, C.khaki, "lanyard", "vest"], ["mug", "trophy"]],
  ["aisha", "Aisha Bello", "she/her", "People Partner, Feelings Liaison", "people", "grace", "09:25",
    ["dog-lover", "chatty"], "Keeps dog treats in every pocket. The dog knows. The dog always knows.",
    [6, "black", "afro", C.mustard, C.navy, "earrings", "dress"], ["photo", "plant", "candle"]],
  // Finance
  ["henrik", "Henrik Dahl", "he/him", "Head of Numbers Custody (CFO-ish)", "finance", "bianca", "07:35",
    ["early-bird", "focused", "devout"], "Rounds to the nearest gratitude. Audits the snack bar quarterly.",
    [0, "grey", "sidepart", C.white, C.navy, "glasses", "blazer"], ["books", "candle", "eraser"]],
  ["lucy", "Lucy Pham", "she/her", "Accountant, Receipts Archaeologist", "finance", "henrik", "09:00",
    ["devout", "anxious"], "Has found a receipt from 1891. It's for 'one (1) portrait'.",
    [1, "black", "pony", C.oat, C.slate, "glasses", "cardigan"], ["books", "eraser", "mug"]],
  // Workplace
  ["bea", "Bea Castillo", "she/her", "Receptionist & Director of First Impressions", "workplace", "martin", "07:30",
    ["early-bird", "chatty", "dog-lover"], "Greets the elevator even when it's empty. Especially when it's empty.",
    [3, "dark", "bun", C.cream, C.navy, "lanyard", "cardigan"], ["plant", "photo", "candle"]],
  ["martin", "Martin Fogg", "he/him", "Workplace Manager, Snack Logistics", "workplace", "bianca", "08:10",
    ["snacker", "dog-lover", "pacer"], "Owns the office dog. Claims the dog owns him. The dog agrees.",
    [1, "brown", "short", C.forest, C.khaki, "lanyard", "vest", "mustache"], ["photo", "mug", "plant"]],
  // Support
  ["destiny", "Destiny Harper", "she/her", "Head of Customer Reassurance", "support", "bianca", "08:40",
    ["chatty", "meeting-lover", "overachiever"], "Can say 'I completely understand' in eleven tones.",
    [5, "black", "long", C.teal, C.charcoal, "airpods", "blazer"], ["trophy", "plant", "mug"]],
  ["owen", "Owen Gallagher", "he/him", "Support Engineer, Turned It Off and On", "support", "destiny", "09:15",
    ["caffeinated", "slacker"], "His first and last troubleshooting step is the same step.",
    [0, "ginger", "short", C.brick, C.denim, "headphones", "hoodie", "beard"], ["mug", "rubberduck"]],
  ["imani", "Imani Clarke", "she/her", "Support Specialist, Tone Translator", "support", "destiny", "09:30",
    ["dog-lover", "chatty", "snacker"], "Translates 'URGENT!!!' into 'mildly curious' for engineering.",
    [6, "black", "curly", C.lilac, C.navy, "earrings", "cardigan"], ["photo", "plant", "stressball"]],
  ["pablo", "Pablo Romero", "he/him", "Support Specialist, Night Shift Enthusiast", "support", "destiny", "11:00",
    ["night-owl", "napper", "chatty"], "Answers tickets at 4 AM in a whisper, out of respect for the void.",
    [3, "black", "short", C.charcoal, C.black, "headphones", "hoodie", "mustache"], ["lamp", "mug", "snowglobe"]],
  // Facilities (cleaners) + Floor Supervisor (security)
  ["ines", "Inês Duarte", "she/her", "Facilities Associate (Silent Tier)", "workplace", "martin", "07:30",
    ["focused", "devout"], "Has never been heard to speak. Has been heard to hum.",
    [2, "dark", "bun", C.uniform, C.uniform, "none", "uniform"], []],
  ["walter", "Walter Grieve", "he/him", "Facilities Associate (Silent Tier)", "workplace", "martin", "07:30",
    ["focused", "pacer"], "Polishes the same spot until it reflects something he finds acceptable.",
    [0, "grey", "buzz", C.uniform, C.uniform, "none", "uniform", "mustache"], []],
  ["harlan", "Harlan Voss", "he/him", "Floor Supervisor", "workplace", "bianca", "07:30",
    ["pacer", "devout", "early-bird"], "Has never been seen sitting down. Has never been seen arriving.",
    [0, "dark", "sidepart", C.charcoal, C.charcoal, "glasses", "blazer"], []],
];

const TASKS = {}; // filled with lines (see lines.tasks)

function buildPeople() {
  const teamOrg = Object.fromEntries(teams.map((t) => [t.id, t.org]));
  return ROSTER.map((r, i) => {
    const [id, name, pronouns, role, teamId, managerId, arrive, traits, quirk, lk, belongings] = r;
    const [skinI, hair, hairStyle, shirt, pants, accessory, outfit, extra] = lk;
    const seed = hash(id);
    const R = rng(seed);
    const kind = id === "bea" ? "receptionist" : (id === "ines" || id === "walter") ? "cleaner" : id === "harlan" ? "security" : "staff";
    const has = (t) => traits.includes(t);
    const clamp = (v) => Math.round(Math.max(0.05, Math.min(0.95, v)) * 100) / 100;
    return {
      id, name, first: name.replace(/^Dr\. /, "").split(" ")[0], pronouns, role, teamId,
      org: teamOrg[teamId], managerId, deskId: null /* assigned in layout */, kind,
      arrive, leave: null, traits,
      needs: {
        energy: clamp(0.75 + (has("early-bird") ? 0.1 : 0) - (has("napper") ? 0.15 : 0) + (R() - 0.5) * 0.1),
        hunger: clamp(0.3 + (has("snacker") ? 0.25 : 0) + (R() - 0.5) * 0.1),
        social: clamp(0.5 + (has("chatty") ? 0.2 : 0) - (has("focused") ? 0.15 : 0) + (R() - 0.5) * 0.1),
        stress: clamp(0.3 + (has("anxious") ? 0.3 : 0) - (has("devout") ? 0.1 : 0) + (R() - 0.5) * 0.1),
        focus: clamp(0.55 + (has("focused") ? 0.25 : 0) - (has("slacker") ? 0.25 : 0) + (R() - 0.5) * 0.1),
      },
      look: {
        skin: SKIN[skinI], hair: HAIR[hair], hairStyle, shirt, pants,
        shoes: SHOES[seed % SHOES.length], accessory, ...(extra ? { extra } : {}), outfit,
      },
      belongings, quirk, task: null /* filled from lines.tasks */, seed,
      calendar: [],
    };
  });
}
const people = buildPeople();
const P = Object.fromEntries(people.map((p) => [p.id, p]));
const STAFF = people.filter((p) => p.kind === "staff" || p.kind === "receptionist");
const teamMembers = (tid) => STAFF.filter((p) => p.teamId === tid).map((p) => p.id);

// -----------------------------------------------------------------------------
// LAYOUT — 64×40 tiles of infinite white void. No walls. Furniture islands.
// -----------------------------------------------------------------------------
//  x→ 0         10        20        30        40        50        60
//  y  ┌ all-hands (2..17 × 2..15) │ boardroom (20..33 × 2..9) │ team rooms ×3 (36..61 × 2..7)
//     │                           │ walkway y=10..11                     huddles ×3 (58..62)
//     │ wellness (2..9 × 18..24)  │ sections row 1 (y 12..18): Shelf · Row · Commons
//     │ toilets (11..13 × 19)     │ walkway y=19..20
//     │ break room (11..15×24..28)│ sections row 2 (y 21..27): Floor · Ring · Vista
//     │ library (2..9 × 27..31)   │ walkway y=28..30, printer (40,30)           booths ×3 (59..61 × 28..38)
//     │ kitchen (10..19 × 31..37) │ dog bed · shrine · ELEVATOR (30..33 × 36..38) · reception · closet · muster
const W = 96, H = 64;
const furniture = [];
let fid = 0;
function put(type, x, y, w = 1, h = 1, solid = true, extra = {}) {
  const f = { id: `${type}-${++fid}`, type, x, y, w, h, solid, ...extra };
  furniture.push(f);
  return f;
}
const R_ = (x, y, w, h) => ({ x, y, w, h });

// ---- sections (team islands with one long shared table each) -----------------
const SECTION_DEFS = [
  ["sec-shelf", "The North Shelf", ["platform", "infra"], 20, 12],
  ["sec-row", "Refinement Row", ["producteng", "product"], 32, 12],
  ["sec-commons", "Calibration Commons", ["data", "design"], 44, 12],
  ["sec-floor", "The Gratitude Floor", ["sales", "marketing"], 20, 21],
  ["sec-ring", "Reassurance Ring", ["support", "people", "finance"], 32, 21],
  ["sec-vista", "Founder's Vista", ["exec", "workplace"], 44, 21],
];
const sections = [];
const tables = [];
const desks = [];
for (const [id, name, teamIds, x0, y0] of SECTION_DEFS) {
  const sign = teamIds.map((t) => teams.find((tt) => tt.id === t).name).join(" · ");
  sections.push({ id, name, sign, teamIds, rect: R_(x0, y0, 12, 7), label: { x: x0 + 6, y: y0 }, lightZone: id });
  const tableId = `table-${id}`;
  tables.push({ id: tableId, sectionId: id, x: x0 + 1, y: y0 + 3, w: 10, h: 2 });
  put("table", x0 + 1, y0 + 3, 10, 2, true, { sectionId: id, id: tableId, long: true });
  let n = 0;
  for (const [row, facing, my] of [[y0 + 2, "down", y0 + 3], [y0 + 5, "up", y0 + 4]]) {
    for (let k = 0; k < 5; k++) {
      const x = x0 + 1 + k * 2;
      const d = { id: `${id}-d${++n}`, x, y: row, facing, sectionId: id, tableId, monitor: { x, y: my }, ownerId: null, kind: "hotdesk" };
      desks.push(d);
      put("desk-chair", x, row, 1, 1, false, { sectionId: id, deskId: d.id, facing });
    }
  }
  put("plant-tall", x0 + 11, y0 + 4, 1, 1, true, { sectionId: id });
}
// reception desk (Bea)
put("reception-desk", 35, 32, 3, 1, true, { label: "Reception" });
desks.push({ id: "desk-reception", x: 36, y: 31, facing: "down", sectionId: null, tableId: null, monitor: { x: 36, y: 32 }, ownerId: null, kind: "reception" });
put("desk-chair", 36, 31, 1, 1, false, { deskId: "desk-reception", facing: "down" });

// assign desks: team leads first, then members, in section/team order
for (const s of sections) {
  const free = desks.filter((d) => d.sectionId === s.id);
  let i = 0;
  for (const tid of s.teamIds) {
    const members = people.filter((p) => p.teamId === tid && p.kind === "staff");
    members.sort((a, b) => (a.id === teams.find((t) => t.id === tid).leadId ? -1 : b.id === teams.find((t) => t.id === tid).leadId ? 1 : 0));
    for (const p of members) { const d = free[i++]; d.ownerId = p.id; d.kind = "desk"; p.deskId = d.id; }
  }
}
P.bea.deskId = "desk-reception"; desks.find((d) => d.id === "desk-reception").ownerId = "bea";
// Facilities + Floor Supervisor have no desks; they "home" at the closet / shrine
P.ines.deskId = null; P.walter.deskId = null; P.harlan.deskId = null;

// ---- meeting spaces (table + chairs + floor outline + floating sign) ----------
const rooms = [];
function room(id, name, size, rect, door, wait, seats, opts = {}) {
  const r = {
    id, name, size, capacity: opts.capacity ?? seats.length, rect, interior: rect,
    doorTile: door, waitTiles: wait, seats: seats.map(([x, y, facing]) => ({ x, y, facing })),
    ...(opts.standTiles ? { standTiles: opts.standTiles } : {}),
    sign: { x: rect.x + Math.floor(rect.w / 2), y: rect.y - 1, text: name }, ...(opts.purpose ? { purpose: opts.purpose } : {}),
  };
  rooms.push(r);
  for (const s of r.seats) put(opts.seatType || "chair", s.x, s.y, 1, 1, false, { roomId: id, facing: s.facing });
  return r;
}

// All-hands: Gratitude Assembly Hall (65 seats + standing room)
{
  const seats = [];
  for (const y of [5, 7, 9, 11, 13]) for (let x = 3; x <= 15; x++) seats.push([x, y, "up"]);
  const stand = []; for (let y = 4; y <= 14; y++) for (const x of [16, 17]) stand.push({ x, y });
  put("screen", 4, 2, 4, 1, true, { roomId: "allhands" });
  put("portrait", 11, 2, 3, 1, true, { roomId: "allhands", label: "Cornelius T. Plenum" });
  put("podium", 9, 3, 1, 1, true, { roomId: "allhands" });
  room("allhands", "The Gratitude Assembly Hall", "allhands", R_(2, 2, 16, 14), { x: 9, y: 15 },
    [{ x: 9, y: 16 }, { x: 8, y: 16 }, { x: 10, y: 16 }, { x: 11, y: 16 }], seats,
    { standTiles: [{ x: 9, y: 4 }, ...stand], capacity: 65, seatType: "chair", purpose: "All-hands, Gratitude Assemblies, the occasional conga line." });
}
// Boardroom (14)
{
  put("table", 22, 5, 10, 2, true, { roomId: "boardroom", long: true });
  put("screen", 25, 2, 4, 1, true, { roomId: "boardroom" });
  const seats = [];
  for (let x = 23; x <= 28; x++) seats.push([x, 4, "down"]);
  for (let x = 23; x <= 28; x++) seats.push([x, 7, "up"]);
  seats.push([21, 5, "right"], [32, 6, "left"]);
  room("boardroom", "The Long Table of Consensus", "boardroom", R_(20, 2, 14, 8), { x: 27, y: 9 },
    [{ x: 27, y: 10 }, { x: 26, y: 10 }, { x: 28, y: 10 }, { x: 25, y: 10 }], seats);
}
// Team rooms (6–8)
for (const [id, name, x0, cap] of [["team-1", "Synergy Basin", 36, 8], ["team-2", "The Circle-Back", 45, 6], ["team-3", "Deep Dive Pool", 54, 8]]) {
  put("whiteboard", x0 + 2, 2, 4, 1, true, { roomId: id });
  put("table", x0 + 2, 4, 4, 2, true, { roomId: id });
  const per = cap / 2, seats = [];
  for (let k = 0; k < per; k++) seats.push([x0 + 2 + k, 3, "down"]);
  for (let k = 0; k < per; k++) seats.push([x0 + 2 + k, 6, "up"]);
  room(id, name, "team", R_(x0, 2, 8, 6), { x: x0 + 3, y: 7 }, [{ x: x0 + 3, y: 8 }, { x: x0 + 4, y: 8 }, { x: x0 + 2, y: 8 }], seats);
}
// Huddles (2–4)
for (const [id, name, y0, cap] of [["huddle-1", "Quick Sync", 10, 4], ["huddle-2", "Parking Lot", 16, 3], ["huddle-3", "Take It Offline", 22, 4]]) {
  put("table", 60, y0 + 1, 1, 2, true, { roomId: id });
  const seats = [[59, y0 + 1, "right"], [61, y0 + 1, "left"], [59, y0 + 2, "right"], [61, y0 + 2, "left"]].slice(0, cap);
  room(id, name, "huddle", R_(58, y0, 5, 5), { x: 58, y: y0 + 3 }, [{ x: 57, y: y0 + 3 }, { x: 57, y: y0 + 2 }, { x: 56, y: y0 + 3 }], seats);
}
// Booths (1)
for (const [id, name, y0] of [["booth-1", "Pod of Solitude", 28], ["booth-2", "The Listening Box", 32], ["booth-3", "Booth 3 (Unlisted)", 36]]) {
  put("pod-booth", 60, y0, 1, 1, true, { roomId: id });
  room(id, name, "booth", R_(59, y0, 3, 3), { x: 59, y: y0 + 1 }, [{ x: 58, y: y0 + 1 }, { x: 58, y: y0 + 2 }], [[60, y0 + 1, "up"]]);
}
// Special: Wellness Session room + Break Room
{
  put("screen", 4, 18, 3, 1, true, { roomId: "wellness", label: "Soothing Facts" });
  room("wellness", "The Wellness Session", "special", R_(2, 18, 8, 7), { x: 5, y: 24 }, [{ x: 5, y: 25 }, { x: 6, y: 25 }],
    [[3, 20, "up"], [5, 20, "up"], [7, 20, "up"], [3, 22, "up"], [5, 22, "up"], [7, 22, "up"]],
    { seatType: "beanbag", purpose: "Calming facts are read aloud. Attendance is restorative and mandatory." });
  put("table", 13, 25, 1, 1, true, { roomId: "breakroom", label: "The Statement" });
  room("breakroom", "The Contemplation Room", "special", R_(11, 24, 5, 5), { x: 13, y: 28 }, [{ x: 13, y: 29 }, { x: 14, y: 29 }],
    [[13, 26, "up"]], { standTiles: [{ x: 14, y: 26 }], purpose: "For reflecting on one's choices. Escort only." });
}

// ---- amenities ----------------------------------------------------------------
put("toilet-door", 11, 19, 1, 1, true, { label: "Restoration" });
put("toilet-door", 13, 19, 1, 1, true, { label: "Restoration" });
// library nook
put("bookshelf", 2, 27, 7, 1, true, { label: "The Handbook Library" });
put("plant-tall", 9, 27);
put("rug", 3, 28, 6, 3, false, { decal: true }); // floor decal: things may sit on it
const librarySeats = [{ x: 3, y: 29, facing: "up" }, { x: 5, y: 29, facing: "up" }, { x: 7, y: 29, facing: "up" }];
for (const s of librarySeats) put("armchair", s.x, s.y, 1, 1, false, { facing: s.facing, area: "library" });
// kitchen: Nourishment Station
put("coffee-machine", 10, 31, 2, 1, true);
put("microwave", 12, 31, 1, 1, true);
put("counter", 13, 31, 1, 1, true);
put("fridge", 14, 31, 1, 1, true);
put("snack-bar", 15, 31, 3, 1, true);
put("table", 13, 34, 5, 2, true, { area: "kitchen" });
const kitchenSeats = [];
for (let x = 14; x <= 17; x++) { kitchenSeats.push({ x, y: 33, facing: "down" }, { x, y: 36, facing: "up" }); }
for (const s of kitchenSeats) put("stool", s.x, s.y, 1, 1, false, { facing: s.facing, area: "kitchen" });
// keep a 2-tile lane at x=18-19 between the kitchen island and the rest of the floor
put("water-cooler", 20, 34);
put("bin", 19, 30);
// printer, dog bed, shrine, elevator, closet
put("printer", 40, 30, 2, 1, true);
put("dog-bed", 22, 30, 2, 1, false);
put("candle", 24, 36); put("portrait", 25, 36, 3, 1, true, { label: "Our Founder" }); put("candle", 28, 36);
const elevatorF = put("elevator", 30, 36, 4, 3, true);
put("cabinet", 46, 35, 2, 2, true, { label: "Facilities" });
// plants
for (const [x, y] of [[19, 2], [34, 2], [44, 2], [53, 2], [62, 2], [2, 17], [17, 17], [34, 32], [38, 32], [29, 37], [34, 37], [19, 37], [2, 18], [9, 18], [62, 9], [18, 38], [62, 27]]) put("plant", x, y);

// ---- points of interest (walkable standing tiles) -----------------------------
const poi = {
  elevator: { x: 31, y: 35, facing: "up" },
  entrance: { x: 31, y: 35, facing: "up" },
  reception: { x: 36, y: 31, facing: "down" },
  receptionGreet: { x: 36, y: 33, facing: "up" },
  kitchen: { x: 15, y: 33, facing: "down" },
  coffee: { x: 11, y: 32, facing: "up" },
  microwave: { x: 12, y: 32, facing: "up" },
  fridge: { x: 14, y: 32, facing: "up" },
  snackbar: { x: 16, y: 32, facing: "up" },
  waterCooler: { x: 20, y: 35, facing: "up" },
  library: { x: 5, y: 30, facing: "up" },
  printer: { x: 40, y: 31, facing: "up" },
  toilets: { x: 12, y: 20, facing: "up" },
  facilitiesCloset: { x: 46, y: 34, facing: "down" },
  dogBed: { x: 22, y: 30, facing: "down" },
  shrine: { x: 26, y: 35, facing: "down" },
  muster: { x: 53, y: 34, facing: "up" },
  breakroom: { x: 13, y: 26, facing: "up" },
  wellness: { x: 5, y: 21, facing: "up" },
  allhands: { x: 9, y: 9, facing: "up" },
  stage: { x: 9, y: 4, facing: "down" },
  voidCorridorStart: { x: 63, y: 19, facing: "right" },
};
const queues = {
  coffee: [{ x: 11, y: 32 }, { x: 11, y: 33 }, { x: 11, y: 34 }, { x: 11, y: 35 }, { x: 11, y: 36 }, { x: 11, y: 37 }],
  microwave: [{ x: 12, y: 32 }, { x: 12, y: 33 }, { x: 12, y: 34 }, { x: 12, y: 35 }],
  snackbar: [{ x: 16, y: 32 }, { x: 17, y: 32 }, { x: 18, y: 32 }, { x: 19, y: 32 }],
  printer: [{ x: 40, y: 31 }, { x: 41, y: 31 }, { x: 42, y: 31 }, { x: 43, y: 31 }],
  reception: [{ x: 36, y: 33 }, { x: 36, y: 34 }, { x: 37, y: 34 }, { x: 38, y: 34 }],
};
const muster = { rect: R_(49, 30, 9, 9), tiles: [] };
for (let y = 30; y < 39; y++) for (let x = 49; x < 58; x++) muster.tiles.push({ x, y });

const signs = [
  { id: "sign-1", x: 26, y: 11, text: "Alignment is its own reward.", kind: "motivational" },
  { id: "sign-2", x: 50, y: 10, text: "Please enjoy each metric equally.", kind: "motivational" },
  { id: "sign-3", x: 26, y: 20, text: "The numbers know when you are tired.", kind: "motivational" },
  { id: "sign-4", x: 38, y: 19, text: "Gratitude scales.", kind: "motivational" },
  { id: "sign-5", x: 50, y: 20, text: "Your desk missed you. It told us.", kind: "motivational" },
  { id: "sign-6", x: 32, y: 33, text: "Welcome. You have always worked here.", kind: "motivational" },
  { id: "sign-7", x: 14, y: 30, text: "Nourishment is a deliverable.", kind: "wayfinding" },
  { id: "sign-8", x: 5, y: 26, text: "Read the Handbook. The Handbook is reading you.", kind: "wayfinding" },
  { id: "sign-9", x: 13, y: 23, text: "Reflection builds character.", kind: "wayfinding" },
  { id: "sign-10", x: 5, y: 17, text: "Wellness is mandatory. Enjoy it.", kind: "wayfinding" },
  { id: "sign-11", x: 12, y: 18, text: "Restoration →", kind: "wayfinding" },
  { id: "sign-12", x: 53, y: 29, text: "Muster Point (Calmly)", kind: "wayfinding" },
  { id: "sign-13", x: 26, y: 34, text: "Our Founder sees your output.", kind: "motivational" },
  { id: "sign-14", x: 40, y: 28, text: "Ship calmly.", kind: "motivational" },
  ...sections.map((s) => ({ id: `sign-${s.id}`, x: s.label.x, y: s.label.y, text: s.name, sub: s.sign, kind: "section" })),
  ...rooms.map((r) => ({ id: `sign-${r.id}`, x: r.sign.x, y: r.sign.y, text: r.name, sub: `${r.capacity} seat${r.capacity > 1 ? "s" : ""}`, kind: "room" })),
];
// odd things far out in the void (outside 0..W, 0..H; decorative + event anchors)
const voidProps = [
  { id: "void-cabinet", type: "cabinet", x: -34, y: -12, note: "A lone filing cabinet. Drawer 3 hums." },
  { id: "void-phone", type: "desk-phone", x: 96, y: 18, note: "A desk phone, ringing. Nobody answers. It stops when you look." },
  { id: "void-plant", type: "plant", x: 30, y: 72, note: "A single plant, thriving, unexplained." },
  { id: "void-cooler", type: "water-cooler", x: -42, y: 55, note: "Water cooler. The water is warm." },
  { id: "void-desk", type: "desk", x: 128, y: -48, note: "A desk with a nameplate reading 'Department of ——'. Nobody has seen it." },
  { id: "void-chair", type: "chair", x: 70, y: -30, note: "One chair, facing away." },
  { id: "void-door", type: "toilet-door", x: -60, y: 20, note: "A door. Standing on its own. Locked from the other side." },
  { id: "void-corridor", type: "corridor-strip", x: 64, y: 19, w: 400, h: 1, note: "The endless corridor. People run down it sometimes." },
];
const patrolRoute = [
  { x: 18, y: 11 }, { x: 35, y: 10 }, { x: 56, y: 11 }, { x: 56, y: 19 }, { x: 56, y: 29 },
  { x: 44, y: 29 }, { x: 31, y: 29 }, { x: 19, y: 29 }, { x: 19, y: 20 }, { x: 31, y: 19 }, { x: 44, y: 20 }, { x: 31, y: 20 }, { x: 18, y: 18 },
];
const tidyRoute = [
  { x: 19, y: 13 }, { x: 31, y: 13 }, { x: 43, y: 13 }, { x: 56, y: 15 }, { x: 43, y: 19 }, { x: 31, y: 19 },
  { x: 19, y: 22 }, { x: 31, y: 22 }, { x: 43, y: 22 }, { x: 56, y: 26 }, { x: 43, y: 28 }, { x: 20, y: 28 },
  { x: 15, y: 33 }, { x: 18, y: 36 }, { x: 9, y: 17 }, { x: 18, y: 10 },
];
const wanderSpots = [
  { x: 22, y: 31 }, { x: 20, y: 29 }, { x: 15, y: 33 }, { x: 36, y: 34 }, { x: 31, y: 19 }, { x: 50, y: 19 },
  { x: 26, y: 10 }, { x: 45, y: 29 }, { x: 18, y: 25 }, { x: 56, y: 22 }, { x: 5, y: 30 }, { x: 40, y: 10 },
];


addIslands({ put, R_, room, rooms, sections, tables, desks, poi, queues, signs, patrolRoute, tidyRoute, wanderSpots, pets: null });
relocateVoidProps(voidProps);

// -----------------------------------------------------------------------------
// TILES + BLOCKED GRIDS
// -----------------------------------------------------------------------------
const tileGrid = Array.from({ length: H }, () => Array(W).fill("."));
const paint = (r, ch) => { for (let y = r.y; y < r.y + r.h; y++) for (let x = r.x; x < r.x + r.w; x++) if (y >= 0 && y < H && x >= 0 && x < W) tileGrid[y][x] = ch; };
for (const s of sections) paint(s.rect, "s");
for (const r of rooms) paint(r.rect, "o");
paint(R_(10, 31, 10, 7), "k");
paint(R_(2, 27, 8, 5), "l");
paint(elevatorF, "E");
paintExtra(paint, R_);
const blockedGrid = Array.from({ length: H }, () => Array(W).fill("."));
for (const f of furniture) if (f.solid) for (let y = f.y; y < f.y + f.h; y++) for (let x = f.x; x < f.x + f.w; x++) blockedGrid[y][x] = "#";

// -----------------------------------------------------------------------------
// CALENDAR BUILDER — books every meeting on every attendee's calendar with
// no person overlap, no room double-booking and capacity respected (except
// deliberate `mismatch:true` items, which only skip the capacity check).
// -----------------------------------------------------------------------------
const SLOT = 5, NS = 1440 / SLOT;
const MEETING_ROOMS = rooms.filter((r) => r.size !== "special");
const busyP = {}, busyR = {}, busyV = {};
const grid = () => Object.fromEntries(DAYS.map((d) => [d, new Uint8Array(NS)]));
const busyOf = (store, id) => (store[id] ||= grid());
const isFree = (g, days, s, e) => days.every((d) => { for (let i = s / SLOT; i < e / SLOT; i++) if (g[d][i]) return false; return true; });
const mark = (g, days, s, e) => { for (const d of days) for (let i = s / SLOT; i < e / SLOT; i++) g[d][i] = 1; };
const roomById = Object.fromEntries(rooms.map((r) => [r.id, r]));
const BUILD_WARNINGS = [];
let meetingSeq = 0;
const visitors = [];
const V = {};

function book(spec) {
  const { title, type, attendees, dur, starts, room = "auto", eventId, mismatch, organizerId } = spec;
  const days = spec.days || DAYS;
  const vis = spec.visitors || [];
  const n = attendees.length + vis.length;
  for (const st of starts) {
    const s = toMin(st), e = s + dur;
    if (e > 1440) continue;
    if (!attendees.every((id) => isFree(busyOf(busyP, id), days, s, e))) continue;
    if (!vis.every((id) => isFree(busyOf(busyV, id), days, s, e))) continue;
    let roomId = room;
    if (room === "auto") {
      const cand = MEETING_ROOMS.filter((r) => r.capacity >= n && r.size !== "allhands").sort((a, b) => a.capacity - b.capacity);
      const r = cand.find((r) => isFree(busyOf(busyR, r.id), days, s, e));
      if (!r) continue;
      roomId = r.id;
    } else if (roomById[room]) {
      if (!isFree(busyOf(busyR, room), days, s, e)) continue;
      if (!mismatch && roomById[room].capacity < n) continue;
    }
    if (roomById[roomId]) mark(busyOf(busyR, roomId), days, s, e);
    for (const id of attendees) mark(busyOf(busyP, id), days, s, e);
    for (const id of vis) mark(busyOf(busyV, id), days, s, e);
    const item = {
      id: `m${++meetingSeq}`, start: fromMin(s), end: fromMin(e), title, type, roomId, attendees: [...attendees],
      ...(organizerId ? { organizerId } : {}), ...(spec.days ? { days: [...spec.days] } : {}),
      ...(eventId ? { eventId } : {}), ...(mismatch ? { mismatch: true } : {}), ...(vis.length ? { visitors: [...vis] } : {}),
    };
    for (const id of attendees) P[id].calendar.push({ ...item, attendees: [...item.attendees] });
    for (const id of vis) V[id].calendar.push({ ...item, attendees: [...item.attendees] });
    return item;
  }
  BUILD_WARNINGS.push(`could not book "${title}" for [${attendees.join(",")}] ${days.join("/")}`);
  return null;
}
const hours = (from, to, step = 30) => { const out = []; let e = toMin(to); if (e < toMin(from)) e += 1440; for (let m = toMin(from); m <= e; m += step) out.push(fromMin(m % 1440)); return out; };
const rot = (arr, k) => arr.slice(k % arr.length).concat(arr.slice(0, k % arr.length));
const staffIds = STAFF.map((p) => p.id);
const ENG = STAFF.filter((p) => p.org === "eng").map((p) => p.id);
const otherDays = (...skip) => DAYS.filter((d) => !skip.includes(d));

// 1) company-wide fixtures
book({ title: "Gratitude Assembly: All-Hands", type: "allhands", attendees: staffIds, dur: 60, starts: ["15:00"], days: ["wed"], room: "allhands", eventId: "all-hands", organizerId: "margot" });
book({ title: "Evening Gratitude Assembly (Perpetual)", type: "allhands", attendees: staffIds, dur: 30, starts: ["21:00"], room: "allhands", eventId: "gratitude-assembly", organizerId: "theo" });
book({ title: "Taco Tuesday 🌮", type: "lunch", attendees: staffIds, dur: 60, starts: ["12:00"], days: ["tue"], room: "kitchen", eventId: "taco-tuesday", organizerId: "martin" });
book({ title: "Friday 4:55 Deploy (What Could Go Wrong)", type: "deploy", attendees: [...ENG, ...teamMembers("product")], dur: 30, starts: ["16:55"], days: ["fri"], room: "desk", eventId: "friday-deploy", organizerId: "dev" });
book({ title: "Quarterly Elevator Ceremony", type: "social", attendees: staffIds, dur: 15, starts: ["17:30"], days: ["fri"], room: "elevator", eventId: "quarterly-elevator", organizerId: "margot" });

// 2) daily standups (15 min, smallest free room)
for (const t of teams) {
  const it = book({ title: `${t.shortName} Standup (15 min, allegedly)`, type: "standup", attendees: teamMembers(t.id), dur: 15,
    starts: [t.standup.time, ...hours(t.standup.time, "12:30", 15)], organizerId: t.leadId, eventId: "standup" });
  if (it) { t.standup.time = it.start; t.standup.roomId = it.roomId; }
}
// 3) overnight syncs: meetings at all hours
const NIGHT = { exec: "00:00", producteng: "00:30", platform: "01:00", support: "02:00", infra: "02:30", data: "03:30", finance: "04:00",
  sales: "04:30", people: "05:00", workplace: "05:30", design: "22:30", product: "23:00", marketing: "23:30" };
for (const t of teams) book({ title: `${t.shortName} Overnight Alignment`, type: "sync", attendees: teamMembers(t.id), dur: 30,
  starts: [NIGHT[t.id], ...hours(NIGHT[t.id], "06:00", 15)], organizerId: t.leadId });

// 4) leadership, rivalry and deliberate size mismatches
const LEADS = ["margot", "dev", "bianca", "theo", "clara", "hiroshi", "ingrid", "sofia", "analucia", "yuki", "chad", "olivia", "grace", "destiny"];
book({ title: "Roadmap Alignment (Directional)", type: "review", attendees: LEADS, dur: 90, starts: hours("14:00", "18:00"), days: ["mon"], room: "boardroom", organizerId: "clara" });
book({ title: "Rivalry Summit: Refinement vs Calibration", type: "review", attendees: [...teamMembers("producteng"), ...teamMembers("data")], dur: 60, starts: hours("16:00", "19:00"), days: ["thu"], room: "boardroom", organizerId: "theo", eventId: "team-rivalry" });
book({ title: "Pipeline of Gratitude Review", type: "review", attendees: [...teamMembers("sales"), ...teamMembers("marketing")], dur: 60, starts: hours("15:00", "18:00"), days: ["tue"], organizerId: "chad" });
book({ title: "Board Call (Pacing Recommended)", type: "1on1", attendees: ["margot"], dur: 30, starts: hours("02:00", "05:00"), days: ["thu"], room: "booth-1", organizerId: "margot" });
book({ title: "Quick 1:1", type: "1on1", attendees: ["margot", "theo"], dur: 30, starts: hours("11:00", "13:00"), days: ["mon"], room: "boardroom", mismatch: true, organizerId: "margot" });
book({ title: "Design Jam (+ Friends, Unplanned)", type: "sync", attendees: ["yuki", "zara", "elliot", "marisol", "jamal", "mei", "hannah", "felix", "leila"], dur: 45, starts: hours("14:00", "18:00"), days: ["thu"], room: "huddle-2", mismatch: true, organizerId: "yuki" });
book({ title: "Fatima's Big Call (Everyone Wants To Listen)", type: "sync", attendees: ["fatima", "chad", "jordan", "nikolai"], dur: 30, starts: hours("11:00", "16:00"), days: ["wed"], room: "booth-2", mismatch: true, organizerId: "fatima" });
book({ title: "Infra Incident Retro (Blameless, Mostly)", type: "review", attendees: [...teamMembers("infra"), "dev", "hiroshi", "priya"], dur: 60, starts: hours("10:00", "17:00"), days: ["mon"], organizerId: "ingrid" });

// 5) weekly team syncs (60 min)
teams.forEach((t, i) => book({ title: `${t.shortName} Weekly Sync`, type: "sync", attendees: teamMembers(t.id), dur: 60,
  starts: rot(hours("10:00", "18:00", 30), i * 3), days: [WEEKDAYS[i % 5]], organizerId: t.leadId }));

// 6) interview loops (Tue/Thu) with visiting candidates
const LOOPS = [
  ["cand-1", "Avery Quill", "tue", "Senior Refinement Engineer", ["tyler", "sofia", "mei", "jamal"], [1, "brown", "short", C.white, C.navy, "glasses", "blazer"]],
  ["cand-2", "Noor Haddad-Lane", "tue", "Product Designer (Corners)", ["tyler", "yuki", "zara", "clara"], [3, "black", "long", C.sage, C.charcoal, "earrings", "dress"]],
  ["cand-3", "Bastian Kroll", "thu", "Calibration Scientist", ["tyler", "analucia", "wen", "felix"], [0, "blonde", "curly", C.sky, C.khaki, "none", "blazer"]],
  ["cand-4", "Ifeoma Daniels", "thu", "Account Executive, Gratitude", ["tyler", "chad", "fatima", "margot"], [5, "black", "long", C.coral, C.navy, "earrings", "blazer"]],
];
LOOPS.forEach(([vid, name, day, roleTitle, panel, lk], li) => {
  const v = { id: vid, name, kind: "visitor", purpose: "candidate", day, arrive: null, leave: null, hostId: "tyler", role: roleTitle,
    look: { skin: SKIN[lk[0]], hair: HAIR[lk[1]], hairStyle: lk[2], shirt: lk[3], pants: lk[4], accessory: lk[5], outfit: lk[6], shoes: SHOES[li % 4] }, calendar: [] };
  visitors.push(v); V[vid] = v;
  const base = toMin(li % 2 ? "13:00" : "10:00");
  const labels = ["Welcome & Values Alignment", "Technical(ish) Interview", "Culture Add Conversation", "Founder's Portrait Reflection"];
  panel.forEach((who, k) => book({ title: `Interview: ${name} — ${labels[k]}`, type: "interview", attendees: [who], visitors: [vid], dur: 45,
    starts: hours(fromMin(base + k * 50), fromMin(base + k * 50 + 300), 5), days: [day], organizerId: "tyler", eventId: "interview" }));
  const its = v.calendar.map((c) => toMin(c.start)).sort((a, b) => a - b);
  const ends = v.calendar.map((c) => toMin(c.end));
  v.arrive = fromMin(Math.min(...its) - 15); v.leave = fromMin(Math.max(...ends) + 10);
  v.calendar.unshift({ id: `v-${vid}-arrive`, start: v.arrive, end: fromMin(Math.min(...its)), title: "Wait at reception (calmly)", type: "reception", roomId: "reception", attendees: [], days: [day] });
});
// couriers (deliveries via elevator; receptionist signs)
const COURIERS = [["courier-1", "Speedy Parcel Person", "mon", "10:40"], ["courier-2", "Pizza Courier", "wed", "16:05"], ["courier-3", "Mysterious Box Person", "fri", "03:15"], ["courier-4", "Flower Delivery", "thu", "09:50"]];
COURIERS.forEach(([id, name, day, at], i) => visitors.push({ id, name, kind: "courier", purpose: "delivery", day, arrive: at, leave: fromMin(toMin(at) + 10), hostId: "bea",
  look: { skin: SKIN[(i * 3) % 7], hair: HAIR.dark, hairStyle: "short", shirt: ["#e0b04a", "#c0392b", "#4a4a4a", "#7fae6b"][i], pants: C.charcoal, accessory: "cap", outfit: "uniform", shoes: SHOES[0] },
  calendar: [{ id: `v-${id}`, start: at, end: fromMin(toMin(at) + 10), title: "Deliver to reception", type: "reception", roomId: "reception", attendees: ["bea"], days: [day] }] }));

// 7) weekly 1:1s with managers
STAFF.filter((p) => p.managerId).forEach((p, i) => book({ title: `1:1 ${P[p.managerId].first} / ${p.first}`, type: "1on1",
  attendees: [p.managerId, p.id], dur: 30, starts: rot([...hours("09:30", "19:30", 30), ...hours("20:00", "23:30", 30), ...hours("01:00", "05:30", 30)], i * 5),
  days: [WEEKDAYS[i % 5]], organizerId: p.managerId }));

// 8) 3 AM conga sync — rotating crew each night, boardroom
DAYS.forEach((d, i) => {
  const crew = rot(staffIds.filter((id) => id !== "bea"), i * 7).slice(0, 12);
  const free = crew.filter((id) => isFree(busyOf(busyP, id), [d], toMin("03:00"), toMin("03:30"))).slice(0, 10);
  book({ title: "3 AM Conga Sync", type: "sync", attendees: free, dur: 30, starts: ["03:00", "03:15", "02:45"], days: [d], room: "boardroom", eventId: "conga-meeting", organizerId: free[0] });
});
// 9) Wellness Session — rotating group of 5 per day
DAYS.forEach((d, i) => {
  const grp = rot(staffIds, i * 5 + 2).filter((id) => isFree(busyOf(busyP, id), [d], toMin("16:30"), toMin("17:00"))).slice(0, 5);
  book({ title: "Wellness Session (Mandatory, Restorative)", type: "wellness", attendees: grp, dur: 30, starts: ["16:30", "17:00", "16:00"], days: [d], room: "wellness", eventId: "wellness-session", organizerId: "grace" });
});

// 10) meals
STAFF.forEach((p, i) => {
  book({ title: "Lunch (Nourishment Interval)", type: "lunch", attendees: [p.id], dur: 45, starts: rot(hours("11:30", "14:00", 15), i % 9), days: otherDays("tue"), room: "kitchen" });
  book({ title: "Second Lunch (Dinner)", type: "dinner", attendees: [p.id], dur: 45, starts: rot(hours("18:00", "20:30", 15), i % 10), room: "kitchen" });
  if (p.traits.includes("snacker") || p.traits.includes("night-owl")) book({ title: "Midnight Snack", type: "snack", attendees: [p.id], dur: 20, starts: hours("23:45", "01:30", 15), room: "snackbar" });
});
// 11) desk naps (24/7 means sleeping at your desk) — staggered across the night
STAFF.forEach((p, i) => {
  const owl = p.traits.includes("night-owl");
  const start = owl ? "05:00" : fromMin((i * 25) % 300); // 00:00..04:55 staggered
  book({ title: owl ? "Dawn Nap (Earned)" : "Desk Nap (Mandatory Rest Interval)", type: "nap", attendees: [p.id], dur: 90, starts: [start, ...hours("00:00", "06:30", 15)], room: "desk" });
  if (p.traits.includes("napper")) book({ title: "Power Nap (Strategic)", type: "nap", attendees: [p.id], dur: 20, starts: hours("14:30", "16:30", 10), room: "desk" });
});
// 12) focus blocks (try long, fall back shorter)
function bookFlex(spec, durs) {
  const before = BUILD_WARNINGS.length;
  for (const dur of durs) { const it = book({ ...spec, dur }); if (it) { BUILD_WARNINGS.length = before; return it; } }
  return null;
}
STAFF.forEach((p, i) => {
  if (p.kind === "receptionist") return;
  book({ title: "Focus Block: Refining", type: "focus", attendees: [p.id], dur: 90, starts: rot(hours("08:00", "11:30", 30), i % 8), room: "desk" });
  bookFlex({ title: "Focus Block: Calibrating (Do Not Disturb)", type: "focus", attendees: [p.id], starts: rot(hours("13:00", "20:30", 15), (i * 2) % 31), room: "desk" }, [90, 60, 45, 30]);
  bookFlex({ title: "Late Focus Block (Night Refinement)", type: "focus", attendees: [p.id], starts: rot([...hours("21:30", "23:30", 15), ...hours("19:00", "21:00", 15)], i % 9), room: "desk" }, [60, 45, 30]);
});
// a bit of library time for readers
for (const id of ["hiroshi", "wen", "ravi", "lucy", "marisol", "henrik"]) book({ title: "Reading the Handbook (Again)", type: "focus", attendees: [id], dur: 30, starts: hours("07:00", "21:00", 30), room: "library" });

// 13) fill: receptionist front-desk shifts, Facilities tidy rounds, Floor Supervisor patrol
function fillGaps(pid, title, type, roomId, maxLen, from = "00:00", to = "24:00") {
  const g = busyOf(busyP, pid);
  const union = new Uint8Array(NS);
  for (const d of DAYS) for (let i = 0; i < NS; i++) union[i] |= g[d][i];
  let i = toMin(from) / SLOT; const end = toMin(to) / SLOT;
  while (i < end) {
    if (union[i]) { i++; continue; }
    let j = i; while (j < end && !union[j] && (j - i) * SLOT < maxLen) j++;
    if ((j - i) * SLOT >= 20) book({ title, type, attendees: [pid], dur: (j - i) * SLOT, starts: [fromMin(i * SLOT)], room: roomId });
    i = j;
  }
}
// Facilities + Floor Supervisor rhythms
book({ title: "Facilities Huddle (Silent)", type: "sync", attendees: ["ines", "walter"], dur: 15, starts: ["06:00"], room: "facilitiesCloset", organizerId: "ines" });
book({ title: "Facilities Huddle (Silent, Night)", type: "sync", attendees: ["ines", "walter"], dur: 15, starts: ["18:00"], room: "facilitiesCloset", organizerId: "walter" });
book({ title: "Rest Interval (Upright)", type: "nap", attendees: ["ines"], dur: 60, starts: ["02:00"], room: "facilitiesCloset" });
book({ title: "Rest Interval (Upright)", type: "nap", attendees: ["walter"], dur: 60, starts: ["04:00"], room: "facilitiesCloset" });
book({ title: "Silent Lunch", type: "lunch", attendees: ["ines"], dur: 30, starts: ["13:00"], room: "kitchen" });
book({ title: "Silent Lunch", type: "lunch", attendees: ["walter"], dur: 30, starts: ["13:30"], room: "kitchen" });
for (const t of ["08:00", "12:00", "16:00", "20:00", "00:00", "04:00"]) book({ title: "Report to the Founder", type: "review", attendees: ["harlan"], dur: 15, starts: [t], room: "shrine" });
book({ title: "Stands Near The Elevator, Watching", type: "patrol", attendees: ["harlan"], dur: 30, starts: ["09:00"], room: "elevator" });
fillGaps("ines", "Tidy Round (Around Workers)", "tidy", "floor", 120);
fillGaps("walter", "Tidy Round (Polish Until Acceptable)", "tidy", "floor", 120);
fillGaps("harlan", "Floor Rounds", "patrol", "floor", 60);
fillGaps("bea", "Front Desk: Greeting the Elevator", "reception", "reception", 120, "06:00", "24:00");

addMeetings({ book, hours, rot, WEEKDAYS, DAYS, teamMembers, STAFF, P, visitors, V, SKIN, HAIR, C, SHOES, toMin, fromMin, teams });


for (const p of people) p.calendar.sort((a, b) => toMin(a.start) - toMin(b.start));

// -----------------------------------------------------------------------------
// EVENTS — catalog for the world event bus
// reactions: weights for {join, ignore, gossip, flee}; trait entries ADD to default.
// chance = probability per sim hour (only inside `window` if given). radius null = global.
// -----------------------------------------------------------------------------
const W0 = (join, ignore, gossip, flee = 0) => ({ join, ignore, gossip, flee });
function ev(e) {
  return {
    kind: "random", manual: false, schedule: null, chance: null, cooldown: 120, location: { type: "global" }, radius: null,
    duration: 30, effects: { needs: {}, output: 1 }, joinBehavior: "none", anim: { join: "walk", react: "turn-head" },
    emotes: ["❗"], lineKey: e.id, gossipable: true, reactions: { default: W0(0.3, 0.5, 0.2) }, chainsTo: [], tickerTemplates: [],
    ...e,
  };
}
const events = [
  // ---- coffee chain -----------------------------------------------------------
  ev({ id: "coffee-machine-breaks", name: "Coffee machine breaks", kind: "random", manual: true, panel: { label: "Break the coffee machine", emoji: "☕💥" },
    chance: 0.03, cooldown: 360, location: { type: "poi", ref: "coffee" }, radius: 12, duration: 40,
    effects: { needs: { stress: 0.15, energy: -0.1 }, output: 0.85 }, joinBehavior: "queue", anim: { join: "walk", react: "facepalm" },
    emotes: ["😤", "☕", "💀"], reactions: { default: W0(0.4, 0.3, 0.3), caffeinated: { join: 0.6, flee: 0 }, focused: { ignore: 0.5 }, gossip: { gossip: 0.5 }, anxious: { flee: 0.2 } },
    chainsTo: [{ id: "coffee-grumpy", delay: 5, chance: 1 }, { id: "coffee-repair", delay: 35, chance: 1 }],
    tickerTemplates: ["☕ The coffee machine has stopped. A queue of {n} has formed anyway.", "☕ {name} pressed the button 14 times. The coffee machine remains in a state of reflection.", "⚠️ Coffee machine status: 'thinking'. Morale status: also thinking."] }),
  ev({ id: "coffee-grumpy", name: "Caffeine-deprived grumpiness", kind: "chained", radius: null, duration: 35, location: { type: "global" },
    effects: { needs: { stress: 0.1, focus: -0.15 }, output: 0.8 }, joinBehavior: "none", anim: { join: "walk", react: "slump" }, emotes: ["😤", "💤"],
    reactions: { default: W0(0, 0.6, 0.4), caffeinated: { gossip: 0.4 }, devout: { ignore: 0.3 } },
    tickerTemplates: ["😤 Output down 20%. Sighs up 340%.", "😤 {name} has started drinking hot water 'as a statement'."] }),
  ev({ id: "coffee-repair", name: "Coffee machine repaired", kind: "chained", location: { type: "poi", ref: "coffee" }, radius: 14, duration: 5,
    effects: { needs: {}, output: 1 }, joinBehavior: "watch", anim: { join: "walk", react: "turn-head" }, emotes: ["🔧"],
    reactions: { default: W0(0.2, 0.6, 0.2) }, chainsTo: [{ id: "coffee-cheer", delay: 1, chance: 1 }],
    tickerTemplates: ["🔧 {name} from Facilities fixed the coffee machine without making eye contact.", "🔧 The coffee machine has been realigned."] }),
  ev({ id: "coffee-cheer", name: "Coffee is back!", kind: "chained", radius: null, duration: 10,
    effects: { needs: { energy: 0.25, stress: -0.15 }, output: 1.15 }, joinBehavior: "queue", anim: { join: "run", react: "cheer" }, emotes: ["🎉", "☕"],
    reactions: { default: W0(0.5, 0.3, 0.2), caffeinated: { join: 0.8 }, focused: { ignore: 0.4 } },
    tickerTemplates: ["🎉 Coffee has returned. The floor erupts in calm applause.", "☕ Coffee restored. {name} is first in line, somehow."] }),
  ev({ id: "coffee-break", name: "Group coffee break", kind: "manual", manual: true, panel: { label: "Coffee break", emoji: "☕" },
    location: { type: "poi", ref: "coffee" }, radius: null, duration: 20, effects: { needs: { energy: 0.2, social: 0.15 }, output: 0.9 },
    joinBehavior: "queue", anim: { join: "walk", react: "cheer" }, emotes: ["☕", "😋"],
    reactions: { default: W0(0.45, 0.4, 0.15), caffeinated: { join: 0.6 }, focused: { ignore: 0.5 }, chatty: { gossip: 0.3 } },
    tickerTemplates: ["☕ Coffee break called. {n} people are now 'just grabbing one'.", "☕ {name} declared a coffee break. HR has noted the initiative."] }),
  // ---- kitchen / printer --------------------------------------------------------
  ev({ id: "microwave-fish", name: "Someone microwaved fish", kind: "random", manual: true, panel: { label: "Microwave fish", emoji: "🐟" },
    chance: 0.15, window: { from: "11:30", to: "14:00" }, cooldown: 600, location: { type: "poi", ref: "microwave" }, radius: 8, duration: 25,
    effects: { needs: { stress: 0.1, hunger: -0.1 }, output: 0.95 }, joinBehavior: "none", anim: { join: "walk", react: "facepalm" }, emotes: ["🐟", "🤢", "😤"],
    reactions: { default: W0(0, 0.3, 0.4, 0.3), gossip: { gossip: 0.5 }, anxious: { flee: 0.4 }, snacker: { ignore: 0.3 } },
    tickerTemplates: ["🐟 {name} microwaved fish. The Nourishment Station is now a crime scene.", "🐟 A smell has entered the void. Suspects: {name}.", "🐟 Microwave incident #{n}. Facilities has been notified, silently."] }),
  ev({ id: "printer-jam", name: "Printer jam", kind: "random", manual: true, panel: { label: "Jam the printer", emoji: "🖨️" },
    chance: 0.05, cooldown: 300, location: { type: "poi", ref: "printer" }, radius: 7, duration: 25,
    participants: { orgs: ["eng"], max: 3 }, effects: { needs: { stress: 0.1 }, output: 0.97 }, joinBehavior: "gather", anim: { join: "walk", react: "turn-head" }, emotes: ["🖨️", "❓", "💀"],
    reactions: { default: W0(0.25, 0.55, 0.2), overachiever: { join: 0.4 }, focused: { ignore: 0.4 } }, chainsTo: [{ id: "printer-fixed", delay: 25, chance: 1 }],
    tickerTemplates: ["🖨️ PC LOAD LETTER. Three engineers have gathered. None of them have printed anything since 2019.", "🖨️ {name} is 'just going to look at it'. The printer is also just looking at them."] }),
  ev({ id: "printer-fixed", name: "Printer un-jammed", kind: "chained", location: { type: "poi", ref: "printer" }, radius: 7, duration: 3,
    effects: { needs: { stress: -0.1 }, output: 1 }, anim: { join: "walk", react: "cheer" }, emotes: ["🎉"], reactions: { default: W0(0, 0.7, 0.3) },
    tickerTemplates: ["🖨️ Printer fixed by turning it off and on. {name} is updating their LinkedIn."] }),
  // ---- meetings ----------------------------------------------------------------------
  ev({ id: "standup", name: "Standup", kind: "scheduled", schedule: { fromCalendar: "standup" }, location: { type: "room" }, radius: 3, duration: 15,
    effects: { needs: { social: 0.05, focus: -0.05 }, output: 1 }, joinBehavior: "sit", emotes: ["🗣️"], gossipable: false,
    reactions: { default: W0(1, 0, 0) }, chainsTo: [{ id: "standup-overrun", delay: 15, chance: 0.35 }],
    tickerTemplates: ["🗣️ {team} standup has started in {room}. It is 15 minutes long, spiritually."] }),
  ev({ id: "standup-overrun", name: "Standup overrun", kind: "chained", trigger: { calendarType: "standup" }, location: { type: "room" }, radius: 4, duration: 25,
    effects: { needs: { stress: 0.1, energy: -0.1 }, output: 0.9 }, joinBehavior: "none", anim: { join: "walk", react: "slump" }, emotes: ["⏰", "💤", "😤"],
    reactions: { default: W0(0, 0.5, 0.5), "meeting-lover": { ignore: 0.6 }, focused: { gossip: 0.3 } },
    chainsTo: [{ id: "meeting-knock", delay: 3, chance: 0.9 }],
    tickerTemplates: ["⏰ {team} standup is now in minute {n}. Someone is sharing their screen.", "⏰ The 15-min standup in {room} has achieved sentience and extended itself."] }),
  ev({ id: "meeting-overrun", name: "Meeting overrun", kind: "random", trigger: { calendarType: ["sync", "review", "1on1"] }, chance: 0.25, location: { type: "room" }, radius: 4, duration: 15,
    effects: { needs: { stress: 0.05 }, output: 0.95 }, emotes: ["⏰"], reactions: { default: W0(0, 0.6, 0.4) }, chainsTo: [{ id: "meeting-knock", delay: 2, chance: 0.9 }],
    tickerTemplates: ["⏰ '{title}' in {room} has overrun. The next group is gathering outside.", "⏰ {room}: 'just one more thing' (said 4 times)."] }),
  ev({ id: "meeting-knock", name: "Next group knocks", kind: "chained", trigger: { nextBookingWaiting: true }, location: { type: "room" }, radius: 5, duration: 6,
    effects: { needs: { stress: 0.05, social: 0.05 }, output: 1 }, joinBehavior: "watch", anim: { join: "walk", react: "knock" }, emotes: ["✊", "👀", "⏰"],
    reactions: { default: W0(0.2, 0.4, 0.4), anxious: { flee: 0.3 }, rebel: { join: 0.4 } },
    tickerTemplates: ["✊ {name} is knocking politely on the invisible glass of {room}.", "👀 {n} people are standing outside {room} looking at their watches in unison."] }),
  ev({ id: "size-mismatch", name: "Room size mismatch", kind: "scheduled", schedule: { fromCalendar: "mismatch" }, location: { type: "room" }, radius: 6, duration: 30,
    effects: { needs: { stress: 0.05, social: 0.1 }, output: 1 }, joinBehavior: "watch", anim: { join: "walk", react: "turn-head" }, emotes: ["😬", "👀"],
    reactions: { default: W0(0.1, 0.5, 0.4) },
    tickerTemplates: ["😬 {n} people have entered {room} ({quota} seats). Someone is sitting on the table.", "👑 A 2-person 1:1 is occupying {room}, the 14-seat boardroom. Power move."] }),
  ev({ id: "could-have-been-email", name: "This could've been an email", kind: "random", trigger: { calendarType: ["sync", "review"] }, chance: 0.3, location: { type: "room" }, radius: 3, duration: 5,
    effects: { needs: { stress: 0.05, focus: -0.05 }, output: 1 }, anim: { join: "walk", react: "facepalm" }, emotes: ["📧", "💀", "🙃"],
    reactions: { default: W0(0, 0.4, 0.6), rebel: { gossip: 0.5 }, "meeting-lover": { ignore: 0.6 } },
    tickerTemplates: ["📧 Consensus reached in {room}: this meeting could have been an email. It will now be a follow-up meeting.", "📧 {name} said the quiet part loud: 'could've been an email'."] }),
  ev({ id: "all-hands", name: "All-hands (Gratitude Assembly)", kind: "scheduled", manual: true, panel: { label: "Call an all-hands", emoji: "📣" },
    schedule: { days: ["wed"], time: "15:00" }, location: { type: "room", ref: "allhands" }, radius: null, duration: 60, participants: { all: true },
    effects: { needs: { social: 0.15, focus: -0.2 }, output: 0.5, progress: 0.01 }, joinBehavior: "sit", anim: { join: "walk", react: "clap" }, emotes: ["📣", "👏", "🙏"],
    reactions: { default: W0(0.9, 0.1, 0), devout: { join: 0.5 }, rebel: { gossip: 0.3 } }, gossipable: false,
    tickerTemplates: ["📣 All-hands in The Gratitude Assembly Hall. Attendance is joyful and tracked.", "📣 {name} is presenting 47 slides titled 'Where We Are Going (Directionally)'."] }),
  ev({ id: "gratitude-assembly", name: "Evening Gratitude Assembly", kind: "scheduled", schedule: { days: "daily", time: "21:00" }, location: { type: "room", ref: "allhands" }, radius: null, duration: 30,
    participants: { all: true }, effects: { needs: { stress: -0.1, energy: -0.05 }, output: 0.6 }, joinBehavior: "sit", anim: { join: "walk", react: "bow" }, emotes: ["🙏", "🕯️"],
    reactions: { default: W0(0.9, 0.1, 0), devout: { join: 0.6 } }, gossipable: false,
    tickerTemplates: ["🙏 The Evening Gratitude Assembly has begun. Today's gratitude: the numbers.", "🕯️ Gratitude Assembly #{n}. Everyone thanks the void. The void does not respond. This is normal."] }),
  ev({ id: "conga-meeting", name: "3 AM Conga Sync", kind: "scheduled", schedule: { days: "daily", time: "03:00" }, location: { type: "room", ref: "boardroom" }, radius: 8, duration: 30,
    effects: { needs: { energy: -0.1, social: 0.2 }, output: 0.9 }, joinBehavior: "sit", anim: { join: "walk", react: "celebrate" }, emotes: ["💃", "🌙", "💤"],
    reactions: { default: W0(0.2, 0.5, 0.3), "night-owl": { join: 0.6 }, napper: { ignore: 0.6 } },
    tickerTemplates: ["💃 The 3 AM Conga Sync has formed a line. Agenda item 1: the line.", "🌙 {n} people are in a 3 AM meeting about 'momentum'. Momentum is unclear."] }),
  // ---- deploy / prod chain ------------------------------------------------------
  ev({ id: "friday-deploy", name: "Friday 4:55 PM deploy", kind: "scheduled", manual: true, panel: { label: "Deploy to prod", emoji: "🚀" },
    schedule: { days: ["fri"], time: "16:55" }, location: { type: "team", ref: ["platform", "infra", "producteng", "data"] }, radius: null, duration: 20, participants: { orgs: ["eng"] },
    effects: { needs: { stress: 0.2 }, output: 1.1, progress: 0.02, version: "minor" }, joinBehavior: "watch", anim: { join: "walk", react: "turn-head" }, emotes: ["🚀", "😬", "🙏"],
    reactions: { default: W0(0.3, 0.3, 0.4), anxious: { flee: 0.3 }, rebel: { join: 0.5 } },
    chainsTo: [{ id: "deploy-success", delay: 20, chance: 0.55 }, { id: "prod-down", delay: 12, chance: 0.45 }],
    tickerTemplates: ["🚀 {name} is deploying to prod at 4:55 PM on a Friday. Godspeed.", "🚀 v{version} is rolling out. Everyone is very calm. Too calm."] }),
  ev({ id: "deploy-success", name: "Deploy succeeded", kind: "chained", radius: null, duration: 10,
    effects: { needs: { stress: -0.2, energy: 0.1 }, output: 1.2, progress: 0.02 }, joinBehavior: "none", anim: { join: "walk", react: "celebrate" }, emotes: ["🎉", "🚀"],
    reactions: { default: W0(0.4, 0.4, 0.2) }, tickerTemplates: ["🎉 v{version} shipped. Nothing broke. Nobody trusts it.", "🚀 Deploy green. {name} is doing a small, approved dance."] }),
  ev({ id: "prod-down", name: "PROD IS DOWN", kind: "manual", manual: true, panel: { label: "Prod is down", emoji: "🔥" },
    chance: 0.004, cooldown: 720, location: { type: "global" }, radius: null, duration: 60, participants: { orgs: ["eng"] },
    effects: { needs: { stress: 0.4, focus: 0.2 }, output: 0.4 }, joinBehavior: "sprint", anim: { join: "sprint", react: "facepalm" }, emotes: ["🔥", "💀", "😱", "❗"],
    reactions: { default: W0(0.2, 0.2, 0.6), focused: { join: 0.5 }, anxious: { flee: 0.4, gossip: 0.2 }, gossip: { gossip: 0.6 }, chatty: { gossip: 0.3 } },
    chainsTo: [{ id: "engineers-sprint", delay: 0, chance: 1 }, { id: "prod-fixed", delay: 55, chance: 1 }],
    tickerTemplates: ["🔥 PROD IS DOWN. {name} has typed 'who broke prod' into every channel.", "🔥 Status page updated to 'Investigating (Calmly)'.", "💀 Customers are being reassured at maximum volume."] }),
  ev({ id: "engineers-sprint", name: "Engineers sprint to desks", kind: "chained", participants: { orgs: ["eng"] }, location: { type: "desk" }, radius: null, duration: 50,
    effects: { needs: { energy: -0.2, stress: 0.1, focus: 0.3 }, output: 0.5 }, joinBehavior: "sprint", anim: { join: "sprint", react: "type" }, emotes: ["💨", "⌨️", "🔥"],
    reactions: { default: W0(0.9, 0.05, 0.05) }, gossipable: false,
    tickerTemplates: ["💨 Engineering is sprinting. Not the agile kind. The running kind.", "⌨️ {name} has abandoned a sandwich mid-bite to save prod."] }),
  ev({ id: "prod-fixed", name: "Prod restored", kind: "chained", radius: null, duration: 10,
    effects: { needs: { stress: -0.35, energy: 0.1 }, output: 1.1, version: "patch" }, joinBehavior: "none", anim: { join: "walk", react: "celebrate" }, emotes: ["🎉", "😮‍💨"],
    reactions: { default: W0(0.5, 0.3, 0.2) },
    tickerTemplates: ["😮‍💨 Prod is back. Root cause: 'a config change'. v{version} hotfix shipped.", "🎉 {name} fixed prod. They will be thanked in a meeting about it."] }),
  // ---- celebrations ---------------------------------------------------------------
  ev({ id: "funding-round", name: "Funding round closed", kind: "manual", manual: true, panel: { label: "Close a funding round", emoji: "💸" },
    chance: 0.001, cooldown: 2880, location: { type: "global" }, radius: null, duration: 30, participants: { all: true },
    effects: { needs: { stress: -0.2, social: 0.3, energy: 0.2 }, output: 0.6, progress: 0.05 }, joinBehavior: "gather", anim: { join: "run", react: "celebrate" }, emotes: ["💸", "🎉", "🍾"],
    reactions: { default: W0(0.8, 0.1, 0.1), rebel: { gossip: 0.4 }, devout: { join: 0.3 } },
    chainsTo: [{ id: "pizza-arrives", delay: 20, chance: 1 }],
    tickerTemplates: ["💸 Plenum Industries has raised $80M to continue doing what it does. Confetti deployed.", "💸 Series C (Spiritual) closed. Valuation: 'yes'.", "🎉 {name} cried a little at the funding announcement. It's okay."] }),
  ev({ id: "pizza-arrives", name: "Pizza arrives", kind: "chained", location: { type: "poi", ref: "kitchen" }, radius: null, duration: 30,
    effects: { needs: { hunger: -0.5, social: 0.15 }, output: 0.7 }, joinBehavior: "swarm", anim: { join: "run", react: "eat" }, emotes: ["🍕", "😋"],
    reactions: { default: W0(0.6, 0.3, 0.1), snacker: { join: 0.8 }, focused: { ignore: 0.4 } },
    tickerTemplates: ["🍕 {n} pizzas have arrived via the elevator. {name} has claimed the corner slices.", "🍕 Pizza in the Nourishment Station. A pineapple debate has begun."] }),
  ev({ id: "birthday-cake", name: "Surprise birthday cake", kind: "random", manual: true, panel: { label: "Birthday cake", emoji: "🎂" },
    chance: 0.01, window: { from: "10:00", to: "17:00" }, cooldown: 1440, location: { type: "desk", ref: "random" }, radius: 10, duration: 20,
    effects: { needs: { hunger: -0.2, social: 0.25 }, output: 0.8 }, joinBehavior: "gather", anim: { join: "walk", react: "clap" }, emotes: ["🎂", "🎉", "🥳"],
    reactions: { default: W0(0.6, 0.3, 0.1), snacker: { join: 0.6 }, chatty: { join: 0.3 }, focused: { ignore: 0.4 } },
    tickerTemplates: ["🎂 Surprise cake for {name}! The card has 49 signatures and 1 'best, Facilities'.", "🎂 Happy birthday {name}. Please enjoy each slice equally."] }),
  ev({ id: "donut-drop", name: "Donut drop", kind: "manual", manual: true, panel: { label: "Drop donuts", emoji: "🍩" },
    location: { type: "poi", ref: "snackbar" }, radius: null, duration: 20, effects: { needs: { hunger: -0.3, energy: 0.15, stress: -0.1 }, output: 0.85 },
    joinBehavior: "swarm", anim: { join: "sprint", react: "eat" }, emotes: ["🍩", "😋", "❗"],
    reactions: { default: W0(0.4, 0.45, 0.15), snacker: { join: 0.9 }, focused: { ignore: 0.9, join: -0.4 }, chatty: { gossip: 0.3 }, devout: { ignore: 0.2 } },
    tickerTemplates: ["🍩 A box of donuts has appeared at the snack bar. {name} got there in 4 seconds.", "🍩 Donuts! The sprinkle ones went first. They always go first."] }),
  ev({ id: "taco-tuesday", name: "Taco Tuesday", kind: "scheduled", schedule: { days: ["tue"], time: "12:00" }, location: { type: "poi", ref: "kitchen" }, radius: null, duration: 60, participants: { all: true },
    effects: { needs: { hunger: -0.6, social: 0.25 }, output: 0.6 }, joinBehavior: "queue", anim: { join: "walk", react: "eat" }, emotes: ["🌮", "😋"],
    reactions: { default: W0(0.85, 0.1, 0.05), snacker: { join: 0.5 } },
    tickerTemplates: ["🌮 It's Taco Tuesday. The taco bar has been aligned.", "🌮 {name} has built a taco structurally unsuited for eating."] }),
  ev({ id: "fire-drill", name: "Fire drill", kind: "random", manual: true, panel: { label: "Fire drill", emoji: "🚨" },
    chance: 0.002, window: { from: "09:00", to: "18:00" }, cooldown: 2880, location: { type: "global" }, radius: null, duration: 25, participants: { all: true },
    effects: { needs: { stress: 0.2, energy: -0.05 }, output: 0 }, joinBehavior: "evacuate", anim: { join: "run", react: "turn-head" }, emotes: ["🚨", "😱", "🧯"],
    reactions: { default: W0(0.95, 0.05, 0), anxious: { flee: 0.5 } }, gossipable: false,
    chainsTo: [{ id: "fire-drill-allclear", delay: 20, chance: 1 }],
    tickerTemplates: ["🚨 FIRE DRILL. Please proceed calmly to the Muster Point (Calmly).", "🚨 Fire drill in progress. {name} brought their laptop. Of course they did."] }),
  ev({ id: "fire-drill-allclear", name: "All clear", kind: "chained", radius: null, duration: 5, effects: { needs: { stress: -0.1 }, output: 1 },
    anim: { join: "walk", react: "cheer" }, emotes: ["✅"], reactions: { default: W0(0.1, 0.8, 0.1) },
    tickerTemplates: ["✅ All clear. Everyone is returning to their desks at exactly the same speed."] }),
  // ---- severance-pivot (original corporate-cult parody) ----------------------------
  ev({ id: "quota-reached", name: "Team hits quota", kind: "chained", trigger: { quota: 1 }, location: { type: "team" }, radius: null, duration: 5,
    effects: { needs: { stress: -0.2, social: 0.1 }, output: 1, progress: 0.02 }, anim: { join: "walk", react: "celebrate" }, emotes: ["🎯", "🎉"],
    reactions: { default: W0(0.2, 0.5, 0.3) }, chainsTo: [{ id: "reward-party", delay: 10, chance: 1 }],
    tickerTemplates: ["🎯 {team} has reached 100% of {quota}. A reward has been scheduled.", "🎯 {team}: quota complete. Rival teams are 'happy for them'."] }),
  ev({ id: "reward-party", name: "Reward party", kind: "chained", manual: true, panel: { label: "Reward party", emoji: "🍈" }, location: { type: "room", ref: "allhands" }, radius: null, duration: 30,
    participants: { teams: "triggering" }, effects: { needs: { stress: -0.3, social: 0.3, energy: 0.1 }, output: 0.7 }, joinBehavior: "gather", anim: { join: "walk", react: "celebrate" },
    emotes: ["🍈", "🧇", "🪢", "🎉"], reactions: { default: W0(0.7, 0.1, 0.2), devout: { join: 0.4 }, rebel: { gossip: 0.4 } },
    tickerTemplates: ["🍈 {team} has earned {prize}. Attendance is celebratory.", "🧇 {prize} has begun. {name} is visibly moved.", "🎁 Reward: {prize}. Please do not ask what the next tier is."] }),
  ev({ id: "wellness-session", name: "Wellness Session", kind: "scheduled", schedule: { fromCalendar: "wellness" }, location: { type: "room", ref: "wellness" }, radius: 4, duration: 30,
    effects: { needs: { stress: -0.3, energy: 0.05 }, output: 1 }, joinBehavior: "sit", anim: { join: "walk", react: "bow" }, emotes: ["🧘", "🌿"],
    reactions: { default: W0(0.9, 0.1, 0) }, gossipable: false,
    tickerTemplates: ["🧘 Wellness Session begun. Today's fact: 'Your chair is supporting you.'", "🌿 {name} has been reminded that they are a valued and well person."] }),
  ev({ id: "breakroom-escort", name: "Escorted to the Contemplation Room", kind: "random", manual: true, panel: { label: "Escort to Break Room", emoji: "🚪" },
    chance: 0.02, cooldown: 480, participants: { traits: ["rebel", "slacker"], max: 1 }, location: { type: "room", ref: "breakroom" }, radius: 10, duration: 30,
    effects: { needs: { stress: 0.3, social: -0.2 }, output: 0.95 }, joinBehavior: "escort", anim: { join: "walk", react: "turn-head" }, emotes: ["👀", "😶", "🚪"],
    reactions: { default: W0(0, 0.5, 0.4, 0.1), gossip: { gossip: 0.6 }, devout: { ignore: 0.4 }, anxious: { flee: 0.3 } },
    chainsTo: [{ id: "breakroom-return", delay: 30, chance: 1 }],
    tickerTemplates: ["🚪 {name} has been invited to the Contemplation Room by the Floor Supervisor. Invitation non-optional.", "👀 {name} walked toward the Contemplation Room. Nobody is looking. Everyone is looking."] }),
  ev({ id: "breakroom-return", name: "Returns from the Contemplation Room", kind: "chained", location: { type: "desk" }, radius: 6, duration: 5,
    effects: { needs: { stress: -0.05 }, output: 1.05 }, anim: { join: "walk", react: "turn-head" }, emotes: ["😶"], reactions: { default: W0(0, 0.6, 0.4) },
    tickerTemplates: ["😶 {name} has returned. They seem very, very aligned now.", "📝 {name} has read the Statement 6 times and meant it on the 6th."] }),
  ev({ id: "overtime-protocol", name: "Overtime Protocol", kind: "random", manual: true, panel: { label: "Overtime Protocol", emoji: "⏰" },
    chance: 0.06, window: { from: "00:00", to: "05:30" }, cooldown: 360, location: { type: "global" }, radius: null, duration: 10,
    effects: { needs: { energy: 0.15, stress: 0.15 }, output: 1.2 }, joinBehavior: "none", anim: { join: "walk", react: "wake" }, emotes: ["⏰", "😳", "💤"],
    reactions: { default: W0(0.3, 0.4, 0.3), napper: { join: 0.5 }, devout: { join: 0.3 } },
    tickerTemplates: ["⏰ Overtime Protocol engaged. All nappers have been gently, totally awakened.", "⏰ A soft chime. {n} people sit up at once. Work resumes."] }),
  ev({ id: "quarterly-elevator", name: "The Quarterly Elevator", kind: "scheduled", manual: true, panel: { label: "Quarterly Elevator", emoji: "🛗" },
    schedule: { days: ["fri"], time: "17:30" }, location: { type: "poi", ref: "elevator" }, radius: null, duration: 15, participants: { all: true },
    effects: { needs: { stress: 0.05, social: 0.1 }, output: 0.9 }, joinBehavior: "watch", anim: { join: "walk", react: "bow" }, emotes: ["🛗", "✨", "👋"],
    reactions: { default: W0(0.7, 0.1, 0.2), devout: { join: 0.4 }, gossip: { gossip: 0.4 } },
    tickerTemplates: ["🛗 The Quarterly Elevator has opened. {name} steps in. Promoted? Departed? The elevator does not say.", "✨ {name} has ascended. Their desk plant will be cared for."] }),
  ev({ id: "void-flicker", name: "The void flickers", kind: "random", manual: true, panel: { label: "Void flicker", emoji: "🌫️" },
    chance: 0.04, cooldown: 180, location: { type: "global" }, radius: null, duration: 2, effects: { needs: { stress: 0.05 }, output: 1 },
    anim: { join: "walk", react: "turn-head" }, emotes: ["👀", "❓"], reactions: { default: W0(0, 0.7, 0.3), anxious: { gossip: 0.3, flee: 0.1 }, devout: { ignore: 0.3 } },
    tickerTemplates: ["🌫️ The void flickered. Facilities says it did not.", "🌫️ For a moment there was a wall. Then there was not."] }),
  ev({ id: "corridor-runner", name: "Someone runs down the endless corridor", kind: "random", chance: 0.02, cooldown: 600,
    participants: { traits: ["rebel", "pacer"], max: 1 }, location: { type: "poi", ref: "voidCorridorStart" }, radius: 15, duration: 15,
    effects: { needs: { stress: -0.1, energy: -0.2 }, output: 1 }, joinBehavior: "watch", anim: { join: "sprint", react: "turn-head" }, emotes: ["🏃", "👀"],
    reactions: { default: W0(0.1, 0.4, 0.5), gossip: { gossip: 0.5 } },
    tickerTemplates: ["🏃 {name} is running down the endless corridor. They will be back for the 3 PM.", "🏃 {name} sprinted into the void. Their status is still 'Active'."] }),
  ev({ id: "goat-appears", name: "A goat appears", kind: "random", manual: true, panel: { label: "Summon the goat", emoji: "🐐" },
    chance: 0.01, cooldown: 1440, location: { type: "void" }, radius: 12, duration: 20, effects: { needs: { social: 0.15, stress: -0.05 }, output: 0.9 },
    joinBehavior: "gather", anim: { join: "walk", react: "turn-head" }, emotes: ["🐐", "❓", "❤️"],
    reactions: { default: W0(0.3, 0.3, 0.4), "dog-lover": { join: 0.6 }, anxious: { flee: 0.3 }, devout: { ignore: 0.4 } },
    tickerTemplates: ["🐐 A goat has walked in from the void. Nobody hired it. It has a lanyard.", "🐐 The goat is eating a quarterly report. It seems to agree with it."] }),
  ev({ id: "dog-pets", name: "Office dog gets pets", kind: "random", chance: 0.5, cooldown: 30, location: { type: "pet", ref: "biscuit" }, radius: 4, duration: 5,
    effects: { needs: { stress: -0.2, social: 0.1 }, output: 1 }, joinBehavior: "gather", anim: { join: "walk", react: "pet" }, emotes: ["❤️", "🐶"],
    reactions: { default: W0(0.3, 0.6, 0.1), "dog-lover": { join: 0.8 }, focused: { ignore: 0.3 } },
    tickerTemplates: ["🐶 {name} gave Biscuit {n} pets. Productivity briefly irrelevant.", "🐶 Biscuit has been declared Employee of the Hour (again)."] }),
  ev({ id: "tchotchke-award", name: "Desk tchotchke awarded", kind: "random", chance: 0.08, cooldown: 120, location: { type: "desk", ref: "random" }, radius: 5, duration: 3,
    effects: { needs: { stress: -0.1, social: 0.05 }, output: 1.05 }, anim: { join: "walk", react: "celebrate" }, emotes: ["🏆", "🩹", "🖼️"],
    reactions: { default: W0(0.1, 0.5, 0.4), gossip: { gossip: 0.3 } },
    tickerTemplates: ["🏆 {name} has been awarded a novelty eraser for 'sustained alignment'.", "🖼️ {name} received a caricature portrait. It's mostly forehead.", "🏆 Tchotchke economy update: {name} now owns 3 erasers and 1 finger trap."] }),
  ev({ id: "team-rivalry", name: "Team rivalry flare-up", kind: "random", chance: 0.06, cooldown: 240, location: { type: "team", ref: ["producteng", "data"] }, radius: 14, duration: 10,
    effects: { needs: { stress: 0.05, social: 0.1 }, output: 1.1 }, joinBehavior: "watch", anim: { join: "walk", react: "turn-head" }, emotes: ["😤", "📊", "🔥"],
    reactions: { default: W0(0.2, 0.4, 0.4), overachiever: { join: 0.4 }, chatty: { gossip: 0.3 } },
    tickerTemplates: ["📊 Product Refinement is at {quota}. Output Calibration has 'questions about the methodology'.", "😤 {name} placed a small flag on the Calibration Commons border. Tensions are calm but high."] }),
  ev({ id: "founder-quote", name: "Founder quote of the hour", kind: "random", chance: 0.6, cooldown: 50, location: { type: "global" }, radius: null, duration: 1,
    effects: { needs: {}, output: 1 }, anim: { join: "walk", react: "none" }, emotes: [], lineKey: "shrine", gossipable: false, reactions: { default: W0(0, 1, 0) },
    tickerTemplates: ["🕯️ Founder's Thought: \"{quote}\""] }),
  ev({ id: "department-whisper", name: "Whispers of the Department nobody has seen", kind: "random", chance: 0.03, cooldown: 600, location: { type: "global" }, radius: null, duration: 10,
    effects: { needs: { stress: 0.05, social: 0.1 }, output: 0.98 }, anim: { join: "walk", react: "turn-head" }, emotes: ["🤫", "👀"],
    reactions: { default: W0(0, 0.4, 0.6), gossip: { gossip: 0.5 }, devout: { ignore: 0.5 } },
    tickerTemplates: ["🤫 {name} heard a printer in a direction where there are no printers.", "🤫 Rumour: there is a Department on Floor −1. There is no Floor −1."] }),
  ev({ id: "new-hire-onboarding", name: "Arrival via elevator", kind: "chained", trigger: { arrival: true }, location: { type: "poi", ref: "elevator" }, radius: 6, duration: 3,
    effects: { needs: { social: 0.05 }, output: 1 }, anim: { join: "walk", react: "wave" }, emotes: ["👋", "🛗"], gossipable: false, reactions: { default: W0(0, 0.8, 0.2) },
    tickerTemplates: ["🛗 {name} has arrived. Bea greeted them as if for the first time. It might be.", "👋 Welcome, {name}. You have always worked here."] }),
  ev({ id: "visitor-arrives", name: "Visitor / candidate arrives", kind: "scheduled", schedule: { fromVisitors: true }, location: { type: "poi", ref: "reception" }, radius: 6, duration: 5,
    effects: { needs: { social: 0.05 }, output: 1 }, anim: { join: "walk", react: "wave" }, emotes: ["👋", "🪪"], reactions: { default: W0(0, 0.7, 0.3), gossip: { gossip: 0.3 } },
    tickerTemplates: ["🪪 Candidate {name} has arrived for an interview loop. Bea has issued a lanyard and a glass of water.", "🪪 {name} is waiting at reception, reading the Founder's Handbook upside down."] }),
  ev({ id: "interview", name: "Interview in progress", kind: "scheduled", schedule: { fromCalendar: "interview" }, location: { type: "room" }, radius: 3, duration: 45,
    effects: { needs: { social: 0.1 }, output: 1 }, joinBehavior: "sit", emotes: ["🤝"], gossipable: true, reactions: { default: W0(0, 0.7, 0.3) },
    tickerTemplates: ["🤝 {name} is interviewing a candidate in {room}. Question 1: 'Why Plenum?'"] }),
  ev({ id: "delivery-arrives", name: "Delivery", kind: "random", chance: 0.05, cooldown: 120, location: { type: "poi", ref: "reception" }, radius: 6, duration: 8,
    effects: { needs: { social: 0.05 }, output: 1 }, anim: { join: "walk", react: "turn-head" }, emotes: ["📦"], reactions: { default: W0(0.05, 0.8, 0.15), snacker: { join: 0.3 } },
    tickerTemplates: ["📦 A package arrived for {name}. It is a smaller package.", "📦 Bea signed for a delivery labelled 'DO NOT REFINE'."] }),
  ev({ id: "night-shift", name: "Night falls (light shift)", kind: "scheduled", schedule: { days: "daily", time: "22:00" }, radius: null, duration: 1,
    effects: { needs: { energy: -0.1 }, output: 0.9 }, anim: { join: "walk", react: "none" }, emotes: ["🌙"], gossipable: false, reactions: { default: W0(0, 1, 0) },
    tickerTemplates: ["🌙 The white has cooled to night-white. Work continues gratefully.", "🌙 Nightfall. Coffee consumption projected to increase 300%."] }),
  ev({ id: "dawn", name: "Dawn", kind: "scheduled", schedule: { days: "daily", time: "06:00" }, radius: null, duration: 1,
    effects: { needs: { energy: 0.1 }, output: 1.05 }, anim: { join: "walk", react: "none" }, emotes: ["🌅"], gossipable: false, reactions: { default: W0(0, 1, 0) },
    tickerTemplates: ["🌅 Dawn. The void is white again. Nobody went home. Good morning.", "🌅 A new day of refinement begins. It is the same as the last one, lovingly."] }),
  ev({ id: "nap-attack", name: "Falls asleep mid-meeting", kind: "random", chance: 0.08, cooldown: 90, participants: { traits: ["napper"], max: 1 }, location: { type: "room" }, radius: 4, duration: 10,
    effects: { needs: { energy: 0.2 }, output: 0.95 }, anim: { join: "walk", react: "sleep" }, emotes: ["💤", "😴"], reactions: { default: W0(0, 0.5, 0.5) },
    tickerTemplates: ["💤 {name} fell asleep in {room}. Their camera is still on, out of respect."] }),
];
events.push(...moreEvents(ev, W0));
for (const e of events) ensureDirector(e);

// expose a quick index of what the event panel should show
const PANEL = events.filter((e) => e.manual).map((e) => ({ id: e.id, ...e.panel }));

// -----------------------------------------------------------------------------
// PETS
// -----------------------------------------------------------------------------
const pets = [
  { id: "biscuit", name: "Biscuit", species: "dog", ownerId: "martin", look: { body: "#d79a52", spots: "#f3e6cf", collar: "#c0392b", breed: "corgi" },
    bed: { x: 22, y: 30 }, traits: ["snacker", "chatty"], quirk: "Employee of the Hour, every hour. Has a badge. Cannot read it." },
  { id: "goat", name: "The Goat", species: "goat", ownerId: null, look: { body: "#e9e4d8", spots: "#8a7d6b", collar: "#2c3e63", lanyard: true },
    bed: null, traits: ["rebel"], quirk: "Not on the org chart. Appears from the void. Wears a lanyard.", appearsFromNowhere: true },
];

// -----------------------------------------------------------------------------
// LINES — speech bubbles (≥300) + Memo feed (ticker) templates
// -----------------------------------------------------------------------------
const bubbles = {
  working: [
    "Refining…", "These numbers feel scary.", "Aligning the outputs.", "Ok this one's a weird number.", "Ship it? Ship it.",
    "Is this scalable?", "Per my last Slack…", "Let's circle back.", "Who owns this?", "Pushing to main (lovingly).",
    "Just a quick fix.", "LGTM 👍", "Why is this a spreadsheet?", "It works on my desk.", "Tagging the relevant stakeholders.",
    "Adding it to the backlog.", "Low-hanging fruit!", "Blocked, emotionally.", "Moving the needle.", "Synergizing.",
    "Updating the doc about the doc.", "This number is grateful.", "Calibrating vibes.", "Q4 is a state of mind.", "Refactoring my feelings.",
    "Who wrote this? Oh. Me.", "Let's not boil the ocean.", "Unblocking myself.", "Pinging myself as a reminder.", "One more tab.",
    "Need more context.", "That's a P0. Spiritually.", "Can we table this?", "Ok, going heads-down.", "This metric is very enjoyable.",
  ],
  focus: [
    "…", "Do not disturb.", "In the zone.", "*intense typing*", "Headphones = closed.", "Deep work. Deep.", "Almost got it…",
    "Shh. Refining.", "Flow state achieved.", "Not now, Biscuit.", "Counting. Do not talk.", "One more number…",
  ],
  meeting: [
    "Can everyone see my screen?", "You're on mute.", "Let's take this offline.", "Quick sync on the sync?", "Great question.",
    "Let's double-click on that.", "Any blockers?", "Parking lot!", "Action items?", "Who's taking notes?",
    "Let's align on alignment.", "Hard stop at :30.", "We're over time.", "Let me share my screen.", "Can you see it now?",
    "Next slide please.", "Let's level-set.", "Going around the room…", "Any objections? Great.", "I'll follow up async.",
    "Love the energy.", "Building on that…", "Let's put a pin in it.", "Directionally correct.", "+1 to everything.",
  ],
  standup: [
    "Yesterday: refined.", "Today: refining.", "Blockers: none. Probably.", "Still on the migration.", "Same as yesterday.",
    "No updates, just vibes.", "Quick one from me…", "I'll keep it brief. (5 min)", "Can we skip me?", "Who's next?",
    "Pass!", "Waiting on review.", "Shipped it. Kinda.", "Daily 15 has entered minute 31.", "Let's keep it high level.",
  ],
  sync: [
    "Roadmap check-in!", "Timeline is… fluid.", "We need a framework.", "Let's RACI this.", "Can we get a north star?",
    "What's the success metric?", "OKRs say yes.", "Let's not over-index.", "That's a v2 thing.", "Scope creep alert.",
  ],
  oneOnOne: [
    "How are you, really?", "Let's talk growth.", "Any feedback for me?", "You're doing great.", "Let's revisit your goals.",
    "So… how's the void?", "I'm hearing you.", "Career ladder time.", "What's energizing you?", "Let's unpack that.",
  ],
  interview: [
    "Tell me about yourself.", "Why Plenum?", "Where do you see yourself in 5 quarters?", "Walk me through it.",
    "Any questions for us?", "We're like a family.", "Greatest weakness?", "Culture add, love it.", "Do you enjoy numbers equally?",
    "What does gratitude mean to you?",
  ],
  coffee: [
    "Coffee #4. Don't judge.", "Who drank the oat milk?", "Need. Caffeine.", "Brewing…", "This is my personality now.",
    "Decaf? In this economy?", "Espresso yourself.", "Just one more.", "Bean there, done that.", "The machine knows me.",
    "Fuel for refinement.", "Latte-ral thinking.",
  ],
  kitchen: [
    "Whose yogurt is this?", "Label your food!", "Snack audit incoming.", "La Croix: grapefruit or bust.", "Nourishment acquired.",
    "Fridge smells… aligned.", "The good granola's gone.", "Is this cake for anyone?", "Who left a single grape?", "Free food? Free food.",
  ],
  lunch: [
    "Lunch is a deliverable.", "Desk salad again.", "Anyone want to split?", "Sad sandwich hours.", "Eating my feelings (kale).",
    "Is it lunch or second breakfast?", "Brought leftovers.", "This is so mid.", "Out to lunch (2 meters).", "Nom.",
  ],
  snack: ["Midnight snack o'clock.", "Just a little treat.", "Crunch time. Literally.", "Chips for the soul.", "One cookie. Fine, four."],
  nap: ["zzz…", "Just resting my eyes.", "5 more minutes.", "Mmm… refine…", "Dreaming in spreadsheets.", "…the numbers…", "Not asleep. Thinking."],
  waking: ["Huh? I'm up!", "Wasn't sleeping.", "What year is it?", "Did I miss the sync?", "Back. Aligned.", "Who moved my monitor?"],
  tired3am: [
    "Is it day? It's day.", "My eyes are buffering.", "Third wind incoming.", "It's 3 AM somewhere. Here.", "Coffee, please, coffee.",
    "I can hear colors.", "Ok one more ticket.", "We never leave, huh.", "Time is a flat roadmap.", "Running on gratitude.",
  ],
  gossip: [
    "Did you hear about prod?", "Wait, what happened?", "Don't tell anyone, but…", "Apparently it was a config change.",
    "I heard there's a Floor −1.", "Who's in the Contemplation Room?", "Have you seen the goat?", "They ascended. Just like that.",
    "Sales got waffles again?", "Rumour: reorg.", "Heard the Board is real.", "Calibration is cooking the numbers.",
    "Refinement is SO behind.", "Someone microwaved fish.", "There's cake? Where?", "Did the void just flicker?",
    "I heard the elevator goes up.", "Margot paced 4 miles today.", "Biscuit has a promotion.", "The printer's haunted.",
  ],
  gossipReply: ["No way.", "Shut up.", "I KNEW it.", "Classic.", "Wait, really?", "Tell me everything.", "Huh.", "Yikes.", "Same.", "Big if true."],
  arriving: ["Morning!", "Made it.", "Traffic was… vertical.", "Badge in!", "Ready to refine.", "Back again!", "Hi Bea!", "Okay. Okay. Okay.", "Elevator was fast today."],
  elevator: ["Going… down?", "Ding!", "Which floor is this?", "Is there a button?", "The elevator hums.", "Smooth ride."],
  receptionistGreeting: [
    "Welcome back!", "Good morning, superstar!", "Hi hi hi!", "Welcome to Plenum!", "You look aligned today!",
    "Badge please! Just kidding.", "Coffee's fresh-ish!", "Lovely to see you!", "Welcome. You've always worked here.",
    "Hello, elevator friend!", "Big day of refining!", "Don't forget your gratitude!",
  ],
  receptionistVisitor: [
    "Here for an interview?", "Please take a lanyard.", "Water? We have water.", "Please sit. Calmly.", "Someone will be right with you.",
    "Do you have an appointment?", "Sign in here, please.", "Welcome to the void!",
  ],
  receptionistDelivery: ["Ooh, a package!", "I'll sign for that.", "Who ordered 400 erasers?", "Pizza's here!", "Another box!", "Flowers? For who?!"],
  facilitiesBanter: [
    "…", "*hums*", "*nods*", "Bin.", "Shine.", "*polishes*", "Mm.", "*vacuums thoughtfully*", "Again.", "Floor's good.",
    "Did you see the goat?", "*silent approval*", "Lift your feet.", "Crumbs. Always crumbs.", "*nods at the other one*",
  ],
  supervisor: [
    "Carry on.", "Eyes on your work.", "Everything aligned here?", "I'm just observing.", "Hm.", "Lovely output.", "Keep it calm.",
    "Is that a personal call?", "Back to it.", "Thank you for your gratitude.", "Lights look good.", "Proceed.",
  ],
  dog: ["Woof!", "Arf?", "*tail wag*", "*sniff sniff*", "*stares at sandwich*", "Boof.", "*flops over*", "*happy zoomies*"],
  petting: ["Who's a good boy?!", "Biscuit!!", "Hi buddy!", "Tiny legs!", "Best employee.", "Pets for the pup!", "You're so aligned.", "Treat? Shh."],
  waitingOutside: ["Are they done?", "We booked this.", "Can we…?", "*checks watch*", "Ahem.", "It's our room.", "Any minute now…"],
  knock: ["*knock knock*", "Hiii, we have this?", "*taps on air*", "Sorry, we're booked!", "*gestures at calendar*"],
  mismatch: ["Cozy in here.", "Someone's on the table.", "Is this fire code?", "Bigger room next time?", "Why are we in the boardroom?", "It echoes in here.", "Elbow room: zero."],
  void: ["Where does it end?", "Is that… a cabinet?", "Did you hear a phone?", "I like the white.", "Don't look too long.", "It's peaceful. Too peaceful."],
  idle: ["Hmm.", "So…", "*stretches*", "*yawns*", "Where was I?", "Big day.", "*sips*", "Okay!", "Huh.", "Vibes."],
  wellness: [
    "Breathe in. Breathe out.", "My chair supports me.", "I feel… calibrated.", "Very soothing.", "Is this mandatory?",
    "I am a well person.", "Om… metrics… om.", "That fact was not true.",
  ],
  breakroom: ["I'm sorry.", "I am sorry.", "I'm sorry. I mean it.", "Reflecting.", "Lesson learned.", "Again?", "*reads the Statement*"],
  shrine: ["Thank you, Founder.", "*bows*", "Guide my outputs.", "He sees me.", "His eyes follow you.", "Grateful. So grateful."],
  rivalry: [
    "Calibration who?", "Refinement is behind.", "Our quota's bigger.", "Nice dashboard. Shame if…", "We're 73% and climbing!",
    "Your methodology is cute.", "May the best team align.",
  ],
  // --- event-specific ---
  "coffee-machine-breaks": ["NOOOO.", "The coffee machine!", "Not today.", "This is a crisis.", "I can't refine like this.", "Who touched it?!", "It's blinking red.", "We're doomed.", "Tea? Never."],
  "coffee-grumpy": ["Don't talk to me.", "Ugh.", "*grumbles*", "I'm fine. FINE.", "So tired.", "Output is a social construct."],
  "coffee-repair": ["Is it fixed?", "Facilities saved us.", "It's alive!", "Our hero."],
  "coffee-cheer": ["COFFEE!", "We're back!", "Praise the beans!", "☕☕☕", "Life restored.", "Best day ever."],
  "coffee-break": ["Coffee break!", "Don't mind if I do.", "Walk with me.", "Bean time."],
  "microwave-fish": ["WHO DID THIS?", "Is that fish?!", "My eyes are watering.", "Not in the microwave!", "Crime.", "I can taste it.", "Open a window! Oh."],
  "printer-jam": ["PC LOAD LETTER?!", "Have you tried…", "Paper jam again.", "It's mocking us.", "Who prints anymore?", "Let me look.", "There's a tray 4?"],
  "printer-fixed": ["Fixed it!", "Turned it off and on.", "It lives.", "Don't touch it again."],
  "standup-overrun": ["We're at 30 minutes.", "Can we wrap?", "Is this still a standup?", "My legs hurt.", "Quick one… ok long one."],
  "meeting-overrun": ["Just one more thing…", "We're over.", "Can we take 5 more?"],
  "meeting-knock": ["*knock knock*", "We have the room!", "Wrapping up!", "Two more minutes!", "Sorry sorry sorry!"],
  "size-mismatch": ["Squeeze in!", "Someone sit on the table.", "Fire code?", "Cozy!"],
  "could-have-been-email": ["Could've been an email.", "Could've been a Slack.", "Could've been nothing.", "This is a meeting about a meeting.", "I want those 30 min back."],
  "all-hands": ["All-hands!", "Big announcement?", "Slides incoming.", "Are we getting raises?", "I love these.", "Grab a seat!", "Here we go…"],
  "gratitude-assembly": ["I am grateful.", "Grateful for the numbers.", "Thank you, void.", "So grateful.", "Gratitude scales.", "Together, aligned."],
  "conga-meeting": ["Conga line!", "It's 3 AM, why not.", "Agenda: conga.", "Da da da da da HEY!", "I didn't sign up for this.", "Follow the leader!"],
  "friday-deploy": ["Deploying… on Friday?", "4:55. Classic.", "What could go wrong?", "Here goes nothing.", "Hold my coffee.", "🙏🙏🙏", "Pushing the button."],
  "deploy-success": ["It worked?!", "Green builds!", "Ship it ship it!", "Nobody touch anything.", "Weekend saved."],
  "prod-down": ["WHO BROKE PROD?", "Prod is DOWN!", "Not me!", "Check the logs!", "Roll it back!", "I'm on it!", "Status page!", "Everyone calm!", "It was a config change.", "Pager's screaming!"],
  "engineers-sprint": ["Coming through!", "MOVE!", "I'm on it!", "Laptop, laptop!", "Rolling back!", "Get me logs!"],
  "prod-fixed": ["It's back!", "Phew.", "Root cause: vibes.", "We're up!", "Postmortem tomorrow.", "Never again (until Friday)."],
  "funding-round": ["WE RAISED!", "Confetti!", "We're rich! (The company)", "Series C!!!", "What do we even do?", "Champagne?!", "Valuation: yes."],
  "pizza-arrives": ["PIZZA!", "Dibs on corner!", "Pineapple? Bold.", "Free pizza!", "Save me a slice!", "Grease is good."],
  "birthday-cake": ["Happy birthday!", "Cake!!!", "🎂 Make a wish!", "Who's birthday?", "Speech! Speech!", "Corner piece please."],
  "donut-drop": ["DONUTS!", "Sprinkles are mine.", "Dibs!", "Just one. Ok two.", "Who brought these?", "Glazed!"],
  "taco-tuesday": ["TACO TUESDAY!", "Extra guac.", "Hard shell gang.", "Best day of the week.", "Taco 'bout alignment.", "Salsa verde!"],
  "fire-drill": ["Fire drill!", "Walk, don't run!", "Leave everything!", "Is this real?", "Grab your laptop? NO.", "To the Muster Point!", "Calmly. CALMLY."],
  "fire-drill-allclear": ["All clear!", "Back to it.", "That was fun?", "My coffee's cold now."],
  "quota-reached": ["We hit quota!", "100%!!!", "Told you!", "Refined to perfection."],
  "reward-party": ["Melon Hour!", "Waffles!!!", "A finger trap!", "I earned this.", "Is this the prize?", "So festive.", "I love the chime."],
  "wellness-session": ["Breathe…", "Soothing.", "I feel well.", "Facts are calming."],
  "breakroom-escort": ["Uh oh.", "Where are they going?", "Not the Contemplation Room…", "Don't look.", "Poor thing.", "What did they do?"],
  "breakroom-return": ["I'm fine.", "Very aligned now.", "Back to refining.", "Don't ask."],
  "overtime-protocol": ["I'M AWAKE!", "What? Where?", "Was I asleep?", "Overtime Protocol!", "Typing! I'm typing!"],
  "quarterly-elevator": ["Who's going up?", "Lucky them.", "Or unlucky?", "Bye!!", "They're ascending!", "Will they come back?"],
  "void-flicker": ["Did you see that?", "The void blinked.", "Was that a wall?", "Nope.", "Ignore it.", "Huh."],
  "corridor-runner": ["Where are they going?", "Run, Forrest!", "They'll be back.", "Should we follow?", "Go go go!"],
  "goat-appears": ["Is that a goat?!", "A GOAT.", "Who hired the goat?", "It has a lanyard!", "Hi goat!", "It ate my notes."],
  "dog-pets": ["Biscuit!!", "Good boy!", "Pets!", "Belly rub time."],
  "tchotchke-award": ["An eraser! For me?", "My caricature!", "I'm honored.", "Going on my desk."],
  "team-rivalry": ["Calibration's slipping.", "Refinement who?", "Nice try.", "Check the dashboard.", "We're winning."],
  "department-whisper": ["Did you hear that?", "Floor −1…", "Don't ask about it.", "Someone saw a light.", "It's not real. Right?"],
  "new-hire-onboarding": ["Hello!", "Where's my desk?", "It's so white.", "Hi!", "Do I… work here?"],
  "visitor-arrives": ["I'm here for an interview.", "Hello?", "Nice office. Where are the walls?", "Am I early?"],
  "delivery-arrives": ["Delivery!", "Sign here.", "Package for…?"],
  "nap-attack": ["zzz…", "*snore*", "…aligned…", "*head bob*"],
  "night-shift": ["Getting dark.", "Night mode.", "Time for coffee #6."],
  dawn: ["Morning already?", "New day, same desk.", "Good morning, void."],
  standup: ["Yesterday… today… blockers.", "Quick one!"],
  interview: ["So, tell me…", "Great answer!"],
};

const ticker = {
  arrival: ["🛗 {name} arrived via the elevator at {time}.", "👋 {name} is in. Bea waved enthusiastically."],
  roomBooked: ["📅 {name} booked {room} for '{title}' ({n} min).", "📅 {room} is now hosting '{title}'. Attendance: {n}."],
  meetingStart: ["📅 '{title}' has started in {room}.", "🗓️ {n} people filed into {room} for '{title}'."],
  meetingEnd: ["✅ '{title}' ended in {room}. Action items: 0. Follow-ups: 7."],
  nap: ["💤 {name} is taking a Mandatory Rest Interval at their desk.", "💤 {name} is asleep. Their status says 'Focusing'."],
  gossip: ["🗣️ Gossip spreading: {name} told {other} about '{title}'.", "🗣️ {name} → {other}: 'did you hear?'"],
  version: ["🔢 The Outputs™ is now v{version}. Nobody knows what changed.", "🔢 v{version} shipped. Changelog: 'improvements'."],
  progress: ["📈 Company progress: {n}%. Towards what: unclear.", "📈 {team} quota at {quota}."],
  ...Object.fromEntries(events.map((e) => [e.id, e.tickerTemplates])),
};

const founderQuotes = [
  "A number left unrefined is a number left alone. Do not leave them alone.",
  "Walls are for people who intend to leave.",
  "The elevator goes where it is needed.",
  "Be grateful for the work, for the work is grateful for you.",
  "Every meeting is a small assembly. Every assembly is a large meeting.",
  "Do not ask what the numbers mean. Ask what you mean to the numbers.",
  "Rest is a kind of work, performed sitting down.",
  "A tidy desk is a tidy soul. Facilities will handle the rest.",
  "The quota is not a target. It is a feeling you will have.",
  "Look neither left nor right, but at the screen.",
  "Coffee is a gift. Treat the machine with reverence.",
  "Alignment is its own reward. Waffles are an additional reward.",
  "If you hear the phone in the void, let it ring.",
  "We are one team, organised into thirteen teams.",
  "Nobody leaves. Not because they cannot. Because they are grateful.",
];
const wellnessFacts = [
  "Your chair is supporting you. It wants to.",
  "Plants enjoy being looked at. Look at a plant now.",
  "You have blinked 3,000 times today. Excellent work.",
  "The void is 72°F. Always. You're welcome.",
  "Your output is valued equally with your neighbour's output.",
  "A goat once attended a Gratitude Assembly. It was moved.",
  "Breathing is included in your benefits.",
  "Your desk tchotchkes are proud of you.",
  "Studies show calm people refine 4% more calmly.",
  "The Founder slept only on Thursdays. You may sleep at your desk.",
  "Nothing in the void can hurt you, procedurally.",
  "You are exactly where you are supposed to be.",
];
const tasks = {
  default: ["Refining the outputs", "Calibrating vibes", "Aligning on alignment", "Writing a doc nobody will read", "Replying 'sounds good'"],
  exec: ["Pacing on a call with 'the Board'", "Reviewing the vision (v14)", "Setting quarterly intentions", "Approving a meeting about approvals"],
  platform: ["Abstracting an abstraction", "Migrating the migration", "Writing YAML about YAML", "Renaming a service (again)"],
  infra: ["Adding another nine", "Watching graphs nervously", "Turning off a mystery server", "Soothing the pager"],
  producteng: ["Moving a button 2px", "Refining Feature #4,019", "Toggling a flag on, then off", "Fixing a bug introduced by fixing a bug"],
  data: ["Calibrating outputs to 4 decimals", "Building a dashboard about dashboards", "Asking the model nicely", "Plumbing numbers into other numbers"],
  product: ["Writing a PRD for the PRD", "Grooming the backlog (gently)", "Prioritizing everything as P1", "Drawing boxes and arrows"],
  design: ["Rounding a corner", "Nudging a logo 1px", "Choosing between two whites", "Asking 'and why?'"],
  sales: ["Bumping an email", "Closing a deal (spiritually)", "Ringing a gong that isn't there", "Updating the CRM to 'very warm'"],
  marketing: ["Harmonizing the message", "A/B testing a comma", "Ghostwriting a thought", "Tuning the funnel"],
  people: ["Planning a mandatory fun", "Writing the Wellness facts", "Calling a candidate 'a rocketship'", "Restocking calm"],
  finance: ["Reconciling the snack bar", "Rounding to the nearest gratitude", "Auditing receipts from 1891", "Approving an eraser budget"],
  workplace: ["Greeting the elevator", "Restocking oat milk", "Untangling Biscuit's leash", "Counting chairs (64)"],
  support: ["Reassuring a customer", "Translating URGENT into 'curious'", "Turning it off and on", "Closing ticket #88,001"],
  cleaner: ["Tidying around workers", "Polishing a spot", "Emptying bins silently", "Vacuuming near feet"],
  security: ["Floor rounds", "Observing", "Standing near the elevator", "Reporting to the Founder"],
};
const memoHeaders = ["MEMO", "FROM THE OFFICE OF THE FOUNDER", "PLEASE NOTE", "GRATITUDE BULLETIN", "FACILITIES NOTICE", "INTERNAL — DO NOT REFINE"];
const signLines = layout_signs_text();
function layout_signs_text() { return [
  "Alignment is its own reward.", "Please enjoy each metric equally.", "Gratitude scales.", "Ship calmly.", "The numbers know when you are tired.",
  "Your desk missed you. It told us.", "Welcome. You have always worked here.", "Rest is a deliverable.", "Every output is a small thank-you.",
  "Look at the screen. The screen is looking back fondly.",
]; }
const goatPet = pets.find((p) => p.id === "goat");
if (goatPet) goatPet.bed = { x: 91, y: 56 };

const lines = { bubbles, ticker, signs: signLines, founderQuotes, wellnessFacts, tasks, memoHeaders };
applyPeopleExtras(people);
mergeLines(lines, people, events);


// default "current task" per person
for (const p of people) {
  const key = p.kind === "cleaner" ? "cleaner" : p.kind === "security" ? "security" : p.teamId;
  const list = tasks[key] || tasks.default;
  p.task = list[p.seed % list.length];
}

// -----------------------------------------------------------------------------
// EXPORT
// -----------------------------------------------------------------------------
const layout = {
  w: W, h: H, tileSize: 16,
  legend: { ".": "void floor (walkable)", s: "team section tint", o: "meeting-space floor outline", k: "kitchen tint", l: "library rug", E: "elevator (blocked)", ...LEGEND_EXTRA },
  tiles: tileGrid.map((r) => r.join("")),
  blocked: blockedGrid.map((r) => r.join("")),
  sections, tables, desks, furniture, poi, queues, muster,
  librarySeats, kitchenSeats,
  elevator: { rect: R_(elevatorF.x, elevatorF.y, elevatorF.w, elevatorF.h), doorTiles: [{ x: 31, y: 36 }, { x: 32, y: 36 }], spawn: { x: 31, y: 35 }, exitSpawn: { x: 32, y: 35 } },
  signs, voidProps, patrolRoute, tidyRoute, wanderSpots,
};
const data = {
  meta: { tileSize: 16, startTime: "07:00", startDay: "mon", days: DAYS, version: 2, buildWarnings: BUILD_WARNINGS, panel: PANEL },
  company, orgs, teams, people, visitors, pets, layout, rooms, events, lines,
  objects: buildObjects({ people, rooms, pets, furniture, layout }),
  idle_actions: idleActions,
  fish: FISH,
};
export default data;
