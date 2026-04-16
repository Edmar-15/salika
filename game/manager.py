from game.sungka import SungkaEngine

games = {}

def create_game(game_id):
    games[game_id] = SungkaEngine()
    return games[game_id]

def get_game(game_id):
    return games.get(game_id)