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
    renderMap();

    if (data.music) {
      $("#bgMusic").src = data.music;
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
      html += `<div class="cal-day${d === highlight ? " is-on" : ""}">${d}</div>`;
    }
    $("#calendar").innerHTML = html;
  }

  function renderMap() {
    const frame = $("#mapFrame");
    const tap = $("#mapTap");
    if (!frame) return;
    const v = data.venue;
    const options = {
      pos: { lat: v.lat, lon: v.lon, zoom: 16 },
      opt: { city: "bishkek" },
      org: String(data.mapOrgId)
    };
    frame.src =
      "https://widgets.2gis.com/widget?type=firmsonmap&options=" +
      encodeURIComponent(JSON.stringify(options));
    if (tap) tap.href = data.mapUrl;
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
      { root, threshold: 0.16 }
    );
    document.querySelectorAll(".reveal").forEach((el) => io.observe(el));
  }

  function parallax() {
    const media = $("#heroMedia");
    if (!media) return;
    $(".app").addEventListener(
      "scroll",
      () => {
        const y = $(".app").scrollTop;
        if (y < window.innerHeight) media.style.transform = `translate3d(0, ${y * 0.22}px, 0)`;
      },
      { passive: true }
    );
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
