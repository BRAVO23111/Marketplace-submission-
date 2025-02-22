import { auth } from './config';
import { onAuthStateChanged } from 'firebase/auth';
import { store } from '../redux/store';
import { setUser, setLoading } from '../redux/slices/authSlice';

// Initialize auth state listener
export const initializeAuth = () => {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            // User is signed in
            store.dispatch(setUser({
                uid: user.uid,
                email: user.email,
                displayName: user.displayName,
                photoURL: user.photoURL
            }));
        } else {
            // User is signed out
            store.dispatch(setUser(null));
        }
        // Set loading to false after auth state is determined
        store.dispatch(setLoading(false));
    });
};

// Call this function when your app starts
initializeAuth(); 