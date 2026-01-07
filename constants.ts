import { Point } from './types';

// Grid Configuration
export const GRID_SIZE = 25; // 25x25 grid
export const INITIAL_SPEED = 130; // ms per tick - starting slower to allow progression
export const SPEED_DECREMENT = 10; // ms faster per threshold
export const FOOD_THRESHOLD = 5; // Speed up every 5 foods
export const MIN_SPEED = 40;

// Colors matching the Cyberpunk vibe
export const COLOR_SNAKE_HEAD = '#39ff14'; // Neon Green
export const COLOR_SNAKE_BODY = '#2cb01a'; // Darker Neon Green
export const COLOR_FOOD = '#ff00ff'; // Neon Pink
export const COLOR_GRID_BORDER = '#1a1a1a';

// Key mappings
export const KEYS = {
  UP: ['ArrowUp', 'w', 'W'],
  DOWN: ['ArrowDown', 's', 'S'],
  LEFT: ['ArrowLeft', 'a', 'A'],
  RIGHT: ['ArrowRight', 'd', 'D'],
};

export const INITIAL_SNAKE: Point[] = [
  { x: 10, y: 10 },
  { x: 10, y: 11 },
  { x: 10, y: 12 },
];

export const INITIAL_DIRECTION: Point = { x: 0, y: -1 }; // Moving UP