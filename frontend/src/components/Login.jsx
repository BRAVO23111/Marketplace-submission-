import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { loginUser, signInWithGoogleAction } from '../redux/actions/authActions';
import { BackgroundGradient } from './ui/background-gradient';
import { motion } from 'framer-motion';
import { Label } from './ui/label';
import { Input } from './ui/input';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [formErrors, setFormErrors] = useState({});
    const dispatch = useDispatch();
    const { loading, error } = useSelector(state => state.auth);
    const navigate = useNavigate();

    const validateForm = () => {
        const errors = {};
        if (!email) errors.email = 'Email is required';
        if (!password) errors.password = 'Password is required';
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;
        
        try {
            await dispatch(loginUser(email, password));
            navigate('/marketplace');
        } catch (err) {
            // Error is handled in the reducer
        }
    };

    const handleGoogleSignIn = async () => {
        try {
            await dispatch(signInWithGoogleAction());
            navigate('/marketplace');
        } catch (err) {
            // Error is handled in the reducer
        }
    };

    return (
        <div className="min-h-screen w-full bg-gray-950 flex items-center justify-center p-4">
            {/* Background Effects */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute w-full h-full bg-gradient-to-br from-blue-500/10 via-transparent to-emerald-500/10" />
                <div className="absolute inset-0 backdrop-blur-3xl" />
            </div>

            {/* Main Content */}
            <div className="relative w-full max-w-md mx-auto">
                <BackgroundGradient className="w-full" containerClassName="shadow-2xl">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="w-full px-6 py-8 md:px-8"
                    >
                        {/* Header */}
                        <div className="text-center mb-8">
                            <h2 className="text-3xl font-bold text-white mb-3">Welcome Back</h2>
                            <p className="text-gray-400">Sign in to your account to continue</p>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg"
                            >
                                <p className="text-red-500 text-sm font-medium">{error}</p>
                            </motion.div>
                        )}

                        {/* Login Form */}
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <Label htmlFor="email" required>Email address</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="name@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    error={formErrors.email}
                                    className="bg-gray-900/50 backdrop-blur-sm"
                                />
                            </div>

                            <div>
                                <Label htmlFor="password" required>Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    error={formErrors.password}
                                    className="bg-gray-900/50 backdrop-blur-sm"
                                />
                            </div>

                            {/* Submit Button */}
                            <motion.button
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.99 }}
                                type="submit"
                                disabled={loading}
                                className={`
                                    w-full py-3 px-4 rounded-lg font-medium text-sm
                                    transition-all duration-200 relative overflow-hidden
                                    ${loading 
                                        ? 'bg-gray-600 cursor-not-allowed' 
                                        : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800'
                                    }
                                    text-white shadow-lg hover:shadow-xl
                                `}
                            >
                                {loading ? (
                                    <div className="flex items-center justify-center">
                                        <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        Signing in...
                                    </div>
                                ) : 'Sign in'}
                            </motion.button>
                        </form>

                        {/* Divider */}
                        <div className="my-6">
                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-gray-700"></div>
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="px-4 bg-gray-900 text-gray-400">or continue with</span>
                                </div>
                            </div>
                        </div>

                        {/* Google Sign In */}
                        <motion.button
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                            onClick={handleGoogleSignIn}
                            disabled={loading}
                            className="w-full flex items-center justify-center py-3 px-4 rounded-lg
                                bg-white hover:bg-gray-50 text-gray-900 font-medium text-sm
                                transition-all duration-200 shadow-md hover:shadow-lg"
                        >
                            <img
                                src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                                alt="Google"
                                className="h-5 w-5 mr-2"
                            />
                            Sign in with Google
                        </motion.button>

                        {/* Sign Up Link */}
                        <div className="mt-6 text-center">
                            <p className="text-sm text-gray-400">
                                Don't have an account?{' '}
                                <button
                                    onClick={() => navigate('/signup')}
                                    className="font-medium text-blue-500 hover:text-blue-400
                                        focus:outline-none focus:underline transition-colors"
                                >
                                    Sign up
                                </button>
                            </p>
                        </div>
                    </motion.div>
                </BackgroundGradient>
            </div>
        </div>
    );
};

export default Login; 