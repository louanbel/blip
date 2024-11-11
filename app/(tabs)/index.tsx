import React, {useRef} from "react";
import {StyleSheet, Text, TouchableOpacity, View, Image} from "react-native";
import Swiper from "react-native-deck-swiper";
import {FontAwesome5} from "@expo/vector-icons";

const initialData = [
    {title: "Greenland", image: require("../../assets/images/cover-1.jpg")},
    {title: "Tout là-haut", image: require("../../assets/images/cover-2.jpg")},
    {title: "Creator", image: require("../../assets/images/cover-3.jpg")},
    {title: "Loup garou", image: require("../../assets/images/cover-4.jpg")},
];

const SwiperComponent = () => {
    const swiperRef = useRef<Swiper<{ title: string; image: any }> | null>(null);

    return (
        <View style={styles.container}>
            <Swiper
                ref={swiperRef}
                infinite
                cards={initialData}
                renderCard={(card) => (
                    <View style={styles.card}>
                        <Image source={card.image} style={styles.image}/>
                        <View style={styles.textContainer}>
                            <Text style={styles.text}>{card.title}</Text>
                        </View>
                    </View>
                )}
                onSwiped={(cardIndex) => {
                    console.log(`Swiped card index: ${cardIndex}`);
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
    textContainer: {
        position: "absolute",
        bottom: 0,
        width: "100%",
        backgroundColor: "rgba(0, 0, 0, 0.6)",
        padding: 12,
        borderBottomLeftRadius: 15,
        borderBottomRightRadius: 15,
    },
    text: {
        fontSize: 20,
        fontWeight: "600",
        color: "#fff",
        textAlign: "center",
        alignSelf: "center",
    },
    buttonContainer: {
        flexDirection: "row",
        justifyContent: "space-around",
        padding: 15,
        backgroundColor: "#fff",
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

export default SwiperComponent;