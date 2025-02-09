from flask import Blueprint, jsonify, current_app
from src.database.utils import create_tables
from src.services.tmdb import store_watch_providers

main_bp = Blueprint('main', __name__)

@main_bp.route('/', methods=['GET'])
def home():
    create_tables(current_app)
    store_watch_providers()
    return jsonify({'message': 'ok'}), 200