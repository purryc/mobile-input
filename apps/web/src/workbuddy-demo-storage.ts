import {
  newDemoState,
  type DemoState,
} from "../../../packages/core/workbuddy-demo-state";
const database = "workbuddy-standalone-demo-v1";
let opened: Promise<IDBDatabase> | undefined;
let ready: IDBDatabase | undefined;
function open() {
  return (opened ??= new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(database, 1);
    request.onupgradeneeded = () => request.result.createObjectStore("state");
    request.onsuccess = () => {
      ready = request.result;
      resolve(request.result);
    };
    request.onerror = () => {
      opened = undefined;
      reject(request.error);
    };
    request.onblocked = () => {
      opened = undefined;
      reject(Error("请关闭其他演示页面后刷新"));
    };
  }));
}
export async function loadDemo(): Promise<DemoState> {
  const db = await open();
  return new Promise((resolve, reject) => {
    const request = db
      .transaction("state", "readonly")
      .objectStore("state")
      .get("current");
    request.onsuccess = () => {
      const value = request.result;
      if (value && value.version !== 1) {
        reject(Error("演示存储版本不兼容"));
        return;
      }
      resolve(value || newDemoState());
    };
    request.onerror = () => reject(request.error);
  });
}
function write(db: IDBDatabase, state: DemoState): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction("state", "readwrite");
    tx.objectStore("state").put(state, "current");
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error || Error("保存已中断"));
  });
}
export function saveDemo(state: DemoState): Promise<void> {
  // Start transactions synchronously once loaded. IndexedDB orders transactions on
  // this store; no JavaScript save queue can be stranded behind a page reload.
  return ready ? write(ready, state) : open().then((db) => write(db, state));
}
