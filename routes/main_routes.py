from flask import Blueprint, render_template

main_bp = Blueprint("main", __name__)

@main_bp.route('/')
def home():
    return render_template('welcome.html')

@main_bp.route('/salika/login')
def login():
    return 'This is login page'

@main_bp.route('/salika/offline')
def offline_menu():
    return render_template('offline_menu.html')

@main_bp.route('/salika/offline/dama')
def dama():
    return render_template('dama.html')

@main_bp.route('/salika/offline/sungka')
def sungka():
    return render_template('sungka.html')

@main_bp.route('/salika/offline/game-of-generals')
def generals():
    return render_template('game_of_generals.html')