function loadUsers() {
  const json = localStorage.getItem("users");
  if (!json) return [];
  try {
    return JSON.parse(json);
  } catch (e) {
    console.error("Corrupted users data, resetting", e);
    localStorage.removeItem("users");
    return [];
  }
}

function setAuth(username) {
  localStorage.setItem("currentUser", username);
  localStorage.setItem("sessionToken", Date.now().toString());
}

function clearAuth() {
  localStorage.removeItem("currentUser");
  localStorage.removeItem("sessionToken");
}

function isAuthenticated() {
  return !!localStorage.getItem("currentUser");
}

function verifyAuth() {
  const path = location.pathname.toLowerCase();
  if (
    path.endsWith("/iniciosesion/iniciosesion.html") ||
    path.endsWith("/register/register.html")
  ) {
    if (isAuthenticated()) {
      location.href = "/Home/homepage.html";
    }
    return;
  }
  if (!isAuthenticated()) {
    location.href = "/InicioSesion/iniciosesion.html";
  }
}

function loadHeaderNav() {
  const placeholder = document.getElementById("header-placeholder");
  if (!placeholder) return;

  const tryPath = (p) =>
    fetch(p).then((res) => {
      if (!res.ok) throw new Error("not ok");
      return res.text();
    });

  tryPath("/shared/header.html")
    .catch(() => tryPath("../shared/header.html"))
    .then((html) => {
      placeholder.innerHTML = html;
      updateHeaderTitle();
      setActiveNav();
      setupUserMenu();
    })
    .catch((err) => console.error("Failed to load header partial", err));
}

function updateHeaderTitle() {
  const h1 = document.querySelector("header h1");
  if (h1) {
    h1.textContent = document.title;
  }
  const userSpan = document.getElementById("header-user");
  if (userSpan) {
    const user = localStorage.getItem("currentUser");
    userSpan.textContent = user ? `| ${user}` : "";
  }
}

function setActiveNav() {
  const links = document.querySelectorAll(".nav-list a");
  links.forEach((link) => {
    if (link.pathname === location.pathname) {
      link.parentElement.classList.add("active");
    }
  });
}

function setupUserMenu() {
  const btn = document.getElementById("user-icon-btn");
  const dropdown = document.getElementById("user-dropdown");
  if (!btn || !dropdown) return;

  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    dropdown.classList.toggle("show");
  });

  document.addEventListener("click", (e) => {
    if (!btn.contains(e.target) && !dropdown.contains(e.target)) {
      dropdown.classList.remove("show");
    }
  });

  const clearAndRedirect = (e) => {
    e.preventDefault();
    clearAuth();
    location.href = "/InicioSesion/iniciosesion.html";
  };
  const sidebarLogout = document.querySelector(".sidebar-logout");
  if (sidebarLogout) sidebarLogout.addEventListener("click", clearAndRedirect);
  const dropdownLogout = document.querySelector(".dropdown-logout");
  if (dropdownLogout)
    dropdownLogout.addEventListener("click", clearAndRedirect);
}

function saveUsers(users) {
  localStorage.setItem("users", JSON.stringify(users));
}

document.addEventListener("DOMContentLoaded", () => {
  verifyAuth();

  loadHeaderNav();

  const registerForm = document.getElementById("registerForm");
  const loginForm = document.getElementById("loginForm");

  if (registerForm) {
    registerForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const username = document.getElementById("username").value.trim();
      const password = document.getElementById("password").value;
      const confirm = document.getElementById("confirm-password").value;

      if (!username || !password) {
        alert("Please enter a username and password");
        return;
      }

      if (password !== confirm) {
        alert("Passwords do not match");
        return;
      }

      const users = loadUsers();
      if (users.find((u) => u.username === username)) {
        alert("Username already exists");
        return;
      }

      users.push({ username, password });
      saveUsers(users);
      console.log("New user registered:", username, users);
      setAuth(username);
      alert("Registration successful. Redirecting to dashboard.");
      window.location.href = "/Home/homepage.html";
    });
  }

  if (loginForm) {
    loginForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const username = document.getElementById("username").value.trim();
      const password = document.getElementById("password").value;

      if (!username || !password) {
        alert("Please enter your username and password");
        return;
      }

      const users = loadUsers();
      const user = users.find((u) => u.username === username);
      if (!user) {
        alert("User not found");
        return;
      }
      if (user.password !== password) {
        alert("Invalid password");
        return;
      }

      setAuth(username);
      alert("Login successful");
      window.location.href = "/Home/homepage.html";
    });
  }
});

async function fetchPokemon(limit = 20) {
  try {
    const response = await fetch(`https://pokeapi.co/api/v2/pokemon?limit=${limit}`);
    const data = await response.json();
    
    // Fetch detailed data for each Pokémon
    const pokemonList = await Promise.all(
      data.results.map(async (pokemon) => {
        const detailResponse = await fetch(pokemon.url);
        const detailData = await detailResponse.json();
        return {
          id: detailData.id,
          name: detailData.name,
          image: detailData.sprites.other['official-artwork'].front_default || detailData.sprites.front_default,
          stats: detailData.stats,
          types: detailData.types
        };
      })
    );
    
    return pokemonList;
  } catch (error) {
    console.error(error.message);
    return [];
  }
}
