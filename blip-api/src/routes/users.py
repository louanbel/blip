from flask import Blueprint, request, jsonify
from src.database.models import User, UserMovie
from src.database import db
from src.database.types import Opinion
from sqlalchemy.orm import Session

users_bp = Blueprint('users', __name__, url_prefix='/user')

@users_bp.route('/<int:user_id>/movies', methods=['GET'])
def get_user_movies(user_id):
    opinion_filter = request.args.get('opinion')
    page = int(request.args.get('page', 1))
    page_size = 20

    query = UserMovie.query.filter_by(user_id=user_id)
    if opinion_filter:
        query = query.filter(UserMovie.opinion == Opinion(int(opinion_filter)))

    total_movies = query.count()
    user_movies = query.order_by(UserMovie.created_at.desc()).limit(page_size).offset(page_size * (page - 1)).all()
    has_more = (page * page_size) < total_movies

    detailed_movies = []
    from src.services.tmdb import get_movie
    for user_movie in user_movies:
        enriched = get_movie(user_movie.movie_id, [])
        if enriched:
            detailed_movies.append(enriched)

    print(f"✅ WatchList retrieved, total: {total_movies}, {[d["id"] for d in detailed_movies]}, {has_more}")
    return jsonify({"movies": detailed_movies, "has_more": has_more}), 200


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

        if session.query(UserMovie).filter_by(user_id=user_id, movie_id=movie_id).first():
            return jsonify({'message': 'Movie already added to user'}), 200

        print(f"✅ Adding movie {movie_id} to user {user_id}")
        new_user_movie = UserMovie(user_id=user_id, movie_id=movie_id, opinion=Opinion(opinion))
        session.add(new_user_movie)
        session.flush()
        session.commit()
        session.expire_all()

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