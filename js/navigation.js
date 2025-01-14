import { initializeApp } from "https://www.gstatic.com/firebasejs/10.5.0/firebase-app.js";
import { getAnalytics, logEvent } from "https://www.gstatic.com/firebasejs/10.5.0/firebase-analytics.js";

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyCgM34-XC4WdJ3WXeFMSO0pu75kQPPQqlk",
  authDomain: "t-coins-world.firebaseapp.com",
  databaseURL: "https://t-coins-world-default-rtdb.firebaseio.com",
  projectId: "t-coins-world",
  storageBucket: "t-coins-world.appspot.com",
  messagingSenderId: "1065880477947",
  appId: "1:1065880477947:web:9ebb8e28c58a8f2aa4505e",
  measurementId: "G-HGR6JKWBRZ",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// ***************************************************************************************************************
// Navigation Controller
const home = document.getElementById("home");
const notify = document.getElementById("Notification");
const chat = document.getElementById("chat");
const setting = document.getElementById("setting");
const dashboad = document.getElementById("dashboad");

// Navigation Events with Analytics
home.addEventListener("click", () => {
  logEvent(analytics, "navigation", { page: "home" });
  window.location.href = "home.html";
});

notify.addEventListener("click", () => {
  logEvent(analytics, "navigation", { page: "notification" });
  window.location.href = "Notification.html";
});

chat.addEventListener("click", () => {
  logEvent(analytics, "navigation", { page: "chat" });
  window.location.href = "chat.html";
});

setting.addEventListener("click", () => {
  logEvent(analytics, "navigation", { page: "setting" });
  window.location.href = "setting.html";
});

dashboad.addEventListener("click", () => {
  logEvent(analytics, "navigation", { page: "dashboard" });
  window.location.href = "dashboad.html";
});
