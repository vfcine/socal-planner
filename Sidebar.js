import React, { useState, useEffect } from 'react';
import { X, Sparkles, MapPin, Star, Plus, Loader, RefreshCw } from 'lucide-react';

const HOUR_LABELS = {
  7: '7 AM', 8: '8 AM', 9: '9 AM', 10: '10 AM', 11: '11 AM',
  12: '12 PM', 13: '1 PM', 14: '2 PM', 15: '3 PM', 16: '4 PM',
  17: '5 PM', 18: '6 PM', 19: '7 PM', 20: '8 PM', 21: '9 PM',
  22: '10 PM', 23: '11 PM',
};

async function fetchRecommendations(context) {
  const { day, slotHour, preferences, existingLocations } = context;

  const filledSlots = day.slots.map(s => {
    const loc = existingLocations.find(l => l.id === s.locationId);
    return loc ? `${HOUR_LABELS[Math.floor(s.hour)] || s.hour}: ${loc.name} (${loc.category || 'other'})` : null;
  }).filter(Boolean);

  const targetTime = slotHour ? HOUR_LABELS[slotHour] : 'open gaps in the day';

  const prompt = `You are a Southern California travel expert helping plan a day itinerary.

Area: ${preferences.selectedArea || 'Los Angeles'}, Southern California
Target time: ${targetTime}
Already in itinerary: ${filledSlots.length > 0 ? filledSlots.join(', ') : 'nothing yet'}
User preferences:
- Max distance: ${preferences.maxDistance || 30} miles
- No car: ${preferences.noCar ? 'yes – suggest walkable/transit accessible spots' : 'no'}
- Interests: ${preferences.interests?.join(', ') || 'general'}
- Dietary/allergies: ${preferences.allergies?.join(', ') || 'none specified'}
- Dietary prefs: ${preferences.dietaryPrefs?.join(', ') || 'none specified'}

Generate 4-5 specific, real Southern California recommendations that would fit well ${slotHour ? `at ${targetTime}` : 'in the empty slots'}.
Consider:
- What type of activity fits the time of day
- Variety (don't repeat categories already in the itinerary)
- Context awareness (if lots of indoor spots, suggest outdoors; if food heavy, suggest activity)
- Real, well-known SoCal spots

Respond ONLY with valid JSON array (no markdown, no backticks):
[
  {
    "name": "Place Name",
    "category": "restaurant|cafe|bar|beach|nature|museum|shopping|activity|landmark|other",
    "area": "specific neighborhood/city",
    "rating": 4.5,
    "notes": "2 sentence why this fits + what to do/order/see",
    "busyTimes": { "peak": "Weekend afternoons", "quiet": "Weekday mornings" },
    "suggestedHour": ${slotHour || 12},
    "why": "One sentence on why this fits the itinerary context",
    "tags": ["tag1", "tag2"],
    "source": "AI Suggestion"
  }
]`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  const data = await response.json();
  const text = data.content?.map(c => c.text || '').join('') || '';
  const clean = text.replace(/```json|```/g, '').trim();
  return JSON.parse(clean);
}

const CATEGORY_EMOJI = {
  restaurant: '🍽️', cafe: '☕', bar: '🍸', beach: '🏖️',
  nature: '🌿', museum: '🎨', shopping: '🛍️', activity: '🎯',
  landmark: '🏛️', other: '📍',
};

export default function AIRecommendations({ context, onAdd, onClose }) {
  const [recs, setRecs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const results = await fetchRecommendations(context);
      setRecs(results);
    } catch (e) {
      setError('Could not load recommendations. Please try again.');
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleAdd = (rec) => {
    const newLoc = {
      id: `loc-ai-${Date.now()}`,
      name: rec.name,
      category: rec.category || 'other',
      area: rec.area || context.preferences.selectedArea,
      rating: rec.rating,
      notes: rec.notes,
      busyTimes: rec.busyTimes || {},
      tags: rec.tags || [],
      images: [],
      source: 'AI Suggestion',
      sourceUrl: '',
    };
    const newSlot = {
      id: `slot-ai-${Date.now()}`,
      locationId: newLoc.id,
      hour: rec.suggestedHour || context.slotHour || 12,
      duration: 1.5,
      _newLocation: newLoc,
    };
    onAdd(context.dayId, newSlot, newLoc);
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-wide">
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Sparkles size={18} color="var(--ocean)" />
            <h2>AI Suggestions</h2>
            {context.slotHour && (
              <span className="tag tag-category">{HOUR_LABELS[context.slotHour]}</span>
            )}
          </div>
          <button className="btn-icon" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="modal-body">
          {loading && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px 0', gap: 12 }}>
              <Loader size={28} color="var(--ocean)" style={{ animation: 'spin 1s linear infinite' }} />
              <span style={{ color: 'var(--ink-light)', fontSize: 13 }}>Finding great spots in {context.preferences?.selectedArea || 'SoCal'}…</span>
            </div>
          )}

          {error && (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <div style={{ color: 'var(--rose)', marginBottom: 12, fontSize: 13 }}>{error}</div>
              <button className="btn btn-ghost btn-sm" onClick={load}><RefreshCw size={13} /> Try Again</button>
            </div>
          )}

          {!loading && !error && (
            <>
              {context.day.slots.length > 0 && (
                <div style={{ background: 'var(--ocean-pale)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', marginBottom: 16, fontSize: 12, color: 'var(--ocean)', lineHeight: 1.5 }}>
                  💡 Suggestions tailored around your existing itinerary stops and preferences.
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {recs.map((rec, i) => (
                  <RecCard key={i} rec={rec} onAdd={() => handleAdd(rec)} />
                ))}
              </div>

              <div style={{ marginTop: 14, textAlign: 'center' }}>
                <button className="btn btn-ghost btn-sm" onClick={load}>
                  <RefreshCw size={13} /> Generate Different Options
                </button>
              </div>
            </>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Close</button>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function RecCard({ rec, onAdd }) {
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    onAdd();
    setAdded(true);
  };

  return (
    <div style={{
      background: 'white', border: '1.5px solid var(--sand-border)',
      borderRadius: 'var(--radius-md)', padding: '14px',
      display: 'flex', gap: 12, alignItems: 'flex-start',
      transition: 'border-color 0.15s',
      borderColor: added ? 'var(--sage)' : 'var(--sand-border)',
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: 'var(--radius-sm)',
        background: 'var(--sand)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 20, flexShrink: 0,
      }}>
        {CATEGORY_EMOJI[rec.category] || '📍'}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--ink)' }}>{rec.name}</div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 2 }}>
              {rec.area && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, color: 'var(--ink-light)' }}>
                  <MapPin size={10} /> {rec.area}
                </span>
              )}
              {rec.rating && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, color: 'var(--sun)' }}>
                  <Star size={10} fill="currentColor" />
                  <span style={{ color: 'var(--ink-mid)' }}>{rec.rating}</span>
                </span>
              )}
            </div>
          </div>

          <button
            className={`btn btn-sm ${added ? 'btn-ghost' : 'btn-primary'}`}
            onClick={handleAdd}
            disabled={added}
            style={{ flexShrink: 0, background: added ? 'var(--sage-pale)' : undefined, color: added ? 'var(--sage)' : undefined, borderColor: added ? 'var(--sage)' : undefined }}
          >
            {added ? '✓ Added' : <><Plus size={12} /> Add</>}
          </button>
        </div>

        {rec.notes && (
          <p style={{ fontSize: 12, color: 'var(--ink-mid)', lineHeight: 1.5, marginBottom: rec.why ? 6 : 0 }}>
            {rec.notes}
          </p>
        )}

        {rec.why && (
          <div style={{ fontSize: 11, color: 'var(--ocean)', background: 'var(--ocean-pale)', borderRadius: 4, padding: '4px 8px', display: 'inline-block', marginTop: 4 }}>
            ✦ {rec.why}
          </div>
        )}

        {rec.tags && rec.tags.length > 0 && (
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 6 }}>
            {rec.tags.map(t => (
              <span key={t} style={{ background: 'var(--sand)', color: 'var(--ink-light)', borderRadius: 99, padding: '2px 8px', fontSize: 10 }}>{t}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
