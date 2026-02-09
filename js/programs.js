let programsCache = [];
let studentsCache = [];
let enrollmentsCache = [];

async function loadPrograms() {
  programsCache = await DB.getAll("programs");
  studentsCache = await DB.getAll("students");
  enrollmentsCache = await DB.getAll("enrollments");
  renderPrograms();
  renderEnrollmentOptions();
}

function renderPrograms() {
  const tbody = document.querySelector("#programsTable tbody");
  tbody.innerHTML = "";
  programsCache.forEach((program) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${program.name}</td>
      <td>${program.type}</td>
      <td>${program.teacher}</td>
      <td>${program.schedule}</td>
      <td>
        <button class="btn btn-outline" data-action="edit" data-id="${program.id}">تعديل</button>
        <button class="btn btn-danger" data-action="delete" data-id="${program.id}">حذف</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function renderEnrollmentOptions() {
  const select = document.querySelector("#enrollProgramSelect");
  select.innerHTML = programsCache.map((program) => `<option value="${program.id}">${program.name}</option>`).join("");
  renderStudentCheckboxes();
}

function renderStudentCheckboxes() {
  const programId = Number(document.querySelector("#enrollProgramSelect").value);
  const container = document.querySelector("#studentsCheckboxes");
  container.innerHTML = "";
  studentsCache.forEach((student) => {
    const isEnrolled = enrollmentsCache.some((item) => item.programId === programId && item.studentId === student.id);
    const wrapper = document.createElement("label");
    wrapper.style.display = "flex";
    wrapper.style.alignItems = "center";
    wrapper.style.gap = "8px";
    wrapper.innerHTML = `
      <input type="checkbox" value="${student.id}" ${isEnrolled ? "checked" : ""}>
      <span>${student.name} (${student.level})</span>
    `;
    container.appendChild(wrapper);
  });
}

async function handleProgramSubmit(event) {
  event.preventDefault();
  const id = document.querySelector("#programId").value;
  const name = document.querySelector("#programName").value.trim();
  const type = document.querySelector("#programType").value;
  const teacher = document.querySelector("#programTeacher").value.trim();
  const schedule = document.querySelector("#programSchedule").value.trim();
  if (!name || !teacher || !schedule) {
    showToast("يرجى تعبئة الحقول المطلوبة", "error");
    return;
  }
  const payload = { name, type, teacher, schedule };
  if (id) {
    await DB.update("programs", Number(id), payload);
    showToast("تم تحديث البرنامج");
  } else {
    await DB.add("programs", payload);
    showToast("تم إضافة البرنامج");
  }
  document.querySelector("#programForm").reset();
  document.querySelector("#programId").value = "";
  await loadPrograms();
}

async function handleProgramTableClick(event) {
  const button = event.target.closest("button");
  if (!button) return;
  const id = Number(button.dataset.id);
  if (button.dataset.action === "edit") {
    const program = programsCache.find((item) => item.id === id);
    if (!program) return;
    document.querySelector("#programId").value = program.id;
    document.querySelector("#programName").value = program.name;
    document.querySelector("#programType").value = program.type;
    document.querySelector("#programTeacher").value = program.teacher;
    document.querySelector("#programSchedule").value = program.schedule;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  if (button.dataset.action === "delete") {
    const confirmed = await confirmModal("حذف البرنامج سيزيل كل الإلحاقات المرتبطة. هل تريد المتابعة؟");
    if (!confirmed) return;
    await DB.delete("programs", id);
    const related = enrollmentsCache.filter((item) => item.programId === id);
    for (const item of related) {
      await DB.delete("enrollments", item.id);
    }
    showToast("تم حذف البرنامج", "success");
    await loadPrograms();
  }
}

async function saveEnrollments() {
  const programId = Number(document.querySelector("#enrollProgramSelect").value);
  const selected = Array.from(document.querySelectorAll("#studentsCheckboxes input:checked")).map((input) => Number(input.value));
  const existing = enrollmentsCache.filter((item) => item.programId === programId);
  for (const item of existing) {
    await DB.delete("enrollments", item.id);
  }
  for (const studentId of selected) {
    await DB.add("enrollments", { programId, studentId });
  }
  showToast("تم حفظ الإلحاقات");
  await loadPrograms();
}

document.addEventListener("DOMContentLoaded", async () => {
  await loadPrograms();
  document.querySelector("#programForm").addEventListener("submit", handleProgramSubmit);
  document.querySelector("#programsTable").addEventListener("click", handleProgramTableClick);
  document.querySelector("#enrollProgramSelect").addEventListener("change", renderStudentCheckboxes);
  document.querySelector("#saveEnrollments").addEventListener("click", saveEnrollments);
});
