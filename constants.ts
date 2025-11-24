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
    IDLE: "https://drive.google.com/file/d/12RartKIIjbY0qeh5Rvqiw_PY61l-7As5/preview?usp=sharing",
    JUMP: "https://drive.google.com/file/d/17TYBTlfb-RMedU3yqxeYhCbp6VBeG-nT/view?usp=sharing",
    KICK: "https://drive.google.com/file/d/1Cxq42Q4bAATHPtYy0VJfFoNDiG3AvcXx/view?usp=sharing",
  },
  [CharacterType.STONE]: {
    IDLE: "https://drive.google.com/file/d/1DCfS4McPTHkMTZL3mDJ0mX9GcyaKB3em/preview?usp=sharing",
    JUMP: "https://drive.google.com/file/d/1P5XRbfXGEbSrsCbmmqFT9jJhXhcqzaSk/view?usp=sharing",
    KICK: "https://i.postimg.cc/CMjfPb1H/Untitled-design.png",
  },
  [CharacterType.BLAZE]: {
    IDLE: "https://i.postimg.cc/7PtQ9BHW/Untitled-design-(6).png",
    JUMP: "https://i.postimg.cc/jdW3FzCs/Untitled-design-(7).png",
    KICK: "https://i.postimg.cc/qMtD58g7/Untitled-design-(8).png",
  },
  [CharacterType.SHADOW]: {
    IDLE: "https://i.postimg.cc/jjQ7cdf4/Untitled-design-(9).png",
    JUMP: "https://i.postimg.cc/yd1Sb4hF/Untitled-design-(10).png",
    KICK: "https://i.postimg.cc/pTWn6bQZ/Untitled-design-(11).png",
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
