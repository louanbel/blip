import React, { useState, useCallback } from "react";
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    Image,
    Dimensions,
    ActivityIndicator,
    Pressable,
    SafeAreaView,
    RefreshControl
} from "react-native";
import { format_movie_from_api, Movie, Opinion } from "@/models/Movie";
import { useFocusEffect, useRouter } from "expo-router";

export default function MyList() {
    const [movies, setMovies] = useState<Movie[]>([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const router = useRouter();

    const fetchMovies = async (reset = false) => {
        if (!hasMore && !reset) return;
        try {
            if (reset) setRefreshing(true);
            else setLoading(true);

            const response = await fetch(
                `${process.env.EXPO_PUBLIC_API_URL}/user/1/movies?opinion=${Opinion.WANT_TO_WATCH}&page=${reset ? 1 : page}&t=${Date.now()}r`
            );
            const data = await response.json();

            const moviesList: Movie[] = data.movies.map((movie: any) => format_movie_from_api(movie));

            if (reset) {
                setMovies(moviesList);
                setPage(1);
            } else if (moviesList.length > 0) {
                setMovies((prevMovies) => {
                    const movieSet = new Map();
                    [...prevMovies, ...moviesList].forEach((movie) => movieSet.set(movie.id, movie));
                    return Array.from(movieSet.values());
                });
                setPage((prevPage) => prevPage + 1);
            }

            setHasMore(data.has_more);
        } catch (error) {
            console.error("Could not fetch watchlist:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchMovies(true);
        }, [])
    );

    function handleLoadMore() {
        fetchMovies();
    }

    function handleRefresh() {
        fetchMovies(true);
    }

    const renderMovie = ({ item }: { item: Movie }) => (
        <View style={styles.column}>
            <Pressable
                style={styles.card}
                onPress={() =>
                    router.push({
                        pathname: `/pages/movies/[id]`,
                        params: {
                            id: item.id,
                            title: item.title,
                            image: item.image,
                            rate: item.rate,
                            overview: item.overview,
                            genres: item.genres as string[],
                            date: item.date,
                            runtime: item.runtime,
                            trailer_key: item.trailer_key,
                        },
                    })
                }
            >
                <View style={styles.rateContainer}>
                    <Text style={styles.rateText}>{item.rate}/10</Text>
                </View>
                <Image source={{ uri: item.image }} style={styles.poster} resizeMode="cover" />
                <Text style={styles.title} numberOfLines={1}>
                    {item.title}
                </Text>
            </Pressable>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.pageTitle}>Watch List</Text>
            {loading && movies.length === 0 ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#0000ff" />
                    <Text>Loading...</Text>
                </View>
            ) : (
                <FlatList
                    data={movies}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderMovie}
                    numColumns={3}
                    columnWrapperStyle={styles.columnWrapper}
                    contentContainerStyle={styles.list}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
                    }
                    onEndReached={hasMore ? handleLoadMore : null}
                    onEndReachedThreshold={0.5}
                    ListFooterComponent={
                        hasMore && loading ? <ActivityIndicator size="small" color="#0000ff" /> : null
                    }
                />
            )}
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