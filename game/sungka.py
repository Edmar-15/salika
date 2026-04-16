class SungkaEngine:
    def __init__(self, pits_per_side=7, seeds_per_pit=7):
        self.pits_per_side = pits_per_side
        self.board = [seeds_per_pit] * (pits_per_side * 2) + [0, 0]
        self.current_player = 0

    def get_store(self, player):
        return self.pits_per_side if player == 0 else len(self.board) - 1

    def opponent(self, p):
        return 1 - p

    def player_range(self, player):
        if player == 0:
            return range(0, self.pits_per_side)
        return range(self.pits_per_side + 1, self.pits_per_side * 2 + 1)

    def is_valid_move(self, idx):
        return idx in self.player_range(self.current_player) and self.board[idx] > 0

    def make_move(self, idx):
        if not self.is_valid_move(idx):
            raise ValueError("Invalid move")

        seeds = self.board[idx]
        self.board[idx] = 0

        player = self.current_player
        store = self.get_store(player)

        i = idx
        while seeds > 0:
            i = (i + 1) % len(self.board)

            if i == self.get_store(self.opponent(player)):
                continue

            self.board[i] += 1
            seeds -= 1

        extra_turn = (i == store)

        # capture rule
        if self.is_player_pit(i, player) and self.board[i] == 1:
            opp = self.opposite(i)
            if self.board[opp] > 0:
                self.board[store] += self.board[opp] + 1
                self.board[i] = 0
                self.board[opp] = 0

        if not extra_turn:
            self.current_player = self.opponent(player)

    def is_player_pit(self, idx, player):
        if player == 0:
            return 0 <= idx < self.pits_per_side
        return self.pits_per_side + 1 <= idx < self.pits_per_side * 2 + 1

    def opposite(self, idx):
        return (self.pits_per_side * 2) - idx

    def is_game_over(self):
        p0 = all(self.board[i] == 0 for i in range(self.pits_per_side))
        p1 = all(self.board[i] == 0 for i in self.player_range(1))
        return p0 or p1

    def collect(self):
        for i in self.player_range(0):
            self.board[self.get_store(0)] += self.board[i]
            self.board[i] = 0

        for i in self.player_range(1):
            self.board[self.get_store(1)] += self.board[i]
            self.board[i] = 0

    def get_winner(self):
        if not self.is_game_over():
            return None

        self.collect()

        p0 = self.board[self.get_store(0)]
        p1 = self.board[self.get_store(1)]

        if p0 > p1:
            return 0
        if p1 > p0:
            return 1
        return -1

    def get_state(self):
        return {
            "board": self.board,
            "current_player": self.current_player
        }