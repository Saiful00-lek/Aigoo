(() => {
  const canvas = document.getElementById("game");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  const scoreEl  = document.getElementById("score");
  const bestEl   = document.getElementById("best");
  const overlay  = document.getElementById("overlay");
  const overlayTitle = document.getElementById("overlayTitle");
  const overlaySub   = document.getElementById("overlaySub");
  const btnStart   = document.getElementById("btnStart");
  const btnRestart = document.getElementById("btnRestart");

  // ===== Responsive =====
  function fitCanvas() {
    const wrap = canvas.parentElement;
    const maxW = Math.min(520, wrap.clientWidth);
    const w = Math.max(280, maxW);
    const h = Math.round(w * (4 / 3));
    canvas.style.width  = w + "px";
    canvas.style.height = h + "px";
  }
  window.addEventListener("resize", fitCanvas);
  fitCanvas();

  const W = canvas.width;
  const H = canvas.height;

  // ===== Constants (smoother physics) =====
  const GRAVITY    = 0.32;
  const FLAP_VY    = -6.8;
  const PIPE_SPEED = 2.2;
  const PIPE_GAP   = 200;
  const PIPE_W     = 66;
  const PIPE_SPAWN_MS = 1450;
  const GROUND_H   = 85;

  // ===== State =====
  let running = false, gameOver = false, paused = false;
  let score = 0;
  let best  = Number(localStorage.getItem("flappy_best") || "0");
  bestEl.textContent = String(best);

  // ===== Bird =====
  const bird = { x: 130, y: H * .45, r: 17, vy: 0, rot: 0, flap: 0 };

  // ===== Pipes =====
  let pipes = [], lastSpawn = 0;

  // ===== Parallax clouds =====
  const clouds = Array.from({ length: 5 }, (_, i) => ({
    x: Math.random() * W,
    y: 60 + Math.random() * 160,
    w: 80 + Math.random() * 80,
    speed: .25 + Math.random() * .35,
    alpha: .15 + Math.random() * .18
  }));

  function reset() {
    running = gameOver = paused = false;
    score = 0;
    scoreEl.textContent = "0";
    bird.y = H * .45; bird.vy = 0; bird.rot = 0; bird.flap = 0;
    pipes = []; lastSpawn = 0;
    overlay.style.display = "flex";
    overlayTitle.textContent = "Tap untuk mulai";
    overlaySub.textContent   = "Space / klik / tap untuk terbang";
    btnStart.style.display   = "inline-flex";
    btnRestart.style.display = "none";
  }

  function start() {
    running = true; gameOver = false; paused = false;
    overlay.style.display = "none";
    flap();
  }

  function end() {
    running = false; gameOver = true;
    if (score > best) {
      best = score;
      localStorage.setItem("flappy_best", String(best));
      bestEl.textContent = String(best);
    }
    overlay.style.display = "flex";
    overlayTitle.textContent = score > 0 ? `${score} poin! 🎉` : "Game Over";
    overlaySub.textContent   = `Skor kamu: ${score} · Best: ${best}`;
    btnStart.style.display   = "none";
    btnRestart.style.display = "inline-flex";
  }

  function togglePause() {
    if (!running || gameOver) return;
    paused = !paused;
    if (paused) {
      overlay.style.display = "flex";
      overlayTitle.textContent = "Pause ☕";
      overlaySub.textContent   = "Tekan P untuk lanjut";
      btnStart.style.display = btnRestart.style.display = "none";
    } else {
      overlay.style.display = "none";
    }
  }

  function flap() {
    if (gameOver) return;
    if (!running) { start(); return; }
    if (paused) return;
    bird.vy  = FLAP_VY;
    bird.flap = 1; // wing animation flag
  }

  // ===== Input =====
  window.addEventListener("keydown", e => {
    if (e.code === "Space") { e.preventDefault(); flap(); }
    if (e.key?.toLowerCase() === "p") togglePause();
    if (e.key?.toLowerCase() === "r" && gameOver) { reset(); start(); }
  });

  canvas.addEventListener("pointerdown", e => { e.preventDefault(); flap(); }, { passive: false });
  btnStart.addEventListener("click", () => start());
  btnRestart.addEventListener("click", () => { reset(); start(); });
  overlay.addEventListener("click", e => { if (e.target === overlay) start(); });

  // ===== Helpers =====
  const rand = (a, b) => Math.random() * (b - a) + a;

  function spawnPipe(t) {
    const marginTop = 65, marginBottom = GROUND_H + 65;
    const topH   = rand(marginTop, H - marginBottom - PIPE_GAP);
    const bottomY = topH + PIPE_GAP;
    pipes.push({ x: W + 10, topH, bottomY, passed: false });
    lastSpawn = t;
  }

  function circleRect(cx, cy, r, rx, ry, rw, rh) {
    const nearX = Math.max(rx, Math.min(cx, rx + rw));
    const nearY = Math.max(ry, Math.min(cy, ry + rh));
    const dx = cx - nearX, dy = cy - nearY;
    return dx * dx + dy * dy <= r * r;
  }

  // ===== Draw helpers =====
  function drawBg(t) {
    // warm parchment sky
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, "#f8e8d4");
    sky.addColorStop(1, "#f2d4bc");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    // parallax clouds
    ctx.save();
    for (const c of clouds) {
      if (running && !paused) c.x -= c.speed;
      if (c.x + c.w < 0) c.x = W + c.w;
      ctx.globalAlpha = c.alpha;
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.ellipse(c.x,       c.y,      c.w * .55, c.w * .28, 0, 0, Math.PI * 2);
      ctx.ellipse(c.x + c.w*.22, c.y - c.w*.1, c.w*.36, c.w*.22, 0, 0, Math.PI * 2);
      ctx.ellipse(c.x - c.w*.22, c.y - c.w*.08, c.w*.3, c.w*.18, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // ground gradient
    const gr = ctx.createLinearGradient(0, H - GROUND_H, 0, H);
    gr.addColorStop(0, "rgba(220,190,155,.9)");
    gr.addColorStop(1, "rgba(180,145,110,.95)");
    ctx.fillStyle = gr;
    ctx.fillRect(0, H - GROUND_H, W, GROUND_H);

    // ground texture lines
    ctx.strokeStyle = "rgba(160,120,80,.18)";
    ctx.lineWidth = 1;
    for (let x = (t * .4) % 44; x < W; x += 44) {
      ctx.beginPath();
      ctx.moveTo(x, H - GROUND_H);
      ctx.lineTo(x - 22, H);
      ctx.stroke();
    }

    // ground top line
    ctx.strokeStyle = "rgba(120,80,50,.22)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, H - GROUND_H);
    ctx.lineTo(W, H - GROUND_H);
    ctx.stroke();
  }

  function drawPipes() {
    for (const p of pipes) {
      // shadow
      ctx.save();
      ctx.shadowBlur = 12;
      ctx.shadowColor = "rgba(80,40,20,.18)";

      // pipe body gradient
      const grad = (y1, y2) => {
        const g = ctx.createLinearGradient(p.x, 0, p.x + PIPE_W, 0);
        g.addColorStop(0,   "rgba(235,215,185,.95)");
        g.addColorStop(.35, "rgba(250,235,210,.98)");
        g.addColorStop(1,   "rgba(210,180,145,.90)");
        return g;
      };

      // top pipe
      ctx.fillStyle = grad();
      ctx.beginPath();
      ctx.roundRect(p.x, 0, PIPE_W, p.topH, [0,0,6,6]);
      ctx.fill();

      // top cap
      const capGrad = ctx.createLinearGradient(p.x - 7, 0, p.x + PIPE_W + 7, 0);
      capGrad.addColorStop(0,   "rgba(220,195,160,.95)");
      capGrad.addColorStop(.4,  "rgba(248,230,205,1)");
      capGrad.addColorStop(1,   "rgba(200,168,130,.92)");
      ctx.fillStyle = capGrad;
      ctx.beginPath();
      ctx.roundRect(p.x - 7, p.topH - 22, PIPE_W + 14, 22, [4,4,8,8]);
      ctx.fill();

      // bottom pipe
      ctx.fillStyle = grad();
      ctx.beginPath();
      ctx.roundRect(p.x, p.bottomY, PIPE_W, H - GROUND_H - p.bottomY, [6,6,0,0]);
      ctx.fill();

      // bottom cap
      ctx.fillStyle = capGrad;
      ctx.beginPath();
      ctx.roundRect(p.x - 7, p.bottomY, PIPE_W + 14, 22, [8,8,4,4]);
      ctx.fill();

      // highlight stripe
      ctx.globalAlpha = .3;
      ctx.fillStyle = "#fff";
      ctx.fillRect(p.x + 10, 0, 6, p.topH - 22);
      ctx.fillRect(p.x + 10, p.bottomY + 22, 6, H - GROUND_H - p.bottomY - 22);
      ctx.restore();
    }
  }

  function drawBird(t) {
    bird.rot = Math.max(-.65, Math.min(1.2, bird.vy * .075));
    if (bird.flap > 0) bird.flap -= .08;

    ctx.save();
    ctx.translate(bird.x, bird.y);
    ctx.rotate(bird.rot);

    // shadow
    ctx.save();
    ctx.globalAlpha = .15;
    ctx.fillStyle = "#5a3a2a";
    ctx.beginPath();
    ctx.ellipse(0, bird.r + 4, bird.r * .8, bird.r * .3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // body
    const bodyGrad = ctx.createRadialGradient(-4, -4, 2, 0, 0, bird.r);
    bodyGrad.addColorStop(0,   "rgba(255,255,255,1)");
    bodyGrad.addColorStop(.55, "rgba(253,240,225,.97)");
    bodyGrad.addColorStop(1,   "rgba(235,210,185,.93)");
    ctx.fillStyle = bodyGrad;
    ctx.shadowBlur = 10;
    ctx.shadowColor = "rgba(140,80,40,.25)";
    ctx.beginPath();
    ctx.arc(0, 0, bird.r, 0, Math.PI * 2);
    ctx.fill();

    // wing flap
    const wingAngle = Math.sin(t * .012) * .4 + (bird.flap > 0 ? .4 : 0);
    ctx.fillStyle = "rgba(235,200,160,.75)";
    ctx.save();
    ctx.rotate(-wingAngle * .6);
    ctx.beginPath();
    ctx.ellipse(-bird.r * .55, 2, bird.r * .55, bird.r * .28, -.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // heart mark
    ctx.fillStyle = "rgba(180,55,80,.78)";
    ctx.beginPath();
    ctx.arc(-5.5, -3, 4.5, 0, Math.PI * 2);
    ctx.arc(0,    -3, 4.5, 0, Math.PI * 2);
    ctx.lineTo(-2.5, 7);
    ctx.closePath();
    ctx.fill();

    // eye
    ctx.fillStyle = "rgba(40,20,10,.75)";
    ctx.beginPath();
    ctx.arc(7, -4.5, 2.5, 0, Math.PI * 2);
    ctx.fill();
    // eye shine
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(8, -5.5, 1, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  function drawScore() {
    // score shadow
    ctx.font = "bold 30px 'Playfair Display', Georgia, serif";
    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(80,40,20,.18)";
    ctx.fillText(String(score), W / 2 + 1, 63);
    ctx.fillStyle = "rgba(44,24,16,.65)";
    ctx.fillText(String(score), W / 2, 62);
  }

  // ===== Update =====
  function update(t) {
    if (!running || paused) return;
    if (t - lastSpawn > PIPE_SPAWN_MS) spawnPipe(t);

    bird.vy += GRAVITY;
    bird.y  += bird.vy;

    for (const p of pipes) p.x -= PIPE_SPEED;
    pipes = pipes.filter(p => p.x > -PIPE_W - 20);

    for (const p of pipes) {
      if (!p.passed && p.x + PIPE_W < bird.x) {
        p.passed = true; score++; scoreEl.textContent = String(score);
      }
    }

    if (bird.y - bird.r < 0) { bird.y = bird.r; bird.vy = 0; }
    if (bird.y + bird.r > H - GROUND_H) { end(); return; }

    for (const p of pipes) {
      if (
        circleRect(bird.x, bird.y, bird.r - 2, p.x, 0, PIPE_W, p.topH) ||
        circleRect(bird.x, bird.y, bird.r - 2, p.x, p.bottomY, PIPE_W, H - GROUND_H - p.bottomY)
      ) { end(); return; }
    }
  }

  // ===== Loop =====
  function loop(t) {
    drawBg(t);
    drawPipes();
    drawBird(t);
    drawScore();

    if (!running && !gameOver) {
      ctx.font = "15px 'DM Sans', system-ui";
      ctx.fillStyle = "rgba(44,24,16,.45)";
      ctx.textAlign = "center";
      ctx.fillText("Tap · Space untuk mulai", W / 2, H - 120);
    }

    update(t);
    requestAnimationFrame(loop);
  }

  reset();
  requestAnimationFrame(loop);
})();
