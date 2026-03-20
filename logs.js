import { db } from "./firebase.js";
import {
  collection,
  onSnapshot,
  updateDoc,
  doc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

let logs = [];

onSnapshot(collection(db, "visitor_logs"), snapshot => {
  logs = [];

  snapshot.forEach(docSnap => {
    logs.push({
      id: docSnap.id,
      ...docSnap.data()
    });
  });

  displayLogs(logs);
});

function displayLogs(data) {
  const table = document.getElementById("logsTable");
  table.innerHTML = "";

  if (data.length === 0) {
    table.innerHTML = `<tr><td colspan="6">No records</td></tr>`;
    return;
  }

  data.sort((a, b) => b.time_in?.toDate() - a.time_in?.toDate());

  let now = new Date();

  data.forEach(log => {

    let timeIn = log.time_in?.toDate();
    let timeOut = log.time_out?.toDate();

    let formattedIn = timeIn ? timeIn.toLocaleString() : "-";
    let formattedOut = timeOut ? timeOut.toLocaleString() : "-"; // ✅ NEW

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
        <td>${formattedIn}</td>
        <td>${formattedOut}</td> 
        <td>${status}</td>
      </tr>
    `;
  });
}


window.searchLogs = function() {
  const keyword = document.getElementById("search").value.toLowerCase();

  const filtered = logs.filter(log =>
    (log.name || "").toLowerCase().includes(keyword) ||
    (log.email || "").toLowerCase().includes(keyword)
  );

  displayLogs(filtered);
};

window.logoutVisitor = async function(id) {
  if (confirm("Log out this visitor?")) {
    await updateDoc(doc(db, "visitor_logs", id), {
      time_out: new Date()
    });
  }
};