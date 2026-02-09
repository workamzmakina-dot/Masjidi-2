let programsCache = [];
let studentsCache = [];
let enrollmentsCache = [];
let attendanceCache = [];
let settingsCache = null;

async function loadAttendanceData() {
  programsCache = await DB.getAll("programs");
  studentsCache = await DB.getAll("students");
  enrollmentsCache = await DB.getAll("enrollments");
  attendanceCache = await DB.getAll("attendance");
  settingsCache = (await DB.getAll("settings"))[0];
  renderProgramOptions();
  renderAttendanceTable();
}

function renderProgramOptions() {
  const select = document.querySelector("#attendanceProgram");
  select.innerHTML = programsCache.map((program) => `<option value="${program.id}">${program.name}</option>`).join("");
}

function renderAttendanceTable() {
  const programId = Number(document.querySelector("#attendanceProgram").value);
  const date = document.querySelector("#attendanceDate").value;
  const enrollmentStudents = enrollmentsCache
    .filter((item) => item.programId === programId)
    .map((item) => studentsCache.find((student) => student.id === item.studentId))
    .filter(Boolean);

  const existing = attendanceCache.find((item) => item.programId === programId && item.date === date);
  const tbody = document.querySelector("#attendanceTable tbody");
  tbody.innerHTML = "";
  enrollmentStudents.forEach((student) => {
    const record = existing ? existing.records.find((r) => r.studentId === student.id) : null;
    const status = record?.status || "حاضر";
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${student.name}</td>
      <td>${student.level}</td>
      <td>
        <select data-student-id="${student.id}">
          <option value="حاضر" ${status === "حاضر" ? "selected" : ""}>حاضر</option>
          <option value="غائب" ${status === "غائب" ? "selected" : ""}>غائب</option>
        </select>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

async function saveAttendance() {
  const programId = Number(document.querySelector("#attendanceProgram").value);
  const date = document.querySelector("#attendanceDate").value;
  if (!date) {
    showToast("يرجى اختيار التاريخ", "error");
    return;
  }
  const records = Array.from(document.querySelectorAll("#attendanceTable select")).map((select) => ({
    studentId: Number(select.dataset.studentId),
    status: select.value,
  }));
  const existing = attendanceCache.find((item) => item.programId === programId && item.date === date);
  if (existing) {
    await DB.update("attendance", existing.id, { records });
  } else {
    await DB.add("attendance", { programId, date, records });
  }
  await generateWarnings(records);
  showToast("تم حفظ الحضور");
  await loadAttendanceData();
}

async function generateWarnings(records) {
  const warningThresholds = settingsCache?.warningThresholds || [3, 5, 7];
  const warnings = await DB.getAll("warnings");
  for (const record of records.filter((item) => item.status === "غائب")) {
    const totalAbsences = attendanceCache
      .flatMap((item) => item.records)
      .filter((item) => item.studentId === record.studentId && item.status === "غائب").length + 1;
    const thresholdHit = warningThresholds.find((threshold) => threshold === totalAbsences);
    if (thresholdHit) {
      const alreadyExists = warnings.some((warning) => warning.studentId === record.studentId && warning.count === thresholdHit);
      if (!alreadyExists) {
        await DB.add("warnings", {
          studentId: record.studentId,
          count: thresholdHit,
          date: new Date().toISOString().slice(0, 10),
          message: `إنذار غياب رقم ${thresholdHit}`,
        });
      }
    }
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  document.querySelector("#attendanceDate").value = new Date().toISOString().slice(0, 10);
  await loadAttendanceData();
  document.querySelector("#attendanceProgram").addEventListener("change", renderAttendanceTable);
  document.querySelector("#attendanceDate").addEventListener("change", renderAttendanceTable);
  document.querySelector("#saveAttendance").addEventListener("click", saveAttendance);
});
