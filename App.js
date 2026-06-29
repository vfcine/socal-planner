import React, { useState } from 'react';
import { Plus, Search, MapPin, Star, Edit2, Trash2, GripVertical } from 'lucide-react';
import { useDraggable } from '@dnd-kit/core';

const CATEGORY_TAGS = {
  restaurant: { label: 'Restaurant', color: 'var(--sun)', bg: 'var(--sun-pale)' },
  cafe: { label: 'Café', color: '#8B5E3C', bg: '#F5EDE4' },
  bar: { label: 'Bar/Drinks', color: 'var(--ocean)', bg: 'var(--ocean-pale)' },
  nature: { label: 'Nature', color: 'var(--sage)', bg: 'var(--sage-pale)' },
  beach: { label: 'Beach', color: '#2E6E8E', bg: '#D6EBF5' },
  museum: { label: 'Museum/Art', color: '#7B5EA7', bg: '#EDE8F5' },
  shopping: { label: 'Shopping', color: '#C45A5A', bg: 'var(--rose-pale)' },
  activity: { label: 'Activity', color: '#4A7C59', bg: '#E4F0E7' },
  landmark: { label: 'Landmark', color: '#7A6020', bg: '#F5EED6' },
  other: { label: 'Other', color: 'var(--ink-mid)', bg: 'var(--sand-dark)' },
};

function DraggableLocationCard({ loc, onEdit, onDelete }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: loc.id,
    data: { type: 'location', location: loc },
  });

  const style = transform ? {
    transform: `translate(${transform.x}px, ${transform.y}px)`,
    zIndex: 999, opacity: 0.85,
  } : {};

  const cat = CATEGORY_TAGS[loc.category] || CATEGORY_TAGS.other;

  return (
    <div
      ref={setNodeRef}
      style={{
        background: 'white',
        border: '1.5px solid var(--sand-border)',
        borderRadius: 'var(--radius-md)',
        padding: '12px',
        cursor: isDragging ? 'grabbing' : 'grab',
        boxShadow: isDragging ? 'var(--shadow-lg)' : 'var(--shadow-sm)',
        transition: isDragging ? 'none' : 'box-shadow 0.15s',
        position: 'relative',
        ...style,
      }}
      {...attributes}
      {...listeners}
    >
      {/* Grip handle */}
      <div style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: 'var(--sand-border)' }}>
        <GripVertical size={14} />
      </div>

      <div style={{ marginLeft: 16 }}>
        {/* Top row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--ink)', lineHeight: 1.3, marginBottom: 2 }}>
              {loc.name}
            </div>
            {loc.area && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 3, color: 'var(--ink-light)', fontSize: 11 }}>
                <MapPin size={10} />
                <span>{loc.area}</span>
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
            <button className="btn-icon" style={{ padding: 4 }} onClick={(e) => { e.stopPropagation(); onEdit(loc); }} title="Edit">
              <Edit2 size={12} />
            </button>
            <button className="btn-icon" style={{ padding: 4, color: 'var(--rose)' }} onClick={(e) => { e.stopPropagation(); onDelete(loc.id); }} title="Delete">
              <Trash2 size={12} />
            </button>
          </div>
        </div>

        {/* Category + Rating */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ background: cat.bg, color: cat.color, borderRadius: 99, padding: '2px 8px', fontSize: 10, fontWeight: 600 }}>
            {cat.label}
          </span>
          {loc.rating && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, color: 'var(--sun)' }}>
              <Star size={10} fill="currentColor" />
              <span style={{ color: 'var(--ink-mid)', fontWeight: 500 }}>{loc.rating}</span>
            </span>
          )}
          {loc.busyTimes && loc.busyTimes.peak && (
            <span style={{ fontSize: 10, color: 'var(--ink-light)' }}>
              Peak: {loc.busyTimes.peak}
            </span>
          )}
        </div>

        {/* Image strip if present */}
        {loc.images && loc.images.length > 0 && (
          <div style={{ display: 'flex', gap: 4, marginTop: 8, overflow: 'hidden' }}>
            {loc.images.slice(0, 3).map((img, i) => (
              <img key={i} src={img} alt="" style={{
                width: 44, height: 36, objectFit: 'cover',
                borderRadius: 4, flexShrink: 0,
              }} onError={(e) => { e.target.style.display = 'none'; }} />
            ))}
          </div>
        )}

        {loc.source && (
          <div style={{ marginTop: 6, fontSize: 10, color: 'var(--ink-light)', fontStyle: 'italic' }}>
            via {loc.source}
          </div>
        )}
      </div>
    </div>
  );
}

export default function Sidebar({ locations, onAdd, onEdit, onDelete }) {
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('all');

  const filtered = locations.filter(loc => {
    const matchesSearch = !search || loc.name.toLowerCase().includes(search.toLowerCase()) || (loc.area || '').toLowerCase().includes(search.toLowerCase());
    const matchesCat = filterCat === 'all' || loc.category === filterCat;
    return matchesSearch && matchesCat;
  });

  return (
    <aside style={{
      width: 280, flexShrink: 0,
      background: 'var(--sand)',
      borderRight: '1.5px solid var(--sand-border)',
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{ padding: '14px 16px 10px', borderBottom: '1.5px solid var(--sand-border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 16, color: 'var(--ink)' }}>
            Saved Places
          </span>
          <button className="btn btn-primary btn-sm" onClick={onAdd}>
            <Plus size={14} /> Add
          </button>
        </div>

        {/* Search */}
        <div style={{ position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-light)' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search places…"
            style={{ paddingLeft: 32, fontSize: 12 }}
          />
        </div>

        {/* Category filter */}
        <div style={{ display: 'flex', gap: 4, marginTop: 8, overflowX: 'auto', paddingBottom: 2 }}>
          <FilterChip label="All" value="all" active={filterCat === 'all'} onClick={() => setFilterCat('all')} />
          {Object.entries(CATEGORY_TAGS).slice(0, 5).map(([k, v]) => (
            <FilterChip key={k} label={v.label.split('/')[0]} value={k} active={filterCat === k} onClick={() => setFilterCat(k)} />
          ))}
        </div>
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📍</div>
            <p>{locations.length === 0 ? 'Add a place to get started, or paste a link to import from Instagram, Reddit, or TikTok.' : 'No places match your search.'}</p>
            {locations.length === 0 && (
              <button className="btn btn-primary btn-sm" onClick={onAdd} style={{ marginTop: 6 }}>
                <Plus size={13} /> Add Place
              </button>
            )}
          </div>
        ) : (
          filtered.map(loc => (
            <DraggableLocationCard key={loc.id} loc={loc} onEdit={onEdit} onDelete={onDelete} />
          ))
        )}
      </div>

      <div style={{ padding: '10px 16px', borderTop: '1.5px solid var(--sand-border)', fontSize: 11, color: 'var(--ink-light)', textAlign: 'center' }}>
        Drag cards onto the itinerary →
      </div>
    </aside>
  );
}

function FilterChip({ label, value, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      padding: '3px 10px',
      borderRadius: 99,
      border: '1.5px solid',
      borderColor: active ? 'var(--sun)' : 'var(--sand-border)',
      background: active ? 'var(--sun)' : 'transparent',
      color: active ? 'white' : 'var(--ink-mid)',
      fontSize: 10, fontWeight: 600,
      cursor: 'pointer', flexShrink: 0,
      fontFamily: 'var(--font-body)',
      transition: 'all 0.15s',
    }}>
      {label}
    </button>
  );
}
