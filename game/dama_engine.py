def create_board():
    return [
        [0,1,0,1,0,1,0,1],
        [1,0,1,0,1,0,1,0],
        [0,1,0,1,0,1,0,1],
        [0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0],
        [2,0,2,0,2,0,2,0],
        [0,2,0,2,0,2,0,2],
        [2,0,2,0,2,0,2,0]
    ]

def is_inside(r, c):
    return 0 <= r < 8 and 0 <= c < 8

def is_enemy(piece, target):
    if piece in [1,3] and target in [2,4]:
        return True
    if piece in [2,4] and target in [1,3]:
        return True
    return False

def get_valid_moves(board, r, c):
    piece = board[r][c]
    moves = []

    directions = []

    if piece == 1:
        directions = [(1,-1),(1,1)]
    elif piece == 2:
        directions = [(-1,-1),(-1,1)]
    elif piece in [3,4]:
        directions = [(1,-1),(1,1),(-1,-1),(-1,1)]

    for dr, dc in directions:
        nr, nc = r + dr, c + dc

        # normal move
        if is_inside(nr, nc) and board[nr][nc] == 0:
            moves.append({"to": [nr, nc], "capture": None})

        # capture
        cr, cc = r + 2*dr, c + 2*dc
        if (
            is_inside(cr, cc) and
            board[nr][nc] != 0 and
            is_enemy(piece, board[nr][nc]) and
            board[cr][cc] == 0
        ):
            moves.append({
                "to": [cr, cc],
                "capture": [nr, nc]
            })

    return moves

def apply_move(state, move):
    board = state["board"]

    r1, c1 = move["from"]
    r2, c2 = move["to"]

    piece = board[r1][c1]
    board[r1][c1] = 0
    board[r2][c2] = piece

    # handle capture
    if move.get("capture"):
        cr, cc = move["capture"]
        board[cr][cc] = 0

    # promotion
    if piece == 1 and r2 == 7:
        board[r2][c2] = 3
    if piece == 2 and r2 == 0:
        board[r2][c2] = 4

    # switch turn
    state["turn"] = 2 if state["turn"] == 1 else 1

    return state

def has_capture(board, r, c):
    moves = get_valid_moves(board, r, c)
    return any(m["capture"] is not None for m in moves)

def player_has_capture(board, player):
    for r in range(8):
        for c in range(8):
            piece = board[r][c]

            if player == 1 and piece in [1, 3]:
                if has_capture(board, r, c):
                    return True

            if player == 2 and piece in [2, 4]:
                if has_capture(board, r, c):
                    return True

    return False