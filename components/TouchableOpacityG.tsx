import getTextColor from "@/utils/getTextColor";
import React, { useState } from "react";
import { Path, G, Text } from "react-native-svg"

interface TouchableOpacityGProps {
    arcPath: string;
    color: string;
    onPress: () => void;
    text: string;
    textSize: number;
    textColor?: string;
    textPoint: { x: number, y: number };
    rotation: number;
}
const TouchableOpacityG: React.FC<TouchableOpacityGProps> = ({
    arcPath,
    color,
    onPress,
    text,
    textSize,
    textColor = getTextColor(color),
    textPoint,
    rotation,
}) => {
    const [touched, setTouched] = useState(false);

    // 터치 시작 처리 함수
    const handleTouchStart = () => {
        setTouched(true);
    };

    // 터치 종료 처리 함수
    const handleTouchEnd = () => {
        setTouched(false);
    };

    return <G>
        <Path
            d={arcPath}
            fill={color}
            stroke="#FFFFFF"
            strokeWidth={1}
            opacity={touched ? 0.7 : 1}
            onPress={onPress}
            onPressIn={handleTouchStart}
            onPressOut={handleTouchEnd}
        />
        <Text
            x={textPoint.x}
            y={textPoint.y + (textSize * 0.35)}
            textAnchor="middle"
            fontSize={textSize}
            fontWeight="bold"
            fill={textColor}
            rotation={rotation}
            origin={`${textPoint.x}, ${textPoint.y}`}
        >
            {text}
        </Text>
    </G>

}

export default TouchableOpacityG;