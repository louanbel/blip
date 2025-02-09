import React from "react";
import {useLocalSearchParams} from "expo-router";
import {View, Text, Image, StyleSheet, TouchableOpacity} from "react-native";
import {Stack} from "expo-router";
import {FontAwesome5} from "@expo/vector-icons";

export default function MovieDetails() {
    const {id, title, image, rate, overview, genres, date, runtime, director, trailer_key} = useLocalSearchParams();

    return (
        <>
            <Stack.Screen options={{headerTitle: "Movie Details", headerBackTitle: "Back"}}/>
            <View
                style={styles.container}>
                <Image source={{uri: image.toString()}} style={styles.poster}/>
                <Text style={styles.titleText}>{title}</Text>

                <View style={styles.genreContainer}>
                    {(Array.isArray(genres) ? genres : genres.split(',')).map((genre, idx) => (
                        <Text key={idx} style={styles.genreBadge}>
                            {genre}
                        </Text>
                    ))}
                </View>

                <View style={styles.ratingContainer}>
                    <FontAwesome5 name="star" size={16} color="#fda307"/>
                    <Text style={styles.ratingText}>{rate} / 10</Text>
                </View>

                {trailer_key && (
                    <TouchableOpacity
                        style={styles.trailerButton}
                        onPress={() => {
                        }}
                    >
                        <FontAwesome5 name="play" size={16} color="#fff"/>
                        <Text style={styles.trailerButtonText}>Watch Trailer</Text>
                    </TouchableOpacity>
                )}
                <Text style={styles.extendedOverviewText}>{overview}</Text>

                <View style={styles.infoRow}>
                    <FontAwesome5 name="calendar-alt" size={16} style={styles.icon}/>
                    <Text style={styles.infoValue}>{date}</Text>
                </View>

                <View style={styles.infoRow}>
                    <FontAwesome5 name="clock" size={16} style={styles.icon}/>
                    <Text style={styles.infoValue}>{runtime} min</Text>
                </View>

            </View>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        display: "flex",
        padding: 20,
        backgroundColor: "#fff",
    },
    extendedOverviewText: {
        fontSize: 14,
        marginVertical: 10,
        lineHeight: 20,
    },
    poster: {
        width: "100%",
        height: 300,
        borderRadius: 10,
    },
    titleText: {
        fontSize: 24,
        fontWeight: "bold",
        marginVertical: 10,
    },
    rate: {
        fontSize: 18,
        color: "#888",
    },
    genreContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
    },
    genreBadge: {
        backgroundColor: "#FF6347",
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
        color: "#fda307",
        marginLeft: 5,
    },
    trailerButton: {
        width: "50%",
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