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

  function render(data) {
    items = data.items || [];
    const s = data.stats || window.RSVPStore.summarize(items);
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
    if (pin !== window.RSVPStore.pin()) {
      throw new Error("pin");
    }
    const data = await window.RSVPStore.list(pin);
    $("#gate").hidden = true;
    $("#dash").hidden = false;
    render(data);
    const hint = $("#cloudHint");
    if (data.localOnly) {
      hint.hidden = false;
      hint.textContent =
        "GitHub Pages не умеет общий сервер. Ответы с этой страницы видны здесь, если гость ответил в этом же браузере. Для общего списка у всех гостей запустите python server.py на компьютере.";
    } else {
      hint.hidden = true;
    }
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
      $("#pinError").textContent =
        pin !== window.RSVPStore.pin()
          ? "Неверный PIN"
          : "PIN верный, но список не загрузился. Обновите страницу.";
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
    render({ items, stats: window.RSVPStore.summarize(items) });
  });

  $("#rows").addEventListener("click", async (e) => {
    const btn = e.target.closest(".del");
    if (!btn) return;
    if (!confirm("Удалить этот отклик?")) return;
    const data = await window.RSVPStore.remove(btn.dataset.id, pin);
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

  if (pin) {
    load().catch(() => {
      sessionStorage.removeItem("adminPin");
    });
  }
})();
