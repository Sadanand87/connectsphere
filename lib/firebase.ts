// Firebase configuration and initialization
import { initializeApp } from "firebase/app"
import { getAuth, GoogleAuthProvider } from "firebase/auth"
import { getFirestore } from "firebase/firestore"
import { getStorage } from "firebase/storage"

const firebaseConfig = {
  apiKey: "AIzaSyBDJ_4yssu-CS14VaLCJKT2MNCHBEkpXfk",
  authDomain: "connectsphere-789a9.firebaseapp.com",
  databaseURL: "https://connectsphere-789a9-default-rtdb.firebaseio.com",
  projectId: "connectsphere-789a9",
  storageBucket: "connectsphere-789a9.firebasestorage.app",
  messagingSenderId: "840765516862",
  appId: "1:840765516862:web:16335cac8593cffa16f56f",
  measurementId: "G-GT64D0F7WM",
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Initialize Firebase services
export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)
export const googleProvider = new GoogleAuthProvider()

export default app
