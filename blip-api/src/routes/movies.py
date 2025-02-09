from flask import Blueprint, request, jsonify
from src.services.tmdb import (
    discover_movies as discover_movies_service,
    get_movie as get_movie_service
)

movies_bp = Blueprint('movies', __name__)

@movies_bp.route('/discover-movies', methods=['GET'])
def discover_movies():
    return discover_movies_service(request)

@movies_bp.route('/movie/<int:movie_id>', methods=['GET'])
def get_movie(movie_id):
    return get_movie_service(movie_id, []), 200