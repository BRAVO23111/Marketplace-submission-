import React, { useState, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { logoutUser } from '../redux/actions/authActions';
import { useNavigate } from 'react-router-dom';

const UserMenu = ({ isCollapsed }) => {
    const [isOpen, setIsOpen] = useState(false);
    const { user } = useSelector(state => state.auth);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = async () => {
        try {
            await dispatch(logoutUser());
            localStorage.removeItem('auth_token');
            navigate('/login');
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    if (!user) return null;

    return (
        <div className="relative" ref={dropdownRef}>
            {isOpen && (
                <div className={`absolute ${isCollapsed ? "left-full ml-2" : "right-0"} bottom-full mb-2 w-48 bg-slate-800 rounded-lg shadow-lg py-1 z-50 border border-slate-700`}>
                    <div className="px-4 py-2 text-sm text-neutral-300 border-b border-slate-700">
                        Signed in as<br />
                        <span className="font-medium text-emerald-400 truncate block">{user?.email}</span>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-sm text-neutral-300 hover:bg-slate-700 hover:text-emerald-400 transition-colors duration-200"
                    >
                        Sign out
                    </button>
                </div>
            )}

            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center ${isCollapsed ? "justify-center" : "space-x-2"} text-white hover:text-emerald-400 focus:outline-none transition-colors duration-200 w-full`}
            >
                <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white">
                    {user?.displayName ? user.displayName[0].toUpperCase() : user?.email[0].toUpperCase()}
                </div>
                {!isCollapsed && (
                    <span className="hidden md:inline truncate">{user?.displayName || user?.email}</span>
                )}
            </button>
        </div>
    );
};

export default UserMenu; 