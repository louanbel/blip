
from src.database import db
from sqlalchemy import Column, Integer, ForeignKey, Enum

from src.database.types import Opinion

class User(db.Model):
    __tablename__ = 'users'

    id = Column(Integer, primary_key=True)
    name = Column(db.String(50), nullable=False)
    email = Column(db.String(100), unique=True)

    movies = db.relationship('UserMovie', back_populates='user')

    def __repr__(self):
        return f'<User id={self.id}>'

class UserMovie(db.Model):
    __tablename__ = 'user_movie'

    movie_id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), primary_key=True)
    opinion = Column(Enum(Opinion), primary_key=True)

    user = db.relationship('User', back_populates='movies')
    def __repr__(self):
        return f'<UserMovie movie_id={self.movie_id}, user_id={self.user_id}, opinion={self.opinion.name}>'