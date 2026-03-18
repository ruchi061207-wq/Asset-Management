let assets = JSON.parse(localStorage.getItem("assets")) || [];
let editIndex = -1;

function addAsset() {
  let name = assetName.value;
  let vendor = vendorName.value;
  let purchase = purchaseDate.value;
  let expiry = expiryDate.value;

  if (!name || !vendor || !purchase || !expiry) {
    alert("Fill all fields");
    return;
  }

  let asset = { name, vendor, purchase, expiry };

  if (editIndex === -1) {
    assets.push(asset);
  } else {
    assets[editIndex] = asset;
    editIndex = -1;
  }

  localStorage.setItem("assets", JSON.stringify(assets));
  clearForm();
  displayAssets();
}

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

  checkExpiry();
}

function editAsset(i) {
  let a = assets[i];
  assetName.value = a.name;
  vendorName.value = a.vendor;
  purchaseDate.value = a.purchase;
  expiryDate.value = a.expiry;
  editIndex = i;
}

function deleteAsset(i) {
  if (confirm("Delete this asset?")) {
    assets.splice(i, 1);
    localStorage.setItem("assets", JSON.stringify(assets));
    displayAssets();
  }
}

function searchAsset() {
  let val = search.value.toLowerCase();
  let filtered = assets.filter(a =>
    a.name.toLowerCase().includes(val) ||
    a.vendor.toLowerCase().includes(val)
  );
  displayAssets(filtered);
}

function exportCSV() {
  let csv = "Asset,Vendor,Purchase,Expiry\n";
  assets.forEach(a => {
    csv += `${a.name},${a.vendor},${a.purchase},${a.expiry}\n`;
  });

  let blob = new Blob([csv], { type: "text/csv" });
  let a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "assets.csv";
  a.click();
}

function clearForm() {
  assetName.value = "";
  vendorName.value = "";
  purchaseDate.value = "";
  expiryDate.value = "";
}

function checkExpiry() {
  let today = new Date();

  assets.forEach(a => {
    let diff = (new Date(a.expiry) - today) / (1000*60*60*24);

    if (diff <= 7 && diff >= 0) {
      showPopup(`⚠️ ${a.name} expiring in ${Math.ceil(diff)} days`);
    }
    if (diff < 0) {
      showPopup(`❌ ${a.name} expired`);
    }
  });
}

function showPopup(msg) {
  popupMessage.innerText = msg;
  popup.style.display = "block";
}

function closePopup() {
  popup.style.display = "none";
}

window.onload = () => displayAssets();
