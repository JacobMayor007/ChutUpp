import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { auth } from "../config/firebase";

export const authService = {
  async registerUser(email: string, password: string) {
    const result = await createUserWithEmailAndPassword(auth, email, password);

    const response = await fetch(`${import.meta.env.VITE_API_URL}/user`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: result.user.uid, email }),
    });

    if (!response.ok) throw new Error("Backend synchronization failed");
    return await response.json();
  },

  async loginUser(email: string, password: string) {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result;
  },

  async logoutUser() {
    const result = await signOut(auth);
    return result;
  },
};
