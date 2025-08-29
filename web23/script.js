(() => {
  const boardEl = document.getElementById("board");
  const cells = Array.from(document.querySelectorAll(".cell"));
  const statusEl = document.getElementById("status");
  const resetBtn = document.getElementById("resetBtn");
  const modeSelect = document.getElementById("modeSelect");

  const scoreXEl = document.getElementById("scoreX");
  const scoreOEl = document.getElementById("scoreO");
  const scoreDEl = document.getElementById("scoreD");

  // Game state
  let board = Array(9).fill(null);
  let current = "X";
  let active = true;
  let mode = "human"; // 'human' | 'cpu'
  const scores = { X: 0, O: 0, D: 0 };
  const wins = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8], // rows
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8], // cols
    [0, 4, 8],
    [2, 4, 6], // diagonals
  ];

  function updateStatus(text) {
    statusEl.innerHTML = text;
  }

  function render() {
    board.forEach((val, i) => {
      const c = cells[i];
      c.textContent = val ? val : "";
      c.classList.toggle("x", val === "X");
      c.classList.toggle("o", val === "O");
    });
  }

  function setTurnText() {
    updateStatus(
      `<strong>${current}</strong> to move${
        mode === "cpu" && current === "O" ? " (Computer)" : ""
      }`
    );
  }

  function resetBoard(keepStarter = false) {
    board = Array(9).fill(null);
    active = true;
    cells.forEach((c) => c.classList.remove("win"));
    if (!keepStarter) current = "X";
    render();
    setTurnText();
    // Move focus to center cell for keyboard usability
    cells[4].focus();
    // If CPU starts and set to O (not default), you can call cpuMove()
  }

  function checkWinner(b = board) {
    for (const [a, b1, c] of wins) {
      if (b[a] && b[a] === b[b1] && b[a] === b[c]) {
        return { winner: b[a], line: [a, b1, c] };
      }
    }
    if (b.every((v) => v)) return { winner: "D", line: [] };
    return null;
  }

  function endGame(result) {
    active = false;
    if (result.winner === "D") {
      scores.D++;
      scoreDEl.textContent = String(scores.D);
      updateStatus(`<strong>Draw</strong>. Hit Reset to play again.`);
    } else {
      scores[result.winner]++;
      (result.winner === "X" ? scoreXEl : scoreOEl).textContent = String(
        scores[result.winner]
      );
      result.line.forEach((i) => cells[i].classList.add("win"));
      updateStatus(
        `<strong>${result.winner}</strong> wins! Hit Reset to play again.`
      );
    }
  }

  function makeMove(index) {
    if (!active || board[index]) return;
    board[index] = current;
    render();

    const res = checkWinner();
    if (res) {
      endGame(res);
      return;
    }

    current = current === "X" ? "O" : "X";
    setTurnText();

    if (mode === "cpu" && current === "O" && active) {
      // Small delay so it feels natural
      setTimeout(cpuMove, 380);
    }
  }

  // --- Unbeatable CPU using minimax (optimized for Tic-Tac-Toe) ---
  function cpuMove() {
    const best = bestMove(board, "O");
    makeMove(best.index);
  }

  function bestMove(b, player) {
    const result = checkWinner(b);
    if (result) {
      if (result.winner === "O") return { score: 10 };
      if (result.winner === "X") return { score: -10 };
      return { score: 0 }; // draw
    }

    const empty = b.map((v, i) => (v ? null : i)).filter((i) => i !== null);
    // Prioritize center and corners quickly for speed
    // (minimax will still evaluate, but this helps pick quicker good choices)
    let moves = [];

    for (const i of empty) {
      const newB = b.slice();
      newB[i] = player;
      const next = player === "O" ? "X" : "O";
      const { score } = bestMove(newB, next);
      moves.push({ index: i, score: score });
    }

    if (player === "O") {
      // Maximize
      let max = -Infinity,
        pick = moves[0];
      for (const m of moves)
        if (m.score > max) {
          max = m.score;
          pick = m;
        }
      return pick;
    } else {
      // Minimize
      let min = Infinity,
        pick = moves[0];
      for (const m of moves)
        if (m.score < min) {
          min = m.score;
          pick = m;
        }
      return pick;
    }
  }

  // Clicks
  cells.forEach((btn) => {
    btn.addEventListener("click", () => makeMove(Number(btn.dataset.index)));
  });

  // Keyboard navigation: arrows move focus around grid
  boardEl.addEventListener("keydown", (e) => {
    const focusIndex = Number(document.activeElement?.dataset?.index ?? 0);
    if (Number.isNaN(focusIndex)) return;

    const row = Math.floor(focusIndex / 3);
    const col = focusIndex % 3;

    let target = null;

    switch (e.key) {
      case "ArrowUp":
        target = ((row + 2) % 3) * 3 + col;
        break;
      case "ArrowDown":
        target = ((row + 1) % 3) * 3 + col;
        break;
      case "ArrowLeft":
        target = row * 3 + ((col + 2) % 3);
        break;
      case "ArrowRight":
        target = row * 3 + ((col + 1) % 3);
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        makeMove(focusIndex);
        return;
      default:
        return;
    }
    e.preventDefault();
    cells[target].focus();
  });

  // Reset
  resetBtn.addEventListener("click", () => resetBoard());

  // Mode change
  modeSelect.addEventListener("change", (e) => {
    mode = e.target.value;
    resetBoard();
  });

  // Initial render
  render();
  setTurnText();
  // Focus first cell for quick keyboard play
  cells[0].focus();
})();
