from flask import Blueprint, request, jsonify
import uuid

from game.manager import create_game, get_game

sungka_bp = Blueprint("sungka", __name__)

games = {}

@sungka_bp.route('/api/sungka/new', methods=['POST'])
def new_game():
    game_id = str(uuid.uuid4())
    games[game_id] = create_game(game_id)

    return jsonify({
        "game_id": game_id,
        "state": games[game_id].get_state()
    })

@sungka_bp.route('/api/sungka/move', methods=['POST'])
def move():
    data = request.json

    game = games.get(data["game_id"])
    if not game:
        return jsonify({"error": "game not found"}), 404

    try:
        game.make_move(data["pit_index"])
    except:
        return jsonify({"error": "invalid move"}), 400

    return jsonify({
        "state": game.get_state(),
        "game_over": game.is_game_over(),
        "winner": game.get_winner()
    })

@sungka_bp.route('/api/sungka/state/<game_id>')
def state(game_id):
    game = games.get(game_id)

    if not game:
        return jsonify({"error": "not found"}), 404

    return jsonify(game.get_state())