import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { 
getAuth, onAuthStateChanged, signOut 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { 
  getFirestore, collection, addDoc, getDocs, deleteDoc, doc, updateDoc, getDoc, setDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

/* Firebase Config */ 
const firebaseConfig = { apiKey: "AIzaSyD8tTfM7kgtDAz66bD_Ri2_WHVbvUfVXl0", 
                        authDomain: "asset-management-191b8.firebaseapp.com", 
                        projectId: "asset-management-191b8", 
                        storageBucket: "asset-management-191b8.firebasestorage.app", 
                        messagingSenderId: "140250118302", 
                        appId: "1:140250118302:web:e10d723fd07bba652ea38f" 
                       }; 
const app = initializeApp(firebaseConfig); 
const db = getFirestore(app); 
const auth = getAuth(app);
let assets = []; 
let editIndex = -1; 

/* Add or Update Asset */ 
window.addAsset = async function () 
{ 
  const asset = 
  { 
   name: assetName.value.trim(), 
   serial: serialNo.value.trim(), 
   vendor: vendorName.value.trim(), 
   purchase: purchaseDate.value, 
   expiry: expiryDate.value 
  }; 
  if (!asset.name || !asset.serial || !asset.vendor || !asset.purchase || !asset.expiry) 
  { 
    alert("Please fill all fields"); 
    return; 
  } 
  try 
  { 
    if (editIndex === -1) 
    { 
    await addDoc(collection(db, "assets"), asset); 
    } 
    else 
    { 
      await updateDoc(doc(db, "assets", assets[editIndex].id), asset); editIndex = -1; 
    } 
    clearForm(); 
    await loadAssets(); 
  } 
  catch (e) 
  { 
    console.error("Error saving asset:", e); 
  } 
}; 

onAuthStateChanged(auth,(user)=>{

if(!user){

window.location.href="login.html";

}

});

/* Load Assets */ 
async function loadAssets()
{ 
  try 
  { 
  assets = []; const snapshot = await getDocs(collection(db, "assets")); 
    snapshot.forEach(docSnap => 
      { 
      assets.push({ id: docSnap.id, ...docSnap.data() }); 
    }); 
    displayAssets(); 
  } 
  catch (e) 
  { 
    console.error("Error loading assets:", e); 
  } 
} 



window.logout = function(){

signOut(auth).then(()=>{

window.location.href="login.html";

});

}

/* Delete Asset */ 
window.deleteAsset = async function (id) 
{ 
  if (!confirm("Delete this asset?")) 
    return; 
  try { await deleteDoc(doc(db, "assets", id)); 
       await loadAssets(); } catch (e) 
  { 
    console.error("Delete error:", e); 
  } 
}; 

/* Edit Asset */ 
window.editAsset = function (id) { 
  const asset = assets.find(a => a.id === id); 
  assetName.value = asset.name; serialNo.value = asset.serial; vendorName.value = asset.vendor; purchaseDate.value = asset.purchase; expiryDate.value = asset.expiry; editIndex = assets.indexOf(asset); };

/* Search */ 
window.searchAsset = function () { 
  const val = document.getElementById("search").value.toLowerCase(); 
  const filtered = assets.filter(asset => Object.values(asset).some(v => String(v).toLowerCase().includes(val) ) ); displayAssets(filtered); }; 

/* Filter */ 
window.filterAssets = function(type)
{ 
  const today = new Date(); const filtered = assets.filter(asset => 
    { 
    const expiryDate = new Date(asset.expiry); const diff = (expiryDate - today)/(1000*60*60*24); 
      if(type==="active") return diff>7; if(type==="expiring") return diff<=7 && diff>=0; 
      if(type==="expired") return diff<0; return true; 
    }); displayAssets(filtered); 
}; 

/* Warranty Alert */ 
function checkWarrantyAlerts()
{ 
  const today = new Date(); 
  const expiringAssets = assets.filter(asset => 
    { 
    const expiryDate = new Date(asset.expiry); 
      const diff = (expiryDate - today)/(1000*60*60*24);
      return diff<=7 && diff>=0; 
    }); if(expiringAssets.length>0)
  { 
    let message="⚠ Warranty Expiring Soon:\n\n"; 
    expiringAssets.forEach(asset=>
      { 
      message += asset.name + " (" + asset.serial + ") expires on " + asset.expiry + "\n"; 
    }); 
    alert(message); sendWarrantyEmail(expiringAssets); 
  } 
} 

/* Email once per day */ 
async function sendWarrantyEmail(expiringAssets)
{ 
  let message=""; 
  expiringAssets.forEach(asset=>{ message += asset.name + " (" + asset.serial + ") expires on " + asset.expiry + "\n"; }); 
  const templateParams={ message }; 
  const docRef = doc(db,"system","emailStatus"); 
  const docSnap = await getDoc(docRef); 
  const today = new Date().toDateString(); 
  const lastSent = docSnap.exists()?docSnap.data().lastSent:null; 
  if(lastSent===today)
  { 
    console.log("Email already sent today"); 
    return; 
  } 
  try{ 
    await emailjs.send("service_6b9nrh7","template_rzx54en",templateParams); 
    await setDoc(docRef,{lastSent:today}); console.log("Email sent"); 
  }catch(e)
  { 
    console.error("Email error:",e); 
  } 
} 

/* Display Table */ 
function displayAssets(filtered=assets)
{ 
  const table=document.getElementById("assetTable"); 
  table.innerHTML=""; 
  let total=assets.length; 
  let expiring=0; 
  let expired=0; 
  const today=new Date(); 
  filtered.forEach(asset=>
    { 
      const expiryDate=new Date(asset.expiry); 
      const diff=(expiryDate-today)/(1000*60*60*24); 
      let status="Active"; 
      let cls=""; 
      if(diff<=7 && diff>=0){status="Expiring";cls="expiring";expiring++;} 
      else if(diff<0){status="Expired";cls="expired";expired++;} 
      table.innerHTML +=
        ` 
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
      </td> </tr> `; 
    }); 
  document.getElementById("total").innerText=total; 
  document.getElementById("expiring").innerText=expiring; 
  document.getElementById("expired").innerText=expired; 
} 

/* Clear Form */ 
function clearForm()
{ 
  assetName.value="";                    
  serialNo.value=""; 
  vendorName.value=""; 
  purchaseDate.value=""; 
  expiryDate.value=""; 
} 

/* Page Load */ 
window.onload = async function()
{ 
  await loadAssets(); 
                                                 
  checkWarrantyAlerts(); 
};
