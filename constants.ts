import {
  BOARD_WIDTH,
  BOARD_HEIGHT,
  FLOOR_Y,
  GOAL_HEIGHT,
  CharacterType,
} from "./types";

export const GAME_CONFIG = {
  FPS: 60,
  MATCH_DURATION: 90,
  SUPER_METER_MAX: 100,
  SUPER_CHARGE_RATE: 0.15,
  SUPER_KICK_COST: 100,
};

export const SPRITE_URLS = {
  BALL: "https://png.pngtree.com/png-clipart/20221223/ourmid/pngtree-cartoon-soccer-ball-png-image_6534170.png",

  [CharacterType.BOLT]: {
    IDLE: "https://ik.imagekit.io/sumenn/4.png",
    JUMP: "https://ik.imagekit.io/sumenn/5.png",
    KICK: "https://ik.imagekit.io/sumenn/6.png",
  },
  [CharacterType.STONE]: {
    IDLE: "https://ik.imagekit.io/sumenn/1.png",
    JUMP: "https://ik.imagekit.io/sumenn/2.png",
    KICK: "https://ik.imagekit.io/sumenn/3.png",
  },
  [CharacterType.BLAZE]: {
    IDLE: "https://ik.imagekit.io/sumenn/7.png",
    JUMP: "https://ik.imagekit.io/sumenn/8.png",
    KICK: "https://ik.imagekit.io/sumenn/9.png",
  },
  [CharacterType.SHADOW]: {
    IDLE: "https://ik.imagekit.io/sumenn/10.png",
    JUMP: "https://ik.imagekit.io/sumenn/11.png",
    KICK: "https://ik.imagekit.io/sumenn/12.png",
  },
};

export const CHARACTERS = {
  [CharacterType.BOLT]: {
    name: "BOLT",
    ability: "Boost",
    desc: "goes pretty fast for 5 seconds",
    color: "#fbbf24",
    radius: 32,
  },
  [CharacterType.STONE]: {
    name: "STONE",
    ability: "Shove",
    desc: "pushes opponent",
    color: "#808080",
    radius: 40,
  },
  [CharacterType.BLAZE]: {
    name: "BLAZE",
    ability: "Snipe",
    desc: "shoots better for next shot",
    color: "#eb6734",
    radius: 35,
  },
  [CharacterType.SHADOW]: {
    name: "SHADOW",
    ability: "Blink",
    desc: "teleports to ball",
    color: "#1f1f1f",
    radius: 35,
  },
};

export const KEY_MAPPINGS = {
  P1: {
    LEFT: "a",
    RIGHT: "d",
    JUMP: "w",
    KICK: "v",
    SUPER: "b",
  },
  P2: {
    LEFT: "ArrowLeft",
    RIGHT: "ArrowRight",
    JUMP: "ArrowUp",
    KICK: "/",
    SUPER: ".",
  },
};

export const COLORS = {
  P1: "#3b82f6",
  P2: "#ef4444",
  BALL: "#ffffff",
  BALL_STROKE: "#000000",
  GRASS: "#4ade80",
  GRASS_DARK: "#22c55e",
  SKY: "#0f172a",
};

export const INITIAL_STATE = {
  P1_START: { x: 200, y: FLOOR_Y },
  P2_START: { x: BOARD_WIDTH - 200, y: FLOOR_Y },
  BALL_START: { x: BOARD_WIDTH / 2, y: 300 },
};
