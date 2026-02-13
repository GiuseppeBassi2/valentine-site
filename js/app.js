/* ==========================================================
   Valentine SPA (no framework) — Slide Engine + interactions
   ========================================================== */

(() => {
  const config = window.VAL_CONFIG;

  // ---------- Utilities ----------
  const prefersReducedMotion = () =>
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

  // ---------- Theme / config ----------
  function applyTheme(cfg) {
    if (!cfg?.palette) return;
    const r = document.documentElement;
    r.style.setProperty("--bg1", cfg.palette.bg1);
    r.style.setProperty("--bg2", cfg.palette.bg2);
    r.style.setProperty("--ink", cfg.palette.ink);
    r.style.setProperty("--primary", cfg.palette.primary);
    r.style.setProperty("--primary2", cfg.palette.primary2);
    document.title = cfg.pageTitle || document.title;
  }

  // ---------- Slide Engine ----------
  let currentSlideIndex = 0;
  const slides = Array.from(document.querySelectorAll(".slide"));

  function showSlide(index, direction = "next") {
    const nextIdx = clamp(index, 0, slides.length - 1);
    const prevSlide = slides[currentSlideIndex];
    const nextSlide = slides[nextIdx];
    if (!nextSlide || nextIdx === currentSlideIndex) return;

    // Hide previous
    if (prevSlide) {
      prevSlide.classList.remove("is-active", "is-enter-left", "is-enter-right");
      prevSlide.setAttribute("aria-hidden", "true");
      // Prevent stray focus on hidden slide
      prevSlide.querySelectorAll("a,button,input,textarea,select,[tabindex]")
        .forEach(el => {
          if (el.getAttribute("tabindex") === "-1") return;
          el.dataset._tab = el.getAttribute("tabindex") ?? "";
          el.setAttribute("tabindex", "-1");
        });
    }

    // Show next
    nextSlide.classList.add("is-active");
    nextSlide.classList.add(direction === "prev" ? "is-enter-left" : "is-enter-right");
    nextSlide.setAttribute("aria-hidden", "false");
    nextSlide.querySelectorAll("[data-_tab]").forEach(() => {}); // no-op placeholder

    // Restore focusability inside active slide
    nextSlide.querySelectorAll("a,button,input,textarea,select,[tabindex]")
      .forEach(el => {
        if (el.hasAttribute("data-action") || el.tagName === "BUTTON" || el.tagName === "INPUT" || el.tagName === "A") {
          const prev = el.dataset._tab;
          if (prev !== undefined) {
            if (prev === "") el.removeAttribute("tabindex");
            else el.setAttribute("tabindex", prev);
            delete el.dataset._tab;
          } else {
            if (el.getAttribute("tabindex") === "-1" && !el.matches(".title")) el.removeAttribute("tabindex");
          }
        }
      });

    currentSlideIndex = nextIdx;

    // Focus management: focus the title for smooth "app" feel
    const title = nextSlide.querySelector(".title");
    if (title) title.focus({ preventScroll: true });

    // Populate photo slide if needed
    hydratePhotoSlide(nextSlide);

    // cleanup transition helper classes after paint
    requestAnimationFrame(() => {
      nextSlide.classList.remove("is-enter-left", "is-enter-right");
    });
  }

  function nextSlide() { showSlide(currentSlideIndex + 1, "next"); }
  function prevSlide() { showSlide(currentSlideIndex - 1, "prev"); }

  // ---------- Photo hydration ----------
  function hydratePhotoSlide(slideEl) {
    const key = slideEl?.dataset?.photoKey;
    if (!key) return;
    const entry = config?.photos?.[key];
    if (!entry) return;

    const img = slideEl.querySelector("[data-photo]");
    const cap = slideEl.querySelector("[data-caption]");
    if (img && !img.src) img.src = entry.src;
    if (cap && !cap.textContent) cap.textContent = entry.caption || "";
  }

  // ---------- Runaway button ----------
  function initRunawayButtons(slideEl) {
  const zone = slideEl.querySelector("[data-runaway-zone]");
  const runaways = Array.from(slideEl.querySelectorAll("[data-runaway]"));
  if (!zone || runaways.length === 0) return;

  const pad = 8;

  const moveButton = (btn) => {
    const zoneRect = zone.getBoundingClientRect();
    const btnRect = btn.getBoundingClientRect();

    const maxX = zoneRect.width - btnRect.width - pad;
    const maxY = zoneRect.height - btnRect.height - pad;
    if (maxX <= 0 || maxY <= 0) return;

    const x = Math.random() * maxX + pad / 2;
    const y = Math.random() * maxY + pad / 2;

    btn.style.left = `${clamp(x, pad/2, maxX)}px`;
    btn.style.top  = `${clamp(y, pad/2, maxY)}px`;
    btn.style.right = "auto";
    btn.style.bottom = "auto";

    btn.animate(
      [{ transform: "scale(1)" }, { transform: "scale(1.07)" }, { transform: "scale(1)" }],
      { duration: 220, easing: "ease-out" }
    );
  };

  // absolute positioning inside zone
  runaways.forEach((btn, i) => {
    btn.style.position = "absolute";
    if (i === 0) { btn.style.left = "0px"; btn.style.top = "0px"; }
    else { btn.style.right = "0px"; btn.style.bottom = "0px"; }
  });

  runaways.forEach((btn) => {
    const onAttempt = (e) => {
      e.preventDefault();
      moveButton(btn);

      // YES advances, but still "runs" first
      if (btn.dataset.action === "next") {
        setTimeout(() => nextSlide(), 220);
      }
    };

    btn.addEventListener("pointerdown", onAttempt, { passive: false });
    btn.addEventListener("click", (e) => e.preventDefault());
  });

  window.addEventListener("resize", () => runaways.forEach(moveButton));
}

  // ---------- Love meter ----------
  function displayedLovePct(raw) {
    // raw: 0..200
    if (raw <= 100) return raw;

    // Nonlinear boost above 100.
    // This is the "End2EndAI vibe": quickly becomes ridiculous but still smooth.
    const t = raw - 100; // 0..100
    const boosted = 100 + Math.round((t * t) * 10); // 100..100100
    return boosted;
  }

  function pickMeterMsg(pct, thresholds) {
    let msg = thresholds?.[0]?.msg ?? "";
    for (const t of thresholds || []) {
      if (pct >= t.pct) msg = t.msg;
    }
    return msg;
  }

  function initLoveMeter(slideEl) {
    const range = slideEl.querySelector("#loveRange");
    const valueEl = slideEl.querySelector("#meterValue");
    const msgEl = slideEl.querySelector("#meterMsg");
    if (!range || !valueEl || !msgEl) return;

    const render = () => {
      const raw = Number(range.value || 0);
      const pct = displayedLovePct(raw);
      valueEl.textContent = `${pct.toLocaleString()}%`;
      msgEl.textContent = pickMeterMsg(pct, config?.loveMeter?.thresholds);
    };

    range.addEventListener("input", render);
    render();
  }

  // ---------- Floating emojis ----------
  function startFloatingEmojis(cfg) {
    const layer = document.getElementById("float-layer");
    if (!layer || prefersReducedMotion()) return;
    if (!cfg?.floating?.enabled) return;

    const { emojis, spawnEveryMs, durationMs, sizePx } = cfg.floating;
    if (!emojis?.length) return;

    const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
    const rand = (min, max) => min + Math.random() * (max - min);

    // Keep DOM bounded: remove nodes at animation end (no infinite buildup).
    const spawn = () => {
      const el = document.createElement("span");
      el.className = "float-emoji";
      el.textContent = pick(emojis);

      const size = rand(sizePx[0], sizePx[1]);
      el.style.fontSize = `${size}px`;
      el.style.left = `${Math.floor(Math.random() * 100)}vw`;

      const dur = rand(durationMs[0], durationMs[1]);
      el.style.animationDuration = `${dur}ms`;
      el.style.animationDelay = `${rand(0, 350)}ms`;

      layer.appendChild(el);

      const cleanup = () => el.remove();
      el.addEventListener("animationend", cleanup, { once: true });
    };

    // Initial burst (subtle)
    for (let i = 0; i < 6; i++) setTimeout(spawn, i * 120);

    setInterval(spawn, spawnEveryMs);
  }

  // ---------- Other interactions ----------
  function initGoodBoyReveal() {
    const btn = document.getElementById("revealBtn");
    const line = document.getElementById("slaveLine");
    if (!btn || !line) return;

    btn.addEventListener("click", () => {
      const nextState = line.hasAttribute("hidden");
      if (nextState) line.removeAttribute("hidden");
      else line.setAttribute("hidden", "");

      btn.textContent = nextState ? "Ok ok… enough 😳" : "Tap for the secret 🤭";
    });
  }

  // ---------- Wiring ----------
  function bindGlobalActions() {
    document.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-action]");
      if (!btn) return;

      const action = btn.dataset.action;
      if (action === "next") nextSlide();
      else if (action === "prev") prevSlide();
      else if (action === "restart") showSlide(0, "prev");
    });
  }

  function init() {
    applyTheme(config);

    // Hide all slides, show first
    slides.forEach((s, i) => {
      s.classList.toggle("is-active", i === 0);
      s.setAttribute("aria-hidden", i === 0 ? "false" : "true");
    });
    hydratePhotoSlide(slides[0]); // just in case
    showSlide(0, "next"); // also applies focus management for first slide

    // Slide-specific components
    initRunawayButton(document.querySelector('[data-slide="intro"]'));
    initLoveMeter(document.querySelector('[data-slide="meter"]'));
    initGoodBoyReveal();

    // Background
    startFloatingEmojis(config);

    bindGlobalActions();
  }

  // DOM ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
