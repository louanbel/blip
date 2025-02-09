from flask import Blueprint, request, jsonify
from src.database.models import User, UserMovie
from src.database import db
from src.database.types import Opinion
from sqlalchemy.orm import Session

users_bp = Blueprint('users', __name__, url_prefix='/user')

@users_bp.route('/<int:user_id>/movies', methods=['GET'])
def get_user_movies(user_id):
    opinion_filter = request.args.get('opinion')
    if opinion_filter:
        user_movies = UserMovie.query.filter_by(user_id=user_id, opinion=Opinion(int(opinion_filter))).all()
    else:
        user_movies = UserMovie.query.filter_by(user_id=user_id).all()

    detailed_movies = []
    from src.services.tmdb import enrich_movie_by_id
    for user_movie in user_movies:
        enriched = enrich_movie_by_id(user_movie.movie_id)
        if enriched:
            detailed_movies.append(enriched)

    detailed_movies = detailed_movies[::-1]
    return jsonify(detailed_movies), 200

@users_bp.route('/<int:user_id>/movie', methods=['POST'])
def add_user_movie(user_id):
    data = request.json
    movie_id = data['movie_id']
    opinion = data['opinion']

    with db.engine.begin() as connection:
        session = Session(connection)
        user = session.get(User, user_id)
        if user is None:
            return jsonify({'message': 'User not found'}), 404

        # Vérification en utilisant SQLAlchemy ORM
        if session.query(UserMovie).filter_by(user_id=user_id, movie_id=movie_id).first():
            return jsonify({'message': 'Movie already added to user'}), 200

        new_user_movie = UserMovie(user_id=user_id, movie_id=movie_id, opinion=Opinion(opinion))
        session.add(new_user_movie)
        session.commit()

    return jsonify({'message': 'Movie added to user'}), 200

@users_bp.route('', methods=['POST'])
def create_user():
    data = request.json
    name = data['name']
    email = data['email']

    with db.engine.begin() as connection:
        session = Session(connection)
        user = User(name=name, email=email)
        session.add(user)
        session.commit()

    return jsonify({'message': 'User created'}), 200