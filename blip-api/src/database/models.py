
from src.database import db
from sqlalchemy import Column, Integer, ForeignKey, Enum, BigInteger, Text, Float, Boolean, VARCHAR, ARRAY, Date
from sqlalchemy.dialects.postgresql import JSONB

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


class TmdbMovie(db.Model):
    __tablename__ = 'tmdb_movies'

    id = Column(BigInteger, primary_key=True)
    title = Column(Text, nullable=False)
    vote_average = Column(Float)
    vote_count = Column(BigInteger)
    status = Column(Text)
    release_date = Column(Text)
    revenue = Column(BigInteger)
    runtime = Column(Integer)
    adult = Column(Boolean)
    backdrop_path = Column(Text)
    budget = Column(BigInteger)
    homepage = Column(Text)
    imdb_id = Column(VARCHAR(20))
    original_language = Column(VARCHAR(10))
    original_title = Column(Text)
    overview = Column(Text)
    popularity = Column(Float)
    poster_path = Column(Text)
    tagline = Column(Text)
    genres = Column(JSONB)
    production_companies = Column(JSONB)
    production_countries = Column(JSONB)
    spoken_languages = Column(JSONB)
    keywords = Column(JSONB)
    trailer_key = Column(Text)
    trailer_key_last_updated = Column(Date)
    watch_providers_ids = Column(ARRAY(Integer), nullable=True)
    watch_providers_last_updated = Column(Date)


    def __repr__(self):
        return f"<TmdbMovie id={self.id}, title={self.title}, vote_average={self.vote_average}>"

class WatchProvider(db.Model):
    __tablename__ = "watch_providers"

    id = Column(Integer, primary_key=True)
    provider_id = Column(Integer, unique=True, nullable=False)
    provider_name = Column(Text, nullable=False)

    def __repr__(self):
        return f"<WatchProvider id={self.id}, provider_name={self.provider_name}>"