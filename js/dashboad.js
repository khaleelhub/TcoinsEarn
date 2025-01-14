// Firebase Imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.5.0/firebase-app.js";
import { getDatabase, ref, onValue, update, push } from "https://www.gstatic.com/firebasejs/10.5.0/firebase-database.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.5.0/firebase-auth.js";
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
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);
const analytics = getAnalytics(app);

// DOM Elements
const totalCoinsElem = document.getElementById("total-coins");
const dollarValueElem = document.getElementById("dollar-value");
const transactionTable = document.getElementById("transaction-table").querySelector("tbody");
const referralCodeElem = document.getElementById("referral-code");
const withdrawalList = document.getElementById("withdrawal-list");
const pendingRequestsElem = document.querySelector(".pending-requests ul");
const filterTypeSelect = document.getElementById("filter-type");
const themeSwitch = document.getElementById("theme-switch");
const exportBtn = document.querySelector(".export-section button");
const exploreBtn = document.getElementById("explore");
const walletBtn = document.getElementById("wallet");

let currentUserId = null;
let userCoins = 0;
let currentPage = 1;
const itemsPerPage = 5;

// ** User Authentication **
onAuthStateChanged(auth, (user) => {
  if (user) {
    currentUserId = user.uid;
    logEvent(analytics, "user_logged_in", { userId: currentUserId });
    loadDashboard();
  } else {
    logEvent(analytics, "user_logged_out");
    window.location.href = "userRegistulation.html"; // Redirect to login
  }
});

// ** Load Dashboard Data **
function loadDashboard() {
  loadUserCoins();
  loadTransactions();
  generateReferralCode();
  loadWithdrawalRequests();
  loadPendingRequests();
  setupNavigationHandlers();
  logEvent(analytics, "dashboard_loaded", { userId: currentUserId });
}

// ** Load User Coins and Breakdown **
function loadUserCoins() {
  const userRef = ref(db, `users/${currentUserId}`);
  onValue(userRef, (snapshot) => {
    const userData = snapshot.val();
    userCoins = userData?.coins || 0;

    totalCoinsElem.textContent = userCoins;
    dollarValueElem.textContent = `$${(userCoins / 3000 * 0.4).toFixed(2)}`;
    logEvent(analytics, "coins_loaded", { userId: currentUserId, totalCoins: userCoins });
  });
}

// ** Load Transactions with Pagination **
function loadTransactions() {
  const transactionsRef = ref(db, `transactions/${currentUserId}`);
  onValue(transactionsRef, (snapshot) => {
    const transactions = [];
    snapshot.forEach((childSnapshot) => {
      const transaction = childSnapshot.val();
      transactions.push(transaction);
    });

    renderTransactions(transactions);
    logEvent(analytics, "transactions_loaded", { userId: currentUserId });
  });
}

function renderTransactions(transactions) {
  transactionTable.innerHTML = ""; // Clear table

  const totalPages = Math.ceil(transactions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTransactions = transactions.slice(startIndex, endIndex);

  paginatedTransactions.forEach((transaction) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${new Date(transaction.timestamp).toLocaleDateString()}</td>
      <td>${transaction.description}</td>
      <td>${transaction.amount > 0 ? `+${transaction.amount}` : transaction.amount}</td>
    `;
    transactionTable.appendChild(row);
  });

  createPagination(totalPages);
}

function createPagination(totalPages) {
  const paginationElem = document.querySelector(".pagination");
  paginationElem.innerHTML = ""; // Clear pagination

  for (let i = 1; i <= totalPages; i++) {
    const button = document.createElement("button");
    button.textContent = i;
    button.classList.toggle("active", i === currentPage);
    button.addEventListener("click", () => {
      currentPage = i;
      loadTransactions();
    });
    paginationElem.appendChild(button);
  }
}

// ** Generate Referral Code **
function generateReferralCode() {
  referralCodeElem.textContent = `REF-${currentUserId.slice(0, 6).toUpperCase()}`;
  logEvent(analytics, "referral_code_generated", { userId: currentUserId });
}

// ** Load Withdrawal Requests **
function loadWithdrawalRequests() {
  const withdrawalsRef = ref(db, `withdrawals/${currentUserId}`);
  onValue(withdrawalsRef, (snapshot) => {
    withdrawalList.innerHTML = ""; // Clear withdrawal list

    snapshot.forEach((childSnapshot) => {
      const withdrawal = childSnapshot.val();
      const listItem = document.createElement("li");
      listItem.textContent = `Amount: ${withdrawal.amount} | Status: ${withdrawal.status}`;
      withdrawalList.appendChild(listItem);
    });

    logEvent(analytics, "withdrawal_requests_loaded", { userId: currentUserId });
  });
}

// ** Load Pending Requests **
function loadPendingRequests() {
  const requestsRef = ref(db, `pendingRequests`);
  onValue(requestsRef, (snapshot) => {
    pendingRequestsElem.innerHTML = ""; // Clear pending requests list

    snapshot.forEach((childSnapshot) => {
      const request = childSnapshot.val();
      const listItem = document.createElement("li");
      listItem.textContent = `User: ${request.userId} | Amount: ${request.amount} | Status: ${request.status}`;
      pendingRequestsElem.appendChild(listItem);
    });

    logEvent(analytics, "pending_requests_loaded");
  });
}

// ** Setup Navigation Handlers **
function setupNavigationHandlers() {
  exploreBtn.addEventListener("click", () => {
    logEvent(analytics, "navigation_clicked", { page: "Explore" });
    window.location.href = "explore.html";
  });

  walletBtn.addEventListener("click", () => {
    logEvent(analytics, "navigation_clicked", { page: "Wallet" });
    window.location.href = "wallet.html";
  });
}

// ** Light/Dark Mode Toggle **
themeSwitch.addEventListener("click", () => {
  document.body.classList.toggle("light-mode");
  logEvent(analytics, "theme_toggled", { mode: document.body.classList.contains("light-mode") ? "light" : "dark" });
});

// ** Export Transactions to CSV **
exportBtn.addEventListener("click", () => {
  const rows = [...transactionTable.querySelectorAll("tr")].map((row) => {
    const cells = [...row.querySelectorAll("td")].map((cell) => cell.textContent);
    return cells.join(",");
  });

  const csvContent = "data:text/csv;charset=utf-8," + rows.join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", "transactions.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  logEvent(analytics, "transactions_exported");
});
