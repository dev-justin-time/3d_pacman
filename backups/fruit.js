/**
 * @typedef {Object} Fruit
 * @property {string} emoji - The fruit or bonus emoji to display
 * @property {string} name  - The readable name for the fruit
 * @property {number} points - The score bonus this fruit awards
 */

export const FRUITS = [
  /* @tweakable Fruit & bonus emoji list for bonus awards (order: used by levels) */
 
  { emoji: "🥭", name: "Mango", points: 2500 },
  { emoji: "🍌", name: "Banana", points: 1500 },
  { emoji: "🍇", name: "Grapes", points: 2000 },
  { emoji: "🍈", name: "Pineapple", points: 1500 },
  { emoji: "🍉", name: "Watermelon", points: 1000 },
  { emoji: "🍊", name: "Orange", points: 500 },
  { emoji: "🍒", name: "Cherry", points: 100 },
  { emoji: "🍓", name: "Strawberry", points: 300 },
  { emoji: "🍊", name: "Orange", points: 500 },
  { emoji: "🍎", name: "Apple",  points: 700 },
  { emoji: "🍇", name: "Grapes", points: 1200 },
  { emoji: "🍉", name: "Watermelon", points: 1600 },
  { emoji: "🍌", name: "Banana", points: 2000 },
  { emoji: "🍍", name: "Pineapple", points: 3000 },
  { emoji: "🥝", name: "Kiwi", points: 5000 },
  { emoji: "🥥", name: "Coconut", points: 7000 },
  { emoji: "💎", name: "Gem", points: 10000 },
  { emoji: "🔔", name: "Bell", points: 15000 }
];

/* @tweakable The fruit's movement speed (units/second) */
export const FRUIT_SPEED = 1.5;

/* @tweakable How long a fruit appears on the map, in seconds */
export const FRUIT_DURATION = 15;

/* @tweakable Fade time for fruit disappearing (seconds) */
export const FRUIT_FADE_DURATION = 0.5;

/**
 * If true, a fruit will spawn ONCE per level; if false, it can respawn multiple times.
 * @type {boolean}
 * @tweakable Should fruit spawn only once per level?
 */
export const FRUIT_ONCE_PER_LEVEL = true;