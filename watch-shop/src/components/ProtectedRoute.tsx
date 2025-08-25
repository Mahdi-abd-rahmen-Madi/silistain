import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// ProtectedRoute: For any authenticated user
export function ProtectedRoute({ children }: { children: React.JSX.Element }) {
  const { currentUser, loading } = useAuth();
  const [isInitialized, setIsInitialized] = useState(false);
  const location = useLocation();

  useEffect(() => {
    if (!loading) {
      setIsInitialized(true);
    }
  }, [loading]);

  // Show loading spinner while checking auth state
  if (loading || !isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  // If user is not authenticated, redirect to login with the return location
  if (!currentUser) {
    const from = location.pathname === '/login' 
      ? '/' 
      : location.pathname + location.search;
    
    return <Navigate to="/login" state={{ from }} replace />;
  }

  // If user is authenticated, render the protected content
  return children;
}

// AdminProtectedRoute: For admin users only
export function AdminProtectedRoute({ children }: { children: React.JSX.Element }) {
  const { currentUser, loading } = useAuth();
  const [isInitialized, setIsInitialized] = useState(false);
  const location = useLocation();

  useEffect(() => {
    if (!loading) {
      setIsInitialized(true);
    }
  }, [loading]);

  // Show loading spinner while checking auth state
  if (loading || !isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  // If user is not authenticated, redirect to login
  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If user is not an admin, redirect to home or show unauthorized
  if (!currentUser.isAdmin) {
    return <Navigate to="/unauthorized" replace />;
  }

  // If user is an admin, render the protected content
  return children;
}
