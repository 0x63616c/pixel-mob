// World expansion for Plenum Industries (void floor, events, objects, aquarium).
// Imported by company.js. Deterministic. No Math.random.

import { EXTRA_BUBBLES, BANTER, FOUNDER_MEMOS, ANTI_REPEAT, PERSON_KEYS } from "./voice.js";

export const LEGEND_EXTRA = {
  a: "archive rug",
  n: "nap-pod island",
  b: "break / recreation island",
  q: "aquarium island",
  g: "goat pen",
  m: "mail room",
  i: "IT help desk",
  p: "plant wall",
  x: "quiet annex section",
  v: "void offsite / board table",
};

export function relocateVoidProps(voidProps) {
  const moves = {
    "void-phone": { x: 110, y: 18 },
    "void-corridor": { x: 96, y: 19, w: 400, h: 1 },
    "void-chair": { x: 108, y: -30 },
  };
  for (const v of voidProps) if (moves[v.id]) Object.assign(v, moves[v.id]);
  voidProps.push(
    { id: "void-second-phone", type: "desk-phone", x: -28, y: 80, note: "Another phone. It does not ring. That is worse." },
    { id: "void-empty-frame", type: "photo", x: 40, y: -22, note: "A frame. The photo has gone to a meeting." },
  );
}

export function addIslands(ctx) {
  const { put, R_, room, rooms, sections, tables, desks, poi, queues, signs, patrolRoute, tidyRoute, wanderSpots, pets } = ctx;

  // ----- The Quiet Annex: second pod cluster (hotdesks) -----
  sections.push({ id: "sec-annex", name: "The Quiet Annex", sign: "THE QUIET ANNEX", teamIds: [], rect: R_(66, 8, 16, 12), label: { x: 74, y: 8 }, lightZone: "sec-annex" });
  // two 4-desk pods
  for (const [tid, tx, ty] of [["annex-a", 68, 11], ["annex-b", 76, 11]]) {
    tables.push({ id: "table-" + tid, sectionId: "sec-annex", x: tx, y: ty + 1, w: 4, h: 2 });
    put("table", tx, ty + 1, 4, 2, true, { sectionId: "sec-annex", id: "table-" + tid, long: true });
    let n = 0;
    for (const [row, facing, my] of [[ty, "down", ty + 1], [ty + 3, "up", ty + 2]]) {
      for (let k = 0; k < 2; k++) {
        const x = tx + 1 + k * 2;
        const d = { id: `${tid}-d${++n}`, x, y: row, facing, sectionId: "sec-annex", tableId: "table-" + tid, monitor: { x, y: my }, ownerId: null, kind: "hotdesk" };
        desks.push(d);
        put("desk-chair", x, row, 1, 1, false, { sectionId: "sec-annex", deskId: d.id, facing });
        put("crt", x, my, 1, 1, false, { sectionId: "sec-annex", deskId: d.id, decal: true });
      }
    }
  }
  put("plant-tall", 81, 14, 1, 1, true, { sectionId: "sec-annex" });
  signs.push({ id: "sign-annex", x: 74, y: 7, text: "The Quiet Annex. Sitting is transferable.", kind: "section" });

  // ----- more meeting spaces (east, north of annex) -----
  put("whiteboard", 67, 2, 4, 1, true, { roomId: "team-4" });
  put("table", 67, 4, 5, 2, true, { roomId: "team-4" });
  room("team-4", "Retrospective Harbor", "team", R_(66, 2, 8, 6), { x: 69, y: 7 },
    [{ x: 69, y: 8 }, { x: 70, y: 8 }, { x: 68, y: 8 }],
    [[67, 3, "down"], [68, 3, "down"], [69, 3, "down"], [70, 3, "down"], [67, 6, "up"], [68, 6, "up"], [69, 6, "up"], [70, 6, "up"]],
    { capacity: 8 });

  put("table", 76, 4, 4, 2, true, { roomId: "team-5" });
  put("whiteboard", 76, 2, 4, 1, true, { roomId: "team-5" });
  room("team-5", "The Alignment Conservatory", "team", R_(75, 2, 8, 6), { x: 78, y: 7 },
    [{ x: 78, y: 8 }, { x: 79, y: 8 }, { x: 77, y: 8 }],
    [[76, 3, "down"], [77, 3, "down"], [78, 3, "down"], [76, 6, "up"], [77, 6, "up"], [78, 6, "up"]],
    { capacity: 6 });

  put("table", 85, 3, 1, 2, true, { roomId: "huddle-4" });
  room("huddle-4", "Per My Last", "huddle", R_(84, 2, 5, 5), { x: 84, y: 5 },
    [{ x: 83, y: 5 }, { x: 83, y: 4 }],
    [[84, 3, "right"], [86, 3, "left"], [84, 4, "right"], [86, 4, "left"]],
    { capacity: 4 });

  put("table", 91, 3, 1, 2, true, { roomId: "huddle-5" });
  room("huddle-5", "Let's Offline This", "huddle", R_(90, 2, 5, 5), { x: 90, y: 5 },
    [{ x: 89, y: 5 }, { x: 89, y: 4 }],
    [[90, 3, "right"], [92, 3, "left"], [92, 4, "left"]],
    { capacity: 3 });

  put("table", 85, 9, 1, 2, true, { roomId: "huddle-6" });
  room("huddle-6", "Sync Adjacent", "huddle", R_(84, 8, 5, 5), { x: 84, y: 11 },
    [{ x: 83, y: 11 }, { x: 83, y: 10 }],
    [[84, 9, "right"], [86, 9, "left"], [84, 10, "right"], [86, 10, "left"]],
    { capacity: 4 });

  put("pod-booth", 91, 8, 1, 1, true, { roomId: "booth-4" });
  room("booth-4", "The Second Silence", "booth", R_(90, 8, 3, 3), { x: 90, y: 9 },
    [{ x: 89, y: 9 }, { x: 89, y: 10 }],
    [[91, 9, "up"]], { capacity: 1 });

  put("pod-booth", 91, 12, 1, 1, true, { roomId: "booth-5" });
  room("booth-5", "Annex Booth (Unlisted)", "booth", R_(90, 12, 3, 3), { x: 90, y: 13 },
    [{ x: 89, y: 13 }],
    [[91, 13, "up"]], { capacity: 1 });

  // ----- IT help desk -----
  put("it-desk", 68, 24, 4, 1, true, { label: "IT Help" });
  put("desk-chair", 69, 25, 1, 1, false, { facing: "up" });
  put("crt", 69, 24, 1, 1, false, { decal: true });
  put("cabinet", 73, 24, 2, 2, true, { label: "Spares" });
  put("bin", 66, 24);
  signs.push({ id: "sign-it", x: 70, y: 22, text: "Have you tried aligning it?", kind: "wayfinding" });

  // ----- Mail room -----
  put("mail-counter", 82, 24, 6, 1, true, { label: "Mail" });
  put("mail-slot", 82, 23, 6, 1, true, { label: "Slots" });
  put("package", 83, 25, 1, 1, true);
  put("package", 86, 25, 1, 1, true);
  put("cabinet", 88, 24, 2, 2, true, { label: "Parcels" });
  put("facilities_cart", 80, 27, 1, 1, false, { label: "Mail cart" });
  signs.push({ id: "sign-mail", x: 85, y: 22, text: "The mail is grateful to be here.", kind: "wayfinding" });

  // ----- Plant wall -----
  for (let y = 8; y <= 28; y += 2) put("plant-tall", 93, y, 1, 1, true, { area: "plant-wall" });
  for (let y = 9; y <= 27; y += 2) put("plant", 94, y, 1, 1, true, { area: "plant-wall" });
  signs.push({ id: "sign-plants", x: 93, y: 4, text: "Please greet the plants as colleagues.", kind: "motivational" });

  // ----- Mysterious door (no wall) -----
  put("mystery-door", 88, 34, 2, 2, true, { label: "—" });
  signs.push({ id: "sign-door", x: 88, y: 32, text: "This is a door.", kind: "wayfinding" });

  // ----- Break area: ping-pong + vending -----
  put("ping-pong-table", 22, 46, 6, 3, true, { area: "break" });
  put("vending-machine", 18, 45, 2, 3, true, { area: "break" });
  put("bin", 20, 45);
  put("stool", 21, 49, 1, 1, false, { facing: "up", area: "break" });
  put("stool", 29, 49, 1, 1, false, { facing: "up", area: "break" });
  put("sofa", 30, 45, 3, 1, false, { area: "break" });
  put("plant", 18, 44);
  signs.push({ id: "sign-break", x: 25, y: 43, text: "Recreation is a form of alignment.", kind: "section" });

  // ----- Wellness grove (south) -----
  put("beanbag", 4, 46, 1, 1, false, { facing: "right" });
  put("beanbag", 6, 46, 1, 1, false, { facing: "up" });
  put("beanbag", 8, 46, 1, 1, false, { facing: "left" });
  put("plant-tall", 2, 45);
  put("plant-tall", 12, 45);
  put("rug", 4, 47, 8, 3, false, { decal: true, area: "wellness-grove" });
  signs.push({ id: "sign-grove", x: 8, y: 43, text: "Breathe in for four, out for the quota.", kind: "motivational" });

  // ----- Nap pods island -----
  for (const [x, y, id] of [[38, 46, "nap-1"], [42, 46, "nap-2"], [46, 46, "nap-3"], [38, 49, "nap-4"], [42, 49, "nap-5"], [46, 49, "nap-6"]]) {
    put("nap-pod", x, y, 2, 2, true, { id, label: "Nap Pod" });
  }
  signs.push({ id: "sign-nap", x: 43, y: 43, text: "Rest is a deliverable.", kind: "section" });

  // ----- Archive / library island -----
  put("bookshelf", 53, 44, 12, 1, true, { label: "The Archive" });
  put("bookshelf", 53, 52, 6, 1, true, { label: "Editions" });
  put("filing_cabinet", 66, 45, 1, 2, true);
  put("filing_cabinet", 67, 45, 1, 2, true);
  put("table", 56, 47, 4, 2, true, { area: "archive" });
  for (const [x, y, f] of [[56, 46, "down"], [57, 46, "down"], [58, 46, "down"], [59, 46, "down"], [56, 49, "up"], [59, 49, "up"]]) {
    put("armchair", x, y, 1, 1, false, { facing: f, area: "archive" });
  }
  put("plant-tall", 52, 48);
  signs.push({ id: "sign-archive", x: 60, y: 43, text: "Please do not sneeze on Year One.", kind: "section" });
  ctx.archiveSeats = [{ x: 56, y: 46, facing: "down" }, { x: 57, y: 46, facing: "down" }, { x: 59, y: 49, facing: "up" }];

  // ----- Aquarium island -----
  put("aquarium-tank", 73, 43, 8, 4, true, { label: "The Tank", area: "aquarium" });
  put("fish-food-shelf", 82, 44, 2, 2, true, { label: "Fish Food", area: "aquarium" });
  put("bench", 73, 48, 6, 1, false, { area: "aquarium" });
  for (let x = 73; x <= 78; x++) put("stool", x, 49, 1, 1, false, { facing: "up", area: "aquarium", decal: true });
  put("plant", 71, 43);
  put("bin", 85, 43);
  signs.push({ id: "sign-aqua", x: 77, y: 41, text: "Please enjoy each fish equally.", kind: "section" });
  signs.push({ id: "sign-gerald", x: 73, y: 42, text: "Gerald swims to the left. He has reasons.", kind: "motivational" });

  // ----- Secret goat pen -----
  for (const [x, y] of [[86, 53], [87, 53], [88, 53], [89, 53], [90, 53], [91, 53], [92, 53], [93, 53], [86, 58], [87, 58], [92, 58], [93, 58], [86, 54], [86, 55], [86, 56], [86, 57], [93, 54], [93, 57]]) {
    put("goat-fence", x, y, 1, 1, true, { area: "goat-pen" });
  }
  put("hay-bale", 89, 55, 2, 1, true, { area: "goat-pen" });
  put("dog-bed", 91, 56, 2, 1, false, { label: "Goat bed", area: "goat-pen" });
  signs.push({ id: "sign-goat", x: 90, y: 52, text: "AUTHORIZED GOATS ONLY", kind: "wayfinding" });

  // ----- Void offsite (White Picnic) -----
  const picnicSeats = [[5, 56, "down"], [7, 56, "down"], [9, 56, "down"], [4, 58, "right"], [10, 58, "left"], [5, 60, "up"], [7, 60, "up"], [9, 60, "up"]];
  room("void-offsites", "The White Picnic", "special", R_(3, 54, 10, 8), { x: 7, y: 61 },
    [{ x: 7, y: 62 }, { x: 8, y: 62 }, { x: 6, y: 62 }],
    picnicSeats, { capacity: 8, purpose: "Offsites held in the void. The void provides the flipchart." });

  // ----- Board visit table -----
  put("table", 19, 57, 10, 2, true, { roomId: "board-visit", long: true });
  put("screen", 22, 54, 4, 1, true, { roomId: "board-visit" });
  const boardSeats = [];
  for (let x = 20; x <= 27; x++) boardSeats.push([x, 56, "down"]);
  for (let x = 20; x <= 25; x++) boardSeats.push([x, 59, "up"]);
  room("board-visit", "The Temporary Table", "special", R_(16, 54, 16, 8), { x: 24, y: 61 },
    [{ x: 24, y: 62 }, { x: 23, y: 62 }, { x: 25, y: 62 }],
    boardSeats, { capacity: 14, purpose: "For when the Board is visiting, or when we practice the Board visiting." });


  const archiveRoom = room("archive", "The Archive (Year One–Present)", "special", R_(52, 44, 16, 10), { x: 58, y: 53 },
    [{ x: 58, y: 54 }, { x: 57, y: 54 }, { x: 59, y: 54 }],
    [],
    { purpose: "Receipts, bound minutes, and one sneeze.", capacity: 6 });
  archiveRoom.seats = ctx.archiveSeats || [{ x: 56, y: 46, facing: "down" }, { x: 57, y: 46, facing: "down" }, { x: 59, y: 49, facing: "up" }];
  const aquaRoom = room("aquarium", "The Tank", "special", R_(70, 42, 16, 9), { x: 76, y: 50 },
    [{ x: 76, y: 51 }, { x: 75, y: 51 }, { x: 77, y: 51 }],
    [],
    { purpose: "Named fish. No tapping. Night glow included.", capacity: 6 });
  aquaRoom.seats = ctx.aquariumSeats || [{ x: 73, y: 49, facing: "up" }, { x: 75, y: 49, facing: "up" }, { x: 77, y: 49, facing: "up" }];

  // ----- POI / queues / routes -----
  Object.assign(poi, {
    annex: { x: 74, y: 16, facing: "up" },
    itdesk: { x: 69, y: 26, facing: "up" },
    mail: { x: 84, y: 26, facing: "up" },
    plantWall: { x: 92, y: 16, facing: "right" },
    mysteryDoor: { x: 88, y: 36, facing: "up" },
    pingpong: { x: 25, y: 50, facing: "up" },
    vending: { x: 20, y: 48, facing: "left" },
    wellnessGrove: { x: 7, y: 48, facing: "up" },
    napPods: { x: 43, y: 48, facing: "up" },
    archive: { x: 58, y: 50, facing: "up" },
    aquarium: { x: 76, y: 47, facing: "up" },
    fishFood: { x: 82, y: 46, facing: "up" },
    goatPen: { x: 88, y: 56, facing: "up" },
    voidOffsites: { x: 7, y: 58, facing: "up" },
    boardVisit: { x: 24, y: 60, facing: "up" },
  });
  queues.itdesk = [{ x: 69, y: 26 }, { x: 70, y: 26 }, { x: 71, y: 26 }, { x: 72, y: 26 }];
  queues.mail = [{ x: 84, y: 26 }, { x: 85, y: 26 }, { x: 86, y: 26 }];
  queues.vending = [{ x: 20, y: 48 }, { x: 20, y: 49 }, { x: 20, y: 50 }];
  queues.fishFood = [{ x: 82, y: 46 }, { x: 83, y: 46 }];

  patrolRoute.push({ x: 74, y: 16 }, { x: 69, y: 26 }, { x: 84, y: 26 }, { x: 88, y: 36 }, { x: 25, y: 50 }, { x: 43, y: 48 }, { x: 58, y: 50 }, { x: 76, y: 47 }, { x: 88, y: 56 }, { x: 7, y: 58 });
  tidyRoute.push({ x: 70, y: 16 }, { x: 82, y: 26 }, { x: 22, y: 50 }, { x: 43, y: 51 }, { x: 60, y: 50 }, { x: 82, y: 47 }, { x: 90, y: 56 });
  wanderSpots.push({ x: 76, y: 47 }, { x: 25, y: 50 }, { x: 20, y: 48 }, { x: 43, y: 48 }, { x: 58, y: 50 }, { x: 88, y: 36 }, { x: 92, y: 16 }, { x: 69, y: 26 }, { x: 88, y: 56 }, { x: 7, y: 56 });

  // The Goat now has a bed in the pen (still appears from nowhere)
  const goat = (pets || []).find((p) => p.id === "goat");
  if (goat) goat.bed = { x: 91, y: 56 };

  ctx.aquariumSeats = [{ x: 73, y: 49, facing: "up" }, { x: 75, y: 49, facing: "up" }, { x: 77, y: 49, facing: "up" }];
}

export function paintExtra(paint, R_) {
  paint(R_(66, 8, 16, 12), "x");
  paint(R_(66, 22, 12, 8), "i");
  paint(R_(80, 22, 12, 8), "m");
  paint(R_(93, 8, 2, 22), "p");
  paint(R_(18, 44, 16, 8), "b");
  paint(R_(36, 44, 14, 8), "n");
  paint(R_(2, 44, 14, 8), "l"); // grove as a rug tint (soft)
  paint(R_(52, 44, 16, 10), "a");
  paint(R_(70, 42, 16, 9), "q");
  paint(R_(86, 52, 9, 8), "g");
  paint(R_(3, 54, 10, 8), "v");
  paint(R_(16, 54, 16, 8), "v");
}

export function addMeetings(ctx) {
  const { book, hours, rot, WEEKDAYS, DAYS, teamMembers, STAFF, P, visitors, V, SKIN, HAIR, C, SHOES, toMin, fromMin, teams } = ctx;

  // Team retros (Friday afternoons)
  teams.forEach((t, i) => book({
    title: `${t.shortName} Retro (Blameless-ish)`,
    type: "review", attendees: teamMembers(t.id), dur: 45,
    starts: rot(hours("14:00", "17:30", 15), i * 2), days: ["fri"], organizerId: t.leadId, room: i % 2 ? "team-4" : "auto",
  }));

  // Void offsites — rotating teams, Thursday
  const offTeams = ["platform", "producteng", "data", "design", "support"];
  offTeams.forEach((tid, i) => book({
    title: `${teams.find((t) => t.id === tid).shortName} Void Offsite`,
    type: "social", attendees: teamMembers(tid), dur: 60,
    starts: rot(hours("13:00", "16:30", 30), i * 3), days: ["thu"], room: "void-offsites", organizerId: teams.find((t) => t.id === tid).leadId, eventId: "void-offsite",
  }));

  // Lunch & learn (Monday)
  const learners = STAFF.filter((p) => p.kind === "staff").slice(0, 10).map((p) => p.id);
  book({ title: "Lunch & Learn: What Are The Outputs", type: "social", attendees: learners, dur: 45,
    starts: hours("12:15", "13:30", 15), days: ["mon"], room: "team-5", organizerId: "theo", eventId: "lunch-and-learn" });

  // Skip-level 1:1s
  const skips = [["margot", "hiroshi"], ["margot", "sofia"], ["dev", "kai"], ["bianca", "destiny"], ["margot", "yuki"], ["dev", "wen"]];
  skips.forEach((pair, i) => book({ title: `"Skip-level": ${P[pair[0]].first} / ${P[pair[1]].first}`, type: "1on1",
    attendees: pair, dur: 30, starts: rot(hours("10:00", "16:00", 30), i * 4), days: [WEEKDAYS[(i + 2) % 5]], organizerId: pair[0], room: i % 2 ? "booth-4" : "huddle-4" }));

  // Architecture review
  book({ title: "Architecture Review (Please Bring a Diagram)", type: "review",
    attendees: ["dev", "hiroshi", "priya", "ingrid", "mei", "analucia"], dur: 60,
    starts: hours("11:00", "16:00", 30), days: ["wed"], room: "team-5", organizerId: "hiroshi" });

  // Scrum of scrums
  const leads = teams.map((t) => t.leadId);
  book({ title: "Scrum of Scrums of Scrums", type: "standup",
    attendees: leads, dur: 25, starts: hours("13:00", "15:00", 15), days: ["mon"], room: "huddle-6", organizerId: "theo", eventId: "scrum-of-scrums" });

  // Fish feeding duty — Martin, mornings
  book({ title: "Fish Feeding (Gerald Eats First)", type: "duty", attendees: ["martin"], dur: 15,
    starts: ["07:15"], room: "aquarium", organizerId: "martin", eventId: "feed-the-fish" });

  // Nap-pod visits for nappers
  STAFF.filter((p) => p.traits.includes("napper")).forEach((p, i) => book({
    title: "Nap Pod Reservation", type: "nap", attendees: [p.id], dur: 25,
    starts: rot(hours("14:00", "16:00", 15), i * 3), days: [WEEKDAYS[i % 5]], room: "napPods",
  }));

  // Archive reading
  for (const id of ["lucy", "henrik", "hiroshi", "ravi", "marisol"]) book({
    title: "Archive Dive (1891–Present)", type: "focus", attendees: [id], dur: 30,
    starts: hours("15:00", "18:00", 30), room: "archive",
  });

  // Board visit (Thursday morning)
  const boardId = "board-1";
  if (!V[boardId]) {
    const v = { id: boardId, name: "M. Board (Visiting)", kind: "visitor", purpose: "board", day: "thu",
      arrive: "09:10", leave: "11:40", hostId: "margot", role: "Member of the Board (Allegedly)",
      look: { skin: SKIN[0], hair: HAIR.platinum || HAIR.blonde || "#d9d0c0", hairStyle: "sidepart", shirt: C.navy, pants: C.charcoal, accessory: "glasses", outfit: "blazer", shoes: SHOES[0] },
      calendar: [] };
    visitors.push(v); V[boardId] = v;
  }
  book({ title: "The Board is Sitting Down", type: "review", attendees: ["margot", "dev", "bianca", "theo", "henrik", "clara"],
    visitors: [boardId], dur: 90, starts: ["09:30"], days: ["thu"], room: "board-visit", organizerId: "margot", eventId: "board-visit", mismatch: false });

  const board2 = "board-2";
  if (!V[board2]) {
    const v = { id: board2, name: "C. Fellow (Also Board)", kind: "visitor", purpose: "board", day: "thu",
      arrive: "09:10", leave: "11:40", hostId: "margot", role: "Board Observer",
      look: { skin: SKIN[4], hair: HAIR.black || "#1a1a1a", hairStyle: "bun", shirt: C.cream, pants: C.navy, accessory: "earrings", outfit: "blazer", shoes: SHOES[1] },
      calendar: [] };
    visitors.push(v); V[board2] = v;
  }
  // add second visitor to the same meeting if possible — book a companion interview-like join
  book({ title: "Board Quiet Observation", type: "review", attendees: ["grace"], visitors: [board2], dur: 45,
    starts: ["09:45"], days: ["thu"], room: "booth-5", organizerId: "grace" });

  // Extra interviews (Wednesday)
  const extraCand = ["cand-5", "Quentin Marsh", "wed", "Staff Facilities Philosopher", ["tyler", "martin", "grace"]];
  {
    const [vid, name, day, roleTitle, panel] = extraCand;
    const v = { id: vid, name, kind: "visitor", purpose: "candidate", day, arrive: null, leave: null, hostId: "tyler", role: roleTitle,
      look: { skin: SKIN[2], hair: HAIR.brown || HAIR.dark || "#5a3a22", hairStyle: "short", shirt: C.sky, pants: C.khaki, accessory: "none", outfit: "cardigan", shoes: SHOES[2] }, calendar: [] };
    visitors.push(v); V[vid] = v;
    panel.forEach((who, k) => book({ title: `Interview: ${name} — Conversation ${k + 1}`, type: "interview",
      attendees: [who], visitors: [vid], dur: 40, starts: hours(k === 0 ? "10:00" : fromMin(10 * 60 + k * 50), "16:00", 10), days: [day], organizerId: "tyler", eventId: "interview", room: k ? "huddle-5" : "huddle-4" }));
    if (v.calendar.length) {
      const its = v.calendar.map((c) => toMin(c.start));
      const ends = v.calendar.map((c) => toMin(c.end));
      v.arrive = fromMin(Math.min(...its) - 15);
      v.leave = fromMin(Math.max(...ends) + 10);
      v.calendar.unshift({ id: `v-${vid}-arrive`, start: v.arrive, end: fromMin(Math.min(...its)), title: "Wait at reception (calmly)", type: "reception", roomId: "reception", attendees: [], days: [day] });
    }
  }

  // Aquarium stare blocks — a few people
  for (const [id, start] of [["aisha", "11:00"], ["kai", "15:30"], ["pablo", "22:00"], ["zara", "12:40"]]) {
    book({ title: "Aquarium Interlude", type: "social", attendees: [id], dur: 15, starts: [start, ...hours(start, "18:00", 30)], room: "aquarium" });
  }
}

export function inferPeriod(e, window) {
  const name = `${e.id} ${e.name}`.toLowerCase();
  if (/night|dawn|3 am|3am|overtime|nocturnal|glow/.test(name) || e.id === "night-shift" || e.id === "dawn") return "night";
  if (/waffle|melon|finger-trap|reward-party|funding|birthday|donut|pizza|promotion/.test(name)) return "afternoon";
  if (/fish|lunch|taco|microwave|snack/.test(name) && !/feed-the-fish|night/.test(e.id)) return /feed-the-fish|morning/.test(e.id) ? "morning" : (/microwave|taco|lunch/.test(name) ? "meal" : "anytime");
  if (e.id === "feed-the-fish") return "morning";
  if (e.kind === "chained") return "anytime";
  if (window.start === "00:00" && (window.end === "24:00" || window.end === "00:00")) return "anytime";
  const s = toMinSafe(window.start), en = toMinSafe(window.end);
  if (s >= 6 * 60 && en <= 11 * 60) return "morning";
  if (s >= 12 * 60 && en <= 18 * 60) return "afternoon";
  if ((s >= 11 * 60 && en <= 14 * 60 + 30) || (s >= 17 * 60 && en <= 20 * 60 + 30)) return "meal";
  if (s >= 21 * 60 || en <= 7 * 60) return "night";
  if (s >= 7 * 60 && en <= 20 * 60) return "day";
  return "anytime";
}
const toMinSafe = (t) => { const [h, m] = String(t).split(":").map(Number); return h * 60 + (m || 0); };

export function ensureDirector(e) {
  const fromWindow = e.window ? { start: e.window.from || e.window.start, end: e.window.to || e.window.end } : null;
  const w = e.director?.window ?? fromWindow ?? inferDefaultWindow(e);
  const window = { start: w.start || w.from || "00:00", end: w.end || w.to || "24:00" };
  e.director = {
    window,
    days: e.director?.days ?? (e.schedule && (e.schedule.days || e.schedule.time) ? (e.schedule.days ?? "daily") : "daily"),
    preconditions: e.director?.preconditions ?? [],
    exclusions: e.director?.exclusions ?? [],
    cooldown: e.director?.cooldown ?? e.cooldown ?? 120,
    weight: e.director?.weight ?? (typeof e.chance === "number" ? e.chance : 1),
    tension_delta: e.director?.tension_delta ?? 0,
    participants: e.director?.participants ?? e.participants ?? {},
    period: e.director?.period ?? inferPeriod(e, window),
  };
  e.director.period = reconcilePeriod(e.director.period, window);
  if (!e.window) e.window = { from: window.start, to: window.end };
  return e;
}
function reconcilePeriod(period, window) {
  const s = toMinSafe(window.start), en = toMinSafe(window.end);
  const bounds = { morning: [6 * 60, 12 * 60], day: [8 * 60, 20 * 60], afternoon: [12 * 60, 18 * 60], meal: [11 * 60, 14 * 60] };
  const b = bounds[period];
  if (!b || window.end === "24:00" || window.start === "00:00" && en >= 20 * 60) {
    if (b && !(window.start === "00:00" && (window.end === "24:00" || window.end === "00:00"))) {
      /* keep named period if window still fits with slop */
    } else if (period && period !== "anytime" && window.start === "00:00" && (window.end === "24:00" || window.end === "00:00")) {
      return period; // all-day + a named period is ok for scheduled flavour
    }
  }
  if (b) {
    const slop = 60;
    if (s < b[0] - slop || en > b[1] + slop) return inferPeriod({ id: "", name: "", kind: "" }, window);
  }
  return period;
}

function inferDefaultWindow(e) {
  const id = e.id || "";
  if (id === "waffle-party") return { start: "13:00", end: "17:00" };
  if (id === "feed-the-fish") return { start: "07:00", end: "08:30" };
  if (id === "microwave-fish") return { start: "11:30", end: "14:00" };
  if (id === "taco-tuesday") return { start: "11:30", end: "13:30" };
  if (id === "night-shift" || id === "aquarium-night-glow") return { start: "21:00", end: "24:00" };
  if (id === "dawn") return { start: "06:00", end: "07:30" };
  if (id === "overtime-protocol") return { start: "22:00", end: "05:30" };
  if (id === "nap-attack") return { start: "13:00", end: "16:30" };
  if (/party|melon|donut|pizza|birthday|funding|finger-trap|eraser-gala|caricature|chime|fish-promotion/.test(id)) return { start: "13:00", end: "17:30" };
  if (/coffee/.test(id)) return { start: "06:00", end: "22:00" };
  if (e.kind === "chained" || e.kind === "manual") return { start: "00:00", end: "24:00" };
  return { start: "00:00", end: "24:00" };
}

export function moreEvents(ev, W0) {
  const E = (o) => ev(o);
  return [
    E({ id: "waffle-party", name: "Waffle Ceremony", kind: "random", manual: true, panel: { label: "Waffle Ceremony", emoji: "🧇" },
      chance: 0.02, cooldown: 4320, window: { from: "13:00", to: "17:00" },
      director: { window: { start: "13:00", end: "17:00" }, days: ["mon", "tue", "wed", "thu", "fri"], period: "afternoon", cooldown: 4320, weight: 0.4, tension_delta: -0.2, preconditions: ["coffee ok"], exclusions: ["prod-down", "fire-drill"] },
      location: { type: "poi", ref: "kitchen" }, radius: 14, duration: 40,
      effects: { needs: { hunger: -0.2, social: 0.25, stress: -0.15 }, output: 0.85 }, joinBehavior: "swarm", anim: { join: "run", react: "cheer" }, emotes: ["🧇", "🎉"],
      reactions: { default: W0(0.55, 0.25, 0.2), snacker: { join: 0.4 }, focused: { ignore: 0.3 }, devout: { join: 0.2 } },
      tickerTemplates: ["🧇 Waffle Ceremony is in session. Syrup will be distributed by tenure.", "🧇 {name} accepted a waffle with both hands, officially."] }),
    E({ id: "melon-hour", name: "Melon Hour", kind: "scheduled", schedule: { days: ["tue"], time: "15:00" }, manual: true, panel: { label: "Melon Hour", emoji: "🍈" },
      cooldown: 1440, window: { from: "14:30", to: "16:30" }, director: { period: "afternoon", cooldown: 1440, days: ["tue"], window: { start: "14:30", end: "16:30" }, tension_delta: -0.1 },
      location: { type: "poi", ref: "kitchen" }, radius: 12, duration: 35, effects: { needs: { social: 0.2, hunger: -0.1 }, output: 0.9 },
      joinBehavior: "gather", anim: { join: "walk", react: "cheer" }, emotes: ["🍈", "😋"],
      reactions: { default: W0(0.5, 0.3, 0.2), snacker: { join: 0.4 }, focused: { ignore: 0.25 } },
      tickerTemplates: ["🍈 Melon Hour. Fruit will be enjoyed in an orderly, delighted manner."] }),
    E({ id: "finger-trap-social", name: "Finger-Trap Social", kind: "random", chance: 0.015, cooldown: 2880, window: { from: "13:00", to: "17:00" },
      director: { period: "afternoon", cooldown: 2880, window: { start: "13:00", end: "17:00" }, tension_delta: 0.05 },
      location: { type: "poi", ref: "breakroom" }, radius: 10, duration: 25, effects: { needs: { social: 0.2, stress: 0.05 }, output: 0.9 },
      joinBehavior: "gather", anim: { join: "walk", react: "cheer" }, emotes: ["🪢", "😅"],
      reactions: { default: W0(0.4, 0.3, 0.3), anxious: { flee: 0.2 }, chatty: { join: 0.3 } },
      tickerTemplates: ["🪢 Finger-Trap Social underway. You may not leave until you relax."] }),
    E({ id: "ping-pong-rally", name: "Ping-pong rally", kind: "random", chance: 0.12, cooldown: 180, window: { from: "12:00", to: "18:00" },
      director: { period: "day", window: { start: "12:00", end: "18:00" } },
      location: { type: "poi", ref: "pingpong" }, radius: 8, duration: 15, participants: { max: 4 },
      effects: { needs: { energy: -0.05, social: 0.15, stress: -0.1 }, output: 0.95 }, joinBehavior: "gather", anim: { join: "walk", react: "cheer" }, emotes: ["🏓"],
      reactions: { default: W0(0.25, 0.55, 0.2), pacer: { join: 0.3 }, focused: { ignore: 0.4 } },
      tickerTemplates: ["🏓 A rally has begun. The ball is a stakeholder.", "🏓 {name} declared 'just one point' twenty minutes ago."] }),
    E({ id: "vending-jam", name: "Vending machine keeps a snack", kind: "random", chance: 0.08, cooldown: 240, window: { from: "08:00", to: "20:00" },
      director: { period: "day", window: { start: "08:00", end: "20:00" }, tension_delta: 0.05 },
      location: { type: "poi", ref: "vending" }, radius: 6, duration: 10, effects: { needs: { hunger: 0.05, stress: 0.05 }, output: 0.99 },
      joinBehavior: "queue", anim: { join: "walk", react: "facepalm" }, emotes: ["😤", "🍫"],
      reactions: { default: W0(0.2, 0.5, 0.3), snacker: { join: 0.5 }, rebel: { join: 0.3 } },
      chainsTo: [{ id: "vending-jackpot", delay: 10, chance: 0.4 }],
      tickerTemplates: ["🍫 The vending machine has retained a snack for further study."] }),
    E({ id: "vending-jackpot", name: "Two snacks fall", kind: "chained", location: { type: "poi", ref: "vending" }, radius: 6, duration: 5,
      director: { period: "anytime", window: { start: "00:00", end: "24:00" }, tension_delta: -0.05 },
      effects: { needs: { hunger: -0.1, social: 0.1 }, output: 1 }, joinBehavior: "gather", anim: { join: "walk", react: "cheer" }, emotes: ["🎉"],
      reactions: { default: W0(0.4, 0.4, 0.2), snacker: { join: 0.5 } },
      tickerTemplates: ["🎉 Two snacks fell. {name} is having a moral moment."] }),
    E({ id: "stapler-lost", name: "A stapler is missing", kind: "random", chance: 0.07, cooldown: 300, window: { from: "08:00", to: "18:00" },
      director: { period: "day", window: { start: "08:00", end: "18:00" }, tension_delta: 0.04 },
      location: { type: "global" }, radius: null, duration: 20, effects: { needs: { stress: 0.05, focus: -0.05 }, output: 0.98 },
      anim: { join: "walk", react: "turn-head" }, emotes: ["❓"], gossipable: true,
      reactions: { default: W0(0.1, 0.4, 0.5), anxious: { join: 0.2 }, gossip: { gossip: 0.4 } },
      chainsTo: [{ id: "stapler-found", delay: 25, chance: 0.8 }],
      tickerTemplates: ["📎 A stapler is missing. The void is being searched, politely."] }),
    E({ id: "stapler-found", name: "Stapler found", kind: "chained", location: { type: "global" }, duration: 5,
      director: { period: "anytime", window: { start: "00:00", end: "24:00" }, tension_delta: -0.04 },
      effects: { needs: { stress: -0.05 }, output: 1 }, anim: { join: "walk", react: "cheer" }, emotes: ["📎"],
      reactions: { default: W0(0.1, 0.7, 0.2) },
      tickerTemplates: ["📎 The stapler was in the Archives, being archived."] }),
    E({ id: "plant-watering", name: "Someone waters a plant", kind: "random", chance: 0.15, cooldown: 180, window: { from: "08:00", to: "11:00" },
      director: { period: "morning", window: { start: "08:00", end: "11:00" } },
      location: { type: "poi", ref: "plantWall" }, radius: 6, duration: 6, effects: { needs: { stress: -0.05 }, output: 1 },
      anim: { join: "walk", react: "none" }, emotes: ["🌱"], reactions: { default: W0(0.05, 0.9, 0.05), devout: { join: 0.2 } },
      tickerTemplates: ["🌱 {name} watered a colleague (a plant). The plant said nothing, gratefully."] }),
    E({ id: "plant-wall-whispers", name: "The plant wall rustles", kind: "random", chance: 0.04, cooldown: 480, window: { from: "00:00", to: "24:00" },
      director: { period: "anytime", window: { start: "00:00", end: "24:00" }, tension_delta: 0.02 },
      location: { type: "poi", ref: "plantWall" }, radius: 8, duration: 8, effects: { needs: { social: 0.05 }, output: 1 },
      anim: { join: "walk", react: "turn-head" }, emotes: ["🤫", "🌱"], reactions: { default: W0(0, 0.5, 0.5), gossip: { gossip: 0.4 } },
      tickerTemplates: ["🌱 The plant wall rustled. There is no wind. There is no weather."] }),
    E({ id: "mail-pileup", name: "Mail pileup", kind: "random", chance: 0.06, cooldown: 300, window: { from: "09:00", to: "16:00" },
      director: { period: "day", window: { start: "09:00", end: "16:00" }, tension_delta: 0.05 },
      location: { type: "poi", ref: "mail" }, radius: 8, duration: 20, effects: { needs: { stress: 0.05 }, output: 0.98 },
      joinBehavior: "queue", anim: { join: "walk", react: "facepalm" }, emotes: ["📦"],
      reactions: { default: W0(0.15, 0.6, 0.25), overachiever: { join: 0.3 } },
      tickerTemplates: ["📦 The mail has arrived all at once. Bea is negotiating with a pile."] }),
    E({ id: "mystery-package", name: "A package labelled DO NOT REFINE", kind: "random", chance: 0.03, cooldown: 720, window: { from: "08:00", to: "18:00" },
      director: { period: "day", window: { start: "08:00", end: "18:00" }, tension_delta: 0.08 },
      location: { type: "poi", ref: "mail" }, radius: 8, duration: 15, effects: { needs: { stress: 0.05, social: 0.1 }, output: 0.99 },
      anim: { join: "walk", react: "turn-head" }, emotes: ["📦", "❓"], reactions: { default: W0(0.1, 0.4, 0.5), gossip: { gossip: 0.4 }, rebel: { join: 0.3 } },
      tickerTemplates: ["📦 A parcel arrived labelled 'DO NOT REFINE'. It is being refined, socially."] }),
    E({ id: "it-help-queue", name: "IT help queue forms", kind: "random", chance: 0.08, cooldown: 200, window: { from: "09:00", to: "17:00" },
      director: { period: "day", window: { start: "09:00", end: "17:00" }, tension_delta: 0.06 },
      location: { type: "poi", ref: "itdesk" }, radius: 8, duration: 25, effects: { needs: { stress: 0.05, focus: -0.05 }, output: 0.97 },
      joinBehavior: "queue", anim: { join: "walk", react: "slump" }, emotes: ["💻", "😤"],
      reactions: { default: W0(0.2, 0.6, 0.2), anxious: { join: 0.3 }, focused: { ignore: 0.3 } },
      chainsTo: [{ id: "have-you-tried-aligning", delay: 8, chance: 1 }],
      tickerTemplates: ["💻 A queue has formed at IT Help. The first question has not yet been asked."] }),
    E({ id: "have-you-tried-aligning", name: "Have you tried aligning it?", kind: "chained", location: { type: "poi", ref: "itdesk" }, radius: 8, duration: 8,
      director: { period: "anytime", window: { start: "00:00", end: "24:00" } },
      effects: { needs: { stress: -0.05 }, output: 1.02 }, anim: { join: "walk", react: "cheer" }, emotes: ["✅"],
      reactions: { default: W0(0.1, 0.7, 0.2) },
      tickerTemplates: ["💻 IT asked if they had tried aligning it. They had not. It works now."] }),
    E({ id: "crt-flicker", name: "A CRT flickers strangely", kind: "random", chance: 0.05, cooldown: 360, window: { from: "00:00", to: "24:00" },
      director: { period: "anytime", window: { start: "00:00", end: "24:00" }, tension_delta: 0.06 },
      location: { type: "desk", ref: "random" }, radius: 5, duration: 8, effects: { needs: { stress: 0.05, focus: -0.05 }, output: 0.99 },
      anim: { join: "walk", react: "turn-head" }, emotes: ["📺", "❓"], reactions: { default: W0(0, 0.5, 0.5), anxious: { flee: 0.15 }, devout: { ignore: 0.2 } },
      tickerTemplates: ["📺 {name}'s CRT flickered a number that is not on the keyboard."] }),
    E({ id: "nap-pod-occupied", name: "All nap pods occupied", kind: "random", chance: 0.07, cooldown: 240, window: { from: "13:00", to: "16:00" },
      director: { period: "afternoon", window: { start: "13:00", end: "16:00" }, tension_delta: 0.04 },
      location: { type: "poi", ref: "napPods" }, radius: 8, duration: 20, effects: { needs: { energy: -0.05, stress: 0.05 }, output: 0.98 },
      anim: { join: "walk", react: "slump" }, emotes: ["💤", "😤"], reactions: { default: W0(0.1, 0.6, 0.3), napper: { join: 0.4, flee: 0.1 } },
      tickerTemplates: ["💤 Every nap pod is occupied. Rest is backlogged."] }),
    E({ id: "nap-pod-snoring", name: "Snoring in a nap pod", kind: "random", chance: 0.08, cooldown: 180, window: { from: "13:00", to: "17:00" },
      director: { period: "afternoon", window: { start: "13:00", end: "17:00" } },
      location: { type: "poi", ref: "napPods" }, radius: 6, duration: 10, effects: { needs: { social: 0.05 }, output: 1 },
      anim: { join: "walk", react: "turn-head" }, emotes: ["💤"], reactions: { default: W0(0, 0.5, 0.5), gossip: { gossip: 0.3 } },
      tickerTemplates: ["💤 A nap pod is snoring in a professional register."] }),
    E({ id: "archive-sneeze", name: "Someone sneezes in the Archive", kind: "random", chance: 0.06, cooldown: 300, window: { from: "09:00", to: "18:00" },
      director: { period: "day", window: { start: "09:00", end: "18:00" } },
      location: { type: "poi", ref: "archive" }, radius: 6, duration: 5, effects: { needs: {}, output: 1 },
      anim: { join: "walk", react: "facepalm" }, emotes: ["🤧"], reactions: { default: W0(0, 0.6, 0.4) },
      tickerTemplates: ["📖 {name} sneezed on Year One. Year One has been notified."] }),
    E({ id: "handbook-missing", name: "A Handbook is missing", kind: "random", chance: 0.03, cooldown: 720, window: { from: "08:00", to: "18:00" },
      director: { period: "day", window: { start: "08:00", end: "18:00" }, tension_delta: 0.1 },
      location: { type: "poi", ref: "archive" }, radius: 8, duration: 25, effects: { needs: { stress: 0.1 }, output: 0.97 },
      anim: { join: "walk", react: "turn-head" }, emotes: ["📖", "❓"], reactions: { default: W0(0.1, 0.4, 0.5), devout: { join: 0.3 }, gossip: { gossip: 0.3 } },
      tickerTemplates: ["📖 A copy of the Handbook is missing. All copies are the same copy. Nonetheless."] }),
    E({ id: "board-visit", name: "The Board is visiting", kind: "scheduled", schedule: { days: ["thu"], time: "09:30" },
      cooldown: 1440, window: { from: "09:00", to: "12:00" }, director: { period: "morning", days: ["thu"], window: { start: "09:00", end: "12:00" }, tension_delta: 0.15, cooldown: 1440 },
      location: { type: "poi", ref: "boardVisit" }, radius: 16, duration: 90, participants: { all: true },
      effects: { needs: { stress: 0.15, focus: 0.1 }, output: 1.1 }, joinBehavior: "watch", anim: { join: "walk", react: "bow" }, emotes: ["👔", "👀"],
      reactions: { default: W0(0.1, 0.6, 0.3), devout: { join: 0.2 }, anxious: { flee: 0.15 }, "meeting-lover": { join: 0.2 } },
      tickerTemplates: ["👔 The Board is sitting at the Temporary Table. Posture has improved floor-wide."] }),
    E({ id: "board-leaves", name: "The Board has concluded", kind: "chained", location: { type: "poi", ref: "elevator" }, radius: 10, duration: 10,
      director: { period: "anytime", window: { start: "00:00", end: "24:00" }, tension_delta: -0.1 },
      effects: { needs: { stress: -0.15, social: 0.1 }, output: 1 }, joinBehavior: "watch", anim: { join: "walk", react: "wave" }, emotes: ["👋"],
      reactions: { default: W0(0.1, 0.7, 0.2) },
      tickerTemplates: ["👔 The Board has entered the elevator. The elevator will decide."] }),
    E({ id: "void-offsite", name: "Void offsite in session", kind: "scheduled", schedule: { fromCalendar: "social" },
      window: { from: "13:00", to: "17:00" }, director: { period: "afternoon", window: { start: "13:00", end: "17:00" } },
      location: { type: "poi", ref: "voidOffsites" }, radius: 10, duration: 60, effects: { needs: { social: 0.15, focus: 0.05 }, output: 0.9 },
      joinBehavior: "sit", anim: { join: "walk", react: "talk" }, emotes: ["🤍"],
      reactions: { default: W0(0.15, 0.7, 0.15) },
      tickerTemplates: ["🤍 An offsite is being held in the void. The flipchart is imaginary and excellent."] }),
    E({ id: "lunch-and-learn", name: "Lunch & Learn", kind: "scheduled", schedule: { days: ["mon"], time: "12:15" },
      window: { from: "12:00", to: "14:00" }, director: { period: "meal", days: ["mon"], window: { start: "12:00", end: "14:00" } },
      location: { type: "room", ref: "team-5" }, radius: 8, duration: 45, effects: { needs: { hunger: -0.1, social: 0.15 }, output: 0.95 },
      joinBehavior: "sit", anim: { join: "walk", react: "talk" }, emotes: ["🥪", "💡"],
      reactions: { default: W0(0.3, 0.5, 0.2), "meeting-lover": { join: 0.3 } },
      tickerTemplates: ["🥪 Lunch & Learn: 'What Are The Outputs?' Attendance includes sandwiches."] }),
    E({ id: "scrum-of-scrums", name: "Scrum of scrums", kind: "scheduled", schedule: { days: ["mon"], time: "13:00" },
      window: { from: "12:30", to: "15:00" }, director: { period: "day", days: ["mon"], window: { start: "12:30", end: "15:00" } },
      location: { type: "room", ref: "huddle-6" }, radius: 5, duration: 25, effects: { needs: { social: 0.1 }, output: 1 },
      joinBehavior: "sit", anim: { join: "walk", react: "talk" }, emotes: ["🔁"],
      reactions: { default: W0(0.05, 0.8, 0.15), "meeting-lover": { join: 0.2 } },
      tickerTemplates: ["🔁 The scrum of scrums is scrumming. Action item: another scrum."] }),
    E({ id: "oat-milk-crisis", name: "Oat milk has run out", kind: "random", chance: 0.06, cooldown: 360, window: { from: "07:30", to: "11:00" },
      director: { period: "morning", window: { start: "07:30", end: "11:00" }, tension_delta: 0.08 },
      location: { type: "poi", ref: "kitchen" }, radius: 10, duration: 20, effects: { needs: { stress: 0.1, energy: -0.05 }, output: 0.96 },
      joinBehavior: "queue", anim: { join: "walk", react: "facepalm" }, emotes: ["🥛", "😤"],
      reactions: { default: W0(0.2, 0.4, 0.4), caffeinated: { join: 0.4, flee: 0.1 }, gossip: { gossip: 0.3 } },
      tickerTemplates: ["🥛 Oat milk is at zero. Several personalities are at risk."] }),
    E({ id: "snack-audit", name: "Snack bar audit", kind: "scheduled", schedule: { days: ["fri"], time: "10:00" },
      window: { from: "09:30", to: "11:30" }, director: { period: "morning", days: ["fri"], window: { start: "09:30", end: "11:30" } },
      location: { type: "poi", ref: "snackbar" }, radius: 6, duration: 20, effects: { needs: { stress: 0.05 }, output: 1 },
      anim: { join: "walk", react: "turn-head" }, emotes: ["📋"], reactions: { default: W0(0.1, 0.7, 0.2) },
      tickerTemplates: ["📋 Henrik is auditing the snack bar. Several crackers have no receipt."] }),
    E({ id: "logo-debate", name: "Logo version debate", kind: "random", chance: 0.04, cooldown: 600, window: { from: "10:00", to: "17:00" },
      director: { period: "day", window: { start: "10:00", end: "17:00" }, tension_delta: 0.07 },
      location: { type: "team", ref: "design" }, radius: 10, duration: 15, effects: { needs: { social: 0.1, stress: 0.05 }, output: 0.98 },
      joinBehavior: "watch", anim: { join: "walk", react: "talk" }, emotes: ["🖼️", "😤"],
      reactions: { default: W0(0.15, 0.5, 0.35), rebel: { join: 0.3 }, gossip: { gossip: 0.3 } },
      tickerTemplates: ["🖼️ Design is debating logo final_FINAL_v75. All versions are final."] }),
    E({ id: "whiteboard-full", name: "Whiteboard is full", kind: "random", chance: 0.07, cooldown: 240, window: { from: "09:00", to: "18:00" },
      director: { period: "day", window: { start: "09:00", end: "18:00" } },
      location: { type: "room", ref: "team-4" }, radius: 6, duration: 15, effects: { needs: { focus: -0.05 }, output: 0.99 },
      anim: { join: "walk", react: "facepalm" }, emotes: ["📝"], reactions: { default: W0(0.1, 0.6, 0.3) },
      tickerTemplates: ["📝 The whiteboard is full. The last arrow points at itself."] }),
    E({ id: "portrait-blink", name: "The portrait may have blinked", kind: "random", chance: 0.02, cooldown: 900, window: { from: "00:00", to: "24:00" },
      director: { period: "anytime", window: { start: "00:00", end: "24:00" }, tension_delta: 0.08 },
      location: { type: "poi", ref: "shrine" }, radius: 8, duration: 8, effects: { needs: { stress: 0.08 }, output: 1 },
      anim: { join: "walk", react: "turn-head" }, emotes: ["👀"], reactions: { default: W0(0, 0.4, 0.6), devout: { ignore: 0.4 }, anxious: { flee: 0.2 } },
      tickerTemplates: ["🕯️ {name} thought the Founder's portrait blinked. The paint is only paint."] }),
    E({ id: "cactus-bloom", name: "A cactus almost blooms", kind: "random", chance: 0.02, cooldown: 2000, window: { from: "09:00", to: "17:00" },
      director: { period: "day", window: { start: "09:00", end: "17:00" }, tension_delta: -0.05 },
      location: { type: "desk", ref: "random" }, radius: 4, duration: 10, effects: { needs: { social: 0.1, stress: -0.05 }, output: 1 },
      anim: { join: "walk", react: "cheer" }, emotes: ["🌵", "✨"], reactions: { default: W0(0.2, 0.5, 0.3) },
      tickerTemplates: ["🌵 {name}'s cactus almost bloomed. A meeting was booked to celebrate."] }),
    E({ id: "memo-storm", name: "A storm of memos", kind: "random", chance: 0.05, cooldown: 360, window: { from: "08:00", to: "18:00" },
      director: { period: "day", window: { start: "08:00", end: "18:00" }, tension_delta: 0.06 },
      location: { type: "global" }, radius: null, duration: 15, effects: { needs: { focus: -0.1, stress: 0.05 }, output: 0.96 },
      anim: { join: "walk", react: "facepalm" }, emotes: ["📄"], reactions: { default: W0(0, 0.5, 0.5), overachiever: { join: 0.2 } },
      tickerTemplates: ["📄 A flurry of memos has landed. None require a reply. All will receive one."] }),
    E({ id: "nameplate-typo", name: "A nameplate typo is discovered", kind: "random", chance: 0.03, cooldown: 800, window: { from: "09:00", to: "17:00" },
      director: { period: "day", window: { start: "09:00", end: "17:00" }, tension_delta: 0.03 },
      location: { type: "desk", ref: "random" }, radius: 5, duration: 12, effects: { needs: { social: 0.1 }, output: 1 },
      anim: { join: "walk", react: "talk" }, emotes: ["🔤"], reactions: { default: W0(0.05, 0.4, 0.55), gossip: { gossip: 0.4 } },
      tickerTemplates: ["🔤 {name}'s nameplate has a typo. They have decided this is their name now."] }),
    E({ id: "door-that-is-a-door", name: "Someone stands at the door", kind: "random", chance: 0.04, cooldown: 480, window: { from: "00:00", to: "24:00" },
      director: { period: "anytime", window: { start: "00:00", end: "24:00" }, tension_delta: 0.07 },
      location: { type: "poi", ref: "mysteryDoor" }, radius: 8, duration: 12, effects: { needs: { stress: 0.05, social: 0.05 }, output: 0.99 },
      anim: { join: "walk", react: "turn-head" }, emotes: ["🚪", "❓"], reactions: { default: W0(0.1, 0.5, 0.4), rebel: { join: 0.3 }, devout: { ignore: 0.3 }, anxious: { flee: 0.2 } },
      tickerTemplates: ["🚪 {name} stood at the door with no wall. The door did not comment."] }),
    E({ id: "goat-in-pen", name: "The Goat is in the pen", kind: "random", chance: 0.08, cooldown: 240, window: { from: "00:00", to: "24:00" },
      director: { period: "anytime", window: { start: "00:00", end: "24:00" }, tension_delta: -0.04 },
      location: { type: "poi", ref: "goatPen" }, radius: 8, duration: 20, effects: { needs: { social: 0.1, stress: -0.05 }, output: 0.98 },
      joinBehavior: "watch", anim: { join: "walk", react: "turn-head" }, emotes: ["🐐"],
      reactions: { default: W0(0.25, 0.45, 0.3), "dog-lover": { join: 0.3 }, anxious: { flee: 0.15 } },
      tickerTemplates: ["🐐 The Goat is in the secret pen, which is a secret, officially."] }),
    E({ id: "goat-ate-report", name: "The Goat ate a report", kind: "random", chance: 0.04, cooldown: 600, window: { from: "09:00", to: "18:00" },
      director: { period: "day", window: { start: "09:00", end: "18:00" }, tension_delta: 0.05 },
      location: { type: "poi", ref: "goatPen" }, radius: 8, duration: 10, effects: { needs: { social: 0.1 }, output: 0.99 },
      anim: { join: "walk", react: "facepalm" }, emotes: ["🐐", "📄"], reactions: { default: W0(0.1, 0.4, 0.5) },
      tickerTemplates: ["🐐 The Goat ate a quarterly report. It seemed to agree with it."] }),
    E({ id: "biscuit-in-nap-pod", name: "Biscuit in a nap pod", kind: "random", chance: 0.05, cooldown: 360, window: { from: "12:00", to: "17:00" },
      director: { period: "afternoon", window: { start: "12:00", end: "17:00" }, tension_delta: -0.06 },
      location: { type: "poi", ref: "napPods" }, radius: 8, duration: 15, effects: { needs: { social: 0.15, stress: -0.1 }, output: 0.95 },
      joinBehavior: "gather", anim: { join: "walk", react: "pet" }, emotes: ["🐶", "💤"],
      reactions: { default: W0(0.35, 0.4, 0.25), "dog-lover": { join: 0.5 }, focused: { ignore: 0.25 } },
      tickerTemplates: ["🐶 Biscuit has reserved a nap pod. The reservation has been honoured."] }),
    E({ id: "feed-the-fish", name: "Morning fish feeding", kind: "scheduled", schedule: { days: "daily", time: "07:15" },
      window: { from: "07:00", to: "08:30" }, director: { period: "morning", days: "daily", window: { start: "07:00", end: "08:30" }, participants: { ids: ["martin"] } },
      location: { type: "poi", ref: "fishFood" }, radius: 8, duration: 15, effects: { needs: { social: 0.05 }, output: 1 },
      joinBehavior: "watch", anim: { join: "walk", react: "none" }, emotes: ["🐟"],
      reactions: { default: W0(0.1, 0.8, 0.1), "dog-lover": { join: 0.2 } },
      tickerTemplates: ["🐟 Martin is feeding the fish. Gerald eats first. This is policy."] }),
    E({ id: "fish-promotion", name: "A fish is promoted", kind: "random", manual: true, panel: { label: "Promote a fish", emoji: "🐟" },
      chance: 0.02, cooldown: 2880, window: { from: "13:00", to: "17:00" },
      director: { period: "afternoon", cooldown: 2880, window: { start: "13:00", end: "17:00" }, tension_delta: -0.08 },
      location: { type: "poi", ref: "aquarium" }, radius: 12, duration: 20, effects: { needs: { social: 0.2, stress: -0.1 }, output: 0.95 },
      joinBehavior: "gather", anim: { join: "walk", react: "clap" }, emotes: ["🐟", "🎉"],
      reactions: { default: W0(0.45, 0.3, 0.25), chatty: { join: 0.2 }, focused: { ignore: 0.2 } },
      tickerTemplates: ["🐟 Steve has been promoted to Senior Fish. He does not know. Please be surprised with him.", "🐟 A promotion ceremony at the tank. The water is proud."] }),
    E({ id: "gerald-missing", name: "Gerald is missing", kind: "random", manual: true, panel: { label: "Gerald is missing", emoji: "🐟❓" },
      chance: 0.02, cooldown: 2160, window: { from: "08:00", to: "18:00" },
      director: { period: "day", cooldown: 2160, window: { start: "08:00", end: "18:00" }, tension_delta: 0.18, exclusions: ["fish-promotion"] },
      location: { type: "poi", ref: "aquarium" }, radius: 14, duration: 35, effects: { needs: { stress: 0.15, social: 0.1 }, output: 0.9 },
      joinBehavior: "gather", anim: { join: "walk", react: "turn-head" }, emotes: ["🐟", "❓", "😱"],
      reactions: { default: W0(0.4, 0.2, 0.4), anxious: { join: 0.3 }, gossip: { gossip: 0.4 } },
      chainsTo: [{ id: "gerald-returns", delay: 30, chance: 1 }],
      tickerTemplates: ["🐟 Gerald is not in the tank. The left glass is unoccupied. This is not fine.", "🐟 GERALD IS MISSING. The Intern is pretending not to have noticed."] }),
    E({ id: "gerald-returns", name: "Gerald has been behind the castle", kind: "chained", location: { type: "poi", ref: "aquarium" }, radius: 14, duration: 10,
      director: { period: "anytime", window: { start: "00:00", end: "24:00" }, tension_delta: -0.15 },
      effects: { needs: { stress: -0.2, social: 0.1 }, output: 1.05 }, joinBehavior: "gather", anim: { join: "walk", react: "cheer" }, emotes: ["🐟", "🎉"],
      reactions: { default: W0(0.5, 0.3, 0.2) },
      tickerTemplates: ["🐟 Gerald was behind the decorative castle. He has seen things. He is back."] }),
    E({ id: "aquarium-night-glow", name: "The tank glows at night", kind: "scheduled", schedule: { days: "daily", time: "22:00" },
      window: { from: "21:30", to: "24:00" }, director: { period: "night", days: "daily", window: { start: "21:30", end: "24:00" }, tension_delta: -0.05 },
      location: { type: "poi", ref: "aquarium" }, radius: 12, duration: 90, effects: { needs: { stress: -0.1, energy: -0.05 }, output: 0.95 },
      joinBehavior: "watch", anim: { join: "walk", react: "turn-head" }, emotes: ["✨", "🐟"],
      reactions: { default: W0(0.2, 0.7, 0.1), "night-owl": { join: 0.3 }, napper: { ignore: 0.2 } },
      tickerTemplates: ["✨ The aquarium is glowing. Night shift has a lighthouse now.", "✨ The tank has entered night mode. The fish look employed."] }),
    E({ id: "tap-the-glass-scolding", name: "Someone taps the glass", kind: "random", chance: 0.08, cooldown: 200, window: { from: "08:00", to: "20:00" },
      director: { period: "day", window: { start: "08:00", end: "20:00" }, tension_delta: 0.03 },
      location: { type: "poi", ref: "aquarium" }, radius: 6, duration: 6, effects: { needs: { social: 0.05 }, output: 1 },
      anim: { join: "walk", react: "facepalm" }, emotes: ["👆", "🐟"], reactions: { default: W0(0.1, 0.5, 0.4), devout: { ignore: 0.2 } },
      tickerTemplates: ["🐟 {name} tapped the glass. Pamela has filed a look."] }),
    E({ id: "elevator-small-talk", name: "Elevator small talk", kind: "random", chance: 0.15, cooldown: 90, window: { from: "07:00", to: "19:00" },
      director: { period: "day", window: { start: "07:00", end: "19:00" } },
      location: { type: "poi", ref: "elevator" }, radius: 5, duration: 4, effects: { needs: { social: 0.08 }, output: 1 },
      anim: { join: "walk", react: "talk" }, emotes: ["🛗"], reactions: { default: W0(0.2, 0.6, 0.2), chatty: { join: 0.4 }, focused: { ignore: 0.3 } },
      tickerTemplates: ["🛗 Small talk occurred at the elevator. The elevator listened, professionally."] }),
    E({ id: "intercom-thinking", name: "The intercom is thinking", kind: "random", chance: 0.04, cooldown: 480, window: { from: "00:00", to: "24:00" },
      director: { period: "anytime", window: { start: "00:00", end: "24:00" }, tension_delta: 0.04 },
      location: { type: "global" }, radius: null, duration: 8, effects: { needs: { focus: -0.05 }, output: 0.99 },
      anim: { join: "walk", react: "turn-head" }, emotes: ["📢"], reactions: { default: W0(0, 0.6, 0.4) },
      tickerTemplates: ["📢 The intercom cleared its throat and then decided not to."] }),
    E({ id: "numbers-too-right", name: "The numbers are suspiciously right", kind: "random", chance: 0.03, cooldown: 720, window: { from: "09:00", to: "18:00" },
      director: { period: "day", window: { start: "09:00", end: "18:00" }, tension_delta: 0.1 },
      location: { type: "team", ref: "data" }, radius: 12, duration: 15, effects: { needs: { stress: 0.1, focus: 0.1 }, output: 1.05 },
      anim: { join: "walk", react: "turn-head" }, emotes: ["📊", "❓"], reactions: { default: W0(0.15, 0.45, 0.4), focused: { join: 0.3 }, anxious: { join: 0.2 } },
      tickerTemplates: ["📊 The numbers are right. Too right. Calibration has questions, quietly."] }),
    E({ id: "weekend-feeling", name: "Someone mentions the weekend", kind: "random", chance: 0.05, cooldown: 400, window: { from: "15:00", to: "18:00" },
      director: { period: "afternoon", window: { start: "15:00", end: "18:00" }, days: ["fri"] },
      location: { type: "global" }, radius: null, duration: 8, effects: { needs: { social: 0.05 }, output: 0.99 },
      anim: { join: "walk", react: "talk" }, emotes: ["📅"], reactions: { default: W0(0, 0.5, 0.5), slacker: { gossip: 0.3 }, devout: { ignore: 0.4 } },
      tickerTemplates: ["📅 {name} mentioned 'the weekend'. It was gently corrected to 'Saturday, which is also work'."] }),
  ];
}

export const idleActions = [
  { id: "doodle", name: "Doodle in a margin", weight: 1.1, duration: 3, anim: "idle", emote: "✏️", line_key: "idle-doodle",
    conditions: { at: "desk", energy_min: 0.2 }, effects: { needs: { stress: -0.02, focus: -0.02 } } },
  { id: "stretch", name: "Stretch at the desk", weight: 1.0, duration: 2, anim: "idle", emote: "🧘", line_key: "idle-stretch",
    conditions: { at: "desk" }, effects: { needs: { energy: 0.02, stress: -0.02 } } },
  { id: "water-plant", name: "Water a desk plant", weight: 0.6, duration: 4, anim: "walk", emote: "🌱", line_key: "idle-water-plant",
    conditions: { near: "plant", hour: [8, 11] }, effects: { needs: { stress: -0.03 } } },
  { id: "chat-at-cooler", name: "Chat at the water cooler", weight: 1.2, duration: 5, anim: "talk", emote: "💧", line_key: "idle-cooler",
    conditions: { poi: "waterCooler", traits_any: ["chatty", "gossip"] }, effects: { needs: { social: 0.08, focus: -0.04 } } },
  { id: "fix-printer", name: "Tinker with the printer", weight: 0.4, duration: 6, anim: "idle", emote: "🖨️", line_key: "idle-printer",
    conditions: { poi: "printer" }, effects: { needs: { stress: 0.02 } } },
  { id: "lose-stapler", name: "Look for a stapler", weight: 0.35, duration: 4, anim: "walk", emote: "❓", line_key: "idle-stapler",
    conditions: { at: "desk" }, effects: { needs: { focus: -0.03 } } },
  { id: "pet-biscuit", name: "Pet Biscuit", weight: 1.3, duration: 4, anim: "pet", emote: "🐶", line_key: "petting",
    conditions: { near_pet: "biscuit", traits_boost: ["dog-lover"] }, effects: { needs: { stress: -0.1, social: 0.06 } } },
  { id: "stare-into-void", name: "Stare into the void", weight: 0.8, duration: 5, anim: "idle", emote: "🤍", line_key: "void",
    conditions: { away_from_carpet: true }, effects: { needs: { focus: -0.03, stress: 0.02 } } },
  { id: "stare-at-fish", name: "Stare at the fish", weight: 1.4, duration: 6, anim: "idle", emote: "🐟", line_key: "idle-fish-stare",
    conditions: { poi: "aquarium" }, effects: { needs: { stress: -0.08, focus: -0.02 } } },
  { id: "feed-the-fish", name: "Feed the fish", weight: 0.2, duration: 8, anim: "walk", emote: "🐟", line_key: "idle-fish-feed",
    conditions: { poi: "fishFood", hour: [7, 9], duties: ["fish-feeding"] }, effects: { needs: { social: 0.04 } } },
  { id: "tap-the-glass", name: "Tap the aquarium glass", weight: 0.5, duration: 2, anim: "idle", emote: "👆", line_key: "idle-fish-tap",
    conditions: { poi: "aquarium", traits_any: ["rebel", "chatty", "snacker"] }, effects: { needs: { social: 0.02 } } },
  { id: "pace", name: "Pace a short loop", weight: 0.9, duration: 6, anim: "walk", emote: "👟", line_key: "idle-pace",
    conditions: { traits_any: ["pacer"] }, effects: { needs: { energy: -0.03, stress: -0.04 } } },
  { id: "adjust-nameplate", name: "Adjust the nameplate", weight: 0.4, duration: 2, anim: "idle", emote: "🔤", line_key: "idle-nameplate",
    conditions: { at: "desk" }, effects: { needs: { focus: 0.02 } } },
  { id: "shrine-bow", name: "Visit the shrine", weight: 0.5, duration: 5, anim: "bow", emote: "🕯️", line_key: "shrine",
    conditions: { poi: "shrine", traits_boost: ["devout"] }, effects: { needs: { stress: -0.05 } } },
  { id: "reread-handbook", name: "Reread the Handbook", weight: 0.5, duration: 8, anim: "idle", emote: "📖", line_key: "idle-handbook",
    conditions: { poi: "library" }, effects: { needs: { focus: 0.05, energy: -0.02 } } },
  { id: "nap-pod-visit", name: "Sit in a nap pod", weight: 0.6, duration: 10, anim: "sleep", emote: "💤", line_key: "nap",
    conditions: { poi: "napPods", traits_boost: ["napper"], hour: [13, 16] }, effects: { needs: { energy: 0.12 } } },
  { id: "bounce-ball", name: "Bounce a ping-pong ball", weight: 0.7, duration: 4, anim: "idle", emote: "🏓", line_key: "idle-pong",
    conditions: { poi: "pingpong" }, effects: { needs: { stress: -0.04, social: 0.04 } } },
  { id: "check-mail", name: "Check the mail slots", weight: 0.5, duration: 4, anim: "walk", emote: "📬", line_key: "idle-mail",
    conditions: { poi: "mail" }, effects: { needs: { focus: 0.01 } } },
  { id: "visit-it", name: "Hover near IT Help", weight: 0.35, duration: 5, anim: "idle", emote: "💻", line_key: "idle-it",
    conditions: { poi: "itdesk" }, effects: { needs: { stress: -0.02 } } },
  { id: "practice-handshake", name: "Practice a handshake", weight: 0.3, duration: 3, anim: "idle", emote: "🤝", line_key: "idle-handshake",
    conditions: { team: "sales" }, effects: { needs: { social: 0.03 } } },
  { id: "organize-mug", name: "Align the mug", weight: 0.7, duration: 2, anim: "idle", emote: "☕", line_key: "idle-mug",
    conditions: { at: "desk" }, effects: { needs: { focus: 0.02 } } },
  { id: "hum", name: "Hum, almost inaudibly", weight: 0.4, duration: 4, anim: "idle", emote: "🎵", line_key: "idle-hum",
    conditions: { traits_any: ["devout"], kinds: ["cleaner"] }, effects: { needs: { stress: -0.03 } } },
  { id: "polish", name: "Polish a spot", weight: 0.5, duration: 6, anim: "idle", emote: "✨", line_key: "idle-polish",
    conditions: { kinds: ["cleaner"] }, effects: { needs: { focus: 0.04 } } },
  { id: "check-pager", name: "Check the pager", weight: 0.6, duration: 2, anim: "idle", emote: "📟", line_key: "idle-pager",
    conditions: { team: "infra" }, effects: { needs: { stress: 0.02 } } },
  { id: "stare-at-door", name: "Regard the door", weight: 0.3, duration: 5, anim: "idle", emote: "🚪", line_key: "void",
    conditions: { poi: "mysteryDoor" }, effects: { needs: { focus: -0.02 } } },
];

export function applyPeopleExtras(people) {
  const duty = { martin: ["fish-feeding"] };
  const biases = {
    margot: { idle_actions: { pace: 2.2, "shrine-bow": 1.4, "stare-into-void": 0.6 }, events: { "board-visit": 1.8 } },
    dev: { idle_actions: { doodle: 0.6, "check-pager": 0.5, "stare-at-fish": 0.7 }, events: { "prod-down": 2, "friday-deploy": 2 } },
    martin: { idle_actions: { "feed-the-fish": 5, "pet-biscuit": 3, "check-mail": 1.4 }, events: { "feed-the-fish": 5, "goat-appears": 1.5 } },
    aisha: { idle_actions: { "pet-biscuit": 3, "stare-at-fish": 1.6 }, events: { "dog-pets": 2 } },
    kai: { idle_actions: { "stare-at-fish": 2, "tap-the-glass": 1.8, doodle: 1.5 } },
    ines: { idle_actions: { hum: 3, polish: 2, "water-plant": 1.5 } },
    walter: { idle_actions: { polish: 3.5, hum: 1.2 } },
    harlan: { idle_actions: { pace: 3, "stare-into-void": 1.2, "stare-at-door": 1.6 } },
    bea: { idle_actions: { "check-mail": 2, "practice-handshake": 1.2 }, events: { "visitor-arrives": 2, "delivery-arrives": 2 } },
    rory: { idle_actions: { "stare-at-fish": 1.3, doodle: 1.2 }, events: { "aquarium-night-glow": 2 } },
    pablo: { idle_actions: { "stare-at-fish": 1.8 }, events: { "aquarium-night-glow": 2 } },
    henrik: { idle_actions: { "organize-mug": 1.5, "check-mail": 1.3 }, events: { "snack-audit": 3 } },
    yuki: { idle_actions: { "adjust-nameplate": 2, doodle: 1.2 }, events: { "logo-debate": 2 } },
    chad: { idle_actions: { "practice-handshake": 3, pace: 1.6 } },
    grace: { idle_actions: { "shrine-bow": 1.3, "stare-at-fish": 1.2 }, events: { "wellness-session": 2 } },
    lucas: { idle_actions: { doodle: 1.4, "chat-at-cooler": 1.5, "tap-the-glass": 1.4 } },
    zara: { idle_actions: { "stare-at-fish": 1.7, "pet-biscuit": 2 } },
  };
  for (const p of people) {
    p.duties = duty[p.id] || [];
    p.behavior_bias = biases[p.id] || { idle_actions: {}, events: {} };
    if (p.traits.includes("pacer")) p.behavior_bias.idle_actions.pace = (p.behavior_bias.idle_actions.pace || 1) + 0.8;
    if (p.traits.includes("dog-lover")) p.behavior_bias.idle_actions["pet-biscuit"] = (p.behavior_bias.idle_actions["pet-biscuit"] || 1) + 1.2;
    if (p.traits.includes("napper")) p.behavior_bias.idle_actions["nap-pod-visit"] = (p.behavior_bias.idle_actions["nap-pod-visit"] || 1) + 1.2;
    if (p.traits.includes("chatty")) p.behavior_bias.idle_actions["chat-at-cooler"] = (p.behavior_bias.idle_actions["chat-at-cooler"] || 1) + 0.8;
    if (p.traits.includes("devout")) p.behavior_bias.idle_actions["shrine-bow"] = (p.behavior_bias.idle_actions["shrine-bow"] || 1) + 0.7;
    p.quirk_id = p.id;
  }
}

export const FISH = [
  { id: "gerald", name: "Gerald", species: "fish", tank: "aquarium", quirk: "He has seen things.", title: "Occupant, Left Glass" },
  { id: "pamela", name: "Pamela", species: "fish", tank: "aquarium", quirk: "She swims in policy.", title: "Senior Compliance Fish" },
  { id: "steve", name: "Steve", species: "fish", tank: "aquarium", quirk: "Recently considered for promotion.", title: "Fish (Pending Senior)" },
  { id: "the-intern", name: "The Intern", species: "fish", tank: "aquarium", quirk: "Still onboarding.", title: "Deputy Intern of Water" },
  { id: "muriel", name: "Muriel", species: "fish", tank: "aquarium", quirk: "Prefers the back of the tank.", title: "Rocks Liaison" },
  { id: "dot", name: "Dot", species: "fish", tank: "aquarium", quirk: "A very small fish with a very large title.", title: "Deputy of Water" },
];

const BELONGING_ATLAS = {
  mug: "mug_cream", photo: "photo_frame", trophy: "caricature", candle: "founder_shrine",
  rubberduck: "figurine", books: "papers", plant: "snake_plant", waterbottle: "mug_teal",
  stressball: "stress_ball", figurine: "figurine", cactus: "cactus", snowglobe: "figurine",
  eraser: "eraser", lamp: "desk_lamp", headphones: "nameplate",
};

const MUG_SLOGANS = {
  margot: "WORLD'S OKAYEST VISION-KEEPER",
  dev: "IT'S JUST A CONFIG CHANGE",
  bianca: "THE LEGEND HAS A LEGEND",
  theo: "NOTES ABOUT THE NOTES",
  hiroshi: "ONE MORE LAYER",
  priya: "THINGS CALLING THINGS",
  lucas: "SPACES NOT TABS",
  amara: "ALMOST THERE (2023)",
  kai: "TOO LATE TO ASK",
  ingrid: "FIONA CALLED",
  tomas: "PLEASE DO NOT CHIME",
  nadia: "TURN ME OFF LAST",
  ben: "PIPELINE ON FIRE (CALM)",
  sofia: "ALREADY OFFLINE",
  jamal: "MOVED 2PX, GOT PROMOTED",
  mei: "BOTH STACKS, NO TALKING",
  oskar: "FLAG ON (FOR ME)",
  leila: "TESTED ON A 2014 PHONE",
  rory: "SHIPS AT 1AM",
  analucia: "CONFIDENTLY CONFIDENT",
  wen: "CORRELATION, NOT LUNCH",
  felix: "PLEASE AND THANK YOU",
  greta: "ALL DASHBOARDS GREEN",
  sam: "LITTLE GUYS (NUMBERS)",
  clara: "NOW / NEXT / SPIRITUALLY",
  arjun: "MEETING ABOUT A MEETING",
  hannah: "31 TABS, 1 SONG",
  diego: "SPIRITUALLY DONE",
  yuki: "I CAN SEE 1PX FROM HERE",
  zara: "I ROUNDED A SPREADSHEET",
  elliot: "FINAL_FINAL_V74",
  marisol: "AND WHY?",
  chad: "I BROUGHT MY OWN GONG",
  fatima: "REVENUE IS REAL THOUGH",
  jordan: "JUST BUMPING THIS",
  nikolai: "WORKS WHEN UNOBSERVED",
  olivia: "BRAND VOICE (HOME USE)",
  ravi: "THOUGHTS, PRE-THOUGHT",
  camille: "CAMILLE WON BY 0.3%",
  grace: "A CALMING FACT",
  tyler: "THIS ROLE IS A ROCKETSHIP",
  aisha: "DOG TREATS IN EVERY POCKET",
  henrik: "ROUNDED TO GRATITUDE",
  lucy: "RECEIPT FROM 1891",
  bea: "WELCOME. YOU NEVER LEFT.",
  martin: "THE DOG OWNS ME",
  destiny: "I COMPLETELY UNDERSTAND",
  owen: "HAVE YOU TRIED OFF AND ON",
  imani: "URGENT → MILDLY CURIOUS",
  pablo: "NIGHT SHIFT WHISPER",
  ines: "(no text, only a hum)",
  walter: "POLISHED ACCEPTABLY",
  harlan: "DO NOT SIT",
};

export const OBJECT_CATALOG = {
  mug_orange: { key: "mug_orange", name: "The Orange Mug", descriptions: ["A mug the colour of a cautious sunrise.", "It has never been clean and never been dirty."], atlas: "mug_orange", kind: "prop" },
  mug_mustard: { key: "mug_mustard", name: "The Mustard Mug", descriptions: ["A mug that looks like a decision.", "Warm, official, slightly stained with purpose."], atlas: "mug_mustard", kind: "prop" },
  mug_teal: { key: "mug_teal", name: "The Teal Mug", descriptions: ["A mug in approved teal.", "It makes coffee look more aligned."], atlas: "mug_teal", kind: "prop" },
  mug_cream: { key: "mug_cream", name: "The Cream Mug", descriptions: ["A humble, cream-coloured mug.", "It was new once. It remembers."], atlas: "mug_cream", kind: "prop" },
  photo_frame: { key: "photo_frame", name: "The Photo Frame", descriptions: ["A frame facing inward, out of respect.", "The photo is of a desk. This desk."], atlas: "photo_frame", kind: "prop" },
  figurine: { key: "figurine", name: "The Figurine", descriptions: ["A small official person, off the clock.", "It has better posture than most of us."], atlas: "figurine", kind: "prop" },
  stress_ball: { key: "stress_ball", name: "The Stress Ball", descriptions: ["A ball for holding feelings, briefly.", "It has been squeezed into a new shape."], atlas: "stress_ball", kind: "prop" },
  cactus: { key: "cactus", name: "The Cactus", descriptions: ["A humble, water-avoiding plant.", "It has never asked for anything.", "We respect it for this."], atlas: "cactus", kind: "prop" },
  nameplate: { key: "nameplate", name: "The Nameplate", descriptions: ["A name, confirmed in brass.", "If it is wrong, do not mention it."], atlas: "nameplate", kind: "prop" },
  papers: { key: "papers", name: "The Papers", descriptions: ["A stack of almost-memos.", "They are in an order known only to them."], atlas: "papers", kind: "prop" },
  eraser: { key: "eraser", name: "The Novelty Eraser", descriptions: ["A reward for sustained alignment.", "It erases less than it commemorates."], atlas: "eraser", kind: "prop" },
  caricature: { key: "caricature", name: "The Caricature Portrait", descriptions: ["A pencil likeness, mostly forehead.", "You look more grateful than you are."], atlas: "caricature", kind: "prop" },
  melon: { key: "melon", name: "The Ceremonial Melon", descriptions: ["Fruit, supervised.", "It will be enjoyed in an orderly manner."], atlas: "melon", kind: "prop" },
  waffle: { key: "waffle", name: "The Official Waffle", descriptions: ["Syrup is distributed by tenure.", "It is not a party. It is a ceremony."], atlas: "waffle", kind: "prop" },
  desk: { key: "desk", name: "The Desk", descriptions: ["A walnut plane on which work occurs.", "It has missed you, in a formal way."], atlas: "desk", kind: "prop" },
  desk_pod4: { key: "desk_pod4", name: "The Four-Desk Pod", descriptions: ["Four people, one gravity.", "The middle is for shared thoughts and cables."], atlas: "desk_pod4", kind: "prop" },
  crt_front: { key: "crt_front", name: "The CRT (Facing You)", descriptions: ["Green numbers, gently judging.", "It knows when you blink."], atlas: "crt_front", kind: "prop" },
  crt_back: { key: "crt_back", name: "The CRT (Facing Away)", descriptions: ["The back of a thinking machine.", "Something is happening. You are not invited."], atlas: "crt_back", kind: "prop" },
  keyboard: { key: "keyboard", name: "The Keyboard", descriptions: ["Boxy, beige, loyal.", "Several keys are shinier than others."], atlas: "keyboard", kind: "prop" },
  phone: { key: "phone", name: "The Desk Phone", descriptions: ["A rotary cousin, still employed.", "It rings for people who have already arrived."], atlas: "phone", kind: "prop" },
  phone_ring: { key: "phone_ring", name: "The Ringing Phone", descriptions: ["It rings until you look, then thinks.", "Nobody is on the other end. That is fine."], atlas: "phone_ring", kind: "prop" },
  chair_s_orange: { key: "chair_s_orange", name: "The Orange Chair", descriptions: ["It faces the work, as we all should.", "The colour is motivational mustard-adjacent."], atlas: "chair_s_orange", kind: "prop" },
  chair_n_orange: { key: "chair_n_orange", name: "The Orange Chair (From Behind)", descriptions: ["It covers your lower back and your doubts."], atlas: "chair_n_orange", kind: "prop" },
  chair_e_orange: { key: "chair_e_orange", name: "The Orange Chair (East)", descriptions: ["A seat with a sense of direction."], atlas: "chair_e_orange", kind: "prop" },
  chair_w_orange: { key: "chair_w_orange", name: "The Orange Chair (West)", descriptions: ["The same chair, in another life."], atlas: "chair_w_orange", kind: "prop" },
  chair_s_mustard: { key: "chair_s_mustard", name: "The Mustard Chair", descriptions: ["A chair the colour of a good memo."], atlas: "chair_s_mustard", kind: "prop" },
  chair_n_mustard: { key: "chair_n_mustard", name: "The Mustard Chair (From Behind)", descriptions: ["It has your back, officially."], atlas: "chair_n_mustard", kind: "prop" },
  chair_e_mustard: { key: "chair_e_mustard", name: "The Mustard Chair (East)", descriptions: ["Turned toward a slightly better idea."], atlas: "chair_e_mustard", kind: "prop" },
  chair_w_mustard: { key: "chair_w_mustard", name: "The Mustard Chair (West)", descriptions: ["It will be here when you return. You will."], atlas: "chair_w_mustard", kind: "prop" },
  chair_s_teal: { key: "chair_s_teal", name: "The Teal Chair", descriptions: ["Approved seating, in approved teal."], atlas: "chair_s_teal", kind: "prop" },
  chair_n_teal: { key: "chair_n_teal", name: "The Teal Chair (From Behind)", descriptions: ["A supportive, slightly corporate hug."], atlas: "chair_n_teal", kind: "prop" },
  chair_e_teal: { key: "chair_e_teal", name: "The Teal Chair (East)", descriptions: ["It knows which way the numbers go."], atlas: "chair_e_teal", kind: "prop" },
  chair_w_teal: { key: "chair_w_teal", name: "The Teal Chair (West)", descriptions: ["Please sit as if you meant to."], atlas: "chair_w_teal", kind: "prop" },
  chair_s_avocado: { key: "chair_s_avocado", name: "The Avocado Chair", descriptions: ["A 1970s vegetable, employed as furniture."], atlas: "chair_s_avocado", kind: "prop" },
  chair_n_avocado: { key: "chair_n_avocado", name: "The Avocado Chair (From Behind)", descriptions: ["It is doing its best, in green."], atlas: "chair_n_avocado", kind: "prop" },
  chair_e_avocado: { key: "chair_e_avocado", name: "The Avocado Chair (East)", descriptions: ["Interior designers would have a meeting."], atlas: "chair_e_avocado", kind: "prop" },
  chair_w_avocado: { key: "chair_w_avocado", name: "The Avocado Chair (West)", descriptions: ["Sit. The decade will follow."], atlas: "chair_w_avocado", kind: "prop" },
  chair_s_cream: { key: "chair_s_cream", name: "The Cream Chair", descriptions: ["A quiet chair, easily overlooked.", "That is its gift."], atlas: "chair_s_cream", kind: "prop" },
  chair_n_cream: { key: "chair_n_cream", name: "The Cream Chair (From Behind)", descriptions: ["It does not interrupt."], atlas: "chair_n_cream", kind: "prop" },
  chair_e_cream: { key: "chair_e_cream", name: "The Cream Chair (East)", descriptions: ["Neutral, like a well-written no."], atlas: "chair_e_cream", kind: "prop" },
  chair_w_cream: { key: "chair_w_cream", name: "The Cream Chair (West)", descriptions: ["Please enjoy sitting equally."], atlas: "chair_w_cream", kind: "prop" },
  filing_cabinet: { key: "filing_cabinet", name: "The Filing Cabinet", descriptions: ["Drawer 2 is for feelings. It is full.", "Drawer 3 hums, occasionally."], atlas: "filing_cabinet", kind: "prop" },
  filing_cabinet_avocado: { key: "filing_cabinet_avocado", name: "The Avocado Cabinet", descriptions: ["Files, stored in a vegetable mood."], atlas: "filing_cabinet_avocado", kind: "prop" },
  snake_plant: { key: "snake_plant", name: "The Snake Plant", descriptions: ["A plant that requires almost no love.", "It has been briefed. It is fine."], atlas: "snake_plant", kind: "prop" },
  snake_plant_terracotta: { key: "snake_plant_terracotta", name: "The Terracotta Snake Plant", descriptions: ["Same plant, more official pot."], atlas: "snake_plant_terracotta", kind: "prop" },
  plant_tall: { key: "plant_tall", name: "The Tall Plant", descriptions: ["It has been here longer than the roadmap.", "Do not move it. It has opinions."], atlas: "plant_tall", kind: "prop" },
  table_booth: { key: "table_booth", name: "The Booth Table", descriptions: ["A table for one thought at a time."], atlas: "table_booth", kind: "prop" },
  table_huddle: { key: "table_huddle", name: "The Huddle Table", descriptions: ["Too small for the meeting. Just enough."], atlas: "table_huddle", kind: "prop" },
  table_team: { key: "table_team", name: "The Team Table", descriptions: ["A walnut rectangle of shared destiny."], atlas: "table_team", kind: "prop" },
  table_boardroom: { key: "table_boardroom", name: "The Long Table", descriptions: ["Consensus lives here, or is at least seated."], atlas: "table_boardroom", kind: "prop" },
  lectern: { key: "lectern", name: "The Lectern", descriptions: ["A place to stand while being grateful."], atlas: "lectern", kind: "prop" },
  bench: { key: "bench", name: "The Bench", descriptions: ["A place to sit and look at something else."], atlas: "bench", kind: "prop" },
  projector_screen: { key: "projector_screen", name: "The Projector Screen", descriptions: ["It displays slides, or a soft white patience."], atlas: "projector_screen", kind: "prop" },
  coffee_station: { key: "coffee_station", name: "The Coffee Station", descriptions: ["Morale, in a beige machine.", "Please treat it with reverence."], atlas: "coffee_station", kind: "prop" },
  water_cooler: { key: "water_cooler", name: "The Water Cooler", descriptions: ["Water, and also news.", "The water is room-temperature, like the truth."], atlas: "water_cooler", kind: "prop" },
  elevator: { key: "elevator", name: "The Elevator", descriptions: ["The only way in. The rumour of a way out.", "It arrives for those who are ready."], atlas: "elevator", kind: "prop" },
  elevator_rise: { key: "elevator_rise", name: "The Elevator, Ascending", descriptions: ["Someone is going up. Clap, but not too much."], atlas: "elevator_rise", kind: "prop" },
  sign_0: { key: "sign_0", name: "A Motivational Sign", descriptions: ["A sentence, floating, sure of itself."], atlas: "sign_0", kind: "prop" },
  sign_1: { key: "sign_1", name: "A Motivational Sign", descriptions: ["Please read it as if it were new."], atlas: "sign_1", kind: "prop" },
  sign_2: { key: "sign_2", name: "A Motivational Sign", descriptions: ["The void has branded messaging."], atlas: "sign_2", kind: "prop" },
  sign_3: { key: "sign_3", name: "A Motivational Sign", descriptions: ["It is always the right time to be aligned."], atlas: "sign_3", kind: "prop" },
  sign_4: { key: "sign_4", name: "A Motivational Sign", descriptions: ["A thin rule, a kind order."], atlas: "sign_4", kind: "prop" },
  sign_5: { key: "sign_5", name: "A Motivational Sign", descriptions: ["Someone chose this font on purpose."], atlas: "sign_5", kind: "prop" },
  sign_6: { key: "sign_6", name: "A Motivational Sign", descriptions: ["The words are doing their job."], atlas: "sign_6", kind: "prop" },
  sign_dept_a: { key: "sign_dept_a", name: "A Department Sign", descriptions: ["A name for a carpet."], atlas: "sign_dept_a", kind: "prop" },
  sign_dept_b: { key: "sign_dept_b", name: "A Department Sign", descriptions: ["You are on the correct island. Probably."], atlas: "sign_dept_b", kind: "prop" },
  sign_blank_40: { key: "sign_blank_40", name: "A Blank Sign", descriptions: ["It is saving the message for later."], atlas: "sign_blank_40", kind: "prop" },
  sign_blank_64: { key: "sign_blank_64", name: "A Wider Blank Sign", descriptions: ["The message is loading, spiritually."], atlas: "sign_blank_64", kind: "prop" },
  sign_blank_96: { key: "sign_blank_96", name: "A Very Blank Sign", descriptions: ["This much emptiness is a statement."], atlas: "sign_blank_96", kind: "prop" },
  sign_shadow: { key: "sign_shadow", name: "The Sign's Shadow", descriptions: ["Even the signs have weight here."], atlas: "sign_shadow", kind: "prop" },
  room_tag: { key: "room_tag", name: "The Capacity Tag", descriptions: ["A number, which is also a hope."], atlas: "room_tag", kind: "prop" },
  founder_shrine: { key: "founder_shrine", name: "The Founder's Shrine", descriptions: ["Cornelius, in oil and candlelight.", "He is very proud, in a general way."], atlas: "founder_shrine", kind: "prop" },
  carpet_tl: { key: "carpet_tl", name: "Section Carpet (Corner)", descriptions: ["Teal, sterile, and comforting."], atlas: "carpet_tl", kind: "prop" },
  carpet_t: { key: "carpet_t", name: "Section Carpet (Edge)", descriptions: ["The edge of belonging."], atlas: "carpet_t", kind: "prop" },
  carpet_tr: { key: "carpet_tr", name: "Section Carpet (Corner)", descriptions: ["A corner of the approved colour."], atlas: "carpet_tr", kind: "prop" },
  carpet_l: { key: "carpet_l", name: "Section Carpet (Edge)", descriptions: ["Do not stand with one foot off."], atlas: "carpet_l", kind: "prop" },
  carpet_c: { key: "carpet_c", name: "Section Carpet", descriptions: ["An island of teal in an ocean of white."], atlas: "carpet_c", kind: "prop" },
  carpet_r: { key: "carpet_r", name: "Section Carpet (Edge)", descriptions: ["The carpet ends. You may continue."], atlas: "carpet_r", kind: "prop" },
  carpet_bl: { key: "carpet_bl", name: "Section Carpet (Corner)", descriptions: ["A tidy corner. Facilities approved."], atlas: "carpet_bl", kind: "prop" },
  carpet_b: { key: "carpet_b", name: "Section Carpet (Edge)", descriptions: ["The southern border of a team."], atlas: "carpet_b", kind: "prop" },
  carpet_br: { key: "carpet_br", name: "Section Carpet (Corner)", descriptions: ["Please keep belongings inside."], atlas: "carpet_br", kind: "prop" },
  carpet_shadow: { key: "carpet_shadow", name: "The Carpet's Shadow", descriptions: ["Even islands cast a little doubt."], atlas: "carpet_shadow", kind: "prop" },
  outline_tl: { key: "outline_tl", name: "Meeting Outline (Corner)", descriptions: ["A room made of a line."], atlas: "outline_tl", kind: "prop" },
  outline_t: { key: "outline_t", name: "Meeting Outline", descriptions: ["Please do not step on the idea of a wall."], atlas: "outline_t", kind: "prop" },
  outline_tr: { key: "outline_tr", name: "Meeting Outline (Corner)", descriptions: ["This is the corner of a conversation."], atlas: "outline_tr", kind: "prop" },
  outline_l: { key: "outline_l", name: "Meeting Outline", descriptions: ["A border you may cross, carefully."], atlas: "outline_l", kind: "prop" },
  outline_c: { key: "outline_c", name: "Meeting Floor", descriptions: ["Inside the outline, time moves differently."], atlas: "outline_c", kind: "prop" },
  outline_r: { key: "outline_r", name: "Meeting Outline", descriptions: ["The meeting has an edge."], atlas: "outline_r", kind: "prop" },
  outline_bl: { key: "outline_bl", name: "Meeting Outline (Corner)", descriptions: ["A polite corner."], atlas: "outline_bl", kind: "prop" },
  outline_b: { key: "outline_b", name: "Meeting Outline", descriptions: ["Wait just outside, if you must wait."], atlas: "outline_b", kind: "prop" },
  outline_br: { key: "outline_br", name: "Meeting Outline (Corner)", descriptions: ["The last corner of the agenda."], atlas: "outline_br", kind: "prop" },
  void_grid: { key: "void_grid", name: "The Floor Grid", descriptions: ["A suggestion of a floor, fading."], atlas: "void_grid", kind: "prop" },
  desk_lamp: { key: "desk_lamp", name: "The Desk Lamp", descriptions: ["A small, loyal sun."], atlas: "desk_lamp", kind: "prop" },
  facilities_cart: { key: "facilities_cart", name: "The Facilities Cart", descriptions: ["It is always working. Pretend not to see it, kindly."], atlas: "facilities_cart", kind: "prop" },
  emote_exclaim: { key: "emote_exclaim", name: "An Exclamation", descriptions: ["A feeling, briefly visible."], atlas: "emote_exclaim", kind: "prop" },
  emote_question: { key: "emote_question", name: "A Question Mark", descriptions: ["The polite form of panic."], atlas: "emote_question", kind: "prop" },
  emote_zzz: { key: "emote_zzz", name: "A Zzz", descriptions: ["Official unconsciousness, typographically."], atlas: "emote_zzz", kind: "prop" },
  emote_heart: { key: "emote_heart", name: "A Heart", descriptions: ["Unscheduled fondness."], atlas: "emote_heart", kind: "prop" },
  emote_coffee: { key: "emote_coffee", name: "A Coffee Icon", descriptions: ["Need, in a cup."], atlas: "emote_coffee", kind: "prop" },
  emote_party: { key: "emote_party", name: "A Celebration", descriptions: ["Approved joy, limited duration."], atlas: "emote_party", kind: "prop" },
  emote_skull: { key: "emote_skull", name: "A Skull", descriptions: ["The numbers, personally."], atlas: "emote_skull", kind: "prop" },
  emote_angry: { key: "emote_angry", name: "A Frown", descriptions: ["A feeling with a policy."], atlas: "emote_angry", kind: "prop" },
  emote_sweat: { key: "emote_sweat", name: "A Sweat Drop", descriptions: ["Effort, made visible."], atlas: "emote_sweat", kind: "prop" },
  emote_idea: { key: "emote_idea", name: "An Idea", descriptions: ["It will become a meeting shortly."], atlas: "emote_idea", kind: "prop" },
  emote_eyes: { key: "emote_eyes", name: "A Pair of Eyes", descriptions: ["Someone is looking, fondly."], atlas: "emote_eyes", kind: "prop" },
  emote_music: { key: "emote_music", name: "A Note", descriptions: ["Hold music, escaped."], atlas: "emote_music", kind: "prop" },
  emote_numbers: { key: "emote_numbers", name: "The Numbers", descriptions: ["They would like a word."], atlas: "emote_numbers", kind: "prop" },
  emote_check: { key: "emote_check", name: "A Check Mark", descriptions: ["A tiny, complete gratitude."], atlas: "emote_check", kind: "prop" },
  emote_dots: { key: "emote_dots", name: "Ellipsis", descriptions: ["A thought, still loading."], atlas: "emote_dots", kind: "prop" },
  emote_sparkle: { key: "emote_sparkle", name: "A Sparkle", descriptions: ["Recognition, in mineral form."], atlas: "emote_sparkle", kind: "prop" },
  emote_goat: { key: "emote_goat", name: "A Goat Icon", descriptions: ["The org chart has a new feeling."], atlas: "emote_goat", kind: "prop" },
  emote_melon: { key: "emote_melon", name: "A Melon Icon", descriptions: ["Fruit as policy."], atlas: "emote_melon", kind: "prop" },
  emote_waffle: { key: "emote_waffle", name: "A Waffle Icon", descriptions: ["Ceremony, in batter."], atlas: "emote_waffle", kind: "prop" },
  emote_alarm: { key: "emote_alarm", name: "An Alarm", descriptions: ["Please walk, do not run."], atlas: "emote_alarm", kind: "prop" },
  bubble: { key: "bubble", name: "A Speech Bubble", descriptions: ["A place for a short truth."], atlas: "bubble", kind: "prop" },
  bubble_tail: { key: "bubble_tail", name: "A Bubble Tail", descriptions: ["It points at the speaker, loyally."], atlas: "bubble_tail", kind: "prop" },
  bubble_memo: { key: "bubble_memo", name: "A Memo Bubble", descriptions: ["Internal, and slightly greener."], atlas: "bubble_memo", kind: "prop" },
  bubble_memo_tail: { key: "bubble_memo_tail", name: "A Memo Tail", descriptions: ["From the office of no particular desk."], atlas: "bubble_memo_tail", kind: "prop" },
  bubble_whisper: { key: "bubble_whisper", name: "A Whisper Bubble", descriptions: ["Lean in. This is not on the record."], atlas: "bubble_whisper", kind: "prop" },
  bubble_whisper_tail: { key: "bubble_whisper_tail", name: "A Whisper Tail", descriptions: ["It knows where you live. At your desk."], atlas: "bubble_whisper_tail", kind: "prop" },
  bubble_typing: { key: "bubble_typing", name: "A Typing Bubble", descriptions: ["A thought is being refined."], atlas: "bubble_typing", kind: "prop" },
  shadow_person: { key: "shadow_person", name: "A Person's Shadow", descriptions: ["Proof of a person, on the white."], atlas: "shadow_person", kind: "prop" },
  shadow_goat: { key: "shadow_goat", name: "A Goat's Shadow", descriptions: ["Proof of a goat, which is more surprising."], atlas: "shadow_goat", kind: "prop" },
  shadow_small: { key: "shadow_small", name: "A Small Shadow", descriptions: ["Even mugs have weight here."], atlas: "shadow_small", kind: "prop" },
  select_ring: { key: "select_ring", name: "The Selection Ring", descriptions: ["You have chosen this, and it knows."], atlas: "select_ring", kind: "prop" },
  fx_zzz: { key: "fx_zzz", name: "Sleep Marks", descriptions: ["A nap in typography."], atlas: "fx_zzz", kind: "prop" },
  fx_confetti: { key: "fx_confetti", name: "Confetti", descriptions: ["Paper, celebrating a quota."], atlas: "fx_confetti", kind: "prop" },
  fx_sparkle: { key: "fx_sparkle", name: "Sparkles", descriptions: ["A brief, official magic."], atlas: "fx_sparkle", kind: "prop" },
  fx_steam: { key: "fx_steam", name: "Steam", descriptions: ["The coffee machine, thinking aloud."], atlas: "fx_steam", kind: "prop" },
  fx_flashlight_E: { key: "fx_flashlight_E", name: "A Flashlight (East)", descriptions: ["The Floor Supervisor, making night legal."], atlas: "fx_flashlight_E", kind: "prop" },
  fx_flashlight_W: { key: "fx_flashlight_W", name: "A Flashlight (West)", descriptions: ["A cone of certainty."], atlas: "fx_flashlight_W", kind: "prop" },
  fx_flashlight_S: { key: "fx_flashlight_S", name: "A Flashlight (South)", descriptions: ["Please be where it is pointing."], atlas: "fx_flashlight_S", kind: "prop" },
  fx_flashlight_N: { key: "fx_flashlight_N", name: "A Flashlight (North)", descriptions: ["The night, briefly organised."], atlas: "fx_flashlight_N", kind: "prop" },
  scanlines: { key: "scanlines", name: "Scanlines", descriptions: ["The past, applied gently."], atlas: "scanlines", kind: "prop" },
  panel_memo: { key: "panel_memo", name: "A Memo Panel", descriptions: ["Green on black. Please read, then continue."], atlas: "panel_memo", kind: "prop" },
  panel_beige: { key: "panel_beige", name: "A Beige Panel", descriptions: ["The colour of a form that was always going to be filed."], atlas: "panel_beige", kind: "prop" },
  "reception-desk": { key: "reception-desk", name: "The Reception Desk", descriptions: ["First impressions are processed here.", "Bea has already told your chair."], atlas: "null", kind: "furniture" },
  microwave: { key: "microwave", name: "The Microwave", descriptions: ["It heats food and, occasionally, reputations."], atlas: "null", kind: "furniture" },
  fridge: { key: "fridge", name: "The Fridge", descriptions: ["The light is a kind of shrine."], atlas: "null", kind: "furniture" },
  "snack-bar": { key: "snack-bar", name: "The Snack Bar", descriptions: ["It calls names, legally."], atlas: "null", kind: "furniture" },
  "toilet-door": { key: "toilet-door", name: "The Restoration Door", descriptions: ["A door to a small, private reset."], atlas: "null", kind: "furniture" },
  rug: { key: "rug", name: "The Rug", descriptions: ["A soft rectangle of permission."], atlas: "null", kind: "furniture" },
  counter: { key: "counter", name: "The Counter", descriptions: ["Things wait here, professionally."], atlas: "null", kind: "furniture" },
  bin: { key: "bin", name: "The Bin", descriptions: ["A dignified end for almost-memos."], atlas: "null", kind: "furniture" },
  "dog-bed": { key: "dog-bed", name: "Biscuit's Bed", descriptions: ["Employee-of-the-hour sleeping quarters."], atlas: "null", kind: "furniture" },
  candle: { key: "candle", name: "A Shrine Candle", descriptions: ["It is doing its very best."], atlas: "null", kind: "furniture" },
  portrait: { key: "portrait", name: "The Founder's Portrait", descriptions: ["The paint is only paint. He is still here."], atlas: "null", kind: "furniture" },
  podium: { key: "podium", name: "The Podium", descriptions: ["A box to stand on while thanking the floor."], atlas: "null", kind: "furniture" },
  screen: { key: "screen", name: "The Assembly Screen", descriptions: ["Slides, or a kindly blank."], atlas: "null", kind: "furniture" },
  whiteboard: { key: "whiteboard", name: "The Whiteboard", descriptions: ["A place where arrows go to think."], atlas: "null", kind: "furniture" },
  "pod-booth": { key: "pod-booth", name: "A Privacy Pod", descriptions: ["One thought, one person, one doorless door."], atlas: "null", kind: "furniture" },
  "desk-chair": { key: "desk-chair", name: "A Desk Chair", descriptions: ["It knows this sitting position."], atlas: "null", kind: "furniture" },
  stool: { key: "stool", name: "A Kitchen Stool", descriptions: ["Perching, as a form of lunch."], atlas: "null", kind: "furniture" },
  armchair: { key: "armchair", name: "A Library Armchair", descriptions: ["For reading the Handbook again."], atlas: "null", kind: "furniture" },
  sofa: { key: "sofa", name: "A Sofa", descriptions: ["It is for sitting that looks like resting."], atlas: "null", kind: "furniture" },
  "coffee-machine": { key: "coffee-machine", name: "The Coffee Machine", descriptions: ["Morale, with a button."], atlas: "null", kind: "furniture" },
  "water-cooler": { key: "water-cooler", name: "The Water Cooler", descriptions: ["Water, and also news."], atlas: "null", kind: "furniture" },
  "ping-pong-table": { key: "ping-pong-table", name: "The Ping-Pong Table", descriptions: ["Recreation, scheduled as alignment.", "The ball is a stakeholder."], atlas: "null", kind: "furniture" },
  "vending-machine": { key: "vending-machine", name: "The Vending Machine", descriptions: ["It accepts gratitude and, occasionally, coins."], atlas: "null", kind: "furniture" },
  "aquarium-tank": { key: "aquarium-tank", name: "The Aquarium", descriptions: ["A rectangular sea, fully employed.", "The water is 72°F. Always. They're welcome."], atlas: "null", kind: "furniture" },
  "fish-food-shelf": { key: "fish-food-shelf", name: "The Fish-Food Shelf", descriptions: ["Breakfast for colleagues who swim.", "Martin measures it, lovingly."], atlas: "null", kind: "furniture" },
  package: { key: "package", name: "A Parcel", descriptions: ["Addressed to the floor. Origin unclear."], atlas: "null", kind: "furniture" },
  "mail-slot": { key: "mail-slot", name: "The Mail Slots", descriptions: ["Pigeonholes for people who do not leave."], atlas: "null", kind: "furniture" },
  "mystery-door": { key: "mystery-door", name: "The Door With No Wall", descriptions: ["A door. Standing on its own.", "Locked from the other side.", "Please do not knock unless invited by the door."], atlas: "null", kind: "furniture" },
  "goat-fence": { key: "goat-fence", name: "The Goat Pen", descriptions: ["Authorized goats only.", "The hay is budgeted."], atlas: "null", kind: "furniture" },
  "hay-bale": { key: "hay-bale", name: "A Bale of Hay", descriptions: ["For The Goat. And, spiritually, for us."], atlas: "null", kind: "furniture" },
  "plant-wall": { key: "plant-wall", name: "The Plant Wall", descriptions: ["A vertical garden of very quiet colleagues."], atlas: "null", kind: "furniture" },
  "it-desk": { key: "it-desk", name: "The IT Help Desk", descriptions: ["Have you tried aligning it?"], atlas: "null", kind: "furniture" },
  "mail-counter": { key: "mail-counter", name: "The Mail Counter", descriptions: ["Packages arrive. Explanations do not."], atlas: "null", kind: "furniture" },
  "nap-pod": { key: "nap-pod", name: "A Nap Pod", descriptions: ["A permitted absence of oneself."], atlas: "null", kind: "furniture" },
  "archive-shelf": { key: "archive-shelf", name: "The Archive Shelf", descriptions: ["Handbooks, in every edition, including this one."], atlas: "null", kind: "furniture" },
  void: { key: "void", name: "The Void", descriptions: ["It has always been here. It is fine.", "If you can see the horizon, you have walked too far."], atlas: "null", kind: "place" },
  biscuit: { key: "biscuit", name: "Biscuit", descriptions: ["Employee of the Hour, every hour.", "Has a badge. Cannot read it."], atlas: "null", kind: "animal" },
  goat: { key: "goat", name: "The Goat", descriptions: ["Not on the org chart.", "Appears from the void. Wears a lanyard."], atlas: "null", kind: "animal" },
  gerald: { key: "gerald", name: "Gerald", descriptions: ["Gerald. He has seen things.", "He prefers the left glass. He will not say why."], atlas: "null", kind: "fish" },
  pamela: { key: "pamela", name: "Pamela", descriptions: ["Pamela swims in policy.", "She has never missed a Monday."], atlas: "null", kind: "fish" },
  steve: { key: "steve", name: "Steve", descriptions: ["Steve. Recently considered for promotion.", "He does not know. Please let him be surprised."], atlas: "null", kind: "fish" },
  "the-intern": { key: "the-intern", name: "The Intern", descriptions: ["Still onboarding. Has been for months.", "He shadows Gerald, uninvited."], atlas: "null", kind: "fish" },
  muriel: { key: "muriel", name: "Muriel", descriptions: ["Muriel prefers the back of the tank.", "She is in a meeting with the rocks."], atlas: "null", kind: "fish" },
  dot: { key: "dot", name: "Dot", descriptions: ["Dot is Deputy of Water.", "A very small fish with a very large title."], atlas: "null", kind: "fish" },
  "elevator-place": { key: "elevator-place", name: "The Elevator", descriptions: ["The only entrance. A rumour of an exit.", "It smells like brass and decisions."], atlas: "null", kind: "place" },
  "shrine-place": { key: "shrine-place", name: "The Founder's Shrine", descriptions: ["Candles, oil, and a permanent kind of pride."], atlas: "null", kind: "place" },
  "kitchen-place": { key: "kitchen-place", name: "The Nourishment Station", descriptions: ["Food is permitted. Fish, less so."], atlas: "null", kind: "place" },
  "library-place": { key: "library-place", name: "The Handbook Library", descriptions: ["Every copy is the same copy, almost."], atlas: "null", kind: "place" },
  "archive-place": { key: "archive-place", name: "The Archive Island", descriptions: ["History, filed under 'please do not sneeze'."], atlas: "null", kind: "place" },
  "break-place": { key: "break-place", name: "The Recreation Island", descriptions: ["Ping-pong and vending, in that moral order."], atlas: "null", kind: "place" },
  "wellness-place": { key: "wellness-place", name: "The Wellness Grove", descriptions: ["Calming facts live here, some of them true."], atlas: "null", kind: "place" },
  "nap-place": { key: "nap-place", name: "The Nap-Pod Island", descriptions: ["Rest is a deliverable."], atlas: "null", kind: "place" },
  "mail-place": { key: "mail-place", name: "The Mail Room", descriptions: ["The mail arrives from somewhere. We do not ask."], atlas: "null", kind: "place" },
  "it-place": { key: "it-place", name: "IT Help", descriptions: ["A desk for problems that are 'just a config change'."], atlas: "null", kind: "place" },
  "annex-place": { key: "annex-place", name: "The Quiet Annex", descriptions: ["Hotdesks for people who are already here."], atlas: "null", kind: "place" },
  "goat-pen-place": { key: "goat-pen-place", name: "The Secret Goat Pen", descriptions: ["You did not hear about this from a memo."], atlas: "null", kind: "place" },
  "mystery-door-place": { key: "mystery-door-place", name: "The Door", descriptions: ["It is a door. That is the entire architecture."], atlas: "null", kind: "place" },
  "void-offsites-place": { key: "void-offsites-place", name: "The White Picnic", descriptions: ["An offsite, held at the office, in the void."], atlas: "null", kind: "place" },
  "board-visit-place": { key: "board-visit-place", name: "The Temporary Table", descriptions: ["The Board sits here, when the Board is real."], atlas: "null", kind: "place" },
  "aquarium-place": { key: "aquarium-place", name: "The Aquarium Island", descriptions: ["A sea with a bench and a schedule."], atlas: "null", kind: "place" },
  "muster-place": { key: "muster-place", name: "Muster", descriptions: ["Please proceed here, in an orderly circle."], atlas: "null", kind: "place" }
};

function belongingDescription(p, item) {
  const first = p.first || p.name.split(" ")[0];
  if (item === "mug") {
    const slogan = MUG_SLOGANS[p.id] || "WORLD'S OKAYEST REFINER";
    return `${first}'s mug. It says ${slogan}.`;
  }
  const map = {
    photo: `${first}'s photo. It is of this desk, from earlier.`,
    trophy: `${first}'s trophy. For a thing that remains unspecified.`,
    candle: `${first}'s candle. It is doing its very best.`,
    rubberduck: `${first}'s rubber duck. It has heard every secret.`,
    books: `${first}'s books. One of them is the Handbook. All of them are.`,
    plant: `${first}'s plant. It requires almost no love, and receives exactly that.`,
    waterbottle: `${first}'s water bottle. Hydration is a deliverable.`,
    stressball: `${first}'s stress ball. It has a new shape this week.`,
    figurine: `${first}'s figurine. Better posture than its owner.`,
    cactus: `${first}'s cactus. A humble, water-avoiding plant.`,
    snowglobe: `${first}'s snowglobe. The weather inside is policy.`,
    eraser: `${first}'s novelty eraser. It commemorates more than it erases.`,
    lamp: `${first}'s desk lamp. A small, loyal sun.`,
    headphones: `${first}'s headphones. For meetings that are also music.`,
  };
  return map[item] || `${first}'s ${item}. It lives here now.`;
}

export function buildObjects({ people, rooms, pets, furniture, layout }) {
  const catalog = { ...OBJECT_CATALOG };
  // rooms as places
  for (const r of rooms || []) {
    if (!catalog[r.id]) {
      catalog[r.id] = { key: r.id, name: r.name, kind: "room", descriptions: [`${r.name}. Capacity ${r.capacity}, which is also a hope.`, r.purpose || "A meeting island in the white."] };
    }
  }
  const instances = [];
  for (const p of people || []) {
    for (const item of (p.belongings || [])) {
      const key = BELONGING_ATLAS[item] || item;
      const desc = belongingDescription(p, item);
      instances.push({
        id: `belonging-${p.id}-${item}`,
        catalog_key: catalog[key] ? key : (catalog[item] ? item : "papers"),
        name: `${p.first}'s ${item[0].toUpperCase()}${item.slice(1).replace("rubberduck", "Rubber Duck")}`,
        description: desc,
        descriptions: [desc],
        owner_id: p.id,
        kind: "belonging",
        prop: item,
        desk_id: p.desk_id || p.deskId || null,
      });
    }
  }
  // furniture instances: use catalog by type, plus a short flavour if id is special
  for (const f of furniture || []) {
    const ck = f.type in catalog ? f.type : (f.type.replaceAll("-", "_") in catalog ? f.type.replaceAll("-", "_") : null);
    if (!ck) continue;
    if (["plant", "plant-tall", "table", "desk-chair", "chair", "stool"].includes(f.type) && !f.label) continue; // too many; catalog covers the type
    instances.push({
      id: f.id,
      catalog_key: ck,
      name: f.label || catalog[ck].name,
      description: (catalog[ck].descriptions || [])[0],
      x: f.x, y: f.y, kind: "furniture",
    });
  }
  return { catalog, instances, fish: FISH };
}


export function mergeLines(lines, people, events) {
  const bubbles = lines.bubbles;
  const add = (key, arr) => {
    if (!arr || !arr.length) return;
    const box = (bubbles[key] ||= []);
    const have = new Set(box);
    for (const s of arr) {
      const t = String(s).trim();
      if (!t || have.has(t)) continue;
      box.push(t);
      have.add(t);
    }
  };
  for (const [k, arr] of Object.entries(EXTRA_BUBBLES)) add(k, arr);
  // event keys
  if (events) for (const e of events) {
    if (EXTRA_BUBBLES[e.id]) add(e.id, EXTRA_BUBBLES[e.id]);
    if (e.line_key || e.lineKey) add(e.line_key || e.lineKey, EXTRA_BUBBLES[e.line_key || e.lineKey] || []);
  }
  lines.banter = BANTER;
  lines.founder_memos = FOUNDER_MEMOS;
  lines.anti_repeat = ANTI_REPEAT;
  // default cooldowns for very short lines
  const byText = { ...(ANTI_REPEAT.by_text || {}) };
  for (const arr of Object.values(bubbles)) {
    for (const s of arr) if (s.length <= 8 && byText[s] == null) byText[s] = 180;
  }
  lines.anti_repeat.by_text = byText;
  return lines;
}
