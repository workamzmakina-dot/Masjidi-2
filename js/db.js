const DB_NAME='masjidiDB';const DB_VERSION=1;const STORES=['settings','users','students','programs','enrollments','attendance','exams','grades','warnings','centers','teachers','employees','salaries','payments','qrLogs','messages','homeworks'];
class DBAdapter{async init(){} async list(){return []} async get(){return null} async insert(){} async update(){} async remove(){} }
class LocalDB extends DBAdapter{constructor(){super();this.db=null;} async init(){if(this.db)return;this.db=await new Promise((res,rej)=>{const r=indexedDB.open(DB_NAME,DB_VERSION);r.onupgradeneeded=e=>{const db=e.target.result;STORES.forEach(s=>{if(!db.objectStoreNames.contains(s))db.createObjectStore(s,{keyPath:'id',autoIncrement:true});});};r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error);});await this.seed();}
 tx(store,mode='readonly'){return this.db.transaction(store,mode).objectStore(store)}
 async list(store){return await new Promise((res,rej)=>{const q=this.tx(store).getAll();q.onsuccess=()=>res(q.result||[]);q.onerror=()=>rej(q.error);});}
 async get(store,id){return await new Promise((res,rej)=>{const q=this.tx(store).get(id);q.onsuccess=()=>res(q.result);q.onerror=()=>rej(q.error);});}
 async insert(store,data){return await new Promise((res,rej)=>{const q=this.tx(store,'readwrite').add(data);q.onsuccess=()=>res(q.result);q.onerror=()=>rej(q.error);});}
 async update(store,data){return await new Promise((res,rej)=>{const q=this.tx(store,'readwrite').put(data);q.onsuccess=()=>res(q.result);q.onerror=()=>rej(q.error);});}
 async remove(store,id){return await new Promise((res,rej)=>{const q=this.tx(store,'readwrite').delete(id);q.onsuccess=()=>res(true);q.onerror=()=>rej(q.error);});}
 async clearAll(){await Promise.all(STORES.map(s=>new Promise((res,rej)=>{const q=this.tx(s,'readwrite').clear();q.onsuccess=()=>res(true);q.onerror=()=>rej(q.error);})));}
 async exportAll(){const out={};for(const s of STORES)out[s]=await this.list(s);return out;}
 async importAll(data){await this.clearAll();for(const s of Object.keys(data||{})){for(const row of data[s]) await this.insert(s,row);} }
 async seed(){const users=await this.list('users'); if(users.length) return;
 await this.insert('settings',{id:1,centerName:'مركز النور',primaryColor:'#1d4ed8',schoolYear:'2025-2026',currency:'both',logo:''});
 await this.insert('users',{username:'admin',password:'admin123',role:'center_admin',name:'مدير المركز'});
 await this.insert('users',{username:'superadmin',password:'super123',role:'super_admin',name:'سوبر أدمن'});
 await this.insert('users',{username:'teacher1',password:'teach123',role:'teacher',name:'الأستاذ أحمد'});
 await this.insert('users',{username:'parent1',password:'parent123',role:'parent',name:'ولي أمر'});
 await this.insert('users',{username:'student1',password:'student123',role:'student',name:'طالب'});
 const s1=await this.insert('students',{name:'محمد علي',level:'الأول',status:'نشط',reason:'',guardianPhone:'96170000000'});
 const s2=await this.insert('students',{name:'يوسف عمر',level:'الثاني',status:'مجمّد',reason:'سفر',guardianPhone:'96171111111'});
 const t1=await this.insert('teachers',{name:'أحمد خالد',job:'معلم قرآن',salary:400,currency:'usd',phone:'96172222222'});
 const p1=await this.insert('programs',{name:'حلقة الفجر',type:'حلقة قرآن',teacherId:t1,schedule:'الإثنين-الأربعاء 6:00'});
 await this.insert('enrollments',{studentId:s1,programId:p1});await this.insert('enrollments',{studentId:s2,programId:p1});
 await this.insert('employees',{name:'منى حسن',job:'إدارية',salary:300,currency:'usd',paidMonth:''});
 await this.insert('centers',{name:'مركز النور',adminUser:'admin'});
 }
}
class RemoteAPI extends DBAdapter{ /* TODO: replace LocalDB with PHP+MySQL endpoints */ }
export const db=new LocalDB();
export {LocalDB,RemoteAPI};