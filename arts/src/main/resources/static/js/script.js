

function openLogin(){

document.getElementById("loginModal").style.display="flex";

}

function closeLogin(){

document.getElementById("loginModal").style.display="none";

}

window.onclick = function(event){

const modal=document.getElementById("loginModal");

if(event.target==modal){

modal.style.display="none";

}

}

const toggle = document.getElementById("menuToggle");
const nav = document.getElementById("navLinks");

toggle.addEventListener("click", () => {
nav.classList.toggle("active");
});



let currentLang = "en";

function toggleLanguage(){

currentLang = currentLang === "en" ? "kn" : "en";

/* change text elements */

document.querySelectorAll("[data-en]").forEach(el=>{

if(el.tagName === "INPUT" || el.tagName === "TEXTAREA"){

el.placeholder = el.dataset[currentLang];

}else{

el.textContent = el.dataset[currentLang];

}

});

/* change button text */

const btn = document.getElementById("langBtn");

btn.textContent = currentLang === "en" ? "ಕನ್ನಡ" : "English";

}

const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const messageBox = document.getElementById("loginMessage");

emailInput.addEventListener("blur", async () => {

    const email = emailInput.value;

    if(!email) return;

    const res = await fetch("/api/auth/check-email", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({email})
    });

    const data = await res.json();

    if(data.exists){

        if(data.role === "SUPER_ADMIN"){
            messageBox.innerText = "Welcome Super Admin";
        }
        else if(data.role === "ADMIN"){
            messageBox.innerText = "Welcome Admin";
        }
        else{
            messageBox.innerText = "Welcome Client";
        }

        passwordInput.disabled = false;

    }else{
        messageBox.innerText = "User not found. Create account.";
        passwordInput.disabled = true;
    }

});

document.getElementById("loginForm").addEventListener("submit", async function(e){

    e.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    const res = await fetch("/api/auth/login",{
        method:"POST",
        headers:{
            "Content-Type":"application/json"
        },
        body:JSON.stringify({email,password})
    });

    const data = await res.json();

if(data.success){

fetch("/api/auth/session")
.then(res=>res.json())
.then(user=>{

if(user.role === "SUPER_ADMIN"){
window.location.href="/order"
}

else if(user.role === "ADMIN"){
window.location.href="/production"
}

})

}else{

        document.getElementById("loginMessage").innerText = "Invalid password";

    }

});
