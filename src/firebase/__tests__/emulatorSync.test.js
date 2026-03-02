// Emulator integration test for syncAuthToFirestore
// This test runs only when REACT_APP_USE_FIREBASE_EMULATORS=true is set in the environment.

// Ensure env is set before importing the app module so the SDK connects to the emulators
process.env.REACT_APP_USE_FIREBASE_EMULATORS = process.env.REACT_APP_USE_FIREBASE_EMULATORS || 'true';
process.env.REACT_APP_AUTH_EMULATOR_URL = process.env.REACT_APP_AUTH_EMULATOR_URL || 'http://localhost:9099';
process.env.REACT_APP_FIRESTORE_EMULATOR_HOST = process.env.REACT_APP_FIRESTORE_EMULATOR_HOST || 'localhost';
process.env.REACT_APP_FIRESTORE_EMULATOR_PORT = process.env.REACT_APP_FIRESTORE_EMULATOR_PORT || '8080';
process.env.REACT_APP_STORAGE_EMULATOR_HOST = process.env.REACT_APP_STORAGE_EMULATOR_HOST || 'localhost';
process.env.REACT_APP_STORAGE_EMULATOR_PORT = process.env.REACT_APP_STORAGE_EMULATOR_PORT || '9199';

jest.setTimeout(30000);

if (process.env.REACT_APP_USE_FIREBASE_EMULATORS !== 'true') {
  test('skips emulator sync test when emulators are not enabled', () => {
    expect(true).toBe(true);
  });
} else {
  const { auth, db, syncAuthToFirestore } = require('../../firebase');
  const { createUserWithEmailAndPassword, deleteUser, signOut } = require('firebase/auth');
  const { doc, getDoc, deleteDoc } = require('firebase/firestore');

  test('syncAuthToFirestore creates users/{uid} doc on sign-up (emulator)', async () => {
    const unsubscribe = syncAuthToFirestore();
    const email = `testuser-${Date.now()}@example.com`;
    const password = 'Test1234!';

    // Create a user using Auth emulator (this signs in the user)
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const { user } = userCredential;
    expect(user).toBeDefined();

    // Poll Firestore for the users/{uid} doc created by the sync listener
    const userRef = doc(db, 'users', user.uid);
    const deadline = Date.now() + 5000;
    let data = null;
    while (Date.now() < deadline) {
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        data = snap.data();
        break;
      }
      await new Promise(r => setTimeout(r, 200));
    }

    expect(data).not.toBeNull();
    expect(data.uid).toBe(user.uid);
    expect(data.email).toBe(email);
    expect(data.role).toBeDefined();

    // cleanup: delete the Firestore doc and auth user
    await deleteDoc(userRef).catch(() => {});
    try {
      await deleteUser(user);
    } catch (e) {
      // best-effort: sign out if delete fails
      try { await signOut(auth); } catch (er) {}
    }
    unsubscribe();
  });
}
