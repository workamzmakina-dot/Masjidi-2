const DB_NAME = "masjid-manager";
const DB_VERSION = 1;
const STORE_NAMES = [
  "settings",
  "users",
  "students",
  "programs",
  "enrollments",
  "attendance",
  "exams",
  "grades",
  "warnings",
];

class LocalDB {
  constructor() {
    this.db = null;
  }

  async init() {
    if (this.db) return this.db;
    this.db = await new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains("settings")) {
          db.createObjectStore("settings", { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains("users")) {
          db.createObjectStore("users", { keyPath: "id", autoIncrement: true });
        }
        if (!db.objectStoreNames.contains("students")) {
          const store = db.createObjectStore("students", { keyPath: "id", autoIncrement: true });
          store.createIndex("status", "status", { unique: false });
          store.createIndex("level", "level", { unique: false });
        }
        if (!db.objectStoreNames.contains("programs")) {
          db.createObjectStore("programs", { keyPath: "id", autoIncrement: true });
        }
        if (!db.objectStoreNames.contains("enrollments")) {
          const store = db.createObjectStore("enrollments", { keyPath: "id", autoIncrement: true });
          store.createIndex("programId", "programId", { unique: false });
          store.createIndex("studentId", "studentId", { unique: false });
        }
        if (!db.objectStoreNames.contains("attendance")) {
          const store = db.createObjectStore("attendance", { keyPath: "id", autoIncrement: true });
          store.createIndex("programId", "programId", { unique: false });
          store.createIndex("date", "date", { unique: false });
        }
        if (!db.objectStoreNames.contains("exams")) {
          db.createObjectStore("exams", { keyPath: "id", autoIncrement: true });
        }
        if (!db.objectStoreNames.contains("grades")) {
          const store = db.createObjectStore("grades", { keyPath: "id", autoIncrement: true });
          store.createIndex("examId", "examId", { unique: false });
          store.createIndex("studentId", "studentId", { unique: false });
        }
        if (!db.objectStoreNames.contains("warnings")) {
          const store = db.createObjectStore("warnings", { keyPath: "id", autoIncrement: true });
          store.createIndex("studentId", "studentId", { unique: false });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    await this.seed();
    return this.db;
  }

  async seed() {
    const settings = await this.getAll("settings");
    if (settings.length > 0) return;

    await this.put("settings", {
      id: 1,
      instituteName: "نظام إدارة الحلقات والمعهد الشرعي",
      logoData: "",
      primaryColor: "#0ea5e9",
      academicYear: "2024-2025",
      warningThresholds: [3, 5, 7],
    });

    await this.add("users", {
      username: "admin",
      password: "admin123",
      displayName: "مدير النظام",
    });

    const studentsSeed = [
      { name: "عبدالله علي", level: "الأول", status: "نشط", statusReason: "" },
      { name: "فاطمة حسن", level: "الثاني", status: "نشط", statusReason: "" },
      { name: "محمد يوسف", level: "الثالث", status: "مجمّد", statusReason: "انقطاع مؤقت" },
      { name: "أمل خالد", level: "الثاني", status: "نشط", statusReason: "" },
      { name: "سلمان عمر", level: "الرابع", status: "مطرود", statusReason: "غياب مستمر" },
    ];

    const studentIds = [];
    for (const student of studentsSeed) {
      studentIds.push(await this.add("students", student));
    }

    const programId = await this.add("programs", {
      name: "حلقة الفجر",
      type: "حلقة قرآن",
      teacher: "الشيخ يوسف",
      schedule: "الأحد - الخميس | 5:30 ص",
    });

    const programId2 = await this.add("programs", {
      name: "دورة الفقه للكبار",
      type: "دورة شرعية للكبار",
      teacher: "الشيخة مريم",
      schedule: "الثلاثاء | 7:00 م",
    });

    for (const studentId of studentIds.slice(0, 4)) {
      await this.add("enrollments", { studentId, programId });
    }
    await this.add("enrollments", { studentId: studentIds[1], programId: programId2 });

    await this.add("attendance", {
      programId,
      date: new Date().toISOString().slice(0, 10),
      records: studentIds.slice(0, 4).map((id, idx) => ({ studentId: id, status: idx % 2 ? "حاضر" : "غائب" })),
    });

    const examId = await this.add("exams", {
      programId,
      name: "اختبار منتصف الفصل",
      date: new Date().toISOString().slice(0, 10),
      maxScore: 100,
    });

    for (const studentId of studentIds.slice(0, 4)) {
      await this.add("grades", {
        examId,
        studentId,
        score: 70 + Math.floor(Math.random() * 30),
      });
    }
  }

  async getAll(storeName) {
    await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(storeName, "readonly");
      const store = tx.objectStore(storeName);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getById(storeName, id) {
    await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(storeName, "readonly");
      const store = tx.objectStore(storeName);
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async add(storeName, value) {
    await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(storeName, "readwrite");
      const store = tx.objectStore(storeName);
      const request = store.add(value);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async put(storeName, value) {
    await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(storeName, "readwrite");
      const store = tx.objectStore(storeName);
      const request = store.put(value);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async update(storeName, id, updates) {
    const current = await this.getById(storeName, id);
    if (!current) return null;
    return this.put(storeName, { ...current, ...updates });
  }

  async delete(storeName, id) {
    await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(storeName, "readwrite");
      const store = tx.objectStore(storeName);
      const request = store.delete(id);
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  }

  async clearStore(storeName) {
    await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(storeName, "readwrite");
      const store = tx.objectStore(storeName);
      const request = store.clear();
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  }

  async exportData() {
    const payload = {};
    for (const storeName of STORE_NAMES) {
      payload[storeName] = await this.getAll(storeName);
    }
    return payload;
  }

  async importData(payload) {
    for (const storeName of STORE_NAMES) {
      await this.clearStore(storeName);
      if (Array.isArray(payload[storeName])) {
        for (const item of payload[storeName]) {
          await this.put(storeName, item);
        }
      }
    }
  }

  async reset() {
    await this.init();
    this.db.close();
    await new Promise((resolve, reject) => {
      const request = indexedDB.deleteDatabase(DB_NAME);
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
    this.db = null;
    await this.init();
  }
}

class RemoteAPI {
  // TODO: Implement API-based storage integration (PHP/MySQL).
}

const DB = new LocalDB();
