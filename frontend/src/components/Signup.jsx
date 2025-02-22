import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { signupUser, signInWithGoogleAction } from '../redux/actions/authActions';
import { BackgroundGradient } from './ui/background-gradient';
import { motion } from 'framer-motion';
import { Sparkles } from './ui/sparkles';
import { Label } from './ui/label';
import { Input } from './ui/input';

const Signup = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [formErrors, setFormErrors] = useState({});
    const dispatch = useDispatch();
    const { loading, error } = useSelector(state => state.auth);
    const navigate = useNavigate();

    const validateForm = () => {
        const errors = {};
        if (!email) errors.email = 'Email is required';
        if (!password) errors.password = 'Password is required';
        if (!confirmPassword) errors.confirmPassword = 'Please confirm your password';
        if (password !== confirmPassword) {
            errors.confirmPassword = 'Passwords do not match';
        }
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        try {
            await dispatch(signupUser(email, password));
            navigate('/marketplace');
        } catch (err) {
            // Error is handled in the reducer
        }
    };

    const handleGoogleSignUp = async () => {
        try {
            await dispatch(signInWithGoogleAction());
            navigate('/marketplace');
        } catch (err) {
            // Error is handled in the reducer
        }
    };

    return (
        <div className="min-h-screen w-full bg-gray-950 flex items-center justify-center p-4">
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
                <div className="absolute w-[500px] h-[500px] bg-emerald-500/30 rounded-full blur-3xl -top-32 -left-32 animate-pulse" />
                <div className="absolute w-[500px] h-[500px] bg-blue-500/30 rounded-full blur-3xl -bottom-32 -right-32 animate-pulse delay-700" />
            </div>

            <BackgroundGradient className="w-full max-w-2xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="w-full px-4 py-8 md:px-8"
                >
                    <div className="text-center mb-8">
                        <h2 className="text-4xl font-bold text-white mb-2">
                            <Sparkles>Create Account</Sparkles>
                        </h2>
                        <p className="text-gray-400 text-lg">Join our sustainable marketplace</p>
                    </div>

                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-500 text-sm"
                        >
                            {error}
                        </motion.div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6 max-w-xl mx-auto">
                        <div>
                            <Label htmlFor="email" required>
                                Email address
                            </Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="Enter your email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                error={formErrors.email}
                            />
                        </div>

                        <div>
                            <Label htmlFor="password" required>
                                Password
                            </Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="Create a password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                error={formErrors.password}
                            />
                        </div>

                        <div>
                            <Label htmlFor="confirm-password" required>
                                Confirm Password
                            </Label>
                            <Input
                                id="confirm-password"
                                type="password"
                                placeholder="Confirm your password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                error={formErrors.confirmPassword}
                            />
                        </div>

                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-gray-900 text-lg"
                        >
                            {loading ? 'Creating Account...' : 'Create Account'}
                        </motion.button>
                    </form>

                    <div className="mt-8 max-w-xl mx-auto">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-700"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-4 bg-gray-900 text-gray-400">Or continue with</span>
                            </div>
                        </div>

                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleGoogleSignUp}
                            disabled={loading}
                            className="mt-6 w-full flex items-center justify-center py-4 px-6 bg-white hover:bg-gray-100 text-gray-900 font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 text-lg"
                        >
                            <img
                                className="h-6 w-6 mr-2"
                                src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                                alt="Google logo"
                            />
                            Sign up with Google
                        </motion.button>
                    </div>

                    <div className="mt-8 text-center">
                        <p className="text-sm text-gray-400">
                            Already have an account?{' '}
                            <button
                                onClick={() => navigate('/login')}
                                className="font-medium text-emerald-500 hover:text-emerald-400 focus:outline-none focus:underline transition-colors"
                            >
                                Sign in
                            </button>
                        </p>
                    </div>
                </motion.div>
            </BackgroundGradient>
        </div>
    );
};

export default Signup; 