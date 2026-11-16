import React, { useEffect, useMemo, useState } from 'react';
import {
  Cake,
  Mail,
  Sparkles,
  Gamepad2,
  Compass,
  Volume2,
  VolumeX,
  Wind,
  Scissors,
  RotateCcw,
  Flame,
} from 'lucide-react';
import { ThreeStage } from './components/ThreeStage';
import { EnvelopeOverlay } from './components/EnvelopeOverlay';
import { ActivitiesPanel } from './components/ActivitiesPanel';
import { GamesArcade } from './components/GamesArcade';
import { HighScores, SectionId, WishLantern } from './types';
import { soundEngine } from './utils/soundEngine';

const INITIAL_CANDLES = [true, true, true, true, true];

function getNov18Status(): { label: string; isBirthday: boolean } {
  const now = new Date();
  const month = now.getMonth(); // 0-indexed: 10 is Nov
  const day = now.getDate();
  if (month === 10 && day === 18) {
    return { label: 'HAPPY BIRTHDAY • 18 NOV', isBirthday: true };
  }
  const targetYear = month > 10 || (month === 10 && day > 18) ? now.getFullYear() + 1 : now.getFullYear();
  const target = new Date(targetYear, 10, 18, 0, 0, 0);
  const diffMs = target.getTime() - now.getTime();
  const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  return {
    label: days === 1 ? '1 DAY TO 18 NOV' : `${days} DAYS TO 18 NOV`,
    isBirthday: false,
  };
}

export const App: React.FC = () => {
  const [entered, setEntered] = useState(false);
  const [muted, setMuted] = useState(false);
  const [section, setSection] = useState<SectionId>('overview');

  // 3D Cake State
  const [candlesLit, setCandlesLit] = useState<boolean[]>(INITIAL_CANDLES);
  const [isCut, setIsCut] = useState(false);

  // 3D Envelope State
  const [envelopeOpen, setEnvelopeOpen] = useState(false);
  const [showLetter, setShowLetter] = useState(false);

  // Sky Lanterns & Fireworks
  const [lanterns, setLanterns] = useState<WishLantern[]>([
    {
      id: 'init-1',
      author: 'Cosmos',
      message: 'Endless light and joy for Ayat on 18 November.',
      color: 'gold',
      createdAt: Date.now(),
    },
    {
      id: 'init-2',
      author: 'Starlight',
      message: 'May every dream bloom brilliantly this year.',
      color: 'rose',
      createdAt: Date.now(),
    },
  ]);
  const [fireworkPulse, setFireworkPulse] = useState(0);

  // Single-player Game High Scores
  const [highScores, setHighScores] = useState<HighScores>(() => {
    try {
      const saved = localStorage.getItem('ayat_18nov_scores');
      if (saved) return JSON.parse(saved) as HighScores;
    } catch {
      // ignore storage errors
    }
    return { giftCatcher: 0, chronoSpark: 0, starlightBurst: 0 };
  });

  useEffect(() => {
    try {
      localStorage.setItem('ayat_18nov_scores', JSON.stringify(highScores));
    } catch {
      // ignore storage errors
    }
  }, [highScores]);

  const dateBadge = useMemo(() => getNov18Status(), []);
  const litCount = candlesLit.filter(Boolean).length;

  const handleEnter = () => {
    soundEngine.init();
    soundEngine.playCelebrate();
    setEntered(true);
    setFireworkPulse((p) => p + 1);
  };

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    soundEngine.setMuted(next);
  };

  const switchSection = (next: SectionId) => {
    soundEngine.playChime();
    setSection(next);
    if (next !== 'envelope') setShowLetter(false);
  };

  const handleToggleCandle = (idx: number) => {
    setCandlesLit((prev) => {
      const copy = [...prev];
      const wasLit = copy[idx];
      copy[idx] = !wasLit;
      if (wasLit) {
        soundEngine.playBlow();
      } else {
        soundEngine.playChime();
      }
      return copy;
    });
  };

  const handleBlowAll = () => {
    if (litCount === 0) {
      soundEngine.playChime();
      setCandlesLit(INITIAL_CANDLES);
    } else {
      soundEngine.playBlow();
      setCandlesLit([false, false, false, false, false]);
      setTimeout(() => {
        soundEngine.playCelebrate();
        setFireworkPulse((p) => p + 1);
      }, 280);
    }
  };

  const handleSliceCake = () => {
    if (isCut) return;
    soundEngine.playSlice();
    setIsCut(true);
    setTimeout(() => setFireworkPulse((p) => p + 1), 350);
  };

  const handleResetCake = () => {
    soundEngine.playChime();
    setIsCut(false);
    setCandlesLit(INITIAL_CANDLES);
  };

  const handleToggleEnvelope = () => {
    const next = !envelopeOpen;
    setEnvelopeOpen(next);
    if (next) {
      soundEngine.playEnvelopeOpen();
      setTimeout(() => setShowLetter(true), 780);
    } else {
      soundEngine.playChime();
      setShowLetter(false);
    }
  };

  const handleLaunchLantern = (author: string, message: string, color: 'gold' | 'rose' | 'cyan') => {
    soundEngine.playLanternLaunch();
    setLanterns((prev) => [
      ...prev,
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        author,
        message,
        color,
        createdAt: Date.now(),
      },
    ]);
  };

  const handleTriggerFireworks = () => {
    soundEngine.playFirework();
    setFireworkPulse((p) => p + 1);
  };

  const handleUpdateScore = (game: keyof HighScores, score: number) => {
    setHighScores((prev) => ({
      ...prev,
      [game]: Math.max(prev[game], score),
    }));
  };

  return (
    <div className="app-shell">
      {/* Real-time Interactive 3D Three.js Stage */}
      <ThreeStage
        activeSection={section}
        candlesLit={candlesLit}
        isCut={isCut}
        envelopeOpen={envelopeOpen}
        lanterns={lanterns}
        fireworkPulse={fireworkPulse}
        skyTapFireworks={section === 'activities'}
        onCandleClick={handleToggleCandle}
        onCakeSwipeSlice={handleSliceCake}
        onEnvelopeClick={handleToggleEnvelope}
        onSkyFirework={() => soundEngine.playFirework()}
      />

      {/* Top HUD */}
      <header className="top-hud">
        <div className="brand-chip">
          <span className="brand-dot" />
          <span className="brand-name">AYAT</span>
          <span className="brand-sep">•</span>
          <span className="brand-date">18 NOV</span>
        </div>

        <div className="hud-right">
          <div className={`countdown-chip ${dateBadge.isBirthday ? 'is-live' : ''}`}>
            {dateBadge.label}
          </div>
          <button
            type="button"
            className="icon-btn hud-mute"
            onClick={toggleMute}
            aria-label={muted ? 'Unmute audio' : 'Mute audio'}
            title={muted ? 'Unmute audio' : 'Mute audio'}
          >
            {muted ? <VolumeX size={17} /> : <Volume2 size={17} />}
          </button>
        </div>
      </header>

      {/* Main Dynamic UI Layer */}
      {entered && (
        <main className="ui-stage">
          {section === 'overview' && (
            <div className="floating-dock-controls">
              <div className="glass-pill-panel hero-panel">
                <div className="panel-eyebrow">CELESTIAL EDITION • 18 NOVEMBER</div>
                <h1 className="hero-title">Happy Birthday, Ayat</h1>
                <p className="panel-sub">
                  Drag to orbit the 3D atelier, tap any candle, or select an interactive chapter below.
                </p>
                <div className="quick-grid">
                  <button type="button" className="btn-primary" onClick={() => switchSection('cake')}>
                    <Cake size={16} />
                    <span>Cut 3D Cake</span>
                  </button>
                  <button type="button" className="btn-secondary" onClick={() => switchSection('envelope')}>
                    <Mail size={16} />
                    <span>Open Envelope</span>
                  </button>
                  <button type="button" className="btn-secondary" onClick={() => switchSection('activities')}>
                    <Sparkles size={16} />
                    <span>Activities</span>
                  </button>
                  <button type="button" className="btn-secondary" onClick={() => switchSection('games')}>
                    <Gamepad2 size={16} />
                    <span>Solo Games</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {section === 'cake' && (
            <div className="floating-dock-controls">
              <div className="glass-pill-panel">
                <div className="panel-eyebrow">
                  {litCount > 0 ? `${litCount}/5 CANDLES LIT` : 'WISH LOCKED IN • READY TO SLICE'}
                </div>
                <h2 className="panel-title">3D Holographic Cake Studio</h2>
                <p className="panel-sub">
                  {isCut
                    ? 'A gourmet slice has been served! Relight or reset anytime.'
                    : 'Tap individual 3D candles to blow them out, then swipe across the cake (or tap Slice) to cut.'}
                </p>
                <div className="action-row">
                  <button type="button" className="btn-secondary" onClick={handleBlowAll}>
                    {litCount === 0 ? <Flame size={16} /> : <Wind size={16} />}
                    <span>{litCount === 0 ? 'Relight Candles' : 'Blow Out All'}</span>
                  </button>
                  {!isCut ? (
                    <button type="button" className="btn-primary" onClick={handleSliceCake}>
                      <Scissors size={16} />
                      <span>Slice 3D Cake</span>
                    </button>
                  ) : (
                    <button type="button" className="btn-primary" onClick={handleResetCake}>
                      <RotateCcw size={16} />
                      <span>Reset Cake</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {section === 'envelope' && (
            <EnvelopeOverlay
              isOpen={envelopeOpen}
              showLetter={showLetter}
              onToggleOpen={handleToggleEnvelope}
              onShowLetter={setShowLetter}
            />
          )}

          {section === 'activities' && (
            <ActivitiesPanel
              lanterns={lanterns}
              onLaunchLantern={handleLaunchLantern}
              onTriggerFireworks={handleTriggerFireworks}
            />
          )}

          {section === 'games' && (
            <GamesArcade highScores={highScores} onUpdateScore={handleUpdateScore} />
          )}
        </main>
      )}

      {/* Bottom Mobile-First Glassmorphic Navigation Dock */}
      {entered && (
        <nav className="bottom-nav" aria-label="Experience sections">
          {(
            [
              { id: 'overview', label: 'Stage', icon: Compass },
              { id: 'cake', label: 'Cake', icon: Cake },
              { id: 'envelope', label: 'Letter', icon: Mail },
              { id: 'activities', label: 'Activities', icon: Sparkles },
              { id: 'games', label: 'Games', icon: Gamepad2 },
            ] as const
          ).map((item) => {
            const Icon = item.icon;
            const active = section === item.id;
            return (
              <button
                key={item.id}
                type="button"
                className={`nav-item ${active ? 'active' : ''}`}
                onClick={() => switchSection(item.id)}
                aria-current={active ? 'page' : undefined}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      )}

      {/* Entry Welcome Gate */}
      {!entered && (
        <div className="entry-gate">
          <div className="entry-card glass-card">
            <div className="entry-orbit" aria-hidden="true">
              <div className="orbit-ring" />
              <div className="orbit-core">18.11</div>
            </div>
            <div className="panel-eyebrow">BESPOKE 3D BIRTHDAY EXPERIENCE</div>
            <h1 className="entry-title">AYAT</h1>
            <p className="entry-desc">
              A futuristic 3D celebration crafted for November 18 — featuring interactive cake cutting, a sealed 3D letter, sky wish lanterns, and solo arcade games.
            </p>
            <button type="button" className="btn-primary btn-entry" onClick={handleEnter}>
              <Sparkles size={17} />
              <span>Enter 3D Celebration</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
