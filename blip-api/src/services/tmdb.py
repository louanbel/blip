import os
import random
from datetime import datetime

from sqlalchemy import or_

import requests
from flask import jsonify

from src.app import redis_client
from src.utils import extract_trailer_key
from src.database.models import User, UserMovie, TmdbMovie, WatchProvider
from src.database.types import Opinion
from src.database import db
from sqlalchemy.orm import Session
import time

TMDB_URL = os.getenv('TMDB_URL')
TMDB_BEARER_TOKEN = os.getenv('TMDB_BEARER_TOKEN')
HEADERS = {'Authorization': f"Bearer {TMDB_BEARER_TOKEN}"}


def discover_movies(request):
    # Evaluate response time
    start = time.time()

    user_id = request.args.get('user_id', type=int)
    if not user_id:
        return jsonify({'message': 'Missing user_id parameter'}), 400

    platforms_param = request.args.get('platforms', '')
    platforms = [platform.strip() for platform in platforms_param.split(',') if platform]

    locale = request.args.get('locale', 'FR')

    with Session(db.engine) as session:
        user = session.get(User, user_id)
        if not user:
            return jsonify({'message': 'User not found'}), 404
        user_movies = session.query(UserMovie).filter(UserMovie.user_id == user_id).all()
        user_interacted_ids = {um.movie_id for um in user_movies}

        provider_filters = [WatchProvider.provider_name.ilike(f"%{provider}%") for provider in platforms]
        providers = session.query(WatchProvider.provider_id, WatchProvider.provider_name).filter(or_(*provider_filters)).all()

    liked_movies = [um for um in user_movies if
                    um.opinion in [Opinion(Opinion.LOVED_IT), Opinion(Opinion.WANT_TO_WATCH)]]

    # Fetch recommended movies
    recommended_movies = []
    if liked_movies:
        random.shuffle(liked_movies)
        for user_movie in liked_movies:
            if len(recommended_movies) >= 16:
                break
            reco_url = f"{TMDB_URL}/3/movie/{user_movie.movie_id}/recommendations"
            reco_res = requests.get(reco_url, headers=HEADERS)
            if reco_res.status_code == 200:
                reco_json = reco_res.json()
                print(
                    f"- Recommendation for movie: {user_movie.movie_id}, results: {len(reco_json.get('results', []))}")
                for reco in reco_json.get('results', []):
                    if len(recommended_movies) >= 8:
                        break
                    if user_interacted_ids and reco['id'] in user_interacted_ids:
                        continue
                    enriched_recommended_movie = get_movie(reco['id'], providers, locale)
                    if enriched_recommended_movie:
                        recommended_movies.append(enriched_recommended_movie)


    random_movies = fetch_random_popular_movies(n=20 - len(recommended_movies), providers=providers, locale=locale,
                                                excluded_ids=user_interacted_ids, user_id=user_id)


    final_movies = recommended_movies + random_movies

    print("==============")
    print("- Number of recommended movies:", len(recommended_movies))
    print("- Number of random movies:", len(random_movies))
    print("- Number of enriched movies:", len(final_movies))
    print("==============")

    end = time.time()
    print(f"🕒 Total elapsed time: {end - start:.2f}s")
    return jsonify(final_movies), 200


def fetch_random_popular_movies(n, user_id, excluded_ids, providers, locale='FR'):
    movies = []
    page = int(redis_client.get(f"random_page_{user_id}") or 1)
    max_pages = page + 10

    with Session(db.engine) as session:
        # TODO: IMPROVE case paramount +, DisneyNow
        provider_filters = [WatchProvider.provider_name.ilike(f"%{provider}%") for provider in providers]
        providers_ids = session.query(WatchProvider.provider_id).filter(or_(*provider_filters)).all()
        providers_ids = [p[0] for p in providers_ids]
        print(f"🔍 Found {len(providers_ids)} providers in db")

    while len(movies) < n and page <= max_pages:
        print(f"📡 Fetching page {page} | Providers: {providers}")
        params = {
            'language': f"{locale.lower()}-{locale.upper()}",
            'page': page,
            'sort_by': 'popularity.desc',
            'watch_region': locale.upper(),
        }

        if providers:
            params['with_watch_providers'] = '|'.join(map(str, providers_ids))

        popular_url = f"{os.getenv('TMDB_URL')}/3/discover/movie"
        resp = requests.get(popular_url, headers=HEADERS, params=params)

        if resp.status_code != 200:
            print(f"⚠️ Error TMDb: {resp.status_code} - {resp.text}")
            break

        results = resp.json().get('results', [])
        ids_page = {m['id'] for m in results}
        ids_page -= excluded_ids

        for movie_id in ids_page:
            movie = get_movie(movie_id, providers, locale)
            if movie:
                movies.append(movie)
        page += 1

    redis_client.set(f"random_page_{user_id}", page, ex=86400)

    return movies


def fetch_movie_providers(movie_id, locale='FR'):
    watch_providers_url = f"{TMDB_URL}/3/movie/{movie_id}/watch/providers"
    watch_response = requests.get(watch_providers_url, headers=HEADERS)
    watch_providers = {}
    if watch_response.status_code == 200:
        watch_providers = watch_response.json().get('results', {}).get(locale, {})

    available_platforms = []
    if 'flatrate' in watch_providers:
        available_platforms = [(p['provider_name'], p['provider_id']) for p in watch_providers['flatrate']]

    if 'Netflix basic with Ads' in [p[0] for p in available_platforms]:
        available_platforms = [(p[0].replace('Netflix basic with Ads', 'Netflix'), p[1]) for p in available_platforms]
    if 'Amazon Prime Video' in [p[0] for p in available_platforms]:
        available_platforms = [(p[0].replace('Amazon Prime Video', 'Prime Video'), p[1]) for p in available_platforms]

    return available_platforms


def fetch_and_store_trailer_key(movie_id):
    base_url = f"{TMDB_URL}/3/movie/"
    trailer_response = requests.get(f"{base_url}{movie_id}/videos", headers=HEADERS)
    if trailer_response.status_code == 200:
        trailer_key = extract_trailer_key(trailer_response)
        # Store result in DB
        db.session.query(TmdbMovie).filter(TmdbMovie.id == movie_id).update({'trailer_key': trailer_key,
                                                                            'trailer_key_last_updated': datetime.now()})
        db.session.commit()
        print(f"🗄️ Stored Trailer Key for movie: {movie_id}")
        return trailer_key
    else:
        print(f"Error fetching trailer key for movie {movie_id}")
        return None


def fetch_and_store_movie_details(movie_id):
    url = f"{TMDB_URL}/3/movie/{movie_id}"
    response = requests.get(url, headers=HEADERS)
    if response.status_code == 200:
        response_json = response.json()
        # Store result in db
        movie = TmdbMovie(
            id=response_json.get('id'),
            title=response_json.get('title'),
            vote_average=response_json.get('vote_average'),
            vote_count=response_json.get('vote_count'),
            status=response_json.get('status'),
            release_date=response_json.get('release_date'),
            revenue=response_json.get('revenue'),
            runtime=response_json.get('runtime'),
            adult=response_json.get('adult'),
            backdrop_path=response_json.get('backdrop_path'),
            budget=response_json.get('budget'),
            homepage=response_json.get('homepage'),
            imdb_id=response_json.get('imdb_id'),
            original_language=response_json.get('original_language'),
            original_title=response_json.get('original_title'),
            overview=response_json.get('overview'),
            popularity=response_json.get('popularity'),
            poster_path=response_json.get('poster_path'),
            tagline=response_json.get('tagline'),
            genres=','.join([genre['name'] for genre in response_json.get('genres')]),
            production_companies=response_json.get('production_companies'),
            production_countries=response_json.get('production_countries'),
            spoken_languages=response_json.get('spoken_languages'),
            keywords=response_json.get('keywords'),
        )
        db.session.add(movie)
        db.session.commit()
        print(f"🗄️ Stored Movie Details of movie: {movie.id}")
        return movie
    else:
        print(f"⚠️ TMDB Error while fetching movie details: {response.status_code} - {response.text}")
        return None

def fetch_and_store_movie_watch_providers(movie_id, locale):
    available_platforms = fetch_movie_providers(movie_id, locale)
    watch_providers_ids = [p[1] for p in available_platforms]
    db.session.query(TmdbMovie).filter(TmdbMovie.id == movie_id).update(
        {'watch_providers_ids': watch_providers_ids, 'watch_providers_last_updated': datetime.now()})
    db.session.commit()
    print(f"🗄️ Stored Watch Providers for movie {movie_id}")
    return watch_providers_ids

def get_movie(movie_id, selected_providers, locale='FR'):
    movie = db.session.query(TmdbMovie).get(movie_id)
    if not movie:
        movie = fetch_and_store_movie_details(movie_id)
        if not movie:
            print(f"⚠️ Error fetching movie {movie_id}")
            return None

    if movie.watch_providers_ids is None:
        movie.watch_providers_ids = fetch_and_store_movie_watch_providers(movie_id, locale)

    if movie.watch_providers_ids and movie.watch_providers_last_updated < datetime.now().date():
        movie.watch_providers_ids = fetch_and_store_movie_watch_providers(movie_id, locale)

    if selected_providers and not set([s[0] for s in selected_providers]).intersection(movie.watch_providers_ids):
        return None

    # TODO: Improve because we loose a lot of movies
    if not movie.poster_path:
        return None

    if not movie.trailer_key:
        movie.trailer_key = fetch_and_store_trailer_key(movie_id)

    if movie.trailer_key and movie.trailer_key_last_updated < datetime.now().date():
        movie.trailer_key = fetch_and_store_trailer_key(movie_id)

    enriched = {
        "id": movie.id,
        "title": movie.title,
        "image": f"https://image.tmdb.org/t/p/w500{movie.poster_path}",
        "date": movie.release_date.split('-')[0] if movie.release_date else 'N/A',
        "rate": movie.vote_average,
        "overview": movie.overview,
        "trailer_key": movie.trailer_key,
        "runtime": movie.runtime if movie.runtime else 'N/A',
        "genres": [genre.strip() for genre in movie.genres.split(',')],
        "platforms": []
    }

    return enriched


def fetch_watch_providers():
    url = f"{TMDB_URL}/3/watch/providers/movie?language=en-US"

    response = requests.get(url, headers=HEADERS)
    if response.status_code == 200:
        return response.json().get("results", [])
    else:
        print(f"⚠️ TMDB Error while fetching providers: {response.status_code} - {response.text}")
        return []


def store_watch_providers():
    providers = fetch_watch_providers()
    with Session(db.engine) as session:
        for provider in providers:
            existing_provider = session.query(WatchProvider).filter_by(provider_id=provider["provider_id"]).first()
            if not existing_provider:
                new_provider = WatchProvider(provider_id=provider["provider_id"],
                                             provider_name=provider["provider_name"])
                session.add(new_provider)

        session.commit()
    print(f"✅ {len(providers)} watch providers stored in db.")
