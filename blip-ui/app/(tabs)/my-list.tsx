import React, {useState, useCallback} from "react";
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    Image,
    Dimensions,
    ActivityIndicator,
} from "react-native";
import {useFocusEffect} from "@react-navigation/native";
import {format_movie_from_api, Movie, Opinion} from "@/models/Movie";

export default function MyList() {
    const [movies, setMovies] = useState<Movie[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchMovies = async () => {
        try {
            setLoading(true);
            const response = await fetch(
                `http://127.0.0.1:5000/user/1/movies?opinion=${Opinion.WANT_TO_WATCH}`
            );
            const data = await response.json();
            const moviesList: Movie[] = data.map((movie: any) => format_movie_from_api(movie));

            setMovies((prevMovies) => {
                const movieSet = new Map();
                [...prevMovies, ...moviesList].forEach((movie) => movieSet.set(movie.id, movie));
                return Array.from(movieSet.values());
            });
        } catch (error) {
            console.error("Could not fetch watchlist:", error);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchMovies();
        }, [])
    );

    const renderMovie = ({ item }: { item: Movie }) => (
        <View style={styles.column}>
            <View style={styles.card}>
                <View style={styles.rateContainer}>
                    <Text style={styles.rateText}>{item.rate}/10</Text>
                </View>
                <Image
                    source={{ uri: `${item.image}` }}
                    style={styles.poster}
                    resizeMode="cover"
                />
                <Text style={styles.title} numberOfLines={1}>
                    {item.title}
                </Text>
            </View>
        </View>
    );
    return (
        <View style={styles.container}>
            <Text style={styles.pageTitle}>Watch List</Text>
            {loading && movies.length === 0 && (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#0000ff" />
                    <Text>Loading...</Text>
                </View>
            )}
            <FlatList
                data={movies}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderMovie}
                numColumns={3}
                columnWrapperStyle={styles.columnWrapper}
                contentContainerStyle={styles.list}
                ListFooterComponent={
                    loading && movies.length > 0 ? (
                        <ActivityIndicator size="small" color="#0000ff" />
                    ) : null
                }
            />
        </View>
    );
}
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f8f9fa",
        paddingTop: 20,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    pageTitle: {
        fontSize: 24,
        fontWeight: "bold",
        textAlign: "center",
        marginBottom: 10,
    },
    list: {
        paddingHorizontal: 10,
    },
    columnWrapper: {
        justifyContent: "space-between",
    },
    column: {
        flex: 1,
        margin: 5,
        maxWidth: Dimensions.get("window").width / 3 - 10,
    },
    card: {
        alignItems: "center",
        backgroundColor: "#ffffff",
        borderRadius: 8,
        overflow: "hidden",
        elevation: 2,
        width: "100%",
    },
    poster: {
        width: "100%",
        height: 150,
    },
    rateContainer: {
        zIndex: 1, // Pour afficher le texte au-dessus de l'image
        position: "absolute",
        top: 5, // Positionné en haut
        alignSelf: "center", // Centré horizontalement
        backgroundColor: "rgba(0, 0, 0, 0.5)", // Fond semi-transparent
        borderRadius: 15,
        paddingHorizontal: 10,
        paddingVertical: 5,
    },
    rateText: {
        color: "#fff",
        fontSize: 14,
        fontWeight: "bold",
        textAlign: "center",
    },
    title: {
        fontSize: 12,
        fontWeight: "bold",
        textAlign: "center",
        marginVertical: 5,
        paddingHorizontal: 5,
    },
});