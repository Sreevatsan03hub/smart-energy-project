import React, { createContext, useContext, useState, useEffect } from 'react';
import { ALL_REGION_CODES } from '../services/constants';

const AuthContext = createContext();

export const DEMO_PERSONAS = [
  {
    id: "admin",
    name: "Dr. Rachel Vance (Global Facility Director)",
    username: "admin",
    role: "admin",
    assignedRegion: "ALL",
    badgeLabel: "👔 Central Admin (All 11 Regions)",
    avatar: "🏢"
  },
  {
    id: "pjme_user",
    name: "Alex Mercer (Eastern Grid Engineer)",
    username: "pjme_user",
    role: "regional_user",
    assignedRegion: "PJME",
    badgeLabel: "🔒 Facility Operator (PJME Grid)",
    avatar: "⚡"
  },
  {
    id: "aep_user",
    name: "Samantha Wright (AEP Substation Lead)",
    username: "aep_user",
    role: "regional_user",
    assignedRegion: "AEP",
    badgeLabel: "🔒 Facility Operator (AEP Grid)",
    avatar: "🔋"
  },
  {
    id: "comed_user",
    name: "David Chen (Chicago Metro Lead)",
    username: "comed_user",
    role: "regional_user",
    assignedRegion: "COMED",
    badgeLabel: "🔒 Facility Operator (COMED Grid)",
    avatar: "🏙️"
  },
  {
    id: "dayton_user",
    name: "Marcus Vance (Dayton Station Tech)",
    username: "dayton_user",
    role: "regional_user",
    assignedRegion: "DAYTON",
    badgeLabel: "🔒 Facility Operator (DAYTON Grid)",
    avatar: "🏭"
  },
  {
    id: "deok_user",
    name: "Elena Rostova (Duke Energy Lead)",
    username: "deok_user",
    role: "regional_user",
    assignedRegion: "DEOK",
    badgeLabel: "🔒 Facility Operator (DEOK Grid)",
    avatar: "⚡"
  },
  {
    id: "dom_user",
    name: "Carlos Mendez (Dominion Virginia Tech)",
    username: "dom_user",
    role: "regional_user",
    assignedRegion: "DOM",
    badgeLabel: "🔒 Facility Operator (DOM Grid)",
    avatar: "🔌"
  },
  {
    id: "duq_user",
    name: "Sarah Jenkins (Duquesne Light Tech)",
    username: "duq_user",
    role: "regional_user",
    assignedRegion: "DUQ",
    badgeLabel: "🔒 Facility Operator (DUQ Grid)",
    avatar: "💡"
  },
  {
    id: "ekpc_user",
    name: "Robert Taylor (East Kentucky Lead)",
    username: "ekpc_user",
    role: "regional_user",
    assignedRegion: "EKPC",
    badgeLabel: "🔒 Facility Operator (EKPC Grid)",
    avatar: "🔋"
  },
  {
    id: "fe_user",
    name: "Lisa Wong (FirstEnergy Specialist)",
    username: "fe_user",
    role: "regional_user",
    assignedRegion: "FE",
    badgeLabel: "🔒 Facility Operator (FE Grid)",
    avatar: "⚡"
  },
  {
    id: "ni_user",
    name: "James Miller (Northern Indiana Tech)",
    username: "ni_user",
    role: "regional_user",
    assignedRegion: "NI",
    badgeLabel: "🔒 Facility Operator (NI Grid)",
    avatar: "🏭"
  },
  {
    id: "pjmw_user",
    name: "Karen Brooks (PJM Western Engineer)",
    username: "pjmw_user",
    role: "regional_user",
    assignedRegion: "PJMW",
    badgeLabel: "🔒 Facility Operator (PJMW Grid)",
    avatar: "🔌"
  }
];

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('smart_energy_user');
    return saved ? JSON.parse(saved) : null; // Start at Login page if not logged in
  });

  const [selectedRegion, setSelectedRegion] = useState(() => {
    return currentUser?.role === 'admin' ? 'PJME' : (currentUser?.assignedRegion || 'PJME');
  });

  const [tariffRate, setTariffRate] = useState(0.12); // $0.12 / kWh standard US commercial rate

  useEffect(() => {
    if (currentUser?.role === 'regional_user') {
      setSelectedRegion(currentUser.assignedRegion);
    }
  }, [currentUser]);

  const login = (username, password) => {
    // Check demo credentials
    const persona = DEMO_PERSONAS.find(p => p.username === username.toLowerCase());
    if (persona) {
      setCurrentUser(persona);
      localStorage.setItem('smart_energy_user', JSON.stringify(persona));
      localStorage.setItem('smart_energy_token', `jwt_demo_${persona.id}_token`);
      return { success: true };
    }

    // Generic regional check (e.g. fe_user, dom_user)
    const matchedRegion = ALL_REGION_CODES.find(r => username.toLowerCase().startsWith(r.toLowerCase()));
    if (matchedRegion) {
      const customRegionalUser = {
        id: `${matchedRegion.toLowerCase()}_user`,
        name: `${matchedRegion} Grid Operator`,
        username,
        role: "regional_user",
        assignedRegion: matchedRegion,
        badgeLabel: `🔒 Facility Operator (${matchedRegion} Grid)`,
        avatar: "⚡"
      };
      setCurrentUser(customRegionalUser);
      localStorage.setItem('smart_energy_user', JSON.stringify(customRegionalUser));
      localStorage.setItem('smart_energy_token', `jwt_demo_${matchedRegion}_token`);
      return { success: true };
    }

    return { success: false, message: "Invalid username or password" };
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('smart_energy_user');
    localStorage.removeItem('smart_energy_token');
  };

  const switchPersona = (personaId) => {
    const target = DEMO_PERSONAS.find(p => p.id === personaId);
    if (target) {
      setCurrentUser(target);
      localStorage.setItem('smart_energy_user', JSON.stringify(target));
      localStorage.setItem('smart_energy_token', `jwt_demo_${target.id}_token`);
    }
  };

  const setRegionSecurely = (region) => {
    if (currentUser?.role === 'admin') {
      setSelectedRegion(region);
    } else {
      // Hard enforce regional isolation
      setSelectedRegion(currentUser.assignedRegion);
    }
  };

  return (
    <AuthContext.Provider value={{
      currentUser,
      selectedRegion,
      setSelectedRegion: setRegionSecurely,
      tariffRate,
      setTariffRate,
      login,
      logout,
      switchPersona,
      isAdmin: currentUser?.role === 'admin',
      isRegionalUser: currentUser?.role === 'regional_user',
      availableRegions: currentUser?.role === 'admin' ? ALL_REGION_CODES : [currentUser?.assignedRegion]
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
