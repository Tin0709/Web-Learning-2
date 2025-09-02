(() => {
  const boardEl = document.getElementById("board");
  const statusEl = document.getElementById("status");
  const resetBtn = document.getElementById("resetBtn");
  const cpuToggle = document.getElementById("cpuToggle");
  const scoreXEl = document.getElementById("scoreX");
  const scoreOEl = document.getElementById("scoreO");
  const scoreDEl = document.getElementById("scoreD");

  const cells = Array.from(boardEl.querySelectorAll(".cell"));
  const LINES = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8], // rows
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8], // cols
    [0, 4, 8],
    [2, 4, 6], // diags
  ];

  // State
  let board; // array(9) of 'X' | 'O' | null
  let turn; // 'X' | 'O'
  let locked; // freeze input when round over
  let scores = { X: 0, O: 0, D: 0 };

  init();

  // ---- Setup & helpers ----
  function init() {
    board = Array(9).fill(null);
    turn = "X";
    locked = false;
    cells.forEach((c, i) => {
      c.textContent = "";
      c.className = "cell";
      c.setAttribute("aria-label", `Cell ${i + 1}`);
      c.disabled = false;
    });
    setStatus(`${turn}’s turn`);
    if (cpuToggle.checked && turn === "O") cpuMove(); // (not typical on start)
  }

  function setStatus(msg) {
    statusEl.textContent = msg;
  }

  function setCell(i, mark) {
    board[i] = mark;
    const cell = cells[i];
    cell.textContent = mark;
    cell.classList.add(mark.toLowerCase());
    cell.setAttribute("aria-label", `Cell ${i + 1} ${mark}`);
    cell.disabled = true;
  }

  function emptyIndices() {
    const arr = [];
    for (let i = 0; i < 9; i++) if (!board[i]) arr.push(i);
    return arr;
  }

  function winnerInfo(b = board) {
    for (const [a, m, z] of LINES) {
      if (b[a] && b[a] === b[m] && b[a] === b[z]) {
        return { win: b[a], line: [a, m, z] };
      }
    }
    if (b.every(Boolean)) return { draw: true };
    return null;
  }

  function endRound(result) {
    locked = true;
    cells.forEach((c) => (c.disabled = true));

    if (result.win) {
      for (const i of result.line) cells[i].classList.add("w");
      setStatus(`${result.win} wins!`);
      scores[result.win]++;
    } else {
      setStatus(`Draw!`);
      scores.D++;
    }
    scoreXEl.textContent = scores.X;
    scoreOEl.textContent = scores.O;
    scoreDEl.textContent = scores.D;
  }

  // ---- Events ----
  boardEl.addEventListener("click", (e) => {
    const btn = e.target.closest(".cell");
    if (!btn || locked) return;
    const i = Number(btn.dataset.index);
    if (board[i]) return;

    playTurn(i);
  });

  // Keyboard support: arrows to move focus; Enter/Space to place.
  let focusIdx = 0;
  cells[focusIdx].focus();

  boardEl.addEventListener("keydown", (e) => {
    const key = e.key;
    const row = Math.floor(focusIdx / 3),
      col = focusIdx % 3;
    if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(key)) {
      e.preventDefault();
      let r = row,
        c = col;
      if (key === "ArrowLeft") c = (c + 2) % 3;
      if (key === "ArrowRight") c = (c + 1) % 3;
      if (key === "ArrowUp") r = (r + 2) % 3;
      if (key === "ArrowDown") r = (r + 1) % 3;
      focusIdx = r * 3 + c;
      cells[focusIdx].focus();
    } else if ((key === "Enter" || key === " ") && !locked) {
      e.preventDefault();
      if (!board[focusIdx]) playTurn(focusIdx);
    }
  });

  resetBtn.addEventListener("click", () => init());

  // ---- Core gameplay ----
  function playTurn(i) {
    setCell(i, turn);
    const result = winnerInfo();
    if (result) return endRound(result);

    // swap turns
    turn = turn === "X" ? "O" : "X";
    setStatus(`${turn}’s turn`);

    // CPU move if enabled and it's CPU's turn
    if (cpuToggle.checked && turn === "O" && !locked) {
      window.setTimeout(cpuMove, 250);
    }
  }

  // ---- CPU (simple but decent): try win -> block -> center -> corner -> random
  function cpuMove() {
    if (locked) return;
    const move = findBestMove();
    playTurn(move);
  }

  function findBestMove() {
    // 1) If we can win, do it
    const w = findLineMove("O");
    if (w !== null) return w;
    // 2) If player can win, block
    const b = findLineMove("X");
    if (b !== null) return b;
    // 3) Center
    if (!board[4]) return 4;
    // 4) Corners
    for (const i of [0, 2, 6, 8]) if (!board[i]) return i;
    // 5) Any side
    const empties = emptyIndices();
    return empties[Math.floor(Math.random() * empties.length)];
  }

  // return index to complete a line for mark, or null
  function findLineMove(mark) {
    for (const [a, m, z] of LINES) {
      const line = [a, m, z];
      const vals = line.map((i) => board[i]);
      const countMark = vals.filter((v) => v === mark).length;
      const countEmpty = vals.filter((v) => !v).length;
      if (countMark === 2 && countEmpty === 1) {
        return line[vals.indexOf(null)];
      }
    }
    return null;
  }
})();
