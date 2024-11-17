import requests
from flask import Flask, request, jsonify

from src.database.types import Opinion
from src.database import db
from src.database.utils import create_tables
from src.database.models import User, UserMovie
from flask_migrate import Migrate
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URI')
db.init_app(app)
migrate = Migrate(app, db)


@app.route('/', methods=['GET'])
def home():
    create_tables(app)
    return jsonify({'message': 'ok'}), 200


@app.route('/users', methods=['POST'])
def create_user():
    data = request.json
    name = data['name']
    email = data['email']

    with app.app_context():
        user = User(name=name, email=email)
        db.session.add(user)
        db.session.commit()

    return jsonify({'message': 'User created'}), 200


@app.route('/user/<int:user_id>/movies', methods=['GET'])
def get_user_movies(user_id):
    with app.app_context():
        opinion_filter = request.args.get('opinion')
        if opinion_filter:
            user_movies = UserMovie.query.filter_by(user_id=user_id, opinion=Opinion(int(opinion_filter))).all()
        else:
            user_movies = UserMovie.query.filter_by(user_id=user_id).all()

        detailed_movies = []
        base_url = f"{os.getenv('TMDB_URL')}/3/movie/"
        for user_movie in user_movies:
            movie_id = user_movie.movie_id
            response = requests.get(f'{base_url}{movie_id}',
                                    headers={'Authorization': f"Bearer {os.getenv('TMDB_BEARER_TOKEN')}"})
            if response.status_code == 200:
                detailed_movies.append(response.json())
            else:
                print("Could not fetch movie details of movie_id: ", movie_id)
            print(detailed_movies)
    return jsonify(detailed_movies), 200


@app.route('/user/<int:user_id>/movie', methods=['POST'])
def add_user_movie(user_id):
    data = request.json
    movie_id = data['movie_id']
    opinion = data['opinion']

    with app.app_context():
        user = User.query.get(user_id)
        if user is None:
            return jsonify({'message': 'User not found'}), 404

        user_movie = UserMovie.query.filter_by(user_id=user_id, movie_id=movie_id).first()
        if user_movie is not None:
            return jsonify({'message': 'Movie already added to user'}), 400

        user_movie = UserMovie(user_id=user_id, movie_id=movie_id, opinion=Opinion(opinion))
        db.session.add(user_movie)
        db.session.commit()

    return jsonify({'message': 'Movie added to user'}), 200


if __name__ == '__main__':
    app.run(debug=True)
