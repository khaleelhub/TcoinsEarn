import { initializeApp } from "https://www.gstatic.com/firebasejs/10.5.0/firebase-app.js";
import { getDatabase, ref, onValue, push } from "https://www.gstatic.com/firebasejs/10.5.0/firebase-database.js";
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
  measurementId: "G-HGR6JKWBRZ",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);
const analytics = getAnalytics(app);

// DOM Elements
const totalCoinsElem = document.getElementById("total-coins");
const referralBonusElem = document.getElementById("referral-bonus");
const claimCoinsBtn = document.getElementById("claim-coins-btn");
const coinRateElem = document.getElementById("coin-rate");
const coinCalculatorInput = document.getElementById("coin-input");
const calculatedCostElem = document.getElementById("calculated-cost");
const purchaseModal = document.getElementById("purchase-modal");
const purchaseItemElem = document.getElementById("purchase-item");
const paymentMethodSelect = document.getElementById("payment-method");
const transactionIdElem = document.getElementById("transaction-id");
const confirmPurchaseBtn = document.getElementById("confirm-purchase-btn");
const cancelPurchaseBtn = document.getElementById("cancel-purchase-btn");
const purchaseHistoryTable = document.getElementById("purchase-history");

let currentUserId = null;
let currentPurchaseCoins = null;
let lastPurchaseTimestamp = null;

// Authenticate User
onAuthStateChanged(auth, (user) => {
  if (user) {
    currentUserId = user.uid;
    loadUserData();
    loadPurchaseHistory();
    checkPurchaseCooldown();
  } else {
    alert("Please log in to access premium features.");
    window.location.href = "/login.html";
  }
});

// Load User Data
function loadUserData() {
  const userRef = ref(db, `users/${currentUserId}`);
  onValue(userRef, (snapshot) => {
    const data = snapshot.val();
    totalCoinsElem.textContent = data.coins || 0;
    referralBonusElem.textContent = data.referralBonus || 0;
    logEvent(analytics, "user_data_loaded", { userId: currentUserId });
  });
}

// Update Coin Rate
function updateCoinRate() {
  const rate = "3000 Coins = $0.40"; // Dynamic rate logic can be added here
  coinRateElem.textContent = rate;
}

// Coin Calculator
coinCalculatorInput.addEventListener("input", () => {
  const coins = parseInt(coinCalculatorInput.value.trim(), 10) || 0;
  const cost = (coins * 0.001).toFixed(2);
  calculatedCostElem.textContent = cost;
});

// Handle Purchase Button Click
document.querySelectorAll(".buy-coins-btn").forEach((btn) => {
  btn.addEventListener("click", (e) => {
    const coins = parseInt(e.target.dataset.coins, 10);

    // Prevent multiple purchases in one day
    if (lastPurchaseTimestamp && Date.now() - lastPurchaseTimestamp < 24 * 60 * 60 * 1000) {
      alert("You can only make one purchase per day. Please try again tomorrow.");
      return;
    }

    currentPurchaseCoins = coins;
    purchaseItemElem.textContent = `${coins} Coins for $${(coins * 0.01).toFixed(2)}`;
    transactionIdElem.textContent = `TXN-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    purchaseModal.classList.remove("hidden");
  });
});

// Confirm Purchase
confirmPurchaseBtn.addEventListener("click", async () => {
  const paymentMethod = paymentMethodSelect.value;
  const transactionId = transactionIdElem.textContent;

  if (!paymentMethod) {
    alert("Please select a payment method.");
    return;
  }

  const purchaseLogRef = ref(db, `purchases/${currentUserId}`);
  await push(purchaseLogRef, {
    coins: currentPurchaseCoins,
    amount: `$${(currentPurchaseCoins * 0.01).toFixed(2)}`,
    paymentMethod,
    status: "Pending",
    transactionId,
    timestamp: Date.now(),
  });

  alert(
    `Your purchase request has been logged. Please complete your payment using the details below:
    \nAccount Number: 822913936
    \nAccount Name: Opay Wallet
    \nBank: Opay`
  );

  lastPurchaseTimestamp = Date.now();

  logEvent(analytics, "purchase_requested", {
    userId: currentUserId,
    coins: currentPurchaseCoins,
    paymentMethod,
    status: "Pending",
    transactionId,
  });

  purchaseModal.classList.add("hidden");
  currentPurchaseCoins = null;
});

// Cancel Purchase
cancelPurchaseBtn.addEventListener("click", () => {
  purchaseModal.classList.add("hidden");
  currentPurchaseCoins = null;
});

// Load Purchase History
function loadPurchaseHistory() {
  const purchaseHistoryRef = ref(db, `purchases/${currentUserId}`);
  onValue(purchaseHistoryRef, (snapshot) => {
    purchaseHistoryTable.innerHTML = ""; // Clear existing rows

    snapshot.forEach((childSnapshot) => {
      const purchase = childSnapshot.val();
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${purchase.transactionId || "N/A"}</td>
        <td>${purchase.coins || 0}</td>
        <td>${purchase.status || "Pending"}</td>
        <td>${new Date(purchase.timestamp).toLocaleString()}</td>
      `;
      purchaseHistoryTable.appendChild(row);
    });

    logEvent(analytics, "purchase_history_loaded", { userId: currentUserId });
  });
}

// Check Purchase Cooldown
function checkPurchaseCooldown() {
  const purchaseHistoryRef = ref(db, `purchases/${currentUserId}`);
  onValue(purchaseHistoryRef, (snapshot) => {
    snapshot.forEach((childSnapshot) => {
      const purchase = childSnapshot.val();
      if (purchase.status === "Pending") {
        lastPurchaseTimestamp = purchase.timestamp;
      }
    });
  });
}

// Initialize Live Coin Rate
updateCoinRate();
