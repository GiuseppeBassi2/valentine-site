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

  function lockFocus(slideEl) {
    slideEl.querySelectorAll("a,button,input,textarea,select,[tabindex]")
      .forEach(el => {
        if (el.getAttribute("tabindex") === "-1") return;
        el.dataset._tab = el.getAttribute("tabindex") ?? "";
        el.setAttribute("tabindex", "-1");
      });
  }

  function unlockFocus(slideEl) {
    slideEl.querySelectorAll("a,button,input,textarea,select,[tabindex]")
      .forEach(el => {
        const prev = el.dataset._tab;
        if (prev !== undefined) {
          if (prev === "") el.removeAttribute("tabindex");
          else el.setAttribute("tabindex", prev);
          delete el.dataset._tab;
        } else {
          // allow natural focus on interactive elements
          if (el.getAttribute("tabindex") === "-1" && !el.matches(".title")) {
            el.removeAttribute("tabindex");
          }
        }
      });
  }

  function showSlide(index, direction = "next") {
    const nextIdx = clamp(index, 0, slides.length - 1);
    const prevSlide = slides[currentSlideIndex];
    const nextSlide = slides[nextIdx];
    if (!nextSlide || nextIdx === currentSlideIndex) return;

    // Hide previous
    if (prevSlide) {
      prevSlide.classList.remove("is-active", "is-enter-left", "is-enter-right");
      prevSlide.setAttribute("aria-hidden", "true");
      lockFocus(prevSlide);
    }

    // Show next
    nextSlide.classList.add("is-active");
    nextSlide.classList.add(direction === "prev" ? "is-enter-left" : "is-enter-right");
    nextSlide.setAttribute("aria-hidden", "false");
    unlockFocus(nextSlide);

    currentSlideIndex = nextIdx;

    // Focus management
    const title = nextSlide.querySelector(".title");
    if (title) title.focus({ preventScroll: true });

    // Populate photo slide if needed
    hydratePhotoSlide(nextSlide);

    // If meter slide, ensure meter is initialized nicely
    if (nextSlide.dataset.slide === "meter") {
      resetLoveMeter(nextSlide);
    }

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
    if (cap && cap.textContent === "") cap.textContent = entry.caption || "";
  }

  // ---------- Intro (Yes/No move like reference) ----------
function initIntroButtons(slideEl) {
    const buttons = Array.from(slideEl.querySelectorAll("[data-move-btn]"));
    if (!buttons.length) return;

    // Salviamo il genitore originale per poter fare il "reset" dopo
    buttons.forEach(btn => {
        if (!btn.dataset.originalParent) {
            // Usiamo un placeholder per ricordare dove stava
            const placeholder = document.createComment("btn-placeholder");
            btn.parentNode.insertBefore(placeholder, btn);
            btn._placeholder = placeholder;
        }
    });

    const moveButton = (button) => {
        // 1. Se il bottone è ancora nella slide, spostalo nel BODY per evitare
        // che venga tagliato da overflow:hidden o trasformazioni CSS della slide.
        if (button.parentNode !== document.body) {
            const rect = button.getBoundingClientRect();
            // Mantieni la larghezza visiva attuale
            button.style.width = `${rect.width}px`; 
            document.body.appendChild(button);
        }

        // 2. Calcoli semplici e sicuri (come nel primo codice)
        const pad = 20; // Margine di sicurezza dal bordo schermo
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        
        // Dimensioni attuali del bottone
        const btnW = button.offsetWidth;
        const btnH = button.offsetHeight;

        // Area sicura dove il bottone può andare
        const maxX = vw - btnW - pad;
        const maxY = vh - btnH - pad;

        // Genera coordinate random
        const x = Math.random() * (maxX - pad) + pad;
        const y = Math.random() * (maxY - pad) + pad;

        // 3. Applica lo stile
        button.style.position = 'fixed';
        button.style.left = `${x}px`;
        button.style.top = `${y}px`;
        button.style.zIndex = "99999"; // Assicuriamoci che sia sopra a tutto
        
        // Rimuovi eventuali margini che potrebbero sballare la posizione
        button.style.margin = "0"; 
    };

    const onTap = (e) => {
        e.preventDefault(); // Evita doppio click/zoom su mobile
        moveButton(e.currentTarget);
    };

    buttons.forEach(btn => {
        // Supporto sia per touch che per mouse
        btn.addEventListener("touchstart", onTap, { passive: false });
        btn.addEventListener("mouseover", onTap); // Per desktop
        btn.addEventListener("click", (e) => e.preventDefault());
    });

    // Helper for restart (li rimette al loro posto originale)
    slideEl._resetChoices = () => {
        buttons.forEach(btn => {
            // Rimuovi stili inline (fixed, top, left...)
            btn.style.position = "";
            btn.style.left = "";
            btn.style.top = "";
            btn.style.width = "";
            btn.style.zIndex = "";
            btn.style.margin = "";

            // Se è stato spostato nel body, rimettilo al suo posto
            if (btn.parentNode === document.body && btn._placeholder) {
                btn._placeholder.parentNode.insertBefore(btn, btn._placeholder.nextSibling);
            }
        });
    };
}

  function resetIntroChoices() {
    const intro = document.querySelector('[data-slide="intro"]');
    if (intro && typeof intro._resetChoices === "function") intro._resetChoices();
  }

  // ---------- Love meter (IDENTICAL logic to reference) ----------
  function initLoveMeter(slideEl) {
    const loveMeter = slideEl.querySelector("#loveMeter");
    const loveValue = slideEl.querySelector("#loveValue");
    const extraLove = slideEl.querySelector("#extraLove");
    if (!loveMeter || !loveValue || !extraLove) return;

    const msgs = config?.loveMessages || {
      extreme: "WOOOOW You love me that much?? 🥰🚀💝",
      high: "To infinity and beyond! 🚀💝",
      normal: "And beyond! 🥰"
    };

    const onInput = () => {
      const value = parseInt(loveMeter.value, 10);
      loveValue.textContent = value;

      if (value > 100) {
        extraLove.classList.remove("hidden");

        const overflowPercentage = (value - 100) / 9900;
        const extraWidth = overflowPercentage * window.innerWidth * 0.8;

        loveMeter.style.width = `calc(100% + ${extraWidth}px)`;
        loveMeter.style.transition = "width 0.3s";

        if (value >= 5000) {
          extraLove.classList.add("super-love");
          extraLove.textContent = msgs.extreme;
        } else if (value > 1000) {
          extraLove.classList.remove("super-love");
          extraLove.textContent = msgs.high;
        } else {
          extraLove.classList.remove("super-love");
          extraLove.textContent = msgs.normal;
        }
      } else {
        extraLove.classList.add("hidden");
        extraLove.classList.remove("super-love");
        loveMeter.style.width = "100%";
      }
    };

    loveMeter.addEventListener("input", onInput);

    // Expose reset for restart/show slide
    slideEl._resetLoveMeter = () => {
      loveMeter.value = 100;
      loveValue.textContent = 100;
      extraLove.classList.add("hidden");
      extraLove.classList.remove("super-love");
      extraLove.textContent = "";
      loveMeter.style.width = "100%";
    };

    // initial
    slideEl._resetLoveMeter();
    onInput();
  }

  function resetLoveMeter(slideEl) {
    if (slideEl && typeof slideEl._resetLoveMeter === "function") {
      slideEl._resetLoveMeter();
    }
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
      el.addEventListener("animationend", () => el.remove(), { once: true });
    };

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
      else if (action === "restart") {
        // reset reference-like interactions
        resetIntroChoices();
        resetLoveMeter(document.querySelector('[data-slide="meter"]'));
        showSlide(0, "prev");
      }
    });
  }

  function init() {
    applyTheme(config);
    function preloadPhotos(cfg) {
  const photos = cfg?.photos || {};
  const entries = Object.values(photos);
  const run = () => {
    entries.forEach(p => {
      if (!p?.src) return;
      const img = new Image();
      img.decoding = "async";
      img.src = p.src;
    });
  };

  if ("requestIdleCallback" in window) requestIdleCallback(run);
  else setTimeout(run, 250);
}
    slides.forEach((s, i) => {
      s.classList.toggle("is-active", i === 0);
      s.setAttribute("aria-hidden", i === 0 ? "false" : "true");
      if (i !== 0) lockFocus(s);
    });

    // Slide-specific components
    initIntroButtons(document.querySelector('[data-slide="intro"]'));
    initLoveMeter(document.querySelector('[data-slide="meter"]'));
    initGoodBoyReveal();

    // Background
    startFloatingEmojis(config);

    // Focus first slide title
    const firstTitle = slides[0]?.querySelector(".title");
    if (firstTitle) firstTitle.focus({ preventScroll: true });

    bindGlobalActions();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
