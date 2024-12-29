export enum Opinion {
    LOVED_IT = 1,
    DIDNT_LIKE_IT = 2,
    WANT_TO_WATCH = 3,
    PASS = 4,
}

export interface Movie {
    id: number;
    title: string;
    image: string,
    date: string,
    rate: number,
    overview: string,
    trailer_key: string | null,
    runtime: string,
    genres: string[],
    director: string,
}

export function format_movie_from_api(movie: any): Movie {
    console.log(movie);
    return {
        id: movie.id,
        title: movie.title,
        image: movie.image,
        date: movie.date,
        rate: parseFloat(movie.rate.toFixed(1)),
        overview: movie.overview,
        trailer_key: movie.trailer_key === "null" ? null : movie.trailer_key,
        runtime: movie.runtime,
        genres: movie.genres,
        director: movie.director,
    }
}