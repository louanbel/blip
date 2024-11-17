import React, {useEffect, useRef, useState} from "react";
import {StyleSheet, Text, TouchableOpacity, View, Image, ActivityIndicator} from "react-native";
import Swiper from "react-native-deck-swiper";
import {FontAwesome5} from "@expo/vector-icons";
import {Opinion, Movie, format_movie_from_api} from "@/models/Movie";

export default function SwiperComponent() {
    const swiperRef = useRef<Swiper<Movie> | null>(null);
    const [data, setData] = useState<Movie[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    async function fetchMovies() {
        try {
            const response = await fetch(
                'https://api.themoviedb.org/3/discover/movie?include_adult=false&language=en-US&page=1&sort_by=popularity.desc',
                {
                    headers: {
                        Authorization: "Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIzOGIyMTQ1ZTkyMDVlN2I4ZmI0ODk5OGIxZDlmYjFlNyIsIm5iZiI6MTczMTM5NjI2Ni44NDM2NTgsInN1YiI6IjY3MzMwMWMxM2E4ZWEyYTg3OWQ2ZTNkOCIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.1xim3IPXiO37eB5uOavH6IdeOJCdGM2OwonK9VEHET4"
                    }
                }
            );
            const json = await response.json();
            const formattedData = json.results.map((movie: any) => format_movie_from_api(movie));
            setData(formattedData);
        } catch (error) {
            console.error("Erreur lors de la récupération des films :", error);
        } finally {
            setIsLoading(false);
        }
    }

    async function addMovieOpinion(movie_id: number, opinion: Opinion) {
        try {
            const response = await fetch('http://127.0.0.1:5000/user/1/movie', {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    movie_id: movie_id,
                    opinion: opinion,
                }),
            });

            const json = await response.json();
            console.log(json);
        } catch (error) {
            console.error("Erreur lors de l'ajout de l'opinion du film :", error);
        }

    }

    useEffect(() => {
        fetchMovies();
    }, []);

    if (isLoading) {
        return (
            <View>
                <ActivityIndicator size="large" color="#0000ff"/>
                <Text>Loading movies...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Swiper
                ref={swiperRef}
                infinite
                cards={data}
                renderCard={(card) => (
                    <View style={styles.card}>
                        <Image source={{uri: card.image}} style={styles.image}/>
                        <View style={styles.rateContainer}>
                            <Text style={styles.rate}>{card.rate}/10</Text>
                        </View>
                        <View style={styles.titleContainer}>
                            <Text style={styles.titleText}>{card.title} ({card.date})</Text>
                        </View>
                    </View>
                )}
                onSwiped={(cardIndex) => {
                    // fetch id of the movie
                    console.log(`Swiped card index: ${cardIndex}`);
                }}
                onSwipedLeft={(cardIndex) => {
                    const movie_id = data[cardIndex].id;
                    addMovieOpinion(movie_id, Opinion.PASS);
                    console.log(`Swiped card, movie: ${movie_id}, opinion: PASS`);
                }}
                onSwipedRight={(cardIndex) => {
                    const movie_id = data[cardIndex].id;
                    addMovieOpinion(movie_id, Opinion.WANT_TO_WATCH);
                    console.log(`Swiped card, movie: ${movie_id}, opinion: WANT_TO_WATCH`);
                }}
                onSwipedTop={(cardIndex) => {
                    const movie_id = data[cardIndex].id;
                    addMovieOpinion(movie_id, Opinion.LOVED_IT);
                    console.log(`Swiped card, movie: ${movie_id}, opinion: LOVED_IT`);
                }}
                onSwipedBottom={(cardIndex) => {
                    const movie_id = data[cardIndex].id;
                    addMovieOpinion(movie_id, Opinion.DIDNT_LIKE_IT);
                    console.log(`Swiped card, movie: ${movie_id}, opinion: DIDNT_LIKE_IT`);
                }}
                onSwipedAll={() => {
                    console.log("All cards swiped!");
                }}
                cardIndex={0}
                backgroundColor={"#f0f0f0"}
                stackSize={3}
                stackScale={10}
                stackSeparation={15}
                disableTopSwipe={false}
                disableBottomSwipe={false}
                disableLeftSwipe={false}
                disableRightSwipe={false}
                overlayLabels={{
                    left: {
                        title: "Pass 😑",
                        style: {
                            label: styles.overlayLabelLeft,
                            wrapper: {
                                flexDirection: "column",
                                alignItems: "flex-end",
                                justifyContent: "flex-start",
                                marginTop: 30,
                                marginLeft: -30,
                            },
                        },
                    },
                    right: {
                        title: "Watch 👀",
                        style: {
                            label: styles.overlayLabelRight,
                            wrapper: {
                                flexDirection: "column",
                                alignItems: "flex-start",
                                justifyContent: "flex-start",
                                marginTop: 30,
                                marginLeft: 30,
                            },
                        },
                    },
                    top: {
                        title: "Loved it 👍️",
                        style: {
                            label: styles.overlayLabelTop,
                            wrapper: {
                                flexDirection: "column",
                                alignItems: "center",
                                justifyContent: "flex-end",
                                height: "75%",
                            },
                        },
                    },
                    bottom: {
                        title: "Didn’t like it 👎",
                        style: {
                            label: styles.overlayLabelBottom,
                            wrapper: {
                                flexDirection: "column",
                                alignItems: "center",
                                justifyContent: "flex-start",
                                paddingTop: 30,
                            },
                        },
                    },
                }}
            />

            <View style={styles.buttonContainer}>
                <TouchableOpacity
                    style={[styles.button, styles.lovedButton]}
                    onPress={() => {
                        if (swiperRef.current) {
                            swiperRef.current.swipeTop();
                        }
                    }}
                >
                    <FontAwesome5 name="thumbs-up" size={24} color="#fff"/>
                    <Text style={styles.buttonText}>Loved it</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.button, styles.dislikedButton]}
                    onPress={() => {
                        if (swiperRef.current) {
                            swiperRef.current.swipeBottom();
                        }
                    }}
                >
                    <FontAwesome5 name="thumbs-down" size={24} color="#fff"/>
                    <Text style={styles.buttonText}>Didn’t like it</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.button, styles.interestedButton]}
                    onPress={() => {
                        if (swiperRef.current) {
                            swiperRef.current.swipeRight();
                        }
                    }}
                >
                    <FontAwesome5 name="eye" size={24} color="#fff"/>
                    <Text style={styles.buttonText}>Watch</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.button, styles.notInterestedButton]}
                    onPress={() => {
                        if (swiperRef.current) {
                            swiperRef.current.swipeLeft();
                        }
                    }}
                >
                    <FontAwesome5 name="ban" size={24} color="#fff"/>
                    <Text style={styles.buttonText}>Pass</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f0f0f0",
    },
    card: {
        flex: 0.8,
        borderRadius: 15,
        shadowColor: "#000",
        shadowOffset: {width: 0, height: 10},
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 8,
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
    },
    image: {
        width: "100%",
        height: "100%",
        borderRadius: 15,
    },
    rateContainer: {
        position: "absolute",
        top: 0,
        width: "25%",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        padding: 12,
        borderRadius: 15,
        marginTop: 10
    },
    rate: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#fff",
        textAlign: "center",
        alignSelf: "center",
    },
    titleContainer: {
        position: "absolute",
        bottom: 0,
        width: "100%",
        padding: 12,
        borderBottomLeftRadius: 15,
        borderBottomRightRadius: 15,
    },
    titleText: {
        fontSize: 20,
        fontWeight: "600",
        color: "#fff",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        textAlign: "center",
        alignSelf: "center",
    },
    buttonContainer: {
        flexDirection: "row",
        justifyContent: "space-around",
        padding: 15,
        backgroundColor: "#f0f0f0",
        position: "absolute",
        bottom: 0,
        width: "100%",
    },
    button: {
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 10,
        borderRadius: 10,
        flex: 1,
        marginHorizontal: 5,
    },
    lovedButton: {
        backgroundColor: "#4CAF50",
    },
    dislikedButton: {
        backgroundColor: "#F44336",
    },
    interestedButton: {
        backgroundColor: "#2196F3",
    },
    notInterestedButton: {
        backgroundColor: "#9E9E9E",
    },
    buttonText: {
        color: "#fff",
        fontSize: 14,
        marginTop: 5,
        fontWeight: "bold",
        textAlign: "center",
    },
    overlayLabelLeft: {
        backgroundColor: "rgba(158, 158, 158, 0.8)",
        color: "white",
        fontSize: 20,
        fontWeight: "600",
        padding: 8,
        borderRadius: 10,
    },
    overlayLabelRight: {
        backgroundColor: "rgba(33, 150, 243, 0.8)",
        color: "white",
        fontSize: 20,
        fontWeight: "600",
        padding: 8,
        borderRadius: 10,
    },
    overlayLabelTop: {
        backgroundColor: "rgba(76, 175, 80, 0.8)",
        color: "white",
        fontSize: 20,
        fontWeight: "600",
        padding: 8,
        borderRadius: 10,
    },
    overlayLabelBottom: {
        backgroundColor: "rgba(244, 67, 54, 0.8)",
        color: "white",
        fontSize: 20,
        fontWeight: "600",
        padding: 8,
        borderRadius: 10,
    },
});
