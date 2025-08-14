/* 2048 – Vanilla JS (keyboard + pointer drag)
   - Keyboard (arrows/WASD/HJKL)
   - Pointer drag (mouse/touch/pen) on the board
   - Score + Best (localStorage)
   - Undo (multi-step stack)
   - Simple animations for new/merged tiles
*/

(() => {
  const SIZE = 4;
  const NEW_TILE_CHANCE_4 = 0.1;

  // DOM
  const gridEl = document.getElementById("grid");
  const tilesEl = document.getElementById("tiles");
  const scoreEl = document.getElementById("score");
  const bestEl = document.getElementById("best");
  const newGameBtn = document.getElementById("newGame");
  const undoBtn = document.getElementById("undo");
  const overlay = document.getElementById("overlay");
  const overlayText = document.getElementById("overlayText");
  const keepPlayingBtn = document.getElementById("keepPlaying");
  const tryAgainBtn = document.getElementById("tryAgain");
  const boardEl = document.querySelector(".board");

  // State
  let board = makeEmptyBoard();
  let score = 0;
  let best = Number(localStorage.getItem("best-2048") || 0);
  let reached2048 = false;
  let undoStack = []; // snapshots {board, score}

  // For animations
  let newTileSet = new Set(); // "r-c" of newly spawned tile
  let mergedTileSet = new Set(); // "r-c" of tiles that resulted from a merge

  // Helpers
  function makeEmptyBoard() {
    return Array.from({ length: SIZE }, () => Array(SIZE).fill(0));
  }

  function cloneBoard(b) {
    return b.map((row) => row.slice());
  }

  function emptyCells(b) {
    const cells = [];
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        if (b[r][c] === 0) cells.push([r, c]);
      }
    }
    return cells;
  }

  function randomChoice(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function addRandomTile(b) {
    const empties = emptyCells(b);
    if (!empties.length) return false;
    const [r, c] = randomChoice(empties);
    b[r][c] = Math.random() < NEW_TILE_CHANCE_4 ? 4 : 2;
    newTileSet.add(`${r}-${c}`);
    return true;
  }

  function setupGridBackground() {
    gridEl.innerHTML = "";
    for (let i = 0; i < SIZE * SIZE; i++) {
      const cell = document.createElement("div");
      cell.className = "cell";
      gridEl.appendChild(cell);
    }
  }

  function render() {
    tilesEl.innerHTML = "";
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        const val = board[r][c];
        if (val === 0) continue;
        const tile = document.createElement("div");
        tile.className = [
          "tile",
          `tile-${val <= 2048 ? val : "super"}`,
          newTileSet.has(`${r}-${c}`) ? "tile-new" : "",
          mergedTileSet.has(`${r}-${c}`) ? "tile-merged" : "",
        ]
          .filter(Boolean)
          .join(" ");
        tile.style.gridRowStart = r + 1;
        tile.style.gridColumnStart = c + 1;
        const span = document.createElement("span");
        span.textContent = val;
        tile.appendChild(span);
        tilesEl.appendChild(tile);
      }
    }
    scoreEl.textContent = score;
    bestEl.textContent = best;

    // clear animation sets for next paint cycle
    newTileSet.clear();
    mergedTileSet.clear();
  }

  function saveToStorage() {
    localStorage.setItem("board-2048", JSON.stringify(board));
    localStorage.setItem("score-2048", String(score));
    localStorage.setItem("best-2048", String(best));
    localStorage.setItem("reached2048-flag", reached2048 ? "1" : "0");
  }

  function loadFromStorage() {
    try {
      const b = JSON.parse(localStorage.getItem("board-2048") || "null");
      const s = Number(localStorage.getItem("score-2048") || 0);
      const flag = localStorage.getItem("reached2048-flag") === "1";
      if (
        Array.isArray(b) &&
        b.length === SIZE &&
        b.every((row) => Array.isArray(row) && row.length === SIZE)
      ) {
        board = b;
        score = s;
        reached2048 = flag;
        return true;
      }
    } catch {}
    return false;
  }

  function startNewGame() {
    board = makeEmptyBoard();
    score = 0;
    reached2048 = false;
    undoStack = [];
    newTileSet.clear();
    mergedTileSet.clear();
    addRandomTile(board);
    addRandomTile(board);
    hideOverlay();
    updateBest();
    render();
    saveToStorage();
  }

  function pushUndoSnapshot() {
    undoStack.push({ board: cloneBoard(board), score });
    if (undoStack.length > 20) undoStack.shift(); // cap depth (adjustable)
  }

  function undo() {
    if (!undoStack.length) return;
    const prev = undoStack.pop();
    board = prev.board;
    score = prev.score;
    hideOverlay();
    newTileSet.clear();
    mergedTileSet.clear();
    render();
    saveToStorage();
  }

  function updateBest() {
    if (score > best) {
      best = score;
      localStorage.setItem("best-2048", String(best));
    }
  }

  // Movement core
  function slideAndMerge(line) {
    const original = line.slice();
    const filtered = line.filter((v) => v !== 0);
    const mergedIndices = new Set();
    let i = 0;
    while (i < filtered.length - 1) {
      if (filtered[i] === filtered[i + 1]) {
        filtered[i] *= 2;
        score += filtered[i];
        mergedIndices.add(i);
        filtered.splice(i + 1, 1);
        i += 1;
      } else {
        i += 1;
      }
    }
    while (filtered.length < SIZE) filtered.push(0);
    const changed = filtered.some((v, idx) => v !== original[idx]);
    return { line: filtered, mergedIndices, changed };
  }

  function move(direction) {
    // direction: 'left'|'right'|'up'|'down'
    const before = board.map((r) => r.slice());
    let anyChanged = false;
    mergedTileSet.clear();

    if (direction === "left" || direction === "right") {
      for (let r = 0; r < SIZE; r++) {
        const row = board[r].slice();
        if (direction === "right") row.reverse();
        const { line, mergedIndices, changed } = slideAndMerge(row);
        let result = line.slice();
        if (direction === "right") result.reverse();
        board[r] = result;
        if (changed) anyChanged = true;

        // Mark merged cells for animation (final coordinates)
        if (mergedIndices.size) {
          if (direction === "left") {
            mergedIndices.forEach((idx) => mergedTileSet.add(`${r}-${idx}`));
          } else {
            mergedIndices.forEach((idx) => {
              const col = SIZE - 1 - idx;
              mergedTileSet.add(`${r}-${col}`);
            });
          }
        }
      }
    } else {
      for (let c = 0; c < SIZE; c++) {
        const col = [];
        for (let r = 0; r < SIZE; r++) col.push(board[r][c]);
        if (direction === "down") col.reverse();
        const { line, mergedIndices, changed } = slideAndMerge(col);
        let result = line.slice();
        if (direction === "down") result.reverse();
        for (let r = 0; r < SIZE; r++) board[r][c] = result[r];
        if (changed) anyChanged = true;

        if (mergedIndices.size) {
          if (direction === "up") {
            mergedIndices.forEach((idx) => mergedTileSet.add(`${idx}-${c}`));
          } else {
            mergedIndices.forEach((idx) => {
              const row = SIZE - 1 - idx;
              mergedTileSet.add(`${row}-${c}`);
            });
          }
        }
      }
    }

    if (!anyChanged) return false;

    // Win check (one-time)
    if (!reached2048 && board.some((row) => row.some((v) => v === 2048))) {
      reached2048 = true;
      showOverlay("You win! 🎉", true);
    }

    addRandomTile(board);
    updateBest();
    return true;
  }

  function canMove(b = board) {
    if (emptyCells(b).length) return true;
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        const v = b[r][c];
        if (
          (r + 1 < SIZE && b[r + 1][c] === v) ||
          (c + 1 < SIZE && b[r][c + 1] === v)
        ) {
          return true;
        }
      }
    }
    return false;
  }

  function showOverlay(text, showKeepPlaying = false) {
    overlayText.textContent = text;
    overlay.classList.remove("hidden");
    overlay.setAttribute("aria-hidden", "false");
    keepPlayingBtn.classList.toggle("hidden", !showKeepPlaying);
    tryAgainBtn.classList.remove("hidden");
  }
  function hideOverlay() {
    overlay.classList.add("hidden");
    overlay.setAttribute("aria-hidden", "true");
  }

  // Keyboard input
  function handleKey(e) {
    const key = e.key.toLowerCase();
    const map = {
      arrowleft: "left",
      a: "left",
      h: "left",
      arrowright: "right",
      d: "right",
      l: "right",
      arrowup: "up",
      w: "up",
      k: "up",
      arrowdown: "down",
      s: "down",
      j: "down",
    };
    const dir = map[key];
    if (!dir) return;
    e.preventDefault();

    pushUndoSnapshot();
    const changed = move(dir);
    if (!changed) {
      undoStack.pop();
      return;
    }
    render();
    saveToStorage();
    if (!canMove()) showOverlay("Game Over 💥");
  }

  // Unified pointer (mouse/touch/pen) swipe on the board
  let dragStart = null;
  const THRESHOLD = 20; // px – prevent accidental moves

  function onPointerDown(e) {
    // Ignore secondary buttons
    if (e.button !== undefined && e.button !== 0) return;
    boardEl.setPointerCapture?.(e.pointerId);
    dragStart = { x: e.clientX, y: e.clientY };
  }

  function onPointerMove(_e) {
    // Optional: add visual feedback while dragging
  }

  function onPointerUp(e) {
    if (!dragStart) return;
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    dragStart = null;

    if (Math.max(Math.abs(dx), Math.abs(dy)) < THRESHOLD) return;

    const horizontal = Math.abs(dx) > Math.abs(dy);
    const dir = horizontal
      ? dx > 0
        ? "right"
        : "left"
      : dy > 0
      ? "down"
      : "up";

    pushUndoSnapshot();
    const changed = move(dir);
    if (!changed) {
      undoStack.pop();
      return;
    }
    render();
    saveToStorage();
    if (!canMove()) showOverlay("Game Over 💥");
  }

  // Event wiring
  document.addEventListener("keydown", handleKey, { passive: false });

  // Pointer events (works for mouse, touch, pen)
  boardEl.addEventListener("pointerdown", onPointerDown, { passive: true });
  boardEl.addEventListener("pointermove", onPointerMove, { passive: true });
  boardEl.addEventListener("pointerup", onPointerUp, { passive: true });
  boardEl.addEventListener("pointercancel", () => {
    dragStart = null;
  });
  boardEl.addEventListener("contextmenu", (e) => e.preventDefault()); // prevent right-click menu during drags

  newGameBtn.addEventListener("click", startNewGame);
  undoBtn.addEventListener("click", undo);
  keepPlayingBtn.addEventListener("click", () => hideOverlay());
  tryAgainBtn.addEventListener("click", startNewGame);

  // Init
  setupGridBackground();
  if (!loadFromStorage()) {
    startNewGame();
  } else {
    // Safety: ensure some tiles exist
    if (emptyCells(board).length === SIZE * SIZE) {
      addRandomTile(board);
      addRandomTile(board);
    }
    render();
  }
  updateBest();
  saveToStorage();
})();
