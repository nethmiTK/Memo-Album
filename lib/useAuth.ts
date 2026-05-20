import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }

    setLoading(false);
  }, []);

  return { user, token, loading };
};

export const useProtectedRoute = (requiredRoles?: string[]) => {
  const router = useRouter();
  const { user, token, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    // If no token or user, redirect to login
    if (!token || !user) {
      router.push('/login');
      return;
    }

    // Check if user has required role
    if (requiredRoles && !requiredRoles.includes(user.role?.toLowerCase())) {
      router.push('/login');
      return;
    }

    // Check if user status is active
    if (user.status !== 'active') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      router.push('/login');
      return;
    }
  }, [user, token, loading, requiredRoles, router]);

  return { user, token, loading };
};

export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('savedEmail');
  window.location.href = '/login';
};
