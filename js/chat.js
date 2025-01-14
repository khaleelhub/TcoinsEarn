import { initializeApp } from "https://www.gstatic.com/firebasejs/10.5.0/firebase-app.js";
import { getDatabase, ref, push, onValue, remove, set, update } from "https://www.gstatic.com/firebasejs/10.5.0/firebase-database.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.5.0/firebase-auth.js";
import { getAnalytics, logEvent } from "https://www.gstatic.com/firebasejs/10.5.0/firebase-analytics.js";

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyCgM34-XC4WdJ3WXeFMSO0pu75kQPPQqlk",
  authDomain: "t-coins-world.firebaseapp.com",
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
const chatBox = document.getElementById("chat-box");
const messageInput = document.getElementById("message-input");
const sendButton = document.getElementById("send-btn");
const typingIndicator = document.getElementById("typing-indicator");
const userList = document.getElementById("user-list");

const messagesRef = ref(db, "messages");

// Track Events with Analytics
function trackEvent(eventName, params) {
  logEvent(analytics, eventName, params);
}

// Display Messages
function displayMessage(messageData, isOwnMessage) {
  const messageDiv = document.createElement("div");
  messageDiv.classList.add("message");
  if (isOwnMessage) messageDiv.classList.add("own");

  const { user, message, timestamp } = messageData;
  messageDiv.innerHTML = `
    <strong>${user}:</strong> ${message} <br>
    <small>${new Date(timestamp).toLocaleTimeString()}</small>
  `;
  chatBox.appendChild(messageDiv);
  chatBox.scrollTop = chatBox.scrollHeight; // Auto-scroll
}

// Listen for Messages
onValue(messagesRef, (snapshot) => {
  chatBox.innerHTML = ""; // Clear current messages
  snapshot.forEach((childSnapshot) => {
    const messageData = childSnapshot.val();
    const isOwnMessage = auth.currentUser && messageData.userId === auth.currentUser.uid;
    displayMessage(messageData, isOwnMessage);
  });
});

// Send Messages
sendButton.addEventListener("click", async () => {
  const message = messageInput.value.trim();
  if (message) {
    const user = auth.currentUser?.email || "Anonymous";
    const userId = auth.currentUser?.uid || "guest";

    await push(messagesRef, {
      user,
      userId,
      message,
      timestamp: Date.now(),
    });

    // Track message sent event
    trackEvent("message_sent", { user, message });

    messageInput.value = ""; // Clear input
  }
});

// Typing Indicator
const typingRef = ref(db, "typing");

messageInput.addEventListener("input", () => {
  set(typingRef, { user: auth.currentUser?.email || "Anonymous", isTyping: true });
  setTimeout(() => {
    set(typingRef, null); // Remove typing indicator after a delay
  }, 3000);

  // Track typing event
  trackEvent("user_typing", { user: auth.currentUser?.email });
});

onValue(typingRef, (snapshot) => {
  if (snapshot.exists()) {
    const { user, isTyping } = snapshot.val();
    typingIndicator.textContent = isTyping ? `${user} is typing...` : "";
  } else {
    typingIndicator.textContent = "";
  }
});

// Online Users
const onlineUsersRef = ref(db, "online-users");

onAuthStateChanged(auth, (user) => {
  if (user) {
    const userRef = ref(onlineUsersRef, user.uid);
    set(userRef, { email: user.email, timestamp: Date.now() });

    // Track user login event
    trackEvent("user_login", { userId: user.uid, email: user.email });

    window.addEventListener("beforeunload", () => {
      remove(userRef);

      // Track user logout event
      trackEvent("user_logout", { userId: user.uid });
    });
  }
});

onValue(onlineUsersRef, (snapshot) => {
  userList.innerHTML = "";
  snapshot.forEach((childSnapshot) => {
    const user = childSnapshot.val();
    const userItem = document.createElement("li");
    userItem.textContent = user.email;
    userList.appendChild(userItem);
  });
});

// Delete Message
function deleteMessage(messageId) {
  remove(ref(db, `messages/${messageId}`));
  trackEvent("message_deleted", { messageId });
}

// Add Delete Button to Own Messages
// (This can be integrated in the `displayMessage` function)
