let studentsCache = [];
let currentPage = 1;

function resetStudentForm() {
  document.querySelector("#studentForm").reset();
  document.querySelector("#studentId").value = "";
}

async function loadStudents() {
  studentsCache = await DB.getAll("students");
  renderStudents();
}

function applyFilters() {
  const search = document.querySelector("#searchStudent").value.trim();
  const status = document.querySelector("#filterStatus").value;
  const level = document.querySelector("#filterLevel").value;
  return studentsCache.filter((student) => {
    const matchesSearch = student.name.includes(search);
    const matchesStatus = status ? student.status === status : true;
    const matchesLevel = level ? student.level === level : true;
    return matchesSearch && matchesStatus && matchesLevel;
  });
}

function renderStudents() {
  const filtered = applyFilters();
  const { items, totalPages, currentPage: page } = paginate(filtered, currentPage, 8);
  currentPage = page;
  const tbody = document.querySelector("#studentsTable tbody");
  tbody.innerHTML = "";
  items.forEach((student) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${student.name}</td>
      <td>${student.level}</td>
      <td><span class="badge ${student.status === "نشط" ? "active" : student.status === "مجمّد" ? "frozen" : "expelled"}">${student.status}</span></td>
      <td>${student.statusReason || "-"}</td>
      <td>
        <button class="btn btn-outline" data-action="edit" data-id="${student.id}">تعديل</button>
        <button class="btn btn-danger" data-action="delete" data-id="${student.id}">حذف</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  renderPagination(document.querySelector("#studentsPagination"), currentPage, totalPages, (newPage) => {
    currentPage = newPage;
    renderStudents();
  });
}

async function handleStudentSubmit(event) {
  event.preventDefault();
  const id = document.querySelector("#studentId").value;
  const name = document.querySelector("#studentName").value.trim();
  const level = document.querySelector("#studentLevel").value.trim();
  const status = document.querySelector("#studentStatus").value;
  const statusReason = document.querySelector("#studentStatusReason").value.trim();
  if (!name || !level) {
    showToast("يرجى تعبئة الحقول المطلوبة", "error");
    return;
  }
  const payload = { name, level, status, statusReason };
  if (id) {
    await DB.update("students", Number(id), payload);
    showToast("تم تحديث بيانات الطالب");
  } else {
    await DB.add("students", payload);
    showToast("تم إضافة الطالب");
  }
  resetStudentForm();
  await loadStudents();
}

async function handleStudentTableClick(event) {
  const button = event.target.closest("button");
  if (!button) return;
  const id = Number(button.dataset.id);
  if (button.dataset.action === "edit") {
    const student = studentsCache.find((item) => item.id === id);
    if (!student) return;
    document.querySelector("#studentId").value = student.id;
    document.querySelector("#studentName").value = student.name;
    document.querySelector("#studentLevel").value = student.level;
    document.querySelector("#studentStatus").value = student.status;
    document.querySelector("#studentStatusReason").value = student.statusReason || "";
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  if (button.dataset.action === "delete") {
    const confirmed = await confirmModal("هل أنت متأكد من حذف الطالب؟");
    if (!confirmed) return;
    await DB.delete("students", id);
    showToast("تم حذف الطالب", "success");
    await loadStudents();
  }
}

async function promoteStudents() {
  const level = document.querySelector("#promoteLevel").value.trim();
  if (!level) {
    showToast("يرجى إدخال المستوى الجديد", "error");
    return;
  }
  for (const student of studentsCache) {
    await DB.update("students", student.id, { level });
  }
  showToast("تم ترفيع جميع الطلاب", "success");
  await loadStudents();
}

document.addEventListener("DOMContentLoaded", async () => {
  await loadStudents();
  document.querySelector("#studentForm").addEventListener("submit", handleStudentSubmit);
  document.querySelector("#studentsTable").addEventListener("click", handleStudentTableClick);
  document.querySelector("#searchStudent").addEventListener("input", () => {
    currentPage = 1;
    renderStudents();
  });
  document.querySelector("#filterStatus").addEventListener("change", () => {
    currentPage = 1;
    renderStudents();
  });
  document.querySelector("#filterLevel").addEventListener("input", () => {
    currentPage = 1;
    renderStudents();
  });
  document.querySelector("#promoteBtn").addEventListener("click", promoteStudents);
});
