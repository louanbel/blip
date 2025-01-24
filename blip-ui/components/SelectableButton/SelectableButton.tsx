import React, {useState} from 'react';
import {TouchableOpacity, Image, StyleSheet, Animated} from 'react-native';

type SelectableButtonProps = {
    onClick: () => void;
    selected: boolean;
    icon: any;
    iconUnselected?: any;
    iconSize?: number;
    color: string;
};

export const SelectableButton: React.FC<SelectableButtonProps> = ({onClick, icon, color, iconUnselected, selected, iconSize}) => {
    const scaleValue = new Animated.Value(1);

    const handlePress = () => {
        Animated.sequence([
            Animated.timing(scaleValue, {
                toValue: 0.95,
                duration: 100,
                useNativeDriver: true,
            }),
            Animated.timing(scaleValue, {
                toValue: 1,
                duration: 100,
                useNativeDriver: true,
            }),
        ]).start();

        onClick();
    };

    return (
        <Animated.View style={{transform: [{scale: scaleValue}]}}>
            <TouchableOpacity
                onPress={handlePress}
                style={[
                    styles.button,
                    {backgroundColor: 'white'},
                    selected && {backgroundColor: color, shadowColor: color},
                ]}
            >
                <Image source={iconUnselected ? (selected ? icon : iconUnselected) : icon} style={[styles.icon,
                    {width: iconSize || 30, height: iconSize || 30}]}/>
            </TouchableOpacity>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    button: {
        width: 60,
        height: 60,
        borderRadius: 15,
        alignItems: 'center',
        justifyContent: 'center',
        shadowOffset: {width: 0, height: 5},
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 10,
    },
    unselectedButton: {
        backgroundColor: 'white',
        shadowColor: '#000',
    },
    icon: {
        resizeMode: 'contain',
    },
});