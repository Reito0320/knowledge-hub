import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
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
