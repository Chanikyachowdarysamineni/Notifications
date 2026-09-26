import { Navigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';

const RoleGuard = ({ allowedRoles, children }) => {
  const user = useAuthStore((state) => state.user);

  if (!user || !allowedRoles.includes(user.role)) {
    // Redirect to dashboard if they try to access an unauthorized route
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default RoleGuard;
