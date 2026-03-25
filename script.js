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
    serial: serialNo.value,
    vendor: vendorName.value,
    purchase: purchaseDate.value,
    expiry: expiryDate.value
  };

  if (!asset.name || !asset.serial || !asset.vendor || !asset.purchase || !asset.expiry) {
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
window.deleteAsset = async function (id) {

  if (confirm("Delete this asset?")) {

    await deleteDoc(doc(db, "assets", id));

    loadAssets();
  }

};

// ✏️ Edit
window.editAsset = function (id) {
  let a = assets.find(x => x.id === id);

  assetName.value = a.name;
  serialNo.value = a.serial;
  vendorName.value = a.vendor;
  purchaseDate.value = a.purchase;
  expiryDate.value = a.expiry;

  editIndex = assets.indexOf(a);
};

window.exportExcel = function () {

  if (!assets || assets.length === 0) {
    alert("No data to export");
    return;
  }

  let today = new Date();

  let rows = [
    ["Asset", "Serial No", "Vendor", "Purchase", "Expiry", "Status"]
  ];

  let colors = [];

  assets.forEach(a => {

    let expiryDate = new Date(a.expiry);
    let diff = (expiryDate - today) / (1000*60*60*24);

    let status = "Active";
    let color = "90EE90"; // green

    if (diff <= 7 && diff >= 0) {
      status = "Expiring";
      color = "FFFF00"; // yellow
    } 
    else if (diff < 0) {
      status = "Expired";
      color = "FF0000"; // red
    }

    rows.push([a.name, a.serial, a.vendor, a.purchase, a.expiry, status]);
    colors.push(color);

  });

  let ws = XLSX.utils.aoa_to_sheet(rows);

  // Apply color to status column
  for (let i = 0; i < colors.length; i++) {

    let cell = "E" + (i + 2);

    if (ws[cell]) {
      ws[cell].s = {
        fill: { fgColor: { rgb: colors[i] } }
      };
    }

  }

  let wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Assets");

  XLSX.writeFile(wb, "Asset_Report.xlsx");

};

function getStatus(expiry) {
  let today = new Date();
  let expiryDate = new Date(expiry);
  let diff = (expiryDate - today) / (1000 * 60 * 60 * 24);

  if (diff <= 7 && diff >= 0) return "Expiring";
  if (diff < 0) return "Expired";
  return "Active";
}

// 🔍 Search
window.searchAsset = function () {

  let val = document.getElementById("search").value.toLowerCase();

  let filtered = assets.filter(asset => 
    Object.values(asset).some(value =>
      String(value).toLowerCase().includes(val)
    )
  );

  displayAssets(filtered);
};

//filter
window.filterAssets = function(type){

let today = new Date();

let filtered = assets.filter(asset => {

let expiryDate = new Date(asset.expiry);
let diff = (expiryDate - today) / (1000*60*60*24);

if(type === "active") return diff > 7;
if(type === "expiring") return diff <= 7 && diff >= 0;
if(type === "expired") return diff < 0;

return true;

});

displayAssets(filtered);

};

//warranty
function checkWarrantyAlerts(){

let today = new Date();

let expiringAssets = assets.filter(asset => {

let expiryDate = new Date(asset.expiry);
let diff = (expiryDate - today) / (1000*60*60*24);

return diff <= 7 && diff >= 0;

});

if(expiringAssets.length > 0){

let message = "⚠ Warranty Expiring Soon:\n\n";

expiringAssets.forEach(asset => {

let serialText = asset.serial && asset.serial.trim() !== "" ? " (" + asset.serial + ")" : "";

message += asset.name + serialText + " expires on " + asset.expiry + "\n";

});

alert(message);

// 📧 Send Email
sendWarrantyEmail(expiringAssets);

}
}

//Email Function
function sendWarrantyEmail(expiringAssets){

console.log("Email function started");

let message = "";

expiringAssets.forEach(asset => {

let serialText = asset.serial ? " (" + asset.serial + ")" : "";

message += asset.name + serialText + " expires on " + asset.expiry + "\n";

});

let templateParams = {
message: message
};

async function sendEmailOnceDaily() {

  const docRef = db.collection("system").doc("emailStatus");
  const docSnap = await docRef.get();

  const today = new Date().toDateString();
  const lastSent = docSnap.data()?.lastSent;

  // Stop if already sent today
  if (lastSent === today) {
    console.log("Email already sent today");
    return;
  }
  
emailjs.send("service_6b9nrh7","template_rzx54en",templateParams)
.then(function(response) {

console.log("Email Sent Successfully", response);
alert("Email Sent");

}, function(error) {

console.log("Email Failed", error);
alert("Email Failed");

});

}

// 📊 Display
function displayAssets(filtered = assets) {
  let table = document.getElementById("assetTable");
  table.innerHTML = "";

  let total = assets.length, expiring = 0, expired = 0;
  let today = new Date();

  filtered.forEach((asset) => {
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
  <td>${asset.serial}</td>
  <td>${asset.vendor}</td>
  <td>${asset.purchase}</td>
  <td>${asset.expiry}</td>
  <td>${status}</td>
  <td>
    <button onclick="editAsset('${asset.id}')">Edit</button>
    <button onclick="deleteAsset('${asset.id}')">Delete</button>
  </td>
</tr>
`;
  });

  document.getElementById("total").innerText = total;
  document.getElementById("expiring").innerText = expiring;
  document.getElementById("expired").innerText = expired;
}

// Popup Message
function showExpiryAlert(){

  let today = new Date();
  let expiringAssets = [];

  assets.forEach(a => {

    let expiryDate = new Date(a.expiry);
    let diff = (expiryDate - today) / (1000*60*60*24);

    if(diff <= 7 && diff >= 0){
      expiringAssets.push(a.name);
    }

  });

  if(expiringAssets.length > 0){

    let message = "⚠️ Expiring Soon:\n\n" + expiringAssets.join("\n");

    alert(message);

  }

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
window.onload = function(){
   sendEmailOnceDaily();
};
  await loadAssets();
  checkWarrantyAlerts(); 

};
