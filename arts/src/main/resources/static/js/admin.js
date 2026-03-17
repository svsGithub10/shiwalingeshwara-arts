function loadPage(page){

fetch("/admin/"+page)
.then(res => {

if(!res.ok){
throw new Error("Page not found")
}

return res.text()

})
.then(html => {

document.getElementById("contentArea").innerHTML = html;

if(page === "orders"){
loadClients();
}

})
.catch(err => {

console.error(err)

showToast("Failed to load page")

});

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

<!-- PRICE -->
<div>
₹${o.price || 0}
</div>

<!-- ADVANCE -->
<div>
Paid: ₹${o.advancePaid || 0}
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

let stockDot = stockIndicator(child.stock)

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

let stockDot = stockIndicator(v.stock)

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

function stockIndicator(stock){

if(stock === 0)
return "🔴"

if(stock <= 10)
return "🟡"

return "🟢"

}

async function saveOrder(){

const formData = new FormData()

formData.append("name", document.getElementById("orderClientName").value)
formData.append("phone", document.getElementById("orderClientPhone").value)
formData.append("city", document.getElementById("orderClientCity").value)

formData.append("workType", document.getElementById("orderWorkType").value)
formData.append("materials", document.getElementById("orderMaterial").value)
formData.append("topLayer", document.getElementById("orderTopLayer").value)

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
document.getElementById("editPrice").value = order.price
document.getElementById("editAdvance").value = order.advancePaid || 0

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
                let stockDot = stockIndicator(child.stock)

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
                    let stockDot = stockIndicator(v.stock)

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

formData.append("price", document.getElementById("editPrice").value)
formData.append("advance", document.getElementById("editAdvance").value)

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