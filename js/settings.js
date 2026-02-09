let settingsCache = null;
let userCache = null;

async function loadSettings() {
  settingsCache = (await DB.getAll("settings"))[0];
  const users = await DB.getAll("users");
  userCache = users[0];
  if (!settingsCache) return;
  document.querySelector("#instituteName").value = settingsCache.instituteName || "";
  document.querySelector("#primaryColor").value = settingsCache.primaryColor || "#0ea5e9";
  document.querySelector("#academicYear").value = settingsCache.academicYear || "";
  document.querySelector("#warningThresholds").value = (settingsCache.warningThresholds || [3, 5, 7]).join(",");
  if (userCache) {
    document.querySelector("#adminUsername").value = userCache.username;
    document.querySelector("#adminPassword").value = userCache.password;
  }
}

async function saveSettings(event) {
  event.preventDefault();
  const instituteName = document.querySelector("#instituteName").value.trim();
  const primaryColor = document.querySelector("#primaryColor").value;
  const academicYear = document.querySelector("#academicYear").value.trim();
  const warningThresholds = document
    .querySelector("#warningThresholds")
    .value.split(",")
    .map((value) => Number(value.trim()))
    .filter((value) => !Number.isNaN(value));

  if (!instituteName || !academicYear) {
    showToast("يرجى تعبئة الحقول المطلوبة", "error");
    return;
  }
  await DB.put("settings", {
    ...settingsCache,
    instituteName,
    primaryColor,
    academicYear,
    warningThresholds: warningThresholds.length ? warningThresholds : [3, 5, 7],
  });

  const username = document.querySelector("#adminUsername").value.trim();
  const password = document.querySelector("#adminPassword").value.trim();
  if (userCache && username && password) {
    await DB.update("users", userCache.id, { username, password });
  }

  showToast("تم حفظ الإعدادات");
  await applySettings();
}

async function handleLogoUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async () => {
    await DB.put("settings", {
      ...settingsCache,
      logoData: reader.result,
    });
    settingsCache.logoData = reader.result;
    await applySettings();
    showToast("تم تحديث الشعار");
  };
  reader.readAsDataURL(file);
}

document.addEventListener("DOMContentLoaded", async () => {
  await loadSettings();
  document.querySelector("#settingsForm").addEventListener("submit", saveSettings);
  document.querySelector("#logoUpload").addEventListener("change", handleLogoUpload);
});
