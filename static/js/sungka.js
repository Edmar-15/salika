let gameId = null;
let currentState = null;

const boardEl = document.getElementById("board");
const turnEl = document.getElementById("turn");
const menuBtn = document.getElementById("menuBtn");

// INITIALIZE GAME (called once when page loads)
initGame();

async function initGame() {
  const res = await fetch("/api/sungka/new", {
    method: "POST"
  });

  const data = await res.json();

  gameId = data.game_id;
  currentState = data.state;

  render(currentState);
}

// MOVE
async function makeMove(pitIndex) {
  if (!gameId) return;

  const res = await fetch("/api/sungka/move", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      game_id: gameId,
      pit_index: pitIndex
    })
  });

  const data = await res.json();

  if (!res.ok) {
    showError(data.error || "Invalid move");
    return;
  }

  currentState = data.state;
  render(currentState);

  if (data.game_over) {
    setTimeout(() => {
      alert("Game Over. Winner: " + data.winner);
    }, 100);
  }
}

// RENDER
function render(state) {
  boardEl.innerHTML = "";

  turnEl.textContent = "Turn: " + state.current_player;

  const board = state.board;

  const topRow = board.slice(0, 7);
  const bottomRow = board.slice(7, 14);
  const store0 = board[14];
  const store1 = board[15];

  const leftStore = createPit(store0, 14);
  leftStore.classList.add("store");
  boardEl.appendChild(leftStore);

  const topContainer = document.createElement("div");
  topContainer.className = "row";

  topRow.forEach((val, i) => {
    topContainer.appendChild(createPit(val, i));
  });

  boardEl.appendChild(topContainer);

  const bottomContainer = document.createElement("div");
  bottomContainer.className = "row";

  bottomRow.forEach((val, i) => {
    bottomContainer.appendChild(createPit(val, i + 7));
  });

  boardEl.appendChild(bottomContainer);

  const rightStore = createPit(store1, 15);
  rightStore.classList.add("store");
  boardEl.appendChild(rightStore);
}

// PIT CREATION + VALIDATION
function createPit(value, index) {
  const pit = document.createElement("div");

  pit.className = "pit";
  pit.textContent = value;

  pit.onclick = () => {
    if (!currentState) return;

    const player = currentState.current_player;

    const isP0 = index >= 0 && index <= 6;
    const isP1 = index >= 7 && index <= 13;

    if (player === 0 && !isP0) return;
    if (player === 1 && !isP1) return;
    if (currentState.board[index] === 0) return;

    makeMove(index);
  };

  return pit;
}

// ERROR UI
function showError(msg) {
  let el = document.getElementById("error");

  if (!el) {
    el = document.createElement("div");
    el.id = "error";

    el.style.color = "red";
    el.style.marginTop = "10px";
    el.style.fontWeight = "bold";

    document.body.prepend(el);
  }

  el.innerText = msg;

  setTimeout(() => {
    if (el) el.innerText = "";
  }, 1200);
}

// RETURN TO MENU
menuBtn.onclick = () => {
  gameId = null;
  currentState = null;

  window.location.href = "/salika/offline";
};