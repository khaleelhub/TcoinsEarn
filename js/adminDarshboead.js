// Firebase Imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.5.0/firebase-app.js";
import { getDatabase, ref, onValue, update, push, remove } from "https://www.gstatic.com/firebasejs/10.5.0/firebase-database.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.5.0/firebase-auth.js";

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

// DOM Elements
const totalUsersElem = document.getElementById("total-users");
const totalCoinsElem = document.getElementById("total-coins-distributed");
const coinsToDollarsElem = document.getElementById("coins-to-dollars");
const activeAdsElem = document.getElementById("active-ads");
const totalEarningsElem = document.getElementById("total-earnings");
const usersTable = document.getElementById("users-table").querySelector("tbody");
const withdrawalsTable = document.getElementById("withdrawals-table").querySelector("tbody");
const adsList = document.getElementById("ads-list");
const addAdForm = document.getElementById("add-ad-form");
const adNameInput = document.getElementById("ad-name");
const adTypeInput = document.getElementById("ad-type");
const adUrlInput = document.getElementById("ad-url");
const auditLogList = document.getElementById("audit-log-list");
const notificationList = document.getElementById("notification-list");

// Constants
const COIN_TO_DOLLAR_RATE = 3000 / 0.4;

// ** Authentication Check **
onAuthStateChanged(auth, (user) => {
  if (!user) {
    alert("You must be logged in to access the admin dashboard.");
    window.location.href = "login.html";
  } else {
    loadDashboardData();
    addAuditLog("Admin logged in.");
  }
});

// ** Load Dashboard Data **
function loadDashboardData() {
  loadStatistics();
  loadUsers();
  loadWithdrawals();
  loadAds();
  loadAuditLogs();
  loadNotifications();
}

// ** Load Platform Statistics **
function loadStatistics() {
  onValue(ref(db, "users"), (snapshot) => {
    let totalUsers = 0;
    let totalCoins = 0;

    snapshot.forEach((childSnapshot) => {
      totalUsers++;
      totalCoins += childSnapshot.val().coins || 0;
    });

    totalUsersElem.textContent = totalUsers;
    totalCoinsElem.textContent = totalCoins;
    coinsToDollarsElem.textContent = `$${(totalCoins / COIN_TO_DOLLAR_RATE).toFixed(2)}`;
  });

  onValue(ref(db, "ads"), (snapshot) => {
    activeAdsElem.textContent = snapshot.size || 0;
  });

  onValue(ref(db, "transactions"), (snapshot) => {
    let totalEarnings = 0;

    snapshot.forEach((childSnapshot) => {
      const transaction = childSnapshot.val();
      totalEarnings += (transaction.amount || 0) * 0.0004;
    });

    totalEarningsElem.textContent = `$${totalEarnings.toFixed(2)}`;
  });
}

// ** Load Users **
function loadUsers() {
  onValue(ref(db, "users"), (snapshot) => {
    usersTable.innerHTML = ""; // Clear table

    snapshot.forEach((childSnapshot) => {
      const userId = childSnapshot.key;
      const userData = childSnapshot.val();

      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${userData.email}</td>
        <td>${userData.coins || 0}</td>
        <td id="user-status-${userId}">${userData.status || "Active"}</td>
        <td>
          <button class="deactivate-btn" data-user-id="${userId}">Deactivate</button>
          <button class="reset-coins-btn" data-user-id="${userId}">Reset Coins</button>
          <button class="view-user-btn" data-user-id="${userId}">View</button>
        </td>
      `;
      usersTable.appendChild(row);
    });
  });
}

// ** Load Withdrawals **
function loadWithdrawals() {
  onValue(ref(db, "withdrawals"), (snapshot) => {
    withdrawalsTable.innerHTML = ""; // Clear table

    snapshot.forEach((childSnapshot) => {
      const requestId = childSnapshot.key;
      const request = childSnapshot.val();

      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${request.userId}</td>
        <td>${request.amount}</td>
        <td>${request.bankName || ""} - ${request.accountNumber || ""}</td>
        <td id="withdrawal-status-${requestId}">${request.status || "Pending"}</td>
        <td>
          <button class="approve-btn" data-request-id="${requestId}">Approve</button>
          <button class="decline-btn" data-request-id="${requestId}">Decline</button>
        </td>
      `;
      withdrawalsTable.appendChild(row);
    });
  });
}

// ** Load Ads **
function loadAds() {
  onValue(ref(db, "ads"), (snapshot) => {
    adsList.innerHTML = ""; // Clear ads list

    snapshot.forEach((childSnapshot) => {
      const adId = childSnapshot.key;
      const ad = childSnapshot.val();

      const listItem = document.createElement("li");
      listItem.innerHTML = `
        <span>${ad.adName} (${ad.adType})</span>
        <button class="edit-ad-btn" data-ad-id="${adId}">Edit</button>
        <button class="delete-ad-btn" data-ad-id="${adId}">Delete</button>
      `;
      adsList.appendChild(listItem);
    });
  });
}

// ** Add Ad **
addAdForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const adName = adNameInput.value.trim();
  const adType = adTypeInput.value;
  const adUrl = adUrlInput.value.trim();

  if (adName && adUrl) {
    push(ref(db, "ads"), { adName, adType, adUrl });
    alert("Ad added successfully!");
    addAdForm.reset();
    addAuditLog(`Ad '${adName}' added.`);
  }
});

// ** Event Listeners for Actions **
document.addEventListener("click", (event) => {
  const target = event.target;

  // Deactivate User
  if (target.classList.contains("deactivate-btn")) {
    const userId = target.dataset.userId;
    update(ref(db, `users/${userId}`), { status: "Deactivated" });
    alert("User deactivated successfully.");
    addAuditLog(`User ${userId} deactivated.`);
  }

  // Reset User Coins
  if (target.classList.contains("reset-coins-btn")) {
    const userId = target.dataset.userId;
    update(ref(db, `users/${userId}`), { coins: 0 });
    alert("User coins reset successfully.");
    addAuditLog(`Coins reset for user ${userId}.`);
  }

  // Approve Withdrawal
  if (target.classList.contains("approve-btn")) {
    const requestId = target.dataset.requestId;
    update(ref(db, `withdrawals/${requestId}`), { status: "Approved" });
    alert("Withdrawal approved.");
    addAuditLog(`Withdrawal ${requestId} approved.`);
  }

  // Decline Withdrawal
  if (target.classList.contains("decline-btn")) {
    const requestId = target.dataset.requestId;
    update(ref(db, `withdrawals/${requestId}`), { status: "Declined" });
    alert("Withdrawal declined.");
    addAuditLog(`Withdrawal ${requestId} declined.`);
  }

  // Delete Ad
  if (target.classList.contains("delete-ad-btn")) {
    const adId = target.dataset.adId;
    remove(ref(db, `ads/${adId}`));
    alert("Ad deleted successfully.");
    addAuditLog(`Ad ${adId} deleted.`);
  }
});

// ** Load Audit Logs **
function loadAuditLogs() {
  onValue(ref(db, "auditLogs"), (snapshot) => {
    auditLogList.innerHTML = ""; // Clear logs

    snapshot.forEach((childSnapshot) => {
      const log = childSnapshot.val();
      const logItem = document.createElement("li");
      logItem.textContent = log.message;
      auditLogList.appendChild(logItem);
    });
  });
}

// ** Add Audit Log **
function addAuditLog(message) {
  push(ref(db, "auditLogs"), { message, timestamp: Date.now() });
}

// ** Load Notifications **
function loadNotifications() {
  onValue(ref(db, "notifications"), (snapshot) => {
    notificationList.innerHTML = ""; // Clear notifications

    snapshot.forEach((childSnapshot) => {
      const notification = childSnapshot.val();
      const listItem = document.createElement("li");
      listItem.textContent = `${notification.message} (Date: ${new Date(notification.timestamp).toLocaleString()})`;
      notificationList.appendChild(listItem);
    });
  });
}

// ** Send Notification **
function sendNotification(message) {
  push(ref(db, "notifications"), { message, timestamp: Date.now() });
}

// ** New Feature: View User Details Modal **
document.addEventListener("click", (event) => {
  if (event.target.classList.contains("view-user-btn")) {
    const userId = event.target.dataset.userId;
    const userRef = ref(db, `users/${userId}`);

    onValue(userRef, (snapshot) => {
      const userData = snapshot.val();
      alert(`
        User Details:
        Email: ${userData.email}
        Coins: ${userData.coins || 0}
        Status: ${userData.status || "Active"}
        Registration Date: ${new Date(userData.timestamp).toLocaleString()}
      `);
    });
  }
});

// ** New Feature: Export Statistics to CSV **
function exportStatisticsToCSV() {
  const csvContent = [
    ["Total Users", totalUsersElem.textContent],
    ["Total Coins Distributed", totalCoinsElem.textContent],
    ["Dollar Value of Coins", coinsToDollarsElem.textContent],
    ["Active Ads", activeAdsElem.textContent],
    ["Total Earnings", totalEarningsElem.textContent],
  ]
    .map((row) => row.join(","))
    .join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", "statistics.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  addAuditLog("Statistics exported to CSV.");
}

// ** New Feature: Chart Rendering (Earnings) **
function renderEarningsChart() {
  const ctx = document.getElementById("earnings-chart").getContext("2d");
  const earningsData = {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    datasets: [
      {
        label: "Earnings (in USD)",
        data: [500, 800, 600, 1000, 700, 1200],
        backgroundColor: "rgba(75, 192, 192, 0.2)",
        borderColor: "rgba(75, 192, 192, 1)",
        borderWidth: 1,
      },
    ],
  };

  new Chart(ctx, {
    type: "line",
    data: earningsData,
    options: {
      responsive: true,
      plugins: {
        legend: { display: true, position: "top" },
      },
    },
  });
}

// ** Initialize Chart and Data on Load **
document.addEventListener("DOMContentLoaded", () => {
  renderEarningsChart();
});
