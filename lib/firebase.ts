import admin from 'firebase-admin';

declare global {
  // eslint-disable-next-line no-var
  var _firebaseAdminApp: admin.app.App | undefined;
}

function getFirebaseAdmin(): admin.app.App {
  if (global._firebaseAdminApp) return global._firebaseAdminApp;

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      'Missing Firebase env vars: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY'
    );
  }

  global._firebaseAdminApp = admin.initializeApp({
    credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
  });

  return global._firebaseAdminApp;
}

export function getDb(): admin.firestore.Firestore {
  const app = getFirebaseAdmin();
  return admin.firestore(app);
}

export function getAdmin(): typeof admin {
  getFirebaseAdmin();
  return admin;
}
