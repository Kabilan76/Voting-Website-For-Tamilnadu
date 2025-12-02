// AuthContext.tsx
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

type UserRole = 'admin' | 'voter' | null;

interface AuthContextType {
  isAuthenticated: boolean;
  userRole: UserRole;
  userName: string | null;
  userDistrict: string | null;
  userConstituency: string | null;
  phoneNumber: string | null;
  hasVoted: boolean;
  login: (role: UserRole, district: string, name: string, phone?: string, constituency?: string) => void;
  logout: () => void;
  setHasVoted: (value: boolean) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

// Use localStorage instead of sessionStorage
const getStoredAuthData = () => {
  const storedData = localStorage.getItem('authData');
  return storedData ? JSON.parse(storedData) : null;
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const storedData = getStoredAuthData();

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!storedData);
  const [userRole, setUserRole] = useState<UserRole>(storedData?.userRole || null);
  const [userName, setUserName] = useState<string | null>(storedData?.userName || null);
  const [userDistrict, setUserDistrict] = useState<string | null>(storedData?.userDistrict || null);
  const [userConstituency, setUserConstituency] = useState<string | null>(storedData?.userConstituency || null);
  const [phoneNumber, setPhoneNumber] = useState<string | null>(storedData?.phoneNumber || null);
  const [hasVoted, setHasVoted] = useState<boolean>(storedData?.hasVoted || false);

  // Sync changes to localStorage
  useEffect(() => {
    if (isAuthenticated) {
      const authData = {
        userRole,
        userName,
        userDistrict,
        userConstituency,
        phoneNumber,
        hasVoted,
      };
      localStorage.setItem('authData', JSON.stringify(authData));
    } else {
      localStorage.removeItem('authData');
    }
  }, [isAuthenticated, userRole, userName, userDistrict, userConstituency, phoneNumber, hasVoted]);

  const login = (role: UserRole, district: string, name: string, phone?: string, constituency?: string) => {
    setIsAuthenticated(true);
    setUserRole(role);
    setUserName(name);
    setUserDistrict(district);
    setUserConstituency(constituency || null);
    setPhoneNumber(phone || null);
    setHasVoted(false);
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUserRole(null);
    setUserName(null);
    setUserDistrict(null);
    setUserConstituency(null);
    setPhoneNumber(null);
    setHasVoted(false);
    localStorage.removeItem('authData');
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        userRole,
        userName,
        userDistrict,
        userConstituency,
        phoneNumber,
        hasVoted,
        login,
        logout,
        setHasVoted,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
