import React, {useEffect, useRef, useState} from "react";
import {
    ActivityIndicator,
    Image,
    Modal,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from "react-native";
import Swiper from "react-native-deck-swiper";
import {FontAwesome5} from "@expo/vector-icons";
import {format_movie_from_api, Movie, Opinion} from "@/models/Movie";
import {SelectableButton} from "@/components/SelectableButton/SelectableButton";
import {Platform} from "@/models/Platform";
import WebView from "react-native-webview";

export default function TinderLikeApp() {
    const swiperRef = useRef<Swiper<Movie> | null>(null);
    const [data, setData] = useState<Movie[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>([]);
    const [filterModalVisible, setFilterModalVisible] = useState(false);
    const [currentStoryIndex, setCurrentStoryIndex] = useState<number>(0);
    const [cardIndex, setCardIndex] = useState(0);
    const [trailerModalVisible, setTrailerModalVisible] = useState(false);
    const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);

    async function fetchMovies() {
        try {
            const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/discover-movies`);
            const data = await response.json();
            const moviesList: Movie[] = data.map((movie: any) => format_movie_from_api(movie));
            setData(moviesList);
        } catch (error) {
            console.error("Error while fetching movie:", error);
        } finally {
            setIsLoading(false);
        }
    }

    async function addMovieOpinion(movie_id: number, opinion: Opinion) {
        try {
            await fetch(`${process.env.EXPO_PUBLIC_API_URL}/user/1/movie`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({movie_id, opinion}),
            });
        } catch (error) {
            console.error("Error while adding film opinion:", error);
        }
    }

    function togglePlatformSelection(platform: Platform) {
        if (selectedPlatforms.includes(platform)) {
            setSelectedPlatforms(selectedPlatforms.filter((p) => p !== platform));
        } else {
            setSelectedPlatforms([...selectedPlatforms, platform]);
        }
    }

    useEffect(() => {
        fetchMovies();
    }, []);

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#0000ff"/>
                <Text>Loading movies...</Text>
            </View>
        );
    }

    function handleCardSideClick(side: string) {
        setCurrentStoryIndex((prevIndex) => {
            return side === "left" ? Math.max(0, prevIndex - 1) : Math.min(1, prevIndex + 1);
        });
    }

    function handleSwipedCard(index: number) {
        setCurrentStoryIndex(0);
        setCardIndex(index + 1);
    }

    return (
        <SafeAreaView style={styles.container}>
            <Modal
                visible={trailerModalVisible}
                transparent
                animationType="slide"
                onRequestClose={() => setTrailerModalVisible(false)}
            >
                <View style={styles.modalContainer}>
                    <TouchableOpacity
                        style={styles.closeButton}
                        onPress={() => setTrailerModalVisible(false)}
                    >
                        <Text style={styles.closeButtonText}>⨯</Text>
                    </TouchableOpacity>
                    {selectedMovie && (
                        <View style={styles.webviewContainer}>
                            <WebView
                                source={{uri: `https://www.youtube.com/embed/${selectedMovie.trailer_key}`}}
                                allowsInlineMediaPlayback
                                javaScriptEnabled
                                domStorageEnabled
                                allowsFullscreenVideo
                            />
                        </View>
                    )}
                </View>
            </Modal>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.appName}>blip</Text>
                <View style={styles.headerIcons}>
                    <TouchableOpacity style={styles.iconButton}>
                        <FontAwesome5 name="user" size={24} color="#000"/>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.iconButton}
                        onPress={() => setFilterModalVisible(true)}
                    >
                        <FontAwesome5 name="filter" size={24} color="#000"/>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Swiper */}
            <View style={styles.swiperContainer}>
                <Swiper
                    infinite
                    key={`${currentStoryIndex}-${data.length}`}
                    cardIndex={cardIndex}
                    containerStyle={styles.swiperContainer}
                    ref={swiperRef}
                    cards={data}
                    renderCard={(card, index) => (
                        <View style={styles.card}>
                            <TouchableWithoutFeedback
                                onPress={() => handleCardSideClick("left")}
                            >
                                <View style={styles.leftZone}/>
                            </TouchableWithoutFeedback>
                            <TouchableWithoutFeedback
                                onPress={() => handleCardSideClick("right")}
                            >
                                <View style={styles.rightZone}/>
                            </TouchableWithoutFeedback>

                            {(currentStoryIndex === 0 || cardIndex !== index) && (
                                <>
                                    <Image
                                        source={{uri: card.image}}
                                        style={styles.image}
                                    />
                                    <View style={styles.infoContainer}>
                                        <Text style={styles.titleText}>{card.title}</Text>
                                    </View>
                                </>
                            )}
                            {currentStoryIndex === 1 && cardIndex === index && (
                                <View style={styles.detailsContainer}>
                                    <Text style={styles.titleText}>{card.title}</Text>
                                    <Text style={styles.extendedOverviewText}>{card.overview}</Text>

                                    <View style={styles.genreContainer}>
                                        {card.genres.map((genre, idx) => (
                                            <Text key={idx} style={styles.genreBadge}>
                                                {genre}
                                            </Text>
                                        ))}
                                    </View>

                                    <View style={styles.infoRow}>
                                        <FontAwesome5 name="calendar-alt" size={16} color="#fff" style={styles.icon} />
                                        <Text style={styles.infoValue}>{card.date}</Text>
                                    </View>

                                    <View style={styles.infoRow}>
                                        <FontAwesome5 name="clock" size={16} color="#fff" style={styles.icon} />
                                        <Text style={styles.infoValue}>{card.runtime} min</Text>
                                    </View>

                                    <View style={styles.infoRow}>
                                        <FontAwesome5 name="user" size={16} color="#fff" style={styles.icon} />
                                        <Text style={styles.infoValue}>{card.director || 'N/A'}</Text>
                                    </View>

                                    <View style={styles.ratingContainer}>
                                        <FontAwesome5 name="star" size={16} color="#FFD700" />
                                        <Text style={styles.ratingText}>{card.rate} / 10</Text>
                                    </View>

                                    <TouchableOpacity
                                        style={styles.trailerButton}
                                        onPress={() => {
                                            setSelectedMovie(card);
                                            setTrailerModalVisible(true);
                                        }}
                                    >
                                        <FontAwesome5 name="play" size={16} color="#fff" />
                                        <Text style={styles.trailerButtonText}>Watch Trailer</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                            <View style={styles.progressContainer}>
                                {[0, 1].map((index) => (
                                    <View
                                        key={index}
                                        style={[
                                            styles.progressBar,
                                            index <= currentStoryIndex && cardIndex !== 0
                                                ? styles.progressBarActive
                                                : styles.progressBarInactive,
                                        ]}
                                    />
                                ))}
                            </View>
                        </View>
                    )}
                    onSwiped={(index) => handleSwipedCard(index)}
                    onSwipedLeft={(cardIndex) => {
                        const movie_id = data[cardIndex].id;
                        addMovieOpinion(movie_id, Opinion.DIDNT_LIKE_IT);
                    }}
                    onSwipedRight={(cardIndex) => {
                        const movie_id = data[cardIndex].id;
                        addMovieOpinion(movie_id, Opinion.LOVED_IT);
                    }}
                    onSwipedTop={(cardIndex) => {
                        const movie_id = data[cardIndex].id;
                        addMovieOpinion(movie_id, Opinion.WANT_TO_WATCH);
                    }}
                    stackSize={3}
                />
                {/* Boutons d'action */}
                <View style={styles.swipeButtons}>
                    <TouchableOpacity
                        style={styles.dislikedButton}
                        onPress={() => swiperRef.current?.swipeLeft()}
                    >
                        <FontAwesome5 name="thumbs-down" size={24} color="#fff"/>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.interestedButton}
                        onPress={() => swiperRef.current?.swipeTop()}
                    >
                        <FontAwesome5 name="eye" size={24} color="#fff"/>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.lovedButton}
                        onPress={() => swiperRef.current?.swipeRight()}
                    >
                        <FontAwesome5 name="thumbs-up" size={24} color="#fff"/>
                    </TouchableOpacity>
                </View>
            </View>
            {/* Modal for Platform Filters */}
            <Modal
                visible={filterModalVisible}
                transparent
                animationType="slide"
                onRequestClose={() => setFilterModalVisible(false)}
            >
                <View style={styles.modalContainer}>
                    <Text style={styles.modalTitle}>Select Platforms</Text>
                    <View style={styles.platforms}>
                        <SelectableButton
                            onClick={() => togglePlatformSelection(Platform.NETFLIX)}
                            selected={selectedPlatforms.includes(Platform.NETFLIX)}
                            icon={require("../../assets/images/netflix.png")}
                            iconUnselected={require("../../assets/images/netflix-unselected.png")}
                            color="black"
                        />
                        <SelectableButton
                            onClick={() => togglePlatformSelection(Platform.AMAZON_PRIME)}
                            selected={selectedPlatforms.includes(Platform.AMAZON_PRIME)}
                            icon={require("../../assets/images/prime-video.png")}
                            color="#0096F6"
                        />
                        <SelectableButton
                            onClick={() => togglePlatformSelection(Platform.HBO_MAX)}
                            selected={selectedPlatforms.includes(Platform.HBO_MAX)}
                            icon={require("../../assets/images/max.png")}
                            iconUnselected={require("../../assets/images/max-unselected.png")}
                            color="#022AE0"
                            iconSize={40}
                        />
                        <SelectableButton
                            onClick={() => togglePlatformSelection(Platform.DISNEY_PLUS)}
                            selected={selectedPlatforms.includes(Platform.DISNEY_PLUS)}
                            icon={require("../../assets/images/disney-plus.png")}
                            iconUnselected={require("../../assets/images/disney-plus-unselected.png")}
                            color="#0C0F35"
                            iconSize={40}
                        />
                    </View>
                    <TouchableOpacity
                        style={styles.applyButton}
                        onPress={() => setFilterModalVisible(false)}
                    >
                        <Text style={styles.applyButtonText}>Apply</Text>
                    </TouchableOpacity>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f8f8f8",
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#f8f8f8",
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 16,
        backgroundColor: "#fff",
        borderBottomWidth: 1,
        borderBottomColor: "#ddd",
    },
    appName: {
        fontSize: 24,
        fontWeight: "bold",
        color: "#333",
    },
    headerIcons: {
        flexDirection: "row",
        gap: 16,
    },
    iconButton: {
        padding: 8,
        backgroundColor: "#f0f0f0",
        borderRadius: 8,
    },
    swiperContainer: {
        width: "100%",
        height: "100%",
        position: "relative",
        backgroundColor: "unset",
    },
    card: {
        position: "relative",
        flexGrow: 0,
        borderRadius: 16,
        overflow: "hidden",
        backgroundColor: "#fff",
        height: "80%",
        top: -50,
    },
    image: {
        width: "100%",
        height: "100%",
        zIndex: 0,
        resizeMode: "cover",
    },
    rateContainer: {
        position: "absolute",
        top: 16,
        right: 16,
        zIndex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        padding: 8,
        borderRadius: 8,
    },
    rate: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "bold",
    },
    infoContainer: {
        position: "absolute",
        width: "100%",
        bottom: 0,
        padding: 16,
        paddingBottom: 30,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex"
    },
    overviewText: {
        fontSize: 16,
        color: "#fff",
    },
    titleText: {
        fontSize: 20,
        fontWeight: "bold",
        zIndex: 3,
        color: "#fff",
    },
    swipeButtons: {
        position: "absolute",
        bottom: 80,
        flexDirection: "row",
        justifyContent: "space-evenly",
        width: "100%",
        zIndex: 2,
        paddingHorizontal: 16,
    },
    lovedButton: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: "#4caf50",
        justifyContent: "center",
        alignItems: "center",
    },
    notInterestedButton: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: "#f44336",
        justifyContent: "center",
        alignItems: "center",
    },
    interestedButton: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: "#2196f3",
        justifyContent: "center",
        alignItems: "center",
    },
    dislikedButton: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: "#ff9800",
        justifyContent: "center",
        alignItems: "center",
    },
    modalContainer: {
        flex: 0,
        width: "100%",
        height: "100%",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: "bold",
        marginBottom: 16,
        color: "#fff",
    },
    platforms: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 16,
        justifyContent: "center",
        marginBottom: 16,
    },
    applyButton: {
        padding: 12,
        backgroundColor: "#4caf50",
        borderRadius: 8,
    },
    applyButtonText: {
        color: "#fff",
        fontWeight: "bold",
        fontSize: 16,
    },
    leftZone: {
        position: "absolute",
        width: "30%",
        height: "100%",
        top: 0,
        left: 0,
        zIndex: 10,
    },
    rightZone: {
        position: "absolute",
        width: "30%",
        height: "100%",
        right: 0,
        top: 0,
        zIndex: 10,
    },
    progressContainer: {
        position: "absolute",
        top: 16,
        left: 16,
        right: 16,
        flexDirection: "row",
        justifyContent: "space-between",
    },
    progressBar: {
        flex: 1,
        height: 4,
        marginHorizontal: 2,
        borderRadius: 2,
    },
    progressBarActive: {
        backgroundColor: "white",
        opacity: 0.8,
    },
    progressBarInactive: {
        backgroundColor: "black",
        opacity: 0.5,
    },
    trailerContainer: {
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
    },
    trailerButtonIcon: {
        marginRight: 10,
    },
    closeButton: {
        position: "absolute",
        top: 40,
        right: 20,
        padding: 0,
        paddingHorizontal: 5,
        backgroundColor: "#f44336",
        borderRadius: 5,
    },
    closeButtonText: {
        color: "#fff",
        fontSize: 40,
    },
    webviewContainer: {
        width: "90%",
        height: "30%",
        flexGrow: 0,
        backgroundColor: "#000",
    },
    extendedOverviewText: {
        fontSize: 14,
        color: "#fff",
        marginVertical: 10,
        lineHeight: 20,
    },
    detailsContainer: {
        width: "100%",
        height: "100%",
        backgroundColor: "#1C1C1E",
        borderRadius: 20,
        padding: 30,
        paddingTop: 50,
        elevation: 5,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
    genreContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        marginVertical: 10,
    },
    genreBadge: {
        backgroundColor: "#FF6347",
        color: "#fff",
        fontSize: 12,
        borderRadius: 10,
        paddingVertical: 5,
        paddingHorizontal: 10,
        marginRight: 5,
        marginBottom: 5,
    },
    infoRow: {
        flexDirection: "row",
        alignItems: "center",
        marginVertical: 5,
    },
    infoValue: {
        fontSize: 16,
        color: "#fff",
        marginLeft: 10,
    },
    icon: {
        marginRight: 5,
    },
    ratingContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginVertical: 10,
    },
    ratingText: {
        fontSize: 16,
        color: "#FFD700",
        marginLeft: 5,
    },
    trailerButton: {
        marginTop: 15,
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#E63946",
        padding: 12,
        borderRadius: 25,
    },
    trailerButtonText: {
        color: "#fff",
        marginLeft: 10,
        fontSize: 16,
    },
});
