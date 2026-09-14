import React, { createContext, useContext, useState, useCallback } from 'react';

const AuthContext = createContext();

const DEMO_ACCOUNTS = {
  government: {
    role: 'government',
    name: 'Dr. Rajeev Kumar Sharma, IAS',
    designation: 'Joint Secretary (Infrastructure)',
    ministry: 'Ministry of Statistics & Programme Implementation (MoSPI)',
    parichayId: 'NIC-GOV-MoSPI-2024-0847',
    clearanceLevel: 'Level-4 (Top Secret)',
    avatar: '🏛️',
  },
  vendor: {
    role: 'vendor',
    name: 'L&T Infrastructure Ltd.',
    gstin: '27AABCT1332Q1Z5',
    gstVerified: true,
    gstLegalName: 'Larsen & Toubro Infrastructure Ltd.',
    gstStatus: 'ACTIVE',
    taxpayerType: 'Regular – Large Taxpayer',
    msmeRegistered: false,
    contactEmail: 'bids@larsentoubro.com',
    avatar: '🏢',
  },
  citizen: {
    role: 'citizen',
    name: 'Ananya Deshmukh',
    myBharatId: 'MB-IND-2026-784920',
    district: 'Pune',
    state: 'Maharashtra',
    verifiedBadge: true,
    avatar: '🇮🇳',
  },
};

// Simulated GSTIN validation
function simulateGSTINVerification(gstin) {
  const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  if (!gstRegex.test(gstin)) {
    return { valid: false, error: 'Invalid GSTIN format. Expected: 27AABCT1234F1Z8' };
  }
  return {
    valid: true,
    data: {
      gstin,
      gstVerified: true,
      gstLegalName: 'Verified Infrastructure Pvt. Ltd.',
      gstStatus: 'ACTIVE',
      taxpayerType: 'Regular',
      stateCode: gstin.substring(0, 2),
    },
  };
}

// Simulated My Bharat ID validation
function simulateMyBharatVerification(mbId) {
  const mbRegex = /^MB-IND-\d{4}-\d{4,8}$/;
  if (!mbRegex.test(mbId)) {
    return { valid: false, error: 'Invalid My Bharat ID format. Expected: MB-IND-2026-784920' };
  }
  return {
    valid: true,
    data: {
      myBharatId: mbId,
      verifiedBadge: true,
      verifiedAt: new Date().toISOString(),
    },
  };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('drishti_auth');
    return saved ? JSON.parse(saved) : null;
  });

  const login = useCallback((role, userData = {}) => {
    let profile;
    if (role === 'government') {
      profile = { ...DEMO_ACCOUNTS.government, ...userData };
    } else if (role === 'vendor') {
      profile = { ...DEMO_ACCOUNTS.vendor, ...userData };
    } else if (role === 'citizen') {
      profile = { ...DEMO_ACCOUNTS.citizen, ...userData };
    } else {
      profile = { role: 'guest', name: 'Guest User', avatar: '👤' };
    }
    setUser(profile);
    localStorage.setItem('drishti_auth', JSON.stringify(profile));
    return profile;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('drishti_auth');
  }, []);

  const verifyGSTIN = useCallback((gstin) => {
    return simulateGSTINVerification(gstin);
  }, []);

  const verifyMyBharatId = useCallback((mbId) => {
    return simulateMyBharatVerification(mbId);
  }, []);

  const switchRole = useCallback((newRole) => {
    login(newRole);
  }, [login]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoggedIn: !!user,
        role: user?.role || 'guest',
        login,
        logout,
        verifyGSTIN,
        verifyMyBharatId,
        switchRole,
        demoAccounts: DEMO_ACCOUNTS,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
