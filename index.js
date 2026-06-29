import React, { useState } from 'react';
import { X, Sliders } from 'lucide-react';

const AREAS = ['Los Angeles', 'Orange County', 'San Diego', 'Inland Empire', 'Ventura County', 'Coachella Valley'];

const INTEREST_OPTIONS = [
  '🍜 Foodie / Dining', '🌊 Beach / Ocean', '🌿 Nature / Hiking', '🎨 Art / Museums',
  '📸 Photography', '🛍️ Shopping', '☕ Coffee Culture', '🍸 Nightlife / Bars',
  '🎭 Entertainment', '🏄 Watersports', '🧘 Wellness / Spas', '🎵 Live Music',
  '🏛️ History / Culture', '🌙 Late Night Eats', '🐕 Dog-friendly', '👨‍👩‍👧 Family-friendly',
];

const DIETARY_OPTIONS = [
  'Vegetarian', 'Vegan', 'Gluten-free', 'Halal', 'Kosher',
  'Dairy-free', 'Nut-free', 'Seafood-free', 'Low-carb', 'Organic / Farm-to-table',
];

function ChipInput({ value = [], onChange, placeholder }) {
  const [input, setInput] = useState('');
  const addChip = () => {
    const v = input.trim();
    if (v && !value.includes(v)) onChange([...value, v]);
    setInput('');
  };
  return (
    <div className="chip-input-container">
      {value.map(v => (
        <span key={v} className="chip">
          {v}
          <button type="button" onClick={() => onChange(value.filter(x => x !== v))}>×</button>
        </span>
      ))}
      <input className="chip-input" value={input} onChange={e => setInput(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addChip(); } }}
        placeholder={placeholder} />
    </div>
  );
}

function ToggleChip({ label, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      padding: '6px 12px', borderRadius: 99,
      border: `1.5px solid ${active ? 'var(--sun)' : 'var(--sand-border)'}`,
      background: active ? 'var(--sun-pale)' : 'white',
      color: active ? 'var(--sun)' : 'var(--ink-mid)',
      fontSize: 12, fontWeight: active ? 600 : 400,
      cursor: 'pointer', fontFamily: 'var(--font-body)',
      transition: 'all 0.15s',
    }}>
      {label}
    </button>
  );
}

export default function PreferencesModal({ preferences, onChange, onClose }) {
  const [prefs, setPrefs] = useState({ ...preferences });

  const set = (k, v) => setPrefs(p => ({ ...p, [k]: v }));

  const toggleInterest = (item) => {
    const curr = prefs.interests || [];
    set('interests', curr.includes(item) ? curr.filter(x => x !== item) : [...curr, item]);
  };

  const toggleDietary = (item) => {
    const curr = prefs.dietaryPrefs || [];
    set('dietaryPrefs', curr.includes(item) ? curr.filter(x => x !== item) : [...curr, item]);
  };

  const handleSave = () => {
    onChange(prefs);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-wide">
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Sliders size={18} color="var(--sun)" />
            <h2>Preferences</h2>
          </div>
          <button className="btn-icon" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* Area */}
          <section>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 400, marginBottom: 10, color: 'var(--ink)' }}>
              Primary SoCal Area
            </h3>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {AREAS.map(a => (
                <ToggleChip key={a} label={a} active={prefs.selectedArea === a} onClick={() => set('selectedArea', a)} />
              ))}
            </div>
          </section>

          {/* Distance + No Car */}
          <section>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 400, marginBottom: 10 }}>
              Mobility
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              <div className="toggle-row">
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)' }}>No car needed</div>
                  <div style={{ fontSize: 12, color: 'var(--ink-light)' }}>Only suggest walkable or transit-accessible spots</div>
                </div>
                <label className="toggle">
                  <input type="checkbox" checked={prefs.noCar} onChange={e => set('noCar', e.target.checked)} />
                  <span className="toggle-slider" />
                </label>
              </div>
              <div className="toggle-row" style={{ alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)' }}>Max distance</div>
                  <div style={{ fontSize: 12, color: 'var(--ink-light)' }}>
                    {prefs.maxDistance} miles from area center
                  </div>
                </div>
                <input
                  type="range" min={2} max={60} step={2}
                  value={prefs.maxDistance}
                  onChange={e => set('maxDistance', Number(e.target.value))}
                  style={{ width: 120, accentColor: 'var(--sun)', border: 'none', padding: 0, background: 'transparent' }}
                />
              </div>
            </div>
          </section>

          {/* Interests */}
          <section>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 400, marginBottom: 10 }}>
              What I Enjoy
            </h3>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {INTEREST_OPTIONS.map(item => (
                <ToggleChip key={item} label={item} active={(prefs.interests || []).includes(item)} onClick={() => toggleInterest(item)} />
              ))}
            </div>
          </section>

          {/* Dietary */}
          <section>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 400, marginBottom: 10 }}>
              Dietary Preferences & Restrictions
            </h3>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
              {DIETARY_OPTIONS.map(item => (
                <ToggleChip key={item} label={item} active={(prefs.dietaryPrefs || []).includes(item)} onClick={() => toggleDietary(item)} />
              ))}
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Additional allergies or restrictions (press Enter)</label>
              <ChipInput value={prefs.allergies || []} onChange={v => set('allergies', v)} placeholder="e.g. shellfish, peanuts, soy…" />
            </div>
          </section>

        </div>

        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave}>Save Preferences</button>
        </div>
      </div>
    </div>
  );
}
