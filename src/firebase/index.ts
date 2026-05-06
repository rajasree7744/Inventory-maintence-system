'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

/**
 * Initializes Firebase with a safety check for the browser environment.
 * This prevents the Firebase SDK from attempting to initialize during Next.js SSR.
 */
export function initializeFirebase() {
  // Safety Check: Ensure this only runs on the client (browser)
  if (typeof window === 'undefined') {
    return {
      firebaseApp: null as unknown as FirebaseApp,
      auth: null as unknown as Auth,
      firestore: null as unknown as Firestore
    };
  }

  // Ensure we only initialize once
  let app: FirebaseApp;
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp();
  }

  return {
    firebaseApp: app,
    auth: getAuth(app),
    firestore: getFirestore(app)
  };
}

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';
