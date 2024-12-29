import requests
from flask import Flask, request, jsonify

from src.database.types import Opinion
from src.database import db
from src.database.utils import create_tables
from src.database.models import User, UserMovie
from flask_migrate import Migrate
import os
from dotenv import load_dotenv
from sqlalchemy.orm import Session

from src.utils import extract_trailer_key

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


@app.route('/discover-movies', methods=['GET'])
def discover_movies():
    platforms_param = request.args.get('platforms', '')
    platforms = [platform.strip() for platform in platforms_param.split(',')]
    locale = request.args.get('locale', 'FR')

    base_url = f"{os.getenv('TMDB_URL')}/3/discover/movie?include_adult=false&language=en-US&page=1&sort_by=popularity.desc"
    response = requests.get(base_url,
                            headers={'Authorization': f"Bearer {os.getenv('TMDB_BEARER_TOKEN')}"})
    if response.status_code == 200:
        response_json = response.json()
        movies = response_json['results']

        enriched_movies = []
        for movie in movies:
            movie_details_url = f"{os.getenv('TMDB_URL')}/3/movie/{movie['id']}"
            details_response = requests.get(movie_details_url, headers={
                'Authorization': f"Bearer {os.getenv('TMDB_BEARER_TOKEN')}"
            })

            watch_providers_url = f"{os.getenv('TMDB_URL')}/3/movie/{movie["id"]}/watch/providers"
            watch_response = requests.get(watch_providers_url, headers={
                'Authorization': f"Bearer {os.getenv('TMDB_BEARER_TOKEN')}"
            })

            if details_response.status_code == 200 and watch_response.status_code == 200:
                details = details_response.json()
                watch_providers = watch_response.json().get('results', {})
                provider_data = watch_providers.get(locale, {})
                if 'flatrate' in provider_data:
                    available_platforms = [
                        provider['provider_name'] for provider in provider_data['flatrate']
                    ]
                    if any(platform in provider for provider in available_platforms for platform in platforms):
                        enriched_movies.append({
                            "id": movie['id'],
                            "title": movie['title'],
                            "image": f"https://image.tmdb.org/t/p/w500{movie['poster_path']}",
                            "date": movie['release_date'].split('-')[0],
                            "rate": movie['vote_average'],
                            "overview": movie['overview'],
                            "trailer_key": extract_trailer_key(
                                requests.get(f"{os.getenv('TMDB_URL')}/3/movie/{movie['id']}/videos",
                                             headers={
                                                 'Authorization': f"Bearer {os.getenv('TMDB_BEARER_TOKEN')}"})),
                            "runtime": details.get('runtime', 'N/A'),
                            "genres": [genre['name'] for genre in details.get('genres', [])],
                            "director": next(
                                (crew['name'] for crew in details.get('credits', {}).get('crew', []) if
                                 crew['job'] == 'Director'),
                                'N/A'
                            ),
                            "availability": {
                                "country": locale,
                                "platforms": available_platforms
                            }
                        })

        return jsonify(enriched_movies), 200

    return jsonify({'message': 'Movies not found'}), 404


@app.route('/movie/<int:movie_id>', methods=['GET'])
def get_movie(movie_id):
    base_url = f"{os.getenv('TMDB_URL')}/3/movie/"
    movie_response = requests.get(f'{base_url}{movie_id}',
                                  headers={'Authorization': f"Bearer {os.getenv('TMDB_BEARER_TOKEN')}"})
    movie_response_json = movie_response.json()
    trailer_response = requests.get(f'{base_url}{movie_id}/videos',
                                    headers={'Authorization': f"Bearer {os.getenv('TMDB_BEARER_TOKEN')}"})
    movie_details_url = f"{os.getenv('TMDB_URL')}/3/movie/{movie_id}"
    details_response = requests.get(movie_details_url, headers={
        'Authorization': f"Bearer {os.getenv('TMDB_BEARER_TOKEN')}"
    })

    if trailer_response.status_code == 200 and movie_response.status_code == 200 and details_response.status_code == 200:
        details = details_response.json()
        return jsonify({
            "id": movie_response_json['id'],
            "title": movie_response_json['title'],
            "image": f"https://image.tmdb.org/t/p/w500{movie_response_json['poster_path']}",
            "date": movie_response_json['release_date'].split('-')[0],
            "rate": movie_response_json['vote_average'],
            "overview": movie_response_json['overview'],
            "trailer_key": extract_trailer_key(trailer_response),
            "runtime": details.get('runtime', 'N/A'),
            "genres": [genre['name'] for genre in details.get('genres', [])],
            "director": next(
                (crew['name'] for crew in details.get('credits', {}).get('crew', []) if crew['job'] == 'Director'),
                'N/A'
            )
        }), 200
    return jsonify({'message': 'Movie not found'}), 404


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
            trailer_response = requests.get(f'{base_url}{movie_id}/videos',
                                            headers={'Authorization': f"Bearer {os.getenv('TMDB_BEARER_TOKEN')}"})
            movie_details_url = f"{os.getenv('TMDB_URL')}/3/movie/{movie_id}"
            details_response = requests.get(movie_details_url, headers={
                'Authorization': f"Bearer {os.getenv('TMDB_BEARER_TOKEN')}"
            })

            if response.status_code == 200 and trailer_response.status_code == 200 and details_response.status_code == 200:
                response_json = response.json()
                details = details_response.json()
                detailed_movies.append({
                    "id": response_json['id'],
                    "title": response_json['title'],
                    "image": f"https://image.tmdb.org/t/p/w500{response_json['poster_path']}",
                    "date": response_json['release_date'].split('-')[0],
                    "rate": response_json['vote_average'],
                    "overview": response_json['overview'],
                    "trailer_key": extract_trailer_key(trailer_response),
                    "runtime": details.get('runtime', 'N/A'),
                    "genres": [genre['name'] for genre in details.get('genres', [])],
                    "director": next(
                        (crew['name'] for crew in details.get('credits', {}).get('crew', []) if
                         crew['job'] == 'Director'),
                        'N/A'
                    )
                })
            else:
                print("Could not fetch movie details of movie_id: ", movie_id)
    return jsonify(detailed_movies), 200


@app.route('/user/<int:user_id>/movie', methods=['POST'])
def add_user_movie(user_id):
    data = request.json
    movie_id = data['movie_id']
    opinion = data['opinion']

    with Session(db.engine) as session:
        user = session.get(User, user_id)
        if user is None:
            return jsonify({'message': 'User not found'}), 404

        user_movie = UserMovie.query.filter_by(user_id=user_id, movie_id=movie_id).first()
        if user_movie is not None:
            return jsonify({'message': 'Movie already added to user'}), 200

        user_movie = UserMovie(user_id=user_id, movie_id=movie_id, opinion=Opinion(opinion))
        db.session.add(user_movie)
        db.session.commit()

    return jsonify({'message': 'Movie added to user'}), 200


if __name__ == '__main__':
    app.run(debug=True)
