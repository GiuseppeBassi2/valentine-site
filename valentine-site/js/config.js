// Config-driven approach inspired by End2EndAI/valentine-website-2025
// (same idea: one object controls palette, texts, emojis, thresholds).
window.VAL_CONFIG = {
  pageTitle: "Happy Valentine 💝",
  // Palette gets mapped to CSS variables at runtime.
  palette: {
    bg1: "#ff7bbf",
    bg2: "#ffb3d9",
    ink: "#2a0f20",
    primary: "#ff3d8d",
    primary2: "#ff6fae",
  },

  // Floating emojis (hearts + bears + your symbols)
  floating: {
    enabled: true,
    emojis: ["💗","💞","🧸","🌹","🍫","🐥","🦙","🦆"],
    spawnEveryMs: 520,
    durationMs: [7000, 11000],
    sizePx: [18, 34],
  },

  // Love meter messages (inspired by End2EndAI's "go beyond 100%")
  loveMeter: {
    // slider raw 0..200 is mapped to "displayed percentage" (nonlinear above 100)
    thresholds: [
      { pct: 0, msg: "Slide it… come on 🥺" },
      { pct: 25, msg: "Ok ok… I see something 😌" },
      { pct: 60, msg: "Awww 🥹 keep going!" },
      { pct: 100, msg: "100%! That’s the minimum 😤" },
      { pct: 1000, msg: "Now we’re talking 😳💞" },
      { pct: 5000, msg: "THIS is love. Certified." },
      { pct: 20000, msg: "Physics is breaking. I love you more." }
    ]
  },

  // Photos used in the story (replace filenames in /assets)
  // NOTE: keep names simple; avoid HEIC for web compatibility.
  photos: {
    INNAMORATO: { src: "assets/INNAMORATO.JPG", caption: "Placeholder caption for INNAMORATO. (Edit me in config.js)" },
    FIRST_DATE: { src: "assets/FIRST_DATE.JPG", caption: "Placeholder caption for FIRST_DATE. (Edit me in config.js)" },
    MUSEUM_MIN: { src: "assets/MUSEUM_MIN.jpg", caption: "Placeholder caption for MUSEUM_MIN. (Edit me in config.js)" },
    PAPERA_MIN: { src: "assets/PAPERA_MIN.jpg", caption: "My papera. Molto papera. 😌🦆" },
    MINNIE_TOGETHER: { src: "assets/MINNIE_TOGETHER.jpg", caption: "Us. (Disney edition) 💞" },
    CHICAGO: { src: "assets/CHICAGO.jpg", caption: "Us. (Chicago 16:9) 🏙️💘" },
    HEART_MIN_1: { src: "assets/HEART_MIN_1.jpg", caption: "Happy Valentine’s Day, my love 💗" },
  }
};
