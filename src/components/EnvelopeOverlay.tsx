import React, { useState } from 'react';
import { MailOpen, RotateCcw, Sparkles, X, Edit3 } from 'lucide-react';

interface EnvelopeOverlayProps {
  isOpen: boolean;
  showLetter: boolean;
  onToggleOpen: () => void;
  onShowLetter: (show: boolean) => void;
}

const DEFAULT_LETTER = `Teriyaan akhaan do gehre samundar vargiyan ne jinhaan di gehraayi nu vekh ke lagda ae banda bas dubbda hi jaave 🥹🌊
Teri akhaan ch ajeha nasha ae ke ik vari vekhan ton baad  hataun nu dil hi nai krda ❤️
Tera chehra sohni jehi jheel varga ae jithe vekh ke dil nu sukoon mil janda ae 🫶🥹
Teri chaal darya di lehran vargi ae jo hauli hauli dil nu apne naal baha ke lai jandi ae 🌊❤️
Teriyaan akhaan hiran vargiyan masoom te pyariyan ne 🥺🦌
Teri awaaz koyal vargi mithhi ae jo ik vari sunan ton baad vaar vaar sunan nu dil krda ae 🫶❤️
Teri muskaan savere di pehli roshni vargi ae jo sara din roshan kr deve 🥹☀️
Tere hoont gulaab diyan pankhriyan varge ne 🌹❤️
Teri kamar darya di lahar vang sohni te nazuk ae 🥺❤️
Tera husn eda jewe zehar ae jo main bina dare pee lavaan te fer vi hor mangda rawaan 🥺❤️
Teri mohabbat sharab vargi ae jaanu jinni peenda javaan unna hi hor tera ho janda aan 🫶🥹
Sachii jaanu kudrat ne tenu bna ke lagda ae apni saari khoobsurti ikko thaan te rakh ditti ae ❤️🥺`;

export const EnvelopeOverlay: React.FC<EnvelopeOverlayProps> = ({
  isOpen,
  showLetter,
  onToggleOpen,
  onShowLetter,
}) => {
  const [salutation, setSalutation] = useState('Jaanu 🥺❤️');
  const [sender, setSender] = useState('Always Yours, Forever');
  const [customNote, setCustomNote] = useState(DEFAULT_LETTER);
  const [editing, setEditing] = useState(false);

  return (
    <>
      <div className="floating-dock-controls">
        <div className="glass-pill-panel">
          <div className="panel-eyebrow">18 NOVEMBER • ROYAL DISPATCH</div>
          <h2 className="panel-title">Celestial Birthday Envelope</h2>
          <p className="panel-sub">
            {isOpen
              ? 'The wax seal is broken. Open the full letter or seal it back.'
              : 'Tap the 3D rose-gold wax seal above or press below to unseal.'}
          </p>
          <div className="action-row">
            <button type="button" className="btn-primary" onClick={onToggleOpen}>
              {isOpen ? <RotateCcw size={16} /> : <MailOpen size={16} />}
              <span>{isOpen ? 'Close & Reseal' : 'Break Seal & Open'}</span>
            </button>
            {isOpen && (
              <button type="button" className="btn-secondary" onClick={() => onShowLetter(true)}>
                <Sparkles size={16} />
                <span>Read Letter</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {showLetter && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Birthday letter for Ayat">
          <div className="letter-modal glass-card">
            <div className="letter-header">
              <div>
                <span className="badge-gold">18 NOV • AYAT</span>
                <h3>A Letter From My Heart</h3>
              </div>
              <div className="letter-header-actions">
                <button
                  type="button"
                  className="icon-btn"
                  onClick={() => setEditing((v) => !v)}
                  title="Customize message"
                  aria-label="Customize letter message"
                >
                  <Edit3 size={16} />
                </button>
                <button
                  type="button"
                  className="icon-btn"
                  onClick={() => onShowLetter(false)}
                  aria-label="Close letter"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="letter-body">
              {editing ? (
                <div className="letter-editor">
                  <label>
                    <span>Salutation</span>
                    <input
                      type="text"
                      value={salutation}
                      onChange={(e) => setSalutation(e.target.value)}
                    />
                  </label>
                  <label>
                    <span>Personal Letter</span>
                    <textarea
                      rows={8}
                      value={customNote}
                      onChange={(e) => setCustomNote(e.target.value)}
                    />
                  </label>
                  <label>
                    <span>Signature</span>
                    <input
                      type="text"
                      value={sender}
                      onChange={(e) => setSender(e.target.value)}
                    />
                  </label>
                  <button type="button" className="btn-primary" onClick={() => setEditing(false)}>
                    Save Note
                  </button>
                </div>
              ) : (
                <>
                  <p className="letter-salutation">{salutation}</p>
                  <div className="letter-verses">
                    {customNote.split('\n').filter(Boolean).map((line, i) => (
                      <p key={i} className="letter-text letter-verse">
                        {line}
                      </p>
                    ))}
                  </div>
                  <div className="letter-signature">
                    <span>— {sender}</span>
                    <small>18.11 • Happy Birthday Ayat</small>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
