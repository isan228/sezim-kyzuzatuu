(function (global) {
  const KEY = "rsvpItems";

  function pin() {
    return (global.INVITE && global.INVITE.adminPin) || "2026";
  }

  function onPages() {
    return /\.github\.io$/i.test(location.hostname);
  }

  function pantryId() {
    const cfg = global.INVITE && global.INVITE.rsvp && global.INVITE.rsvp.pantryId;
    return String(cfg || "").trim();
  }

  function basketUrl(id) {
    return "https://getpantry.cloud/apiv1/pantry/" + id + "/basket/rsvps";
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

  function readLocal() {
    try {
      const data = JSON.parse(localStorage.getItem(KEY) || "[]");
      return Array.isArray(data) ? data : [];
    } catch (err) {
      return [];
    }
  }

  function writeLocal(items) {
    localStorage.setItem(KEY, JSON.stringify(items));
  }

  function pack(items, extra) {
    return Object.assign({ ok: true, items: items, stats: summarize(items) }, extra || {});
  }

  async function localApiList(adminPin) {
    if (onPages()) throw new Error("pages");
    const res = await fetch("/api/rsvps?pin=" + encodeURIComponent(adminPin), {
      headers: { "X-Admin-Pin": adminPin }
    });
    if (!res.ok) throw new Error("local");
    return res.json();
  }

  async function localApiCreate(item) {
    if (onPages()) throw new Error("pages");
    const res = await fetch("/api/rsvp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(item)
    });
    if (!res.ok) throw new Error("local");
    return res.json();
  }

  async function localApiDelete(id, adminPin) {
    if (onPages()) throw new Error("pages");
    const res = await fetch("/api/rsvps/" + id + "?pin=" + encodeURIComponent(adminPin), {
      method: "DELETE",
      headers: { "X-Admin-Pin": adminPin }
    });
    if (!res.ok) throw new Error("local");
    return res.json();
  }

  async function pantryGet(id) {
    const res = await fetch(basketUrl(id), { headers: { Accept: "application/json" } });
    if (res.status === 400 || res.status === 404) return [];
    if (!res.ok) throw new Error("pantry-get");
    const data = await res.json();
    if (Array.isArray(data)) return data;
    return Array.isArray(data.items) ? data.items : [];
  }

  async function pantryPut(id, items) {
    const res = await fetch(basketUrl(id), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: items })
    });
    if (!res.ok) throw new Error("pantry-put");
  }

  async function list(adminPin) {
    try {
      return await localApiList(adminPin);
    } catch (err) {
      const id = pantryId();
      if (id) {
        const items = await pantryGet(id);
        writeLocal(items);
        return pack(items, { cloud: true, pantryId: id });
      }
      return pack(readLocal(), { localOnly: true });
    }
  }

  async function create(payload) {
    const item = normalize(payload.name, payload.attend, payload.people);
    if (!item.name) throw new Error("name");
    try {
      return await localApiCreate(item);
    } catch (err) {
      const id = pantryId();
      if (id) {
        const items = await pantryGet(id);
        items.push(item);
        await pantryPut(id, items);
        writeLocal(items);
        return { ok: true, item: item, cloud: true, pantryId: id };
      }
      const items = readLocal();
      items.push(item);
      writeLocal(items);
      return { ok: true, item: item, localOnly: true };
    }
  }

  async function remove(id, adminPin) {
    try {
      return await localApiDelete(id, adminPin);
    } catch (err) {
      const pantry = pantryId();
      if (pantry) {
        const items = (await pantryGet(pantry)).filter((x) => x.id !== id);
        await pantryPut(pantry, items);
        writeLocal(items);
        return pack(items, { cloud: true, pantryId: pantry });
      }
      const items = readLocal().filter((x) => x.id !== id);
      writeLocal(items);
      return pack(items, { localOnly: true });
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
