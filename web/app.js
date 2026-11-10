/**
 * app.js — Dasbor visual simulasi Federated Learning (demo mode)
 * Menampilkan 1 Server + 3 Klien dengan animasi interaksi dalam bahasa Indonesia.
 */

(function () {
  const canvas = document.getElementById("simCanvas");
  const ctx = canvas.getContext("2d");

  // --- Elemen DOM ---
  const elRoundNum = document.getElementById("roundNum");
  const elStatus = document.getElementById("statusText");
  const elValLoss = document.getElementById("val-loss");
  const elValAcc = document.getElementById("val-acc");
  const elValClients = document.getElementById("val-clients");
  const elValPhase = document.getElementById("val-phase");
  const elLog = document.getElementById("log");
  const btnStart = document.getElementById("btn-start");
  const btnStop = document.getElementById("btn-stop");
  const btnReset = document.getElementById("btn-reset");
  const chipMode = document.getElementById("chip-mode");

  // --- Konfigurasi simulasi ---
  const TOTAL_ROUNDS = 5;
  const NUM_CLIENTS = 3;
  const CLIENT_RADIUS = 46;
  const SERVER_RADIUS = 62;
  const BASE_SPEED = 1.0; // detik per fase (dikalikan dengan speed factor)

  // Warna node
  const C_SERVER = "#22d3ee";
  const C_CLIENT_IDLE = "#a78bfa";
  const C_CLIENT_ACTIVE = "#34d399";
  const C_CLIENT_SENDING = "#fbbf24";
  const C_ARROW_IDLE = "#475569";
  const C_ARROW_ACTIVE = "#fbbf24";

  // Posisi node (koordinat canvas)
  const CX = canvas.width / 2;
  const CY = canvas.height / 2;
  const SERVER_POS = { x: CX, y: CY };
  const CLIENT_ANGLES = [-Math.PI / 2 - 0.8, -Math.PI / 2 + 0.8, Math.PI / 2]; // kiri atas, kanan atas, bawah
  const CLIENT_DIST = 340;

  // --- State simulasi ---
  let state = {
    running: false,
    round: 0,
    phase: "idle", // idle | broadcast | training | upload | aggregate | done
    speedFactor: 1.0,
    clients: [],
    server: { x: SERVER_POS.x, y: SERVER_POS.y, r: SERVER_RADIUS, active: false },
    loss: null,
    acc: null,
    animTime: 0,
    phaseTimer: 0,
    phaseDuration: 0,
    logs: [],
    particles: [], // titik animasi panah
  };

  // Inisialisasi klien
  for (let i = 0; i < NUM_CLIENTS; i++) {
    const ang = CLIENT_ANGLES[i];
    state.clients.push({
      id: i + 1,
      x: SERVER_POS.x + Math.cos(ang) * CLIENT_DIST,
      y: SERVER_POS.y + Math.sin(ang) * CLIENT_DIST,
      r: CLIENT_RADIUS,
      color: C_CLIENT_IDLE,
      active: false,
      sending: false,
      loss: null,
      acc: null,
    });
  }

  // --- Utilitas ---
  function nowStr() {
    const d = new Date();
    return d.toLocaleTimeString("id-ID", { hour12: false });
  }

  function log(msg, type = "info") {
    const entry = document.createElement("div");
    entry.className = `log-entry log-${type}`;
    entry.textContent = `[${nowStr()}] ${msg}`;
    elLog.prepend(entry);
    if (elLog.children.length > 200) elLog.lastChild.remove();
  }

  function setStatus(msg) {
    elStatus.textContent = msg;
  }

  function setPhase(phase) {
    state.phase = phase;
    const labels = {
      idle: "Siaga",
      broadcast: "Server mengirim model ke klien",
      training: "Klien melakukan pelatihan lokal",
      upload: "Klien mengirim update ke server",
      aggregate: "Server menggabungkan model (FedAvg)",
      done: "Simulasi selesai",
    };
    elValPhase.textContent = labels[phase] || phase;
  }

  function randomRange(min, max) {
    return Math.random() * (max - min) + min;
  }

  function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
  }

  // --- Animasi partikel panah ---
  class Particle {
    constructor(x1, y1, x2, y2, color, speed) {
      this.x1 = x1;
      this.y1 = y1;
      this.x2 = x2;
      this.y2 = y2;
      this.color = color;
      this.speed = speed;
      this.t = 0;
      this.finished = false;
    }
    step(dt) {
      this.t += dt * this.speed;
      if (this.t >= 1) {
        this.t = 1;
        this.finished = true;
      }
    }
    draw(ctx) {
      const x = this.x1 + (this.x2 - this.x1) * this.t;
      const y = this.y1 + (this.y2 - this.y1) * this.t;
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(x, y, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function spawnParticles(from, to, color, count = 14, speed = 1.6) {
    for (let i = 0; i < count; i++) {
      // Stagger waktu mulai
      const p = new Particle(from.x, from.y, to.x, to.y, color, speed);
      p.t = (i / count) * 0.35; // tersebar sedikit
      state.particles.push(p);
    }
  }

  // Garis antara dua titik dengan panah
  function drawArrow(from, to, color, width = 2.5, alpha = 1) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();

    // Panah di ujung
    const headLen = 14;
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const ang = Math.atan2(dy, dx);
    ctx.beginPath();
    ctx.moveTo(to.x, to.y);
    ctx.lineTo(to.x - headLen * Math.cos(ang - Math.PI / 6), to.y - headLen * Math.sin(ang - Math.PI / 6));
    ctx.moveTo(to.x, to.y);
    ctx.lineTo(to.x - headLen * Math.cos(ang + Math.PI / 6), to.y - headLen * Math.sin(ang + Math.PI / 6));
    ctx.stroke();
    ctx.restore();
  }

  // Lingkaran node
  function drawNode(x, y, r, fill, stroke, label, sub) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = fill;
    ctx.fill();
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 3;
      ctx.stroke();
    }

    // Glow saat aktif
    if (stroke) {
      ctx.shadowColor = stroke;
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();

    // Teks
    ctx.fillStyle = "#0b1120";
    ctx.font = "bold 15px Inter";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label, x, y - 4);
    if (sub) {
      ctx.fillStyle = "#334155";
      ctx.font = "11px Inter";
      ctx.fillText(sub, x, y + 16);
    }
  }

  // Label klien di luar lingkaran
  function drawClientLabel(c) {
    ctx.save();
    ctx.fillStyle = c.active ? "#86efac" : "#c4b5fd";
    ctx.font = "bold 13px Inter";
    ctx.textAlign = "center";
    ctx.fillText(`Klien ${c.id}`, c.x, c.y - c.r - 14);
    ctx.restore();
  }

  // --- Logika mesin fase simulasi ---
  const PHASES = ["broadcast", "training", "upload", "aggregate"];
  const PHASE_DURATION = {
    broadcast: 1.6,
    training: 3.2,
    upload: 1.6,
    aggregate: 1.6,
  };

  function nextPhase() {
    if (!state.running) return;
    const idx = PHASES.indexOf(state.phase);
    if (idx === -1) {
      // Mulai ronde baru dari broadcast
      state.round += 1;
      if (state.round > TOTAL_ROUNDS) {
        finishSimulation();
        return;
      }
      elRoundNum.textContent = `${state.round} / ${TOTAL_ROUNDS}`;
      setPhase("broadcast");
      state.phaseTimer = 0;
      state.phaseDuration = PHASE_DURATION.broadcast;
      log(`Ronde ${state.round} dimulai — server mendistribusikan model global.`, "server");
      spawnParticles(SERVER_POS, state.clients[0], C_ARROW_ACTIVE, 40, 2.2);
      state.clients.forEach((c) => {
        c.active = true;
        c.color = C_CLIENT_IDLE;
        c.sending = false;
      });
      state.server.active = true;
      return;
    }

    const next = PHASES[idx + 1];
    setPhase(next);
    state.phaseTimer = 0;
    state.phaseDuration = PHASE_DURATION[next];

    if (next === "training") {
      log("Semua klien melatih model secara lokal (3 epoch).", "client");
      state.clients.forEach((c) => {
        c.color = C_CLIENT_ACTIVE;
        c.active = true;
        c.sending = false;
      });
      state.server.active = false;
    } else if (next === "upload") {
      log("Klien mengirimkan parameter model hasil pelatihan ke server.", "client-active");
      state.clients.forEach((c) => {
        c.color = C_CLIENT_SENDING;
        c.sending = true;
      });
      spawnParticles(state.clients[0], SERVER_POS, C_ARROW_ACTIVE, 40, 2.2);
    } else if (next === "aggregate") {
      log("Server menggabungkan update dari 3 klien dengan FedAvg.", "agg");
      state.clients.forEach((c) => {
        c.sending = false;
        c.active = false;
        c.color = C_CLIENT_IDLE;
      });
      state.server.active = true;
      // Hasilkan metrik simulasi
      state.loss = randomRange(0.12, 0.45).toFixed(4);
      state.acc = randomRange(0.78, 0.94).toFixed(4);
      elValLoss.textContent = state.loss;
      elValAcc.textContent = state.acc;
      elValClients.textContent = `3 / 3`;
      setTimeout(() => {
        log(`Ronde ${state.round} selesai — Loss: ${state.loss}, Akurasi: ${state.acc}`, "success");
      }, 400);
    }
  }

  function finishSimulation() {
    state.running = false;
    state.phase = "done";
    setPhase("done");
    setStatus("Simulasi selesai — semua 5 ronde telah dijalankan.");
    log("Simulasi selesai. Model global telah dihasilkan.", "success");
    btnStart.disabled = false;
    btnStop.disabled = true;
    chipMode.textContent = "Demo Mode (Selesai)";
    chipMode.style.color = "#86efac";
  }

  function resetSimulation() {
    state.running = false;
    state.round = 0;
    state.phase = "idle";
    state.animTime = 0;
    state.phaseTimer = 0;
    state.phaseDuration = 0;
    state.loss = null;
    state.acc = null;
    state.particles = [];
    elRoundNum.textContent = "0 / 5";
    elValLoss.textContent = "-";
    elValAcc.textContent = "-";
    elValClients.textContent = "0 / 3";
    elValPhase.textContent = "Idle";
    setStatus("Siap. Klik Mulai Simulasi.");
    state.clients.forEach((c) => {
      c.active = false;
      c.sending = false;
      c.color = C_CLIENT_IDLE;
      c.loss = null;
      c.acc = null;
    });
    state.server.active = false;
    btnStart.disabled = false;
    btnStop.disabled = true;
    chipMode.textContent = "Demo Mode";
    chipMode.style.color = "";
    log("Simulasi direset.", "info");
  }

  function startSimulation() {
    if (state.running) return;
    state.running = true;
    btnStart.disabled = true;
    btnStop.disabled = false;
    chipMode.textContent = "Demo Mode (Berjalan)";
    chipMode.style.color = "#38bdf8";
    log("Simulasi dimulai — 1 server, 3 klien.", "server");
    // Awal langsung broadcast ronde 1
    nextPhase();
  }

  function stopSimulation() {
    if (!state.running) return;
    state.running = false;
    btnStart.disabled = false;
    btnStop.disabled = true;
    log("Simulasi dihentikan oleh pengguna.", "info");
  }

  // --- Event tombol ---
  btnStart.addEventListener("click", startSimulation);
  btnStop.addEventListener("click", stopSimulation);
  btnReset.addEventListener("click", resetSimulation);

  // --- Loop render ---
  let last = performance.now();
  function loop(t) {
    const dt = (t - last) / 1000;
    last = t;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Garis koneksi server-klien (selalu tampil samar)
    state.clients.forEach((c) => {
      drawArrow(SERVER_POS, { x: c.x, y: c.y }, C_ARROW_IDLE, 1.5, 0.35);
    });

    // Gambar node klien
    state.clients.forEach((c) => {
      const glow = c.active || c.sending;
      drawNode(c.x, c.y, c.r, c.color, glow ? c.color : null, `K${c.id}`, c.sending ? "↑" : "");
      drawClientLabel(c);
    });

    // Gambar node server
    drawNode(
      state.server.x,
      state.server.y,
      state.server.r,
      state.server.active ? "#81e6d9" : C_SERVER,
      state.server.active ? C_SERVER : null,
      "SERVER",
      "FedAvg"
    );

    // Partikel animasi
    state.particles.forEach((p, i) => {
      p.step(dt);
      p.draw(ctx);
      if (p.finished) state.particles.splice(i, 1);
    });

    // Mesin fase
    if (state.running && state.phaseTimer !== undefined) {
      state.phaseTimer += dt;
      if (state.phaseTimer >= state.phaseDuration) {
        nextPhase();
      }
    }

    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();
