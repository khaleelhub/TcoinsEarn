import { initializeApp } from "https://www.gstatic.com/firebasejs/10.5.0/firebase-app.js";
import { getDatabase, ref, onValue, update, push, get } from "https://www.gstatic.com/firebasejs/10.5.0/firebase-database.js";
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
const transactionTable = document.getElementById("transaction-table")?.querySelector("tbody");
const recipientEmailInput = document.getElementById("recipient-email");
const transferAmountInput = document.getElementById("transfer-amount");
const transferBtn = document.getElementById("transfer-btn");
const accountNameInput = document.getElementById("account-name");
const accountNumberInput = document.getElementById("account-number");
const bankNameInput = document.getElementById("bank-name");
const withdrawAmountInput = document.getElementById("withdraw-amount");
const withdrawBtn = document.getElementById("withdraw-btn");

let currentUserId = null;
let userCoins = 0;

// Authenticate User and Load Wallet Data
onAuthStateChanged(auth, (user) => {
  if (user) {
    currentUserId = user.uid;
    logEvent(analytics, "user_logged_in", { userId: currentUserId });
    loadWalletData();
    loadTransactionHistory();
  } else {
    alert("Please log in to access your wallet.");
    window.location.href = "userRegistulation.html";
  }
});

// ** Load Wallet Data **
function loadWalletData() {
  const userRef = ref(db, `users/${currentUserId}`);
  onValue(userRef, (snapshot) => {
    if (snapshot.exists()) {
      const userData = snapshot.val();
      userCoins = userData.coins || 0;

      if (totalCoinsElem) totalCoinsElem.textContent = userCoins;
      if (dollarValueElem)
        dollarValueElem.textContent = `$${(userCoins / 3000 * 0.4).toFixed(2)}`;

      // Log wallet analytics
      logEvent(analytics, "wallet_data_loaded", {
        userId: currentUserId,
        coins: userCoins,
        dollarValue: (userCoins / 3000 * 0.4).toFixed(2),
      });
    } else {
      alert("Error: Wallet data not found!");
    }
  });
}

// ** Load Transaction History **
function loadTransactionHistory() {
  const transactionsRef = ref(db, `transactions/${currentUserId}`);
  if (transactionTable) {
    onValue(transactionsRef, (snapshot) => {
      transactionTable.innerHTML = ""; // Clear table
      snapshot.forEach((childSnapshot) => {
        const transaction = childSnapshot.val();
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${new Date(transaction.timestamp).toLocaleDateString()}</td>
          <td>${transaction.description}</td>
          <td>${transaction.amount > 0 ? `+${transaction.amount}` : transaction.amount}</td>
        `;
        transactionTable.appendChild(row);
      });

      // Log transaction analytics
      logEvent(analytics, "transactions_loaded", { userId: currentUserId });
    });
  }
}

// ** Handle Coin Transfer **
transferBtn?.addEventListener("click", async () => {
  const recipientEmail = recipientEmailInput.value.trim();
  const transferAmount = parseInt(transferAmountInput.value.trim(), 10);

  if (!recipientEmail || transferAmount <= 0 || transferAmount > userCoins) {
    alert("Invalid transfer details or insufficient coins.");
    return;
  }

  try {
    const recipientRef = ref(db, "users");
    const recipientSnapshot = await get(recipientRef);
    let recipientId = null;

    recipientSnapshot.forEach((childSnapshot) => {
      if (childSnapshot.val()?.email === recipientEmail) {
        recipientId = childSnapshot.key;
      }
    });

    if (recipientId) {
      const senderRef = ref(db, `users/${currentUserId}`);
      const recipientUserRef = ref(db, `users/${recipientId}`);
      await update(senderRef, { coins: userCoins - transferAmount });
      await update(recipientUserRef, { coins: (recipientSnapshot.val()?.coins || 0) + transferAmount });

      alert("Coins transferred successfully!");

      // Log transfer analytics
      logEvent(analytics, "coin_transfer", {
        senderId: currentUserId,
        recipientId,
        amount: transferAmount,
      });
    } else {
      alert("Recipient not found.");
    }
  } catch (error) {
    console.error("Error transferring coins:", error);
  }
});

// ** Handle Withdrawals **
withdrawBtn?.addEventListener("click", async () => {
  const accountName = accountNameInput.value.trim();
  const accountNumber = accountNumberInput.value.trim();
  const bankName = bankNameInput.value.trim();
  const withdrawAmount = parseInt(withdrawAmountInput.value.trim(), 10);

  if (!accountName || !accountNumber || !bankName || withdrawAmount > userCoins) {
    alert("Invalid withdrawal details or insufficient coins.");
    return;
  }

  try {
    const withdrawalRef = ref(db, `withdrawals/${currentUserId}`);
    await push(withdrawalRef, {
      accountName,
      accountNumber,
      bankName,
      amount: withdrawAmount,
      status: "Pending",
      timestamp: Date.now(),
    });

    alert("Withdrawal request submitted successfully!");

    // Log withdrawal analytics
    logEvent(analytics, "withdrawal_requested", {
      userId: currentUserId,
      amount: withdrawAmount,
      accountName,
      accountNumber,
      bankName,
    });

    // Clear form
    accountNameInput.value = "";
    accountNumberInput.value = "";
    bankNameInput.value = "";
    withdrawAmountInput.value = "";
  } catch (error) {
    console.error("Error submitting withdrawal request:", error);
  }
});

// ** Log User Engagement **
window.addEventListener("beforeunload", () => {
  logEvent(analytics, "user_session_ended", { userId: currentUserId });
});
