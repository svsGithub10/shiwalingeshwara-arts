function loadPage(page){

    fetch("/admin/" + page)
    .then(res => {

        if(!res.ok){
            throw new Error("Page not found")
        }

        return res.text()
    })
    .then(html => {

        document.getElementById("contentArea").innerHTML = html;

        // ✅ ORDERS
        if(page === "orders"){
            loadClients()
            initFilters()
        }

        // ✅ INVENTORY
        if(page === "inventory" || page === "materials"){
            loadMaterials()
        }

        // ✅ FINANCE DASHBOARD
        if(page === "finance"){
            loadFinanceDashboard()
            loadDaily()
        }

        // ✅ EXPENSES
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

fetch("/api/auth/logout",{
method:"POST"
})
.then(()=>{

showToast("Logged out")

setTimeout(()=>{
window.location.href="/"
},800)

})

}


/* SIMPLE TOAST */

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

setTimeout(()=>{
toast.remove()
},3000)

}

let clientsCache = []


/* LOAD CLIENTS */

async function loadClients(){

const res = await fetch("/api/clients")
clientsCache = await res.json()

// 🔥 attach order count
for(let c of clientsCache){

const res2 = await fetch("/api/orders/client/"+c.id)
const orders = await res2.json()

c.orderCount = orders.length

// latest order date
c.lastOrderDate = orders.length
? orders[orders.length - 1].id   // temporary (can improve later)
: 0

}

renderClients(clientsCache)

}


/* RENDER CLIENT CARDS */

function renderClients(clients){

const grid = document.getElementById("clientsGrid")

if(!grid) return

grid.innerHTML=""

clients.forEach(c=>{

grid.innerHTML += `

<div class="client-card"
onclick="openClientOrders(${c.id})">

<div class="client-name">${c.name}</div>

<div class="client-phone">${c.phone}</div>

<div class="client-city">${c.city || ""}</div>

<!-- 🔥 NEW -->
<div style="font-size:12px;color:#555;margin-top:5px;">
Orders: ${c.orderCount || 0}
</div>

<div class="client-actions">

<button onclick="event.stopPropagation();editClient(${c.id})">
Edit
</button>

<button onclick="event.stopPropagation();deleteClient(${c.id})">
Delete
</button>

</div>

</div>

`

})

}

document.querySelectorAll("input[name='filter']")
.forEach(radio=>{

radio.addEventListener("change",()=>{

applyFilter(radio.value)

})

})

function applyFilter(type){

let list = [...clientsCache]

if(type === "orders"){

list.sort((a,b)=>(b.orderCount||0)-(a.orderCount||0))

}

if(type === "recent"){

list.sort((a,b)=>(b.lastOrderDate||0)-(a.lastOrderDate||0))

}

if(type === "new"){

list.sort((a,b)=>b.id - a.id)

}

if(type === "name"){

list.sort((a,b)=>a.name.localeCompare(b.name))

}

renderClients(list)

}


/* SEARCH */

function searchClients(text){

text = text.toLowerCase()

const filtered = clientsCache.filter(c =>

c.name.toLowerCase().includes(text) ||
(c.phone && c.phone.includes(text))

)

renderClients(filtered)

}


/* DELETE CLIENT */

async function deleteClient(id){

if(!confirm("Delete client?")) return

const res = await fetch("/api/clients/"+id,{
method:"DELETE"
})

const data = await res.json()

if(data.status === "error"){
alert(data.message)
return
}

showToast("Client deleted")

loadClients()

}


/* EDIT CLIENT */

function editClient(id){

const client = clientsCache.find(c=>c.id===id)

document.getElementById("clientEditModal").style.display="flex"

document.getElementById("editClientId").value=id
document.getElementById("editClientName").value=client.name
document.getElementById("editClientPhone").value=client.phone
document.getElementById("editClientCity").value=client.city || ""

}


function closeClientEdit(){

document.getElementById("clientEditModal").style.display="none"

}




async function saveClientEdit(){

const id = document.getElementById("editClientId").value

const name = document.getElementById("editClientName").value
const phone = document.getElementById("editClientPhone").value
const city = document.getElementById("editClientCity").value

await fetch("/api/clients/"+id,{

method:"PUT",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify({name,phone,city})

})

closeClientEdit()

showToast("Client Updated")

loadClients()

}


/* OPEN CLIENT ORDERS (NEXT STEP) */

function openClientOrders(id){

console.log("Open orders for client",id)

}


/* NEW ORDER */

function openNewOrder(){

console.log("Open new order window")

}

let currentClientId = null

async function openClientOrders(clientId){

currentClientId = clientId

const client = clientsCache.find(c=>c.id===clientId)

document.getElementById("ordersClientName").innerText =
client.name + " - Orders"

document.getElementById("clientOrdersModal").style.display="flex"

const res = await fetch("/api/orders/client/"+clientId)

const orders = await res.json()

renderOrders(orders)

}

function renderOrders(orders){

const container = document.getElementById("ordersList")

container.innerHTML=""

orders.forEach(o=>{

let statusClass="status-created"

if(o.status==="IN_PROGRESS") statusClass="status-progress"
if(o.status==="COMPLETED") statusClass="status-complete"
if(o.status==="DELIVERED") statusClass="status-delivered"

const balance = o.price - (o.advancePaid || 0)

container.innerHTML += `

<div class="material-row">

<!-- ORDER INFO -->
<div>
<b>#${o.id}</b><br>
${o.workType || ""}
</div>

<!-- MATERIAL -->
<div>
${o.materials || ""}
</div>

<!-- TOP LAYER -->
<div>
${o.topLayer ? "& " + o.topLayer : ""}
</div>

<!-- OTHER MATERIAL/ REMARKS -->
<div>
${o.remark ? "& " + o.remark : ""}
</div>

<!-- PRICE -->
<div>
₹${o.price || 0}
</div>

<!-- ADVANCE -->
<div>
Paid: ₹${o.advancePaid || 0}
</div>

<div>
Ordered date: ${o.createdAt ? new Date(o.createdAt).toLocaleDateString('en-GB') : ""}
</div>

<!-- BALANCE -->
<div>
Balance: ₹${balance}
</div>

<!-- STATUS -->
<div>
<span class="status-pill ${statusClass}">
${o.status}
</span>
</div>

${o.status === "COMPLETED" ? `
<button onclick="markDelivered(${o.id})">
Deliver
</button>
` : ""}

<div>
${o.deliveredAt 
    ? "Delivered: " + new Date(o.deliveredAt).toLocaleDateString('en-GB') 
    : ""}
</div>

<!-- RESULT IMAGE -->
<div>
${o.resultImage ? `
<img src="/api/orders/view-result?path=${encodeURIComponent(o.resultImage)}"
style="width:45px;height:45px;border-radius:6px;cursor:pointer"
onclick="previewImage('${o.resultImage}')">
` : `<span style="color:#aaa;font-size:12px;">No Image</span>`}
</div>

<!-- ACTIONS -->
<div class="actions">

${o.dxfFile ? `
<button onclick="downloadDxf(${o.id})">
DXF
</button>
` : `<span style="font-size:12px;color:#aaa;">No DXF</span>`}

<button onclick="editOrder(${o.id})">
Edit
</button>

<button onclick="deleteOrder(${o.id})">
Delete
</button>

${balance <= 0 ? `
<button class="paid-btn" disabled>
✔ Paid
</button>
` : `
<button onclick="openPayment(${o.id})">
Pay
</button>
`}
</div>

</div>

`

})

}

async function markDelivered(id){

if(!confirm("Mark this order as Delivered?")) return

await fetch("/api/orders/" + id + "/deliver", {
    method: "PUT"
})

showToast("Order Delivered")

openClientOrders(currentClientId)
}

function closeOrders(){

document.getElementById("clientOrdersModal").style.display="none"

}

function openNewOrder(){

document.getElementById("newOrderModal").style.display="flex"

loadMaterialsForOrder()

}

function closeNewOrder(){

document.getElementById("newOrderModal").style.display="none"

}

async function loadMaterialsForOrder(){

const res = await fetch("/api/materials")
const materials = await res.json()

const materialSelect = document.getElementById("orderMaterial")
const topLayerSelect = document.getElementById("orderTopLayer")

materialSelect.innerHTML = ""
topLayerSelect.innerHTML = "<option value=''>None</option>"

/* parents */

const parents = materials.filter(m => m.parentId == null)

parents.forEach(parent => {

const children = materials.filter(m => m.parentId == parent.id)

children.forEach(child => {

const variants = materials.filter(m => m.parentId == child.id)

if(variants.length === 0){

let name = child.name + " " + parent.name

let stockDot = stockIndicator(child.stockStatus)

materialSelect.innerHTML += `
<option value="${name}">
${stockDot} ${name}
</option>`

topLayerSelect.innerHTML += `
<option value="${name}">
${stockDot} ${name}
</option>`

}else{

variants.forEach(v=>{

let name = v.name + " " + child.name + " " + parent.name

let stockDot = stockIndicator(v.stockStatus)

materialSelect.innerHTML += `
<option value="${name}">
${stockDot} ${name}
</option>`

topLayerSelect.innerHTML += `
<option value="${name}">
${stockDot} ${name}
</option>`

})

}

})

})

}

function stockIndicator(status){

if(status === "IN_STOCK") return "🟢"
if(status === "LOW_STOCK") return "🟡"
if(status === "OUT_OF_STOCK") return "🔴"

return "🔴"
}

function initFilters(){

const radios = document.querySelectorAll("input[name='filter']")

radios.forEach(radio=>{

radio.addEventListener("change",()=>{

applyFilter(radio.value)

})

})

}



async function saveOrder(){

const formData = new FormData()

formData.append("name", document.getElementById("orderClientName").value)
formData.append("phone", document.getElementById("orderClientPhone").value)
formData.append("city", document.getElementById("orderClientCity").value)

formData.append("workType", document.getElementById("orderWorkType").value)
formData.append("materials", document.getElementById("orderMaterial").value)
formData.append("topLayer", document.getElementById("orderTopLayer").value)

formData.append("remark", document.getElementById("orderRemark").value)
formData.append("price", document.getElementById("orderPrice").value)
formData.append("advance", document.getElementById("orderAdvance").value)

const file = document.getElementById("orderDxf").files[0]

if(file){
formData.append("file", file)
}

await fetch("/api/orders",{
method:"POST",
body:formData
})

closeNewOrder()
showToast("Order created")
loadClients()

}

let currentOrder = null

function openPayment(orderId){

// find order from current list
const order = document.querySelectorAll(".material-row")
currentOrder = orderId

// better: store from your orders array (recommended)
// but quick fix below 👇

fetch("/api/orders/client/"+currentClientId)
.then(res=>res.json())
.then(orders=>{

const o = orders.find(x=>x.id==orderId)

const balance = o.price - (o.advancePaid || 0)

// show modal
document.getElementById("paymentModal").style.display="flex"
document.getElementById("payOrderId").value = orderId

// 🔥 show balance
document.getElementById("payBalanceInfo").innerText =
"Balance to pay: ₹" + balance

// optional autofill
document.getElementById("payAmount").value = balance

// clear error
document.getElementById("payError").innerText = ""

})
}

function closePayment(){

document.getElementById("paymentModal").style.display="none"

}

async function submitPayment(){

const orderId = document.getElementById("payOrderId").value
const amount = parseFloat(document.getElementById("payAmount").value)
const type = document.getElementById("payType").value

// get order again
const res = await fetch("/api/orders/client/"+currentClientId)
const orders = await res.json()

const o = orders.find(x=>x.id==orderId)

const balance = o.price - (o.advancePaid || 0)

const errorBox = document.getElementById("payError")

// ❌ VALIDATION
if(amount < 1){
errorBox.innerText = "Amount must be at least ₹1"
return
}

if(amount > balance){
errorBox.innerText = "Amount exceeds balance (₹"+balance+")"
return
}

// ✅ CLEAR ERROR
errorBox.innerText = ""

// ✅ API CALL
await fetch("/api/payments",{

method:"POST",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify({
orderId:orderId,
amount:amount,
type:type
})

})

closePayment()
closeOrders()

showToast("Payment added")

}

async function editOrder(id){

const res = await fetch("/api/orders/client/"+currentClientId)
const orders = await res.json()

const order = orders.find(o=>o.id===id)

document.getElementById("editOrderModal").style.display="flex"

document.getElementById("editOrderId").value = id
document.getElementById("editWorkType").value = order.workType
document.getElementById("editRemark").value = order.remark
document.getElementById("editPrice").value = order.price
document.getElementById("editAdvance").value = order.advancePaid || 0
document.getElementById("editCreatedAt").value = 
    order.createdAt 
    ? new Date(order.createdAt).toISOString().split("T")[0] 
    : ""

// ✅ reset file input
document.getElementById("editDxf").value = ""

/* load materials */
await loadMaterialsForEdit(order)

}

async function loadMaterialsForEdit(order){

    const res = await fetch("/api/materials")
    const materials = await res.json()

    const materialSelect = document.getElementById("editMaterial")
    const topLayerSelect = document.getElementById("editTopLayer")

    materialSelect.innerHTML = ""
    topLayerSelect.innerHTML = "<option value=''>None</option>"

    /* parents */
    const parents = materials.filter(m => m.parentId == null)

    parents.forEach(parent => {

        const children = materials.filter(m => m.parentId == parent.id)

        children.forEach(child => {

            const variants = materials.filter(m => m.parentId == child.id)

            if(variants.length === 0){

                let name = child.name + " " + parent.name
                let stockDot = stockIndicator(child.stockStatus)

                materialSelect.innerHTML += `
                <option value="${name}">
                ${stockDot} ${name}
                </option>`

                topLayerSelect.innerHTML += `
                <option value="${name}">
                ${stockDot} ${name}
                </option>`

            } else {

                variants.forEach(v => {

                    let name = v.name + " " + child.name + " " + parent.name
                    let stockDot = stockIndicator(v.stockStatus)

                    materialSelect.innerHTML += `
                    <option value="${name}">
                    ${stockDot} ${name}
                    </option>`

                    topLayerSelect.innerHTML += `
                    <option value="${name}">
                    ${stockDot} ${name}
                    </option>`

                })

            }

        })

    })

    // ✅ set selected values for edit
    materialSelect.value = order.materials
    topLayerSelect.value = order.topLayer || ""
}

async function saveOrderEdit(){

const id = document.getElementById("editOrderId").value

const formData = new FormData()

formData.append("workType", document.getElementById("editWorkType").value)
formData.append("materials", document.getElementById("editMaterial").value)
formData.append("topLayer", document.getElementById("editTopLayer").value)

formData.append("remark", document.getElementById("editRemark").value)
formData.append("price", document.getElementById("editPrice").value)
formData.append("advance", document.getElementById("editAdvance").value)
formData.append("createdAt", document.getElementById("editCreatedAt").value)

// ✅ DXF file (optional)
const file = document.getElementById("editDxf").files[0]

if(file){
formData.append("file", file)
}

await fetch("/api/orders/"+id,{
method:"PUT",
body:formData
})

closeEditOrder()

showToast("Order updated")

openClientOrders(currentClientId)

}

function closeEditOrder(){
document.getElementById("editOrderModal").style.display="none"
}

async function deleteOrder(id){

if(!confirm("Delete this order?")) return

const res = await fetch("/api/orders/"+id,{
method:"DELETE"
})

const data = await res.json()

if(data.status === "error"){
showToast(data.message)
return
}

showToast("Order deleted")

openClientOrders(currentClientId)

}

function downloadDxf(id){

const link = document.createElement("a")
link.href = "/api/orders/download-dxf/" + id
link.download = ""

document.body.appendChild(link)
link.click()
document.body.removeChild(link)

showToast("Downloading DXF...")

}

function previewImage(path){

document.getElementById("imagePreviewModal").style.display="flex"

document.getElementById("previewImg").src =
"/api/orders/view-result?path=" + encodeURIComponent(path)

}

function closePreview(){
document.getElementById("imagePreviewModal").style.display="none"
}

window.addEventListener("DOMContentLoaded", function(){
    loadPage("orders")
})

function toggleFilter(){

const box = document.getElementById("filterBox")

box.style.display = box.style.display === "none" ? "block" : "none"

}

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

/* ===============================
   MATERIAL INVENTORY (VIEW ONLY)
================================ */

let materialsCache = []

async function loadMaterials(){

  const res = await fetch("/api/materials")
  materialsCache = await res.json()

  renderMaterials()

}


/* -------- STOCK STATUS -------- */

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

  if(hasInStock) return "IN_STOCK"
  if(hasLowStock) return "LOW_STOCK"

  return "OUT_OF_STOCK"
}


/* -------- BADGE -------- */

function getStockBadge(status){

  if(status === "IN_STOCK"){
    return `<span class="badge green">🟢 In Stock</span>`
  }

  if(status === "LOW_STOCK"){
    return `<span class="badge yellow">🟡 Low Stock</span>`
  }

  return `<span class="badge red">🔴 Out of Stock</span>`
}


/* -------- RENDER ROOT -------- */

function renderMaterials(){

  const container = document.getElementById("materialsContainer")
  container.innerHTML=""

  const parents = materialsCache.filter(m => m.parentId == null)

  parents.forEach(parent=>{

    container.innerHTML += `
    <div class="material-row"
         onmouseenter="showMaterialInfo(${parent.id}, event)"
         onmouseleave="hideMaterialInfo()">

      <div class="material-name">
        <span id="icon-${parent.id}" onclick="toggleChildren(${parent.id})" style="cursor:pointer;">▶</span>
        ${parent.name}
      </div>

      <div class="stock">
        ${getStockBadge(calculateStockStatus(parent.id))}
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

    const hasChildren = materialsCache.some(m => m.parentId == child.id)

    html += `
    <div class="material-row child"
         onmouseenter="showMaterialInfo(${child.id}, event)"
         onmouseleave="hideMaterialInfo()">

      <div class="material-name">
        <span id="icon-${child.id}" onclick="toggleChildren(${child.id})" style="cursor:pointer;">
          ${hasChildren ? "▶" : "•"}
        </span>
        ${child.name}
      </div>

      <div class="stock">
        ${getStockBadge(
          hasChildren 
          ? calculateStockStatus(child.id)
          : child.stockStatus
        )}
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


/* -------- TOGGLE -------- */

function toggleChildren(id){

  const el = document.getElementById("children-"+id)
  const icon = document.getElementById("icon-"+id)

  if(!el) return

  const isOpen = el.style.display === "block"

  el.style.display = isOpen ? "none" : "block"

  if(icon){
    icon.innerText = isOpen ? "▶" : "▼"
  }

}


/* -------- TOOLTIP -------- */

function showMaterialInfo(id, e){

  const m = materialsCache.find(x=>x.id==id)
  const children = materialsCache.filter(x=>x.parentId==id)

  const tooltip = document.getElementById("materialTooltip")

  tooltip.innerHTML = `
  <b>${m.name}</b><br>
  Type: ${children.length ? "Parent" : "Leaf"}<br>
  Status: ${getStockBadge(
    m.stockStatus || calculateStockStatus(id)
  )}
  `

  tooltip.style.display = "block"
  tooltip.style.left = e.pageX + 10 + "px"
  tooltip.style.top = e.pageY + 10 + "px"

}

function hideMaterialInfo(){
  const tooltip = document.getElementById("materialTooltip")
  if(tooltip) tooltip.style.display="none"
}


function searchMaterial(text){

  text = text.toLowerCase()

  const container = document.getElementById("materialsContainer")

  // each parent block = row + its children container
  const parentRows = container.querySelectorAll(":scope > .material-row")

  parentRows.forEach(parentRow => {

    const name = parentRow
      .querySelector(".material-name")
      .innerText
      .toLowerCase()

    const parentId = parentRow
      .querySelector("[id^='icon-']")
      ?.id?.replace("icon-", "")

    const childrenBox = document.getElementById("children-" + parentId)

    if(name.includes(text)){

      parentRow.style.display = "flex"

      // IMPORTANT: keep children hidden initially (normal behavior)
      if(childrenBox) childrenBox.style.display = "none"

      // reset icon
      const icon = document.getElementById("icon-" + parentId)
      if(icon) icon.innerText = "▶"

    }else{

      parentRow.style.display = "none"

      // also hide its children completely
      if(childrenBox) childrenBox.style.display = "none"

    }

  })

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