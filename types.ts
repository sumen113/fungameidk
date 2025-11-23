export enum GameMode {
  MENU = "MENU",
  PVE = "PVE",
  PVP = "PVP",
  ONLINE = "ONLINE",
}

export enum CharacterType {
  BOLT = "BOLT",
  STONE = "STONE",
  BLAZE = "BLAZE",
  SHADOW = "SHADOW",
}

export interface Vector {
  x: number;
  y: number;
}

export interface Player {
  id: 1 | 2;
  character: CharacterType;
  pos: Vector;
  vel: Vector;
  radius: number;
  color: string;
  isGrounded: boolean;
  facingRight: boolean;
  score: number;
  superMeter: number;
  isKicking: boolean;
  kickTimer: number;
  stunned: number;
  isSuperActive: boolean;
  speedBuffTimer: number;
}

export interface Ball {
  pos: Vector;
  vel: Vector;
  radius: number;
  rotation: number;
}

export interface Particle {
  pos: Vector;
  vel: Vector;
  life: number;
  color: string;
  size: number;
}

export interface GameState {
  player1: Player;
  player2: Player;
  ball: Ball;
  particles: Particle[];
  timeRemaining: number;
  isPlaying: boolean;
  lastScorer: 0 | 1 | 2;
  goalCelebrationTimer: number;
}

export const BOARD_WIDTH = 1280;
export const BOARD_HEIGHT = 720;
export const GRAVITY = 0.5;
export const FRICTION = 0.98;
export const PLAYER_SPEED = 6;
export const JUMP_FORCE = -14;
export const KICK_FORCE = 18;
export const SUPER_KICK_FORCE = 28;
export const BALL_BOUNCE = 0.8;
export const FLOOR_Y = 620;
export const GOAL_HEIGHT = 300;

// Network Types
export interface NetworkPacket {
  type: "STATE" | "INPUT" | "HANDSHAKE" | "START";
  payload: any;
}

export interface InputPayload {
  key: string;
  isDown: boolean;
}
