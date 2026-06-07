window.addEventListener("DOMContentLoaded", () => {
  const SIZE = 10;

  const gridEl  = document.getElementById("bbGrid");
  const scoreEl = document.getElementById("bbScore");
  const bestEl  = document.getElementById("bbBest");
  const hintEl  = document.getElementById("bbHint");

  const pieceEls = [
    document.getElementById("piece0"),
    document.getElementById("piece1"),
    document.getElementById("piece2"),
  ];
  const btnNew = document.getElementById("bbNew");

  if (!gridEl || !scoreEl || !bestEl || !hintEl || pieceEls.some(x => !x) || !btnNew) return;

  // ===== State =====
  let board    = Array.from({ length: SIZE }, () => Array(SIZE).fill(null));
  let score    = 0;
  let best     = Number(localStorage.getItem("bb_best") || "0");
  bestEl.textContent = String(best);

  const SHAPES = [
    [[0,0]],
    [[0,0],[1,0]],
    [[0,0],[0,1]],
    [[0,0],[1,0],[2,0]],
    [[0,0],[0,1],[0,2]],
    [[0,0],[1,0],[0,1],[1,1]],
    [[0,0],[1,0],[2,0],[3,0]],
    [[0,0],[0,1],[0,2],[0,3]],
    [[0,0],[1,0],[2,0],[0,1],[1,1],[2,1]],
    [[0,0],[0,1],[0,2],[1,2]],
    [[1,0],[1,1],[1,2],[0,2]],
    [[0,0],[1,0],[1,1],[2,1]],
    [[1,0],[2,0],[0,1],[1,1]],
    [[0,0],[1,0],[2,0],[1,1]],
    [[0,0],[1,0],[0,1]],
    [[0,0],[0,1],[1,1]],
    [[1,0],[0,1],[1,1]],
  ];

  const COLORS = ["var(--bb1)","var(--bb2)","var(--bb3)","var(--bb4)","var(--bb5)","var(--bb6)"];
  const pickColor = () => COLORS[Math.floor(Math.random() * COLORS.length)];

  let tray = [null, null, null];
  let selected = -1;

  // ===== Build Grid =====
  function buildGrid() {
    gridEl.innerHTML = "";
    for (let i = 0; i < SIZE * SIZE; i++) {
      const cell = document.createElement("div");
      cell.className = "bb-cell";
      cell.dataset.idx = String(i);
      gridEl.appendChild(cell);
    }
  }

  function renderBoard() {
    const cells = gridEl.querySelectorAll(".bb-cell");
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        const idx   = r * SIZE + c;
        const color = board[r][c];
        const el    = cells[idx];
        if (color) {
          el.classList.add("filled");
          el.style.setProperty("--bb-color", color);
        } else {
          el.classList.remove("filled");
          el.style.removeProperty("--bb-color");
        }
      }
    }
  }

  function pickShape() {
    const s    = SHAPES[Math.floor(Math.random() * SHAPES.length)];
    const minX = Math.min(...s.map(p => p[0]));
    const minY = Math.min(...s.map(p => p[1]));
    return s.map(([x, y]) => [x - minX, y - minY]);
  }

  function setHint(msg) { hintEl.textContent = msg; }

  function newTray() {
    tray = [0,1,2].map(() => ({ shape: pickShape(), color: pickColor(), used: false }));
    selected = -1;
    renderTray();
    setHint("Pilih shape dulu.");
  }

  function renderTray() {
    pieceEls.forEach((el, i) => {
      const item = tray[i];
      el.innerHTML = "";
      el.style.setProperty("--bb-color", item.color);
      el.classList.toggle("used",     item.used);
      el.classList.toggle("selected", selected === i);

      const shape = item.shape;
      const maxX  = Math.max(...shape.map(p => p[0]));
      const maxY  = Math.max(...shape.map(p => p[1]));

      const mini = document.createElement("div");
      mini.className = "bb-mini";
      mini.style.setProperty("--bb-color", item.color);
      mini.style.gridTemplateColumns = `repeat(${maxX + 1}, 13px)`;
      mini.style.gridTemplateRows    = `repeat(${maxY + 1}, 13px)`;

      const filled = new Set(shape.map(([x, y]) => `${x},${y}`));
      for (let y = 0; y <= maxY; y++) {
        for (let x = 0; x <= maxX; x++) {
          const m = document.createElement("div");
          m.className = "bb-mini-cell";
          if (filled.has(`${x},${y}`)) m.classList.add("on");
          mini.appendChild(m);
        }
      }
      el.appendChild(mini);
    });
  }

  // ===== Core Logic =====
  function canPlace(shape, baseR, baseC) {
    for (const [dx, dy] of shape) {
      const r = baseR + dy, c = baseC + dx;
      if (r < 0 || r >= SIZE || c < 0 || c >= SIZE) return false;
      if (board[r][c] !== null) return false;
    }
    return true;
  }

  function popCells(indices) {
    const cells = gridEl.querySelectorAll(".bb-cell");
    indices.forEach(idx => {
      cells[idx]?.classList.add("pop");
      setTimeout(() => cells[idx]?.classList.remove("pop"), 350);
    });
  }

  function place(shape, baseR, baseC, color) {
    const placed = [];
    for (const [dx, dy] of shape) {
      board[baseR + dy][baseC + dx] = color;
      placed.push((baseR + dy) * SIZE + (baseC + dx));
    }
    score += shape.length;
    scoreEl.textContent = String(score);
    popCells(placed);
    clearLines();
    renderBoard();
    if (score > best) {
      best = score;
      localStorage.setItem("bb_best", String(best));
      bestEl.textContent = String(best);
    }
  }

  function clearLines() {
    let cleared = 0;
    const clearedIdxs = [];

    for (let r = 0; r < SIZE; r++) {
      if (board[r].every(v => v !== null)) {
        for (let c = 0; c < SIZE; c++) clearedIdxs.push(r * SIZE + c);
        board[r] = Array(SIZE).fill(null);
        cleared++;
      }
    }

    for (let c = 0; c < SIZE; c++) {
      let full = true;
      for (let r = 0; r < SIZE; r++) { if (board[r][c] === null) { full = false; break; } }
      if (full) {
        for (let r = 0; r < SIZE; r++) {
          clearedIdxs.push(r * SIZE + c);
          board[r][c] = null;
        }
        cleared++;
      }
    }

    if (cleared > 0) {
      popCells(clearedIdxs);
      score += cleared * 12;
      scoreEl.textContent = String(score);
      const msgs = ["Nice! 🎉","Combo! ✦","Bersih! 🔥","Great! ⭐"];
      setHint(`${msgs[Math.floor(Math.random()*msgs.length)]} +${cleared * 12} bonus`);
    }
  }

  function trayAllUsed() { return tray.every(t => t.used); }

  // ===== Preview =====
  function clearPreview() {
    gridEl.querySelectorAll(".bb-cell.preview-ok, .bb-cell.preview-bad")
      .forEach(c => c.classList.remove("preview-ok", "preview-bad"));
  }

  function showPreview(item, baseR, baseC) {
    clearPreview();
    const cells = gridEl.querySelectorAll(".bb-cell");
    const ok  = canPlace(item.shape, baseR, baseC);
    const cls = ok ? "preview-ok" : "preview-bad";
    for (const [dx, dy] of item.shape) {
      const r = baseR + dy, c = baseC + dx;
      if (r < 0 || r >= SIZE || c < 0 || c >= SIZE) continue;
      cells[r * SIZE + c]?.classList.add(cls);
    }
  }

  // ===== Cell Detection =====
  function getCellFromPoint(clientX, clientY) {
    const el   = document.elementFromPoint(clientX, clientY);
    const cell = el ? el.closest(".bb-cell") : null;
    if (!cell) return null;
    const idx = Number(cell.dataset.idx);
    if (Number.isNaN(idx)) return null;
    return { r: Math.floor(idx / SIZE), c: idx % SIZE };
  }

  // ===== Click to Place =====
  pieceEls.forEach((el, i) => {
    el.addEventListener("click", () => {
      if (tray[i].used) return;
      selected = (selected === i ? -1 : i);
      renderTray();
      setHint(selected === -1 ? "Pilih shape dulu." : "Tap papan untuk taruh.");
    });
  });

  gridEl.addEventListener("click", e => {
    const cell = e.target.closest(".bb-cell");
    if (!cell) return;
    if (selected === -1) return setHint("Pilih shape dulu.");
    const item = tray[selected];
    if (item.used) return;
    const idx = Number(cell.dataset.idx);
    const r = Math.floor(idx / SIZE), c = idx % SIZE;
    if (!canPlace(item.shape, r, c)) return setHint("Nggak muat di situ. 😅");
    place(item.shape, r, c, item.color);
    item.used = true;
    selected  = -1;
    renderTray();
    if (trayAllUsed()) newTray();
    else setHint("Ambil shape lagi.");
  });

  // ===== Drag & Drop (improved) =====
  let dragIndex = -1, ghost = null;

  function buildGhost(item) {
    if (ghost) ghost.remove();
    ghost = document.createElement("div");
    ghost.className = "bb-ghost";

    const shape = item.shape;
    const maxX  = Math.max(...shape.map(p => p[0]));
    const maxY  = Math.max(...shape.map(p => p[1]));

    const mini = document.createElement("div");
    mini.className = "bb-mini";
    mini.style.gridTemplateColumns = `repeat(${maxX + 1}, 18px)`;
    mini.style.gridTemplateRows    = `repeat(${maxY + 1}, 18px)`;
    mini.style.gap = "4px";
    mini.style.setProperty("--bb-color", item.color);

    const filled = new Set(shape.map(([x, y]) => `${x},${y}`));
    for (let y = 0; y <= maxY; y++) {
      for (let x = 0; x <= maxX; x++) {
        const m = document.createElement("div");
        m.className = "bb-mini-cell";
        if (filled.has(`${x},${y}`)) m.classList.add("on");
        mini.appendChild(m);
      }
    }

    ghost.appendChild(mini);
    document.body.appendChild(ghost);
  }

  function moveGhost(clientX, clientY) {
    if (!ghost) return;
    ghost.style.left = clientX + "px";
    ghost.style.top  = clientY + "px";
  }

  function getGhostCenter() {
    if (!ghost) return null;
    const r = ghost.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }

  function endDrag() {
    clearPreview();
    dragIndex = -1;
    pieceEls.forEach(el => el.classList.remove("dragging"));
    if (ghost) { ghost.remove(); ghost = null; }
  }

  function dropAt(clientX, clientY) {
    if (dragIndex === -1) return;
    const item = tray[dragIndex];
    if (!item || item.used) return;
    const center = getGhostCenter();
    const pos    = center ? getCellFromPoint(center.x, center.y) : getCellFromPoint(clientX, clientY);
    if (!pos) return setHint("Taruh di papan ya.");
    const { r, c } = pos;
    if (!canPlace(item.shape, r, c)) return setHint("Nggak muat di situ. 😅");
    place(item.shape, r, c, item.color);
    item.used = true;
    renderTray(); renderBoard();
    if (trayAllUsed()) newTray();
    else setHint("Ambil shape lagi.");
  }

  pieceEls.forEach((el, i) => {
    el.addEventListener("pointerdown", e => {
      e.preventDefault();
      if (tray[i].used) return;
      // If already selected via click, act as click-to-place mode
      if (selected === i) return; // let click handler deal
      dragIndex = i;
      el.classList.add("dragging");
      buildGhost(tray[i]);
      moveGhost(e.clientX, e.clientY);
      setHint("Geser ke papan, lalu lepas.");
      el.setPointerCapture?.(e.pointerId);
    }, { passive: false });
  });

  let dragging = false;

  window.addEventListener("pointermove", e => {
    if (dragIndex === -1) return;
    dragging = true;
    moveGhost(e.clientX, e.clientY);
    const item   = tray[dragIndex];
    const center = getGhostCenter();
    const pos    = center ? getCellFromPoint(center.x, center.y) : getCellFromPoint(e.clientX, e.clientY);
    if (!pos) { clearPreview(); return; }
    showPreview(item, pos.r, pos.c);
  }, { passive: true });

  window.addEventListener("pointerup", e => {
    if (dragIndex === -1) return;
    if (dragging) {
      dropAt(e.clientX, e.clientY);
    }
    dragging = false;
    endDrag();
  });

  btnNew.addEventListener("click", () => newTray());

  // ===== Init =====
  buildGrid();
  renderBoard();
  newTray();
});
