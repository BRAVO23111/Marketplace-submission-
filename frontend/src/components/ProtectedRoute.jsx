import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

const ProtectedRoute = ({ children }) => {
    const { user, loading } = useSelector(state => state.auth);
    const authToken = localStorage.getItem('auth_token');

    // Show nothing while checking auth state
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    // Only redirect if we're not loading and there's no user/token
    if (!loading && (!user || !authToken)) {
        return <Navigate to="/login" />;
    }

    return children;
};

export default ProtectedRoute; 