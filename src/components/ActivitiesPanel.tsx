import React, { useState } from 'react';
import { Flame, Sparkles, Download, Send, Star, Wand2 } from 'lucide-react';
import { WishLantern } from '../types';
import { soundEngine } from '../utils/soundEngine';

interface ActivitiesPanelProps {
  lanterns: WishLantern[];
  onLaunchLantern: (author: string, message: string, color: 'gold' | 'rose' | 'cyan') => void;
  onTriggerFireworks: () => void;
}

type ActivityTab = 'lanterns' | 'fireworks' | 'keepsake';

const FORTUNES = [
  'A bold creative breakthrough will arrive before spring — trust your intuition.',
  'An unexpected journey brings laughter, clarity, and unforgettable memories.',
  'Your kindness returns tenfold this year in golden opportunities.',
  'Peaceful mornings and unstoppable confidence define your next chapter, Ayat.',
];

const DEFAULT_KEEPSAKE_MSG =
  'From the depths of the earth to the heights of the sky, my love for you knows no bounds. I adore everything about you—the sound of your voice, your little habits, the purity of your heart, and the beauty of your mind. You are breathtakingly gorgeous inside and out, and in this noisy world, you are my only true peace. Happy Birthday, my love, today and forever.';

const BOTTOM_KEEPSAKE_LINE = 'You have the purest heart—stay happy always, my love, my little witch ❤️';

export const ActivitiesPanel: React.FC<ActivitiesPanelProps> = ({
  lanterns,
  onLaunchLantern,
  onTriggerFireworks,
}) => {
  const [tab, setTab] = useState<ActivityTab>('lanterns');
  const [author, setAuthor] = useState('');
  const [wishText, setWishText] = useState('');
  const [lanternColor, setLanternColor] = useState<'gold' | 'rose' | 'cyan'>('gold');

  const [fortuneIdx, setFortuneIdx] = useState(0);
  const [cardTheme, setCardTheme] = useState<'obsidian-gold' | 'nebula-rose' | 'aurora-cyan'>('obsidian-gold');
  const [cardDedication, setCardDedication] = useState(DEFAULT_KEEPSAKE_MSG);
  const [downloaded, setDownloaded] = useState(false);

  const handleLaunch = (e: React.FormEvent) => {
    e.preventDefault();
    const msg = wishText.trim() || 'Happy Birthday Ayat! May your stars shine endlessly.';
    const from = author.trim() || 'A Well-Wisher';
    onLaunchLantern(from, msg, lanternColor);
    setWishText('');
  };

  const revealFortune = () => {
    soundEngine.playChime();
    setFortuneIdx((prev) => (prev + 1) % FORTUNES.length);
  };

  const downloadKeepsake = () => {
    soundEngine.playCelebrate();
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 800;
    const ctx = canvas.getContext('2d')!;

    const themes = {
      'obsidian-gold': ['#080a16', '#1c1330', '#f6c96f', '#fde68a'],
      'nebula-rose': ['#0c0818', '#2a102d', '#f472b6', '#fbcfe8'],
      'aurora-cyan': ['#050d1a', '#0c2438', '#5eead4', '#bae6fd'],
    }[cardTheme];

    const grad = ctx.createLinearGradient(0, 0, 1200, 800);
    grad.addColorStop(0, themes[0]);
    grad.addColorStop(1, themes[1]);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1200, 800);

    // Subtle stars kept near edges/corners so center text stays crystal-clean
    for (let i = 0; i < 85; i++) {
      const sx = Math.random() * 1200;
      const sy = Math.random() * 800;
      if (sx > 180 && sx < 1020 && sy > 120 && sy < 680) continue;
      ctx.fillStyle = `rgba(255,255,255,${0.25 + Math.random() * 0.55})`;
      ctx.beginPath();
      ctx.arc(sx, sy, 1 + Math.random() * 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Double luxury border frame
    ctx.strokeStyle = themes[2];
    ctx.lineWidth = 4;
    ctx.strokeRect(30, 30, 1140, 740);
    ctx.strokeStyle = 'rgba(255,255,255,0.18)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(46, 46, 1108, 708);

    ctx.textAlign = 'center';

    // Top line
    ctx.fillStyle = themes[3];
    ctx.font = '700 22px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('THE GREATEST LOVE OF MY UNIVERSE • 18 NOVEMBER', 600, 112);

    // Center name
    ctx.fillStyle = '#ffffff';
    ctx.font = '800 96px "Syne", sans-serif';
    ctx.fillText('AYAT', 600, 224);

    // Sub-headline
    ctx.fillStyle = themes[2];
    ctx.font = '700 34px Georgia, serif';
    ctx.fillText('Happy Birthday, My Entire Universe', 600, 286);

    // Main message (wrapped cleanly)
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    ctx.font = '400 24px "Plus Jakarta Sans", sans-serif';
    const words = cardDedication.split(' ');
    let line = '';
    let y = 365;
    for (const w of words) {
      const test = line ? `${line} ${w}` : w;
      if (ctx.measureText(test).width > 940) {
        ctx.fillText(line, 600, y);
        line = w;
        y += 38;
      } else {
        line = test;
      }
    }
    if (line) ctx.fillText(line, 600, y);

    // Bottom line
    ctx.fillStyle = themes[3];
    ctx.font = '600 23px Georgia, serif';
    ctx.fillText(BOTTOM_KEEPSAKE_LINE, 600, 704);

    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Ayat-18Nov-Keepsake.png';
    a.click();
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 2500);
  };

  return (
    <div className="floating-dock-controls activities-dock">
      <div className="glass-pill-panel panel-wide">
        <div className="subtabs" role="tablist" aria-label="Birthday activities">
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'lanterns'}
            className={`subtab-btn ${tab === 'lanterns' ? 'active' : ''}`}
            onClick={() => setTab('lanterns')}
          >
            <Flame size={15} />
            <span>3D Lanterns</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'fireworks'}
            className={`subtab-btn ${tab === 'fireworks' ? 'active' : ''}`}
            onClick={() => setTab('fireworks')}
          >
            <Sparkles size={15} />
            <span>Sky & Fortune</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'keepsake'}
            className={`subtab-btn ${tab === 'keepsake' ? 'active' : ''}`}
            onClick={() => setTab('keepsake')}
          >
            <Wand2 size={15} />
            <span>Keepsake Card</span>
          </button>
        </div>

        {tab === 'lanterns' && (
          <div className="activity-content">
            <p className="panel-sub">
              Release a glowing 3D wish lantern into the night sky above Ayat&apos;s stage.
            </p>
            <form className="lantern-form" onSubmit={handleLaunch}>
              <div className="input-row">
                <input
                  type="text"
                  placeholder="Your name (optional)"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  maxLength={28}
                />
                <div className="color-dots" aria-label="Lantern color">
                  {(['gold', 'rose', 'cyan'] as const).map((c) => (
                    <button
                      key={c}
                      type="button"
                      className={`color-dot dot-${c} ${lanternColor === c ? 'selected' : ''}`}
                      onClick={() => setLanternColor(c)}
                      aria-label={`Choose ${c} lantern`}
                    />
                  ))}
                </div>
              </div>
              <div className="input-row">
                <input
                  type="text"
                  placeholder="Write a birthday wish for Ayat..."
                  value={wishText}
                  onChange={(e) => setWishText(e.target.value)}
                  maxLength={90}
                />
                <button type="submit" className="btn-primary btn-compact">
                  <Send size={15} />
                  <span>Release</span>
                </button>
              </div>
            </form>
            {lanterns.length > 0 && (
              <div className="wish-chips">
                {lanterns.slice(-3).reverse().map((l) => (
                  <div key={l.id} className={`wish-chip chip-${l.color}`}>
                    <strong>{l.author}:</strong> {l.message}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'fireworks' && (
          <div className="activity-content">
            <p className="panel-sub">
              Tap anywhere in the open 3D sky above to launch fireworks, or reveal Ayat&apos;s Nov 18 star fortune.
            </p>
            <div className="fortune-box">
              <div className="fortune-meta">
                <span>18 NOV • SCORPIO STARLIGHT</span>
                <span>•</span>
                <span>CITRINE & TOPAZ</span>
              </div>
              <p className="fortune-quote">&ldquo;{FORTUNES[fortuneIdx]}&rdquo;</p>
            </div>
            <div className="action-row">
              <button type="button" className="btn-primary" onClick={onTriggerFireworks}>
                <Sparkles size={16} />
                <span>Launch Finale Burst</span>
              </button>
              <button type="button" className="btn-secondary" onClick={revealFortune}>
                <Star size={16} />
                <span>Next Star Fortune</span>
              </button>
            </div>
          </div>
        )}

        {tab === 'keepsake' && (
          <div className="activity-content">
            <div className={`keepsake-preview theme-${cardTheme}`}>
              <div className="kp-top">THE GREATEST LOVE OF MY UNIVERSE • 18 NOVEMBER</div>
              <div className="kp-name">AYAT</div>
              <div className="kp-sub">Happy Birthday, My Entire Universe</div>
              <div className="kp-msg">{cardDedication}</div>
              <div className="kp-bottom">{BOTTOM_KEEPSAKE_LINE}</div>
            </div>
            <div className="theme-selector">
              {(
                [
                  { id: 'obsidian-gold', label: 'Obsidian Gold' },
                  { id: 'nebula-rose', label: 'Nebula Rose' },
                  { id: 'aurora-cyan', label: 'Aurora Cyan' },
                ] as const
              ).map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className={`pill-choice ${cardTheme === t.id ? 'active' : ''}`}
                  onClick={() => setCardTheme(t.id)}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <div className="input-row">
              <input
                type="text"
                value={cardDedication}
                onChange={(e) => setCardDedication(e.target.value)}
                maxLength={450}
                placeholder="Dedication message on pass..."
              />
              <button type="button" className="btn-primary btn-compact" onClick={downloadKeepsake}>
                <Download size={15} />
                <span>{downloaded ? 'Saved!' : 'Save PNG'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
