import { db } from "./firebase.js";
import { collection, onSnapshot } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

let currentFilteredLogs = [];
let currentFilterType = "all";
let currentSelectedDate = null;

let selectedDate = new Date();

flatpickr("#calendar", {
  inline: true,
  dateFormat: "Y-m-d",
  defaultDate: new Date(),

  onChange: function (dates) {
    if (dates.length > 0) {
      selectedDate = dates[0];
      calculateStats("single", selectedDate);
    }
  }
});

const totalVisitors = document.getElementById("totalVisitors");
const studentCount = document.getElementById("studentCount");
const facultyCount = document.getElementById("facultyCount");
const todayVisitors = document.getElementById("todayVisitors");
const reasonList = document.getElementById("reasonStats");
const programList = document.getElementById("programStats"); // ✅ NEW

let allLogs = [];

onSnapshot(collection(db, "visitor_logs"), (snapshot) => {

  allLogs = [];

  snapshot.forEach((doc) => {
    let data = doc.data();
    allLogs.push(data);
  });

  console.log("Loaded logs:", allLogs);

  calculateStats("all");
});

window.filterStats = function (type, e) {

  document.querySelectorAll(".stats-filter").forEach(btn => {
    btn.classList.remove("active");
  });

  if (e) e.target.classList.add("active");

  calculateStats(type);
};

function calculateStats(filter, selectedDate = null, endDate = null) {

  currentFilterType = filter;
  currentSelectedDate = selectedDate;

  let students = 0;
  let faculty = 0;
  let today = 0;

  let reasons = {};
  let programCounts = {}; // ✅ NEW

  let now = new Date();
  let weekAgo = new Date();
  weekAgo.setDate(now.getDate() - 7);

  let filtered = allLogs;

  if (filter === "single" && selectedDate) {
    filtered = allLogs.filter(log => {
      let time = log.time_in?.toDate();
      return time && time.toDateString() === selectedDate.toDateString();
    });
  }

  else if (filter === "day") {
    filtered = allLogs.filter(log => {
      let time = log.time_in?.toDate();
      return time && time.toDateString() === now.toDateString();
    });
  }

  else if (filter === "week") {
    filtered = allLogs.filter(log => {
      let time = log.time_in?.toDate();
      return time && time >= weekAgo;
    });
  }

  else if (filter === "month") {
    filtered = allLogs.filter(log => {
      let time = log.time_in?.toDate();
      return (
        time &&
        time.getMonth() === now.getMonth() &&
        time.getFullYear() === now.getFullYear()
      );
    });
  }

  else if (filter === "range" && selectedDate && endDate) {
    filtered = allLogs.filter(log => {
      let time = log.time_in?.toDate();
      return time && time >= selectedDate && time <= endDate;
    });
  }

  currentFilteredLogs = filtered;

  filtered.forEach(log => {

    // 👤 USER TYPE
    let types = [];

    if (Array.isArray(log.userType)) {
      types = log.userType.map(t => t.toLowerCase().trim());
    } else if (typeof log.userType === "string") {
      types = [log.userType.toLowerCase().trim()];
    }

    if (types.includes("student")) students++;
    if (types.includes("faculty")) faculty++;

    // 📅 TODAY COUNT
    let time = log.time_in?.toDate();
    let compareDate = currentSelectedDate || now;

    if (time && time.toDateString() === compareDate.toDateString()) {
      today++;
    }

    // 📝 REASONS
    let visitReasons = [];

    if (Array.isArray(log.reason)) {
      visitReasons = log.reason.map(r => r.toLowerCase().trim());
    } else if (typeof log.reason === "string") {
      visitReasons = [log.reason.toLowerCase().trim()];
    }

    visitReasons.forEach(r => {
      if (!reasons[r]) reasons[r] = 0;
      reasons[r]++;
    });

    // 🏫 PROGRAM COUNT
    let program = (log.program || "Unknown").toString().trim();
    programCounts[program] = (programCounts[program] || 0) + 1;

  });

  totalVisitors.textContent = filtered.length;
  studentCount.textContent = students;
  facultyCount.textContent = faculty;
  todayVisitors.textContent = today;

  renderReasonStats(reasons);
  renderProgramStats(programCounts); // ✅ NEW
}

// 📋 REASON LIST
function renderReasonStats(reasons) {

  reasonList.innerHTML = "";

  Object.keys(reasons).forEach(reason => {
    let li = document.createElement("li");

    let formatted = reason.charAt(0).toUpperCase() + reason.slice(1);

    li.textContent = formatted;
    li.setAttribute("data-count", reasons[reason]);

    reasonList.appendChild(li);
  });
}

// 📋 PROGRAM LIST (NEW)
function renderProgramStats(programCounts) {

  if (!programList) return;

  programList.innerHTML = "";

  const programs = Object.keys(programCounts).sort();

  programs.forEach(program => {
    let li = document.createElement("li");
    li.textContent = `${program}: ${programCounts[program]}`;
    programList.appendChild(li);
  });
}

window.applyDateRange = function () {

  if (selectedDates.length < 2) {
    alert("Please select a date range");
    return;
  }

  let startDate = new Date(selectedDates[0]);
  let endDate = new Date(selectedDates[1]);
  endDate.setHours(23, 59, 59, 999);

  document.querySelectorAll(".stats-filter").forEach(btn => {
    btn.classList.remove("active");
  });

  calculateStats("range", startDate, endDate);
};

window.printStats = function () {

  let printWindow = window.open("", "", "width=900,height=700");

  let reasonStats = {};
  let programStats = {};

  currentFilteredLogs.forEach(log => {

    let reasons = Array.isArray(log.reason)
      ? log.reason
      : [log.reason || ""];

    reasons.forEach(r => {
      let key = r.toLowerCase().trim();
      if (!reasonStats[key]) reasonStats[key] = 0;
      reasonStats[key]++;
    });

    let p = (log.program || "Unknown").toString().trim();
    if (!programStats[p]) programStats[p] = 0;
    programStats[p]++;
  });

  let reasonHTML = "";
  Object.keys(reasonStats).forEach(r => {
    let label = r.charAt(0).toUpperCase() + r.slice(1);
    reasonHTML += `<li>${label}: ${reasonStats[r]}</li>`;
  });

  let programHTML = "";
  Object.keys(programStats).forEach(p => {
    programHTML += `<li>${p}: ${programStats[p]}</li>`;
  });

  let content = `
    <h2>Library Statistics Report</h2>

    <p><strong>Total Visitors:</strong> ${totalVisitors.textContent}</p>
    <p><strong>Students:</strong> ${studentCount.textContent}</p>
    <p><strong>Faculty:</strong> ${facultyCount.textContent}</p>

    <h3>Reason Statistics</h3>
    <ul>${reasonHTML}</ul>

    <h3>Program Summary</h3>
    <ul>${programHTML}</ul>

    <hr>

    <table border="1" cellspacing="0" cellpadding="5" width="100%">
      <tr>
        <th>Name</th>
        <th>Type</th>
        <th>Program</th>
        <th>Reason</th>
        <th>Time In</th>
        <th>Time Out</th>
      </tr>

      ${currentFilteredLogs.map(log => {

        let timeIn = log.time_in
          ? log.time_in.toDate().toLocaleString()
          : "-";

        let timeOut = log.time_out
          ? log.time_out.toDate().toLocaleString()
          : "-";

        let reason = Array.isArray(log.reason)
          ? log.reason.join(" / ")
          : (log.reason || "-");

        return `
          <tr>
            <td>${log.name || "-"}</td>
            <td>${Array.isArray(log.userType) ? log.userType.join(" / ") : (log.userType || "-")}</td>
            <td>${log.program || "-"}</td>
            <td>${reason}</td>
            <td>${timeIn}</td>
            <td>${timeOut}</td>
          </tr>
        `;
      }).join("")}

    </table>
  `;

  printWindow.document.write(content);
  printWindow.document.close();
  printWindow.print();
};

window.exportCSV = function () {

  if (currentFilteredLogs.length === 0) {
    alert("No data to export");
    return;
  }

  let programStats = {};

  currentFilteredLogs.forEach(log => {
    let p = (log.program || "Unknown").toString().trim();
    if (!programStats[p]) programStats[p] = 0;
    programStats[p]++;
  });

  let csv = `Library Statistics Report\n\n`;
  csv += `Total Visitors: ${totalVisitors.textContent}\n`;
  csv += `Students: ${studentCount.textContent}\n`;
  csv += `Faculty: ${facultyCount.textContent}\n\n`;

  // ✅ PROGRAM SUMMARY
  csv += `Program Summary:\n`;
  Object.keys(programStats).forEach(p => {
    csv += `${p}: ${programStats[p]}\n`;
  });

  // ✅ ADD TABLE DATA (THIS WAS MISSING)
  csv += `\nName,Type,Program,Reason,Date,Time In,Time Out\n`;

  currentFilteredLogs.forEach(log => {

    let name = log.name || "";

    let type = Array.isArray(log.userType)
      ? log.userType.join(" / ")
      : (log.userType || "");

    let program = log.program || "";

    let reason = Array.isArray(log.reason)
      ? log.reason.join(" / ")
      : (log.reason || "");

    let date = "";
    let timeIn = "";
    let timeOut = "";

    if (log.time_in) {
      let d = log.time_in.toDate();
      date = d.toLocaleDateString();
      timeIn = d.toLocaleTimeString();
    }

    if (log.time_out) {
      let out = log.time_out.toDate();
      timeOut = out.toLocaleTimeString();
    }

    csv += `${name},${type},${program},${reason},${date},${timeIn},${timeOut}\n`;
  });

  let blob = new Blob([csv], { type: "text/csv" });
  let url = URL.createObjectURL(blob);

  let a = document.createElement("a");
  a.href = url;
  a.download = `library_stats.csv`;
  a.click();

  URL.revokeObjectURL(url);
};