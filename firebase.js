import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAvE8pSw4xZFuM5hrLkv-4tIBFjwonIRuw",
  authDomain: "neu-library-system-ff60b.firebaseapp.com",
  projectId: "neu-library-system-ff60b",
  storageBucket: "neu-library-system-ff60b.firebasestorage.app",
  messagingSenderId: "870414459461",
  appId: "1:870414459461:web:d6d34f0f197de766e5792c"
};


const app = initializeApp(firebaseConfig);


const db = getFirestore(app);

export { db };