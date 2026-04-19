from flask import Blueprint, request, jsonify
import uuid

from game.manager import create_game, get_game

dama_bp = Blueprint("dama", __name__)

games = {}