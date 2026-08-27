(function () {
  const data = window.INVITE;
  const $ = (sel, root = document) => root.querySelector(sel);

  function fill() {
    const ui = data.ui;
    document.title = `${data.name} — Кыз узатуу`;
    $("#coverPhoto").src = data.photos.cover;
    $("#sealText").textContent = ui.seal;
    $(".start-name").textContent = data.name;
    $("#invitedLine").textContent = data.invitedLine;
    $("#eventType").textContent = data.event;
    $("#eventSubtitle").textContent = data.subtitle;
    $("#heroName").textContent = data.name;
    $("#eventWish").textContent = data.wish;
    $("#eventBlessing").textContent = data.blessing;
    $("#calendarTitle").textContent = ui.calendarTitle;
    $("#countdownTitle").textContent = ui.countdownTitle;
    $("#icsBtn").textContent = ui.ics;
    $("#whereTitle").textContent = ui.whereTitle;
    $("#mapBtn").textContent = ui.map;
    $("#mapBtn").href = data.mapUrl;
    $("#programTitle").textContent = ui.programTitle;
    $("#dressTitle").textContent = ui.dressTitle;
    $("#formTitle").textContent = ui.formTitle;
    $("#nameLabel").textContent = ui.nameLabel;
    $("#guestName").placeholder = ui.namePh;
    $("#attendLabel").textContent = ui.attendLabel;
    $("#peopleLabel").textContent = ui.peopleLabel;
    $("#submitBtn").textContent = ui.submit;
    $("#stickyRsvp").textContent = ui.sticky;
    $("#hosts").textContent = data.hosts;
    $("#footerBlessing").textContent = data.blessing;
    $("#telegramTitle").textContent = ui.telegramTitle;
    $("#telegramText").textContent = ui.telegramText;
    $("#telegramBtn").textContent = ui.telegramBtn;
    if (data.telegramAlbum) $("#telegramBtn").href = data.telegramAlbum;
    else $("#telegramBtn").removeAttribute("href");

    $("#venueCard").innerHTML = `
      <div class="venue-photo"><img src="${data.photos.venue}" alt=""></div>
      <div class="venue-body">
        <div class="place-time">${data.venue.time}</div>
        <h3>${data.venue.place}</h3>
        <div class="addr">${data.venue.city ? data.venue.city + " · " : ""}${data.venue.address}</div>
        <div class="note">${data.venue.note}</div>
      </div>`;

    renderCalendar();
    renderTiming();
    renderGallery();
    renderChoices();
    renderDress();

    if (data.music) {
      $("#bgMusic").src = data.music;
      $("#musicBtn").hidden = false;
    }
  }

  function renderCalendar() {
    const week = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
    const year = 2026;
    const month = 8;
    const highlight = 20;
    const first = new Date(year, month, 1).getDay();
    const offset = first === 0 ? 6 : first - 1;
    const days = new Date(year, month + 1, 0).getDate();
    let html = week.map((d) => `<div class="cal-head">${d}</div>`).join("");
    for (let i = 0; i < offset; i += 1) html += `<div></div>`;
    for (let d = 1; d <= days; d += 1) {
      html += `<div class="cal-day${d === highlight ? " is-on" : ""}">${d}</div>`;
    }
    $("#calendar").innerHTML = html;
  }

  function renderTiming() {
    $("#timeline").innerHTML = data.timeline
      .map(
        (item, i) => `
        <article class="timing-item" style="animation-delay:${i * 0.12}s">
          <strong>${item.time}</strong>
          <div>
            <h3>${item.title}</h3>
            <p>${item.text}</p>
          </div>
        </article>`
      )
      .join("");
  }

  function renderGallery() {
    $("#gallery").innerHTML = data.gallery
      .map(
        (item) => `
        <figure class="polaroid" data-src="${item.src}" data-caption="${item.caption}">
          <img src="${item.src}" alt="${item.caption}" loading="lazy">
          <figcaption>${item.caption}</figcaption>
        </figure>`
      )
      .join("");
  }

  function renderChoices() {
    const ui = data.ui;
    const opts = [
      { id: "yes", label: ui.attendYes },
      { id: "plus", label: ui.attendPlus },
      { id: "no", label: ui.attendNo }
    ];
    $("#attendChoices").innerHTML = opts
      .map(
        (o, i) => `
        <label class="choice${i === 0 ? " is-on" : ""}">
          <input type="radio" name="attend" value="${o.id}" ${i === 0 ? "checked" : ""}>
          <span>${o.label}</span>
        </label>`
      )
      .join("");
  }

  function renderDress() {
    $("#dressStyle").textContent = data.dresscode.style;
    $("#palette").innerHTML = data.dresscode.palette
      .map((c) => `<div class="swatch" style="background:${c}"></div>`)
      .join("");
    $("#paletteNames").innerHTML = data.dresscode.paletteNames
      .map((n) => `<span>${n}</span>`)
      .join("");
  }

  function countdown() {
    const target = new Date(data.dateISO).getTime();
    const ids = ["days", "hours", "minutes", "seconds"];
    let last = ["", "", "", ""];
    const tick = () => {
      const diff = Math.max(0, target - Date.now());
      const vals = [
        Math.floor(diff / 86400000),
        Math.floor((diff % 86400000) / 3600000),
        Math.floor((diff % 3600000) / 60000),
        Math.floor((diff % 60000) / 1000)
      ].map((v) => String(v).padStart(2, "0"));
      vals.forEach((v, i) => {
        const el = $(`#${ids[i]}`);
        if (el.textContent !== v) {
          el.textContent = v;
          if (last[i]) {
            el.classList.remove("pop");
            void el.offsetWidth;
            el.classList.add("pop");
          }
          last[i] = v;
        }
      });
    };
    tick();
    setInterval(tick, 1000);
  }

  function reveal() {
    const root = $(".app");
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("is-in");
            io.unobserve(e.target);
          }
        });
      },
      { root, threshold: 0.16 }
    );
    document.querySelectorAll(".reveal, .timing-item").forEach((el) => io.observe(el));
  }

  function parallax() {
    const media = $("#heroMedia");
    $(".app").addEventListener(
      "scroll",
      () => {
        const y = $(".app").scrollTop;
        if (y < window.innerHeight) media.style.transform = `translate3d(0, ${y * 0.22}px, 0)`;
      },
      { passive: true }
    );
  }

  function lightbox() {
    const box = $("#lightbox");
    const img = $("#lightboxImg");
    const caption = $("#lightboxCaption");
    const close = () => box.setAttribute("hidden", "");
    $("#gallery").addEventListener("click", (e) => {
      const card = e.target.closest(".polaroid");
      if (!card) return;
      img.src = card.dataset.src;
      caption.textContent = card.dataset.caption;
      box.removeAttribute("hidden");
    });
    $("#lightboxClose").addEventListener("click", close);
    box.addEventListener("click", (e) => {
      if (e.target === box) close();
    });
  }

  function pad(n) {
    return String(n).padStart(2, "0");
  }

  function fmtLocal(d) {
    return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
  }

  function addToCalendar() {
    const start = new Date(data.dateISO);
    const end = new Date(start.getTime() + 6 * 3600000);
    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "BEGIN:VEVENT",
      `DTSTART:${fmtLocal(start)}`,
      `DTEND:${fmtLocal(end)}`,
      `SUMMARY:${data.name} — кыз узатуу`,
      `LOCATION:${data.venue.place}`,
      "END:VEVENT",
      "END:VCALENDAR"
    ].join("\r\n");
    const blob = new Blob([ics], { type: "text/calendar" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "kyz-uzatuu.ics";
    a.click();
    URL.revokeObjectURL(url);
  }

  function openInvite() {
    $("#startScreen").classList.add("is-gone");
    $(".app").classList.add("is-open");
    reveal();
    parallax();
    const music = $("#bgMusic");
    if (data.music) {
      music.play().catch(() => {});
      $("#musicBtn").classList.add("is-on");
    }
  }

  function bind() {
    $("#openBtn").addEventListener("click", openInvite);
    $("#icsBtn").addEventListener("click", addToCalendar);
    $("#musicBtn").addEventListener("click", () => {
      const music = $("#bgMusic");
      if (music.paused) {
        music.play();
        $("#musicBtn").classList.add("is-on");
      } else {
        music.pause();
        $("#musicBtn").classList.remove("is-on");
      }
    });

    $("#attendChoices").addEventListener("change", (e) => {
      document.querySelectorAll(".choice").forEach((el) => el.classList.remove("is-on"));
      e.target.closest(".choice").classList.add("is-on");
      const attend = e.target.value;
      $("#peopleWrap").classList.toggle("is-off", attend === "no");
      if (attend === "plus" && Number($("#peopleCount").value) < 2) {
        $("#peopleCount").value = 2;
      }
    });

    $("#minus").addEventListener("click", () => {
      const input = $("#peopleCount");
      input.value = Math.max(1, Number(input.value) - 1);
    });
    $("#plus").addEventListener("click", () => {
      const input = $("#peopleCount");
      input.value = Math.min(20, Number(input.value) + 1);
    });

    $("#rsvpForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      const name = $("#guestName").value.trim();
      const attend = document.querySelector("input[name=attend]:checked").value;
      const people = $("#peopleCount").value;
      const btn = $("#submitBtn");
      btn.disabled = true;
      try {
        const res = await fetch("/api/rsvp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, attend, people: Number(people) })
        });
        if (!res.ok) throw new Error("save");
        $("#rsvpThanks").classList.add("is-on");
        $("#rsvpThanks").textContent = attend === "no" ? data.ui.thanksNo : data.ui.thanksYes;
        btn.textContent = "Отправлено";
      } catch (err) {
        $("#rsvpThanks").classList.add("is-on");
        $("#rsvpThanks").textContent = "Не удалось сохранить. Запустите server.py и попробуйте ещё раз.";
        btn.disabled = false;
      }
    });

    $("#telegramBtn").addEventListener("click", (e) => {
      if (!data.telegramAlbum) e.preventDefault();
    });

    lightbox();
  }

  fill();
  countdown();
  bind();
})();
