import { BOARD_WIDTH, BOARD_HEIGHT, FLOOR_Y, GOAL_HEIGHT, CharacterType } from './types';

export const GAME_CONFIG = {
  FPS: 60,
  MATCH_DURATION: 90, // seconds
  SUPER_METER_MAX: 100,
  SUPER_CHARGE_RATE: 0.15,
  SUPER_KICK_COST: 100,
};

// --- CUSTOMIZE SPRITES HERE ---
// Paste a URL inside the quotes to use an image.
// If JUMP or KICK is left empty (''), the IDLE image will be used as a fallback.
export const SPRITE_URLS = {
  BALL: 'https://png.pngtree.com/png-clipart/20221223/ourmid/pngtree-cartoon-soccer-ball-png-image_6534170.png', 
  
  [CharacterType.SPEEDER]: {
    IDLE: 'https://dear-emerald-mjyrnq7gvh.edgeone.app/Untitled%20design.png',
    JUMP: '',
    KICK: '',
  },
  [CharacterType.MUSCLEMAN]: {
    IDLE: '',
    JUMP: '',
    KICK: '',
  },
  [CharacterType.SHOOTER]: {
    IDLE: '',
    JUMP: '',
    KICK: '',
  },
  [CharacterType.PREDICTOR]: {
    IDLE: '',
    JUMP: '',
    KICK: '',
  },
};

export const CHARACTERS = {
  [CharacterType.SPEEDER]: {
    name: 'SPEEDER',
    ability: 'TURBO BOOST (5s)',
    desc: 'Runs extremely fast for a short duration.',
    color: '#fbbf24', // Amber
    radius: 32,
  },
  [CharacterType.MUSCLEMAN]: {
    name: 'MUSCLEMAN',
    ability: 'POWER SHOVE',
    desc: 'Stuns and pushes opponents nearby.',
    color: '#7f1d1d', // Dark Red
    radius: 40, // Bigger
  },
  [CharacterType.SHOOTER]: {
    name: 'SHOOTER',
    ability: 'SNIPER SHOT',
    desc: 'Next kick auto-aims at goal with huge power.',
    color: '#10b981', // Emerald
    radius: 35,
  },
  [CharacterType.PREDICTOR]: {
    name: 'PREDICTOR',
    ability: 'BLINK',
    desc: 'Teleports behind the ball instantly.',
    color: '#8b5cf6', // Violet
    radius: 35,
  },
};

export const KEY_MAPPINGS = {
  P1: {
    LEFT: 'a',
    RIGHT: 'd',
    JUMP: 'w',
    KICK: 'v',
    SUPER: 'b',
  },
  P2: {
    LEFT: 'ArrowLeft',
    RIGHT: 'ArrowRight',
    JUMP: 'ArrowUp',
    KICK: '/',
    SUPER: '.',
  },
};

export const COLORS = {
  P1: '#3b82f6',
  P2: '#ef4444',
  BALL: '#ffffff',
  BALL_STROKE: '#000000',
  GRASS: '#4ade80',
  GRASS_DARK: '#22c55e',
  SKY: '#0f172a',
};

// Initial Positions
export const INITIAL_STATE = {
  P1_START: { x: 200, y: FLOOR_Y },
  P2_START: { x: BOARD_WIDTH - 200, y: FLOOR_Y },
  BALL_START: { x: BOARD_WIDTH / 2, y: 300 },
};