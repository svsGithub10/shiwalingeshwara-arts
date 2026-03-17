function loadProdPage(page){

fetch("/production/"+page)
.then(res => {

if(!res.ok){
throw new Error("Page load failed")
}

return res.text()

})
.then(html => {

document.getElementById("prodContent").innerHTML = html

// run correct loader
if(page === "orders"){
setTimeout(loadProductionOrders,200)
}

if(page === "materials"){
setTimeout(loadMaterials,200)
}

})
.catch(err => {

console.error(err)
showToast("Failed to load page")

})

}

/* LOGOUT */

function logout(){

fetch("/api/auth/logout",{method:"POST"})
.then(()=>{

showToast("Logged out")

setTimeout(()=>{
window.location.href="/"
},800)

})

}


/* TOAST */

function showToast(message){

let toast = document.createElement("div")

toast.innerText = message
toast.style.position="fixed"
toast.style.bottom="30px"
toast.style.right="30px"
toast.style.background="#333"
toast.style.color="white"
toast.style.padding="12px 18px"
toast.style.borderRadius="6px"

document.body.appendChild(toast)

setTimeout(()=>toast.remove(),3000)

}


/* ===============================
   MATERIAL SYSTEM
================================ */

let materialsCache = []

async function loadMaterials(){

const res = await fetch("/api/materials")
materialsCache = await res.json()

renderMaterials()

}


/* -------- STOCK SUM -------- */

function calculateStock(id){

const children = materialsCache.filter(m => m.parentId == id)

if(children.length === 0){

const item = materialsCache.find(m => m.id == id)
return item.stock || 0

}

let total = 0

children.forEach(c=>{
total += calculateStock(c.id)
})

return total

}


/* -------- RENDER MATERIAL LIST -------- */

function renderMaterials(){

const container = document.getElementById("materialsContainer")
container.innerHTML=""

const parents = materialsCache.filter(m => m.parentId == null)

parents.forEach(parent=>{

const parentStock = calculateStock(parent.id)

container.innerHTML += `
<div class="material-row">

<div class="material-name">

<button onclick="toggleChildren(${parent.id})">▼</button>

${parent.name}

<button onclick="openAddMaterial(${parent.id})">+</button>

</div>

<div class="stock">${parentStock}</div>

<div class="actions">

<button onclick="openEditMaterial(${parent.id})">Edit</button>

<button onclick="deleteMaterial(${parent.id})">Delete</button>

</div>

</div>

<div id="children-${parent.id}" style="display:none"></div>
`

renderChildren(parent.id)

})

}


/* -------- RENDER CHILDREN -------- */

function renderChildren(parentId){

const container = document.getElementById("children-"+parentId)

const children = materialsCache.filter(m => m.parentId == parentId)

let html=""

children.forEach(child=>{

const stock = calculateStock(child.id)
const hasChildren = materialsCache.some(m => m.parentId == child.id)

html += `
<div class="material-row child">

<div class="material-name">

<button onclick="toggleChildren(${child.id})">▼</button>

${child.name}

<button onclick="openAddMaterial(${child.id})">+</button>

</div>

<div class="stock">

${hasChildren ? stock : `
<input
type="number"
class="stock-input"
value="${stock}"
onchange="updateStock(${child.id},this.value)">
`}

</div>

<div class="actions">

<button onclick="openEditMaterial(${child.id})">Edit</button>

<button onclick="deleteMaterial(${child.id})">Delete</button>

</div>

</div>

<div id="children-${child.id}" style="display:none"></div>
`

})

container.innerHTML = html

children.forEach(child=>{
renderChildren(child.id)
})

}


/* -------- DROPDOWN -------- */

function toggleChildren(id){

const el = document.getElementById("children-"+id)

if(!el) return

el.style.display = el.style.display === "none" ? "block" : "none"

}


/* -------- STOCK UPDATE -------- */

async function updateStock(id,stock){

await fetch("/api/materials/stock",{

method:"PUT",
headers:{"Content-Type":"application/json"},
body:JSON.stringify({id,stock})

})

showToast("Stock updated")

loadMaterials()

}


/* ===============================
   ADD MATERIAL
================================ */

function openAddMaterial(parentId=null){

document.getElementById("materialModal").style.display="flex"

document.getElementById("materialName").value=""
document.getElementById("materialStock").value=""

const dropdown = document.getElementById("materialParent")

dropdown.innerHTML=`<option value="">Root</option>`

materialsCache.forEach(m=>{
dropdown.innerHTML += `<option value="${m.id}">${m.name}</option>`
})

if(parentId) dropdown.value = parentId

}


function closeModal(){
document.getElementById("materialModal").style.display="none"
}


async function saveMaterial(){

const name = document.getElementById("materialName").value
const parentId = document.getElementById("materialParent").value
const stock = document.getElementById("materialStock").value

await fetch("/api/materials",{

method:"POST",
headers:{"Content-Type":"application/json"},
body:JSON.stringify({
name:name,
parentId:parentId || null,
stock:stock || 0
})

})

closeModal()

showToast("Material added")

loadMaterials()

}


/* ===============================
   EDIT MATERIAL
================================ */

function openEditMaterial(id){

const material = materialsCache.find(m=>m.id==id)

document.getElementById("editModal").style.display="flex"

document.getElementById("editMaterialId").value=id
document.getElementById("editMaterialName").value=material.name
document.getElementById("editMaterialStock").value=material.stock || 0

}


function closeEdit(){
document.getElementById("editModal").style.display="none"
}


async function saveEdit(){

const id = document.getElementById("editMaterialId").value
const name = document.getElementById("editMaterialName").value
const stock = document.getElementById("editMaterialStock").value

await fetch("/api/materials/"+id,{

method:"PUT",
headers:{"Content-Type":"application/json"},
body:JSON.stringify({name,stock})

})

closeEdit()

showToast("Material updated")

loadMaterials()

}


/* ===============================
   DELETE
================================ */

async function deleteMaterial(id){

if(!confirm("Delete material?")) return

const res = await fetch("/api/materials/"+id,{
method:"DELETE"
})

const data = await res.json()

if(data.status === "error"){
showToast(data.message)
return
}

showToast("Material deleted")

loadMaterials()

}

/* ===============================
   SEARCH
================================ */

function searchMaterial(text){

text = text.toLowerCase()

const rows = document.querySelectorAll(".material-row")

rows.forEach(row=>{

const name = row.querySelector(".material-name").innerText.toLowerCase()

row.style.display = name.includes(text) ? "flex" : "none"

})

}

async function loadProductionOrders(){

const res = await fetch("/api/orders/production")

const orders = await res.json()

console.log("Orders:", orders)

renderProductionOrders(orders)

}

function renderProductionOrders(orders){

const container = document.getElementById("productionOrders")

if(!container){
console.error("productionOrders div not found")
return
}

container.innerHTML=""

orders.forEach(o=>{

container.innerHTML += `

<div class="material-row">

<!-- ORDER -->
<div>
<b>#${o.id}</b><br>
${o.materials || ""}
</div>

<!-- STATUS -->
<div>${o.status}</div>

<!-- RESULT PREVIEW -->
<div>
${o.resultImage ? `
<img src="/api/orders/view-result?path=${encodeURIComponent(o.resultImage)}"
style="width:45px;height:45px;border-radius:6px;object-fit:cover;cursor:pointer"
onclick="previewImage('${o.resultImage}')">
` : `<span style="color:#aaa;font-size:12px;">No Image</span>`}
</div>

<!-- ACTIONS -->
<div class="actions">

${o.dxfFile ? `
<button onclick="downloadDxf(${o.id})">
📁 ${o.dxfFile.split('/').pop()}
</button>
` : `<span style="color:#aaa;">No DXF</span>`}

<label class="upload-btn">
${o.resultImage ? "Reupload" : "Upload"}
<input type="file" onchange="uploadResult(${o.id},this)" hidden>
</label>

</div>

</div>

`

})

}
function downloadDxf(id){

const link = document.createElement("a")
link.href = "/api/orders/download-dxf/" + id
link.download = ""   // triggers download behavior

document.body.appendChild(link)
link.click()
document.body.removeChild(link)

loadProdPage()

}

async function uploadResult(id,input){

const file = input.files[0]

if(!file){
showToast("No file selected")
return
}

let formData = new FormData()
formData.append("file",file)

await fetch("/api/orders/upload-result/"+id,{
method:"POST",
body:formData
})

showToast("Result uploaded")

loadProductionOrders()

}

window.addEventListener("DOMContentLoaded", function(){
    loadProdPage("orders")
})