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
    overview: string
}

export function format_movie_from_api(movie: any): Movie {
    return {
        id: movie.id,
        title: movie.title,
        image: `https://image.tmdb.org/t/p/w500${movie.poster_path}`,
        date: movie.release_date.split("-")[0],
        rate: parseFloat(movie.vote_average.toFixed(1)),
        overview: movie.overview
    }
}