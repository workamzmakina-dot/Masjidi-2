async function loadDashboard() {
  const students = await DB.getAll("students");
  const programs = await DB.getAll("programs");
  const exams = await DB.getAll("exams");
  const attendance = await DB.getAll("attendance");
  const grades = await DB.getAll("grades");

  document.querySelector("#studentsCount").textContent = students.length;
  document.querySelector("#programsCount").textContent = programs.length;
  document.querySelector("#examsCount").textContent = exams.length;
  document.querySelector("#attendanceCount").textContent = attendance.length;

  const monthlyTop = calculateMonthlyTop(students, attendance, grades);
  document.querySelector("#topStudentName").textContent = monthlyTop.name || "لا يوجد بيانات";
  document.querySelector("#topStudentScore").textContent = monthlyTop.score ? `${monthlyTop.score}%` : "-";
}

function calculateMonthlyTop(students, attendance, grades) {
  const monthKey = new Date().toISOString().slice(0, 7);
  const attendanceMap = new Map();
  attendance
    .filter((item) => item.date.startsWith(monthKey))
    .forEach((item) => {
      item.records.forEach((record) => {
        const current = attendanceMap.get(record.studentId) || { present: 0, total: 0 };
        current.total += 1;
        if (record.status === "حاضر") current.present += 1;
        attendanceMap.set(record.studentId, current);
      });
    });

  const gradesMap = new Map();
  grades.forEach((grade) => {
    const current = gradesMap.get(grade.studentId) || [];
    current.push(grade.score);
    gradesMap.set(grade.studentId, current);
  });

  let best = { name: "", score: 0 };
  students.forEach((student) => {
    const attendanceInfo = attendanceMap.get(student.id) || { present: 0, total: 0 };
    const attendanceRate = attendanceInfo.total ? (attendanceInfo.present / attendanceInfo.total) * 100 : 0;
    const studentGrades = gradesMap.get(student.id) || [];
    const averageGrade = studentGrades.length
      ? studentGrades.reduce((a, b) => a + b, 0) / studentGrades.length
      : 0;
    const finalScore = (attendanceRate * 0.4) + (averageGrade * 0.6);
    if (finalScore > best.score) {
      best = { name: student.name, score: finalScore.toFixed(1) };
    }
  });
  return best;
}

document.addEventListener("DOMContentLoaded", loadDashboard);
