import React, {useEffect, useRef, useState} from "react";
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    Image,
    ActivityIndicator,
    SafeAreaView,
    Modal,
} from "react-native";
import Swiper from "react-native-deck-swiper";
import {FontAwesome5} from "@expo/vector-icons";
import {Opinion, Movie, format_movie_from_api} from "@/models/Movie";
import {SelectableButton} from "@/components/SelectableButton/SelectableButton";
import {Platform} from "@/models/Platform";

export default function TinderLikeApp() {
    const swiperRef = useRef<Swiper<Movie> | null>(null);
    const [data, setData] = useState<Movie[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>([]);
    const [filterModalVisible, setFilterModalVisible] = useState(false);

    async function fetchMovies() {
        try {
            const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/discover-movies`);
            const data = await response.json();
            const moviesList: Movie[] = data.map((movie: any) => format_movie_from_api(movie));
            setData(moviesList);
        } catch (error) {
            console.error("Erreur lors de la récupération des films :", error);
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
            console.error("Erreur lors de l'ajout de l'opinion du film :", error);
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

    return (
        <SafeAreaView style={styles.container}>
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
                    containerStyle={styles.swiperContainer}
                    ref={swiperRef}
                    infinite
                    cards={data}
                    renderCard={(card) => (
                        <View style={styles.card}>
                            <Image source={{ uri: card.image }} style={styles.image} />
                            <View style={styles.rateContainer}>
                                <Text style={styles.rate}>{card.rate}/10</Text>
                            </View>
                            <View style={styles.infoContainer}>
                                <Text style={styles.titleText}>{card.title}</Text>
                                <Text style={styles.overviewText}>{card.overview.split(" ").splice(0, 15).join(" ")}...</Text>
                            </View>
                        </View>
                    )}
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
                    cardIndex={0}
                    stackSize={3}
                />
                {/* Boutons d'action */}
                <View style={styles.swipeButtons}>
                    <TouchableOpacity
                        style={styles.dislikedButton}
                        onPress={() => swiperRef.current?.swipeLeft()}
                    >
                        <FontAwesome5 name="thumbs-down" size={24} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.interestedButton}
                        onPress={() => swiperRef.current?.swipeTop()}
                    >
                        <FontAwesome5 name="eye" size={24} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.lovedButton}
                        onPress={() => swiperRef.current?.swipeRight()}
                    >
                        <FontAwesome5 name="thumbs-up" size={24} color="#fff" />
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
        backgroundColor: "#333",
        opacity: 0.8,
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
        flex: 1,
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
});
