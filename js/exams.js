let programsCache = [];
let studentsCache = [];
let enrollmentsCache = [];
let examsCache = [];
let gradesCache = [];

async function loadExamsData() {
  programsCache = await DB.getAll("programs");
  studentsCache = await DB.getAll("students");
  enrollmentsCache = await DB.getAll("enrollments");
  examsCache = await DB.getAll("exams");
  gradesCache = await DB.getAll("grades");
  renderExamOptions();
  renderExamTable();
}

function renderExamOptions() {
  document.querySelector("#examProgram").innerHTML = programsCache
    .map((program) => `<option value="${program.id}">${program.name}</option>`)
    .join("");
  document.querySelector("#gradeExamSelect").innerHTML = examsCache
    .map((exam) => `<option value="${exam.id}">${exam.name}</option>`)
    .join("");
  renderGradesTable();
}

function renderExamTable() {
  const tbody = document.querySelector("#examsTable tbody");
  tbody.innerHTML = "";
  examsCache.forEach((exam) => {
    const program = programsCache.find((item) => item.id === exam.programId);
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${exam.name}</td>
      <td>${program?.name || "-"}</td>
      <td>${exam.date}</td>
      <td>${exam.maxScore}</td>
      <td>
        <button class="btn btn-outline" data-action="edit" data-id="${exam.id}">تعديل</button>
        <button class="btn btn-danger" data-action="delete" data-id="${exam.id}">حذف</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function renderGradesTable() {
  const examId = Number(document.querySelector("#gradeExamSelect").value);
  const exam = examsCache.find((item) => item.id === examId);
  const tbody = document.querySelector("#gradesTable tbody");
  tbody.innerHTML = "";
  if (!exam) return;
  const enrolledStudents = enrollmentsCache
    .filter((item) => item.programId === exam.programId)
    .map((item) => studentsCache.find((student) => student.id === item.studentId))
    .filter(Boolean);

  enrolledStudents.forEach((student) => {
    const grade = gradesCache.find((item) => item.examId === examId && item.studentId === student.id);
    const score = grade?.score ?? "";
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${student.name}</td>
      <td>${student.level}</td>
      <td>
        <input type="number" min="0" max="${exam.maxScore}" value="${score}" data-student-id="${student.id}">
      </td>
    `;
    tbody.appendChild(tr);
  });
}

async function handleExamSubmit(event) {
  event.preventDefault();
  const id = document.querySelector("#examId").value;
  const name = document.querySelector("#examName").value.trim();
  const programId = Number(document.querySelector("#examProgram").value);
  const date = document.querySelector("#examDate").value;
  const maxScore = Number(document.querySelector("#examMaxScore").value);
  if (!name || !date || !maxScore) {
    showToast("يرجى تعبئة الحقول المطلوبة", "error");
    return;
  }
  const payload = { name, programId, date, maxScore };
  if (id) {
    await DB.update("exams", Number(id), payload);
    showToast("تم تحديث الامتحان");
  } else {
    await DB.add("exams", payload);
    showToast("تم إضافة الامتحان");
  }
  document.querySelector("#examForm").reset();
  document.querySelector("#examId").value = "";
  await loadExamsData();
}

async function handleExamTableClick(event) {
  const button = event.target.closest("button");
  if (!button) return;
  const id = Number(button.dataset.id);
  if (button.dataset.action === "edit") {
    const exam = examsCache.find((item) => item.id === id);
    if (!exam) return;
    document.querySelector("#examId").value = exam.id;
    document.querySelector("#examName").value = exam.name;
    document.querySelector("#examProgram").value = exam.programId;
    document.querySelector("#examDate").value = exam.date;
    document.querySelector("#examMaxScore").value = exam.maxScore;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  if (button.dataset.action === "delete") {
    const confirmed = await confirmModal("هل تريد حذف الامتحان؟");
    if (!confirmed) return;
    await DB.delete("exams", id);
    const related = gradesCache.filter((item) => item.examId === id);
    for (const grade of related) {
      await DB.delete("grades", grade.id);
    }
    showToast("تم حذف الامتحان");
    await loadExamsData();
  }
}

async function saveGrades() {
  const examId = Number(document.querySelector("#gradeExamSelect").value);
  const exam = examsCache.find((item) => item.id === examId);
  if (!exam) return;
  const inputs = Array.from(document.querySelectorAll("#gradesTable input"));
  for (const input of inputs) {
    const score = Number(input.value);
    if (Number.isNaN(score) || score < 0) continue;
    const studentId = Number(input.dataset.studentId);
    const existing = gradesCache.find((item) => item.examId === examId && item.studentId === studentId);
    if (existing) {
      await DB.update("grades", existing.id, { score });
    } else {
      await DB.add("grades", { examId, studentId, score });
    }
  }
  showToast("تم حفظ الدرجات");
  await loadExamsData();
}

document.addEventListener("DOMContentLoaded", async () => {
  await loadExamsData();
  document.querySelector("#examForm").addEventListener("submit", handleExamSubmit);
  document.querySelector("#examsTable").addEventListener("click", handleExamTableClick);
  document.querySelector("#gradeExamSelect").addEventListener("change", renderGradesTable);
  document.querySelector("#saveGrades").addEventListener("click", saveGrades);
});
