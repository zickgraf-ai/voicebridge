import { createContext, useContext, useReducer, useEffect } from 'react';
import { loadState, saveState } from '../utils/storage';

const AppContext = createContext(null);

const DEFAULT_PROFILE = {
  name: 'Sarah',
  dob: 'January 15, 1985',
  address: '',
  condition: 'Jaw Surgery Recovery',
  familyMembers: [
    { name: 'Jeff', relationship: 'Husband', photo: '\u{1F468}' },
    { name: 'Mom', relationship: 'Mother', photo: '\u{1F469}' },
    { name: 'Emily', relationship: 'Sister', photo: '\u{1F469}\u200D\u{1F9B0}' },
  ],
  medications: [
    { name: 'Ibuprofen 600mg', schedule: 'Every 6 hours', nextDose: '2:00 PM' },
    { name: 'Amoxicillin 500mg', schedule: 'Every 8 hours', nextDose: '4:00 PM' },
  ],
};

const DEFAULT_SETTINGS = {
  autoSpeak: true,
  voiceURI: '',
  voiceRate: 0.9,
  buttonSize: 'large',
  tabSize: 'xl',
  painReminder: 120,
  caregiverAlert: 6,
  voiceProvider: 'device',
  premiumVoice: 'nova',
  premiumOnly: false,
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_PROFILE':
      return {
        ...state,
        profile: typeof action.payload === 'function'
          ? action.payload(state.profile)
          : action.payload,
      };
    case 'SET_SETTINGS':
      return {
        ...state,
        settings: typeof action.payload === 'function'
          ? action.payload(state.settings)
          : action.payload,
      };
    case 'ADD_HISTORY': {
      const entry = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        ...action.payload,
      };
      return {
        ...state,
        history: [entry, ...state.history],
      };
    }
    case 'CLEAR_HISTORY':
      return { ...state, history: [] };
    case 'SET_FREQUENCY_MAP':
      return {
        ...state,
        frequencyMap: typeof action.payload === 'function'
          ? action.payload(state.frequencyMap)
          : action.payload,
      };
    case 'SET_PINNED_PHRASES':
      return {
        ...state,
        pinnedPhrases: typeof action.payload === 'function'
          ? action.payload(state.pinnedPhrases)
          : action.payload,
      };
    case 'SET_LOCATIONS':
      return {
        ...state,
        locations: typeof action.payload === 'function'
          ? action.payload(state.locations)
          : action.payload,
      };
    case 'SET_CUSTOM_PHRASES':
      return {
        ...state,
        customPhrases: typeof action.payload === 'function'
          ? action.payload(state.customPhrases)
          : action.payload,
      };
    case 'SET_CATEGORY_ORDER':
      return {
        ...state,
        categoryOrder: typeof action.payload === 'function'
          ? action.payload(state.categoryOrder)
          : action.payload,
      };
    default:
      return state;
  }
}

function loadInitialState() {
  return {
    profile: loadState('profile', DEFAULT_PROFILE),
    settings: loadState('settings', DEFAULT_SETTINGS),
    history: loadState('history', []),
    frequencyMap: loadState('frequencyMap', {}),
    pinnedPhrases: loadState('pinnedPhrases', []),
    locations: loadState('locations', []),
    customPhrases: loadState('customPhrases', []),
    categoryOrder: loadState('categoryOrder', null),
  };
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, null, loadInitialState);

  // Persist to localStorage on change
  useEffect(() => {
    saveState('profile', state.profile);
  }, [state.profile]);

  useEffect(() => {
    saveState('settings', state.settings);
  }, [state.settings]);

  useEffect(() => {
    saveState('history', state.history);
  }, [state.history]);

  useEffect(() => {
    saveState('frequencyMap', state.frequencyMap);
  }, [state.frequencyMap]);

  useEffect(() => {
    saveState('pinnedPhrases', state.pinnedPhrases);
  }, [state.pinnedPhrases]);

  useEffect(() => {
    saveState('locations', state.locations);
  }, [state.locations]);

  useEffect(() => {
    saveState('customPhrases', state.customPhrases);
  }, [state.customPhrases]);

  useEffect(() => {
    saveState('categoryOrder', state.categoryOrder);
  }, [state.categoryOrder]);

  const setProfile = (payload) => dispatch({ type: 'SET_PROFILE', payload });
  const setSettings = (payload) => dispatch({ type: 'SET_SETTINGS', payload });
  const addHistory = (entry) => dispatch({ type: 'ADD_HISTORY', payload: entry });
  const setFrequencyMap = (payload) => dispatch({ type: 'SET_FREQUENCY_MAP', payload });
  const setPinnedPhrases = (payload) => dispatch({ type: 'SET_PINNED_PHRASES', payload });
  const setLocations = (payload) => dispatch({ type: 'SET_LOCATIONS', payload });
  const setCustomPhrases = (payload) => dispatch({ type: 'SET_CUSTOM_PHRASES', payload });
  const setCategoryOrder = (payload) => dispatch({ type: 'SET_CATEGORY_ORDER', payload });

  return (
    <AppContext.Provider value={{
      state,
      setProfile,
      setSettings,
      addHistory,
      setFrequencyMap,
      setPinnedPhrases,
      setLocations,
      setCustomPhrases,
      setCategoryOrder,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used within AppProvider');
  return ctx;
}

export { DEFAULT_PROFILE, DEFAULT_SETTINGS };
