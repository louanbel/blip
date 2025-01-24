import random

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
    """
    Suggest a list of movies based on:
    - Recommendations from movies the user has "liked" / "watchlisted" etc.
    - A few random/popular movies (to not lock the user in).
    """
    user_id = request.args.get('user_id', type=int)
    if not user_id:
        return jsonify({'message': 'Missing user_id parameter'}), 400

    page = request.args.get('page', 1, type=int)
    page_size = request.args.get('page_size', 10, type=int)

    with Session(db.engine) as session:
        user = session.get(User, user_id)
        if not user:
            return jsonify({'message': 'User not found'}), 404

        user_movies = session.query(UserMovie).filter((UserMovie.user_id == user_id)).all()
        user_interacted_ids = {um.movie_id for um in user_movies}

        liked_movies = [um for um in user_movies if um.opinion in [Opinion(1), Opinion(2)]]

    tmdb_bearer_token = os.getenv('TMDB_BEARER_TOKEN')
    headers = {'Authorization': f"Bearer {tmdb_bearer_token}"}

    if not liked_movies:
        return suggest_random_movies_excluding(user_interacted_ids, page, page_size)

    recommended_movies_ids = set()

    for user_movie in liked_movies:
        rec_url = f"{os.getenv('TMDB_URL')}/3/movie/{user_movie.movie_id}/recommendations"
        rec_resp = requests.get(rec_url, headers=headers)
        if rec_resp.status_code == 200:
            rec_json = rec_resp.json()
            results = rec_json.get('results', [])
            for r in results:
                recommended_movies_ids.add(r['id'])

    random_ids = fetch_random_popular_ids(n=5, headers=headers)

    all_suggestions = (recommended_movies_ids | random_ids) - user_interacted_ids
    all_suggestions = list(all_suggestions)
    random.shuffle(all_suggestions)

    start = (page - 1) * page_size
    end = start + page_size
    final_movie_ids = all_suggestions[start:end]

    enriched_movies = []
    for movie_id in final_movie_ids:
        enriched = enrich_movie(movie_id, headers=headers)
        if enriched:
            enriched_movies.append(enriched)

    return jsonify(enriched_movies), 200


def suggest_random_movies_excluding(excluded_ids, page, page_size):
    tmdb_bearer_token = os.getenv('TMDB_BEARER_TOKEN')
    headers = {'Authorization': f"Bearer {tmdb_bearer_token}"}

    random_ids = fetch_random_popular_ids(n=50, headers=headers)

    available_ids = random_ids - excluded_ids
    available_ids = list(available_ids)
    random.shuffle(available_ids)

    start = (page - 1) * page_size
    end = start + page_size
    final_ids = available_ids[start:end]

    enriched_movies = []
    for movie_id in final_ids:
        enriched = enrich_movie(movie_id, headers=headers)
        if enriched:
            enriched_movies.append(enriched)

    return jsonify(enriched_movies), 200


def fetch_random_popular_ids(n, headers):
    popular_url = f"{os.getenv('TMDB_URL')}/3/movie/popular"
    resp = requests.get(popular_url, headers=headers, params={'language': 'en-US', 'page': 1})
    if resp.status_code == 200:
        results = resp.json().get('results', [])
        movie_ids = [m['id'] for m in results]
        random.shuffle(movie_ids)
        return set(movie_ids[:n])
    return set()


def enrich_movie(movie_id, headers, locale='FR'):
    movie_details_url = f"{os.getenv('TMDB_URL')}/3/movie/{movie_id}"
    details_response = requests.get(
        movie_details_url,
        headers=headers,
        params={'append_to_response': 'credits'}
    )
    if details_response.status_code != 200:
        return None

    details = details_response.json()

    if not details.get('poster_path'):
        # We need at least a poster to display the movie
        return None

    watch_providers_url = f"{os.getenv('TMDB_URL')}/3/movie/{movie_id}/watch/providers"
    watch_response = requests.get(watch_providers_url, headers=headers)
    watch_providers = {}
    if watch_response.status_code == 200:
        watch_json = watch_response.json()
        watch_providers = watch_json.get('results', {}).get(locale, {})

    available_platforms = []
    if 'flatrate' in watch_providers:
        available_platforms = [p['provider_name'] for p in watch_providers['flatrate']]

    # TODO: Improve when API is fixed
    if 'Netflix basic with Ads' in available_platforms:
        available_platforms = [
            p.replace('Netflix basic with Ads', 'Netflix') for p in available_platforms
        ]
    if 'Amazon Prime Video' in available_platforms:
        available_platforms = [
            p.replace('Amazon Prime Video', 'Prime Video') for p in available_platforms
        ]
    available_platforms = list(set(available_platforms))

    trailer_response = requests.get(
        f"{os.getenv('TMDB_URL')}/3/movie/{movie_id}/videos",
        headers=headers
    )
    trailer_key = extract_trailer_key(trailer_response) if trailer_response.status_code == 200 else None

    enriched = {
        "id": details['id'],
        "title": details['title'],
        "image": f"https://image.tmdb.org/t/p/w500{details['poster_path']}",
        "date": details['release_date'].split('-')[0] if details.get('release_date') else 'N/A',
        "rate": details['vote_average'],
        "overview": details['overview'],
        "trailer_key": trailer_key,
        "runtime": details.get('runtime', 'N/A'),
        "genres": [genre['name'] for genre in details.get('genres', [])],
        "director": next(
            (crew['name'] for crew in details.get('credits', {}).get('crew', []) if crew['job'] == 'Director'),
            'N/A'
        ),
        "platforms": available_platforms
    }

    return enriched


@app.route('/movie/<int:movie_id>', methods=['GET'])
def get_movie(movie_id):
    base_url = f"{os.getenv('TMDB_URL')}/3/movie/"
    movie_response = requests.get(
        f'{base_url}{movie_id}',
        headers={'Authorization': f"Bearer {os.getenv('TMDB_BEARER_TOKEN')}"}
    )
    movie_response_json = movie_response.json()
    trailer_response = requests.get(
        f'{base_url}{movie_id}/videos',
        headers={'Authorization': f"Bearer {os.getenv('TMDB_BEARER_TOKEN')}"}
    )
    movie_details_url = f"{os.getenv('TMDB_URL')}/3/movie/{movie_id}"
    details_response = requests.get(
        movie_details_url,
        headers={'Authorization': f"Bearer {os.getenv('TMDB_BEARER_TOKEN')}"}
    )

    if (trailer_response.status_code == 200 and
            movie_response.status_code == 200 and
            details_response.status_code == 200):
        details = details_response.json()
        return jsonify({
            "id": movie_response_json['id'],
            "title": movie_response_json['title'],
            "image": f"https://image.tmdb.org/t/p/w500{movie_response_json['poster_path']}",
            "date": movie_response_json['release_date'].split('-')[0] if movie_response_json.get('release_date') else 'N/A',
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
            response = requests.get(
                f'{base_url}{movie_id}',
                headers={'Authorization': f"Bearer {os.getenv('TMDB_BEARER_TOKEN')}"}
            )
            trailer_response = requests.get(
                f'{base_url}{movie_id}/videos',
                headers={'Authorization': f"Bearer {os.getenv('TMDB_BEARER_TOKEN')}"}
            )
            movie_details_url = f"{os.getenv('TMDB_URL')}/3/movie/{movie_id}"
            details_response = requests.get(
                movie_details_url,
                headers={'Authorization': f"Bearer {os.getenv('TMDB_BEARER_TOKEN')}"}
            )

            if (response.status_code == 200 and
                    trailer_response.status_code == 200 and
                    details_response.status_code == 200):
                response_json = response.json()
                details = details_response.json()
                detailed_movies.append({
                    "id": response_json['id'],
                    "title": response_json['title'],
                    "image": f"https://image.tmdb.org/t/p/w500{response_json['poster_path']}",
                    "date": response_json['release_date'].split('-')[0] if response_json.get('release_date') else 'N/A',
                    "rate": response_json['vote_average'],
                    "overview": response_json['overview'],
                    "trailer_key": extract_trailer_key(trailer_response),
                    "runtime": details.get('runtime', 'N/A'),
                    "genres": [genre['name'] for genre in details.get('genres', [])],
                    "director": next(
                        (crew['name'] for crew in details.get('credits', {}).get('crew', []) if crew['job'] == 'Director'),
                        'N/A'
                    )
                })
            else:
                print("Could not fetch movie details of movie_id:", movie_id)
            # detailed_movies inverse la liste
            detailed_movies = detailed_movies[::-1]
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
    app.run(debug=True, host='0.0.0.0', port=5001)