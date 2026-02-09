let studentsCache = [];
let attendanceCache = [];
let warningsCache = [];
let gradesCache = [];
let examsCache = [];
let programsCache = [];

async function loadReportsData() {
  studentsCache = await DB.getAll("students");
  attendanceCache = await DB.getAll("attendance");
  warningsCache = await DB.getAll("warnings");
  gradesCache = await DB.getAll("grades");
  examsCache = await DB.getAll("exams");
  programsCache = await DB.getAll("programs");
  renderStudentOptions();
  renderReport();
}

function renderStudentOptions() {
  const select = document.querySelector("#reportStudent");
  select.innerHTML = studentsCache.map((student) => `<option value="${student.id}">${student.name}</option>`).join("");
}

function renderReport() {
  const studentId = Number(document.querySelector("#reportStudent").value);
  const student = studentsCache.find((item) => item.id === studentId);
  if (!student) return;
  const records = attendanceCache.flatMap((item) => item.records.map((record) => ({ ...record, date: item.date })));
  const studentRecords = records.filter((record) => record.studentId === studentId);
  const present = studentRecords.filter((record) => record.status === "حاضر").length;
  const absent = studentRecords.filter((record) => record.status === "غائب").length;
  const attendanceRate = studentRecords.length ? ((present / studentRecords.length) * 100).toFixed(1) : "0";

  const warnings = warningsCache.filter((warning) => warning.studentId === studentId);

  const studentGrades = gradesCache.filter((grade) => grade.studentId === studentId).map((grade) => {
    const exam = examsCache.find((item) => item.id === grade.examId);
    const program = programsCache.find((item) => item.id === exam?.programId);
    const gradeInfo = calculateGrade(grade.score, exam?.maxScore || 100);
    return {
      examName: exam?.name || "-",
      programName: program?.name || "-",
      score: grade.score,
      percentage: gradeInfo.percentage,
      label: gradeInfo.label,
    };
  });

  document.querySelector("#reportStudentName").textContent = student.name;
  document.querySelector("#reportStudentLevel").textContent = student.level;
  document.querySelector("#reportStudentStatus").textContent = student.status;
  document.querySelector("#reportAttendanceSummary").textContent = `حضور ${present} / غياب ${absent} (نسبة ${attendanceRate}%)`;
  document.querySelector("#reportWarnings").innerHTML = warnings.length
    ? warnings.map((warning) => `<li>${warning.message} - ${warning.date}</li>`).join("")
    : "لا توجد إنذارات";

  const gradesTbody = document.querySelector("#reportGrades tbody");
  gradesTbody.innerHTML = "";
  studentGrades.forEach((grade) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${grade.examName}</td>
      <td>${grade.programName}</td>
      <td>${grade.score}</td>
      <td>${grade.percentage}%</td>
      <td>${grade.label}</td>
    `;
    gradesTbody.appendChild(tr);
  });

  renderGradeChart(studentGrades.map((grade) => Number(grade.percentage)));

  const avgScore = studentGrades.length
    ? (studentGrades.reduce((total, item) => total + Number(item.percentage), 0) / studentGrades.length).toFixed(1)
    : "0";

  document.querySelector("#reportAverage").textContent = `${avgScore}%`;

  const message = `تقرير الطالب: ${student.name}\nالحضور: ${present} حضور و ${absent} غياب (نسبة ${attendanceRate}%)\nمتوسط الدرجات: ${avgScore}%\nآخر ملاحظات: ${student.statusReason || "لا يوجد"}`;
  document.querySelector("#whatsappLink").href = `https://wa.me/?text=${encodeURIComponent(message)}`;
}

function renderGradeChart(values) {
  const canvas = document.querySelector("#gradesChart");
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const max = 100;
  const barWidth = values.length ? canvas.width / values.length : canvas.width;
  values.forEach((value, idx) => {
    const height = (value / max) * (canvas.height - 20);
    const x = idx * barWidth + 10;
    const y = canvas.height - height - 10;
    ctx.fillStyle = "#0ea5e9";
    ctx.fillRect(x, y, barWidth - 20, height);
    ctx.fillStyle = "#1f2937";
    ctx.fillText(`${value}%`, x, y - 4);
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  await loadReportsData();
  document.querySelector("#reportStudent").addEventListener("change", renderReport);
  document.querySelector("#printReport").addEventListener("click", () => window.print());
});
