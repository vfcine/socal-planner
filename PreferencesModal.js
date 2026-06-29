import React, { useState, useRef } from 'react';
import { X, Link, PenSquare, Star, Upload, Plus, Trash2, Loader } from 'lucide-react';

const AREAS = ['Los Angeles', 'Orange County', 'San Diego', 'Inland Empire', 'Ventura County', 'Coachella Valley'];
const CATEGORIES = [
  { value: 'restaurant', label: '🍽️ Restaurant' },
  { value: 'cafe', label: '☕ Café' },
  { value: 'bar', label: '🍸 Bar / Drinks' },
  { value: 'beach', label: '🏖️ Beach' },
  { value: 'nature', label: '🌿 Nature / Outdoors' },
  { value: 'museum', label: '🎨 Museum / Art' },
  { value: 'shopping', label: '🛍️ Shopping' },
  { value: 'activity', label: '🎯 Activity / Experience' },
  { value: 'landmark', label: '🏛️ Landmark / Viewpoint' },
  { value: 'other', label: '📌 Other' },
];

const BUSY_TIME_OPTIONS = ['Weekday mornings', 'Weekday afternoons', 'Weekend mornings', 'Weekend afternoons', 'Evenings', 'Always busy', 'Never too crowded'];

function StarRating({ value, onChange }) {
  const [hover, setHover] = useState(0);
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {[1, 2, 3, 4, 5].map(n => (
        <button key={n} type="button" onClick={() => onChange(n)} onMouseEnter={() => setHover(n)} onMouseLeave={() => setHover(0)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: n <= (hover || value) ? 'var(--sun)' : 'var(--sand-border)', fontSize: 22 }}>
          ★
        </button>
      ))}
      {value > 0 && <span style={{ fontSize: 12, color: 'var(--ink-light)', alignSelf: 'center', marginLeft: 4 }}>{value}.0</span>}
    </div>
  );
}

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
      <input
        className="chip-input"
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addChip(); } }}
        placeholder={placeholder}
      />
    </div>
  );
}

async function parseURLWithAI(url) {
  const platform = url.includes('instagram') ? 'Instagram' :
    url.includes('reddit') ? 'Reddit' :
    url.includes('tiktok') ? 'TikTok' :
    url.includes('yelp') ? 'Yelp' :
    url.includes('google') ? 'Google Maps' : 'web';

  const prompt = `A user shared this URL from ${platform}: ${url}

Based on the URL alone, try to extract or infer location details about a Southern California place. 
Respond ONLY in valid JSON (no markdown, no backticks) with this structure:
{
  "name": "place name or empty string",
  "category": "restaurant|cafe|bar|beach|nature|museum|shopping|activity|landmark|other",
  "area": "Los Angeles|Orange County|San Diego|Inland Empire|Ventura County|Coachella Valley or empty",
  "rating": null or number 1-5,
  "notes": "short description based on URL context",
  "busyTimes": { "peak": "" },
  "tags": [],
  "source": "${platform}",
  "sourceUrl": "${url}"
}`;

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
  const text = data.content?.map(c => c.text || '').join('');
  try {
    const clean = text.replace(/```json|```/g, '').trim();
    return JSON.parse(clean);
  } catch {
    return null;
  }
}

export default function LocationModal({ editing, onSave, onClose }) {
  const [mode, setMode] = useState(editing ? 'manual' : 'url');
  const [url, setUrl] = useState(editing?.sourceUrl || '');
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState('');

  const [form, setForm] = useState({
    name: '', category: 'restaurant', area: 'Los Angeles',
    rating: 0, notes: '', reviews: '', tags: [],
    images: [], busyTimes: { peak: '', quiet: '' },
    source: '', sourceUrl: '',
    ...editing,
  });

  const fileRef = useRef();

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleImport = async () => {
    if (!url.trim()) return;
    setImporting(true);
    setImportError('');
    try {
      const data = await parseURLWithAI(url);
      if (data) {
        setForm(f => ({
          ...f,
          name: data.name || f.name,
          category: data.category || f.category,
          area: data.area || f.area,
          rating: data.rating || f.rating,
          notes: data.notes || f.notes,
          busyTimes: data.busyTimes || f.busyTimes,
          tags: data.tags?.length ? data.tags : f.tags,
          source: data.source || f.source,
          sourceUrl: url,
        }));
        setMode('manual');
      } else {
        setImportError('Could not parse this link. Fill in the details manually below.');
        setMode('manual');
        set('sourceUrl', url);
      }
    } catch {
      setImportError('Import failed. You can fill in details manually.');
      setMode('manual');
    }
    setImporting(false);
  };

  const handleImageAdd = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = ev => set('images', [...(form.images || []), ev.target.result]);
      reader.readAsDataURL(file);
    });
  };

  const handleSave = () => {
    if (!form.name.trim()) return;
    onSave({ ...form, id: editing?.id });
  };

  const isValid = form.name.trim().length > 0;

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-wide">
        <div className="modal-header">
          <h2>{editing ? 'Edit Place' : 'Add a Place'}</h2>
          <button className="btn-icon" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="modal-body">
          {/* Mode toggle */}
          {!editing && (
            <div style={{ display: 'flex', gap: 6, marginBottom: 18, background: 'var(--sand)', borderRadius: 'var(--radius-sm)', padding: 4 }}>
              <ModeBtn active={mode === 'url'} onClick={() => setMode('url')} icon={<Link size={14} />} label="Paste a Link" />
              <ModeBtn active={mode === 'manual'} onClick={() => setMode('manual')} icon={<PenSquare size={14} />} label="Fill In Manually" />
            </div>
          )}

          {/* URL mode */}
          {mode === 'url' && (
            <div>
              <div style={{ fontSize: 13, color: 'var(--ink-mid)', marginBottom: 10, lineHeight: 1.5 }}>
                Paste a link from <strong>Instagram</strong>, <strong>Reddit</strong>, <strong>TikTok</strong>, <strong>Yelp</strong>, or <strong>Google Maps</strong> and we'll try to pull the details.
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  placeholder="https://www.instagram.com/p/... or reddit.com/r/..."
                  onKeyDown={e => e.key === 'Enter' && handleImport()}
                  style={{ flex: 1 }}
                />
                <button className="btn btn-primary" onClick={handleImport} disabled={importing || !url.trim()} style={{ flexShrink: 0 }}>
                  {importing ? <Loader size={14} className="spin" /> : 'Import'}
                </button>
              </div>
              {importError && <div style={{ fontSize: 12, color: 'var(--rose)', marginTop: 8 }}>{importError}</div>}
              <div style={{ marginTop: 14, textAlign: 'center' }}>
                <button className="btn btn-ghost btn-sm" onClick={() => setMode('manual')}>
                  <PenSquare size={12} /> Skip and fill manually
                </button>
              </div>
            </div>
          )}

          {/* Manual form */}
          {mode === 'manual' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
              {/* Name */}
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label>Place Name *</label>
                <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Gjusta, Malibu Pier, The Last Bookstore" />
              </div>

              {/* Category */}
              <div className="form-group">
                <label>Category</label>
                <select value={form.category} onChange={e => set('category', e.target.value)}>
                  {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>

              {/* Area */}
              <div className="form-group">
                <label>SoCal Area</label>
                <select value={form.area} onChange={e => set('area', e.target.value)}>
                  {AREAS.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>

              {/* Rating */}
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label>Your Rating</label>
                <StarRating value={form.rating || 0} onChange={v => set('rating', v)} />
              </div>

              {/* Notes / description */}
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label>Notes / Description</label>
                <textarea value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="What's special about this place? What to order/do?" rows={3} />
              </div>

              {/* Reviews / commentaries */}
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label>Reviews & Commentaries</label>
                <textarea value={form.reviews} onChange={e => set('reviews', e.target.value)} placeholder="Paste in review text, social media captions, or Reddit comments…" rows={3} />
              </div>

              {/* Busy times */}
              <div className="form-group">
                <label>Usually Busy</label>
                <select value={form.busyTimes?.peak || ''} onChange={e => set('busyTimes', { ...form.busyTimes, peak: e.target.value })}>
                  <option value="">Unknown</option>
                  {BUSY_TIME_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>

              {/* Quiet times */}
              <div className="form-group">
                <label>Best Time to Visit</label>
                <input value={form.busyTimes?.quiet || ''} onChange={e => set('busyTimes', { ...form.busyTimes, quiet: e.target.value })} placeholder="e.g. Weekday mornings, after 3pm" />
              </div>

              {/* Tags */}
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label>Tags (press Enter to add)</label>
                <ChipInput value={form.tags} onChange={v => set('tags', v)} placeholder="vegan-friendly, dog-ok, date-night…" />
              </div>

              {/* Source */}
              <div className="form-group">
                <label>Source</label>
                <input value={form.source} onChange={e => set('source', e.target.value)} placeholder="Instagram, Reddit, friend, etc." />
              </div>

              <div className="form-group">
                <label>Source URL</label>
                <input value={form.sourceUrl} onChange={e => set('sourceUrl', e.target.value)} placeholder="https://..." />
              </div>

              {/* Images */}
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label>Images</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-start' }}>
                  {(form.images || []).map((img, i) => (
                    <div key={i} style={{ position: 'relative' }}>
                      <img src={img} alt="" style={{ width: 72, height: 60, objectFit: 'cover', borderRadius: 8, border: '1.5px solid var(--sand-border)' }} onError={e => e.target.style.display = 'none'} />
                      <button className="btn-icon" style={{ position: 'absolute', top: -6, right: -6, background: 'white', border: '1px solid var(--sand-border)', borderRadius: '50%', padding: 3, boxShadow: 'var(--shadow-sm)' }}
                        onClick={() => set('images', form.images.filter((_, j) => j !== i))}>
                        <X size={10} />
                      </button>
                    </div>
                  ))}
                  <button className="btn btn-ghost btn-sm" onClick={() => fileRef.current?.click()} style={{ height: 60, minWidth: 72 }}>
                    <Upload size={13} /> Upload
                  </button>
                  <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={handleImageAdd} />
                  {/* Or paste URL */}
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center', width: '100%', marginTop: 4 }}>
                    <input
                      placeholder="Or paste image URL…"
                      style={{ flex: 1, fontSize: 12 }}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && e.target.value.trim()) {
                          set('images', [...(form.images || []), e.target.value.trim()]);
                          e.target.value = '';
                        }
                      }}
                    />
                    <span style={{ fontSize: 11, color: 'var(--ink-light)', flexShrink: 0 }}>press Enter</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {mode === 'manual' && (
          <div className="modal-footer">
            <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={!isValid}>
              {editing ? 'Save Changes' : 'Add Place'}
            </button>
          </div>
        )}
      </div>

      <style>{`
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

function ModeBtn({ active, onClick, icon, label }) {
  return (
    <button onClick={onClick} style={{
      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
      padding: '8px 12px', border: 'none', borderRadius: 'var(--radius-sm)',
      background: active ? 'white' : 'transparent',
      color: active ? 'var(--ink)' : 'var(--ink-light)',
      fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: active ? 600 : 400,
      cursor: 'pointer', boxShadow: active ? 'var(--shadow-sm)' : 'none',
      transition: 'all 0.15s',
    }}>
      {icon} {label}
    </button>
  );
}
