import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { API_BASE } from '../config';

interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  permissions?: string[];
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (userData: User) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
  isAdmin: boolean;
  hasPermission: (permission: string) => boolean;
  topRole: string;
}

// Role hierarchy - higher index = higher level
const ROLE_HIERARCHY = [
  'Membro',
  'Editor',
  'Moderador',
  'Administrador',
  'Super Administrador',
];

export function getTopRole(roleString: string | undefined): string {
  if (!roleString) return 'Membro';
  const userRoles = roleString.split(',').map(r => r.trim());
  // Return the highest role found
  for (let i = ROLE_HIERARCHY.length - 1; i >= 0; i--) {
    if (userRoles.some(r => r.toLowerCase().includes(ROLE_HIERARCHY[i].toLowerCase().split(' ')[0]))) {
      return ROLE_HIERARCHY[i];
    }
  }
  return userRoles[0] || 'Membro';
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [visitorPermissions, setVisitorPermissions] = useState<string[]>(["view_titles", "view_reviews", "play_videos", "view_videos"]);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/check_auth.php`, {
        credentials: 'include'
      });
      const data = await res.json();
      if (data.authenticated) {
        setUser(data.user);
      } else {
        setUser(null);
        if (data.visitor_permissions) {
          setVisitorPermissions(data.visitor_permissions);
        }
      }
    } catch (err) {}
  }, []);

  useEffect(() => {
    // Check if user is already logged in on refresh
    refreshUser().finally(() => setLoading(false));
  }, []);

  const login = (userData: User) => {
    setUser(userData);
  };

  const logout = () => {
    fetch(`${API_BASE}/logout.php`, {
      credentials: 'include'
    }); // Simple logout script
    setUser(null);
  };

  const isAdmin = user?.role?.split(',').map(r => r.trim()).some(r => 
    r === 'Administrador' || /super/i.test(r)
  ) || false;

  const hasPermission = useCallback((permission: string) => {
    if (!user) {
      return visitorPermissions.includes(permission);
    }
    const roles = user?.role?.split(',').map(r => r.trim()) || [];
    if (roles.some(r => /super/i.test(r))) return true;
    return user?.permissions?.includes(permission) || false;
  }, [user, visitorPermissions]);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser, isAdmin, hasPermission, topRole: getTopRole(user?.role) }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
