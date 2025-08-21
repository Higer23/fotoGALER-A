document.addEventListener("DOMContentLoaded", () => {
  const passwordInput = document.getElementById("passwordInput");
  const loginBtn = document.getElementById("loginBtn");
  const errorMessage = document.getElementById("errorMessage");

  // Kullanıcının girmesi gereken şifre.
  // Bu şifreyi istediğiniz gibi değiştirebilirsiniz.
  const correctPassword = "Halil.<3.Berra";

  // Giriş işlemini tetikleyen fonksiyon
  function handleLogin() {
    const enteredPassword = passwordInput.value;
    if (enteredPassword === correctPassword) {
      // Şifre doğruysa, galeri sayfasına yönlendir.
      window.location.href = "gallery.html";
    } else {
      // Şifre yanlışsa hata mesajını göster.
      errorMessage.textContent = "Hatalı şifre! Lütfen tekrar deneyin.";
      errorMessage.classList.add("show");
    }
  }

  // Giriş butonuna tıklandığında handleLogin fonksiyonunu çağır
  loginBtn.addEventListener("click", handleLogin);

  // Enter tuşuna basıldığında da login işlemini tetikle
  passwordInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      handleLogin();
    }
  });
});
