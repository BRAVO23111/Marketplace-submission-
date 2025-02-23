import React from 'react';
import { Link } from 'react-router-dom';
import { BackgroundGradient } from './ui/background-gradient';
import { CardHoverEffect } from './ui/card-hover-effect';
import { motion } from 'framer-motion';

const features = [
    {
        title: "Track Carbon Footprint",
        description: "Monitor and reduce your environmental impact with real-time carbon tracking.",
        icon: "🌱"
    },
    {
        title: "Secure Transactions",
        description: "Safe and transparent blockchain-based marketplace for sustainable commerce.",
        icon: "🔒"
    },
    {
        title: "Sustainable Impact",
        description: "Join a community committed to reducing waste and promoting reuse.",
        icon: "♻️"
    }
];

const LampContainer = ({ children, className }) => {
    return (
        <div className={`relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-slate-950 w-full z-0 ${className}`}>
            <div className="relative flex w-full flex-1 scale-y-125 items-center justify-center isolate z-0">
                <motion.div
                    initial={{ opacity: 0.5, width: "15rem" }}
                    whileInView={{ opacity: 1, width: "30rem" }}
                    transition={{
                        delay: 0.3,
                        duration: 0.8,
                        ease: "easeInOut"
                    }}
                    style={{
                        backgroundImage: "conic-gradient(var(--tw-gradient-stops))"
                    }}
                    className="absolute inset-auto right-1/2 h-56 overflow-visible w-[30rem] bg-gradient-conic from-emerald-500 via-transparent to-transparent text-white [--gradient-stop-1:0deg] [--gradient-stop-2:180deg]"
                >
                    <span className="absolute h-[100%] w-[100%] left-0 top-0 bg-slate-950 [clip-path:polygon(0_0,100%_0,100%_100%,0_100%)]" />
                </motion.div>
                <motion.div
                    initial={{ opacity: 0.5, width: "15rem" }}
                    whileInView={{ opacity: 1, width: "30rem" }}
                    transition={{
                        delay: 0.3,
                        duration: 0.8,
                        ease: "easeInOut"
                    }}
                    style={{
                        backgroundImage: "conic-gradient(var(--tw-gradient-stops))"
                    }}
                    className="absolute inset-auto left-1/2 h-56 w-[30rem] bg-gradient-conic from-transparent via-transparent to-emerald-500 text-white [--gradient-stop-1:180deg] [--gradient-stop-2:360deg]"
                >
                    <span className="absolute h-[100%] w-[100%] left-0 top-0 bg-slate-950 [clip-path:polygon(0_0,100%_0,100%_100%,0_100%)]" />
                </motion.div>
                <div className="absolute top-1/2 h-48 w-full translate-y-12 scale-x-150 bg-slate-950 blur-2xl"></div>
                <div className="absolute top-1/2 z-50 h-48 w-full bg-transparent opacity-10 backdrop-blur-md"></div>
                <div className="absolute inset-auto z-50 h-36 w-[28rem] -translate-y-1/2 rounded-full bg-emerald-500 opacity-50 blur-3xl"></div>
                <motion.div
                    initial={{ width: "8rem" }}
                    whileInView={{ width: "16rem" }}
                    transition={{
                        delay: 0.3,
                        duration: 0.8,
                        ease: "easeInOut"
                    }}
                    className="absolute inset-auto z-30 h-36 w-64 -translate-y-[6rem] rounded-full bg-emerald-400 blur-2xl"
                ></motion.div>
                <motion.div
                    initial={{ width: "15rem" }}
                    whileInView={{ width: "30rem" }}
                    transition={{
                        delay: 0.3,
                        duration: 0.8,
                        ease: "easeInOut"
                    }}
                    className="absolute inset-auto z-50 h-0.5 w-[30rem] -translate-y-[7rem] bg-emerald-400"
                ></motion.div>
                <div className="absolute inset-auto z-40 h-44 w-full -translate-y-[12.5rem] bg-slate-950"></div>
            </div>

            <div className="absolute inset-0 z-50 flex flex-col items-center justify-center px-5 w-full max-w-7xl mx-auto">
                {children}
            </div>
        </div>
    );
};

const LandingPage = () => {
    return (
        <div className="min-h-screen bg-slate-950 text-white">
            {/* Hero Section with Lamp Effect */}
            <LampContainer>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="text-center relative z-50 w-full max-w-4xl mx-auto mt-9" 
                >
                    <div className="flex flex-col items-center justify-center mb-8">
                        <div className="flex items-center justify-center space-x-4 mb-6">
                            <span className="text-5xl">🌱</span>
                            <h1 className="text-6xl md:text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-neutral-50 to-neutral-400">
                                Bio<i>Connect</i>
                            </h1>
                        </div>
                        <p className="text-xl md:text-2xl text-neutral-300 max-w-2xl mx-auto px-4">
                            Join our eco-friendly marketplace where every transaction contributes to a greener future.
                        </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center mt-12">
                        <Link
                            to="/marketplace"
                            className="px-8 py-4 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium transition-colors duration-200 shadow-lg hover:shadow-emerald-500/20 text-lg"
                        >
                            Explore Marketplace
                        </Link>
                        <Link
                            to="/about"
                            className="px-8 py-4 rounded-full border border-emerald-600/30 hover:bg-emerald-600/10 text-emerald-300 font-medium transition-colors duration-200 text-lg"
                        >
                            Learn More
                        </Link>
                    </div>
                </motion.div>
            </LampContainer>

            {/* Features Section */}
            <div className="py-20 relative">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold mb-4 text-emerald-400">
                            Why Choose Us
                        </h2>
                        <p className="text-neutral-400">
                            Experience the future of sustainable commerce
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {features.map((feature, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.2 }}
                                className="relative group"
                            >
                                <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-600 to-green-600 rounded-lg blur opacity-25 group-hover:opacity-50 transition duration-200"></div>
                                <div className="relative p-6 bg-slate-900 rounded-lg">
                                    <div className="text-4xl mb-4">{feature.icon}</div>
                                    <h3 className="text-xl font-semibold text-emerald-400 mb-2">{feature.title}</h3>
                                    <p className="text-neutral-400">{feature.description}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Stats Section */}
                <div className="mt-20">
                    <BackgroundGradient className="max-w-5xl mx-auto" containerClassName="border border-emerald-500/20">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 p-8">
                            <div className="text-center">
                                <h3 className="text-4xl font-bold mb-2 bg-gradient-to-r from-emerald-400 to-green-500 bg-clip-text text-transparent">1000+</h3>
                                <p className="text-neutral-400">Active Users</p>
                            </div>
                            <div className="text-center">
                                <h3 className="text-4xl font-bold mb-2 bg-gradient-to-r from-emerald-400 to-green-500 bg-clip-text text-transparent">500kg</h3>
                                <p className="text-neutral-400">CO₂ Saved</p>
                            </div>
                            <div className="text-center">
                                <h3 className="text-4xl font-bold mb-2 bg-gradient-to-r from-emerald-400 to-green-500 bg-clip-text text-transparent">2000+</h3>
                                <p className="text-neutral-400">Products Listed</p>
                            </div>
                        </div>
                    </BackgroundGradient>
                </div>
            </div>
        </div>
    );
};

export default LandingPage; 