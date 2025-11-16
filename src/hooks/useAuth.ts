import { useState, useEffect } from 'react';
import { localAuthService } from '../services/LocalAuthService';

interface User {
  id: string;
  email: string;
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setUser(localAuthService.getUser());
    setLoading(false);

    const { unsubscribe } = localAuthService.onAuthStateChange((event, session) => {
      setUser(localAuthService.getUser());
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signOut = async () => {
    await localAuthService.signOut();
  };

  return {
    user,
    loading,
    signOut,
    isAuthenticated: !!user
  };
};