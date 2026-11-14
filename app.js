/* ============================================================
   一片名为「我」的雪 — interactions
   ============================================================ */
(() => {
  "use strict";

  const app = document.getElementById("app");
  const whisper = document.getElementById("whisper");
  const btnYes = document.getElementById("btn-yes");
  const btnNo = document.getElementById("btn-no");
  const hint = document.getElementById("landing-hint");
  const interlude = document.getElementById("interlude");
  const toastEl = document.getElementById("toast");

  const screens = {
    landing: document.getElementById("screen-landing"),
    chat: document.getElementById("screen-chat"),
    world: document.getElementById("screen-world"),
  };

  const chatBody = document.getElementById("chat-body");
  const chatStream = document.getElementById("chat-stream");
  const chatTime = document.getElementById("chat-time");
  const composer = document.getElementById("composer");
  const input = document.getElementById("msg-input");
  const sendBtn = document.getElementById("send-btn");
  const world = screens.world;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  /* ---------- snow ---------- */

  class Snowfall {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext("2d");
      this.w = 0;
      this.h = 0;
      this.dpr = 1;
      this.particles = [];
      this.last = 0;
      this.moods = {
        calm:  { density: 1,    speed: 1,    wind: 9 },
        melt:  { density: 0.5,  speed: 0.45, wind: 5 },
        frost: { density: 0.85, speed: 0.65, wind: 3 },
        wind:  { density: 1.15, speed: 1.55, wind: 95 },
        still: { density: 0,    speed: 0,    wind: 0 },
        world: { density: 0.4,  speed: 0.7,  wind: 8 },
      };
      this.cur = { ...this.moods.calm };
      this.target = { ...this.moods.calm };
      this.resize();
      window.addEventListener("resize", () => this.resize(), { passive: true });
      if (!reduceMotion) requestAnimationFrame((t) => this.frame(t));
    }

    resize() {
      const rect = this.canvas.getBoundingClientRect();
      this.dpr = Math.min(window.devicePixelRatio || 1, 2);
      this.w = Math.max(1, rect.width);
      this.h = Math.max(1, rect.height);
      this.canvas.width = Math.round(this.w * this.dpr);
      this.canvas.height = Math.round(this.h * this.dpr);
      this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

      const count = Math.max(42, Math.min(115, Math.round((this.w * this.h) / 7600)));
      const old = this.particles;
      this.particles = Array.from({ length: count }, (_, i) => {
        const p = old[i] || this.spawn(true);
        p.x = Math.min(p.x, this.w);
        p.y = Math.min(p.y, this.h);
        return p;
      });
      if (reduceMotion) this.draw(performance.now());
    }

    spawn(initial) {
      const r = 0.6 + Math.random() * 2.1;
      return {
        x: Math.random() * this.w,
        y: initial ? Math.random() * this.h : -10,
        r,
        vy: 10 + Math.random() * 24,
        sway: 4 + Math.random() * 11,
        phase: Math.random() * Math.PI * 2,
        alpha: 0.15 + Math.random() * 0.5,
        rot: Math.random() * Math.PI,
        spin: (Math.random() - 0.5) * 0.45,
        flake: r > 1.75,
      };
    }

    setMood(name) {
      this.target = { ...(this.moods[name] || this.moods.calm) };
      if (reduceMotion) this.draw(performance.now());
    }

    frame(ts) {
      if (!this.last) this.last = ts;
      const dt = Math.min(0.05, (ts - this.last) / 1000) || 0;
      this.last = ts;
      const k = Math.min(1, dt * 1.5);
      for (const key of ["density", "speed", "wind"]) {
        this.cur[key] += (this.target[key] - this.cur[key]) * k;
      }
      this.draw(ts, dt);
      requestAnimationFrame((t) => this.frame(t));
    }

    draw(ts, dt = 0) {
      const { ctx, w, h } = this;
      ctx.clearRect(0, 0, w, h);
      const visibility = Math.min(1, this.cur.density * 1.15);

      for (const p of this.particles) {
        if (dt) {
          p.y += p.vy * this.cur.speed * dt;
          p.x +=
            (Math.sin(ts * 0.00025 + p.phase) * p.sway + this.cur.wind) * dt;
          p.rot += p.spin * dt;

          if (p.y > h + 10) {
            p.y = -10;
            p.x = Math.random() * w;
          }
          if (p.x < -14) p.x = w + 10;
          else if (p.x > w + 14) p.x = -10;
        }

        const a = p.alpha * visibility;
        if (a < 0.012) continue;

        ctx.save();
        ctx.translate(p.x, p.y);
        if (p.flake) {
          ctx.rotate(p.rot);
          ctx.strokeStyle = `rgba(126, 158, 184, ${a})`;
          ctx.lineWidth = 0.7;
          ctx.beginPath();
          for (let i = 0; i < 6; i += 1) {
            const ang = (i * Math.PI) / 3;
            const len = p.r * 1.9;
            const tipX = Math.cos(ang) * len;
            const tipY = Math.sin(ang) * len;
            ctx.moveTo(0, 0);
            ctx.lineTo(tipX, tipY);
            const bx = Math.cos(ang) * p.r * 1.05;
            const by = Math.sin(ang) * p.r * 1.05;
            ctx.moveTo(bx, by);
            ctx.lineTo(
              bx + Math.cos(ang + 0.95) * p.r * 0.75,
              by + Math.sin(ang + 0.95) * p.r * 0.75
            );
            ctx.moveTo(bx, by);
            ctx.lineTo(
              bx + Math.cos(ang - 0.95) * p.r * 0.75,
              by + Math.sin(ang - 0.95) * p.r * 0.75
            );
          }
          ctx.stroke();
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, p.r, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(136, 166, 190, ${a})`;
          ctx.fill();
        }
        ctx.restore();
      }
    }
  }

  const snow = new Snowfall(document.getElementById("snow"));

  /* ---------- shared helpers ---------- */

  let toastTimer = 0;
  function toast(message) {
    toastEl.textContent = message;
    toastEl.classList.add("is-on");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toastEl.classList.remove("is-on"), 2200);
  }

  function showScreen(name) {
    Object.entries(screens).forEach(([key, el]) => {
      el.classList.toggle("is-active", key === name);
    });
    app.dataset.screen = name;
  }

  function setMood(mood) {
    app.dataset.mood = mood;
    snow.setMood(mood);
  }

  /* ---------- screen 1 : the snowflake ---------- */

  const NO_STATES = [
    {
      text: "再不捧起这片雪，它就融化了。",
      mood: "melt",
      label: "再等等",
    },
    {
      text: "雪已经化了一半，凉意还停在指尖。",
      mood: "frost",
      label: "还是不了",
    },
    {
      text: "风大了，雪正往远处走。",
      mood: "wind",
      label: "忍心吗",
    },
    {
      text: "只剩最后一片了，你还要等吗？",
      mood: "still",
      label: "不要了",
    },
  ];

  const HINTS = ["她还在等你", "雪越来越轻了", "风没有停", "最后一片了"];

  let noIndex = 0;
  let leaving = false;
  let whisperTimer = 0;

  function setWhisper(text) {
    window.clearTimeout(whisperTimer);
    whisper.classList.add("is-out");
    whisperTimer = window.setTimeout(() => {
      whisper.textContent = "";
      const line = document.createElement("span");
      line.className = "whisper__line";
      line.textContent = text;
      whisper.appendChild(line);
      whisper.classList.remove("is-out");
      whisper.classList.add("is-in");
    }, 300);
  }

  btnNo.addEventListener("click", () => {
    if (leaving) return;

    if (noIndex < NO_STATES.length) {
      const state = NO_STATES[noIndex];
      noIndex += 1;

      setWhisper(state.text);
      setMood(state.mood);
      hint.textContent = HINTS[noIndex - 1] || hint.textContent;
      btnNo.textContent = state.label;

      if (state.mood === "still") {
        btnYes.textContent = "捧住最后一片";
        btnYes.classList.add("is-pulse");
        btnNo.classList.add("is-faint");
      }
    } else {
      btnNo.classList.remove("is-denied");
      void btnNo.offsetWidth;
      btnNo.classList.add("is-denied");
    }
  });

  btnYes.addEventListener("click", () => {
    if (leaving) return;
    leaving = true;
    setMood("calm");
    app.classList.add("to-chat");

    window.setTimeout(() => {
      showScreen("chat");
      startChat();
    }, 700);

    window.setTimeout(() => app.classList.remove("to-chat"), 1500);
  });

  /* ---------- screen 2 : chat ---------- */

  const USER_FLAKE = `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <g fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round">
        <g transform="rotate(0 12 12)"><path d="M12 2.2v9.6"/><path d="M12 5.6 9.8 3.4M12 5.6l2.2-2.2"/></g>
        <g transform="rotate(60 12 12)"><path d="M12 2.2v9.6"/><path d="M12 5.6 9.8 3.4M12 5.6l2.2-2.2"/></g>
        <g transform="rotate(120 12 12)"><path d="M12 2.2v9.6"/><path d="M12 5.6 9.8 3.4M12 5.6l2.2-2.2"/></g>
        <g transform="rotate(180 12 12)"><path d="M12 2.2v9.6"/><path d="M12 5.6 9.8 3.4M12 5.6l2.2-2.2"/></g>
        <g transform="rotate(240 12 12)"><path d="M12 2.2v9.6"/><path d="M12 5.6 9.8 3.4M12 5.6l2.2-2.2"/></g>
        <g transform="rotate(300 12 12)"><path d="M12 2.2v9.6"/><path d="M12 5.6 9.8 3.4M12 5.6l2.2-2.2"/></g>
      </g>
    </svg>`;

  let chatStarted = false;
  let chatFinished = false;
  let chatLocked = true;
  let chatStep = 0;
  let typingRow = null;

  function setLocked(locked) {
    chatLocked = locked;
    input.disabled = locked;
    composer.classList.toggle("is-locked", locked);
    syncComposer();
  }

  function syncComposer() {
    const hasText = input.value.trim().length > 0;
    composer.classList.toggle("has-text", hasText);
    sendBtn.disabled = chatLocked || !hasText;
    if (chatFinished) {
      composer.classList.remove("has-text");
      sendBtn.disabled = true;
    }
  }

  function scrollChat() {
    requestAnimationFrame(() => {
      chatBody.scrollTop = chatBody.scrollHeight;
    });
  }

  function avatar(who) {
    const el = document.createElement("div");
    if (who === "me") {
      el.className = "avatar avatar--me";
      el.innerHTML = USER_FLAKE;
    } else {
      el.className = "avatar avatar--wu";
      el.innerHTML = '<img class="avatar__img" src="assets/wu-avatar.jpg" alt="">';
    }
    return el;
  }

  function addMessage(who, text) {
    const row = document.createElement("div");
    row.className = "msg " + (who === "me" ? "msg--me" : "msg--them");
    row.appendChild(avatar(who));

    const bubble = document.createElement("div");
    bubble.className = "bubble";
    bubble.textContent = text;
    row.appendChild(bubble);

    chatStream.appendChild(row);
    scrollChat();
  }

  function setTyping(on) {
    if (on) {
      if (typingRow) return;
      const row = document.createElement("div");
      row.className = "msg msg--them";
      row.appendChild(avatar("them"));

      const bubble = document.createElement("div");
      bubble.className = "bubble bubble--typing";
      bubble.innerHTML = "<span></span><span></span><span></span>";
      row.appendChild(bubble);

      typingRow = row;
      chatStream.appendChild(row);
      scrollChat();
    } else if (typingRow) {
      typingRow.remove();
      typingRow = null;
    }
  }

  async function say(text) {
    setTyping(true);
    await wait(900 + Math.min(text.length * 40, 800));
    setTyping(false);
    addMessage("them", text);
    await wait(260);
  }

  function nowLabel() {
    const d = new Date();
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    return `今天 ${hh}:${mm}`;
  }

  async function startChat() {
    if (chatStarted) return;
    chatStarted = true;
    chatTime.textContent = nowLabel();
    setLocked(true);
    await wait(700);
    await say("你终于来见我了吗");
    setLocked(false);
  }

  function sendMessage() {
    if (chatLocked || chatFinished) return;
    const text = input.value.trim();
    if (!text) return;

    addMessage("me", text);
    input.value = "";
    syncComposer();
    chatStep += 1;

    if (chatStep === 1) {
      setLocked(true);
      window.setTimeout(async () => {
        await say("靠近我感受我的温度吧");
        setLocked(false);
      }, 420);
    } else {
      chatFinished = true;
      setLocked(true);
      window.setTimeout(async () => {
        setTyping(true);
        await wait(1500);
        setTyping(false);
        enterWorld();
      }, 400);
    }
  }

  composer.addEventListener("submit", (event) => {
    event.preventDefault();
    sendMessage();
  });

  input.addEventListener("input", syncComposer);

  document.getElementById("emoji-btn").addEventListener("click", () => {
    const start = input.selectionStart ?? input.value.length;
    const end = input.selectionEnd ?? start;
    input.value = input.value.slice(0, start) + "❄" + input.value.slice(end);
    const pos = start + 1;
    input.focus();
    input.setSelectionRange(pos, pos);
    syncComposer();
  });

  document.getElementById("mic-btn").addEventListener("click", () => {
    toast("她听不见声音，只听得见你写的字。");
  });

  document.getElementById("plus-btn").addEventListener("click", () => {
    toast("这里只有雪，没有别的。");
  });

  document.getElementById("chat-back").addEventListener("click", () => {
    toast("雪还没有停，先别走。");
  });

  document.getElementById("chat-more").addEventListener("click", () => {
    toast("这里只有雪。");
  });

  /* ---------- music ---------- */

  const bgm = document.getElementById("bgm");
  const musicToggle = document.getElementById("music-toggle");
  let userPaused = false;
  bgm.volume = 0.55;

  function syncMusic() {
    const playing = !bgm.paused && !bgm.ended;
    musicToggle.classList.toggle("is-playing", playing);
    musicToggle.setAttribute("aria-pressed", String(playing));
    musicToggle.setAttribute(
      "aria-label",
      playing ? "暂停《雨夹雪》-Seto" : "播放《雨夹雪》-Seto"
    );
  }

  async function playMusic() {
    try {
      await bgm.play();
      return true;
    } catch (error) {
      return false;
    }
  }

  function armGestureUnlock() {
    const events = ["pointerdown", "touchstart", "keydown"];
    const unlock = async (event) => {
      const target = event.target;
      if (target instanceof Element && target.closest("#music-toggle")) return;
      if (userPaused || !bgm.paused) {
        cleanup();
        return;
      }
      if (await playMusic()) cleanup();
    };
    const cleanup = () => {
      events.forEach((name) => document.removeEventListener(name, unlock, true));
    };
    events.forEach((name) => document.addEventListener(name, unlock, true));
  }

  musicToggle.addEventListener("click", async () => {
    if (bgm.paused) {
      userPaused = false;
      if (!(await playMusic())) {
        toast("音乐暂时加载不了，可点页脚的网易云链接收听。");
      }
    } else {
      userPaused = true;
      bgm.pause();
    }
  });

  bgm.addEventListener("play", syncMusic);
  bgm.addEventListener("pause", syncMusic);
  bgm.addEventListener("error", () => {
    toast("音乐加载失败，可点页脚的网易云链接收听。");
  });

  // 尝试进入页面即播放；被浏览器拦截时，第一次触摸/点击会自动补播。
  (async () => {
    if (!(await playMusic())) armGestureUnlock();
  })();

  /* ---------- transition ---------- */

  async function enterWorld() {
    interlude.classList.add("is-on");
    setMood("world");
    input.placeholder = "雪已经落定了";
    await wait(2300);
    showScreen("world");
    world.scrollTop = 0;
    await wait(1100);
    interlude.classList.remove("is-on");
    window.setTimeout(() => {
      app.dataset.mood = "calm";
    }, 900);
  }

  /* ---------- screen 3 : the world ---------- */

  const tabs = Array.from(document.querySelectorAll(".tab"));
  const panels = Array.from(document.querySelectorAll(".panel"));

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      tabs.forEach((item) => {
        const active = item === tab;
        item.classList.toggle("is-active", active);
        item.setAttribute("aria-selected", String(active));
      });
      panels.forEach((panel) => {
        panel.classList.toggle("is-active", panel.dataset.panel === tab.dataset.tab);
      });
    });
  });

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (error) {
      const helper = document.createElement("textarea");
      helper.value = text;
      helper.setAttribute("readonly", "");
      helper.style.cssText = "position:fixed;top:0;left:0;opacity:0;pointer-events:none;";
      document.body.appendChild(helper);
      helper.select();
      let ok = false;
      try {
        ok = document.execCommand("copy");
      } catch (err) {
        ok = false;
      }
      helper.remove();
      return ok;
    }
  }

  document.querySelectorAll("[data-copy]").forEach((button) => {
    button.addEventListener("click", async () => {
      const value = button.dataset.copy;
      const ok = await copyText(value);
      toast(ok ? `已复制 ${value}` : "复制失败，请长按选择");
    });
  });

  document.querySelectorAll("[data-soon]").forEach((button) => {
    button.addEventListener("click", () => {
      toast("还在整理，雪停之前会好的。");
    });
  });

  document.getElementById("replay").addEventListener("click", () => {
    document.body.style.transition = "opacity .35s ease";
    document.body.style.opacity = "0";
    window.setTimeout(() => window.location.reload(), 360);
  });

  /* ---------- expose a tiny preview hook ---------- */

  window.__snow = {
    showScreen,
    setMood,
    get noIndex() {
      return noIndex;
    },
  };
})();
