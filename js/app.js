const APP_NAME = "نظام إدارة الحلقات والمعهد الشرعي";

function $(selector) {
  return document.querySelector(selector);
}

function $all(selector) {
  return Array.from(document.querySelectorAll(selector));
}

function showToast(message, type = "success") {
  let container = document.querySelector(".toast-container");
  if (!container) {
    container = document.createElement("div");
    container.className = "toast-container";
    document.body.appendChild(container);
  }
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

function confirmModal(message) {
  return new Promise((resolve) => {
    const backdrop = document.createElement("div");
    backdrop.className = "modal-backdrop";
    const modal = document.createElement("div");
    modal.className = "modal";
    modal.innerHTML = `
      <p>${message}</p>
      <div style="display:flex; gap:8px; margin-top:16px; justify-content:flex-start;">
        <button class="btn btn-primary" data-action="confirm">تأكيد</button>
        <button class="btn btn-outline" data-action="cancel">إلغاء</button>
      </div>
    `;
    backdrop.appendChild(modal);
    document.body.appendChild(backdrop);

    backdrop.addEventListener("click", (event) => {
      if (event.target.dataset.action === "confirm") {
        backdrop.remove();
        resolve(true);
      }
      if (event.target.dataset.action === "cancel" || event.target === backdrop) {
        backdrop.remove();
        resolve(false);
      }
    });
  });
}

async function applySettings() {
  const settings = (await DB.getAll("settings"))[0];
  if (!settings) return;
  document.documentElement.style.setProperty("--primary", settings.primaryColor || "#0ea5e9");
  document.documentElement.style.setProperty("--primary-dark", settings.primaryColor || "#0284c7");
  $all(".js-institute-name").forEach((el) => {
    el.textContent = settings.instituteName || APP_NAME;
  });
  $all(".js-institute-logo").forEach((el) => {
    if (settings.logoData) {
      el.src = settings.logoData;
    } else {
      el.src = "";
    }
  });
}

function setActiveNav() {
  const path = window.location.pathname.split("/").pop();
  $all(".sidebar nav a").forEach((link) => {
    if (link.getAttribute("href") === path) {
      link.classList.add("active");
    }
  });
}

function guardAuth() {
  const isLoginPage = window.location.pathname.endsWith("index.html") || window.location.pathname === "/";
  const user = sessionStorage.getItem("user");
  if (!isLoginPage && !user) {
    window.location.href = "index.html";
  }
}

function initLogout() {
  const logoutBtn = document.querySelector("[data-action='logout']");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      sessionStorage.removeItem("user");
      window.location.href = "index.html";
    });
  }
}

function formatDate(value) {
  if (!value) return "";
  return new Date(value).toLocaleDateString("ar-SA");
}

function calculateGrade(score, maxScore) {
  const percentage = maxScore ? (score / maxScore) * 100 : 0;
  let label = "راسب";
  if (percentage >= 90) label = "ممتاز";
  else if (percentage >= 80) label = "جيد جدًا";
  else if (percentage >= 70) label = "جيد";
  else if (percentage >= 60) label = "مقبول";
  return { percentage: percentage.toFixed(1), label };
}

function paginate(list, page = 1, pageSize = 10) {
  const total = list.length;
  const totalPages = Math.ceil(total / pageSize) || 1;
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * pageSize;
  return {
    items: list.slice(start, start + pageSize),
    totalPages,
    currentPage,
  };
}

function renderPagination(container, currentPage, totalPages, onChange) {
  container.innerHTML = "";
  const prev = document.createElement("button");
  prev.textContent = "السابق";
  prev.disabled = currentPage === 1;
  prev.addEventListener("click", () => onChange(currentPage - 1));
  const next = document.createElement("button");
  next.textContent = "التالي";
  next.disabled = currentPage === totalPages;
  next.addEventListener("click", () => onChange(currentPage + 1));
  const info = document.createElement("span");
  info.className = "note";
  info.textContent = `صفحة ${currentPage} من ${totalPages}`;
  container.append(prev, info, next);
}

document.addEventListener("DOMContentLoaded", async () => {
  await DB.init();
  guardAuth();
  await applySettings();
  setActiveNav();
  initLogout();
});
