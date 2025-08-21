document.addEventListener("DOMContentLoaded", () => {
  const passwordInput = document.getElementById("passwordInput");
  const loginBtn = document.getElementById("loginBtn");
  const errorMessage = document.getElementById("errorMessage");

  const correctPassword = "Halil.<3.Berra";

  function handleLogin() {
    const enteredPassword = passwordInput.value;
    if (enteredPassword === correctPassword) {
      window.location.href = "gallery.html";
    } else {
      errorMessage.textContent = "Hatalı şifre! Lütfen tekrar deneyin.";
      errorMessage.classList.add("show");
      passwordInput.classList.add("shake");
      setTimeout(() => passwordInput.classList.remove("shake"), 500);
    }
  }

  loginBtn.addEventListener("click", handleLogin);

  passwordInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      handleLogin();
    }
  });
});
