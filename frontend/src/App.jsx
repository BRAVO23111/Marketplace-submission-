import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from './redux/store';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase/config';
import { initializeAuth } from './redux/actions/authActions';
import ProductList from './components/ProductList';
import ProductDetails from './components/ProductDetails';
import ListProductForm from './components/ListProductForm';
import MyListings from './components/MyListings';
import MyPurchases from './components/MyPurchases';
import Login from './components/Login';
import Signup from './components/Signup';
import LandingPage from './components/LandingPage';
import ProtectedRoute from './components/ProtectedRoute';
import MarketplaceLayout from './components/MarketplaceLayout';
import ImpactDashboard from './components/ImpactDashboard';
import { initializeAuth as firebaseInitializeAuth } from './firebase/auth';

const AppContent = () => {
    useEffect(() => {
        firebaseInitializeAuth();
    }, []);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                user.getIdToken().then(token => {
                    localStorage.setItem('auth_token', token);
                });
            }
            store.dispatch(initializeAuth(user));
        });

        return () => unsubscribe();
    }, []);

    return (
        <div className="min-h-screen bg-slate-950">
            <Routes>
                {/* Public Routes */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />

                {/* Protected Marketplace Routes */}
                <Route
                    path="/marketplace"
                    element={
                        <ProtectedRoute>
                            <MarketplaceLayout>
                                <ProductList />
                            </MarketplaceLayout>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/marketplace/product/:tokenId"
                    element={
                        <ProtectedRoute>
                            <MarketplaceLayout>
                                <ProductDetails />
                            </MarketplaceLayout>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/marketplace/list-product"
                    element={
                        <ProtectedRoute>
                            <MarketplaceLayout>
                                <ListProductForm />
                            </MarketplaceLayout>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/marketplace/my-listings"
                    element={
                        <ProtectedRoute>
                            <MarketplaceLayout>
                                <MyListings />
                            </MarketplaceLayout>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/marketplace/my-purchases"
                    element={
                        <ProtectedRoute>
                            <MarketplaceLayout>
                                <MyPurchases />
                            </MarketplaceLayout>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/marketplace/impact"
                    element={
                        <ProtectedRoute>
                            <MarketplaceLayout>
                                <ImpactDashboard />
                            </MarketplaceLayout>
                        </ProtectedRoute>
                    }
                />

                {/* Catch all route */}
                <Route path="*" element={<Navigate to="/" />} />
            </Routes>
        </div>
    );
};

function App() {
    useEffect(() => {
        firebaseInitializeAuth();
    }, []);

    return (
        <Provider store={store}>
            <PersistGate loading={null} persistor={persistor}>
                <Router>
                    <AppContent />
                </Router>
            </PersistGate>
        </Provider>
    );
}

export default App;
