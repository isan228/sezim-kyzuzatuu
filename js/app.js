(function () {
  const data = window.INVITE;
  const $ = (sel, root = document) => root.querySelector(sel);

  function fill() {
    const ui = data.ui;
    document.title = `${data.name} — Кыз узатуу`;
    $("#sealText").textContent = ui.seal;
    $(".start-name").textContent = data.name;
    $("#invitedLine").textContent = data.invitedLine;
    $("#brideLine").textContent = data.brideLine;
    $("#eventType").textContent = data.event;
    $("#callLine").textContent = data.callLine;
    $("#hostsLabel").textContent = data.hostsLabel;
    $("#heroName").textContent = data.hosts;
    $("#metaDay").textContent = data.day;
    $("#metaMonth").textContent = data.month;
    $("#metaYear").textContent = data.year;
    $("#metaTime").textContent = data.time;
    $("#metaPlaceLabel").textContent = data.venue.placeLabel;
    $("#metaPlace").textContent = data.venue.place;
    $("#addressText").textContent = data.venue.address;
    $("#eventBlessing").textContent = data.blessing;
    $("#calendarTitle").textContent = ui.calendarTitle;
    $("#countdownTitle").textContent = ui.countdownTitle;
    $("#icsBtn").textContent = ui.ics;
    $("#whereTitle").textContent = ui.whereTitle;
    $("#venueName").textContent = data.venue.name;
    $("#venuePlace").textContent = `${data.venue.placeLabel} ${data.venue.place}`;
    $("#venueType").textContent = data.venue.type;
    $("#venueStreet").textContent = `${data.venue.street}, ${data.venue.floor}`;
    $("#venueCity").textContent = `${data.venue.city}, ${data.venue.district}`;
    $("#venueHours").textContent = `${ui.hoursLabel}: ${data.venue.hours}`;
    $("#venueRating").textContent = `${ui.ratingLabel}: ${data.venue.rating} · ${data.venue.reviews} баа`;
    if ($("#venuePhoto") && data.photos.venue) $("#venuePhoto").src = data.photos.venue;
    $("#mapBtn").textContent = ui.map;
    $("#mapBtn").href = data.mapUrl;
    $("#routeBtn").textContent = ui.route;
    $("#routeBtn").href = data.routeUrl;
    $("#formTitle").textContent = ui.formTitle;
    $("#nameLabel").textContent = ui.nameLabel;
    $("#guestName").placeholder = ui.namePh;
    $("#attendLabel").textContent = ui.attendLabel;
    $("#peopleLabel").textContent = ui.peopleLabel;
    $("#submitBtn").textContent = ui.submit;
    $("#stickyRsvp").textContent = ui.sticky;
    $("#hosts").textContent = `${data.hostsLabel} · ${data.hosts}`;
    $("#footerBlessing").textContent = data.blessing;

    renderCalendar();
    renderChoices();

    if (data.music) {
      const music = $("#bgMusic");
      music.src = data.music;
      music.loop = true;
      music.preload = "auto";
      $("#musicBtn").hidden = false;
    }
  }

  function renderCalendar() {
    const week = data.ui.weekdays || ["Дш", "Шш", "Шр", "Бш", "Жм", "Иш", "Жк"];
    const start = new Date(data.dateISO);
    const year = start.getFullYear();
    const month = start.getMonth();
    const highlight = start.getDate();
    const first = new Date(year, month, 1).getDay();
    const offset = first === 0 ? 6 : first - 1;
    const days = new Date(year, month + 1, 0).getDate();
    let html = week.map((d) => `<div class="cal-head">${d}</div>`).join("");
    for (let i = 0; i < offset; i += 1) html += `<div></div>`;
    for (let d = 1; d <= days; d += 1) {
      html += `<div class="cal-day${d === highlight ? " is-on" : ""}" style="--d:${(d * 0.02).toFixed(2)}s">${d}</div>`;
    }
    $("#calendar").innerHTML = html;
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
      { root, threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    document.querySelectorAll(".reveal, .stagger-in").forEach((el) => io.observe(el));
  }

  function motion() {
    const root = $(".app");
    const hero = $(".hero");
    const content = $(".hero-content");
    const hint = $(".scroll-hint");
    const curve = $("#scrollFill");
    const bead = $("#scrollBead");
    const svgEl = $("#scrollCurve");
    const invite = $(".invite");
    const sticky = $(".sticky-rsvp");
    const decos = hero ? hero.querySelectorAll(".deco[data-speed]") : [];
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let ticking = false;
    let pathLen = 0;

    const measurePath = () => {
      if (curve && typeof curve.getTotalLength === "function") {
        pathLen = curve.getTotalLength();
      }
    };
    measurePath();

    const tick = () => {
      const y = root.scrollTop;
      const vh = root.clientHeight;
      const max = Math.max(1, root.scrollHeight - vh);
      const p = Math.min(1, y / vh);
      const pct = Math.min(1, Math.max(0, y / max));

      if (curve && pathLen) {
        curve.style.strokeDasharray = `${pct * pathLen} ${pathLen}`;
        const pt = curve.getPointAtLength(pct * pathLen);
        if (bead && svgEl && invite && typeof svgEl.createSVGPoint === "function") {
          const p = svgEl.createSVGPoint();
          p.x = pt.x;
          p.y = pt.y;
          const ctm = curve.getScreenCTM();
          if (ctm) {
            const screen = p.matrixTransform(ctm);
            const box = invite.getBoundingClientRect();
            bead.style.left = `${screen.x - box.left}px`;
            bead.style.top = `${screen.y - box.top}px`;
          }
        }
      }
      if (bead) bead.classList.toggle("is-on", y > vh * 0.22);
      if (sticky) sticky.classList.toggle("is-show", y > vh * 0.55);

      if (!reduce) {
        if (y > 4) {
          decos.forEach((el) => {
            const speed = Number(el.dataset.speed || 0);
            const x = speed < 0 ? y * speed * 0.45 : y * speed * 0.2;
            el.style.transform = `translate3d(${x}px, ${y * speed}px, 0)`;
          });
        }
        if (content) {
          content.style.transform = `translate3d(0, ${y * 0.22}px, 0) scale(${1 - p * 0.06})`;
          content.style.opacity = String(Math.max(0, 1 - p * 1.2));
        }
        if (hint) hint.style.opacity = String(Math.max(0, 1 - y / 90));
      }

      ticking = false;
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(tick);
    };

    root.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", () => {
      measurePath();
      tick();
    });
    tick();
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
      `LOCATION:${data.venue.placeLabel} ${data.venue.place}, ${data.venue.address}`,
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

  function playMusic() {
    if (!data.music) return;
    const music = $("#bgMusic");
    music.loop = true;
    music.play().then(() => {
      $("#musicBtn").classList.add("is-on");
    }).catch(() => {});
  }

  function openInvite() {
    $("#startScreen").classList.add("is-gone");
    $(".app").classList.add("is-open");
    $(".phone").classList.add("is-open");
    reveal();
    motion();
    playMusic();
  }

  function bind() {
    $("#openBtn").addEventListener("click", openInvite);
    $("#icsBtn").addEventListener("click", addToCalendar);
    $("#musicBtn").addEventListener("click", () => {
      const music = $("#bgMusic");
      if (music.paused) {
        playMusic();
      } else {
        music.pause();
        $("#musicBtn").classList.remove("is-on");
      }
    });
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden && $("#musicBtn").classList.contains("is-on")) playMusic();
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
        await window.RSVPStore.create({ name, attend, people: Number(people) });
        $("#rsvpThanks").classList.add("is-on");
        $("#rsvpThanks").textContent = attend === "no" ? data.ui.thanksNo : data.ui.thanksYes;
        btn.textContent = data.ui.sent;
      } catch (err) {
        $("#rsvpThanks").classList.add("is-on");
        $("#rsvpThanks").textContent = data.ui.saveError;
        btn.disabled = false;
      }
    });
  }

  fill();
  countdown();
  bind();
})();
