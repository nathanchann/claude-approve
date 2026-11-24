importScripts("config.js", "db.js");

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

self.addEventListener("push", (e) => e.waitUntil(onPush(e)));

async function onPush(e) {
  let m = {};
  try { m = e.data.json(); } catch (_) {}
  const reg = self.registration;
  if (m.t === "req") {
    const old = await reqGet(m.key);
    await reqPut({ key: m.key, id: m.id, rule: m.rule, reason: m.reason || "", from: m.from || "",
                   status: "pending", at: (old && old.at) || Date.now() });
    await reg.showNotification("Claude wants permission", {
      body: m.rule + (m.reason ? "\n" + m.reason : ""), tag: m.key, data: { key: m.key },
    });
  } else if (m.t === "done") {
    const r = await reqGet(m.key);
    if (r) { r.status = "done"; r.label = m.label; r.doneAt = Date.now(); await reqPut(r); }
    // iOS needs every push to show something: replace the request's notification in place.
    await reg.showNotification(m.label || "Done", { body: m.rule || "", tag: m.key, data: { key: m.key }, silent: true });
  } else if (m.t === "paired") {
    await kvSet("paired", true);
    await reg.showNotification("Paired ✅", { body: "Claude permission requests will show up here.", tag: "paired" });
  } else {
    await reg.showNotification(m.title || "claude-allow", { body: m.body || "", tag: m.tag || "info" });
  }
  const cs = await self.clients.matchAll({ type: "window" });
  cs.forEach((c) => c.postMessage({ t: "refresh" }));
}

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const key = e.notification.data && e.notification.data.key;
  e.waitUntil((async () => {
    const cs = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const c of cs) { c.postMessage({ t: "refresh", key }); return c.focus(); }
    return self.clients.openWindow("./" + (key ? "#k=" + key : ""));
  })());
});
