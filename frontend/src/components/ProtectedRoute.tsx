import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  requiredRole?: string;
  requiredPermission?: string;
}

export default function ProtectedRoute({ requiredRole, requiredPermission }: ProtectedRouteProps) {
  const { user, loading, isAdmin, hasPermission } = useAuth();

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0a' }}>
        <div className="loader"></div> 
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check permission if specified
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return <Navigate to="/" replace />;
  }

  // Legacy role check
  if (requiredRole === 'Administrador' && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
