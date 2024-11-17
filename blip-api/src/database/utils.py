from src.database import db


def create_tables(app):
    from . import models
    with app.app_context():
        db.create_all()