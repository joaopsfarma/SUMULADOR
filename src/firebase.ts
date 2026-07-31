import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc, enableMultiTabIndexedDbPersistence } from 'firebase/firestore';

const firebaseConfig = {
  projectId: "gen-lang-client-0088386857",
  appId: "1:162831133824:web:7660a4d10d14fa2832ca65",
  apiKey: "AIzaSyCO42vQqyK2JzLqsO--rQ3dmdGf_kbY76M",
  authDomain: "gen-lang-client-0088386857.firebaseapp.com",
  storageBucket: "gen-lang-client-0088386857.firebasestorage.app",
  messagingSenderId: "162831133824"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, "ai-studio-simuladorbatidan-c5a42d65-0158-48e1-a90c-9afadc9ae4fa");

// Enable offline persistence
enableMultiTabIndexedDbPersistence(db).catch((err) => {
  if (err.code == 'failed-precondition') {
    console.warn('Multiple tabs open, persistence can only be enabled in one tab at a a time.');
  } else if (err.code == 'unimplemented') {
    console.warn('The current browser does not support all of the features required to enable persistence');
  }
});

export const initializeStats = async () => {
  try {
    const statsRef = doc(db, 'doorStats', 'global');
    const statsSnap = await getDoc(statsRef);
    if (!statsSnap.exists()) {
      await setDoc(statsRef, { totalKnocks: 0 });
    }
  } catch (error) {
    console.warn("Could not initialize stats (likely offline):", error);
  }
};
