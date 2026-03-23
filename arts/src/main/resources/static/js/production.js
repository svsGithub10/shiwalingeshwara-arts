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

if(page === "finance"){
loadFinanceDashboard()
loadDaily()
}

if(page === "expenses"){
loadExpenses()
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
if(!item.stockStatus) return 0

if(item.stockStatus === "IN_STOCK") return 100
if(item.stockStatus === "LOW_STOCK") return 5
if(item.stockStatus === "OUT_OF_STOCK") return 0

return 0

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

<div class="stock">
${getStockBadge(calculateStockStatus(parent.id))}
</div>

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

function getStockBadge(status){

if(status === "IN_STOCK"){
return `<span class="badge green">in stock</span>`
}

if(status === "LOW_STOCK"){
return `<span class="badge yellow">Low stocks</span>`
}

return `<span class="badge red">Out of stocks</span>`
}

function calculateStockStatus(id){

const children = materialsCache.filter(m => m.parentId == id)

// leaf node
if(children.length === 0){
    const item = materialsCache.find(m => m.id == id)
    return item?.stockStatus || "OUT_OF_STOCK"
}

let hasInStock = false
let hasLowStock = false

children.forEach(c => {

    const status = calculateStockStatus(c.id)

    if(status === "IN_STOCK") hasInStock = true
    else if(status === "LOW_STOCK") hasLowStock = true

})

// priority logic
if(hasInStock) return "IN_STOCK"
if(hasLowStock) return "LOW_STOCK"

return "OUT_OF_STOCK"
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

${hasChildren 
? getStockBadge(calculateStockStatus(child.id)) 
: `
<select
class="stock-input"
onchange="updateStock(${child.id},this.value)">

<option value="IN_STOCK" ${child.stockStatus==="IN_STOCK"?"selected":""}>🟢</option>
<option value="LOW_STOCK" ${child.stockStatus==="LOW_STOCK"?"selected":""}>🟡</option>
<option value="OUT_OF_STOCK" ${child.stockStatus==="OUT_OF_STOCK"?"selected":""}>🔴</option>

</select>
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

async function updateStock(id,stockStatus){

await fetch("/api/materials/stock",{

method:"PUT",
headers:{"Content-Type":"application/json"},
body:JSON.stringify({
id:id,
stockStatus:stockStatus
})

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
const stockStatus = document.getElementById("materialStock").value

await fetch("/api/materials",{

method:"POST",
headers:{"Content-Type":"application/json"},
body:JSON.stringify({
name:name,
parentId:parentId || null,
stockStatus:stockStatus || "IN_STOCK"
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
document.getElementById("editMaterialStock").value=material.stockStatus || "IN_STOCK"

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
body:JSON.stringify({
name:name,
stockStatus:stock
})

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

  // reset if empty
  if(text === ""){
    renderMaterials()
    return
  }

  const container = document.getElementById("materialsContainer")

  // only select root rows (parents)
  const parentRows = container.querySelectorAll(":scope > .material-row")

  parentRows.forEach(parentRow => {

    const name = parentRow
      .querySelector(".material-name")
      .innerText
      .toLowerCase()

    const parentId = parentRow
      .querySelector("button")
      ?.getAttribute("onclick")
      ?.match(/\d+/)?.[0]

    const childrenBox = document.getElementById("children-" + parentId)

    if(name.includes(text)){

      parentRow.style.display = "flex"

      // keep default collapsed state
      if(childrenBox) childrenBox.style.display = "none"

    }else{

      parentRow.style.display = "none"

      // hide its children also
      if(childrenBox) childrenBox.style.display = "none"

    }

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

/* ===============================
   FINANCE DASHBOARD
================================ */

// STATE (ONLY ONCE)
let selectedDate = new Date()
let selectedMonth = new Date()
let selectedYear = new Date().getFullYear()

let financeChart = null

/* ===============================
   FORMATTERS
================================ */

function formatDate(date){
    return date.toISOString().split("T")[0]
}

function formatDisplayDate(date){
    return date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    })
}

/* ===============================
   INIT PICKERS
================================ */

function initPickers(){

    const day = document.getElementById("dayPicker")
    const month = document.getElementById("monthPicker")
    const year = document.getElementById("yearPicker")

    if(!day || !month || !year) return // 🔥 important safety

    day.value = formatDate(selectedDate)
    month.value = selectedMonth.toISOString().slice(0,7)

    year.innerHTML = ""

    for(let y = 2023; y <= 2030; y++){
        year.innerHTML += `<option value="${y}">${y}</option>`
    }

    year.value = selectedYear
}

/* ===============================
   TODAY CARD
================================ */

async function loadFinance(){

    const res = await fetch("/api/finance/summary?date=" + formatDate(selectedDate))
    const data = await res.json()

    const displayDate = formatDisplayDate(selectedDate)

    const el = document.getElementById("todayRevenue")
    if(!el) return

    el.innerHTML = `
    <div style="display:flex;justify-content:space-between;">
        <b>${displayDate}</b>
        <div>
            <button onclick="changeDay(-1)">◀</button>
            <button onclick="changeDay(1)">▶</button>
        </div>
    </div>

    <div style="margin-top:10px">
        Orders: <b>${data.todayOrders || 0}</b><br>
        Revenue: <b>₹${data.todayRevenue || 0}</b><br>
Expenses: <b>₹${data.todayExpenses || 0}</b><br>
Profit: <b style="color:${(data.todayProfit||0)>=0?'green':'red'}">
₹${data.todayProfit || 0}
</b>
    </div>
    `

    document.getElementById("totalOrders").innerHTML =
        "Orders<br><b>" + (data.totalOrders || 0) + "</b>"

    document.getElementById("inProgress").innerHTML =
        "In Progress<br><b>" + (data.inProgress || 0) + "</b>"

    document.getElementById("completed").innerHTML =
        "Completed<br><b>" + (data.completed || 0) + "</b>"

    document.getElementById("grossRevenue").innerHTML =
        "Total Revenue<br><b>₹" + (data.totalRevenue || 0) + "</b>"

document.getElementById("totalExpenses").innerHTML =
"Total Expenses<br><b>₹" + (data.totalExpenses || 0) + "</b>"

const profit = data.totalProfit || 0

document.getElementById("profitStatus").innerHTML =
    `Profit / Loss<br>
    <b style="color:${profit >= 0 ? 'green' : 'red'}">
        ₹${profit}
    </b>`
}

/* ===============================
   DAY CONTROL
================================ */

function changeDay(offset){
    selectedDate.setDate(selectedDate.getDate() + offset)

    const input = document.getElementById("dayPicker")
    if(input) input.value = formatDate(selectedDate)

    loadFinance()
}

function onDayChange(){
    selectedDate = new Date(document.getElementById("dayPicker").value)
    loadFinance()
}

/* ===============================
   MONTH CARD
================================ */

async function loadMonthlyCard(){

    const res = await fetch("/api/finance/monthly")
    const data = await res.json()

    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]

    const key = months[selectedMonth.getMonth()]
    const year = selectedMonth.getFullYear()

    const m = data[key] || {}

    const el = document.getElementById("monthlyRevenue")
    if(!el) return

    el.innerHTML = `
    <b>${key}-${year}</b>

    <div style="margin-top:10px">
        Orders: <b>${m.orders || 0}</b><br>
        Revenue: <b>₹${m.revenue || 0}</b><br>
        Expenses: <b>₹${m.expenses || 0}</b><br>
        Profit: <b style="color:${(m.profit||0)>=0?'green':'red'}">
            ₹${m.profit || 0}
        </b>
    </div>
    `
}

function onMonthChange(){
    selectedMonth = new Date(document.getElementById("monthPicker").value)
    loadMonthlyCard()
}

/* ===============================
   YEAR CARD
================================ */

async function loadYearlyCard(){

    const res = await fetch("/api/finance/yearly")
    const data = await res.json()

    const y = data[selectedYear] || {}

    const el = document.getElementById("yearlyRevenue")
    if(!el) return

    el.innerHTML = `
    <b>${selectedYear}</b>

    <div style="margin-top:10px">
        Orders: <b>${y.orders || 0}</b><br>
        Revenue: <b>₹${y.revenue || 0}</b><br>
        Expenses: <b>₹${y.expenses || 0}</b><br>
        Profit: <b style="color:${(y.profit||0)>=0?'green':'red'}">
            ₹${y.profit || 0}
        </b>
    </div>
    `
}

function onYearChange(){
    selectedYear = document.getElementById("yearPicker").value
    loadYearlyCard()
}

/* ===============================
   CHARTS
================================ */

async function loadDaily(){

    const res = await fetch("/api/finance/daily-full")
    const data = await res.json()

    const labels = Object.keys(data)

    const revenue = labels.map(d => data[d].revenue || 0)
    const expenses = labels.map(d => data[d].expenses || 0)
    const profit = labels.map(d => (data[d].revenue || 0) - (data[d].expenses || 0))

    renderChartMulti(labels, revenue, expenses, profit)
}

async function loadMonthly(){

    const res = await fetch("/api/finance/monthly")
    const data = await res.json()

    const labels = Object.keys(data)

    const revenue = labels.map(k => data[k].revenue || 0)
    const expenses = labels.map(k => data[k].expenses || 0)
    const profit = labels.map(k => data[k].profit || 0)

    renderChartMulti(labels, revenue, expenses, profit)
}

async function loadYearly(){

    const res = await fetch("/api/finance/yearly")
    const data = await res.json()

    const labels = Object.keys(data)

    const revenue = labels.map(k => data[k].revenue || 0)
    const expenses = labels.map(k => data[k].expenses || 0)
    const profit = labels.map(k => data[k].profit || 0)

    renderChartMulti(labels, revenue, expenses, profit)
}

function renderChartMulti(labels, revenue, expenses, profit){

    const ctx = document.getElementById("financeChart")

    if(financeChart){
        financeChart.destroy()
    }

    financeChart = new Chart(ctx,{
        type:'line',
        data:{
            labels,
            datasets:[
                {
                    label:"Revenue",
                    data: revenue
                },
                {
                    label:"Expenses",
                    data: expenses
                },
                {
                    label:"Profit",
                    data: profit
                }
            ]
        }
    })
}

/* ===============================
   INIT
================================ */

function loadFinanceDashboard(){
    initPickers()
    loadFinance()
    loadMonthlyCard()
    loadYearlyCard()
}


//Expenses--

let expenses = []

async function loadExpenses() {

    const type = document.getElementById("filterType").value

    const url = type ? `/api/expenses?type=${type}` : "/api/expenses"

    const res = await fetch(url)
    expenses = await res.json()

    renderExpenses()
}

function renderExpenses() {

    const table = document.getElementById("expenseTable")
    table.innerHTML = ""

    expenses.forEach(e => {

        table.innerHTML += `
        <tr>
            <td>${e.date}</td>
            <td>${e.title}</td>
            <td>${e.type}</td>
            <td>${e.category}</td>
            <td>₹${e.amount}</td>
            <td>${e.fileUrl ? `<a href="${e.fileUrl}" target="_blank">View</a>` : "-"}</td>
            <td>
                <button onclick="editExpense(${e.id})">Edit</button>
                <button onclick="deleteExpense(${e.id})">Delete</button>
            </td>
        </tr>
        `
    })
}


async function saveExpense() {

    let fileUrl = null
    const fileInput = document.getElementById("file")

    // ✅ Upload file if exists
    if (fileInput.files.length > 0) {

        const formData = new FormData()
        formData.append("file", fileInput.files[0])

        const res = await fetch("/api/upload", {
            method: "POST",
            body: formData
        })

        fileUrl = await res.text()
    }

    const data = {
        title: document.getElementById("title").value,
        type: document.getElementById("type").value,
        category: document.getElementById("category").value,
        amount: parseFloat(document.getElementById("amount").value),
        date: document.getElementById("date").value,
        note: document.getElementById("note").value,
        fileUrl: fileUrl
    }

    await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    })

    closeForm()
    loadExpenses()
}

let editingId = null

function editExpense(id){

    const e = expenses.find(x => x.id === id)

    editingId = id

    openForm()

    document.getElementById("type").value = e.type
    document.getElementById("title").value = e.title
    document.getElementById("category").value = e.category
    document.getElementById("amount").value = e.amount
    document.getElementById("date").value = e.date
    document.getElementById("note").value = e.note || ""

}

async function saveExpense() {

    let fileUrl = null
    const fileInput = document.getElementById("file")

    // upload only if new file selected
    if (fileInput.files.length > 0) {

        const formData = new FormData()
        formData.append("file", fileInput.files[0])

        const res = await fetch("/api/upload", {
            method: "POST",
            body: formData
        })

        fileUrl = await res.text()
    }

    const data = {
        title: document.getElementById("title").value,
        type: document.getElementById("type").value,
        category: document.getElementById("category").value,
        amount: parseFloat(document.getElementById("amount").value),
        date: document.getElementById("date").value,
        note: document.getElementById("note").value
    }

    if(fileUrl){
        data.fileUrl = fileUrl
    }

    // ✅ EDIT
    if(editingId){

        await fetch(`/api/expenses/${editingId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        })

        editingId = null
    }

    // ✅ ADD
    else{

        await fetch("/api/expenses", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        })
    }

    closeForm()
    loadExpenses()
}

function closeForm(){

    document.getElementById("expenseModal").style.display = "none"

    editingId = null

    document.getElementById("title").value = ""
    document.getElementById("category").value = ""
    document.getElementById("amount").value = ""
    document.getElementById("date").value = ""
    document.getElementById("note").value = ""
    document.getElementById("file").value = ""
}

async function deleteExpense(id) {

    if (!confirm("Delete?")) return

    await fetch(`/api/expenses/${id}`, {
        method: "DELETE"
    })

    loadExpenses()
}

function openForm(){
    document.getElementById("expenseModal").style.display = "flex"
}

function closeForm(){
    document.getElementById("expenseModal").style.display = "none"
}