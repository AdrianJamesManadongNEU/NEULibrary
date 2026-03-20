import { db } from "./firebase.js";

import {
  collection,
  onSnapshot,
  query,
  where,
  updateDoc,
  doc,
  getDocs,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import { getAuth, onAuthStateChanged } 
from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import { getDoc } 
from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const auth = getAuth();

let logs = [];

loadVisitors();
loadUsers();
loadUsersTable();
loadAdminName();

// ALERT
function showAlert(message, type = "info") {
  const alertBox = document.getElementById("customAlert");

  if (!alertBox) {
    console.error("customAlert element not found!");
    return;
  }

  alertBox.className = "custom-alert";

  let icon = "ℹ️";
  if (type === "success") icon = "✅";
  if (type === "error") icon = "❌";
  if (type === "warning") icon = "⚠️";

  alertBox.innerHTML = `${icon} ${message}`;

  void alertBox.offsetWidth;

  alertBox.classList.add("show", type);

  setTimeout(() => {
    alertBox.classList.remove("show");
  }, 3000);
}


function loadAdminName() {

  onAuthStateChanged(auth, async (user) => {

    if (!user) {
      window.location.href = "index.html";
      return;
    }

    try {
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const name = userSnap.data().name || user.email;

        const adminEl = document.getElementById("adminName");

        if (adminEl) {
          adminEl.innerText = `Welcome, Admin ${name}`;
        }
      }

    } catch (error) {
      console.error("Failed to load admin name:", error);
    }

  });

}

function loadVisitors() {
  onSnapshot(collection(db, "visitor_logs"), snapshot => {
    logs = [];

    snapshot.forEach(docSnap => {
      let data = docSnap.data();
      data.id = docSnap.id;
      logs.push(data);
    });

    displayLogs(logs);
    calculateStats();
  });
}

function loadUsers() {
  onSnapshot(collection(db, "users"), snapshot => {
    document.getElementById("users").innerText = snapshot.size;
  });
}

function displayLogs(data) {
  const table = document.getElementById("logsTable");
  table.innerHTML = "";

  if (data.length === 0) {
    table.innerHTML = `<tr><td colspan="5">No records</td></tr>`;
    return;
  }

  data.sort((a, b) => {
    return (b.time_in?.toDate?.() || 0) - (a.time_in?.toDate?.() || 0);
  });

  data.forEach(log => {

    let timeIn = log.time_in?.toDate?.();
    let timeOut = log.time_out?.toDate?.();

    let formattedIn = timeIn ? timeIn.toLocaleString() : "-";

  
    let status = "";

    const hasTimeIn = !!log.time_in;
    const hasTimeOut = !!log.time_out;

    if (!hasTimeIn) {
      status = `<span class="status unknown">No Login</span>`;
    } 
    else if (hasTimeOut) {
      status = `<span class="status out">Logged Out</span>`;
    } 
    else {
      status = `<span class="status in">Inside</span>`;
    }

    table.innerHTML += `
      <tr>
        <td>${log.name || "-"}</td>
        <td>${log.email || "-"}</td>
        <td>${log.reason || "-"}</td>
        <td>${formattedIn}</td>
        <td>${status}</td>
      </tr>
    `;
  });
}



window.searchUser = function() {
  const keyword = document.getElementById("search").value.toLowerCase();

  const filtered = logs.filter(log =>
    (log.name || "").toLowerCase().includes(keyword) ||
    (log.email || "").toLowerCase().includes(keyword)
  );

  displayLogs(filtered);
}



window.filterLogs = function(type) {
  const now = new Date();

  if (type === "all") {
    displayLogs(logs);
    return;
  }

  const filtered = logs.filter(log => {
    let time = log.time_in?.toDate?.();
    if (!time) return false;

    if (type === "day") {
      return time.toDateString() === now.toDateString();
    } 
    else if (type === "week") {
      let weekAgo = new Date(now);
      weekAgo.setDate(now.getDate() - 7);
      return time >= weekAgo;
    } 
    else if (type === "month") {
      return (
        time.getMonth() === now.getMonth() &&
        time.getFullYear() === now.getFullYear()
      );
    }

    return true;
  });

  displayLogs(filtered);
}

window.toggleBlockUser = async function(email) {
  if (!email || email === "-") {
    showAlert("No valid email found.", "error");
    return;
  }

  try {
    const q = query(collection(db, "users"), where("email", "==", email));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      showAlert("User not found.", "warning");
      return;
    }

    snapshot.forEach(async (userDoc) => {
      let userData = userDoc.data();

      await updateDoc(doc(db, "users", userDoc.id), {
        blocked: !userData.blocked
      });
    });

    showAlert("User status updated!", "success");

  } catch (error) {
    console.error(error);
    showAlert("Something went wrong!", "error");
  }
};


function calculateStats() {
  let today = 0, week = 0, month = 0;

  let now = new Date();
  let weekAgo = new Date(now);
  weekAgo.setDate(now.getDate() - 7);

  logs.forEach(log => {
    let time = log.time_in?.toDate?.();
    if (!time) return;

    if (time.toDateString() === now.toDateString()) today++;
    if (time >= weekAgo) week++;
    if (
      time.getMonth() === now.getMonth() &&
      time.getFullYear() === now.getFullYear()
    ) month++;
  });

  document.getElementById("today").innerText = today;
  document.getElementById("week").innerText = week;
  document.getElementById("month").innerText = month;
}


// USERS TABLE
function loadUsersTable() {
  onSnapshot(collection(db, "users"), snapshot => {
    const table = document.getElementById("usersTable");
    table.innerHTML = "";

    snapshot.forEach(docSnap => {
      let user = docSnap.data();

      const statusClass = user.blocked ? "unblock" : "block";
      const btnLabel = user.blocked ? "Unblock" : "Block";

      table.innerHTML += `
        <tr>
          <td>${user.name || "-"}</td>
          <td>${user.email || "-"}</td>
          <td>${user.userType || "-"}</td>
          <td><strong>${user.blocked ? "Blocked" : "Active"}</strong></td>
          <td>
            <button class="action-btn ${statusClass}" 
                    onclick="toggleBlockUser('${user.email}')">
              ${btnLabel}
            </button>
          </td>
        </tr>
      `;
    });
  });
}

window.logoutVisitor = async function(id) {
  if (!id) return;

  if (confirm("Log out this visitor?")) {
    try {
      await updateDoc(doc(db, "visitor_logs", id), {
        time_out: serverTimestamp() 
      });

      showAlert("Visitor logged out!", "success");

    } catch (error) {
      console.error(error);
      showAlert("Failed to log out.", "error");
    }
  }
};