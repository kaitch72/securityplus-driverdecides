/* ========================================
   DRIVER DECIDES
   SECURITYPLUS FINANCIAL LITERACY GAME
   Ages 7-10

   CORE LESSON: manage one pot of money toward a goal.
   The scooter carries a single wallet, starting at $0.
   Steering into a dollar icon EARNS money and adds it to
   the wallet. Steering into a spend icon SPENDS money and
   subtracts it from that same wallet - there's no separate
   safe pot, so money you've earned can still be spent away.
   The wallet can go negative if you spend more than you
   have. The ride keeps going, spawning new earn/spend icons,
   until the wallet reaches the round's goal amount (or a
   generous safety cap is hit). Sitting in an empty lane does
   nothing at all. Every lane you choose is a real decision.
======================================== */

/* ================= TUNING CONSTANTS ================= */

const STARTING_MONEY = 0;

// Neither earn nor spend is a fixed amount (2026-08-26, pricing passes).
// A dollar icon is worth $1 or $2 (EARN_AMOUNTS below, picked per catch) -
// not every catch is the same size, so it isn't always worth the same
// toward the goal. Spend flavors carry their own price too (see
// SPEND_FLAVORS below), from $1 candy up to a $5 video game - a kid can
// afford a few cheap items, or one bigger one, instead of every catch
// draining the same amount. Both prices show right on the icon as it
// travels (see .obstacle-price in style.css) so they're part of the
// decision, not a surprise after the fact.
const EARN_AMOUNTS = [1, 2];

function pickEarnAmount() {
    return EARN_AMOUNTS[Math.floor(Math.random() * EARN_AMOUNTS.length)];
}

// Ride length is no longer fixed - it keeps spawning icons until the
// wallet reaches the goal (2026-08-27). This is the size of one shuffled
// earn/spend batch; once a batch runs out mid-ride, a fresh batch is
// shuffled in so pacing stays even no matter how long the ride runs.
const OBSTACLES_PER_BATCH = 24;        // 12 earn + 12 spend icons per batch, spawned one at a time

// Safety net only - not a normal target. If a ride somehow never reaches
// its goal (e.g. a kid isn't catching anything), this stops it from
// running forever instead of ending naturally at the goal.
const MAX_OBSTACLES_SAFETY = 150;
const SPAWN_INTERVAL_MIN_MS = 700;     // shortest gap between one obstacle spawning and the next
const SPAWN_INTERVAL_MAX_MS = 1400;    // longest gap - randomized so spacing never feels metronomic
const TRAVEL_SPEED_PCT_PER_MS = 0.017; // how fast obstacles cross the screen (slowed yet again - still too fast to read at 0.024)

// Obstacles enter from the left and travel right, past the scooter.
const SPAWN_X = -18;    // % from left where obstacles first appear
const COLLISION_X = 75; // % from left where the scooter sits (matches CSS)
const REMOVE_X = 108;   // % from left where obstacles get cleaned up

// Three lanes the scooter can occupy (percent from top of #game).
const LANES = [50, 62, 74];


/* ================= GAME STATE ================= */

let wallet = STARTING_MONEY;
let spent = 0;
let earned = 0;
let items = [];

let gameRunning = false;

let scooterY = LANES[1];
let dragging = false;
let dragOffsetY = 0;

let selectedGoal = null;

let obstacles = [];   // active obstacles currently on screen
let obstacleQueue = [];   // shuffled save/spend types still left to spawn this ride
let obstaclesSpawned = 0;
let spawnTimer = 0;
let nextSpawnDelay = 0;
let lastFrameTime = null;
let animationFrameId = null;


/* ================= LEVELS =================
   Three rounds, each with a bigger goal amount.
   Same wallet/catch-amount rules every round -
   only the target gets harder to reach.
=========================================== */

const LEVELS = [
    { icon: "🧸", name: "Toy", cost: 10 },
    { icon: "🎮", name: "Game", cost: 15 },
    { icon: "🛴", name: "Scooter", cost: 20 }
];

let currentLevelIndex = 0;
let levelResults = [];   // true/false per completed round, this playthrough


/* ================= OBSTACLE ART =================
   Reuses the same brand icon paths already inlined
   in index.html, so a caught dollar / spend icon
   always matches the Earned / Spent HUD stats it feeds.
=================================================== */

// Earn catches show a dollar bill (2026-08-27, swapped from the piggy
// bank) - there's no separate protected pot anymore, so the piggy bank's
// "safe savings" visual no longer matches what this catch actually does.
const EARN_SVG = `
    <svg class="obstacle-icon" viewBox="0 0 159.84 138.36" aria-hidden="true">
        <path d="M57.87,136.07c-20.64,4.62-38.84,2.03-57.87-5.74V8.06s10.98,4.22,10.98,4.22c16.62,6.39,34.41,6.4,51.59,1.77l18.7-5.79c7.47-2.31,14.6-4.54,22.23-6.3,19.83-4.1,37.78-1.61,56.33,6.01v122.38c-20.16-9.11-39.02-11.73-60.24-6.79l-21.49,6.55-20.24,5.97ZM63.19,124.37l24.79-7.93c10.53-3.17,21.05-5.07,31.89-5.46,1.74-15.42,14.69-26.9,30.01-26.8l-.02-45.03c-16.49-.23-29.59-13.04-30.01-29.2-8.11.12-15.45,1.78-23.02,3.87l-26.86,8.61c-9.91,3.04-19.76,4.54-30.4,4.85-1.46,15.26-14.32,26.86-29.62,26.83v45.01c16.51.28,29.55,13.24,29.91,29.36,7.9-.44,15.4-1.82,23.32-4.1ZM149.87,14.69c-6.81-2.21-13.15-3.52-20.07-4.4.93,10.61,9.17,18.64,20.06,18.82v-14.42ZM29.81,26.62c-7.16-.8-13.16-2.05-19.84-4.02v21.51c10.33-.06,18.76-7.54,19.84-17.48ZM149.87,115.72v-21.55c-10.41,0-18.51,7.51-19.7,17.46,6.7.77,12.9,2.06,19.7,4.09ZM29.91,127.82c-1.16-11.06-9.43-18.43-19.93-18.68l.03,14.45c6.77,2.18,13.11,3.6,19.9,4.23Z"/>
        <path d="M103.24,87.67c-5.21,11.34-17.12,19.1-29.16,15.61-7.57-2.2-13.53-7.43-17.07-14.51-7.85-15.73-5.78-36.67,7.3-48.46,8.15-7.34,19.64-8.27,28.62-1.91,14.96,10.59,17.95,32.64,10.31,49.27ZM88.8,90.43c10.79-9.91,11.26-29.48,1.87-40.72-2.79-3.33-6.31-5.4-10.28-5.53-4.19-.13-7.86,1.72-10.78,4.91-9.63,10.55-9.57,29.32-.05,40.02,5.18,5.82,13.26,6.8,19.24,1.31Z"/>
    </svg>
`;

// Spend-icon variety (2026-08-26, second round of feedback): instead of
// always showing the same shopping cart, every spend catch now shows one of
// several different temptations - Kayla exported these from Font Awesome.
// The cart icon is retired from gameplay entirely (still used elsewhere as
// the "Spent" HUD stat glyph in index.html - that's unrelated and untouched).
const TOY_BEAR_SVG = `
    <svg class="obstacle-icon" viewBox="0 0 162.85 159.66" aria-hidden="true">
        <path d="M156.4,159.66H6.6s-.01-49.9-.01-49.9l30.01-.02c-.15-.84-.45-1.33-1.03-1.79-10.6-5.88-20.32-13.05-27.64-22.7l-7.93-10.44,32.71-23.03,6.12,8.23c-1.65-6.42-2.83-12.11-2.04-18.9-11.91-7.5-13.69-24.08-3.92-34.28s26.5-8.95,34.73,3.08l27.68.05c7.93-11.77,24.28-13.26,34.29-3.57,10.12,9.8,8.71,26.68-3.17,34.64.27,6.8-.61,12.95-2.52,19.3l6.29-8.55,32.68,23.05c-9.32,14.2-21.12,25.2-35.47,33.09-.71.28-.97.84-.94,1.83h29.98s-.02,49.92-.02,49.92ZM114.09,58.11c3.19-7.61,3.14-14.93,1.27-22.76,4.05-1.23,7.31-3.05,9.45-6.34,4.19-6.82,1.03-15.51-6.14-18.21s-14.87,1.22-17.08,9.11l-39.94.02c-1.87-6.62-7.79-10.86-14.51-9.81s-11.26,6.79-10.57,13.58c.68,5.96,5.09,10.1,11.11,11.55-3.43,16.41,2.85,33.04,17.83,40.73,18.2,9.35,40.63,1.1,48.58-17.87ZM146.42,119.73h-19.99s.01,9.99.01,9.99l-9.98-.02.04-27.34c12.9-6,24.04-14.31,32.4-25.43l-16.54-11.21c-12.23,14.91-29.95,23.63-49.08,24.08-20.62.39-39.72-8.46-52.69-24.08l-16.26,11.29c8.63,10.98,19.57,19.78,32.21,25.4l-.03,27.3-9.95.02v-9.99s-20.01,0-20.01,0v29.94s129.91,0,129.91,0l-.05-29.95Z"/>
        <ellipse cx="66.47" cy="44.87" rx="6.2" ry="6.2"/>
        <ellipse cx="96.44" cy="44.87" rx="6.2" ry="6.2"/>
        <path d="M89.16,67.01c-4.27,3.61-10.28,3.65-14.63.58-1.61-1.14-2.81-2.98-2.98-4.53-.22-1.97.64-3.93,2.18-5.3,4.08-3.61,10.3-3.87,14.75-.68,1.51,1.08,2.74,3.12,2.87,4.53.17,1.93-.56,4.03-2.18,5.4Z"/>
        <path d="M95.9,121.06c-1.56-6.36-6.96-10.69-12.96-11.21-6.46-.57-12.4,3-15.15,8.93-1.53,3.31-1.4,6.64-1.18,10.86l-10.06.1.13-7.51c1.29-12.57,11.64-21.95,23.84-22.42,12.51-.48,23.63,8.38,25.56,21.01l.4,8.9h-9.95c-.04-3,.04-5.88-.63-8.65Z"/>
    </svg>
`;

const GAME_DEVICE_SVG = `
    <svg class="obstacle-icon" viewBox="0 0 119.78 159.65" aria-hidden="true">
        <path d="M119.78,0v159.65H0V0h119.78ZM109.82,9.98H9.96v139.69h99.87V9.98Z"/>
        <path d="M99.81,19.96v59.87H19.97V19.96h79.84ZM29.92,29.93v39.91h59.93V29.93H29.92Z"/>
        <polygon points="39.92 119.72 29.95 119.74 29.96 109.76 19.97 109.76 19.97 99.78 29.96 99.78 29.95 89.8 39.91 89.8 39.9 99.78 49.89 99.78 49.89 109.76 39.91 109.75 39.92 119.72"/>
        <ellipse cx="92.28" cy="97.29" rx="7.43" ry="7.42"/>
        <ellipse cx="72.31" cy="112.25" rx="7.43" ry="7.42"/>
    </svg>
`;

const PUZZLE_SVG = `
    <svg class="obstacle-icon" viewBox="0 0 159.78 159.7" aria-hidden="true">
        <path d="M104.85,99.6l.05-14.76h34.91s-.01,74.86-.01,74.86H.02s-.02-139.74-.02-139.74h74.89s0,64.86,0,64.86h19.97s.01,15.28.01,15.28c.2,2.89,2.38,4.64,4.99,4.62,2.76-.02,4.97-2.1,4.98-5.14ZM54.76,79.02l.21,5.83h9.95s0-54.9,0-54.9H9.96s0,54.9,0,54.9h14.97s.29-8.32.29-8.32c2.2-7.33,8.63-12.23,16.09-11.53,7.02.66,13.17,6.32,13.45,14.01ZM59.39,134.65c-7.91-.17-13.85-6.37-14.4-13.65-.54-7.25,4.34-14.07,11.68-15.75,2.58-.59,5.26-.45,8.25-.44l.02-9.99h-19.96s-.06-14.77-.06-14.77c-.01-2.89-2.34-5.15-4.92-5.13s-4.82,1.76-5.06,4.52v15.38s-24.97,0-24.97,0v54.9s54.97,0,54.97,0v-14.94s-5.55-.12-5.55-.12ZM129.85,149.72v-54.91s-15.01.01-15.01.01c.05,3.35-.09,6.31-.69,9.42-2.3,6.88-8.55,11.04-15.65,10.42-6.65-.58-13.24-5.68-13.43-12.83l-.19-7.01h-10s0,19.95,0,19.95l-14.71.02c-3.11,0-5.39,2.36-5.28,5.1s2.21,4.86,5.26,4.85l14.72.02v24.95s54.97,0,54.97,0Z"/>
        <path d="M89.92,64.88l-.04-27.44h14.72c2.99-.06,5.06-2.07,5.14-4.74s-2.02-5.21-5.11-5.24l-14.74-.02V0s69.89,0,69.89,0v64.86s-20.07.03-20.07.03c-.13,8.6-6.75,14.91-14.89,14.89-8.09-.01-14.97-6.36-14.94-14.91h-19.96ZM119.79,54.91l.13,10.69c.03,2.85,2.98,4.39,5.31,4.19,2.67-.23,4.5-2.24,4.59-5.12l.05-9.77h19.95s0-44.92,0-44.92h-49.97s0,7.46,0,7.46l5.73.13c7.97.18,14.02,6.96,14.13,14.62s-5.56,14.86-13.65,15.09l-6.23.18v7.44s19.94.01,19.94.01Z"/>
    </svg>
`;

const KITE_SVG = `
    <svg class="obstacle-icon" viewBox="0 0 189.78 157.19" aria-hidden="true">
        <path d="M24.99,49.9H0s.01-9.98.01-9.98h34.92s0,32.44,0,32.44l24.97-9.94v44.74s-24.99-9.81-24.99-9.81l.05,50.11,37.71-37.63L90.47,0h99.31s-.01,99.17-.01,99.17l-109.84,17.77-40.24,40.23-14.72.02v-59.87S0,107.16,0,107.16v-44.62s24.94,9.89,24.94,9.89l.04-22.52ZM172.56,10l-67.97-.03,34.01,33.99,33.96-33.97ZM131.39,51.16l-33.44-33.75-13.04,80.18,46.49-46.43ZM179.77,85.02l.02-67.81-34,33.93,33.99,33.88ZM172.21,91.68l-33.65-33.36-46.94,46.48,80.59-13.13ZM24.97,86.36l-.09-3.19-14.91-5.79v14.94s15.01-5.96,15.01-5.96ZM49.93,92.35l.02-15-14.97,5.84.05,3.3,14.91,5.86Z"/>
    </svg>
`;

const DUCK_SVG = `
    <svg class="obstacle-icon" viewBox="0 0 159.79 139.63" aria-hidden="true">
        <path d="M136.76,93.55c3.65,24.18-14.59,46.1-39.22,46.08l-38.29-.03C26.95,139.58.77,113.44.04,81.24l-.04-11.4,9.75-.05,17.63,7.54,51.44-14.39c-13.18-10.12-17.46-27.39-10.87-42.28C74.25,6.4,89.61-2.24,105.6.51c14.26,2.46,25.29,13.28,28.55,27.48,3.31.31,6.6.33,9.9-.11l15.76-2.08-.06,9.1c-.11,16.41-13.19,29.69-29.62,29.9l-5.28.07-.06,5.94c6.54,6.07,10.65,13.87,11.99,22.75ZM9.95,80.79c.73,26.42,21.87,48.75,48.77,48.81l38.38.09c13.17.03,24.51-8.33,28.55-20.24,4.27-12.58-.04-26.01-10.74-34.1l.07-20.61c11.83-9.37,12.92-25.77,3.43-36.44s-26.34-11.11-36.44-.79c-9.97,10.18-9.46,26.89,1.69,36.37l6.23,4.85-.07,11.47-6.41,1.95-56.56,15.78-16.91-7.13ZM128.73,54.8c11.42.38,19.76-7.8,20.95-17.75-5.17.77-9.9,1.3-14.98,1.03-.5,6.15-3.11,11.72-5.97,16.72Z"/>
        <ellipse cx="104.8" cy="37.39" rx="7.43" ry="7.42"/>
        <path d="M39.05,110.09l6.46-7.52c7.9,6.69,18.03,8.5,27.58,5.19s16.9-11.18,18.58-21.69l9.68,1.27c-2.05,13.36-11,24.59-23.67,29.37s-27.77,2.66-38.63-6.62Z"/>
    </svg>
`;

const CANDY_SVG = `
    <svg class="obstacle-icon" viewBox="0 0 173.77 173.29" aria-hidden="true">
        <path d="M41.47,173.29l-9.35-.59-3.74-14.65-9.96,3.14-6.26-6.19,3.45-10.03-14.74-3.48-.87-9.62,30.6-13.08c-17.93-30.09-7.33-70.3,23.28-88.02,20.56-11.9,44.86-11.95,65.32-.19L132.33,0l9.33.6,3.77,14.64,9.65-3.12,6.24,6.19-3.19,10.06,14.72,3.39.91,9.67-30.55,13.11c19.26,34.36,4.17,77.49-32.2,92.23-18.29,7.41-38.91,6.01-56.41-3.7l-13.13,30.22ZM145.45,35.16l3.33-10.53-10.57,3.66-2.85-10.73-7.76,18.53c3.63,3.18,6.82,6.36,9.67,10.05l18.51-8.08-10.34-2.92ZM141.28,92.87c2.29-20.92-7.14-40.01-23.46-51.42-19.34-13.3-44.95-12.8-63.85,1.29l87.31,50.13ZM127,124.1c5.84-6.17,9.43-13.15,12.25-20.9L46.2,49.54c-5.78,6.91-10.19,14.54-12.44,22.87l93.24,51.69ZM118.85,131.21l-86.8-48.38c-1.66,21.28,9.54,40.93,26.87,51.1,18.86,11.06,42.33,10.02,59.93-2.72ZM35.5,145.01l2.65,10.61,8.04-18.43c-3.83-3.2-6.94-6.37-10.01-10.04l-18.4,8.06,10.46,2.98-3.25,10.47,10.51-3.65Z"/>
    </svg>
`;

const FOOD_SVG = `
    <svg class="obstacle-icon" viewBox="0 0 170.03 174.98" aria-hidden="true">
        <path d="M14.09,85.72l14.6,59.22,26.31.06v9.97s-34.09.03-34.09.03L0,71.35l8.98-4.22c4.06,5.43,8.85,9.48,14.69,13.01,11.27,6.47,23.94,9.84,37.22,9.84l-4.87,9.92c-14.95-.95-29.07-5.63-41.93-14.19Z"/>
        <path d="M45.02,72.54c-3.59-.76-6.69-1.99-9.97-3.57V0s9.98,0,9.98,0v72.54Z"/>
        <path d="M85.03,67.89l-6.19,3.75c-.83.5-2.41.81-3.78.89V5s9.97,0,9.97,0v62.88Z"/>
        <rect x="55.05" y="14.98" width="9.97" height="60"/>
        <rect x="15.05" y="14.98" width="9.97" height="40"/>
        <rect x="95.05" y="14.98" width="9.97" height="40"/>
        <circle cx="119.97" cy="95" r="4.94"/>
        <path d="M132.58,86.28c-20.43-4.14-43.14,1.43-52.58,20.88l.03,12.81h-9.97s-.03-15.11-.03-15.11c11.58-27.61,44.9-35.39,71.54-26.3,12.97,4.43,23.06,13.94,28.45,26.32v15.09s-9.97,0-9.97,0v-12.81c-5.41-10.85-15.5-18.46-27.47-20.89Z"/>
        <circle cx="99.97" cy="105" r="4.94"/>
        <polygon points="160.04 150 170.03 149.98 170.02 174.98 70.06 174.98 70.05 149.99 80.02 149.98 80.02 164.98 160.05 164.98 160.04 150"/>
        <circle cx="139.97" cy="105" r="4.94"/>
        <rect x="70.05" y="129.98" width="99.97" height="10"/>
    </svg>
`;

// One of these is picked at random for every spend obstacle spawned.
// Each flavor has its own price (2026-08-26, pricing pass) so spending
// is a real trade-off - a few cheap catches or one bigger one - rather
// than every catch costing the same flat amount.
const SPEND_FLAVORS = [
    { name: "Candy", svg: CANDY_SVG, cost: 1 },
    { name: "Rubber Duck", svg: DUCK_SVG, cost: 2 },
    { name: "Puzzle", svg: PUZZLE_SVG, cost: 2 },
    { name: "Kite", svg: KITE_SVG, cost: 3 },
    { name: "Fast Food", svg: FOOD_SVG, cost: 3 },
    { name: "Teddy Bear", svg: TOY_BEAR_SVG, cost: 4 },
    { name: "Video Game", svg: GAME_DEVICE_SVG, cost: 5 }
];

function pickSpendFlavor() {
    return SPEND_FLAVORS[Math.floor(Math.random() * SPEND_FLAVORS.length)];
}

// A small-scale version of a flavor's icon for the HUD "Items" row and the
// finish screen's grouped list, sized off the containing font-size (1em)
// rather than the 58%-of-obstacle sizing used on the road.
function flavorListIconHtml(flavor) {
    const listSvg = flavor.svg.replace('class="obstacle-icon"', 'class="flavor-list-icon"');
    return `<span class="flavor-icon-wrap">${listSvg}</span>`;
}

// Same tone-cycling sparkle burst used for catches in Coin Catch and
// Lemonade Stand - reused here rather than inventing a new effect.
const SPARKLE_SVG = `
    <svg viewBox="0 0 179.8 170" aria-hidden="true">
        <polygon points="159.82 49.96 149.85 50 149.86 30 129.88 30 129.88 19.99 149.86 20 149.85 0 159.82 0 159.82 20 179.79 19.99 179.8 30 159.82 29.99 159.82 49.96"/>
        <polygon points="149.83 169.96 139.86 170 139.87 150 119.89 150 119.89 139.99 139.87 140 139.86 120 149.83 120 149.82 140 169.8 139.99 169.8 150 149.83 149.99 149.83 169.96"/>
        <path d="M64.87,149.82l-20.03-44.88L0,84.99l44.96-20.07,19.91-44.96,20.01,45.1,44.86,19.96-44.93,20-19.93,44.81ZM64.88,125.25l12.55-27.81,27.77-12.46-27.88-12.52-12.45-27.71-12.55,27.76-27.72,12.49,27.75,12.48,12.53,27.76Z"/>
    </svg>
`;

const SPARKLE_TONES = ["#1943DC", "#258BFF", "#59D2FE"]; // Persian Blue / Blue Bird / Malibu


/* ================= ELEMENTS ================= */

const game = document.getElementById("game");
const scooter = document.getElementById("scooter");
const obstaclesLayer = document.getElementById("obstacles");

const walletDisplay = document.getElementById("wallet");
const itemsDisplay = document.getElementById("items");

const instructions = document.getElementById("instructions");
const startScreen = document.getElementById("startScreen");
const startButton = document.getElementById("startButton");

const finishScreen = document.getElementById("finishScreen");

const finalEarned = document.getElementById("finalEarned");
const finalSpent = document.getElementById("finalSpent");
const prizeResult = document.getElementById("prizeResult");

const goalNameDisplay = document.getElementById("goalName");
const goalProgressFill = document.getElementById("goalProgressFill");
const goalProgressText = document.getElementById("goalProgressText");


/* ================= HELPERS ================= */

function setText(element, value) {
    if (element) {
        element.textContent = value;
    }
}

// The wallet can go negative now that earning and spending share one pot
// (2026-08-27) - this formats a dollar amount with the sign in the right
// place ("-$3" instead of "$-3") wherever the wallet itself is shown.
function formatMoney(amount) {
    return amount < 0 ? "-$" + Math.abs(amount) : "$" + amount;
}

// Which lane (0, 1, 2) is the scooter's current Y position closest to?
function nearestLane(y) {
    let closestIndex = 0;
    let closestDistance = Infinity;

    LANES.forEach(function (laneY, index) {
        const distance = Math.abs(y - laneY);

        if (distance < closestDistance) {
            closestDistance = distance;
            closestIndex = index;
        }
    });

    return closestIndex;
}


/* ================= GOAL DISPLAY ================= */

function updateGoalProgress() {

    if (!selectedGoal) {
        setText(goalNameDisplay, "Choose a goal");
        setText(goalProgressText, "$0 / $0");

        if (goalProgressFill) {
            goalProgressFill.style.width = "0%";
        }

        return;
    }

    // Wallet can be negative (spent more than you have), so the goal bar
    // itself clamps at 0% - but the text below still shows the real,
    // possibly-negative wallet number so that risk stays visible.
    const percentage = Math.max(
        0,
        Math.min(100, Math.round((wallet / selectedGoal.cost) * 100))
    );

    if (goalProgressFill) {
        goalProgressFill.style.width = percentage + "%";
    }

    setText(
        goalProgressText,
        `${formatMoney(wallet)} / $${selectedGoal.cost}`
    );

    setText(
        goalNameDisplay,
        selectedGoal.name
    );
}


/* ================= INVENTORY ================= */

function updateInventory() {

    if (!itemsDisplay) {
        return;
    }

    if (items.length === 0) {
        itemsDisplay.innerHTML =
            '<span style="opacity:.35;">None yet</span>';
        return;
    }

    itemsDisplay.innerHTML = items.map(function (item) {
        return `
            <span
                title="${item.name}"
                style="
                    display:inline-flex;
                    align-items:center;
                    justify-content:center;
                    width:42px;
                    height:42px;
                    font-size:28px;
                "
            >
                ${item.iconHtml}
            </span>
        `;
    }).join("");
}


/* ================= MONEY ================= */

function updateMoney() {

    // Spent/earned no longer have their own HUD cards (2026-08-27) - they
    // still get tallied for the finish-screen recap (see finishGame()),
    // just not shown live while riding. Only the wallet card and the goal
    // progress bar update during the ride now.
    setText(walletDisplay, formatMoney(wallet));

    updateInventory();
    updateGoalProgress();
}


/* ================= LEVEL PREVIEW (start screen) ================= */

function renderLevelPreview() {

    const container = document.getElementById("levelPreview");

    if (!container) {
        return;
    }

    container.innerHTML = LEVELS.map(function (level, index) {
        return `
            <div class="levelPreviewCard">
                <span class="roundTag">Round ${index + 1}</span>
                <span class="levelIcon">${level.icon}</span>
                <strong>${level.name}</strong>
                <span class="levelCost">$${level.cost}</span>
            </div>
        `;
    }).join("");
}

renderLevelPreview();


/* ================= SCOOTER DRAGGING =================
   The scooter follows the pointer continuously. Which
   lane it "counts" as being in is resolved fresh every
   time an obstacle reaches the collision line - see
   resolveObstacle() below.
======================================================= */

if (scooter) {

    scooter.addEventListener("pointerdown", function (event) {

        if (!gameRunning) {
            return;
        }

        dragging = true;
        scooter.setPointerCapture(event.pointerId);

        const rect = game.getBoundingClientRect();
        const gameHeight = rect.height;
        const mouseY = event.clientY - rect.top;
        const scooterTop = (scooterY / 100) * gameHeight;

        dragOffsetY = mouseY - scooterTop;
        scooter.style.cursor = "grabbing";
    });

    scooter.addEventListener("pointermove", function (event) {

        if (!dragging) {
            return;
        }

        const rect = game.getBoundingClientRect();
        const gameHeight = rect.height;

        let mouseY = event.clientY - rect.top;
        mouseY -= dragOffsetY;

        let newPercent = (mouseY / gameHeight) * 100;

        newPercent = Math.max(
            LANES[0] - 8,
            Math.min(LANES[2] + 8, newPercent)
        );

        scooterY = newPercent;
        scooter.style.top = scooterY + "%";
    });

    scooter.addEventListener("pointerup", releaseScooter);
    scooter.addEventListener("pointercancel", releaseScooter);
}

function releaseScooter(event) {

    if (!dragging) {
        return;
    }

    dragging = false;
    scooter.style.cursor = "grab";

    try {
        if (event.pointerId !== undefined) {
            scooter.releasePointerCapture(event.pointerId);
        }
    } catch (error) {
        // Pointer capture may already be released.
    }
}


/* ================= OBSTACLE SPAWNING =================
   Earn and spend icons no longer arrive in synced pairs -
   each one spawns on its own, at a randomized interval, in
   a randomly chosen lane, so they feel scattered across the
   ride instead of ticking by two-at-a-time. Each batch keeps
   a fixed 12 earn / 12 spend mix, shuffled - and once a batch
   runs out, spawnNextObstacle() shuffles in a fresh one, since
   the ride no longer stops after one fixed batch (2026-08-27).
======================================================= */

function buildObstacleQueue() {

    const queue = [];
    const half = OBSTACLES_PER_BATCH / 2;

    for (let i = 0; i < half; i++) {
        queue.push("save");
        queue.push("spend");
    }

    // Fisher-Yates shuffle - scatters save/spend order randomly.
    for (let i = queue.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const temp = queue[i];
        queue[i] = queue[j];
        queue[j] = temp;
    }

    return queue;
}

function randomSpawnDelay() {
    return SPAWN_INTERVAL_MIN_MS +
        Math.random() * (SPAWN_INTERVAL_MAX_MS - SPAWN_INTERVAL_MIN_MS);
}

function maybeSpawnObstacle(dt) {

    // Ride length now tracks the goal, not a fixed obstacle count - keep
    // spawning as long as the ride is running (checkRideEnd handles
    // stopping once the goal - or the safety cap - is reached).
    if (obstaclesSpawned >= MAX_OBSTACLES_SAFETY) {
        return;
    }

    spawnTimer += dt;

    if (spawnTimer >= nextSpawnDelay) {
        spawnTimer = 0;
        nextSpawnDelay = randomSpawnDelay();
        spawnNextObstacle();
    }
}

function spawnNextObstacle() {

    if (obstacleQueue.length === 0) {
        obstacleQueue = buildObstacleQueue();
    }

    const type = obstacleQueue.shift();

    if (!type) {
        return;
    }

    obstaclesSpawned++;

    const lane = Math.floor(Math.random() * LANES.length);

    createObstacle(type, lane);
}

function createObstacle(type, lane) {

    const el = document.createElement("div");
    el.className = "obstacle obstacle--" + type;

    // Spend obstacles get a randomly picked flavor (teddy bear, video game,
    // candy, etc.) so the road shows real variety instead of one repeated
    // icon; earn obstacles are always the dollar icon, but the amount
    // they're worth is picked per catch too (see EARN_AMOUNTS above) - not
    // every catch is worth the same.
    const flavor = type === "spend" ? pickSpendFlavor() : null;
    const earnAmount = type === "save" ? pickEarnAmount() : null;
    el.innerHTML = type === "save" ? EARN_SVG : flavor.svg;

    // Price tag on every obstacle (2026-08-26, pricing pass) - both earn
    // and spend vary now, so the cost is visible before a kid decides
    // whether to steer into it. +/- prefix (added in the color-
    // differentiation follow-up) matches the catch toast's own
    // "+$2 earned!" / "-$3 spent" wording.
    const price = type === "save" ? earnAmount : flavor.cost;
    const sign = type === "save" ? "+" : "-";
    const priceTag = document.createElement("span");
    priceTag.className = "obstacle-price";
    priceTag.textContent = sign + "$" + price;
    el.appendChild(priceTag);

    el.style.top = LANES[lane] + "%";
    el.style.left = SPAWN_X + "%";

    if (obstaclesLayer) {
        obstaclesLayer.appendChild(el);
    }

    obstacles.push({
        type: type,
        lane: lane,
        flavor: flavor,
        earnAmount: earnAmount,
        x: SPAWN_X,
        resolved: false,
        el: el
    });
}


/* ================= OBSTACLE MOVEMENT / COLLISION ================= */

function updateObstacles(dt) {

    const movement = TRAVEL_SPEED_PCT_PER_MS * dt;

    for (let i = obstacles.length - 1; i >= 0; i--) {

        const obstacle = obstacles[i];

        obstacle.x += movement;
        obstacle.el.style.left = obstacle.x + "%";

        if (!obstacle.resolved && obstacle.x >= COLLISION_X) {
            resolveObstacle(obstacle);
        }

        if (obstacle.x >= REMOVE_X) {

            if (obstacle.el && obstacle.el.parentNode) {
                obstacle.el.parentNode.removeChild(obstacle.el);
            }

            obstacles.splice(i, 1);
        }
    }
}

function resolveObstacle(obstacle) {

    obstacle.resolved = true;

    const caught = nearestLane(scooterY) === obstacle.lane;

    if (!caught) {
        return;
    }

    obstacle.el.classList.add("obstacle--caught");

    if (obstacle.type === "save") {

        // Earning always adds the full amount - no cap needed here.
        const amount = obstacle.earnAmount;
        wallet += amount;
        earned += amount;

        spawnSparkles(obstacle.lane);
        spawnToast("+$" + amount + " earned!", "toast--save", obstacle.lane);

    } else {

        // Spending is no longer capped at what's in the wallet
        // (2026-08-27) - the wallet can go negative, so overspending is a
        // real, felt consequence instead of a free pass at $0.
        const amount = obstacle.flavor.cost;
        wallet -= amount;
        spent += amount;

        items.push({
            iconHtml: flavorListIconHtml(obstacle.flavor),
            name: obstacle.flavor.name,
            cost: amount
        });

        spawnToast("-$" + amount + " spent", "toast--spend", obstacle.lane);
    }

    updateMoney();
}

function spawnSparkles(lane) {

    // A little celebratory burst of sparkles on every earn catch -
    // makes earning feel rewarding, separate from the floating +$ toast.
    const centerLeft = COLLISION_X;
    const centerTop = LANES[lane];
    const sparkleCount = 7;

    for (let i = 0; i < sparkleCount; i++) {

        const sparkle = document.createElement("span");
        sparkle.className = "sparkle";
        sparkle.innerHTML = SPARKLE_SVG;

        const svgEl = sparkle.querySelector("svg");
        if (svgEl) {
            svgEl.style.fill =
                SPARKLE_TONES[Math.floor(Math.random() * SPARKLE_TONES.length)];
        }

        const angle = Math.random() * Math.PI * 2;
        const distance = 22 + Math.random() * 30;

        sparkle.style.left = centerLeft + "%";
        sparkle.style.top = centerTop + "%";
        sparkle.style.setProperty("--tx", (Math.cos(angle) * distance).toFixed(1) + "px");
        sparkle.style.setProperty("--ty", (Math.sin(angle) * distance).toFixed(1) + "px");
        sparkle.style.animationDelay = Math.floor(Math.random() * 90) + "ms";

        if (obstaclesLayer) {
            obstaclesLayer.appendChild(sparkle);
        }

        setTimeout(function () {
            if (sparkle.parentNode) {
                sparkle.parentNode.removeChild(sparkle);
            }
        }, 850);
    }
}

function spawnToast(text, className, lane) {

    const toast = document.createElement("div");
    toast.className = "catchToast " + className;
    toast.textContent = text;
    toast.style.top = LANES[lane] + "%";
    toast.style.left = COLLISION_X + "%";

    if (obstaclesLayer) {
        obstaclesLayer.appendChild(toast);
    }

    setTimeout(function () {
        if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
        }
    }, 900);
}


/* ================= GAME LOOP ================= */

function startGameLoop() {
    lastFrameTime = null;
    animationFrameId = requestAnimationFrame(gameLoop);
}

function stopGameLoop() {
    if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
}

function gameLoop(timestamp) {

    if (!gameRunning) {
        return;
    }

    if (lastFrameTime === null) {
        lastFrameTime = timestamp;
    }

    const dt = timestamp - lastFrameTime;
    lastFrameTime = timestamp;

    maybeSpawnObstacle(dt);
    updateObstacles(dt);
    checkRideEnd();

    if (gameRunning) {
        animationFrameId = requestAnimationFrame(gameLoop);
    }
}

function checkRideEnd() {

    if (!gameRunning) {
        return;
    }

    // The ride now runs until the wallet reaches the goal (2026-08-27),
    // even if it dips negative along the way - it's no longer over the
    // instant the wallet hits zero.
    if (selectedGoal && wallet >= selectedGoal.cost) {
        finishGame();
        return;
    }

    // Safety net only (see MAX_OBSTACLES_SAFETY above) - keeps a ride that
    // never reaches its goal from running forever.
    if (obstaclesSpawned >= MAX_OBSTACLES_SAFETY && obstacles.length === 0) {
        finishGame();
    }
}


/* ================= FINISH ================= */

function finishGame() {

    if (!gameRunning) {
        return;
    }

    gameRunning = false;
    dragging = false;
    stopGameLoop();

    setText(finalEarned, "$" + earned);
    setText(finalSpent, "$" + spent);

    updateGoalProgress();

    const finalItems = document.getElementById("finalItems");

    if (finalItems) {

        if (items.length === 0) {

            finalItems.innerHTML =
                "<span>Nothing bought this ride - it all stayed in the wallet!</span>";

        } else {

            // Group identical catches (e.g. six "Candy" hits) into one badge
            // with a count, instead of one badge per catch - keeps the
            // finish screen from growing tall on a rough ride.
            const grouped = {};

            items.forEach(function (item) {
                if (!grouped[item.name]) {
                    grouped[item.name] = {
                        iconHtml: item.iconHtml,
                        name: item.name,
                        count: 0,
                        total: 0
                    };
                }

                grouped[item.name].count++;
                grouped[item.name].total += item.cost;
            });

            finalItems.innerHTML = `
                <div class="finalItemList">
                    ${Object.values(grouped).map(function (group) {
                        const countLabel = group.count > 1 ? ` ×${group.count}` : "";
                        return `
                            <span class="finalItem">
                                ${group.iconHtml}
                                ${group.name}${countLabel}
                                ($${group.total})
                            </span>
                        `;
                    }).join("")}
                </div>
            `;
        }
    }

    const finalMessage = document.getElementById("finishSubtitle");
    const goalCompleteMessage = document.getElementById("goalCompleteMessage");

    const shortfall =
        selectedGoal
            ? Math.max(0, selectedGoal.cost - wallet)
            : 0;

    const reachedGoal =
        selectedGoal &&
        wallet >= selectedGoal.cost;

    levelResults[currentLevelIndex] = !!reachedGoal;

    const isLastLevel = currentLevelIndex === LEVELS.length - 1;

    const roundLabel = document.getElementById("roundLabel");

    if (roundLabel) {
        roundLabel.textContent =
            `Round ${currentLevelIndex + 1} of ${LEVELS.length}`;
    }

    // Messaging reframed 2026-08-26 (spending-tone pass): state the outcome
    // plainly, then show what was bought either way - a good or bad
    // outcome hinges on whether the goal was reached, not on the fact that
    // some money was spent along the way.
    if (finalMessage) {

        finalMessage.textContent = reachedGoal
            ? `You saved enough for your ${selectedGoal.name}!`
            : `You didn't save enough for your ${selectedGoal.name} this time.`;
    }

    if (goalCompleteMessage) {

        goalCompleteMessage.textContent = reachedGoal
            ? `🎉 You saved enough for your ${selectedGoal.name} - and here's what you bought along the way!`
            : `You ended with ${formatMoney(wallet)} of the $${selectedGoal.cost} you needed for your ${selectedGoal.name} - but here's what you got instead!`;
    }

    if (prizeResult) {

        let message = reachedGoal
            ? "Nice riding! Every dollar you earned added up to your goal."
            : "This ride, spending ate into more than you earned. Steer into more dollars - and fewer spend icons - next time if you want to reach your goal!";

        if (isLastLevel) {
            const roundsWon = levelResults.filter(Boolean).length;
            message += ` You completed ${roundsWon} of ${LEVELS.length} rounds!`;
        }

        prizeResult.textContent = message;
    }

    const playAgainLabel = document.getElementById("playAgainLabel");

    if (playAgainLabel) {
        playAgainLabel.textContent = isLastLevel ? "PLAY AGAIN" : "NEXT ROUND";
    }

    const finalPrizeName = document.getElementById("finalPrizeName");
    const finalPrizeCost = document.getElementById("finalPrizeCost");
    const finalPrizeIcon = document.getElementById("finalPrizeIcon");

    if (selectedGoal) {

        setText(finalPrizeName, selectedGoal.name);
        setText(finalPrizeCost, "$" + selectedGoal.cost);

        if (finalPrizeIcon) {
            finalPrizeIcon.innerHTML =
                `<span style="font-size:42px;">${selectedGoal.icon}</span>`;
        }
    }

    if (document.activeElement && document.activeElement.blur) {
        document.activeElement.blur();
    }

    if (finishScreen) {
        finishScreen.style.display = "flex";
    }

    const finishCardEl = document.querySelector(".finishCard");

    if (finishCardEl) {
        // Reset scroll every time this screen is shown - a focused button
        // held over from a previous round can otherwise auto-scroll the
        // card down, hiding the heading behind the fold.
        finishCardEl.scrollTop = 0;
    }

    if (instructions) {
        instructions.style.display = "none";
    }
}


/* ================= PLAY AGAIN / NEXT ROUND ================= */

const playAgainButton =
    document.getElementById("playAgainButton");

if (playAgainButton) {

    playAgainButton.addEventListener("click", function () {

        const isLastLevel =
            currentLevelIndex === LEVELS.length - 1;

        if (isLastLevel) {
            resetGame();
        } else {
            startNextRound();
        }
    });
}


/* ================= CLEAR OBSTACLES ================= */

function clearObstacles() {

    obstacles.forEach(function (obstacle) {
        if (obstacle.el && obstacle.el.parentNode) {
            obstacle.el.parentNode.removeChild(obstacle.el);
        }
    });

    obstacles = [];
    obstaclesSpawned = 0;
    spawnTimer = 0;
    nextSpawnDelay = randomSpawnDelay();
    obstacleQueue = buildObstacleQueue();
}


/* ================= RESET ================= */

function resetGame() {

    gameRunning = false;
    dragging = false;
    stopGameLoop();
    clearObstacles();

    wallet = STARTING_MONEY;
    spent = 0;
    earned = 0;
    items = [];

    selectedGoal = null;
    scooterY = LANES[1];

    currentLevelIndex = 0;
    levelResults = [];

    if (scooter) {
        scooter.style.top = scooterY + "%";
        scooter.style.cursor = "grab";
    }

    updateMoney();

    if (finishScreen) {
        finishScreen.style.display = "none";
    }

    if (instructions) {
        instructions.style.display = "block";
        setText(
            instructions,
            "Get ready for Round 1!"
        );
    }

    updateGoalProgress();

    if (startScreen) {
        startScreen.style.display = "flex";
    }
}


/* ================= START / ADVANCE ROUND =================
   Shared by the initial Start Riding button and the
   Next Round button on the finish screen.
=========================================================== */

function beginRide() {

    selectedGoal = LEVELS[currentLevelIndex];

    if (startScreen) {
        startScreen.style.display = "none";
    }

    if (finishScreen) {
        finishScreen.style.display = "none";
    }

    clearObstacles();

    wallet = STARTING_MONEY;
    spent = 0;
    earned = 0;
    items = [];

    scooterY = LANES[1];

    if (scooter) {
        scooter.style.top = scooterY + "%";
        scooter.style.cursor = "grab";
    }

    updateMoney();

    gameRunning = true;

    if (instructions) {
        instructions.style.display = "block";

        setText(
            instructions,
            `Round ${currentLevelIndex + 1}: save $${selectedGoal.cost} for a ${selectedGoal.name}!`
        );
    }

    startGameLoop();
}

function startNextRound() {
    currentLevelIndex++;
    beginRide();
}

if (startButton) {

    startButton.addEventListener("click", function () {
        beginRide();
    });
}


/* ================= TOP BAR RESET =================
   Persistent restart control (2026-08-27), added alongside the new
   kiosk-frame top bar - lets a kid (or Kayla, between playtests) bail
   out to the start screen from anywhere, not just after finishing a
   ride. Reuses the existing resetGame() - safe to call from any state.
=================================================== */

const resetButton = document.getElementById("resetButton");

if (resetButton) {

    resetButton.addEventListener("click", function () {
        resetGame();
    });
}


/* ================= INITIAL STATE ================= */

updateMoney();

if (startScreen) {
    startScreen.style.display = "flex";
}

if (finishScreen) {
    finishScreen.style.display = "none";
}

if (instructions) {
    instructions.style.display = "block";

    setText(
        instructions,
        "Get ready for Round 1!"
    );
}
