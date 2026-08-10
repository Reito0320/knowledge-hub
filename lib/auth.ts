import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  createUserWithEmailAndPassword,
} from 'firebase/auth';
import { app } from './firebase';

const provider = new GoogleAuthProvider();
export const auth = getAuth(app);

export const handleLogin = async () => {
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    return { user };
  } catch (error) {
    console.error(error);
    return { error: 'ログインがキャンセルされました。' };
  }
};

export const handleLogout = async () => {
  try {
    await signOut(auth);
    return;
  } catch (error) {
    console.error(error);
    return { error: 'サインアウトがキャンセルされました。' };
  }
};

export const handleSignup = async (email: string, password: string) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password,
    );
    const user = userCredential.user;
    return { user, error: null };
  } catch (error) {
    console.error(error);
    return { user: null, error: 'signupに失敗しました。' };
  }
};
