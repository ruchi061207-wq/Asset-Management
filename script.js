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
window.addAsset = async function () {
  let asset = {
    name: assetName.value,
    vendor: vendorName.value,
    purchase: purchaseDate.value,
    expiry: expiryDate.value
  };

  if (!asset.name || !asset.vendor || !asset.purchase || !asset.expiry) {
    alert("Fill all fields");
    return;
  }

  if (editIndex === -1) {
    await addDoc(collection(db, "assets"), asset);
  } else {
    await updateDoc(doc(db, "assets", assets[editIndex].id), asset);
    editIndex = -1;
  }

  clearForm();
  loadAssets();
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
  assetName.value = a.name;
  serialNo.value = a.serialno;
  vendorName.value = a.vendor;
  purchaseDate.value = a.purchase;
  expiryDate.value = a.expiry;
  editIndex = i;
};

// 🔍 Search
window.searchAsset = function () {
  let val = search.value.toLowerCase();
  let filtered = assets.filter(a =>
    a.name.toLowerCase().includes(val) ||
    a.vendor.toLowerCase().includes(val)
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
    let diff = (expiryDate - today) / (1000*60*60*24);

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
        <td>${asset.no)</td>
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
  assetName.value = "";
  serialNo.value = "";
  vendorName.value = "";
  purchaseDate.value = "";
  expiryDate.value = "";
}

// 🚀 Load on start
window.onload = loadAssets; 
