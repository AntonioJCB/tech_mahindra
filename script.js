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

function saveUsers(users) {
  localStorage.setItem("users", JSON.stringify(users));
}

document.addEventListener("DOMContentLoaded", () => {
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
      alert("Registration successful. Redirecting to login.");
      window.location.href = "/InicioSesion/iniciosesion.html";
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

      alert("Login successful");
      window.location.href = "/Home/homepage.html";
    });
  }
});
