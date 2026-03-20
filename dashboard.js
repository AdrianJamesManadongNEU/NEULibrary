import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";

import { 
  getAuth,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

import {
  getFirestore,
  doc,
  getDoc,
  addDoc,
  collection,
  serverTimestamp,
  query,
  where,
  getDocs,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAvE8pSw4xZFuM5hrLkv-4tIBFjwonIRuw",
  authDomain: "neu-library-system-ff60b.firebaseapp.com",
  projectId: "neu-library-system-ff60b",
  storageBucket: "neu-library-system-ff60b.firebasestorage.app",
  messagingSenderId: "870414459461",
  appId: "1:870414459461:web:d6d34f0f197de766e5792c"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let currentUserName = "";
let currentUserEmail = "";
let currentUserType = "";

onAuthStateChanged(auth, async (user) => {

  if (user) {

    currentUserEmail = user.email;

    const userDoc = await getDoc(doc(db, "users", user.uid));

    if (userDoc.exists()) {
      currentUserName = userDoc.data().name;
      currentUserType = userDoc.data().userType;
    }
    document.getElementById("userTop").innerText = currentUserName;
    document.getElementById("userName").innerText = currentUserName;
    document.getElementById("avatarLetter").innerText =
      currentUserName.charAt(0).toUpperCase();

  } else {
    window.location.href = "index.html";
  }

});

window.submitVisit = async function (event) {

  event.preventDefault();

  const reason = document.getElementById("reason").value;
  const notes = document.getElementById("notes").value;

  try {

    const q = query(
      collection(db, "visitor_logs"),
      where("email", "==", currentUserEmail)
    );

    const snapshot = await getDocs(q);
    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();

      if (!data.time_out) {
        alert("You are already inside. Please logout first.");
        return;
      }
    }

    await addDoc(collection(db, "visitor_logs"), {
      name: currentUserName,
      email: currentUserEmail,
      userType: currentUserType,
      reason: reason,
      notes: notes,
      time_in: serverTimestamp(),
      time_out: null 
    });

    alert("Visit Recorded Successfully");
    document.getElementById("visitForm").reset();

  } catch (error) {
    console.error(error);
    alert(error.message);
  }

};

window.logoutMyVisit = async function () {

  try {

    if (!currentUserEmail) {
      alert("User not ready. Please wait.");
      return;
    }

    const q = query(
      collection(db, "visitor_logs"),
      where("email", "==", currentUserEmail)
    );

    const snapshot = await getDocs(q);

    console.log("Docs found:", snapshot.size);

    let updated = false;

    for (const docSnap of snapshot.docs) {

      const data = docSnap.data();
      console.log("Checking:", data);

      if (!data.time_out) {

        console.log("Updating:", docSnap.id);

        await updateDoc(doc(db, "visitor_logs", docSnap.id), {
          time_out: serverTimestamp()
        });

        updated = true;
      }
    }

    if (!updated) {
      alert("No active visit found.");
      return;
    }

    alert("You are now logged out!");

  } catch (error) {
    console.error(error);
    alert("Logout failed.");
  }

};

window.handleLogout = async function () {

  try {

    if (!currentUserEmail) {
      alert("User not loaded yet.");
      return;
    }

    const q = query(
      collection(db, "visitor_logs"),
      where("email", "==", currentUserEmail)
    );

    const snapshot = await getDocs(q);

    console.log("Docs found:", snapshot.size);

    for (const docSnap of snapshot.docs) {

      const data = docSnap.data();

      if (!data.time_out) {

        console.log("Updating doc:", docSnap.id);

        await updateDoc(doc(db, "visitor_logs", docSnap.id), {
          time_out: serverTimestamp()
        });
      }
    }

    console.log("Logout saved");

    await signOut(auth);
    window.location.href = "index.html";

  } catch (error) {
    console.error("ERROR:", error);
    alert("Logout failed.");
  }

};

function updateClock() {

  const now = new Date();

  const dateOptions = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  };

  const date = now.toLocaleDateString(undefined, dateOptions);

  const time = now.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  document.getElementById("currentDate").innerText = date;
  document.getElementById("currentTime").innerText = time;

}

setInterval(updateClock, 1000);
updateClock();