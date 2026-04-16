from flask import Flask
from routes.main_routes import main_bp
from routes.sungka_routes import sungka_bp

app = Flask(__name__)

# register route modules
app.register_blueprint(main_bp)
app.register_blueprint(sungka_bp)

if __name__ == "__main__":
    app.run(debug=True)