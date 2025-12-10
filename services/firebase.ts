
import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import "firebase/compat/firestore";
import "firebase/compat/storage";
import "firebase/compat/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyDPYqAVvj3qIJ7d1dqmVFOzUNyGU56DUaw",
  authDomain: "zewl-a9584.firebaseapp.com",
  projectId: "zewl-a9584",
  storageBucket: "zewl-a9584.firebasestorage.app", 
  messagingSenderId: "934193700816",
  appId: "1:934193700816:web:656b0924bc2e09e24ce3d5",
  measurementId: "G-MD7JFK1P3M"
};

let app;
let db;
let auth;
let storage;

// Initialize Firebase safely
if (!firebase.apps.length) {
  app = firebase.initializeApp(firebaseConfig);
  db = firebase.firestore(app);
  auth = firebase.auth(app);
  storage = firebase.storage(app);

  // Only apply settings on fresh initialization
  try {
    db.settings({
      ignoreUndefinedProperties: true,
      cacheSizeBytes: 50 * 1024 * 1024 // Limit cache to 50MB
    });
  } catch (err) {
    console.warn("Firestore settings could not be applied:", err);
  }
} else {
  // Use existing instance
  app = firebase.app();
  db = firebase.firestore(app);
  auth = firebase.auth(app);
  storage = firebase.storage(app);
}

// Use functions (setter methods) instead of property assignment for robustness
if (storage.setMaxUploadRetryTime) {
    storage.setMaxUploadRetryTime(120000); // 2 minutes
}
if (storage.setMaxOperationRetryTime) {
    storage.setMaxOperationRetryTime(120000); 
}

// Analytics (safe initialization)
if (typeof window !== 'undefined') {
  try {
    firebase.analytics(app);
  } catch (e) {
    console.warn("Analytics failed to load:", e);
  }
}

export { auth, db, storage };
export default firebase;
