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

})

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

let total = 0
let paid = 0

orders.forEach(o=>{
    total += o.price || 0
    paid += o.advancePaid || 0
})

c.pendingAmount = total - paid

// latest order date
c.lastOrderDate = orders.length
? orders[orders.length - 1].id
: 0

}

renderClients(clientsCache)

}

let currentOrders = []


/* RENDER CLIENT CARDS */

function renderClients(clients){

const grid = document.getElementById("clientsGrid")

if(!grid) return

grid.innerHTML=""

clients.forEach(c=>{

grid.innerHTML += `

<div class="client-card"
onclick="openClientOrders(${c.id})">

    <!-- TOP ROW -->
    <div class="client-top">
        <div class="client-name">${c.name}</div>

${c.pendingAmount > 0 ? `
<div class="client-pending pending">
    ₹${c.pendingAmount}
</div>
` : ``}
    </div>

<div class="client-phone">${c.phone}</div>

<div class="client-city">${c.city || ""}</div>

<!-- 🔥 NEW -->
<div style="font-size:12px;color:#555;margin-top:5px;">
Orders: ${c.orderCount || 0}
</div>

<div class="client-actions">

<button onclick="event.stopPropagation();editClient(${c.id})">Edit</button>

<button onclick="event.stopPropagation();deleteClient(${c.id})">Delete</button>



<button onclick="event.stopPropagation();openPaymentHistory(${c.id})">
💰 Payments
</button>

<button onclick="event.stopPropagation();addOrderForClient(${c.id})">+ Order</button>

</div>

</div>

`

})

}

function addOrderForClient(clientId){

    const client = clientsCache.find(c=>c.id===clientId)

    openNewOrder()

    // auto fill
    setTimeout(()=>{

        document.getElementById("orderClientName").value = client.name
        document.getElementById("orderClientPhone").value = client.phone
        document.getElementById("orderClientCity").value = client.city || ""

    },100)
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

if(!name){
    showToast("Client name is required","error")
    return
}

if(!phone){
    showToast("Phone is required","error")
    return
}

if(!/^\d{10}$/.test(phone)){
    showToast("Enter valid 10-digit phone number","error")
    return
}

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

currentOrders = orders
renderOrders(orders)
renderClientSummary(orders)

}



function renderClientSummary(orders){

let total = 0
let paid = 0
let completed = 0

orders.forEach(o=>{
    total += o.price || 0
    paid += o.advancePaid || 0
    if(o.status === "COMPLETED" || o.status === "DELIVERED"){
        completed++
    }
})

const pending = total - paid

document.getElementById("clientSummary").innerHTML = `

<div class="summary-card">
Total Orders<br><b>${orders.length}</b>
</div>

<div class="summary-card">
Revenue<br><b>₹${total}</b>
</div>

<div class="summary-card">
Pending<br><b style="color:red;">₹${pending}</b>
</div>

<div class="summary-card">
Completed<br><b>${completed}</b>
</div>

`
}

function filterOrders(){

    const orderDate = document.getElementById("filterOrderDate").value
    const deliveredDate = document.getElementById("filterDeliveredDate").value

    let filtered = [...currentOrders]

    if(orderDate){
        filtered = filtered.filter(o =>
            o.createdAt &&
            new Date(o.createdAt).toISOString().split("T")[0] === orderDate
        )
    }

    if(deliveredDate){
        filtered = filtered.filter(o =>
            o.deliveredAt &&
            new Date(o.deliveredAt).toISOString().split("T")[0] === deliveredDate
        )
    }

    renderOrders(filtered)
}

function clearOrderFilters(){
    document.getElementById("filterOrderDate").value = ""
    document.getElementById("filterDeliveredDate").value = ""
    renderOrders(currentOrders)
}

function getProgressStep(status){

    if(status === "CREATED") return 1
    if(status === "IN_PROGRESS") return 2
    if(status === "COMPLETED") return 3
    if(status === "DELIVERED") return 4

    return 1
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
const step = getProgressStep(o.status)

container.innerHTML += `

<div class="order-card">

    <!-- HEADER -->
    <div class="order-header">
        <div>
            <div class="order-id">#${o.id}</div>
            <div class="order-type">${o.workType || ""}</div>
        </div>

        <span class="status-pill ${statusClass}">
            ${o.status}
        </span>
    </div>

    
    <!-- PROGRESS TRACKER -->
<div class="order-progress">

    <div class="step ${step>=1?'active':''}">Created</div>
    <div class="line ${step>=2?'active':''}"></div>

    <div class="step ${step>=2?'active':''}">In Progress</div>
    <div class="line ${step>=3?'active':''}"></div>

    <div class="step ${step>=3?'active':''}">Completed</div>
    <div class="line ${step>=4?'active':''}"></div>

    <div class="step ${step>=4?'active':''}">Delivered</div>

</div>

    <!-- IMAGE (CENTER BIG) -->
    ${o.resultImage ? `
    <div class="order-image-box">
        <img src="/api/orders/view-result?path=${encodeURIComponent(o.resultImage)}"
        class="order-image"
        onclick="previewImage('${o.resultImage}')">
    </div>
    ` : ``}

    <!-- BODY -->
    <div class="order-body">

        <div class="order-info">
            <b>Material:</b> ${o.materials || "-"} <br>
            <!--<b>Material 2:</b> ${o.topLayer || "-"} <br>--!>
            <b>Notes:</b> ${o.remark || "-"}
        </div>

        <div class="order-finance">
            <div>Total: ₹${o.price || 0}</div>
            <div>Paid: ₹${o.advancePaid || 0}</div>
            <div class="balance ${balance>0?'pending':'paid'}">
                Balance: ₹${balance}
            </div>
        </div>

    </div>

    <!-- FOOTER -->
    <div class="order-footer">

        <div class="order-date">
            Ordered: ${o.createdAt ? new Date(o.createdAt).toLocaleDateString('en-GB') : ""}<br>
            ${o.deliveredAt ? `Delivered: ${new Date(o.deliveredAt).toLocaleDateString('en-GB')}` : ""}
        </div>

        <div class="order-actions">

            ${o.dxfFile ? `<button onclick="downloadDxf(${o.id})">DXF</button>` : ``}

            <button onclick="editOrder(${o.id})">Edit</button>

            <button onclick="deleteOrder(${o.id})">Delete</button>

            ${balance <= 0 ? `
            <button class="paid-btn" disabled>✔ Paid</button>
            ` : `
            <button onclick="openPayment(${o.id})">Pay</button>
            `}

<!--${o.status == "COMPLETED" ? `
<button onclick="markDelivered(${o.id})">
Deliver
</button>
` : ``}-->

        </div>

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

function handleWorkTypeChange(){

    const workType = document.getElementById("orderWorkType").value
    const isLaser = workType && workType.startsWith("LASER")

    const dxfInput = document.getElementById("orderDxf")
    const label = document.getElementById("dxfLabel")

    if(isLaser){
        label.innerText = "DXF (Required)"
        dxfInput.required = true
    }else{
        label.innerText = "DXF (Optional)"
        dxfInput.required = false
    }
}

function openNewOrder(){

    document.getElementById("orderWorkType")
.addEventListener("change", handleWorkTypeChange)

document.getElementById("newOrderModal").style.display="flex"

loadMaterialsForOrder()

setTimeout(()=>{
    renderMaterialOptions(allMaterials)
},200)

}

document.addEventListener("click", function(e){

    const box = document.getElementById("materialSelectBox")

    if(!box) return

    if(!box.contains(e.target)){
        box.classList.remove("active")
    }

})

function closeNewOrder(){

document.getElementById("newOrderModal").style.display="none"

}



async function loadMaterialsForOrder(){

    const res = await fetch("/api/materials")
    const materials = await res.json()

    allMaterials = []

    const parents = materials.filter(m => m.parentId == null)

    parents.forEach(parent => {

        const children = materials.filter(m => m.parentId == parent.id)

        children.forEach(child => {

            const variants = materials.filter(m => m.parentId == child.id)

            // 🔥 NO VARIANT
            if(variants.length === 0){

                let name = child.name + " " + parent.name

                allMaterials.push({
                    name: name,
                    stock: child.stockStatus
                })

            }

            // 🔥 WITH VARIANTS
            else{

                variants.forEach(v=>{

                    let name = v.name + " " + child.name + " " + parent.name

                    allMaterials.push({
                        name: name,
                        stock: v.stockStatus
                    })

                })

            }

        })

    })

    // ✅ render after loading
    renderMaterialOptions(allMaterials)
}

function renderMaterialOptions(list){

    const container = document.getElementById("materialOptions")
    container.innerHTML = ""

    // NONE option
    container.innerHTML += `
    <div class="option" onclick="selectMaterial('')">
        None
    </div>`

    list.forEach(m=>{

        let dot = stockIndicator(m.stock)

        container.innerHTML += `
        <div class="option" onclick="selectMaterial('${m.name}')">
            ${dot} ${m.name}
        </div>`
    })
}

function selectMaterial(value){

    document.getElementById("materialSearch").value = value || ""

    document.getElementById("materialSelectBox")
    .classList.remove("active")
}

// function renderTopLayerOptions(list){

//     const select = document.getElementById("orderTopLayer")
//     select.innerHTML = "<option value=''>None</option>"

//     list.forEach(m=>{

//         let dot = stockIndicator(m.stock)

//         select.innerHTML += `
//         <option value="${m.name}">
//             ${dot} ${m.name}
//         </option>`
//     })
// }

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

const name = document.getElementById("orderClientName").value.trim()
const phone = document.getElementById("orderClientPhone").value.trim()
const price = document.getElementById("orderPrice").value.trim()
const workType = document.getElementById("orderWorkType").value

if(!name){
    showToast("Client name is required","error")
    return
}

if(!phone){
    showToast("Phone is required","error")
    return
}

if(!/^\d{10}$/.test(phone)){
    showToast("Enter valid 10-digit phone number","error")
    return
}

if(!price || Number(price) <= 0){
    showToast("Valid price is required","error")
    return
}

if(!workType || workType == ""){
    showToast("Please select work type","error")
    return
}

const formData = new FormData()

formData.append("name", document.getElementById("orderClientName").value)
formData.append("phone", document.getElementById("orderClientPhone").value)
formData.append("city", document.getElementById("orderClientCity").value)

formData.append("workType", document.getElementById("orderWorkType").value)
formData.append("materials", document.getElementById("materialSearch").value)
// formData.append("topLayer", document.getElementById("orderTopLayer").value)

formData.append("remark", document.getElementById("orderRemark").value)
formData.append("price", document.getElementById("orderPrice").value)
formData.append("advance", document.getElementById("orderAdvance").value)

const file = document.getElementById("orderDxf").files[0]

const isLaser = workType && workType.startsWith("LASER")

if(file){
formData.append("file", file)
}

if(isLaser && !file){
    showToast("DXF file is required for Laser work", "error")
    return
}

await fetch("/api/orders",{
method:"POST",
body:formData
})



closeNewOrder()
showToast("Order created")
loadClients()

}

let allMaterials = []
// let allTopLayers = []

function filterMaterialOptions(){

    document.getElementById("materialSelectBox").classList.add("active")

    const text = document.getElementById("materialSearch").value.toLowerCase()

    const filtered = allMaterials.filter(m =>
        m.name.toLowerCase().includes(text)
    )

    renderMaterialOptions(filtered.length ? filtered : allMaterials)
}

// function filterTopLayerOptions(){

//     const text = document.getElementById("topLayerSearch").value.toLowerCase()

//     const filtered = allTopLayers.filter(m =>
//         m.name.toLowerCase().includes(text)
//     )

//     renderTopLayerOptions(filtered.length ? filtered : allTopLayers)
// }

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

document.getElementById("payAmount").value = balance

document.getElementById("upiSelect").value = "8431983269@ybl"

updateUPIQR()   // 🔥 generate initial QR

// clear error
document.getElementById("payError").innerText = ""


})
}

function updateUPIQR(){

    const amount = document.getElementById("payAmount").value
    const upiId = document.getElementById("upiSelect").value  // ✅ dynamic
    const name = "SHANTVEERESH SHEELAVANTAR"

    if(!amount || amount <= 0) return

    const upiUrl = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(name)}&am=${amount}&cu=INR`

    const qrUrl = "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=" + encodeURIComponent(upiUrl)

    document.getElementById("upiQr").src = qrUrl
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


showToast("Payment added")

openClientOrders(currentClientId)

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

    allMaterials = []

    const parents = materials.filter(m => m.parentId == null)

    parents.forEach(parent => {

        const children = materials.filter(m => m.parentId == parent.id)

        children.forEach(child => {

            const variants = materials.filter(m => m.parentId == child.id)

            if(variants.length === 0){

                let name = child.name + " " + parent.name

                allMaterials.push({
                    name: name,
                    stock: child.stockStatus
                })

            } else {

                variants.forEach(v => {

                    let name = v.name + " " + child.name + " " + parent.name

                    allMaterials.push({
                        name: name,
                        stock: v.stockStatus
                    })

                })

            }

        })

    })

    // ✅ render dropdown
    renderEditMaterialOptions(allMaterials)

    // ✅ set existing value
    document.getElementById("editMaterialSearch").value = order.materials || ""
}

function filterEditMaterialOptions(){

    document.getElementById("editMaterialSelectBox").classList.add("active")

    const text = document.getElementById("editMaterialSearch").value.toLowerCase()

    const filtered = allMaterials.filter(m =>
        m.name.toLowerCase().includes(text)
    )

    renderEditMaterialOptions(filtered.length ? filtered : allMaterials)
}

// function filterEditTopLayerOptions(){

//     const text = document.getElementById("editTopLayerSearch").value.toLowerCase()

//     const filtered = allTopLayers.filter(m =>
//         m.name.toLowerCase().includes(text)
//     )

//     renderEditTopLayerOptions(filtered.length ? filtered : allTopLayers)
// }

function renderEditMaterialOptions(list){

    const container = document.getElementById("editMaterialOptions")
    container.innerHTML = ""

    container.innerHTML += `
    <div class="option" onclick="selectEditMaterial('')">None</div>`

    list.forEach(m=>{

        let dot = stockIndicator(m.stock)

        container.innerHTML += `
        <div class="option" onclick="selectEditMaterial('${m.name}')">
            ${dot} ${m.name}
        </div>`
    })
}

function selectEditMaterial(value){

    document.getElementById("editMaterialSearch").value = value || ""

    document.getElementById("editMaterialSelectBox")
    .classList.remove("active")
}
// function renderEditTopLayerOptions(list){

//     const select = document.getElementById("editTopLayer")
//     const selected = select.value

//     select.innerHTML = "<option value=''>None</option>"

//     list.forEach(m=>{
//         let dot = stockIndicator(m.stock)

//         select.innerHTML += `
//         <option value="${m.name}">
//             ${dot} ${m.name}
//         </option>`
//     })

//     select.value = selected
// }

function toggleMaterialDropdown(){
    document.getElementById("materialSelectBox")
    .classList.toggle("active")
}

function toggleEditMaterialDropdown(){
    document.getElementById("editMaterialSelectBox")
    .classList.toggle("active")
}

async function saveOrderEdit(){


const price = document.getElementById("editPrice").value.trim()



if(!price || Number(price) <= 0){
    showToast("Valid price is required","error")
    return
}
const workType = document.getElementById("editWorkType").value

if(!workType || workType == ""){
    showToast("Work type is required","error")
    return
}


const id = document.getElementById("editOrderId").value

const formData = new FormData()

formData.append("workType", document.getElementById("editWorkType").value)
formData.append("materials", document.getElementById("editMaterialSearch").value)
// formData.append("topLayer", document.getElementById("editTopLayer").value)

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

// 🔥 close when clicking outside
document.addEventListener("click", function(e){

    const box = document.getElementById("filterBox")
    const btn = document.querySelector(".filter-btn")

    if(!box.contains(e.target) && !btn.contains(e.target)){
        box.style.display = "none"
    }

})

async function openPaymentHistory(clientId){

    document.getElementById("paymentHistoryModal").style.display = "flex"

    const container = document.getElementById("paymentHistoryList")
    container.innerHTML = "Loading..."

    try{

        const res = await fetch(`/api/payments/client/${clientId}`)
        const payments = await res.json()

        payments.sort((a,b)=>
            new Date(b.paidAt) - new Date(a.paidAt)
        )

        renderPaymentHistory(payments)

    }catch(e){
        container.innerHTML = "Failed to load payments"
    }
}

function closePaymentHistory(){
    document.getElementById("paymentHistoryModal").style.display = "none"
}

function renderPaymentHistory(payments){

    const container = document.getElementById("paymentHistoryList")

    if(!payments.length){
        container.innerHTML = "No payments found"
        return
    }

    let html = `
    <div class="table-wrapper">
    <table class="exp-table">
        <thead>
            <tr>
                <th>Date</th>
                <th>Order ID</th>
                <th>Amount</th>
                <th>Type</th>
            </tr>
        </thead>
        <tbody>
    `

    payments.forEach(p => {

        html += `
        <tr>
            <td data-label="Date">${formatDisplayDate(new Date(p.paidAt))}</td>
            <td data-label="Order">#${p.orderId}</td>
            <td data-label="Amount"><b>₹${p.amount}</b></td>
            <td data-label="Type">
    <span class="payment-type type-${p.paymentType}">
        ${p.paymentType}
    </span>
</td>
        </tr>
        `
    })

    html += `</tbody></table></div>`

    container.innerHTML = html
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
        <span id="icon-${parent.id}" onclick="toggleChildren(${parent.id})" style="cursor:pointer;">📂</span>
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
          ${hasChildren ? "📂" : "📄"}
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
    icon.innerText = isOpen ? "📂" : "▶"
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
      if(icon) icon.innerText = "📂"

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

function openBulkPayment(){

    const orders = currentOrders

    let total = 0
    let paid = 0

    orders.forEach(o=>{
        total += o.price || 0
        paid += o.advancePaid || 0
    })

    const pending = total - paid

    if(pending <= 0){
        showToast("No pending amount")
        return
    }

    document.getElementById("paymentModal").style.display="flex"

    document.getElementById("bulkClientId").value = currentClientId
    document.getElementById("payOrderId").value = ""   // 🔥 IMPORTANT

    document.getElementById("payBalanceInfo").innerText =
        "Total Pending: ₹" + pending

    document.getElementById("payAmount").value = pending

    document.getElementById("payError").innerText = ""

    updateUPIQR()
}

async function submitPayment(){

const orderId = document.getElementById("payOrderId").value
const bulkClientId = document.getElementById("bulkClientId").value

const amount = parseFloat(document.getElementById("payAmount").value)
const type = document.getElementById("payType").value

const errorBox = document.getElementById("payError")

if(amount < 1){
    errorBox.innerText = "Amount must be at least ₹1"
    return
}

errorBox.innerText = ""

// 🔥 BULK MODE
if(bulkClientId){

    await fetch("/api/payments/bulk",{
        method:"POST",
        headers:{
            "Content-Type":"application/json"
        },
        body:JSON.stringify({
            clientId: bulkClientId,
            amount: amount,
            type: type
        })
    })

    showToast("Bulk payment applied")

}else{

    // SINGLE PAYMENT (existing logic)
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

    showToast("Payment added")
}

closePayment()
openClientOrders(currentClientId)
}