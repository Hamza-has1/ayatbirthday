import React, { useEffect, useRef, useState } from 'react';
import { Gift, Cpu, Zap, Trophy, Play, RotateCcw } from 'lucide-react';
import { HighScores } from '../types';
import { soundEngine } from '../utils/soundEngine';

type GameId = 'catcher' | 'memory' | 'burst';

interface GamesArcadeProps {
  highScores: HighScores;
  onUpdateScore: (game: keyof HighScores, score: number) => void;
}

/* ==================== GAME 1: COSMIC GIFT CATCHER ==================== */
const GiftCatcherGame: React.FC<{ best: number; onScore: (s: number) => void }> = ({ best, onScore }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [playing, setPlaying] = useState(false);
  const [hud, setHud] = useState({ score: 0, lives: 3, streak: 0 });
  const playingRef = useRef(false);
  const scoreCbRef = useRef(onScore);
  scoreCbRef.current = onScore;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = 340;
    let height = 280;
    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      width = parent.clientWidth;
      height = parent.clientHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    const ro = new ResizeObserver(resize);
    if (canvas.parentElement) ro.observe(canvas.parentElement);
    resize();

    let playerX = width / 2;
    let targetX = width / 2;
    let score = 0;
    let lives = 3;
    let streak = 0;
    let spawnTimer = 0;

    interface FallingItem {
      x: number;
      y: number;
      vy: number;
      r: number;
      kind: 'gift' | 'star' | 'meteor';
    }
    interface Spark {
      x: number;
      y: number;
      vx: number;
      vy: number;
      life: number;
      color: string;
    }
    const items: FallingItem[] = [];
    const sparks: Spark[] = [];

    const keys = { left: false, right: false };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a') keys.left = true;
      if (e.key === 'ArrowRight' || e.key === 'd') keys.right = true;
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a') keys.left = false;
      if (e.key === 'ArrowRight' || e.key === 'd') keys.right = false;
    };

    const setPointerPos = (clientX: number) => {
      const rect = canvas.getBoundingClientRect();
      targetX = Math.max(28, Math.min(width - 28, clientX - rect.left));
    };

    const onPointerDown = (e: PointerEvent) => setPointerPos(e.clientX);
    const onPointerMove = (e: PointerEvent) => {
      if (e.buttons > 0 || e.pointerType === 'touch' || e.pointerType === 'mouse') {
        setPointerPos(e.clientX);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);

    let lastTime = performance.now();
    let rafId = 0;

    const loop = (now: number) => {
      rafId = requestAnimationFrame(loop);
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      ctx.clearRect(0, 0, width, height);

      // Background subtle grid
      ctx.strokeStyle = 'rgba(94, 234, 212, 0.06)';
      ctx.lineWidth = 1;
      for (let x = 0; x < width; x += 36) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }

      if (!playingRef.current) return;

      if (keys.left) targetX -= 360 * dt;
      if (keys.right) targetX += 360 * dt;
      targetX = Math.max(28, Math.min(width - 28, targetX));
      playerX += (targetX - playerX) * Math.min(1, dt * 16);

      spawnTimer -= dt;
      if (spawnTimer <= 0) {
        const roll = Math.random();
        const kind: FallingItem['kind'] = roll < 0.56 ? 'gift' : roll < 0.78 ? 'star' : 'meteor';
        items.push({
          x: 22 + Math.random() * (width - 44),
          y: -18,
          vy: 120 + Math.min(180, score * 0.45) + Math.random() * 55,
          r: kind === 'star' ? 12 : 14,
          kind,
        });
        spawnTimer = Math.max(0.32, 0.78 - score * 0.0012);
      }

      const paddleY = height - 24;
      const paddleW = 66;

      // Update items
      for (let i = items.length - 1; i >= 0; i--) {
        const it = items[i];
        it.y += it.vy * dt;

        // Collision with hover pod
        if (Math.abs(it.y - paddleY) < 18 && Math.abs(it.x - playerX) < paddleW / 2 + it.r * 0.6) {
          if (it.kind === 'meteor') {
            lives -= 1;
            streak = 0;
            soundEngine.playGameHit();
            for (let k = 0; k < 10; k++) {
              sparks.push({
                x: it.x,
                y: it.y,
                vx: (Math.random() - 0.5) * 180,
                vy: (Math.random() - 0.5) * 180,
                life: 0.4,
                color: '#fb7185',
              });
            }
          } else {
            streak += 1;
            const pts = (it.kind === 'star' ? 25 : 10) + Math.min(20, streak * 2);
            score += pts;
            soundEngine.playGameBonus();
            for (let k = 0; k < 10; k++) {
              sparks.push({
                x: it.x,
                y: it.y,
                vx: (Math.random() - 0.5) * 160,
                vy: -Math.random() * 140,
                life: 0.45,
                color: it.kind === 'star' ? '#5eead4' : '#f6c96f',
              });
            }
          }
          items.splice(i, 1);
          setHud({ score, lives, streak });
          if (lives <= 0) {
            playingRef.current = false;
            setPlaying(false);
            scoreCbRef.current(score);
          }
          continue;
        }

        if (it.y > height + 24) {
          items.splice(i, 1);
          continue;
        }

        // Draw item
        ctx.save();
        ctx.translate(it.x, it.y);
        if (it.kind === 'gift') {
          ctx.fillStyle = '#f6c96f';
          ctx.fillRect(-10, -10, 20, 20);
          ctx.fillStyle = '#f472b6';
          ctx.fillRect(-2, -10, 4, 20);
          ctx.fillRect(-10, -2, 20, 4);
        } else if (it.kind === 'star') {
          ctx.fillStyle = '#5eead4';
          ctx.beginPath();
          ctx.arc(0, 0, 9, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          ctx.stroke();
        } else {
          ctx.fillStyle = '#fb7185';
          ctx.beginPath();
          ctx.arc(0, 0, 11, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#fda4af';
          ctx.lineWidth = 2;
          ctx.stroke();
        }
        ctx.restore();
      }

      // Draw sparks
      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];
        s.life -= dt;
        if (s.life <= 0) {
          sparks.splice(i, 1);
          continue;
        }
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        ctx.fillStyle = s.color;
        ctx.globalAlpha = Math.max(0, s.life * 2);
        ctx.fillRect(s.x - 2, s.y - 2, 4, 4);
        ctx.globalAlpha = 1;
      }

      // Draw neon hover pod
      const podGrad = ctx.createLinearGradient(playerX - paddleW / 2, paddleY, playerX + paddleW / 2, paddleY);
      podGrad.addColorStop(0, '#38bdf8');
      podGrad.addColorStop(0.5, '#f6c96f');
      podGrad.addColorStop(1, '#f472b6');
      ctx.fillStyle = podGrad;
      ctx.beginPath();
      ctx.roundRect(playerX - paddleW / 2, paddleY - 7, paddleW, 14, 7);
      ctx.fill();
    };

    rafId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
    };
  }, [playing]);

  const startGame = () => {
    setHud({ score: 0, lives: 3, streak: 0 });
    playingRef.current = true;
    setPlaying(true);
    soundEngine.playChime();
  };

  return (
    <div className="mini-game-box">
      <div className="game-stats-bar">
        <span>Score: <strong>{hud.score}</strong></span>
        <span>Lives: <strong>{'♥'.repeat(Math.max(0, hud.lives))}</strong></span>
        <span>Best: <strong>{Math.max(best, hud.score)}</strong></span>
      </div>
      <div className="game-canvas-wrap">
        <canvas ref={canvasRef} className="game-canvas" />
        {!playing && (
          <div className="game-start-overlay">
            <p>{hud.score > 0 ? `Run Complete! Score: ${hud.score}` : 'Drag or use Arrow Keys to catch golden gifts & stars. Dodge red meteors!'}</p>
            <button type="button" className="btn-primary" onClick={startGame}>
              {hud.score > 0 ? <RotateCcw size={15} /> : <Play size={15} />}
              <span>{hud.score > 0 ? 'Play Again' : 'Start Game'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

/* ==================== GAME 2: CHRONO SPARK MEMORY ==================== */
const ChronoSparkGame: React.FC<{ best: number; onScore: (s: number) => void }> = ({ best, onScore }) => {
  const [sequence, setSequence] = useState<number[]>([]);
  const [userStep, setUserStep] = useState(0);
  const [activePad, setActivePad] = useState<number | null>(null);
  const [phase, setPhase] = useState<'idle' | 'showing' | 'input' | 'over'>('idle');
  const [score, setScore] = useState(0);

  const playSequence = async (seq: number[]) => {
    setPhase('showing');
    for (let i = 0; i < seq.length; i++) {
      await new Promise((r) => setTimeout(r, 340));
      setActivePad(seq[i]);
      soundEngine.playPadTone(seq[i]);
      await new Promise((r) => setTimeout(r, 320));
      setActivePad(null);
    }
    setUserStep(0);
    setPhase('input');
  };

  const startMemory = () => {
    const first = [Math.floor(Math.random() * 4)];
    setSequence(first);
    setScore(0);
    void playSequence(first);
  };

  const handlePadTap = (idx: number) => {
    if (phase !== 'input') return;
    setActivePad(idx);
    soundEngine.playPadTone(idx);
    setTimeout(() => setActivePad(null), 200);

    if (idx !== sequence[userStep]) {
      soundEngine.playGameHit();
      setPhase('over');
      onScore(score);
      return;
    }

    const nextStep = userStep + 1;
    if (nextStep === sequence.length) {
      const nextScore = score + sequence.length * 15;
      setScore(nextScore);
      onScore(nextScore);
      const nextSeq = [...sequence, Math.floor(Math.random() * 4)];
      setSequence(nextSeq);
      setTimeout(() => void playSequence(nextSeq), 420);
    } else {
      setUserStep(nextStep);
    }
  };

  const pads = [
    { label: 'SOLAR', cls: 'pad-gold' },
    { label: 'NEBULA', cls: 'pad-rose' },
    { label: 'AURORA', cls: 'pad-cyan' },
    { label: 'COSMOS', cls: 'pad-violet' },
  ];

  return (
    <div className="mini-game-box">
      <div className="game-stats-bar">
        <span>Level: <strong>{sequence.length || 0}</strong></span>
        <span>Score: <strong>{score}</strong></span>
        <span>Best: <strong>{Math.max(best, score)}</strong></span>
      </div>

      <div className="memory-grid">
        {pads.map((p, idx) => (
          <button
            key={p.label}
            type="button"
            className={`memory-pad ${p.cls} ${activePad === idx ? 'lit' : ''}`}
            onClick={() => handlePadTap(idx)}
            disabled={phase !== 'input'}
          >
            <span>{p.label}</span>
          </button>
        ))}
      </div>

      <div className="memory-footer">
        {phase === 'idle' && (
          <button type="button" className="btn-primary" onClick={startMemory}>
            <Play size={15} />
            <span>Start Sequence</span>
          </button>
        )}
        {phase === 'showing' && <span className="status-pill">Memorize the light sequence...</span>}
        {phase === 'input' && <span className="status-pill">Your turn ({userStep}/{sequence.length})</span>}
        {phase === 'over' && (
          <button type="button" className="btn-primary" onClick={startMemory}>
            <RotateCcw size={15} />
            <span>Mismatch! Retry ({score} pts)</span>
          </button>
        )}
      </div>
    </div>
  );
};

/* ==================== GAME 3: STARLIGHT BURST ==================== */
const StarlightBurstGame: React.FC<{ best: number; onScore: (s: number) => void }> = ({ best, onScore }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [running, setRunning] = useState(false);
  const [hud, setHud] = useState({ score: 0, timeLeft: 25 });
  const runningRef = useRef(false);
  const onScoreRef = useRef(onScore);
  onScoreRef.current = onScore;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = 340;
    let height = 280;
    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      width = parent.clientWidth;
      height = parent.clientHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    const ro = new ResizeObserver(resize);
    if (canvas.parentElement) ro.observe(canvas.parentElement);
    resize();

    interface Orb {
      x: number;
      y: number;
      r: number;
      life: number;
      maxLife: number;
      bonus: boolean;
    }
    interface PopSpark {
      x: number;
      y: number;
      vx: number;
      vy: number;
      life: number;
      color: string;
    }
    const orbs: Orb[] = [];
    const popSparks: PopSpark[] = [];
    let score = 0;
    let timeLeft = 25;
    let spawnTimer = 0;

    const onPointerDown = (e: PointerEvent) => {
      if (!runningRef.current) return;
      const rect = canvas.getBoundingClientRect();
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;

      for (let i = orbs.length - 1; i >= 0; i--) {
        const o = orbs[i];
        if (Math.hypot(px - o.x, py - o.y) <= o.r + 12) {
          score += o.bonus ? 30 : 12;
          soundEngine.playGameBonus();
          for (let k = 0; k < 12; k++) {
            const ang = (k / 12) * Math.PI * 2;
            const spd = 80 + Math.random() * 110;
            popSparks.push({
              x: o.x,
              y: o.y,
              vx: Math.cos(ang) * spd,
              vy: Math.sin(ang) * spd,
              life: 0.35,
              color: o.bonus ? '#f6c96f' : '#5eead4',
            });
          }
          orbs.splice(i, 1);
          setHud({ score, timeLeft: Math.ceil(timeLeft) });
          return;
        }
      }
    };

    canvas.addEventListener('pointerdown', onPointerDown);

    let last = performance.now();
    let raf = 0;
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      ctx.clearRect(0, 0, width, height);

      if (!runningRef.current) return;

      timeLeft -= dt;
      if (timeLeft <= 0) {
        timeLeft = 0;
        runningRef.current = false;
        setRunning(false);
        setHud({ score, timeLeft: 0 });
        onScoreRef.current(score);
        return;
      }

      spawnTimer -= dt;
      if (spawnTimer <= 0 && orbs.length < 7) {
        const bonus = Math.random() < 0.25;
        orbs.push({
          x: 28 + Math.random() * (width - 56),
          y: 28 + Math.random() * (height - 56),
          r: bonus ? 18 : 23,
          life: bonus ? 1.35 : 1.9,
          maxLife: bonus ? 1.35 : 1.9,
          bonus,
        });
        spawnTimer = 0.44;
      }

      for (let i = orbs.length - 1; i >= 0; i--) {
        const o = orbs[i];
        o.life -= dt;
        if (o.life <= 0) {
          orbs.splice(i, 1);
          continue;
        }
        const ratio = o.life / o.maxLife;
        const rad = o.r * (0.6 + ratio * 0.4);
        ctx.save();
        const grad = ctx.createRadialGradient(o.x - rad * 0.3, o.y - rad * 0.3, 2, o.x, o.y, rad);
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.5, o.bonus ? '#f6c96f' : '#5eead4');
        grad.addColorStop(1, o.bonus ? 'rgba(246, 201, 111, 0.25)' : 'rgba(94, 234, 212, 0.25)');
        ctx.beginPath();
        ctx.arc(o.x, o.y, rad, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.85)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.restore();
      }

      for (let i = popSparks.length - 1; i >= 0; i--) {
        const s = popSparks[i];
        s.life -= dt;
        if (s.life <= 0) {
          popSparks.splice(i, 1);
          continue;
        }
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        ctx.fillStyle = s.color;
        ctx.globalAlpha = Math.max(0, s.life * 2.5);
        ctx.beginPath();
        ctx.arc(s.x, s.y, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      setHud((prev) => (prev.timeLeft !== Math.ceil(timeLeft) ? { score, timeLeft: Math.ceil(timeLeft) } : prev));
    };

    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      canvas.removeEventListener('pointerdown', onPointerDown);
    };
  }, [running]);

  const start = () => {
    setHud({ score: 0, timeLeft: 25 });
    runningRef.current = true;
    setRunning(true);
    soundEngine.playChime();
  };

  return (
    <div className="mini-game-box">
      <div className="game-stats-bar">
        <span>Score: <strong>{hud.score}</strong></span>
        <span>Time: <strong>{hud.timeLeft}s</strong></span>
        <span>Best: <strong>{Math.max(best, hud.score)}</strong></span>
      </div>
      <div className="game-canvas-wrap">
        <canvas ref={canvasRef} className="game-canvas" />
        {!running && (
          <div className="game-start-overlay">
            <p>{hud.score > 0 ? `Time's Up! Final Score: ${hud.score}` : 'Tap glowing cyan & gold birthday orbs before they vanish!'}</p>
            <button type="button" className="btn-primary" onClick={start}>
              {hud.score > 0 ? <RotateCcw size={15} /> : <Play size={15} />}
              <span>{hud.score > 0 ? 'Play Again' : 'Start 25s Sprint'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

/* ==================== ARCADE SHELL ==================== */
export const GamesArcade: React.FC<GamesArcadeProps> = ({ highScores, onUpdateScore }) => {
  const [activeGame, setActiveGame] = useState<GameId>('catcher');

  return (
    <div className="arcade-container">
      <div className="glass-pill-panel arcade-card">
        <div className="arcade-header">
          <div>
            <div className="panel-eyebrow">SOLO PLAY • 18.11 ARCADE</div>
            <h2 className="panel-title">Single-Player Birthday Games</h2>
          </div>
          <div className="trophy-badge">
            <Trophy size={14} />
            <span>{highScores.giftCatcher + highScores.chronoSpark + highScores.starlightBurst} pts</span>
          </div>
        </div>

        <div className="subtabs" role="tablist" aria-label="Choose mini-game">
          <button
            type="button"
            role="tab"
            aria-selected={activeGame === 'catcher'}
            className={`subtab-btn ${activeGame === 'catcher' ? 'active' : ''}`}
            onClick={() => setActiveGame('catcher')}
          >
            <Gift size={15} />
            <span>Gift Catcher</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeGame === 'memory'}
            className={`subtab-btn ${activeGame === 'memory' ? 'active' : ''}`}
            onClick={() => setActiveGame('memory')}
          >
            <Cpu size={15} />
            <span>Chrono Spark</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeGame === 'burst'}
            className={`subtab-btn ${activeGame === 'burst' ? 'active' : ''}`}
            onClick={() => setActiveGame('burst')}
          >
            <Zap size={15} />
            <span>Starlight Burst</span>
          </button>
        </div>

        {activeGame === 'catcher' && (
          <GiftCatcherGame best={highScores.giftCatcher} onScore={(s) => onUpdateScore('giftCatcher', s)} />
        )}
        {activeGame === 'memory' && (
          <ChronoSparkGame best={highScores.chronoSpark} onScore={(s) => onUpdateScore('chronoSpark', s)} />
        )}
        {activeGame === 'burst' && (
          <StarlightBurstGame best={highScores.starlightBurst} onScore={(s) => onUpdateScore('starlightBurst', s)} />
        )}
      </div>
    </div>
  );
};
