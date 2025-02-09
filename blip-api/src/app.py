from flask import Flask
from flask_migrate import Migrate
from src.database import db
import os
from dotenv import load_dotenv

load_dotenv()

def create_app():
    app = Flask(__name__)
    app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URI')
    db.init_app(app)
    Migrate(app, db)

    from src.routes.main import main_bp
    from src.routes.movies import movies_bp
    from src.routes.users import users_bp
    app.register_blueprint(main_bp)
    app.register_blueprint(movies_bp)
    app.register_blueprint(users_bp)

    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, host='0.0.0.0', port=5001)
