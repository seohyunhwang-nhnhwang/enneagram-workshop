import { initializeApp, getApps, FirebaseApp } from "firebase/app";

const firebaseConfig = {
  apiKey: "AIzaSyAabDfyWEXzrwJu-Gy1WeP7ZxyOQ133DYU",
  authDomain: "enneagram-leader.firebaseapp.com",
  projectId: "enneagram-leader",
  storageBucket: "enneagram-leader.firebasestorage.app",
  messagingSenderId: "595246568565",
  appId: "1:595246568565:web:da51747507f81158b5143c",
};

let app: FirebaseApp;

export function getApp() {
  if (!app) {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  }
  return app;
}
