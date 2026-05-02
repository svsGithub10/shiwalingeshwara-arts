function toggleTheme(){

    const body = document.body

    body.classList.toggle("dark")

    // save preference
    localStorage.setItem("theme",
        body.classList.contains("dark") ? "dark" : "light"
    )
}

// load saved theme
window.addEventListener("DOMContentLoaded", ()=>{

    const saved = localStorage.getItem("theme")

    if(saved === "dark"){
        document.body.classList.add("dark")
    }

    if("Notification" in window && Notification.permission !== "granted"){
        Notification.requestPermission()
    }

})

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



/* SIMPLE TOAST */

function showToast(message, type="success"){

    // container (for stacking)
    let container = document.getElementById("toastContainer")

    if(!container){
        container = document.createElement("div")
        container.id = "toastContainer"
        container.style.position = "fixed"
        container.style.bottom = "20px"
        container.style.right = "20px"
        container.style.display = "flex"
        container.style.flexDirection = "column"
        container.style.gap = "10px"
        container.style.zIndex = "9999"
        document.body.appendChild(container)
    }

    // toast
    let toast = document.createElement("div")
    toast.className = `toast toast-${type}`

    toast.innerHTML = `
        <span>${message}</span>
        <button onclick="this.parentElement.remove()">✕</button>
    `

    container.appendChild(toast)

    // auto remove
    setTimeout(()=>{
        toast.classList.add("hide")
        setTimeout(()=>toast.remove(),300)
    },3000)
}

const BG_COLORS = [
    { value: "WHITE", label: "White", code: "#ffffff" },
    { value: "BLACK", label: "Black", code: "#000000" },
    { value: "RED", label: "Red", code: "#ef4444" },
    { value: "BLUE", label: "Blue", code: "#002e79" },
    { value: "GREEN", label: "Green", code: "#007a2d" },
    { value: "PINK", label: "Pink", code: "#db25c3" },
]

let lastOrderHash = ""
let knownOrderIds = new Set()

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
container.innerHTML = ""

const parents = materialsCache.filter(m => m.parentId == null)

parents.forEach(parent=>{

container.innerHTML += `

<div class="mat-card">

    <!-- HEADER -->
    <div class="mat-header" onclick="toggleMat(${parent.id})">

        <div class="mat-title">
            ${parent.name}
        </div>

<div class="mat-right">

    ${getStockBadge(calculateStockStatus(parent.id))}

    <button onclick="event.stopPropagation();openAddMaterial(${parent.id})" class="mat-add" title="Add">
        <span>＋</span>
    </button>

    <button onclick="event.stopPropagation();openEditMaterial(${parent.id})" class="mat-edit" title="Edit">
        ✎
    </button>

    <button onclick="event.stopPropagation();deleteMaterial(${parent.id})" class="mat-delete" title="Delete">
        ✕
    </button>

    <span class="mat-arrow" id="arrow-${parent.id}"></span>

</div>

    </div>

    <!-- CHILDREN -->
    <div class="mat-body" id="mat-${parent.id}">
        ${renderMatChildren(parent.id)}
    </div>

</div>

`
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

function renderMatChildren(parentId){

const children = materialsCache.filter(m => m.parentId == parentId)

let html = ""

children.forEach(child=>{

const hasChildren = materialsCache.some(m => m.parentId == child.id)

html += `

<div class="mat-child">

    <div class="mat-child-header" onclick="toggleMat(${child.id})">

        <span>${child.name}</span>

        <div class="mat-right">

            ${hasChildren 
                ? getStockBadge(calculateStockStatus(child.id))
                : `
                <select class="stock-input"
                onchange="updateStock(${child.id},this.value)">
                    <option value="IN_STOCK" ${child.stockStatus==="IN_STOCK"?"selected":""}>🟢</option>
                    <option value="LOW_STOCK" ${child.stockStatus==="LOW_STOCK"?"selected":""}>🟡</option>
                    <option value="OUT_OF_STOCK" ${child.stockStatus==="OUT_OF_STOCK"?"selected":""}>🔴</option>
                </select>`
            }

            <button onclick="event.stopPropagation();openAddMaterial(${child.id})" class="mat-add">＋</button>
                <button onclick="event.stopPropagation();openEditMaterial(${child.id})" class="mat-edit" title="Edit">
        ✎
    </button>

    <button onclick="event.stopPropagation();deleteMaterial(${child.id})" class="mat-delete" title="Delete">
        ✕
    </button>

            ${hasChildren ? `<span class="mat-arrow" id="arrow-${child.id}"></span>` : ``}

        </div>

    </div>

    ${hasChildren ? `
    <div class="mat-sub" id="mat-${child.id}">
        ${renderMatChildren(child.id)}
    </div>
    ` : ``}

</div>

`

})

return html
}
/* -------- DROPDOWN -------- */

function toggleChildren(id){

const el = document.getElementById("children-"+id)

if(!el) return

el.style.display = el.style.display === "none" ? "block" : "none"

}

function toggleMat(id){

const el = document.getElementById("mat-"+id)
const arrow = document.getElementById("arrow-"+id)

if(!el) return

const isOpen = el.style.display === "block"

el.style.display = isOpen ? "none" : "block"

if(arrow){
    arrow.style.transform = isOpen 
        ? "rotate(45deg)" 
        : "rotate(225deg)"
}

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

const cards = document.querySelectorAll(".mat-card")

cards.forEach(card=>{

    const title = card.querySelector(".mat-title")?.innerText.toLowerCase()

    const body = card.querySelector(".mat-body")

    const allText = card.innerText.toLowerCase()

    if(text === ""){
        card.style.display = "block"
        if(body) body.style.display = "none"
        renderMaterials()
        return
    }

    if(allText.includes(text)){

        card.style.display = "block"

        // 🔥 auto open
        if(body) body.style.display = "block"

        // open all nested
        card.querySelectorAll(".mat-sub").forEach(el=>{
            el.style.display = "block"
        })

        highlightMatch(card, text)

    }else{
        card.style.display = "none"
    }

})

}




//ORDERS--

async function loadProductionOrders(){

const res = await fetch("/api/orders/production")

const orders = await res.json()

    // 🔥 create hash
    const newHash = JSON.stringify(orders.map(o => o.id + o.status + o.updatedAt))

    // ✅ only re-render if changed
    if(newHash === lastOrderHash){
        return
    }

        // 🔥 detect new CREATED orders
    const newOrders = orders.filter(o =>
        o.status === "CREATED" && !knownOrderIds.has(o.id)
    )

    // update known IDs
    orders.forEach(o => knownOrderIds.add(o.id))

    // 🔊 play sound if new order found
    if(newOrders.length > 0){
        
        showBrowserNotification(newOrders.length)
    }

    lastOrderHash = newHash

    console.log("Orders updated")

console.log("Orders:", orders)

renderProductionOrders(orders)

}

function playNewOrderSound(){

    const audio = new Audio("/sounds/new-order.mp3") // put file in static folder
    audio.play().catch(()=>{}) // avoid browser block error
}

function getBgColorCode(value){
    const c = BG_COLORS.find(x => x.value === value)
    return c ? c.code : "#ccc"
}

function getBgColorLabel(value){
    const c = BG_COLORS.find(x => x.value === value)
    return c ? c.label : (value || "-")
}

function renderProductionOrders(orders){

const container = document.getElementById("productionOrders")

if(!container){
console.error("productionOrders div not found")
return
}

container.innerHTML=""

// 🔥 newest first
orders.sort((a,b)=> new Date(b.createdAt) - new Date(a.createdAt))

orders.forEach(o=>{

let statusClass = "status-created"
if(o.status==="IN_PROGRESS") statusClass="status-progress"
if(o.status==="COMPLETED") statusClass="status-complete"
if(o.status==="DELIVERED") statusClass="status-delivered"

const isLaser = o.workType && o.workType.startsWith("LASER")

container.innerHTML += `

<div class="prod-card">

    <!-- LEFT -->
    <div class="prod-left">

 <div class="prod-id">

    <div class="prod-id-left">
        #${o.id} ${o.workType}

        ${o.status === "CREATED" ? `
            <span class="new-badge">NEW</span>
        ` : ``}
    </div>

    <div class="prod-price-inline">

        

        <input 
            type="number"
            id="dp-${o.id}"
            value="${o.displayPrice || ''}"
            placeholder="--"
        >

        <button onclick="saveDisplayPrice(${o.id})">✔</button>

    </div>

</div>

        <div class="prod-info">
            <b>Material:</b> ${o.materials || "-"} <br>
            <!-- <b>Material 2:</b> ${o.topLayer || "-"} <br> -->

                <b>BG Sheet:</b> 
    <span style="
        display:inline-block;
        width:12px;
        height:12px;
        background:${getBgColorCode(o.bgColor)};
        border-radius:2px;
        margin:0 5px;
        vertical-align:middle;
        border:1px solid #ccc;
    "></span>
    ${getBgColorLabel(o.bgColor)} <br>

    <b>Height:</b> ${o.height ? o.height + " in" : "-"} <br>

            <b>Remark:</b> ${o.remark || "-"} <br>
            <!--<b>Price:</b> ${o.price ? "₹" + o.price : "-"} <br> -->
            <b>Date:</b> ${o.createdAt ? new Date(o.createdAt).toLocaleDateString() : "-"}
        </div>

        <!-- STATUS BOTTOM -->
        <div class="status-pill ${statusClass}">
            ${o.status}
        </div>

    </div>

    <!-- RIGHT -->
    <div class="prod-right">

        <!-- IMAGE TOP -->
        <div class="prod-image-box">
            ${o.resultImage ? `
            <img src="/api/orders/view-result?path=${encodeURIComponent(o.resultImage)}"
            class="prod-image"
            onclick="previewImage('${o.resultImage}')">
            ` : `<div class="no-image">Result Preview</div>`}
        </div>

        <!-- ACTIONS BOTTOM -->
        <div class="prod-actions-row">

${isLaser ? (

    o.dxfFile 
    ? `<button onclick="downloadDxf(${o.id})" style="color: var(--subtext);">📁 DXF</button>`
    : `<span class="no-file" style="color:red;">DXF Required</span>`

) : (

    o.status === "CREATED" ? `
        <button onclick="markInProgress(${o.id})" style="color: var(--subtext);">
            Start
        </button>
    `

    : o.status === "IN_PROGRESS" ? `
        <button disabled style="opacity:0.6; cursor:not-allowed; color: var(--subtext);">
            Started
        </button>
    `

    : (o.status === "DELIVERED" || o.status === "COMPLETED") ? `
        <span class="no-file" style="color:gray;">
            DXF Not Required
        </span>
    `

    : ``

)}



${(!isLaser || o.dxfFile) ? `
<label class="upload-btn">
    ${o.resultImage ? "Reupload" : "Upload"}
    <input type="file" onchange="uploadResult(${o.id},this)" hidden>
</label>
` : `
<span class="no-file" style="color:red;">
Upload locked (DXF missing)
</span>
`}

        </div>

    </div>

</div>

`
})

}

async function saveDisplayPrice(orderId){

    const input = document.getElementById(`dp-${orderId}`);
    const value = input.value;

    if(value === ""){
        alert("Enter display price");
        return;
    }

    try{

        const res = await fetch(`/api/orders/${orderId}/display-price`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                displayPrice: Number(value)
            })
        });

        if(!res.ok){
            throw new Error("Failed to save");
        }

        showToast("Display price updated");

    }catch(e){
        console.error(e);
        alert("Error saving price");
    }
}

async function markInProgress(id){

    await fetch("/api/orders/" + id + "/inProgress", {
        method: "PUT"
    })

    showToast("Status updated")

    loadProductionOrders()
}

function refreshProduction(){
    loadProductionOrders()
}

function showBrowserNotification(count){

    if(!("Notification" in window)) return

    // 🔥 only notify when user is NOT on tab
    if(document.visibilityState === "visible") return

    if(Notification.permission === "granted"){

        new Notification("New Orders", {
            body: `${count} new order(s) received`,
            icon: "/icon.png"
        })

    }
}

function previewImage(path){

document.getElementById("imagePreviewModal").style.display="flex"

document.getElementById("previewImg").src =
"/api/orders/view-result?path=" + encodeURIComponent(path)

}

function closePreview(){
document.getElementById("imagePreviewModal").style.display="none"
}



// document.addEventListener("visibilitychange", ()=>{
//     if(document.hidden){
//         stopAutoRefresh()
//     }else{
//         startAutoRefresh()
//     }
// })

function downloadDxf(id){

const link = document.createElement("a")
link.href = "/api/orders/download-dxf/" + id
link.download = ""   // triggers download behavior

document.body.appendChild(link)
link.click()
document.body.removeChild(link)

setTimeout(refreshProduction, 800)

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

let isPageVisible = true

document.addEventListener("visibilitychange", ()=>{
    isPageVisible = !document.hidden
})

async function liveOrderWatcher(){

    
    await loadProductionOrders()
    

    setTimeout(liveOrderWatcher, 800)
}

window.addEventListener("DOMContentLoaded", function(){
    loadProdPage("orders")

    // start live watcher
    liveOrderWatcher()
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

    const profitColor = (data.todayProfit || 0) >= 0 ? "#22c55e" : "#ef4444"

    /* ===============================
       TODAY CARD (PREMIUM)
    =============================== */

    el.innerHTML = `
    <div class="finance-day">

        <div class="finance-day-header">
            <button class="nav-btn" onclick="changeDay(-1)">◀</button>

            <div class="finance-date">${displayDate}</div>

            <button class="nav-btn" onclick="changeDay(1)">▶</button>
        </div>

        <div class="finance-day-stats">

            <div class="mini-kpi">
                <div class="mini-title">Orders</div>
                <div class="mini-value">${data.todayOrders || 0}</div>
            </div>

            <div class="mini-kpi revenue">
                <div class="mini-title">Revenue</div>
                <div class="mini-value">₹${data.todayRevenue || 0}</div>
            </div>

            <div class="mini-kpi expense">
                <div class="mini-title">Expenses</div>
                <div class="mini-value">₹${data.todayExpenses || 0}</div>
            </div>

            <div class="mini-kpi profit">
                <div class="mini-title">Profit</div>
                <div class="mini-value" style="color:${profitColor}">
                    ₹${data.todayProfit || 0}
                </div>
            </div>

        </div>

    </div>
    `

    /* ===============================
       MAIN KPI CARDS
    =============================== */

    document.getElementById("totalOrders").innerHTML = `
    <div class="kpi orders">
        <div class="kpi-title">Total Orders</div>
        <div class="kpi-value">${data.totalOrders || 0}</div>
    </div>
    `

    document.getElementById("inProgress").innerHTML = `
    <div class="kpi">
        <div class="kpi-title">In Progress</div>
        <div class="kpi-value">${data.inProgress || 0}</div>
    </div>
    `

    document.getElementById("completed").innerHTML = `
    <div class="kpi">
        <div class="kpi-title">Completed</div>
        <div class="kpi-value">${data.completed || 0}</div>
    </div>
    `

    document.getElementById("delivered").innerHTML = `
    <div class="kpi">
        <div class="kpi-title">Delivered</div>
        <div class="kpi-value">${data.delivered || 0}</div>
    </div>
    `

    document.getElementById("grossRevenue").innerHTML = `
    <div class="kpi revenue">
        <div class="kpi-title">Total Revenue</div>
        <div class="kpi-value">₹${data.totalRevenue || 0}</div>
    </div>
    `

    document.getElementById("totalExpenses").innerHTML = `
    <div class="kpi expense">
        <div class="kpi-title">Total Expenses</div>
        <div class="kpi-value">₹${data.totalExpenses || 0}</div>
    </div>
    `

    const profit = data.totalProfit || 0

    document.getElementById("profitStatus").innerHTML = `
    <div class="kpi profit">
        <div class="kpi-title">Profit / Loss</div>
        <div class="kpi-value" style="color:${profit >= 0 ? '#22c55e' : '#ef4444'}">
            ₹${profit}
        </div>
    </div>
    `
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

    const profitColor = (m.profit || 0) >= 0 ? "#22c55e" : "#ef4444"

    const el = document.getElementById("monthlyRevenue")
    if(!el) return

    el.innerHTML = `
    <div class="finance-card">

        <div class="finance-card-header">
            <div>${key} ${year}</div>
        </div>

        <div class="finance-stats">

            <div class="mini-kpi">
                <div class="mini-title">Orders</div>
                <div class="mini-value">${m.orders || 0}</div>
            </div>

            <div class="mini-kpi revenue">
                <div class="mini-title">Revenue</div>
                <div class="mini-value">₹${m.revenue || 0}</div>
            </div>

            <div class="mini-kpi expense">
                <div class="mini-title">Expenses</div>
                <div class="mini-value">₹${m.expenses || 0}</div>
            </div>

            <div class="mini-kpi profit">
                <div class="mini-title">Profit</div>
                <div class="mini-value" style="color:${profitColor}">
                    ₹${m.profit || 0}
                </div>
            </div>

        </div>

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

    const profitColor = (y.profit || 0) >= 0 ? "#22c55e" : "#ef4444"

    const el = document.getElementById("yearlyRevenue")
    if(!el) return

    el.innerHTML = `
    <div class="finance-card">

        <div class="finance-card-header">
            <div>${selectedYear}</div>
        </div>

        <div class="finance-stats">

            <div class="mini-kpi">
                <div class="mini-title">Orders</div>
                <div class="mini-value">${y.orders || 0}</div>
            </div>

            <div class="mini-kpi revenue">
                <div class="mini-title">Revenue</div>
                <div class="mini-value">₹${y.revenue || 0}</div>
            </div>

            <div class="mini-kpi expense">
                <div class="mini-title">Expenses</div>
                <div class="mini-value">₹${y.expenses || 0}</div>
            </div>

            <div class="mini-kpi profit">
                <div class="mini-title">Profit</div>
                <div class="mini-value" style="color:${profitColor}">
                    ₹${y.profit || 0}
                </div>
            </div>

        </div>

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

function setActiveChart(btn){

    document.querySelectorAll(".chart-btn").forEach(b=>{
        b.classList.remove("active")
    })

    btn.classList.add("active")
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

        let typeClass = ""
        if(e.type === "MATERIAL") typeClass = "type-material"
        if(e.type === "BILL") typeClass = "type-bill"
        if(e.type === "PIGMY") typeClass = "type-pigmy"

        table.innerHTML += `
        <tr>

            <td data-label="Date">${e.date}</td>

            <td data-label="Title">${e.title}</td>

            <td data-label="Type">
                <span class="type-badge ${typeClass}">
                    ${e.type}
                </span>
            </td>

            <td data-label="Category">
                <span class="category-tag">
                    ${e.category}
                </span>
            </td>

            <td >
                
                    ${e.note}
                
            </td>

            <td data-label="Amount"><b>₹${e.amount}</b></td>

            <td data-label="Image proof">
                ${e.fileUrl ? `
                    ${e.fileUrl.match(/\.(jpg|jpeg|png|webp)$/i) ? `
                        <img src="${e.fileUrl}" class="file-preview"
                        onclick="previewExpenseFile('${e.fileUrl}')">
                    ` : `
                        <a href="${e.fileUrl}" target="_blank">📄 View</a>
                    `}
                ` : `-`}
            </td>

            <td>
                <div class="exp-actions-btn">
                    <button onclick="editExpense(${e.id})" style="color: var(--subtext);">Edit</button>
                    <button onclick="deleteExpense(${e.id})" style="color: var(--subtext);">Delete</button>
                </div>
            </td>

        </tr>
        `
    })
}

function previewExpenseFile(url){
    document.getElementById("filePreviewModal").style.display = "flex"
    document.getElementById("expensePreviewImg").src = url
}

function closeFilePreview(){
    document.getElementById("filePreviewModal").style.display = "none"
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

//Responsive--

function toggleSidebar(){

    const sidebar = document.querySelector(".sidebar")
    const overlay = document.querySelector(".overlay")

    sidebar.classList.toggle("active")
    overlay.classList.toggle("active")

}


//EXCEL REPORT --

async function generateFinanceReport(){

    // 🔥 SAFE FORMATTERS
    function safe(val){
        return val ?? 0
    }

    function money(val){
        return Number(val || 0)
    }

    // 🔹 Fetch Data
    const summary = await (await fetch("/api/finance/summary?date=" + formatDate(selectedDate))).json()
    const monthly = await (await fetch("/api/finance/monthly")).json()
    const yearly = await (await fetch("/api/finance/yearly")).json()

    const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
    const mKey = monthNames[selectedMonth.getMonth()]
    const yKey = selectedYear

    const m = monthly[mKey] || {}
    const y = yearly[yKey] || {}

    // ======================
    // BUILD EXCEL DATA
    // ======================

    const data = [

        ["Shivalingeshwara Arts - Finance Report"],
        ["Generated:", new Date().toLocaleString()],
        [],

        ["ORDER SUMMARY"],
        ["Metric", "Value"],
        ["Total Orders", safe(summary.totalOrders)],
        ["In Progress", safe(summary.inProgress)],
        ["Completed", safe(summary.completed)],
        ["Delivered", safe(summary.delivered)],
        [],

        ["MONTHLY REPORT (" + mKey + " " + selectedMonth.getFullYear() + ")"],
        ["Metric", "Value"],
        ["Orders", safe(m.orders)],
        ["Revenue", money(m.revenue)],
        ["Expenses", money(m.expenses)],
        ["Profit", money(m.profit)],
        [],

        ["YEARLY REPORT (" + selectedYear + ")"],
        ["Metric", "Value"],
        ["Orders", safe(y.orders)],
        ["Revenue", money(y.revenue)],
        ["Expenses", money(y.expenses)],
        ["Profit", money(y.profit)],
        [],

        ["OVERALL FINANCE"],
        ["Metric", "Value"],
        ["Total Revenue", money(summary.totalRevenue)],
        ["Total Expenses", money(summary.totalExpenses)],
        ["Profit / Loss", money(summary.totalProfit)]

    ]

    // ======================
    // CREATE WORKBOOK
    // ======================
    const ws = XLSX.utils.aoa_to_sheet(data)
    const wb = XLSX.utils.book_new()

    XLSX.utils.book_append_sheet(wb, ws, "Finance Report")

    // ======================
    // DOWNLOAD FILE
    // ======================
    XLSX.writeFile(wb, "finance-report.xlsx")
}

async function generateExpenseReport(){

    console.log("Expense report generating...")

    if(typeof XLSX === "undefined"){
        alert("Excel library not loaded!")
        return
    }

    // 🔹 Get filter
    const type = document.getElementById("filterType")?.value || ""

    const url = type ? `/api/expenses?type=${type}` : "/api/expenses"

    const res = await fetch(url)
    const expenses = await res.json()

    // 🔥 Formatters
    function safe(val){
        return val ?? ""
    }

    function money(val){
        return Number(val || 0)
    }

    // ======================
    // BUILD DATA
    // ======================

    const data = [

        ["Shivalingeshwara Arts - Expense Report"],
        ["Generated:", new Date().toLocaleString()],
        ["Filter:", type || "ALL"],
        [],

        ["Date", "Title", "Type", "Category", "Note", "Amount"]

    ]

    let total = 0

    expenses.forEach(e => {
        data.push([
            safe(e.date),
            safe(e.title),
            safe(e.type),
            safe(e.category),
            safe(e.note),
            money(e.amount)
        ])

        total += Number(e.amount || 0)
    })

    // TOTAL ROW
    data.push([])
    data.push(["", "", "", "", "Total", total])

    // ======================
    // CREATE SHEET
    // ======================
    const ws = XLSX.utils.aoa_to_sheet(data)

    // 🔥 AUTO WIDTH (professional touch)
    ws["!cols"] = [
        { wch: 12 }, // date
        { wch: 20 }, // title
        { wch: 12 }, // type
        { wch: 18 }, // category
        { wch: 25 }, // note
        { wch: 12 }  // amount
    ]

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Expenses")

    // ======================
    // DOWNLOAD
    // ======================
    XLSX.writeFile(wb, "expense-report.xlsx")
}

window.saveDisplayPrice = async function(orderId){

    const input = document.getElementById(`dp-${orderId}`);
    const value = input?.value;

    if(value === "" || value == null){
        alert("Enter display price");
        return;
    }

    try{

        const res = await fetch(`/api/orders/${orderId}/display-price`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                displayPrice: Number(value)
            })
        });

        if(!res.ok){
            throw new Error("Failed");
        }

        showToast("Display price saved");

    }catch(e){
        console.error(e);
        alert("Error saving");
    }
};