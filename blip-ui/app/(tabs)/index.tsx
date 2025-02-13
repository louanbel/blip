import React, {ReactElement, useEffect, useRef, useState} from "react";
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
import {toImageSource} from "@/app/helpers/movie";

export default function TinderLikeApp() {
    const swiperRef = useRef<Swiper<Movie> | null>(null);

    const [movieList, setMovieList] = useState<Movie[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isPreloading, setIsPreloading] = useState(false);
    const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>([Platform.DISNEY_PLUS, Platform.NETFLIX, Platform.PRIME_VIDEO, Platform.HBO_MAX, Platform.PARAMOUNT_PLUS]);
    const [filterModalVisible, setFilterModalVisible] = useState(false);
    const [currentStoryIndex, setCurrentStoryIndex] = useState<number>(0);
    const [cardIndex, setCardIndex] = useState(0);
    const [trailerModalVisible, setTrailerModalVisible] = useState(false);
    const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
    const [tempSelectedPlatforms, setTempSelectedPlatforms] = useState<Platform[]>(selectedPlatforms);


    async function fetchMovies(prefetching?: boolean) {
        try {
            console.log("URL", process.env.EXPO_PUBLIC_API_URL);
            const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/discover-movies?user_id=1&platforms=${selectedPlatforms.join(",").replace('+', '').replace(" ", "+")}`);
            const data = await response.json();
            const newMovieList: Movie[] = data.map((movie: any) => format_movie_from_api(movie));

            setMovieList((prevData) => {
                const existingIds = new Set(prevData.map((movie) => movie.id));
                const filteredMovies = newMovieList.filter((movie) => !existingIds.has(movie.id));

                return [...prevData, ...filteredMovies];
            });
        } catch (error) {
            console.error("Error while fetching movie:", error);
        } finally {
            setIsLoading(false);
            setIsPreloading(false);
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

    function toggleTempPlatformSelection(platform: Platform) {
        if (tempSelectedPlatforms.includes(platform)) {
            setTempSelectedPlatforms(tempSelectedPlatforms.filter((p) => p !== platform));
        } else {
            setTempSelectedPlatforms([...tempSelectedPlatforms, platform]);
        }
    }

    function getDynamicStyle(platform: string): any {
        const key = `button_${platform.replace(' ', '_').toLowerCase()}`;
        return styles[key as keyof typeof styles];
    }


    /*useEffect(() => {
        fetchMovies();
    }, []);*/

    useEffect(() => {
        console.log("Selected platforms:", selectedPlatforms);
        setIsLoading(true);
        fetchMovies();
    }, [selectedPlatforms]);

    function handleCardSideClick(side: string) {
        setCurrentStoryIndex((prevIndex) => {
            return side === "left" ? Math.max(0, prevIndex - 1) : Math.min(2, prevIndex + 1);
        });
    }

    function handleSwipedCard(index: number) {
        setCurrentStoryIndex(0);
        setCardIndex(index + 1);
        if (index >= movieList.length - 10) {
            if (!isPreloading && !isLoading) {
                console.log("Prefetching next page...");
                setIsPreloading(true);
                fetchMovies(true);
            }
        }
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
            {isLoading || (isPreloading && cardIndex == movieList.length) ?
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#0000ff"/>
                    <Text>Loading movies...</Text>
                </View> :
                <View style={styles.swiperContainer}>
                    {movieList.length > 0 ?
                        <>
                            <Swiper
                                key={`${currentStoryIndex}-${movieList.length}`}
                                cardIndex={cardIndex}
                                containerStyle={styles.swiperContainer}
                                ref={swiperRef}
                                cards={movieList}
                                renderCard={(card, index) => {
                                    if (!card) return null;

                                    return (
                                        <View key={`${card}-${index}`} style={styles.card}>
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
                                                        {card.platforms.map((platform, idx) => (
                                                            <View key={`${platform}-${idx}`}
                                                                  style={[styles.platformIconContainer, getDynamicStyle(platform)]}>
                                                                <Image
                                                                    style={{
                                                                        width: 30,
                                                                        height: 30,
                                                                        resizeMode: "contain"
                                                                    }}
                                                                    source={toImageSource(platform)}
                                                                />
                                                            </View>
                                                        ))}
                                                    </View>
                                                </>
                                            )}
                                            {(currentStoryIndex === 1) && cardIndex === index && (
                                                <View style={styles.detailsContainer}>
                                                    <View style={styles.titleContainer}>
                                                        <Text style={styles.titleText}>{card.title}</Text>
                                                        {card.platforms.map((platform, idx) => (
                                                            <View key={`${platform}-${idx}`}
                                                                  style={[styles.platformIconContainer, getDynamicStyle(platform)]}>
                                                                <Image
                                                                    style={{
                                                                        width: 30,
                                                                        height: 30,
                                                                        resizeMode: "contain"
                                                                    }}
                                                                    source={toImageSource(platform)}
                                                                />
                                                            </View>
                                                        ))}
                                                    </View>
                                                    <Text style={styles.extendedOverviewText}>{card.overview}</Text>

                                                    <View style={styles.genreContainer}>
                                                        {card.genres.map((genre, idx) => (
                                                            <Text key={`${genre}-${idx}`} style={styles.genreBadge}>
                                                                {genre}
                                                            </Text>
                                                        ))}
                                                    </View>

                                                    <View style={styles.infoRow}>
                                                        <FontAwesome5 name="calendar-alt" size={16} color="#fff"
                                                                      style={styles.icon}/>
                                                        <Text style={styles.infoValue}>{card.date}</Text>
                                                    </View>

                                                    <View style={styles.infoRow}>
                                                        <FontAwesome5 name="clock" size={16} color="#fff"
                                                                      style={styles.icon}/>
                                                        <Text style={styles.infoValue}>{card.runtime} min</Text>
                                                    </View>

                                                    <View style={styles.infoRow}>
                                                        <FontAwesome5 name="star" size={16} color="#FFD700"/>
                                                        <Text style={styles.ratingText}>{card.rate} / 10</Text>
                                                    </View>

                                                    {card.trailer_key && <TouchableOpacity
                                                        style={styles.trailerButton}
                                                        onPress={() => {
                                                            setSelectedMovie(card);
                                                            setTrailerModalVisible(true);
                                                        }}
                                                    >
                                                        <FontAwesome5 name="play" size={16} color="#fff"/>
                                                        <Text style={styles.trailerButtonText}>Watch Trailer</Text>
                                                    </TouchableOpacity>}
                                                </View>
                                            )}
                                            <View style={styles.progressContainer}>
                                                {([0, 1]).map((index) => (
                                                    <View
                                                        key={index}
                                                        style={[
                                                            styles.progressBar,
                                                            index <= currentStoryIndex
                                                                ? styles.progressBarActive
                                                                : styles.progressBarInactive,
                                                        ]}
                                                    />
                                                ))}
                                            </View>
                                        </View>
                                    )
                                }}
                                onSwiped={(index) => handleSwipedCard(index)}
                                onSwipedLeft={(cardIndex) => {
                                    const movie_id = movieList[cardIndex].id;
                                    addMovieOpinion(movie_id, Opinion.DIDNT_LIKE_IT);
                                }}
                                onSwipedRight={(cardIndex) => {
                                    const movie_id = movieList[cardIndex].id;
                                    addMovieOpinion(movie_id, Opinion.LOVED_IT);
                                }}
                                onSwipedTop={(cardIndex) => {
                                    const movie_id = movieList[cardIndex].id;
                                    addMovieOpinion(movie_id, Opinion.WANT_TO_WATCH);
                                }}
                                stackSize={3}
                            />

                            {/* Action buttons */}
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
                            </View></>
                        :
                        <Text style={styles.noDataText}>No movie found. Please modify your filters.</Text>
                    }
                </View>
            }

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
                            onClick={() => toggleTempPlatformSelection(Platform.NETFLIX)}
                            selected={tempSelectedPlatforms.includes(Platform.NETFLIX)}
                            icon={require("../../assets/images/netflix.png")}
                            iconUnselected={require("../../assets/images/netflix-unselected.png")}
                            color="black"
                        />
                        <SelectableButton
                            onClick={() => toggleTempPlatformSelection(Platform.PRIME_VIDEO)}
                            selected={tempSelectedPlatforms.includes(Platform.PRIME_VIDEO)}
                            icon={require("../../assets/images/prime-video.png")}
                            color="#0096F6"
                        />
                        <SelectableButton
                            onClick={() => toggleTempPlatformSelection(Platform.HBO_MAX)}
                            selected={tempSelectedPlatforms.includes(Platform.HBO_MAX)}
                            icon={require("../../assets/images/max.png")}
                            iconUnselected={require("../../assets/images/max-unselected.png")}
                            color="#022AE0"
                            iconSize={40}
                        />
                        <SelectableButton
                            onClick={() => toggleTempPlatformSelection(Platform.DISNEY_PLUS)}
                            selected={tempSelectedPlatforms.includes(Platform.DISNEY_PLUS)}
                            icon={require("../../assets/images/disney-plus.png")}
                            iconUnselected={require("../../assets/images/disney-plus-unselected.png")}
                            color="#0C0F35"
                            iconSize={40}
                        />
                    </View>
                    <TouchableOpacity
                        style={styles.applyButton}
                        onPress={() => {
                            setSelectedPlatforms(tempSelectedPlatforms);
                            setFilterModalVisible(false);
                        }}
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
    contentContainer: {},
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
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        gap: 16,
        position: "absolute",
        width: "100%",
        bottom: 0,
        padding: 16,
        paddingBottom: 30,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
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
        alignSelf: "flex-end",
        margin: 20,
        paddingHorizontal: 5,
        backgroundColor: "#ec3f3f",
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
        shadowOffset: {width: 0, height: 2},
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
        marginLeft: 5,
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
        backgroundColor: "#FF6347",
        padding: 12,
        borderRadius: 25,
        elevation: 5,
    },
    trailerButtonText: {
        color: "#fff",
        marginLeft: 10,
        fontSize: 16,
    },
    noDataText: {
        fontSize: 24,
        fontWeight: "bold",
        textAlign: "center",
        marginTop: 50,
    },
    platformButtonContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-evenly",
        marginVertical: 10,
    },
    platformButton: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 20,
        margin: 5,
        alignItems: "center",
    },
    platformButtonText: {
        color: "#fff",
        fontWeight: "bold",
        fontSize: 14,
    },
    button_netflix: {
        backgroundColor: "black",
    },
    button_disney_plus: {
        backgroundColor: "#113CCF",
    },
    button_prime_video: {
        backgroundColor: "#00A8E1",
    },
    button_hbo_max: {
        backgroundColor: "#6F2DA8",
    },
    button_paramount_plus: {
        backgroundColor: "#0057FF",
    },
    button_apple_tv_plus: {
        backgroundColor: "#000",
    },
    button_youtube: {
        backgroundColor: "#FF0000",
    },
    button_hulu: {
        backgroundColor: "#1CE783",
    },
    platformIconContainer: {
        padding: 5,
        borderRadius: 10,
    },
    titleContainer: {
        display: "flex",
        flexDirection: "row",
        justifyContent: "flex-start",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 10,
    },
});
