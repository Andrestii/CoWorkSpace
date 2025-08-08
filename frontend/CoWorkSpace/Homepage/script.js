const coworkingSpaces = [
  {
    name: "Modern Workspace",
    city: "Austen",
    country: "Italio",
    image: "img/imm1.jpg",
    rating: 5
  },
  {
    name: "Creative Hub",
    city: "Oraga",
    country: "Itálo",
    image: "img/imm2.jpg",
    rating: 5
  },
  {
    name: "Downtown Office",
    city: "Berlin",
    country: "Chicago",
    image: "img/imm3.jpg",
    rating: 5
  },
  {
    name: "Shared Office",
    city: "Trerno",
    country: "San Ituic",
    image: "img/imm4.jpg",
    rating: 5
  }
];

function renderCards() {
  const container = document.querySelector('.cards-grid');
  coworkingSpaces.forEach(space => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <img src="${space.image}" alt="${space.name}" />
      <div class="card-content">
        <div class="stars">★★★★★</div>
        <h3>${space.name}</h3>
        <p>${space.city} – ${space.country}</p>
      </div>
    `;
    container.appendChild(card);
  });
}

document.addEventListener("DOMContentLoaded", renderCards);

/*Registrazione e login*/
document.addEventListener("DOMContentLoaded", () => {
  const modal = document.getElementById("auth-modal");
  const overlay = document.getElementById("modal-overlay");
  const openLoginBtn = document.querySelector(".login");
  const openRegisterBtn = document.querySelector(".sign-in");
  const closeModalBtn = document.getElementById("close-modal");

  const loginTab = document.getElementById("modal-login-tab");
  const registerTab = document.getElementById("modal-register-tab");
  const loginForm = document.getElementById("modal-login-form");
  const registerForm = document.getElementById("modal-register-form");
  const passwordInput = document.getElementById("reg-password");
  const confirmInput = document.getElementById("confirm-password");
  const message = document.getElementById("password-message");

registerForm.addEventListener("submit", function (e) {
  if (passwordInput.value !== confirmInput.value) {
    e.preventDefault(); // blocca invio
    message.style.display = "block";
  } else {
    message.style.display = "none";
    // continua con la registrazione (es. salvataggio dati)
  }
});

  function openModal(mode = "login") {
    modal.classList.remove("hidden");
    overlay.classList.remove("hidden");
    if (mode === "register") {
      switchToRegister();
    } else {
      switchToLogin();
    }
  }

  function closeModal() {
    modal.classList.add("hidden");
    overlay.classList.add("hidden");
  }

  function switchToLogin() {
    loginTab.classList.add("active");
    registerTab.classList.remove("active");
    loginForm.classList.add("active");
    registerForm.classList.remove("active");
  }

  function switchToRegister() {
    loginTab.classList.remove("active");
    registerTab.classList.add("active");
    loginForm.classList.remove("active");
    registerForm.classList.add("active");
  }

  openLoginBtn.addEventListener("click", (e) => {
    e.preventDefault();
    openModal("login");
  });

  openRegisterBtn.addEventListener("click", (e) => {
    e.preventDefault();
    openModal("register");
  });

  closeModalBtn.addEventListener("click", closeModal);
  overlay.addEventListener("click", closeModal);

  loginTab.addEventListener("click", switchToLogin);
  registerTab.addEventListener("click", switchToRegister);
});

