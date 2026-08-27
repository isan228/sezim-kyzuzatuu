(function () {
  const labels = {
    yes: "Придёт",
    plus: "Придёт с парой",
    no: "Не сможет"
  };

  const $ = (s) => document.querySelector(s);
  let pin = sessionStorage.getItem("adminPin") || "";
  let items = [];
  let filter = "all";

  async function request(path, opts = {}) {
    const headers = Object.assign({ "Content-Type": "application/json" }, opts.headers || {});
    if (pin) headers["X-Admin-Pin"] = pin;
    const sep = path.includes("?") ? "&" : "?";
    const res = await fetch(`${path}${sep}pin=${encodeURIComponent(pin)}`, {
      ...opts,
      headers
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw data;
    return data;
  }

  function render(data) {
    items = data.items || [];
    const s = data.stats || {};
    $("#stats").innerHTML = `
      <div class="stat"><b>${s.total || 0}</b><span>откликов</span></div>
      <div class="stat"><b>${s.coming || 0}</b><span>придут</span></div>
      <div class="stat"><b>${s.declined || 0}</b><span>не смогут</span></div>
      <div class="stat"><b>${s.guests || 0}</b><span>человек всего</span></div>
    `;

    const rows = items.filter((x) => {
      if (filter === "coming") return x.attend === "yes" || x.attend === "plus";
      if (filter === "no") return x.attend === "no";
      return true;
    });

    $("#empty").hidden = rows.length > 0;
    $("#rows").innerHTML = rows
      .slice()
      .reverse()
      .map(
        (x) => `
        <tr>
          <td>${escapeHtml(x.name)}</td>
          <td><span class="badge ${x.attend}">${labels[x.attend] || x.attend}</span></td>
          <td>${x.people}</td>
          <td>${formatWhen(x.createdAt)}</td>
          <td><button class="del" data-id="${x.id}" type="button" aria-label="Удалить">×</button></td>
        </tr>`
      )
      .join("");
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function formatWhen(iso) {
    if (!iso) return "";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  async function load() {
    const data = await request("/api/rsvps");
    $("#gate").hidden = true;
    $("#dash").hidden = false;
    render(data);
  }

  $("#pinForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    pin = $("#pin").value.trim();
    $("#pinError").hidden = true;
    try {
      sessionStorage.setItem("adminPin", pin);
      await load();
    } catch (err) {
      sessionStorage.removeItem("adminPin");
      $("#pinError").hidden = false;
    }
  });

  $("#logout").addEventListener("click", () => {
    sessionStorage.removeItem("adminPin");
    pin = "";
    $("#dash").hidden = true;
    $("#gate").hidden = false;
    $("#pin").value = "";
  });

  $("#tabs").addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-filter]");
    if (!btn) return;
    filter = btn.dataset.filter;
    document.querySelectorAll("#tabs button").forEach((b) => b.classList.toggle("is-on", b === btn));
    render({ items, stats: summarize(items) });
  });

  $("#rows").addEventListener("click", async (e) => {
    const btn = e.target.closest(".del");
    if (!btn) return;
    if (!confirm("Удалить этот отклик?")) return;
    const data = await request(`/api/rsvps/${btn.dataset.id}`, { method: "DELETE" });
    render(data);
  });

  $("#exportBtn").addEventListener("click", () => {
    const header = "Имя;Ответ;Человек;Когда";
    const lines = items.map(
      (x) => `${x.name};${labels[x.attend] || x.attend};${x.people};${x.createdAt}`
    );
    const blob = new Blob(["\uFEFF" + [header, ...lines].join("\n")], {
      type: "text/csv;charset=utf-8"
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "rsvp.csv";
    a.click();
  });

  function summarize(list) {
    const coming = list.filter((x) => x.attend === "yes" || x.attend === "plus");
    return {
      total: list.length,
      coming: coming.length,
      declined: list.filter((x) => x.attend === "no").length,
      guests: coming.reduce((sum, x) => sum + Number(x.people || 0), 0)
    };
  }

  if (pin) {
    load().catch(() => {
      sessionStorage.removeItem("adminPin");
    });
  }
})();
