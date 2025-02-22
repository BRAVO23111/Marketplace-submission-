// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCpk8GOs9SDolm_DuKBKz8lx5DVTvVlByw",
  authDomain: "blockchain-d46df.firebaseapp.com",
  projectId: "blockchain-d46df",
  storageBucket: "blockchain-d46df.firebasestorage.app",
  messagingSenderId: "444246542825",
  appId: "1:444246542825:web:d065b6e427f7e204d62378",
  measurementId: "G-88PBC4105Y"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { auth, db, storage };