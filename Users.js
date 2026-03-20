import { db } from "./firebase.js";

import {
  collection,
  onSnapshot,
  query,
  where,
  updateDoc,
  doc,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

let logs = [];
let users = [];

loadVisitors();
loadUsersCount();
loadUsersTable();

function loadVisitors() {

  onSnapshot(collection(db, "visitor_logs"), snapshot => {

    logs = [];

    snapshot.forEach(docSnap => {
      logs.push({
        id: docSnap.id,
        ...docSnap.data()
      });
    });

    displayLogs(logs);
    calculateStats();

    displayUsers(users);
  });
}

function displayLogs(data) {

  const table = document.getElementById("logsTable");
  if (!table) return;

  table.innerHTML = "";

  if (data.length === 0) {
    table.innerHTML = `<tr><td colspan="5">No records</td></tr>`;
    return;
  }

  data.sort((a, b) => b.time_in?.toDate() - a.time_in?.toDate());

  let now = new Date();

  data.forEach(log => {

    let timeIn = log.time_in?.toDate();
    let timeOut = log.time_out?.toDate();

    let formatted = timeIn ? timeIn.toLocaleString() : "-";

    let isToday = timeIn && timeIn.toDateString() === now.toDateString();

    let status = "";

    if (!timeIn) {
      status = `<span class="status inactive">No Login</span>`;
    }
    else if (timeOut) {
      status = `<span class="status out">Logged Out</span>`;
    }
    else if (isToday) {
      status = `<span class="status in">Inside</span>`;
    }
    else {
      status = `<span class="status inactive">Not Active</span>`;
    }

    table.innerHTML += `
      <tr>
        <td>${log.name || "-"}</td>
        <td>${log.email || "-"}</td>
        <td>${log.reason || "-"}</td>
        <td>${formatted}</td>
        <td>${status}</td>
      </tr>
    `;
  });
}

function loadUsersCount() {

  const counter = document.getElementById("users");
  if (!counter) return;

  onSnapshot(collection(db, "users"), snapshot => {
    counter.innerText = snapshot.size;
  });
}


function loadUsersTable() {

  const table = document.getElementById("usersTable");
  if (!table) return;

  onSnapshot(collection(db, "users"), snapshot => {

    users = [];

    snapshot.forEach(docSnap => {
      let user = docSnap.data();
      user.id = docSnap.id;
      users.push(user);
    });

    if (logs.length > 0) {
      displayUsers(users);
    }

  });
}

function displayUsers(data) {

  const table = document.getElementById("usersTable");
  if (!table) return;

  table.innerHTML = "";

  if (data.length === 0) {
    table.innerHTML = `<tr><td colspan="5">No users found</td></tr>`;
    return;
  }

  let now = new Date();

  data.forEach(user => {

    const userLogs = logs
      .filter(log => log.email === user.email)
      .sort((a, b) => b.time_in?.toDate() - a.time_in?.toDate());

    const latestLog = userLogs[0];

    let timeIn = latestLog?.time_in?.toDate();
    let timeOut = latestLog?.time_out?.toDate();

    let isToday = timeIn && timeIn.toDateString() === now.toDateString();

    let status = "";

    if (!timeIn) {
      status = `<span class="status inactive">No Login</span>`;
    }
    else if (timeOut) {
      status = `<span class="status out">Logged Out</span>`;
    }
    else if (isToday) {
      status = `<span class="status in">Inside</span>`;
    }
    else {
      status = `<span class="status inactive">Not Active</span>`;
    }

    const statusClass = user.blocked ? "unblock" : "block";
    const btnLabel = user.blocked ? "Unblock" : "Block";

    table.innerHTML += `
      <tr>
        <td>${user.name || "-"}</td>
        <td>${user.email || "-"}</td>
        <td>${user.userType || "-"}</td>
        <td>${status}</td>
        <td>
          <button class="action-btn ${statusClass}"
            onclick="toggleBlockUser('${user.email}')">
            ${btnLabel}
          </button>
        </td>
      </tr>
    `;
  });
}

window.searchUser = function () {

  const search = document.getElementById("search");
  if (!search) return;

  const keyword = search.value.toLowerCase();

  const filtered = users.filter(user =>
    (user.name || "").toLowerCase().includes(keyword) ||
    (user.email || "").toLowerCase().includes(keyword) ||
    (user.userType || "").toLowerCase().includes(keyword)
  );

  displayUsers(filtered);
};


window.toggleBlockUser = async function(email) {

  if (!email || email === "-") {
    alert("No valid email found.");
    return;
  }

  const q = query(
    collection(db, "users"),
    where("email", "==", email)
  );

  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    alert("User not found.");
    return;
  }

  snapshot.forEach(async (userDoc) => {

    let userData = userDoc.data();

    await updateDoc(doc(db, "users", userDoc.id), {
      blocked: !userData.blocked
    });

  });

  alert("User status updated");
};

function calculateStats() {

  const todayEl = document.getElementById("today");
  const weekEl = document.getElementById("week");
  const monthEl = document.getElementById("month");

  if (!todayEl || !weekEl || !monthEl) return;

  let today = 0;
  let week = 0;
  let month = 0;

  let now = new Date();
  let weekAgo = new Date(now);
  weekAgo.setDate(now.getDate() - 7);

  logs.forEach(log => {

    let time = log.time_in?.toDate();
    if (!time) return;

    if (time.toDateString() === now.toDateString()) today++;
    if (time >= weekAgo) week++;

    if (
      time.getMonth() === now.getMonth() &&
      time.getFullYear() === now.getFullYear()
    ) {
      month++;
    }
  });

  todayEl.innerText = today;
  weekEl.innerText = week;
  monthEl.innerText = month;
}