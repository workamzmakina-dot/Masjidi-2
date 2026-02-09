async function handleLogin(event) {
  event.preventDefault();
  const username = document.querySelector("#username").value.trim();
  const password = document.querySelector("#password").value.trim();
  if (!username || !password) {
    showToast("يرجى تعبئة جميع الحقول", "error");
    return;
  }
  const users = await DB.getAll("users");
  const user = users.find((item) => item.username === username && item.password === password);
  if (!user) {
    showToast("بيانات الدخول غير صحيحة", "error");
    return;
  }
  sessionStorage.setItem("user", JSON.stringify(user));
  window.location.href = "dashboard.html";
}

async function initLoginPage() {
  await DB.init();
  await applySettings();
  const form = document.querySelector("#loginForm");
  form.addEventListener("submit", handleLogin);
}

if (document.querySelector("#loginForm")) {
  document.addEventListener("DOMContentLoaded", initLoginPage);
}
