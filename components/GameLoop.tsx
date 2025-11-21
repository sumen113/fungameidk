import React, { useEffect, useRef, useState, useCallback } from 'react';
import { 
  GameState, Player, Ball, Vector, Particle, GameMode, CharacterType,
  BOARD_WIDTH, BOARD_HEIGHT, GRAVITY, FRICTION, PLAYER_SPEED, JUMP_FORCE,
  KICK_FORCE, SUPER_KICK_FORCE, BALL_BOUNCE, FLOOR_Y, GOAL_HEIGHT, InputPayload
} from '../types';
import { GAME_CONFIG, KEY_MAPPINGS, COLORS, INITIAL_STATE, CHARACTERS, SPRITE_URLS } from '../constants';

interface GameLoopProps {
  mode: GameMode;
  p1Char: CharacterType;
  p2Char: CharacterType;
  onExit: () => void;
  networkConn?: any; // PeerJS connection
  isHost?: boolean;
}

export const GameLoop: React.FC<GameLoopProps> = ({ mode, p1Char, p2Char, onExit, networkConn, isHost }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);
  const keysPressed = useRef<Set<string>>(new Set());
  const remoteKeysPressed = useRef<Set<string>>(new Set()); // For Online Opponent
  
  // Asset Loading
  const spritesRef = useRef<Record<string, HTMLImageElement>>({});

  useEffect(() => {
    const loadSprite = (key: string, url: string) => {
      if (!url) return;
      const img = new Image();
      img.src = url;
      img.onload = () => { spritesRef.current[key] = img; };
    };
    
    loadSprite('BALL', SPRITE_URLS.BALL);
    
    Object.values(CharacterType).forEach(type => {
      const charSprites = SPRITE_URLS[type];
      if (charSprites) {
        loadSprite(`${type}_IDLE`, charSprites.IDLE);
        loadSprite(`${type}_JUMP`, charSprites.JUMP);
        loadSprite(`${type}_KICK`, charSprites.KICK);
      }
    });
  }, []);
  
  const gameState = useRef<GameState>({
    player1: {
      id: 1,
      character: p1Char,
      pos: { ...INITIAL_STATE.P1_START },
      vel: { x: 0, y: 0 },
      radius: CHARACTERS[p1Char].radius,
      color: CHARACTERS[p1Char].color,
      isGrounded: false,
      facingRight: true,
      score: 0,
      superMeter: 0,
      isKicking: false,
      kickTimer: 0,
      stunned: 0,
      isSuperActive: false,
      speedBuffTimer: 0,
    },
    player2: {
      id: 2,
      character: p2Char,
      pos: { ...INITIAL_STATE.P2_START },
      vel: { x: 0, y: 0 },
      radius: CHARACTERS[p2Char].radius,
      color: CHARACTERS[p2Char].color,
      isGrounded: false,
      facingRight: false,
      score: 0,
      superMeter: 0,
      isKicking: false,
      kickTimer: 0,
      stunned: 0,
      isSuperActive: false,
      speedBuffTimer: 0,
    },
    ball: {
      pos: { ...INITIAL_STATE.BALL_START },
      vel: { x: 0, y: 0 },
      radius: 20,
      rotation: 0,
    },
    particles: [],
    timeRemaining: GAME_CONFIG.MATCH_DURATION,
    isPlaying: true,
    lastScorer: 0,
    goalCelebrationTimer: 0,
  });

  const [uiState, setUiState] = useState({
    p1Score: 0,
    p2Score: 0,
    time: GAME_CONFIG.MATCH_DURATION,
    p1Super: 0,
    p2Super: 0,
    gameOver: false,
    winner: 0 as 0 | 1 | 2,
    goalMessage: false,
  });

  // Networking Listeners
  useEffect(() => {
    if (mode === GameMode.ONLINE && networkConn) {
      networkConn.on('data', (data: any) => {
        if (isHost) {
          // Host receives Inputs from Client
          if (data.type === 'INPUT') {
            const { key, isDown } = data.payload as InputPayload;
            if (isDown) remoteKeysPressed.current.add(key);
            else remoteKeysPressed.current.delete(key);
          }
        } else {
          // Client receives State from Host
          if (data.type === 'STATE') {
            // Update local state (Naive snapshot interpolation: just overwrite)
            // Preserve particles to avoid flicker or handle them separately if bandwidth allows
            // For now, overwrite everything for sync accuracy
            const incoming = data.payload;
            gameState.current.player1 = incoming.player1;
            gameState.current.player2 = incoming.player2;
            gameState.current.ball = incoming.ball;
            gameState.current.timeRemaining = incoming.timeRemaining;
            gameState.current.isPlaying = incoming.isPlaying;
            gameState.current.lastScorer = incoming.lastScorer;
            gameState.current.goalCelebrationTimer = incoming.goalCelebrationTimer;
            // Particles are visual only, maybe keep local? Or overwrite. Overwriting is easier.
            gameState.current.particles = incoming.particles;
          }
        }
      });
    }
  }, [mode, networkConn, isHost]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (mode === GameMode.ONLINE && !isHost) {
        // Client: Send input to Host
        // Translate my WASD keys to P2 keys (Arrows) for the host
        let keyToSend = null;
        const p1Keys = KEY_MAPPINGS.P1;
        const p2Keys = KEY_MAPPINGS.P2;

        if (e.key === p1Keys.LEFT) keyToSend = p2Keys.LEFT;
        else if (e.key === p1Keys.RIGHT) keyToSend = p2Keys.RIGHT;
        else if (e.key === p1Keys.JUMP) keyToSend = p2Keys.JUMP;
        else if (e.key === p1Keys.KICK) keyToSend = p2Keys.KICK;
        else if (e.key === p1Keys.SUPER) keyToSend = p2Keys.SUPER;

        if (keyToSend) {
          networkConn.send({ type: 'INPUT', payload: { key: keyToSend, isDown: true } });
        }
      } else {
        keysPressed.current.add(e.key);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (mode === GameMode.ONLINE && !isHost) {
        // Client: Send input to Host
        let keyToSend = null;
        const p1Keys = KEY_MAPPINGS.P1;
        const p2Keys = KEY_MAPPINGS.P2;

        if (e.key === p1Keys.LEFT) keyToSend = p2Keys.LEFT;
        else if (e.key === p1Keys.RIGHT) keyToSend = p2Keys.RIGHT;
        else if (e.key === p1Keys.JUMP) keyToSend = p2Keys.JUMP;
        else if (e.key === p1Keys.KICK) keyToSend = p2Keys.KICK;
        else if (e.key === p1Keys.SUPER) keyToSend = p2Keys.SUPER;

        if (keyToSend) {
          networkConn.send({ type: 'INPUT', payload: { key: keyToSend, isDown: false } });
        }
      } else {
        keysPressed.current.delete(e.key);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [mode, isHost, networkConn]);

  const update = useCallback(() => {
    // Client (Joiner) does NOT run physics. It only renders.
    if (mode === GameMode.ONLINE && !isHost) {
      // Sync UI
      setUiState(prev => ({
        ...prev,
        p1Score: gameState.current.player1.score,
        p2Score: gameState.current.player2.score,
        time: gameState.current.timeRemaining,
        p1Super: gameState.current.player1.superMeter,
        p2Super: gameState.current.player2.superMeter,
        gameOver: !gameState.current.isPlaying && gameState.current.timeRemaining <= 0,
        winner: gameState.current.player1.score > gameState.current.player2.score ? 1 : 2 // Simple calc
      }));
      return; 
    }

    // Host (or Local) runs Logic
    if (!gameState.current.isPlaying && gameState.current.goalCelebrationTimer <= 0) {
       return;
    }

    const state = gameState.current;

    // Goal Celebration
    if (state.goalCelebrationTimer > 0) {
      state.goalCelebrationTimer--;
      if (state.goalCelebrationTimer === 0) {
        resetPositions(state);
        setUiState(prev => ({ ...prev, goalMessage: false }));
      }
      animateParticles(state);
      // Broadcast State during celebration
      if (mode === GameMode.ONLINE && isHost && networkConn) {
         networkConn.send({ type: 'STATE', payload: state });
      }
      return;
    }
    
    // Timer
    if (state.timeRemaining > 0) {
      state.timeRemaining -= 1 / 60;
      if (state.timeRemaining <= 0) {
        state.timeRemaining = 0;
        endGame(state);
      }
    }

    // Players
    // P1 is always local/Host keys
    updatePlayer(state.player1, state.player2, state.ball, KEY_MAPPINGS.P1, keysPressed.current);
    
    if (mode === GameMode.PVP) {
      updatePlayer(state.player2, state.player1, state.ball, KEY_MAPPINGS.P2, keysPressed.current);
    } else if (mode === GameMode.ONLINE && isHost) {
      // P2 uses Remote Keys (which were translated to P2 keycodes by the client)
      updatePlayer(state.player2, state.player1, state.ball, KEY_MAPPINGS.P2, remoteKeysPressed.current);
    } else {
      updateAI(state.player2, state.player1, state.ball);
    }

    // Ball
    updateBall(state);

    // Particles
    animateParticles(state);

    // Network Broadcast (Host Only)
    if (mode === GameMode.ONLINE && isHost && networkConn) {
      // Throttle? 60fps is fine for local peerjs usually.
      // We strip images/functions before sending implicitly via JSON stringify inside PeerJS
      networkConn.send({ type: 'STATE', payload: state });
    }

    // UI Sync
    setUiState(prev => {
      if (Math.floor(prev.time) !== Math.floor(state.timeRemaining) ||
          prev.p1Score !== state.player1.score || 
          prev.p2Score !== state.player2.score ||
          Math.abs(prev.p1Super - state.player1.superMeter) > 1 ||
          Math.abs(prev.p2Super - state.player2.superMeter) > 1
         ) {
        return {
          ...prev,
          p1Score: state.player1.score,
          p2Score: state.player2.score,
          time: state.timeRemaining,
          p1Super: state.player1.superMeter,
          p2Super: state.player2.superMeter,
        };
      }
      return prev;
    });

  }, [mode, isHost, networkConn]);

  // --- Ability Logic ---

  const activateAbility = (p: Player, opponent: Player, ball: Ball) => {
    if (p.superMeter < GAME_CONFIG.SUPER_METER_MAX) return;

    let activated = false;

    switch (p.character) {
      case CharacterType.SPEEDER:
        // Effect: 5 seconds of 1.5x speed
        p.speedBuffTimer = 300; // 5s * 60
        activated = true;
        createExplosion(gameState.current, p.pos, '#fbbf24', 20);
        break;

      case CharacterType.MUSCLEMAN:
        // Effect: Stun opponent if close
        const dist = Math.hypot(opponent.pos.x - p.pos.x, opponent.pos.y - p.pos.y);
        if (dist < 200) { // Range check
           opponent.stunned = 120; // 2 seconds stun
           opponent.vel.x = p.facingRight ? 25 : -25; // Huge knockback
           opponent.vel.y = -10;
           opponent.isGrounded = false;
           createExplosion(gameState.current, opponent.pos, '#ef4444', 30);
           activated = true;
        }
        break;

      case CharacterType.PREDICTOR:
        // Effect: Teleport behind ball
        const targetGoalX = p.id === 1 ? BOARD_WIDTH : 0;
        const directionToGoal = targetGoalX > ball.pos.x ? 1 : -1;
        
        p.pos.x = ball.pos.x - (directionToGoal * 40);
        p.pos.y = Math.min(ball.pos.y, FLOOR_Y - p.radius); 
        p.vel.x = 0;
        p.vel.y = 0;
        p.facingRight = directionToGoal > 0;
        createExplosion(gameState.current, p.pos, '#8b5cf6', 20);
        activated = true;
        break;

      case CharacterType.SHOOTER:
        // Effect: Buff next kick (Handled in collision logic)
        p.isSuperActive = true;
        activated = true;
        break;
    }

    if (activated) {
      p.superMeter = 0;
    }
  };


  const updatePlayer = (player: Player, opponent: Player, ball: Ball, keys: any, inputSource: Set<string>) => {
    if (player.stunned > 0) {
      player.stunned--;
      player.vel.x *= 0.9;
      applyGravity(player);
      applyVelocity(player);
      checkBoundaries(player);
      return;
    }

    let moveSpeed = PLAYER_SPEED;
    if (player.speedBuffTimer > 0) {
      player.speedBuffTimer--;
      moveSpeed = PLAYER_SPEED * 1.6;
      if (player.speedBuffTimer % 5 === 0) {
         gameState.current.particles.push({
             pos: { ...player.pos },
             vel: { x: 0, y: 0 },
             life: 0.5,
             color: 'rgba(251, 191, 36, 0.3)',
             size: player.radius
         });
      }
    }

    if (player.kickTimer > 0) {
        player.kickTimer--;
    } else {
        player.isKicking = false;
    }

    if (inputSource.has(keys.LEFT)) {
      player.vel.x = -moveSpeed;
      player.facingRight = false;
    } else if (inputSource.has(keys.RIGHT)) {
      player.vel.x = moveSpeed;
      player.facingRight = true;
    } else {
      player.vel.x = 0;
    }

    if (inputSource.has(keys.JUMP) && player.isGrounded) {
      player.vel.y = JUMP_FORCE;
      player.isGrounded = false;
    }

    const pressKick = inputSource.has(keys.KICK);
    const pressSuper = inputSource.has(keys.SUPER);

    if (player.kickTimer === 0) {
       if (pressSuper && player.superMeter >= GAME_CONFIG.SUPER_METER_MAX) {
         player.kickTimer = 30; 
         activateAbility(player, opponent, ball);
       } else if (pressKick) {
         player.kickTimer = 30;
       }
    }
    
    player.isKicking = player.kickTimer > 15;

    applyGravity(player);
    applyVelocity(player);
    checkBoundaries(player);

    player.superMeter = Math.min(player.superMeter + GAME_CONFIG.SUPER_CHARGE_RATE, GAME_CONFIG.SUPER_METER_MAX);
  };

  const updateAI = (ai: Player, opponent: Player, ball: Ball) => {
    if (ai.stunned > 0) {
      ai.stunned--;
      applyGravity(ai);
      applyVelocity(ai);
      checkBoundaries(ai);
      return;
    }

    let moveSpeed = PLAYER_SPEED;
    if (ai.speedBuffTimer > 0) {
      ai.speedBuffTimer--;
      moveSpeed *= 1.6;
    }

    if (ai.kickTimer > 0) {
      ai.kickTimer--;
    } else {
      ai.isKicking = false;
    }

    const isP2 = ai.id === 2;
    const attackDir = isP2 ? -1 : 1; 
    
    const lookAhead = 5;
    const futureBallX = ball.pos.x + ball.vel.x * lookAhead;
    
    const idealOffsetX = -attackDir * 45; 
    let targetX = futureBallX + idealOffsetX;

    const ballIsBehind = isP2 ? (ball.pos.x > ai.pos.x) : (ball.pos.x < ai.pos.x);
    
    if (ballIsBehind) {
       targetX = ball.pos.x + (idealOffsetX * 1.5);
    }

    const distToTarget = targetX - ai.pos.x;
    const distToBall = Math.hypot(ball.pos.x - ai.pos.x, ball.pos.y - ai.pos.y);

    if (Math.abs(distToTarget) > 15) {
      ai.vel.x = distToTarget > 0 ? moveSpeed : -moveSpeed;
      
      if (distToBall < 150) {
         ai.facingRight = (ball.pos.x - ai.pos.x) > 0;
      } else {
         ai.facingRight = ai.vel.x > 0;
      }
    } else {
      ai.vel.x = 0;
      ai.facingRight = (ball.pos.x - ai.pos.x) > 0;
    }

    const ballAbove = (ai.pos.y - ball.pos.y); 
    
    if (ai.isGrounded) {
       if (ballAbove > 50 && Math.abs(ball.pos.x - ai.pos.x) < 60) {
          ai.vel.y = JUMP_FORCE / 1.5;
          ai.isGrounded = false;
       }
       else if (!ballIsBehind && ballAbove > 20 && ballAbove < 100 && Math.abs(ball.pos.x - ai.pos.x) < 60) {
          if (Math.random() < 0.1) { 
             ai.vel.y = JUMP_FORCE / 1.3;
             ai.isGrounded = false;
          }
       }
    }

    if (ai.kickTimer === 0) {
       if (ai.superMeter >= GAME_CONFIG.SUPER_METER_MAX) {
          if (ai.character === CharacterType.MUSCLEMAN && distToBall < 200) {
             activateAbility(ai, opponent, ball);
             ai.kickTimer = 30;
          } else if (ai.character === CharacterType.PREDICTOR && Math.abs(ball.pos.x - ai.pos.x) > 300) {
             activateAbility(ai, opponent, ball);
             ai.kickTimer = 30;
          } else if (ai.character === CharacterType.SPEEDER && Math.abs(ball.pos.x - ai.pos.x) > 250) {
             activateAbility(ai, opponent, ball);
             ai.kickTimer = 30;
          } else if (ai.character === CharacterType.SHOOTER && distToBall < 100) {
             activateAbility(ai, opponent, ball);
          }
       }

       const kickRange = ai.radius + ball.radius + 35;
       
       if (distToBall < kickRange) {
          const facingDir = ai.facingRight ? 1 : -1;
          const ballDir = (ball.pos.x - ai.pos.x) > 0 ? 1 : -1;
          
          if (facingDir === ballDir || distToBall < ai.radius) {
             if (Math.random() < 0.2) {
                ai.kickTimer = 30;
             }
          }
       }
    }

    ai.isKicking = ai.kickTimer > 15;

    applyGravity(ai);
    applyVelocity(ai);
    checkBoundaries(ai);
    
    ai.superMeter = Math.min(ai.superMeter + GAME_CONFIG.SUPER_CHARGE_RATE, GAME_CONFIG.SUPER_METER_MAX);
  };

  const updateBall = (state: GameState) => {
    const { ball, player1, player2 } = state;

    applyGravity(ball);
    ball.vel.x *= FRICTION;
    
    ball.pos.x += ball.vel.x;
    ball.pos.y += ball.vel.y;
    ball.rotation += ball.vel.x * 0.05;

    if (ball.pos.y + ball.radius >= FLOOR_Y) {
      ball.pos.y = FLOOR_Y - ball.radius;
      ball.vel.y *= -BALL_BOUNCE;
      if (Math.abs(ball.vel.y) < 1) ball.vel.y = 0;
    }
    if (ball.pos.y - ball.radius <= 0) {
      ball.pos.y = ball.radius;
      ball.vel.y *= -BALL_BOUNCE;
    }

    if (ball.pos.x < 0) {
       if (ball.pos.y > BOARD_HEIGHT - GOAL_HEIGHT) {
         scoreGoal(state, 2);
         return;
       } else {
         ball.pos.x = ball.radius;
         ball.vel.x *= -BALL_BOUNCE;
       }
    }
    if (ball.pos.x > BOARD_WIDTH) {
       if (ball.pos.y > BOARD_HEIGHT - GOAL_HEIGHT) {
         scoreGoal(state, 1);
         return;
       } else {
         ball.pos.x = BOARD_WIDTH - ball.radius;
         ball.vel.x *= -BALL_BOUNCE;
       }
    }

    checkPlayerBallCollision(player1, ball);
    checkPlayerBallCollision(player2, ball);
  };

  const checkPlayerBallCollision = (p: Player, b: Ball) => {
    if (!p.isKicking && !p.isSuperActive) return;

    let dx = b.pos.x - p.pos.x;
    let dy = b.pos.y - p.pos.y;
    let dist = Math.sqrt(dx*dx + dy*dy);
    
    if (dist < 0.1) { dx = p.facingRight ? 1 : -1; dy = -1; dist = 1; }
    
    const kickReach = 25; 
    const minDist = p.radius + b.radius + kickReach;

    if (dist < minDist) {
      const nx = dx / dist;
      const ny = dy / dist;

      const overlap = minDist - dist;
      b.pos.x += nx * overlap;
      b.pos.y += ny * overlap;

      if (p.character === CharacterType.SHOOTER && p.isSuperActive) {
          p.isSuperActive = false;
          p.superMeter = 0;

          const goalX = p.id === 1 ? BOARD_WIDTH : 0;
          const goalY = BOARD_HEIGHT - (GOAL_HEIGHT / 2);
          
          const gx = goalX - b.pos.x;
          const gy = goalY - b.pos.y;
          const gDist = Math.hypot(gx, gy);
          
          b.vel.x = (gx / gDist) * 45;
          b.vel.y = (gy / gDist) * 45;

          createExplosion(gameState.current, b.pos, '#10b981', 40);
          return;
      }

      let forceSpeed = Math.max(Math.abs(p.vel.x) * 1.5, Math.abs(p.vel.y) * 1.5, KICK_FORCE);
      if (p.character === CharacterType.MUSCLEMAN) forceSpeed *= 1.2;

      b.vel.x = nx * forceSpeed;
      
      if (p.isGrounded && ny < 0) {
         b.vel.y = (ny * 0.3) * forceSpeed; 
      } else {
         b.vel.y = ny * forceSpeed - 1;
      }

      const currentSpeed = Math.hypot(b.vel.x, b.vel.y);
      const max = 30; 
      if (currentSpeed > max) {
        b.vel.x = (b.vel.x / currentSpeed) * max;
        b.vel.y = (b.vel.y / currentSpeed) * max;
      }
      
      createExplosion(gameState.current, b.pos, '#ffffff', 5);
    }
  };

  const applyGravity = (entity: Player | Ball) => {
    entity.vel.y += GRAVITY;
  };

  const applyVelocity = (entity: Player) => {
    entity.pos.x += entity.vel.x;
    entity.pos.y += entity.vel.y;
  };

  const checkBoundaries = (p: Player) => {
    if (p.pos.y + p.radius > FLOOR_Y) {
      p.pos.y = FLOOR_Y - p.radius;
      p.vel.y = 0;
      p.isGrounded = true;
    }
    if (p.pos.x - p.radius < 0) {
      p.pos.x = p.radius;
      p.vel.x = 0;
    }
    if (p.pos.x + p.radius > BOARD_WIDTH) {
      p.pos.x = BOARD_WIDTH - p.radius;
      p.vel.x = 0;
    }
  };

  const scoreGoal = (state: GameState, scorerId: 1 | 2) => {
    if (scorerId === 1) state.player1.score++;
    else state.player2.score++;
    
    state.lastScorer = scorerId;
    state.goalCelebrationTimer = 120;
    setUiState(prev => ({ ...prev, goalMessage: true }));
    
    createExplosion(state, state.ball.pos, scorerId === 1 ? COLORS.P1 : COLORS.P2, 50);
  };

  const resetPositions = (state: GameState) => {
    state.player1.pos = { ...INITIAL_STATE.P1_START };
    state.player1.vel = { x: 0, y: 0 };
    state.player1.kickTimer = 0;
    state.player1.isSuperActive = false;
    state.player1.speedBuffTimer = 0;
    state.player1.stunned = 0;
    
    state.player2.pos = { ...INITIAL_STATE.P2_START };
    state.player2.vel = { x: 0, y: 0 };
    state.player2.kickTimer = 0;
    state.player2.isSuperActive = false;
    state.player2.speedBuffTimer = 0;
    state.player2.stunned = 0;

    state.ball.pos = { ...INITIAL_STATE.BALL_START };
    state.ball.vel = { x: 0, y: 0 };
  };

  const endGame = (state: GameState) => {
    state.isPlaying = false;
    let winner: 0 | 1 | 2 = 0;
    if (state.player1.score > state.player2.score) winner = 1;
    else if (state.player2.score > state.player1.score) winner = 2;
    setUiState(prev => ({ ...prev, gameOver: true, winner }));
  };

  const createExplosion = (state: GameState, pos: Vector, color: string, count: number) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 10 + 2;
      state.particles.push({
        pos: { ...pos },
        vel: { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed },
        life: 1.0,
        color: color,
        size: Math.random() * 5 + 2,
      });
    }
  };

  const animateParticles = (state: GameState) => {
    for (let i = state.particles.length - 1; i >= 0; i--) {
      const p = state.particles[i];
      p.pos.x += p.vel.x;
      p.pos.y += p.vel.y;
      p.vel.y += 0.2;
      p.life -= 0.02;
      if (p.life <= 0) state.particles.splice(i, 1);
    }
  };

  const draw = useCallback((ctx: CanvasRenderingContext2D) => {
    const state = gameState.current;

    ctx.clearRect(0, 0, BOARD_WIDTH, BOARD_HEIGHT);

    // Sky
    const grad = ctx.createLinearGradient(0, 0, 0, BOARD_HEIGHT);
    grad.addColorStop(0, COLORS.SKY);
    grad.addColorStop(1, '#1e293b');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, BOARD_WIDTH, BOARD_HEIGHT);

    // Stands
    ctx.fillStyle = '#334155';
    ctx.fillRect(0, BOARD_HEIGHT - 250, BOARD_WIDTH, 150);
    
    // Grass
    ctx.fillStyle = COLORS.GRASS;
    ctx.fillRect(0, FLOOR_Y, BOARD_WIDTH, BOARD_HEIGHT - FLOOR_Y);
    ctx.fillStyle = COLORS.GRASS_DARK;
    for (let i = 0; i < BOARD_WIDTH; i+=100) {
        ctx.fillRect(i, FLOOR_Y, 50, BOARD_HEIGHT - FLOOR_Y);
    }

    // Goals
    const drawGoal = (x: number, isLeft: boolean) => {
       const topY = BOARD_HEIGHT - GOAL_HEIGHT;
       const bottomY = FLOOR_Y;
       const depth = 60; 
       const dir = isLeft ? 1 : -1;
       const backX = x + (dir * depth);

       ctx.save();
       
       // 1. Net Mesh (The back of the goal)
       ctx.beginPath();
       // Clip to the goal side shape
       ctx.moveTo(x, topY);
       ctx.lineTo(backX, topY + 15);
       ctx.lineTo(backX, bottomY);
       ctx.lineTo(x, bottomY);
       ctx.closePath();
       ctx.clip();

       // Draw Net Pattern (Diamond Mesh)
       ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
       ctx.lineWidth = 2;
       ctx.beginPath();
       
       const spacing = 15;
       // Diagonal lines criss-crossing
       for (let i = -1000; i < 1000; i += spacing) {
          // Diagonal /
          ctx.moveTo(x + (dir * i), topY - 500);
          ctx.lineTo(x + (dir * (i - 300)), bottomY + 500);
          // Diagonal \
          ctx.moveTo(x + (dir * i), topY - 500);
          ctx.lineTo(x + (dir * (i + 300)), bottomY + 500);
       }
       ctx.stroke();
       
       ctx.restore();

       // 2. Frame Structure
       ctx.strokeStyle = '#cbd5e1';
       ctx.lineWidth = 6;
       ctx.lineCap = 'round';
       ctx.lineJoin = 'round';
       ctx.beginPath();
       // Front Post (The Goal Line)
       ctx.moveTo(x, bottomY);
       ctx.lineTo(x, topY);
       // Top Side Bar
       ctx.lineTo(backX, topY + 15);
       // Back Post
       ctx.lineTo(backX, bottomY);
       // Bottom Side Bar
       ctx.lineTo(x, bottomY);
       ctx.stroke();
    };

    drawGoal(0, true);
    drawGoal(BOARD_WIDTH, false);

    // Players
    const drawPlayer = (p: Player) => {
      ctx.save();
      ctx.translate(p.pos.x, p.pos.y);
      if (!p.facingRight) ctx.scale(-1, 1);

      if (p.stunned > 0) {
          ctx.rotate((Math.random() - 0.5) * 0.2);
          ctx.globalAlpha = 0.7;
      }

      // Select Sprite Based on State
      const idleSprite = spritesRef.current[`${p.character}_IDLE`];
      const jumpSprite = spritesRef.current[`${p.character}_JUMP`];
      const kickSprite = spritesRef.current[`${p.character}_KICK`];

      let activeSprite = idleSprite;
      let isCustomActionSprite = false;

      if (p.isKicking && kickSprite) {
        activeSprite = kickSprite;
        isCustomActionSprite = true;
      } else if (!p.isGrounded && jumpSprite) {
        activeSprite = jumpSprite;
        isCustomActionSprite = true;
      }

      if (activeSprite) {
        // Draw Sprite
        const size = p.radius * 2.5;
        
        if (p.isKicking && !isCustomActionSprite) {
           ctx.rotate(-0.4);
        }
        
        ctx.drawImage(activeSprite, -size/2, -size/2, size, size);

        // Ability Glow
        if (p.speedBuffTimer > 0 || p.isSuperActive) {
          ctx.shadowColor = p.color;
          ctx.shadowBlur = 20;
          ctx.globalCompositeOperation = 'source-atop';
          ctx.strokeStyle = 'rgba(255,255,255,0.5)';
          ctx.lineWidth = 3;
          ctx.strokeRect(-size/2, -size/2, size, size);
          ctx.globalCompositeOperation = 'source-over';
        }
      } else {
        // Default Vector Drawing
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
        ctx.fill();
        
        if (p.speedBuffTimer > 0 || p.isSuperActive) {
          ctx.shadowColor = p.color;
          ctx.shadowBlur = 20;
          ctx.strokeStyle = 'white';
          ctx.lineWidth = 4;
          ctx.stroke();
        } else {
          ctx.lineWidth = 3;
          ctx.strokeStyle = 'white';
          ctx.stroke();
        }
        ctx.shadowBlur = 0;

        // Face
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(12, -5, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(14, -5, 4, 0, Math.PI * 2);
        ctx.fill();

        // Foot
        const footOffset = p.isKicking ? p.radius + 5 : 10; 
        const footY = p.isKicking ? 0 : 20;
        const footRot = p.isKicking ? -0.6 : 0; 
        
        ctx.save();
        ctx.translate(footOffset, footY);
        ctx.rotate(footRot);
        ctx.fillStyle = '#0f172a'; 
        ctx.beginPath();
        ctx.ellipse(0, 0, 15, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      ctx.restore();
      ctx.globalAlpha = 1;

      // Stun Stars
      if (p.stunned > 0) {
        ctx.save();
        ctx.translate(p.pos.x, p.pos.y - p.radius - 20);
        ctx.fillStyle = 'yellow';
        for(let k=0; k<3; k++) {
           ctx.beginPath();
           ctx.arc(Math.sin(Date.now()/100 + k)*20, 0, 5, 0, Math.PI*2);
           ctx.fill();
        }
        ctx.restore();
      }
    };

    drawPlayer(state.player1);
    drawPlayer(state.player2);

    // Ball
    const b = state.ball;
    ctx.save();
    ctx.translate(b.pos.x, b.pos.y);
    ctx.rotate(b.rotation);
    
    const ballSprite = spritesRef.current['BALL'];
    if (ballSprite) {
        const size = b.radius * 2.1;
        ctx.drawImage(ballSprite, -size/2, -size/2, size, size);
    } else {
        ctx.fillStyle = COLORS.BALL;
        ctx.beginPath();
        ctx.arc(0, 0, b.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = COLORS.BALL_STROKE;
        ctx.stroke();
        
        // Ball Pattern
        ctx.fillStyle = 'black';
        ctx.beginPath(); ctx.arc(0, 0, 5, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(12, 0, 4, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(-12, 0, 4, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(0, 12, 4, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(0, -12, 4, 0, Math.PI*2); ctx.fill();
    }
    ctx.restore();

    // Particles
    state.particles.forEach(p => {
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.pos.x, p.pos.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1.0;

  }, []);

  const tick = useCallback(() => {
    update();
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) draw(ctx);
    }
    requestRef.current = requestAnimationFrame(tick);
  }, [update, draw]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(tick);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [tick]);

  return (
    <div className="relative w-full h-screen flex justify-center items-center bg-gray-900">
      <canvas
        ref={canvasRef}
        width={BOARD_WIDTH}
        height={BOARD_HEIGHT}
        className="w-full max-w-[1280px] max-h-full shadow-2xl border-4 border-gray-700 rounded-lg"
      />

      <div className="absolute top-0 w-full max-w-[1280px] p-6 flex justify-between items-start pointer-events-none">
        {/* P1 UI */}
        <div className="flex flex-col items-start w-64">
          <div className="flex items-center gap-4">
            <div 
                className="w-16 h-16 rounded-full border-4 border-white flex items-center justify-center shadow-lg relative overflow-hidden"
                style={{ backgroundColor: CHARACTERS[p1Char].color }}
            >
              {spritesRef.current[`${p1Char}_IDLE`] ? 
                <img src={spritesRef.current[`${p1Char}_IDLE`].src} className="w-full h-full object-cover" alt="P1" /> : 
                <span className="font-arcade text-2xl text-white relative z-10">P1</span>
              }
            </div>
            <div className="flex flex-col">
              <span className="font-arcade text-4xl text-white drop-shadow-md">{uiState.p1Score}</span>
              <span className="text-xs text-gray-300">{CHARACTERS[p1Char].name}</span>
            </div>
          </div>
          <div className="w-full h-4 mt-2 bg-gray-800 rounded-full overflow-hidden border border-gray-600 relative">
            <div 
              className="h-full transition-all duration-100 absolute left-0 top-0"
              style={{ width: `${uiState.p1Super}%`, backgroundColor: CHARACTERS[p1Char].color }}
            />
          </div>
          {uiState.p1Super >= 100 && <div className="text-yellow-300 text-xs font-bold animate-pulse mt-1">ABILITY READY (B)</div>}
        </div>

        {/* Timer */}
        <div className="bg-gray-800/80 px-6 py-2 rounded-b-xl border-b-4 border-gray-600 backdrop-blur-sm">
          <span className={`font-arcade text-4xl ${uiState.time < 10 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
            {Math.floor(uiState.time)}
          </span>
        </div>

        {/* P2 UI */}
        <div className="flex flex-col items-end w-64">
          <div className="flex items-center gap-4 flex-row-reverse">
            <div 
                className="w-16 h-16 rounded-full border-4 border-white flex items-center justify-center shadow-lg overflow-hidden"
                style={{ backgroundColor: CHARACTERS[p2Char].color }}
            >
               {spritesRef.current[`${p2Char}_IDLE`] ? 
                <img src={spritesRef.current[`${p2Char}_IDLE`].src} className="w-full h-full object-cover" alt="P2" /> : 
                <span className="font-arcade text-2xl text-white relative z-10">{mode === GameMode.PVP || mode === GameMode.ONLINE ? 'P2' : 'CPU'}</span>
              }
            </div>
            <div className="flex flex-col items-end">
               <span className="font-arcade text-4xl text-white drop-shadow-md">{uiState.p2Score}</span>
               <span className="text-xs text-gray-300">{CHARACTERS[p2Char].name}</span>
            </div>
          </div>
          <div className="w-full h-4 mt-2 bg-gray-800 rounded-full overflow-hidden border border-gray-600 relative">
            <div 
              className="h-full transition-all duration-100 absolute left-0 top-0"
              style={{ width: `${uiState.p2Super}%`, backgroundColor: CHARACTERS[p2Char].color }}
            />
          </div>
          {uiState.p2Super >= 100 && <div className="text-yellow-300 text-xs font-bold animate-pulse mt-1 text-right">ABILITY READY ({mode === GameMode.PVP || mode === GameMode.ONLINE ? 'L' : 'AUTO'})</div>}
        </div>
      </div>

      {/* Overlays */}
      {uiState.goalMessage && !uiState.gameOver && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <h1 className="font-arcade text-8xl text-yellow-400 drop-shadow-[0_10px_10px_rgba(0,0,0,0.8)] animate-bounce">
                GOAL!
            </h1>
        </div>
      )}

      {uiState.gameOver && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-800 border-4 border-gray-600 p-8 rounded-2xl text-center max-w-md w-full shadow-[0_0_50px_rgba(0,0,0,0.5)]">
             <h2 className="font-arcade text-5xl text-white mb-6">
                {uiState.winner === 0 ? 'DRAW!' : `PLAYER ${uiState.winner} WINS!`}
             </h2>
             <div className="text-2xl text-gray-300 mb-8 font-bold">
                {uiState.p1Score} - {uiState.p2Score}
             </div>
             <button 
               onClick={onExit}
               className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-arcade text-xl rounded-lg transition-transform hover:scale-105 active:scale-95 border-b-4 border-blue-800"
             >
                BACK TO MENU
             </button>
          </div>
        </div>
      )}
      
      <div className="absolute bottom-4 left-0 right-0 text-center text-gray-500 text-xs pointer-events-none">
        {mode === GameMode.ONLINE ? (
            isHost ? 
            'YOU ARE P1 (WASD Move/Jump | V Shoot | B Ability)' : 
            'YOU ARE P2 (WASD Move/Jump | V Shoot | B Ability)'
        ) : (
            'P1: WASD Move/Jump | V Shoot | B Ability  //  P2: Arrows Move/Jump | K Shoot | L Ability'
        )}
      </div>
    </div>
  );
};