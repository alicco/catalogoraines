// Firebase Kit Sharing Service
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, getDoc, onSnapshot } from 'firebase/firestore';
import { firebaseConfig } from './firebase';

let app = null;
let db = null;

// Initialize Firebase (call this once)
export function initFirebase() {
    if (!app) {
        try {
            app = initializeApp(firebaseConfig);
            db = getFirestore(app);
            console.log('✅ Firebase initialized');
        } catch (error) {
            console.error('❌ Firebase initialization error:', error);
            throw error;
        }
    }
    return { app, db };
}

// Save kit to Firebase and get shareable link
export async function saveKitToCloud(kitData) {
    if (!db) initFirebase();

    try {
        // Generate unique ID
        const kitId = `kit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const kitRef = doc(collection(db, 'kits'), kitId);

        // Save to Firestore
        await setDoc(kitRef, {
            ...kitData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        });

        console.log('✅ Kit saved to cloud:', kitId);
        return kitId;
    } catch (error) {
        console.error('❌ Error saving kit:', error);
        throw error;
    }
}

// Update existing kit
export async function updateKitInCloud(kitId, kitData) {
    if (!db) initFirebase();

    try {
        const kitRef = doc(db, 'kits', kitId);
        await setDoc(kitRef, {
            ...kitData,
            updatedAt: new Date().toISOString(),
        }, { merge: true });

        console.log('✅ Kit updated in cloud:', kitId);
    } catch (error) {
        console.error('❌ Error updating kit:', error);
        throw error;
    }
}

// Load kit from Firebase
export async function loadKitFromCloud(kitId) {
    if (!db) initFirebase();

    try {
        const kitRef = doc(db, 'kits', kitId);
        const kitSnap = await getDoc(kitRef);

        if (kitSnap.exists()) {
            console.log('✅ Kit loaded from cloud:', kitId);
            return kitSnap.data();
        } else {
            throw new Error('Kit non trovato');
        }
    } catch (error) {
        console.error('❌ Error loading kit:', error);
        throw error;
    }
}

// Subscribe to real-time updates
export function subscribeToKit(kitId, callback) {
    if (!db) initFirebase();

    const kitRef = doc(db, 'kits', kitId);

    const unsubscribe = onSnapshot(kitRef, (snapshot) => {
        if (snapshot.exists()) {
            console.log('🔄 Kit updated from cloud');
            callback(snapshot.data());
        }
    }, (error) => {
        console.error('❌ Error subscribing to kit:', error);
    });

    return unsubscribe;
}

// Generate shareable URL
export function getShareableUrl(kitId) {
    const baseUrl = window.location.origin;
    return `${baseUrl}/shared/${kitId}`;
}
