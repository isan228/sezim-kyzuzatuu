(function (global) {
  const BLOB_ROOT = "https://jsonblob.com/api/jsonBlob";

  function pin() {
    return (global.INVITE && global.INVITE.adminPin) || "2026";
  }

  function blobId() {
    const cfg = (global.INVITE && global.INVITE.rsvp && global.INVITE.rsvp.blobId) || "";
    return cfg || localStorage.getItem("rsvpBlobId") || "";
  }

  function setBlobId(id) {
    if (id) localStorage.setItem("rsvpBlobId", id);
  }

  function summarize(items) {
    const coming = items.filter((x) => x.attend === "yes" || x.attend === "plus");
    return {
      total: items.length,
      coming: coming.length,
      plus: items.filter((x) => x.attend === "plus").length,
      declined: items.filter((x) => x.attend === "no").length,
      guests: coming.reduce((sum, x) => sum + Number(x.people || 0), 0)
    };
  }

  function normalize(name, attend, people) {
    const cleanName = String(name || "").trim().slice(0, 80);
    const kind = attend === "plus" || attend === "no" ? attend : "yes";
    let count = Number(people);
    if (!Number.isFinite(count)) count = 1;
    if (kind === "no") count = 0;
    else if (kind === "plus") count = Math.max(2, Math.min(20, count));
    else count = Math.max(1, Math.min(20, count));
    return {
      id: Math.random().toString(16).slice(2) + Date.now().toString(16),
      name: cleanName,
      attend: kind,
      people: count,
      createdAt: new Date().toISOString().slice(0, 19)
    };
  }

  async function localList(adminPin) {
    const res = await fetch("/api/rsvps?pin=" + encodeURIComponent(adminPin), {
      headers: { "X-Admin-Pin": adminPin }
    });
    if (!res.ok) throw new Error("local");
    return res.json();
  }

  async function localCreate(item) {
    const res = await fetch("/api/rsvp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(item)
    });
    if (!res.ok) throw new Error("local");
    return res.json();
  }

  async function localDelete(id, adminPin) {
    const res = await fetch("/api/rsvps/" + id + "?pin=" + encodeURIComponent(adminPin), {
      method: "DELETE",
      headers: { "X-Admin-Pin": adminPin }
    });
    if (!res.ok) throw new Error("local");
    return res.json();
  }

  async function ensureBlob() {
    let id = blobId();
    if (id) return id;
    const res = await fetch(BLOB_ROOT, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: "[]"
    });
    if (!res.ok) throw new Error("cloud-create");
    id = res.headers.get("X-jsonblob") || (res.headers.get("Location") || "").split("/").pop();
    if (!id) throw new Error("cloud-id");
    setBlobId(id);
    return id;
  }

  async function cloudGet(id) {
    const res = await fetch(BLOB_ROOT + "/" + id, { headers: { Accept: "application/json" } });
    if (!res.ok) throw new Error("cloud-get");
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  }

  async function cloudPut(id, items) {
    const res = await fetch(BLOB_ROOT + "/" + id, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(items)
    });
    if (!res.ok) throw new Error("cloud-put");
  }

  async function list(adminPin) {
    try {
      return await localList(adminPin);
    } catch (err) {
      const id = await ensureBlob();
      const items = await cloudGet(id);
      return { ok: true, items, stats: summarize(items), cloud: true, blobId: id };
    }
  }

  async function create(payload) {
    const item = normalize(payload.name, payload.attend, payload.people);
    if (!item.name) throw new Error("name");
    try {
      return await localCreate(item);
    } catch (err) {
      const id = await ensureBlob();
      const items = await cloudGet(id);
      items.push(item);
      await cloudPut(id, items);
      return { ok: true, item, cloud: true };
    }
  }

  async function remove(id, adminPin) {
    try {
      return await localDelete(id, adminPin);
    } catch (err) {
      const blob = await ensureBlob();
      const items = (await cloudGet(blob)).filter((x) => x.id !== id);
      await cloudPut(blob, items);
      return { ok: true, items, stats: summarize(items), cloud: true };
    }
  }

  global.RSVPStore = {
    pin,
    list,
    create,
    remove,
    summarize
  };
})(window);
