def extract_trailer_key(trailer_response):
    return next((trailer['key'] for trailer in trailer_response.json()['results'] if trailer['type'] == 'Trailer'), None)