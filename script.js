import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";

import { 
getAuth,
createUserWithEmailAndPassword,
signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

import {
getFirestore,
doc,
setDoc,
getDoc,
collection,
addDoc,
serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";


const firebaseConfig = {
  apiKey: "AIzaSyAvE8pSw4xZFuM5hrLkv-4tIBFjwonIRuw",
  authDomain: "neu-library-system-ff60b.firebaseapp.com",
  projectId: "neu-library-system-ff60b",
  storageBucket: "neu-library-system-ff60b.firebasestorage.app",
  messagingSenderId: "870414459461",
  appId: "1:870414459461:web:d6d34f0f197de766e5792c"
};


// INITIALIZE FIREBASE
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);


function showAlert(message, type = "info") {

  let container = document.querySelector(".alert-container");

  if (!container) {
    container = document.createElement("div");
    container.className = "alert-container";
    document.body.appendChild(container);
  }

  const alertBox = document.createElement("div");
  alertBox.className = `custom-alert ${type}`;
  alertBox.innerHTML = `<strong>${type.toUpperCase()}</strong><br>${message}`;

  container.appendChild(alertBox);

  setTimeout(() => {
    alertBox.classList.add("show");
  }, 100);

  setTimeout(() => {
    alertBox.classList.remove("show");
    setTimeout(() => alertBox.remove(), 300);
  }, 3000);

}


const tabs = document.querySelectorAll(".tab");


window.showLogin = function(){
document.getElementById("login").classList.add("active");
document.getElementById("register").classList.remove("active");
document.getElementById("admin").classList.remove("active");

tabs.forEach(tab => tab.classList.remove("active"));
tabs[0].classList.add("active");
}


window.showRegister = function(){
document.getElementById("login").classList.remove("active");
document.getElementById("register").classList.add("active");
document.getElementById("admin").classList.remove("active");

tabs.forEach(tab => tab.classList.remove("active"));
tabs[1].classList.add("active");
}

window.showAdmin = function(){
document.getElementById("login").classList.remove("active");
document.getElementById("register").classList.remove("active");
document.getElementById("admin").classList.add("active");

tabs.forEach(tab => tab.classList.remove("active"));
tabs[2].classList.add("active");
}

window.changeUserType = function(){

const userType = document.getElementById("userType").value;

const studentGroup = document.getElementById("studentProgramGroup");
const facultyGroup = document.getElementById("facultyDepartmentGroup");

const studentSelect = document.getElementById("regProgram");
const facultySelect = document.getElementById("regProgramFaculty");


studentGroup.style.display = "none";
facultyGroup.style.display = "none";

studentSelect.required = false;
facultySelect.required = false;

if(userType === "student"){
  studentGroup.style.display = "block";
  studentSelect.required = true;
}

if(userType === "faculty"){
  facultyGroup.style.display = "block";
  facultySelect.required = true;
}

}

window.registerUser = async function(event){

event.preventDefault();

const name = document.querySelector('#register input[type="text"]').value;
const email = document.querySelector('#register input[type="email"]').value;
const password = document.querySelector('#register input[type="password"]').value;
const userType = document.getElementById("userType").value;

let program = "";
let department = "";

if(userType === "student"){
  program = document.getElementById("regProgram").value;
}

if(userType === "faculty"){
  department = document.getElementById("regProgramFaculty").value;
}

try{

const userCredential = await createUserWithEmailAndPassword(auth,email,password);
const user = userCredential.user;

await setDoc(doc(db,"users",user.uid),{
  name,
  email,
  userType, 
  program,
  department,
  blocked: false
});

showAlert("Registration Successful!", "success");
showLogin();

}
catch(error){
showAlert(error.message, "error");
}

if(!userType){
  showAlert("Please select user type!", "warning");
  return;
}

}


window.loginUser = async function(event){

event.preventDefault();

const email = document.querySelector('#login input[type="email"]').value;
const password = document.querySelector('#login input[type="password"]').value;

try{

const userCredential = await signInWithEmailAndPassword(auth,email,password);
const user = userCredential.user;

const userSnap = await getDoc(doc(db,"users",user.uid));

if(!userSnap.exists()){
showAlert("User data not found.", "error");
return;
}

const userData = userSnap.data();

if(
  Array.isArray(userData.userType) &&
  userData.userType.includes("admin") &&
  userData.userType.length === 1
){
showAlert("Please login using the Admin tab.", "info");
return;
}

if(userData.blocked){
showAlert("You are blocked from using the library.", "warning");
return;
}


document.getElementById("visitPopup").style.display = "flex";

}
catch(error){
showAlert(error.message, "error");
}

}


window.adminLogin = async function(event){

event.preventDefault();

const email = document.querySelector('#admin input[type="email"]').value;
const password = document.querySelector('#admin input[type="password"]').value;

try{

const userCredential = await signInWithEmailAndPassword(auth,email,password);
const user = userCredential.user;

const userSnap = await getDoc(doc(db,"users",user.uid));

if(!userSnap.exists()){
showAlert("Admin data not found.", "error");
return;
}

const userData = userSnap.data();

if(
  !Array.isArray(userData.userType) ||
  !userData.userType.includes("admin")
){
showAlert("Access denied. Not an admin.", "error");
return;
}


showAlert("Welcome Admin!", "success");

setTimeout(()=>{
  window.location.href = "admin-dashboard.html";
},1000);

}
catch(error){
showAlert(error.message, "error");
}

}

window.submitVisit = async function(event){

event.preventDefault();

const reason = document.getElementById("reason").value;
const notes = document.getElementById("notes").value;

try{

const user = auth.currentUser;

if(!user){
showAlert("User not logged in", "error");
return;
}

const userDoc = await getDoc(doc(db,"users",user.uid));

if(!userDoc.exists()){
showAlert("User data not found", "error");
return;
}

const userData = userDoc.data();

await addDoc(collection(db,"visitor_logs"),{
  name: userData.name,
  email: userData.email,
  userType: userData.userType,
  program: userData.program || "",
  department: userData.department || "",
  reason,
  notes,
  time_in: serverTimestamp()
});

showAlert("Visit recorded successfully!", "success");

setTimeout(()=>{
  document.getElementById("welcomeAlert").style.display = "block";
},1000);

}
catch(error){
showAlert(error.message, "error");
}

}

window.closeAlert = function(){

document.getElementById("welcomeAlert").style.display = "none";

setTimeout(()=>{
  window.location.href = "dashboard.html";
},500);

}

window.togglePassword = function(icon) {

  const container = icon.closest(".password-field");
  const input = container.querySelector("input");

  if (icon.classList.contains("fa-eye")) {
    input.type = "text";
    icon.classList.remove("fa-eye");
    icon.classList.add("fa-eye-slash");

  } else {
    input.type = "password";
    icon.classList.remove("fa-eye-slash");
    icon.classList.add("fa-eye");
  }

}
