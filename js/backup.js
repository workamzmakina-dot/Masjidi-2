async function downloadBackup() {
  const data = await DB.exportData();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `backup-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
  showToast("تم تنزيل النسخة الاحتياطية");
}

async function restoreBackup(event) {
  const file = event.target.files[0];
  if (!file) return;
  const confirmed = await confirmModal("سيتم استبدال جميع البيانات الحالية. هل تريد المتابعة؟");
  if (!confirmed) return;
  const reader = new FileReader();
  reader.onload = async () => {
    try {
      const data = JSON.parse(reader.result);
      await DB.importData(data);
      showToast("تمت الاستعادة بنجاح");
    } catch (error) {
      showToast("ملف غير صالح", "error");
    }
  };
  reader.readAsText(file);
}

async function resetSystem() {
  const confirmed = await confirmModal("سيتم مسح جميع البيانات وإعادة التهيئة. هل أنت متأكد؟");
  if (!confirmed) return;
  await DB.reset();
  showToast("تمت إعادة التهيئة");
  window.location.reload();
}

document.addEventListener("DOMContentLoaded", () => {
  document.querySelector("#downloadBackup").addEventListener("click", downloadBackup);
  document.querySelector("#restoreInput").addEventListener("change", restoreBackup);
  document.querySelector("#resetSystem").addEventListener("click", resetSystem);
});
