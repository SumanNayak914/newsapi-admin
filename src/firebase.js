import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBKn-x0C95gyCQgVBnc-Zk3pr8p0X31TSE",
  authDomain: "newapiprovider.firebaseapp.com",
  projectId: "newapiprovider",
  storageBucket: "newapiprovider.firebasestorage.app",
  messagingSenderId: "582837021304",
  appId: "1:582837021304:web:263dab6a1823e7cd651b8d",
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);
