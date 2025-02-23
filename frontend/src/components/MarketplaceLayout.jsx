import React, { useState } from "react";
import { motion } from "framer-motion";
import { Link, useLocation } from "react-router-dom";
import UserMenu from "./UserMenu";
import { ChartBarIcon, GiftIcon } from "@heroicons/react/24/outline";
import { NavLink } from "react-router-dom";

const MenuItem = ({ icon, text, path, isActive, onClick, isCollapsed }) => {
  return (
    <Link
      to={path}
      className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
        isActive 
          ? "bg-emerald-600 text-white" 
          : "hover:bg-emerald-600/10 text-neutral-300 hover:text-emerald-500"
      } ${isCollapsed ? "justify-center" : ""}`}
      onClick={onClick}
    >
      <span className="text-lg">{icon}</span>
      {!isCollapsed && <span className="text-sm font-medium">{text}</span>}
    </Link>
  );
};

const MarketplaceLayout = ({ children }) => {
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const location = useLocation();

  const menuItems = [
    { icon: "🏠", text: "Home", path: "/marketplace" },
    { icon: "📦", text: "List Product", path: "/marketplace/list-product" },
    { icon: "💰", text: "My Listings", path: "/marketplace/my-listings" },
    { icon: "🛒", text: "My Purchases", path: "/marketplace/my-purchases" },
    { icon: "🌳", text: "Leaderboard", path: "/marketplace/leaderboard" }
  ];

  const toggleSidebar = () => {
    setSidebarCollapsed(!isSidebarCollapsed);
  };

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Mobile Overlay */}
      {isMobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Mobile Toggle Button */}
      <button
        onClick={() => setMobileSidebarOpen(!isMobileSidebarOpen)}
        className="fixed top-4 left-4 z-50 p-2 bg-slate-800 rounded-lg md:hidden"
      >
        <svg
          className="w-6 h-6 text-white"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d={isMobileSidebarOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}
          />
        </svg>
      </button>

      {/* Desktop Sidebar */}
      <motion.div
        initial={false}
        animate={{ 
          width: isSidebarCollapsed ? "4rem" : "16rem",
          transition: { duration: 0.3 }
        }}
        className={`fixed top-0 left-0 h-screen bg-slate-900/50 backdrop-blur-xl border-r border-slate-800 p-3 z-40 hidden md:block`}
      >
        {/* Toggle Button */}
        <button
          onClick={toggleSidebar}
          className="absolute -right-3 top-6 bg-slate-800 rounded-full p-1.5 border border-slate-700 hover:bg-slate-700 transition-colors"
        >
          <svg
            className={`w-3 h-3 text-white transition-transform duration-300 ${isSidebarCollapsed ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>

        {/* Logo */}
        <div className={`flex items-center ${isSidebarCollapsed ? "justify-center" : "space-x-2"} px-3 py-3 mb-6`}>
          <span className="text-xl">🌱</span>
          {!isSidebarCollapsed && (
            <h1 className="text-lg font-bold bg-gradient-to-r from-emerald-400 to-green-500 bg-clip-text text-transparent">
              Dashboard
            </h1>
          )}
        </div>

        {/* Menu Items */}
        <nav className="space-y-1.5">
          {menuItems.map((item) => (
            <MenuItem
              key={item.path}
              {...item}
              isActive={location.pathname === item.path}
              onClick={() => setMobileSidebarOpen(false)}
              isCollapsed={isSidebarCollapsed}
            />
          ))}
          <NavLink
            to="/marketplace/impact"
            className={({ isActive }) =>
              `flex items-center px-4 py-2 text-sm rounded-lg ${
                isActive
                  ? 'bg-emerald-600 text-white'
                  : 'text-gray-300 hover:bg-slate-700'
              }`
            }
          >
            <ChartBarIcon className="w-5 h-5 mr-3" />
            Impact Dashboard
          </NavLink>
          <NavLink
            to="/marketplace/rewards"
            className={({ isActive }) =>
              `flex items-center px-4 py-2 text-sm rounded-lg ${
                isActive
                  ? 'bg-emerald-600 text-white'
                  : 'text-gray-300 hover:bg-slate-700'
              }`
            }
          >
            <GiftIcon className="w-5 h-5 mr-3" />
            Rewards & Achievements
          </NavLink>
        </nav>

        {/* User Profile Section */}
        <div className="absolute bottom-3 left-3 right-3">
          <div className="p-3 rounded-lg bg-slate-800/50 backdrop-blur-sm">
            <UserMenu isCollapsed={isSidebarCollapsed} />
          </div>
        </div>
      </motion.div>

      {/* Mobile Sidebar */}
      <motion.div
        initial={{ x: -300 }}
        animate={{ x: isMobileSidebarOpen ? 0 : -300 }}
        transition={{ duration: 0.3 }}
        className="fixed top-0 left-0 h-screen w-64 bg-slate-900/50 backdrop-blur-xl border-r border-slate-800 p-4 z-40 md:hidden"
      >
        {/* Mobile Logo */}
        <div className="flex items-center space-x-2 px-3 py-3 mb-6">
          <span className="text-xl">🌱</span>
          <h1 className="text-lg font-bold bg-gradient-to-r from-emerald-400 to-green-500 bg-clip-text text-transparent">
            BioConnect
          </h1>
        </div>

        {/* Mobile Menu Items */}
        <nav className="space-y-1.5">
          {menuItems.map((item) => (
            <MenuItem
              key={item.path}
              {...item}
              isActive={location.pathname === item.path}
              onClick={() => setMobileSidebarOpen(false)}
              isCollapsed={false}
            />
          ))}
        </nav>

        {/* Mobile User Profile Section */}
        <div className="absolute bottom-4 left-4 right-4">
          <div className="p-3 rounded-lg bg-slate-800/50 backdrop-blur-sm">
            <UserMenu />
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className={`transition-all duration-300 ${isSidebarCollapsed ? "md:ml-16" : "md:ml-64"}`}>
        <div className="min-h-screen">
          {/* Top Bar */}
          <div className="bg-slate-900/50 backdrop-blur-xl border-b border-slate-800 h-14" />

          {/* Page Content */}
          <div className="max-w-7xl mx-auto p-4 md:p-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketplaceLayout; 