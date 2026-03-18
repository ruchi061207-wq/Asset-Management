import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { 
  getFirestore, collection, addDoc, getDocs, deleteDoc, doc, updateDoc 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// 🔑 Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyD8tTfM7kgtDAz66bD_Ri2_WHVbvUfVXl0",
  authDomain: "asset-management-191b8.firebaseapp.com",
  projectId: "asset-management-191b8",
  storageBucket: "asset-management-191b8.firebasestorage.app",
  messagingSenderId: "140250118302",
  appId: "1:140250118302:web:e10d723fd07bba652ea38f"
};

// 🔥 Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let assets = [];
let editIndex = -1;

// ➕ Add / Update
async function addAsset() {
  const name = document.getElementById("assetName").value;
  const serialNumber = document.getElementById("serialNumber").value;
  const vendor = document.getElementById("vendorName").value;
  const purchase = document.getElementById("purchaseDate").value;
  const expiry = document.getElementById("expiryDate").value;

  if (!name || !serialNumber || !vendor || !purchase || !expiry) {
    alert("Fill all fields");
    return;
  }

  try {
    if (editIndex === -1) {
      await addDoc(collection(db, "assets"), {
        name,
        serialNumber,
        vendor,
        purchase,
        expiry
      });
    } else {
      await updateDoc(doc(db, "assets", assets[editIndex].id), {
        name,
        serialNumber,
        vendor,
        purchase,
        expiry
      });
      editIndex = -1;
    }

    clearForm();
    loadAssets();

  } catch (e) {
    console.error(e);
    alert("Error saving data");
  }
};

// 📥 Load data
async function loadAssets() {
  assets = [];
  const snapshot = await getDocs(collection(db, "assets"));

  snapshot.forEach((docSnap) => {
    assets.push({ id: docSnap.id, ...docSnap.data() });
  });

  displayAssets();
}

// ❌ Delete
window.deleteAsset = async function (i) {
  if (confirm("Delete this asset?")) {
    await deleteDoc(doc(db, "assets", assets[i].id));
    loadAssets();
  }
};

// ✏️ Edit
window.editAsset = function (i) {
  let a = assets[i];

  document.getElementById("assetName").value = a.name;
  document.getElementById("serialNumber").value = a.serialNumber; // ✅ NEW
  document.getElementById("vendorName").value = a.vendor;
  document.getElementById("purchaseDate").value = a.purchase;
  document.getElementById("expiryDate").value = a.expiry;

  editIndex = i;
};

// 🔍 Search
window.searchAsset = function () {
  let val = document.getElementById("search").value.toLowerCase();

  let filtered = assets.filter(a =>
    a.name.toLowerCase().includes(val) ||
    a.vendor.toLowerCase().includes(val) ||
    (a.serialNumber && a.serialNumber.toLowerCase().includes(val)) // ✅ NEW
  );

  displayAssets(filtered);
};

// 📊 Display
function displayAssets(filtered = assets) {
  let table = document.getElementById("assetTable");
  table.innerHTML = "";

  let total = assets.length, expiring = 0, expired = 0;
  let today = new Date();

  filtered.forEach((asset, index) => {
    let expiryDate = new Date(asset.expiry);
    let diff = (expiryDate - today) / (1000 * 60 * 60 * 24);

    let status = "Active";
    let cls = "";

    if (diff <= 7 && diff >= 0) {
      status = "Expiring";
      cls = "expiring";
      expiring++;
    } else if (diff < 0) {
      status = "Expired";
      cls = "expired";
      expired++;
    }

    table.innerHTML += `
      <tr class="${cls}">
        <td>${asset.name}</td>
        <td>${asset.serialNumber || ""}</td>
        <td>${asset.vendor}</td>
        <td>${asset.purchase}</td>
        <td>${asset.expiry}</td>
        <td>${status}</td>
        <td>
          <button onclick="editAsset(${index})">Edit</button>
          <button onclick="deleteAsset(${index})">Delete</button>
        </td>
      </tr>
    `;
  });

  document.getElementById("total").innerText = total;
  document.getElementById("expiring").innerText = expiring;
  document.getElementById("expired").innerText = expired;
}

// 🧹 Clear form
function clearForm() {
  document.getElementById("assetName").value = "";
  document.getElementById("serialNumber").value = ""; // ✅ NEW
  document.getElementById("vendorName").value = "";
  document.getElementById("purchaseDate").value = "";
  document.getElementById("expiryDate").value = "";
}

document.getElementById("addBtn").addEventListener("click", addAsset);

// 🚀 Load on start
window.onload = loadAssets;
