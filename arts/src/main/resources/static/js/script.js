let galleryData = [];

/* ===============================
SAFE INIT
================================ */

window.addEventListener("DOMContentLoaded", () => {

// ✅ gallery init
if(document.getElementById("galleryGrid")){
    loadGallery();
}

// ✅ navbar toggle (safe)
const toggle = document.getElementById("menuToggle");
const nav = document.getElementById("navLinks");

if(toggle && nav){
    toggle.addEventListener("click", () => {
        nav.classList.toggle("active");
    });
}

// ✅ login form safe binding
initLogin();

});

/* ===============================
LOGIN SYSTEM (SAFE)
================================ */

function initLogin(){

const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const messageBox = document.getElementById("loginMessage");
const loginForm = document.getElementById("loginForm");

if(emailInput && passwordInput){

    emailInput.addEventListener("blur", async () => {

        const email = emailInput.value;
        if(!email) return;

        try{
            const res = await fetch("/api/auth/check-email", {
                method: "POST",
                headers: {"Content-Type":"application/json"},
                body: JSON.stringify({email})
            });

            const data = await res.json();

            if(data.exists){
                messageBox.innerText = "Welcome";
                passwordInput.disabled = false;
            }else{
                messageBox.innerText = "User not found";
                passwordInput.disabled = true;
            }

        }catch(e){
            console.error(e);
        }

    });
}

if(loginForm){
    loginForm.addEventListener("submit", async function(e){

        e.preventDefault();

        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;
        const rememberMe = document.getElementById("rememberMe")?.checked || false;

        try{
            const res = await fetch("/api/auth/login",{
                method:"POST",
                headers:{"Content-Type":"application/json"},
                body: JSON.stringify({
                    email,
                    password,
                    rememberMe: rememberMe.toString()
                })
            });

            const data = await res.json();

            if(data.success){

                const session = await fetch("/api/auth/session");
                const user = await session.json();

                if(user.role === "SUPER_ADMIN"){
                    window.location.href="/order";
                }
                else if(user.role === "ADMIN"){
                    window.location.href="/production";
                }

            }else{
                document.getElementById("loginMessage").innerText = "Invalid password";
            }

        }catch(e){
            console.error(e);
        }

    });
}

}

async function openLogin(){

try{
    const res = await fetch("/api/auth/session");
    const user = await res.json();

    if(user.userId){

        if(user.role === "SUPER_ADMIN"){
            window.location.href = "/order";
        }
        else if(user.role === "ADMIN"){
            window.location.href = "/production";
        }
        else{
            window.location.href = "/dashboard";
        }

    }else{
        const modal = document.getElementById("loginModal");
        if(modal) modal.style.display = "flex";
    }

}catch(e){
    const modal = document.getElementById("loginModal");
    if(modal) modal.style.display = "flex";
}

}

function closeLogin(){
const modal = document.getElementById("loginModal");
if(modal) modal.style.display="none";
}

window.onclick = function(event){
const modal = document.getElementById("loginModal");
if(modal && event.target == modal){
modal.style.display="none";
}
};

/* ===============================
LANGUAGE TOGGLE
================================ */

let currentLang = "en";

function toggleLanguage(){

currentLang = currentLang === "en" ? "kn" : "en";

document.querySelectorAll("[data-en]").forEach(el=>{
    if(el.tagName === "INPUT" || el.tagName === "TEXTAREA"){
        el.placeholder = el.dataset[currentLang];
    }else{
        el.textContent = el.dataset[currentLang];
    }
});

const btn = document.getElementById("langBtn");
if(btn){
    btn.textContent = currentLang === "en" ? "ಕನ್ನಡ" : "English";
}

}

/* ===============================
GALLERY
================================ */

async function loadGallery(){

const grid = document.getElementById("galleryGrid");

try{
    const res = await fetch("/api/orders/gallery");

    if(!res.ok) throw new Error("API error");

    galleryData = await res.json();

    initGalleryFilters(galleryData);
    applyGalleryFilters();

}catch(e){
    console.error(e);
    if(grid){
        grid.innerHTML = `<p style="text-align:center;color:red;">Failed to load gallery</p>`;
    }
}

}

/* PRICE LOGIC */

function getGalleryPrice(o){

    // ✅ only use displayPrice if it is a valid number
    if(
        o.displayPrice !== null &&
        o.displayPrice !== undefined &&
        o.displayPrice !== ""
    ){
        return Number(o.displayPrice);
    }

    return o.price;
}

/* FILTER INIT */

function initGalleryFilters(data){

const matSet = new Set();
const bgSet = new Set();

data.forEach(o=>{

    if(o.materials){
        const main = getMainMaterial(o.materials);
        matSet.add(main);
    }

    let bg = o.bgColor;

    if(bg === null || bg === undefined || bg.trim?.() === ""){
        bg = "NONE";
    }

    if(bg) bgSet.add(bg);
});

const matSelect = document.getElementById("gMaterial");
const bgSelect = document.getElementById("gBg");

if(!matSelect || !bgSelect) return;

matSelect.innerHTML = `<option value="">All Materials</option>`;
bgSelect.innerHTML = `<option value="">All Colors</option>`;

matSet.forEach(m=>{
    matSelect.innerHTML += `<option value="${m}">${m}</option>`;
});

bgSet.forEach(b=>{
    const label = (b === "NONE") ? "None" : b;
    bgSelect.innerHTML += `<option value="${b}">${label}</option>`;
});

matSelect.onchange = applyGalleryFilters;
bgSelect.onchange = applyGalleryFilters;

const sort = document.getElementById("gSort");
if(sort) sort.onchange = applyGalleryFilters;

}

/* FILTER APPLY */

function applyGalleryFilters(){

let data = [...galleryData];

const mat = document.getElementById("gMaterial")?.value;
const bg = document.getElementById("gBg")?.value;
const sort = document.getElementById("gSort")?.value;

if(mat){
    data = data.filter(o => {
        const main = getMainMaterial(o.materials);
        return main === mat;
    });
}

if(bg){
    if(bg === "NONE"){
        data = data.filter(o =>
            !o.bgColor || o.bgColor.trim() === ""
        );
    }else{
        data = data.filter(o => o.bgColor === bg);
    }
}

if(sort === "latest"){
    data.sort((a,b)=> new Date(b.date) - new Date(a.date));
}

if(sort === "price"){
    data.sort((a,b)=> getGalleryPrice(b) - getGalleryPrice(a));
}

renderGallery(data);

}

function getMainMaterial(value){

    if(!value) return "OTHER";

    const words = value.trim().split(" ");
    return words[words.length - 1].toUpperCase(); // MDF, ACRYLIC
}

/* RENDER */

function renderGallery(data){

const grid = document.getElementById("galleryGrid");
if(!grid) return;

grid.innerHTML = "";

if(data.length === 0){
    grid.innerHTML = `<p style="text-align:center">No designs found</p>`;
    return;
}

data.forEach(o=>{

    const price = getGalleryPrice(o);

    grid.innerHTML += `
    <div class="g-card">

        <img 
            src="/api/orders/view-result?path=${encodeURIComponent(o.image)}"
            onclick="previewGalleryImage('${o.image}')"
        >

        <div class="g-price">₹${price}</div>

 <div class="g-overlay">

    

    <div class="g-info">
        ${o.materials || "-"} <br>
        ${(o.bgColor && o.bgColor.trim() !== "") 
            ? o.bgColor + " background"
            : "No Color"}
    </div>

</div>

    </div>
    `;
});

}

/* BG COLOR MAP */

function getBgColorPreview(value){

const map = {
    WHITE: "#ffffff",
    BLACK: "#000000",
    RED: "#ef4444",
    BLUE: "#002e79",
    GREEN: "#007a2d",
    PINK: "#db25c3"
};

return map[value] || "#ccc";

}

/* IMAGE PREVIEW */

function previewGalleryImage(path){

const modal = document.createElement("div");
modal.style = `
    position:fixed;
    top:0;
    left:0;
    width:100%;
    height:100%;
    background:rgba(0,0,0,0.9);
    display:flex;
    align-items:center;
    justify-content:center;
    z-index:9999;
`;

modal.innerHTML = `
    <img src="/api/orders/view-result?path=${encodeURIComponent(path)}"
    style="max-width:90%;max-height:90%;">
`;

modal.onclick = () => modal.remove();

document.body.appendChild(modal);

}