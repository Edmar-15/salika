const boardEl = document.getElementById('board');
const turnIndicator = document.getElementById('turnIndicator');
const resetButton = document.getElementById('resetButton');
const moveListEl = document.getElementById('moveList');
const movesCountEl = document.getElementById('movesPlayed');

let moveHistory = [];

function getQueryParams() {
    const params = new URLSearchParams(window.location.search);
    return {
        mode: params.get('mode') || 'human',
        difficulty: params.get('difficulty') || 'easy',
        player: params.get('player') || '1'
    };
}

const query = getQueryParams();

const initialState = () => ({
    board: [
        [0,1,0,1,0,1,0,1],
        [1,0,1,0,1,0,1,0],
        [0,1,0,1,0,1,0,1],
        [0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0],
        [2,0,2,0,2,0,2,0],
        [0,2,0,2,0,2,0,2],
        [2,0,2,0,2,0,2,0]
    ],
    turn: 1,
    selected: null,
    validMoves: [],
    gameOver: false,
    aiEnabled: query.mode === 'ai',
    aiPlayer: Number(query.player) === 2 ? 2 : 1,
    difficulty: ['easy', 'medium', 'hard'].includes(query.difficulty) ? query.difficulty : 'easy'
});

let state = initialState();

function copyBoard(board) {
    return board.map(row => row.slice());
}

function applyMoveToBoard(board, move) {
    const newBoard = copyBoard(board);
    const [r1, c1] = move.from;
    const [r2, c2] = move.to;
    const piece = newBoard[r1][c1];

    newBoard[r1][c1] = 0;
    newBoard[r2][c2] = piece;

    if (move.capture) {
        const [cr, cc] = move.capture;
        newBoard[cr][cc] = 0;
    }

    if (piece === 1 && r2 === 7) newBoard[r2][c2] = 3;
    if (piece === 2 && r2 === 0) newBoard[r2][c2] = 4;

    return newBoard;
}

function getPieceMovesForBoard(board, r, c, player) {
    const piece = board[r][c];
    if (!piece) return [];
    if (player === 1 && ![1, 3].includes(piece)) return [];
    if (player === 2 && ![2, 4].includes(piece)) return [];

    const moves = getValidMoves(board, r, c);
    if (playerHasCapture(board, player)) {
        return moves.filter(move => move.capture !== null);
    }
    return moves;
}

function getPlayerMovesForBoard(board, player) {
    const allMoves = [];
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const pieceMoves = getPieceMovesForBoard(board, r, c, player);
            allMoves.push(...pieceMoves);
        }
    }
    return allMoves;
}

function getMoveScore(board, player) {
    let score = 0;
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const piece = board[r][c];
            if (piece === 1) score += 1 + r * 0.08;
            if (piece === 3) score += 2.4 + r * 0.05;
            if (piece === 2) score -= 1 + (7 - r) * 0.08;
            if (piece === 4) score -= 2.4 + (7 - r) * 0.05;
        }
    }
    return player === 1 ? score : -score;
}

function applyMoveWithChains(board, move, player) {
    let nextBoard = applyMoveToBoard(board, move);
    let [r, c] = move.to;

    while (true) {
        const followMoves = getPieceMovesForBoard(nextBoard, r, c, player).filter(m => m.capture !== null);
        if (!followMoves.length) break;
        followMoves.sort((a, b) => {
            const scoreA = getMoveScore(applyMoveToBoard(nextBoard, a), player);
            const scoreB = getMoveScore(applyMoveToBoard(nextBoard, b), player);
            return (player === 1 ? scoreB - scoreA : scoreA - scoreB);
        });
        const nextMove = followMoves[0];
        nextBoard = applyMoveToBoard(nextBoard, nextMove);
        [r, c] = nextMove.to;
    }

    return nextBoard;
}

function findBestMove(board, player, difficulty) {
    const possibleMoves = getPlayerMovesForBoard(board, player);
    if (!possibleMoves.length) return null;
    const captureMoves = possibleMoves.filter(move => move.capture !== null);

    if (difficulty === 'easy') {
        return possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
    }

    if (difficulty === 'medium') {
        if (captureMoves.length) {
            return captureMoves[Math.floor(Math.random() * captureMoves.length)];
        }
        return possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
    }

    let best = null;
    let bestScore = player === state.aiPlayer ? -Infinity : Infinity;
    const depth = 3;
    for (const move of possibleMoves) {
        const boardAfterMove = applyMoveWithChains(board, move, player);
        const score = minimax(boardAfterMove, 3 - player, depth - 1, -Infinity, Infinity).score;
        if (player === state.aiPlayer) {
            if (score > bestScore) {
                bestScore = score;
                best = move;
            }
        } else {
            if (score < bestScore) {
                bestScore = score;
                best = move;
            }
        }
    }
    return best || possibleMoves[0];
}

function minimax(board, player, depth, alpha, beta) {
    const moves = getPlayerMovesForBoard(board, player);
    if (depth === 0 || moves.length === 0) {
        return { score: getMoveScore(board, state.aiPlayer) };
    }

    let bestScore = player === state.aiPlayer ? -Infinity : Infinity;
    let bestMove = null;

    for (const move of moves) {
        const nextBoard = applyMoveWithChains(board, move, player);
        const nextResult = minimax(nextBoard, 3 - player, depth - 1, alpha, beta);
        const score = nextResult.score;

        if (player === state.aiPlayer) {
            if (score > bestScore) {
                bestScore = score;
                bestMove = move;
            }
            alpha = Math.max(alpha, score);
        } else {
            if (score < bestScore) {
                bestScore = score;
                bestMove = move;
            }
            beta = Math.min(beta, score);
        }

        if (beta <= alpha) break;
    }

    return { score: bestScore, move: bestMove };
}

function runAiTurn() {
    if (!state.aiEnabled || state.gameOver || state.turn !== state.aiPlayer) return;
    const move = findBestMove(state.board, state.aiPlayer, state.difficulty);
    if (move) {
        applyMove(move);
    }
}

function maybeRunAi() {
    if (state.aiEnabled && !state.gameOver && state.turn === state.aiPlayer) {
        setTimeout(runAiTurn, 250);
    }
}

function isInside(r, c) {
    return r >= 0 && r < 8 && c >= 0 && c < 8;
}

function isEnemy(piece, target) {
    return (piece === 1 || piece === 3) && (target === 2 || target === 4) ||
           (piece === 2 || piece === 4) && (target === 1 || target === 3);
}

function getValidMoves(board, r, c) {
    const piece = board[r][c];
    if (!piece) return [];

    const directions = [];
    if (piece === 1) directions.push([1, -1], [1, 1]);
    if (piece === 2) directions.push([-1, -1], [-1, 1]);
    if (piece === 3 || piece === 4) directions.push([1, -1], [1, 1], [-1, -1], [-1, 1]);

    const moves = [];
    for (const [dr, dc] of directions) {
        const nr = r + dr;
        const nc = c + dc;
        if (isInside(nr, nc)) {
            if (board[nr][nc] === 0) {
                moves.push({ from: [r, c], to: [nr, nc], capture: null });
            }
            const cr = r + dr * 2;
            const cc = c + dc * 2;
            if (isInside(cr, cc) && board[nr][nc] && isEnemy(piece, board[nr][nc]) && board[cr][cc] === 0) {
                moves.push({ from: [r, c], to: [cr, cc], capture: [nr, nc] });
            }
        }
    }
    return moves;
}

function hasCapture(board, r, c) {
    return getValidMoves(board, r, c).some(move => move.capture !== null);
}

function playerHasCapture(board, player) {
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const piece = board[r][c];
            if ((player === 1 && (piece === 1 || piece === 3)) ||
                (player === 2 && (piece === 2 || piece === 4))) {
                if (hasCapture(board, r, c)) return true;
            }
        }
    }
    return false;
}

function getPieceMoves(r, c) {
    const moves = getValidMoves(state.board, r, c);
    const captureRequired = playerHasCapture(state.board, state.turn);
    if (captureRequired) {
        return moves.filter(move => move.capture !== null);
    }
    return moves;
}

function getPlayerMoves(player) {
    const allMoves = [];
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const piece = state.board[r][c];
            if ((player === 1 && (piece === 1 || piece === 3)) ||
                (player === 2 && (piece === 2 || piece === 4))) {
                const pieceMoves = getPieceMoves(r, c);
                allMoves.push(...pieceMoves);
            }
        }
    }
    return allMoves;
}

function applyMove(move) {
    const [r1, c1] = move.from;
    const [r2, c2] = move.to;
    const piece = state.board[r1][c1];

    state.board[r1][c1] = 0;
    state.board[r2][c2] = piece;

    if (move.capture) {
        const [cr, cc] = move.capture;
        state.board[cr][cc] = 0;
    }

    if (piece === 1 && r2 === 7) state.board[r2][c2] = 3;
    if (piece === 2 && r2 === 0) state.board[r2][c2] = 4;

    const continueCapture = move.capture && hasCapture(state.board, r2, c2);

    if (continueCapture) {
        state.selected = [r2, c2];
        state.validMoves = getPieceMoves(r2, c2).filter(m => m.capture !== null);
        state.turn = state.turn;
    } else {
        state.turn = state.turn === 1 ? 2 : 1;
        state.selected = null;
        state.validMoves = [];

        // Record move when turn changes
        const colLetters = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
        const fromSquare = colLetters[c1] + (8 - r1);
        const toSquare = colLetters[c2] + (8 - r2);
        const moveNotation = `${fromSquare}${toSquare}${move.capture ? 'x' : '-'}`;
        moveHistory.push(moveNotation);
        updateMoveHistory();
    }

    const winner = checkGameOver();
    if (winner) {
        state.gameOver = true;
        turnIndicator.textContent = winner;
    }
    renderBoard();
    maybeRunAi();
}

function updateMoveHistory() {
    if (!moveListEl) return;
    
    const moveCount = moveHistory.length;
    if (movesCountEl) {
        movesCountEl.textContent = `${moveCount} move${moveCount !== 1 ? 's' : ''}`;
    }

    if (moveCount === 0) {
        moveListEl.innerHTML = '<p class="no-moves">No moves yet</p>';
        return;
    }

    moveListEl.innerHTML = moveHistory.map((move, idx) => {
        return `<div class="move-item"><span class="move-number">${idx + 1}.</span><span>${move}</span></div>`;
    }).join('');

    // Auto-scroll to bottom
    moveListEl.scrollTop = moveListEl.scrollHeight;
}

function checkGameOver() {
    const moves = getPlayerMoves(state.turn);
    if (moves.length === 0) {
        const loser = state.turn === 1 ? 'Red' : 'Blue';
        const winner = state.turn === 1 ? 'Blue' : 'Red';
        return `Game over — ${winner} wins!`;
    }
    return null;
}

function renderBoard() {
    boardEl.innerHTML = '';
    const captureAvailable = playerHasCapture(state.board, state.turn);

    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const square = document.createElement('button');
            square.type = 'button';
            square.className = `square ${((r + c) % 2 === 0) ? 'light' : 'dark'}`;
            square.dataset.row = r;
            square.dataset.col = c;
            square.addEventListener('click', () => handleSquareClick(r, c));

            const piece = state.board[r][c];
            if (piece) {
                const pieceEl = document.createElement('span');
                pieceEl.className = `piece ${piece === 1 || piece === 3 ? 'red' : 'blue'}${piece === 3 || piece === 4 ? ' king' : ''}`;
                pieceEl.textContent = piece === 3 || piece === 4 ? '♛' : '';
                square.appendChild(pieceEl);
            }

            if (state.selected && state.selected[0] === r && state.selected[1] === c) {
                square.classList.add('selected');
            }

            const moveHere = state.validMoves.some(move => move.to[0] === r && move.to[1] === c);
            if (moveHere) {
                square.classList.add('move-target');
            }

            if (!state.gameOver && captureAvailable) {
                const piece = state.board[r][c];
                const owner = piece === 1 || piece === 3 ? 1 : piece === 2 || piece === 4 ? 2 : 0;
                if (owner === state.turn && piece && !hasCapture(state.board, r, c)) {
                    square.classList.add('capture-disabled');
                }
            }

            boardEl.appendChild(square);
        }
    }
    if (!state.gameOver) {
        const playerName = state.turn === 1 ? 'Red' : 'Blue';
        const turnType = state.aiEnabled && state.turn === state.aiPlayer ? 'AI' : 'Human';
        const captureText = captureAvailable ? ' (capture required)' : '';
        turnIndicator.textContent = `${playerName} (${turnType})${captureText}`;
    }
}

function handleSquareClick(r, c) {
    if (state.gameOver) return;
    if (state.aiEnabled && state.turn === state.aiPlayer) return;
    const piece = state.board[r][c];
    const selectedMove = state.validMoves.find(move => move.to[0] === r && move.to[1] === c);

    if (selectedMove) {
        applyMove(selectedMove);
        return;
    }

    if (piece && ((state.turn === 1 && (piece === 1 || piece === 3)) || (state.turn === 2 && (piece === 2 || piece === 4)))) {
        const moves = getPieceMoves(r, c);
        if (moves.length > 0) {
            state.selected = [r, c];
            state.validMoves = moves;
        } else {
            state.selected = null;
            state.validMoves = [];
        }
    } else {
        state.selected = null;
        state.validMoves = [];
    }
    renderBoard();
}

resetButton.addEventListener('click', () => {
    state = initialState();
    moveHistory = [];
    updateMoveHistory();
    renderBoard();
    maybeRunAi();
});

renderBoard();
maybeRunAi();
