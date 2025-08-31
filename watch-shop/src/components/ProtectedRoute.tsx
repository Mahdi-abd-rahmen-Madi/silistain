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
    console.log('AdminProtectedRoute: No current user, redirecting to login');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check admin status using the same logic as in AuthContext
  const userEmail = currentUser.email || null;
  const isAdminByEmail = userEmail === import.meta.env.VITE_ADMIN_EMAIL;
  const isAdminByRole = currentUser.app_metadata?.role === 'admin' || 
                       currentUser.user_metadata?.role === 'admin';
  const isAdmin = isAdminByEmail || isAdminByRole || currentUser.isAdmin;

  console.log('AdminProtectedRoute - Admin check:', { 
    userEmail,
    isAdminByEmail,
    isAdminByRole,
    isAdminFromProps: currentUser.isAdmin,
    app_metadata: currentUser.app_metadata,
    user_metadata: currentUser.user_metadata,
    finalIsAdmin: isAdmin
  });

  // If user is not an admin, redirect to unauthorized
  if (!isAdmin) {
    console.log('AdminProtectedRoute: User is not an admin, redirecting to /unauthorized');
    return <Navigate to="/unauthorized" replace />;
  }

  console.log('AdminProtectedRoute: User is admin, rendering children');
  return children;
}
