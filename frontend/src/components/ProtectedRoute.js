import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, ownerOnly }) {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', fontSize: '18px', color: '#64748b' }}>Loading...</div>;
  if (!user) return <Navigate to="/auth" />;
  if (ownerOnly && user.role !== 'owner') return <Navigate to="/" />;
  return children;
}
