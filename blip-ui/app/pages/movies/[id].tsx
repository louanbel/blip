import React from "react";
import {useLocalSearchParams} from "expo-router";
import {View, Text, Image, StyleSheet} from "react-native";
import {Stack} from "expo-router";

export default function MovieDetails() {
    const {id, title, image, rate, overview} = useLocalSearchParams();

    return (
        <><Stack.Screen options={{headerTitle: "Movie Details", headerBackTitle: "Back"}}/><View style={styles.container}>
            <Image source={{uri: image.toString()}} style={styles.poster}/>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.rate}>Rate: {rate}/10</Text>
            <Text style={styles.overview}>{overview}</Text>
        </View></>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: "#fff",
    },
    poster: {
        width: "100%",
        height: 300,
        borderRadius: 10,
    },
    title: {
        fontSize: 24,
        fontWeight: "bold",
        marginVertical: 10,
    },
    rate: {
        fontSize: 18,
        color: "#888",
    },
    overview: {
        fontSize: 16,
        textAlign: "justify",
        marginTop: 10,
    },
});