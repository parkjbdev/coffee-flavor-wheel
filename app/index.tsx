import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  ColorValue,
} from "react-native";
import { FlavorData, ScaaFlavor } from "@/types/scaaFlavor";
import scaa2016 from "@/assets/scaa-2016-flavor-map.json";
import FlavorWheel from "@/components/FlavorWheel";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';

// 화면 크기 계산
const { width } = Dimensions.get("window");
const WHEEL_SIZE = width * 1.4;
const CENTER_RADIUS = 70;

/**
 * 커피 플레이버 휠 컴포넌트 - 최종 수정 버전
 */
const Index = ({ flavorData = scaa2016 }: { flavorData: ScaaFlavor }) => {

  // Reanimated 공유 값 설정
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(0); // 초기값 0으로 변경 (애니메이션을 위해)
  const rotate = useSharedValue(-90); // 회전 애니메이션을 위한 값 추가
  
  // 핀치 제스처를 위한 변수들
  const savedScale = useSharedValue(1);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);
  const lastDistance = useSharedValue(0);

  // 초기 렌더링 시 애니메이션
  useEffect(() => {
    // 약간 지연 후 시작
    setTimeout(() => {
      // 스케일 업 애니메이션
      scale.value = withTiming(1, {
        duration: 1200,
        easing: Easing.elastic(1),
      });
      
      // 회전 애니메이션
      rotate.value = withTiming(0, {
        duration: 1500,
        easing: Easing.out(Easing.quad),
      });
    }, 300);
  }, []);

  // 제스처 설정
  const panGesture = Gesture.Pan()
    .onStart(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    })
    .onUpdate((event) => {
      translateX.value = savedTranslateX.value + event.translationX;
      translateY.value = savedTranslateY.value + event.translationY;
    });

  const pinchGesture = Gesture.Pinch()
    .onStart(() => {
      savedScale.value = scale.value;
    })
    .onUpdate((event) => {
      // 확대/축소 한계 설정
      scale.value = Math.min(Math.max(savedScale.value * event.scale, 0.5), 3);
    });

  // 제스처 결합
  const composedGestures = Gesture.Simultaneous(panGesture, pinchGesture);

  // 애니메이션 스타일
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value },
        { rotate: `${rotate.value}deg` }
      ],
    };
  });

  // 휠을 원래 위치로 초기화하는 함수
  const resetWheelPosition = () => {
    translateX.value = withSpring(0, { damping: 15 });
    translateY.value = withSpring(0, { damping: 15 });
    scale.value = withSpring(1, { damping: 15 });
    rotate.value = withSpring(0, { damping: 15 });
    
    savedScale.value = 1;
    savedTranslateX.value = 0;
    savedTranslateY.value = 0;
  };

  // 데이터 없음 처리
  if (!flavorData || !flavorData.data || flavorData.data.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>유효한 풍미 데이터가 없습니다.</Text>
      </View>
    );
  }

  // 노드의 가중치 계산 (노드에 속한 모든 리프 노드 수)
  const countLeafNodes: (node: FlavorData) => number = (node: FlavorData) => {
    if (!node.children || node.children.length === 0) {
      return 1;
    }
    return node.children.reduce(
      (sum: number, child: FlavorData) => sum + countLeafNodes(child),
      0,
    );
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

        <View style={styles.headerContainer}>
          <Text style={styles.title}>{flavorData.meta.name}</Text>
          <Text style={styles.subtitle}>Taster's Flavor Wheel</Text>
        </View>

        {/* 제스처 핸들러와 애니메이션 설정 */}
        <GestureDetector gesture={composedGestures}>
          <Animated.View
            style={[
              styles.wheelContainer,
              animatedStyle,
            ]}
          >
            <FlavorWheel flavorData={flavorData} WHEEL_SIZE={WHEEL_SIZE} CENTER_RADIUS={CENTER_RADIUS} />
          </Animated.View>
        </GestureDetector>

        {/* 확대/축소 컨트롤 */}
        <View style={styles.zoomControls}>
          <TouchableOpacity
            style={styles.zoomButton}
            onPress={() => {
              const newScale = Math.min(scale.value + 0.5, 3);
              scale.value = withSpring(newScale, { damping: 15 });
            }}
          >
            <Text style={styles.zoomButtonText}>+</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.zoomButton}
            onPress={() => {
              const newScale = Math.max(1, scale.value - 0.5);
              scale.value = withSpring(newScale, { damping: 15 });
            }}
          >
            <Text style={styles.zoomButtonText}>-</Text>
          </TouchableOpacity>
          
          {/* 휠 초기화 버튼 */}
          <TouchableOpacity
            style={[styles.zoomButton, styles.resetButton]}
            onPress={resetWheelPosition}
          >
            <Text style={styles.resetButtonText}>⟲</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    padding: 10,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: "#E74C3C",
    textAlign: "center",
  },
  headerContainer: {
    alignItems: "center",
    marginTop: 15,
    marginBottom: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333333",
  },
  subtitle: {
    fontSize: 16,
    color: "#666666",
    marginTop: 5,
  },
  wheelContainer: {
    width: WHEEL_SIZE * 0.8,
    height: WHEEL_SIZE * 0.8,
    alignItems: "center",
    overflow: "visible",
  },

  // 확대/축소 버튼 스타일
  zoomControls: {
    position: "absolute",
    right: 20,
    bottom: 20,
    flexDirection: "column",
  },
  zoomButton: {
    width: 40,
    height: 40,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 5,
    elevation: 3,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  zoomButtonText: {
    fontSize: 24,
    fontWeight: "bold",
  },
  resetButton: {
    marginTop: 10,
    backgroundColor: "#FAFAFA",
    borderWidth: 1,
    borderColor: "#DDDDDD",
  },
  resetButtonText: {
    fontSize: 20,
    color: "#666666",
  },
});

export default Index;
