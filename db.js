// Tiny IndexedDB wrapper shared by the page and the service worker.
const DB_NAME = "claude-approve";
function idb() {
  return new Promise((res, rej) => {
    const r = indexedDB.open(DB_NAME, 1);
    r.onupgradeneeded = () => {
      r.result.createObjectStore("kv");
      r.result.createObjectStore("reqs", { keyPath: "key" });
    };
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
}
function p(r) {
  return new Promise((res, rej) => { r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
}
async function store(name, mode) { return (await idb()).transaction(name, mode || "readonly").objectStore(name); }
async function kvGet(k) { return p((await store("kv")).get(k)); }
async function kvSet(k, v) { return p((await store("kv", "readwrite")).put(v, k)); }
async function kvDel(k) { return p((await store("kv", "readwrite")).delete(k)); }
async function reqGet(k) { return p((await store("reqs")).get(k)); }
async function reqPut(o) { return p((await store("reqs", "readwrite")).put(o)); }
async function reqDel(k) { return p((await store("reqs", "readwrite")).delete(k)); }
async function reqAll() { return p((await store("reqs")).getAll()); }
