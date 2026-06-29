import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import ItineraryBoard from './components/ItineraryBoard';
import LocationModal from './components/LocationModal';
import PreferencesModal from './components/PreferencesModal';
import AIRecommendations from './components/AIRecommendations';
import Header from './components/Header';
import './styles/global.css';

const DEFAULT_PREFS = {
  areas: ['Los Angeles', 'Orange County', 'San Diego', 'Inland Empire'],
  selectedArea: 'Los Angeles',
  maxDistance: 30,
  noCar: false,
  allergies: [],
  interests: [],
  dietaryPrefs: [],
};

export default function App() {
  const [locations, setLocations] = useState([]);
  const [itineraryDays, setItineraryDays] = useState([
    { id: 'day-1', date: new Date().toISOString().split('T')[0], label: 'Day 1', slots: [] }
  ]);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [editingLocation, setEditingLocation] = useState(null);
  const [showPrefs, setShowPrefs] = useState(false);
  const [preferences, setPreferences] = useState(DEFAULT_PREFS);
  const [activeDay, setActiveDay] = useState('day-1');
  const [showAI, setShowAI] = useState(false);
  const [aiContext, setAiContext] = useState(null);

  const addLocation = (loc) => {
    if (editingLocation) {
      setLocations(prev => prev.map(l => l.id === loc.id ? loc : l));
      setEditingLocation(null);
    } else {
      setLocations(prev => [...prev, { ...loc, id: `loc-${Date.now()}` }]);
    }
    setShowLocationModal(false);
  };

  const deleteLocation = (id) => {
    setLocations(prev => prev.filter(l => l.id !== id));
    setItineraryDays(prev => prev.map(day => ({
      ...day,
      slots: day.slots.filter(s => s.locationId !== id)
    })));
  };

  const openEdit = (loc) => {
    setEditingLocation(loc);
    setShowLocationModal(true);
  };

  const addDay = () => {
    const newId = `day-${Date.now()}`;
    const lastDay = itineraryDays[itineraryDays.length - 1];
    const lastDate = new Date(lastDay.date);
    lastDate.setDate(lastDate.getDate() + 1);
    setItineraryDays(prev => [...prev, {
      id: newId,
      date: lastDate.toISOString().split('T')[0],
      label: `Day ${itineraryDays.length + 1}`,
      slots: []
    }]);
    setActiveDay(newId);
  };

  const removeDay = (id) => {
    if (itineraryDays.length === 1) return;
    setItineraryDays(prev => prev.filter(d => d.id !== id));
    if (activeDay === id) setActiveDay(itineraryDays[0].id);
  };

  const updateDaySlots = (dayId, slots) => {
    setItineraryDays(prev => prev.map(d => d.id === dayId ? { ...d, slots } : d));
  };

  const requestAIFill = (dayId, slotHour) => {
    const day = itineraryDays.find(d => d.id === dayId);
    setAiContext({ dayId, slotHour, day, preferences, existingLocations: locations });
    setShowAI(true);
  };

  const addAISuggestionToSlot = (dayId, slot, newLoc) => {
    // Add the location to saved places
    if (newLoc) {
      setLocations(prev => [...prev, newLoc]);
    }
    // Add the slot to the day
    setItineraryDays(prev => prev.map(d => {
      if (d.id !== dayId) return d;
      const cleanSlot = { id: slot.id, locationId: slot.locationId, hour: slot.hour, duration: slot.duration };
      return { ...d, slots: [...d.slots, cleanSlot].sort((a, b) => a.hour - b.hour) };
    }));
    setShowAI(false);
  };

  return (
    <div className="app-root">
      <Header
        preferences={preferences}
        onOpenPrefs={() => setShowPrefs(true)}
      />
      <div className="app-body">
        <Sidebar
          locations={locations}
          onAdd={() => { setEditingLocation(null); setShowLocationModal(true); }}
          onEdit={openEdit}
          onDelete={deleteLocation}
        />
        <ItineraryBoard
          itineraryDays={itineraryDays}
          locations={locations}
          activeDay={activeDay}
          setActiveDay={setActiveDay}
          onAddDay={addDay}
          onRemoveDay={removeDay}
          onUpdateSlots={updateDaySlots}
          onRequestAI={requestAIFill}
          preferences={preferences}
        />
      </div>

      {showLocationModal && (
        <LocationModal
          editing={editingLocation}
          onSave={addLocation}
          onClose={() => { setShowLocationModal(false); setEditingLocation(null); }}
        />
      )}

      {showPrefs && (
        <PreferencesModal
          preferences={preferences}
          onChange={setPreferences}
          onClose={() => setShowPrefs(false)}
        />
      )}

      {showAI && aiContext && (
        <AIRecommendations
          context={aiContext}
          onAdd={addAISuggestionToSlot}
          onClose={() => setShowAI(false)}
        />
      )}
    </div>
  );
}
