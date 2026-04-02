from flask import Flask, render_template    # type: ignore

app = Flask(__name__)


@app.route('/', endpoint='mainMenu')
def home():
    return render_template('welcome.html')


@app.route('/salika/login', endpoint='login')
def login():
    return 'This is login page'


@app.route('/salika/offline', endpoint='offline')
def offlineMenu():
    return render_template('offline_menu.html')



if __name__ == '__main__':
    app.run(debug=True)
