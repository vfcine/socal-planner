import React from 'react';
import { Settings, Sun } from 'lucide-react';

const AREA_COLORS = {
  'Los Angeles': '#E8863A',
  'Orange County': '#2E6E8E',
  'San Diego': '#5C7A5A',
  'Inland Empire': '#C45A5A',
};

export default function Header({ preferences, onOpenPrefs }) {
  return (
    <header style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 24px', height: 56,
      background: 'white', borderBottom: '1.5px solid var(--sand-border)',
      flexShrink: 0, zIndex: 10,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Sun size={22} color="var(--sun)" strokeWidth={2} />
        <span style={{
          fontFamily: 'var(--font-display)', fontSize: 20,
          color: 'var(--ink)', letterSpacing: '-0.01em',
          fontStyle: 'italic',
        }}>SoCal Planner</span>
        <span style={{
          fontSize: 11, fontWeight: 500, color: 'var(--ink-light)',
          letterSpacing: '0.05em', textTransform: 'uppercase',
          marginLeft: 4, marginTop: 2,
        }}>by the coast</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <AreaPill area={preferences.selectedArea} color={AREA_COLORS[preferences.selectedArea]} />
        {preferences.noCar && (
          <span className="tag tag-sage">🚶 No Car</span>
        )}
        <button className="btn-icon" onClick={onOpenPrefs} title="Preferences">
          <Settings size={18} />
        </button>
      </div>
    </header>
  );
}

function AreaPill({ area, color }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6,
      background: color + '18', borderRadius: 99,
      padding: '4px 12px', border: `1.5px solid ${color}40`,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: color, flexShrink: 0 }} />
      <span style={{ fontSize: 12, fontWeight: 500, color }}>{area}</span>
    </div>
  );
}
