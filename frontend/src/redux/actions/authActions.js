import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut, 
    GoogleAuthProvider,
    signInWithPopup
} from 'firebase/auth';
import { auth } from '../../firebase/config';
import { setLoading, setUser, setError, clearUser } from '../slices/authSlice';

export const loginUser = (email, password) => async (dispatch) => {
    try {
        dispatch(setLoading(true));
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const token = await userCredential.user.getIdToken();
        localStorage.setItem('auth_token', token);
        dispatch(setUser({
            uid: userCredential.user.uid,
            email: userCredential.user.email,
            displayName: userCredential.user.displayName,
        }));
    } catch (error) {
        dispatch(setError(error.message));
        throw error;
    }
};

export const signupUser = (email, password) => async (dispatch) => {
    try {
        dispatch(setLoading(true));
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const token = await userCredential.user.getIdToken();
        localStorage.setItem('auth_token', token);
        dispatch(setUser({
            uid: userCredential.user.uid,
            email: userCredential.user.email,
            displayName: userCredential.user.displayName,
        }));
    } catch (error) {
        dispatch(setError(error.message));
        throw error;
    }
};

export const signInWithGoogleAction = () => async (dispatch) => {
    try {
        dispatch(setLoading(true));
        const provider = new GoogleAuthProvider();
        const userCredential = await signInWithPopup(auth, provider);
        const token = await userCredential.user.getIdToken();
        localStorage.setItem('auth_token', token);
        dispatch(setUser({
            uid: userCredential.user.uid,
            email: userCredential.user.email,
            displayName: userCredential.user.displayName,
        }));
    } catch (error) {
        dispatch(setError(error.message));
        throw error;
    }
};

export const logoutUser = () => async (dispatch) => {
    try {
        dispatch(setLoading(true));
        await signOut(auth);
        localStorage.removeItem('auth_token');
        dispatch(clearUser());
    } catch (error) {
        dispatch(setError(error.message));
        throw error;
    }
};

export const initializeAuth = (user) => async (dispatch) => {
    if (user) {
        try {
            const token = await user.getIdToken();
            localStorage.setItem('auth_token', token);
            dispatch(setUser({
                uid: user.uid,
                email: user.email,
                displayName: user.displayName,
            }));
        } catch (error) {
            console.error('Error getting token:', error);
            dispatch(clearUser());
        }
    } else {
        localStorage.removeItem('auth_token');
        dispatch(clearUser());
    }
}; 