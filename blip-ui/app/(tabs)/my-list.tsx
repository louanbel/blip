import React, {useState, useCallback} from "react";
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    Image,
    Dimensions,
    ActivityIndicator, Pressable, SafeAreaView,
} from "react-native";
import {useFocusEffect} from "@react-navigation/native";
import {format_movie_from_api, Movie, Opinion} from "@/models/Movie";
import {useRouter} from "expo-router";

export default function MyList() {
    const [movies, setMovies] = useState<Movie[]>([]);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const fetchMovies = async () => {
        try {
            setLoading(true);
            const response = await fetch(
                `${process.env.EXPO_PUBLIC_API_URL}/user/1/movies?opinion=${Opinion.WANT_TO_WATCH}`
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

    const renderMovie = ({item}: { item: Movie }) => {
        return (
            <View style={styles.column}>
                <Pressable style={styles.card} onPress={() => router.push({
                    pathname: `/pages/movies/[id]`,
                    params: {
                        id: item.id,
                        title: item.title,
                        image: item.image,
                        rate: item.rate,
                        overview: item.overview,
                    },
                })}>
                    <View style={styles.rateContainer}>
                        <Text style={styles.rateText}>{item.rate}/10</Text>
                    </View>
                    <Image
                        source={{uri: `${item.image}`}}
                        style={styles.poster}
                        resizeMode="cover"
                    />
                    <Text style={styles.title} numberOfLines={1}>
                        {item.title}
                    </Text>
                </Pressable>
            </View>
        );
    };
    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.pageTitle}>Watch List</Text>
            {loading && movies.length === 0 && (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#0000ff"/>
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
                        <ActivityIndicator size="small" color="#0000ff"/>
                    ) : null
                }
            />
        </SafeAreaView>
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
        zIndex: 1,
        position: "absolute",
        top: 5,
        alignSelf: "center",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
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