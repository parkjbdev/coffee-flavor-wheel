import React, { useState, useEffect, useRef } from 'react';
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
  Animated,
  PanResponder,
  ColorValue,
} from 'react-native';
import Svg, { Path, Circle, G, Text as SvgText, Line, Rect } from 'react-native-svg';
import { FlavorData, ScaaFlavor } from "@/types/scaaFlavor"
import scaa2016 from '@/assets/scaa-2016-flavor-map.json';

// 화면 크기 계산
const { width } = Dimensions.get('window');
const WHEEL_SIZE = width * 1.4;
const CENTER_RADIUS = 70;

/**
 * 커피 플레이버 휠 컴포넌트 - 최종 수정 버전
 */
const FlavorWheel = (
  { flavorData = scaa2016 }: { flavorData: ScaaFlavor }
) => {
  const [selectedFlavor, setSelectedFlavor] = useState<FlavorData | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  // 패닝을 위한 상태 추가
  const pan = useRef(new Animated.ValueXY()).current;
  const scale = useRef(new Animated.Value(1)).current;

  // 핀치 제스처를 위한 변수들
  const lastScale = useRef(1);
  const baseScale = useRef(1);
  const lastDistance = useRef(0);

  // 두 터치 포인트 간의 거리 계산 함수
  const distance = (x1: number, y1: number, x2: number, y2: number) => {
    const dx = x1 - x2;
    const dy = y1 - y2;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // PanResponder 설정 (핀치 제스처 지원 추가)
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        // 움직임 시작 시 현재 위치 저장
        pan.setOffset({
          x: pan.x._value,
          y: pan.y._value
        });
        pan.setValue({ x: 0, y: 0 });

        // 핀치 제스처를 위한 초기값 설정
        lastScale.current = scale._value;
        baseScale.current = scale._value;
        lastDistance.current = 0;
      },
      onPanResponderMove: (evt, gestureState) => {
        // 터치 포인트 개수 확인
        const touches = evt.nativeEvent.touches;

        // 핀치 제스처 감지 (두 손가락)
        if (touches.length === 2) {
          // 두 손가락 사이의 거리 계산
          const touch1 = touches[0];
          const touch2 = touches[1];
          const currentDistance = distance(
            touch1.pageX, touch1.pageY,
            touch2.pageX, touch2.pageY
          );

          // 처음 거리 기록
          if (lastDistance.current === 0) {
            lastDistance.current = currentDistance;
            return;
          }

          // 거리 변화에 따른 확대/축소 비율 계산
          const scaleFactor = currentDistance / lastDistance.current;

          // 확대/축소 한계 설정
          const nextScale = Math.min(Math.max(lastScale.current * scaleFactor, 0.5), 3);

          // scale 값 업데이트
          scale.setValue(nextScale);

          // 현재 거리를 마지막 거리로 업데이트
          lastDistance.current = currentDistance;
          lastScale.current = nextScale;
        }
        // 패닝 (한 손가락)
        else if (touches.length === 1) {
          Animated.event(
            [null, { dx: pan.x, dy: pan.y }],
            { useNativeDriver: false }
          )(evt, gestureState);
        }
      },
      onPanResponderRelease: () => {
        // 움직임 종료 시 현재 위치 저장
        pan.flattenOffset();

        // 핀치 제스처 변수 초기화
        lastDistance.current = 0;
        baseScale.current = scale._value;
      }
    })
  ).current;

  // 데이터 없음 처리
  if (!flavorData || !flavorData.data || flavorData.data.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>유효한 풍미 데이터가 없습니다.</Text>
      </View>
    );
  }

  // 노드의 가중치 계산 (노드에 속한 모든 리프 노드 수)
  const countLeafNodes = (node: FlavorData) => {
    if (!node.children || node.children.length === 0) {
      return 1;
    }
    return node.children.reduce((sum: number, child: FlavorData) => sum + countLeafNodes(child), 0);
  };

  // 패스 클릭 처리
  const handlePathClick = (flavor: FlavorData) => {
    setSelectedFlavor(flavor);
    setModalVisible(true);
  };

  // 텍스트 색상 계산 (가독성)
  const getTextColor = (backgroundColor: string) => {
    // hex를 rgb로 변환
    const hex = backgroundColor.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    // 밝기 계산 (YIQ 공식)
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;

    // 밝기에 따라 검은색 또는 흰색 반환
    return brightness > 192 ? '#000000' : '#FFFFFF';
  };

  // SVG 좌표 변환 유틸리티 함수
  const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
    const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
    return {
      x: centerX + (radius * Math.cos(angleInRadians)),
      y: centerY + (radius * Math.sin(angleInRadians))
    };
  };

  // 부채꼴 경로 생성 함수
  const createArcPath = (centerX: number, centerY: number, innerRadius: number, outerRadius: number, startAngle: number, endAngle: number) => {
    const start = polarToCartesian(centerX, centerY, outerRadius, endAngle);
    const end = polarToCartesian(centerX, centerY, outerRadius, startAngle);
    const innerStart = polarToCartesian(centerX, centerY, innerRadius, endAngle);
    const innerEnd = polarToCartesian(centerX, centerY, innerRadius, startAngle);

    const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1;

    const path = [
      "M", innerStart.x, innerStart.y,
      "L", start.x, start.y,
      "A", outerRadius, outerRadius, 0, largeArcFlag, 0, end.x, end.y,
      "L", innerEnd.x, innerEnd.y,
      "A", innerRadius, innerRadius, 0, largeArcFlag, 1, innerStart.x, innerStart.y,
      "Z"
    ].join(" ");

    return path;
  };

  // 휠 렌더링
  const renderWheel = () => {
    // SVG 크기를 키워서 모든 내용이 보이도록 함
    const viewBoxSize = WHEEL_SIZE * 2;
    const centerX = viewBoxSize / 2;
    const centerY = viewBoxSize / 2;
    const outerRadius = viewBoxSize / 3; // 크기 조정
    const maxDepth = flavorData.meta.maxDepth || 3;

    // 메인 카테고리의 총 가중치 계산
    const totalLeafNodes = flavorData.data.reduce((sum, category) => sum + countLeafNodes(category), 0);

    const renderLayers = () => {
      const elements: React.ReactNode[] = [];

      // 부채꼴 레이어 설정
      const segmentWidth = (outerRadius - CENTER_RADIUS) / maxDepth;

      const layer1Width = segmentWidth;
      const layer2Width = segmentWidth;
      const layer3Width = segmentWidth;
      // 각 메인 카테고리의 각도 시작점과 크기 계산
      let currentAngle = 0;
      const categoryAngles = flavorData.data.map(category => {
        const leafCount = countLeafNodes(category);
        const angleSize = 360 * (leafCount / totalLeafNodes);
        const startAngle = currentAngle;
        currentAngle += angleSize;

        return {
          category,
          startAngle,
          endAngle: currentAngle,
          angleSize
        };
      });

      // 1단계: 메인 카테고리
      categoryAngles.forEach((angleData, mainIndex) => {
        const { category: mainCategory, startAngle: mainStartAngle, endAngle: mainEndAngle, angleSize: mainAngleSize } = angleData;
        const mainMidAngle = mainStartAngle + mainAngleSize / 2;

        // 메인 카테고리 경로
        const mainArcPath = createArcPath(
          centerX, centerY,
          CENTER_RADIUS, CENTER_RADIUS + layer1Width,
          mainStartAngle, mainEndAngle
        );

        // 메인 카테고리 텍스트
        const mainTextRadius = CENTER_RADIUS + layer1Width * 0.5;
        const mainTextPoint = polarToCartesian(centerX, centerY, mainTextRadius, mainMidAngle);

        // 텍스트 회전 조정
        let mainTextRotation = mainMidAngle;

        // 텍스트가 항상 올바른 방향(읽을 수 있는 방향)으로 표시되도록 조정
        if (mainMidAngle > 90 && mainMidAngle < 270) {
          // 왼쪽 반원: 텍스트가 왼쪽에서 오른쪽으로 흐르도록
          mainTextRotation = mainMidAngle - 90;
        } else {
          // 오른쪽 반원: 텍스트가 왼쪽에서 오른쪽으로 흐르도록
          mainTextRotation = mainMidAngle + 90;
        }

        // 텍스트가 뒤집히지 않도록 추가 조정
        if (mainTextRotation > 90 && mainTextRotation < 270) {
          mainTextRotation += 180;
        }

        // 메인 카테고리 추가
        elements.push(
          <G key={`main-${mainIndex}-${mainCategory.name}`}>
            <Path
              d={mainArcPath}
              fill={mainCategory.colour}
              stroke="#FFFFFF"
              strokeWidth={1}
              onPress={() => handlePathClick(mainCategory)}
            />
            <SvgText
              x={mainTextPoint.x}
              y={mainTextPoint.y + 5 }
              //(mainCategory.name.length > 10 ? 5 : 7)}
              textAnchor="middle"
              fontSize={mainCategory.name.length > 10 ? 10 : 14}
              fontWeight="bold"
              fill={getTextColor(mainCategory.colour)}
              rotation={mainTextRotation}
              origin={`${mainTextPoint.x}, ${mainTextPoint.y}`}
            >
              {mainCategory.name}
            </SvgText>
          </G>
        );

        // 2단계: 서브 카테고리 (비례적 크기 조정)
        if (mainCategory.children && mainCategory.children.length > 0) {
          const subCategories = mainCategory.children;

          // 서브 카테고리의 총 가중치 계산
          const subCategoryTotalWeight = subCategories.reduce((sum, subCategory) => sum + countLeafNodes(subCategory), 0);

          // 각 서브 카테고리의 각도 시작점과 크기 계산
          let subCurrentAngle = mainStartAngle;
          const subCategoryAngles = subCategories.map(subCategory => {
            const subLeafCount = countLeafNodes(subCategory);
            const subAngleSize = mainAngleSize * (subLeafCount / subCategoryTotalWeight);
            const subStartAngle = subCurrentAngle;
            subCurrentAngle += subAngleSize;

            return {
              subCategory,
              subStartAngle,
              subEndAngle: subCurrentAngle,
              subAngleSize
            };
          });

          // 서브 카테고리 렌더링
          subCategoryAngles.forEach((subAngleData, subIndex) => {
            const { subCategory, subStartAngle, subEndAngle, subAngleSize } = subAngleData;
            const subMidAngle = subStartAngle + subAngleSize / 2;

            // 서브 카테고리 경로
            const subArcPath = createArcPath(
              centerX, centerY,
              CENTER_RADIUS + layer1Width, CENTER_RADIUS + layer1Width + layer2Width,
              subStartAngle, subEndAngle
            );

            // 서브 카테고리 텍스트
            const subTextRadius = CENTER_RADIUS + layer1Width + layer2Width * 0.5;
            const subTextPoint = polarToCartesian(centerX, centerY, subTextRadius, subMidAngle);

            // 텍스트 회전 조정 - 항상 원의 중심을 향하도록 (3단계와 동일한 로직)
            let subTextRotation = subMidAngle;

            // 텍스트가 항상 올바른 방향(읽을 수 있는 방향)으로 표시되도록 조정
            if (subMidAngle > 90 && subMidAngle < 270) {
              // 왼쪽 반원: 텍스트가 왼쪽에서 오른쪽으로 흐르도록
              subTextRotation = subMidAngle - 90;
            } else {
              // 오른쪽 반원: 텍스트가 왼쪽에서 오른쪽으로 흐르도록
              subTextRotation = subMidAngle + 90;
            }

            // 텍스트가 뒤집히지 않도록 추가 조정
            if (subTextRotation > 90 && subTextRotation < 270) {
              subTextRotation += 180;
            }

            // 서브 카테고리 추가
            elements.push(
              <G key={`sub-${mainIndex}-${subIndex}-${subCategory.name}`}>
                <Path
                  d={subArcPath}
                  fill={subCategory.colour}
                  stroke="#FFFFFF"
                  strokeWidth={1}
                  onPress={() => handlePathClick(subCategory)}
                />
                <SvgText
                  x={subTextPoint.x}
                  y={subTextPoint.y + 3}
                  textAnchor="middle"
                  fontSize={subAngleSize > 7 ? 10 : subAngleSize > 4 ? 8 : 6}
                  fontWeight="bold"
                  fill={getTextColor(subCategory.colour)}
                  rotation={subTextRotation}
                  origin={`${subTextPoint.x}, ${subTextPoint.y}`}
                >
                  {subCategory.name}
                </SvgText>
              </G>
            );

            // 3단계: 세부 풍미 - 부채꼴과 외부 레이블
            if (subCategory.children && subCategory.children.length > 0) {
              const flavorItems = subCategory.children;
              const flavorCount = flavorItems.length;

              // 세부 풍미 각도 계산
              let flavorCurrentAngle = subStartAngle;
              const flavorAngles = flavorItems.map(flavor => {
                // 모든 세부 풍미는 동일한 각도 크기를 가짐 (수가 적을수록 더 넓게)
                const flavorAngleSize = subAngleSize / flavorCount;
                const flavorStartAngle = flavorCurrentAngle;
                flavorCurrentAngle += flavorAngleSize;

                return {
                  flavor,
                  flavorStartAngle,
                  flavorEndAngle: flavorCurrentAngle,
                  flavorAngleSize
                };
              });

              // 세부 풍미 렌더링
              flavorAngles.forEach((flavorAngleData, flavorIndex) => {
                const { flavor, flavorStartAngle, flavorEndAngle, flavorAngleSize } = flavorAngleData;
                const flavorMidAngle = flavorStartAngle + flavorAngleSize / 2;

                // 세부 풍미 경로 (파이 차트의 가장 바깥쪽)
                const flavorArcPath = createArcPath(
                  centerX, centerY,
                  CENTER_RADIUS + layer1Width + layer2Width,
                  CENTER_RADIUS + layer1Width + layer2Width + layer3Width,
                  flavorStartAngle, flavorEndAngle
                );

                // 내부 레이블 위치 (외부 레이블 대신 내부에 표시)
                const labelRadius = CENTER_RADIUS + layer1Width + layer2Width + layer3Width * 0.5; // 부채꼴 중간 지점
                const labelPoint = polarToCartesian(centerX, centerY, labelRadius, flavorMidAngle);

                // 텍스트 회전 조정 - 항상 원의 중심을 향하도록
                let labelRotation = flavorMidAngle;

                // 텍스트가 항상 올바른 방향(읽을 수 있는 방향)으로 표시되도록 조정
                if (flavorMidAngle > 90 && flavorMidAngle < 270) {
                  // 왼쪽 반원: 텍스트가 왼쪽에서 오른쪽으로 흐르도록
                  labelRotation = flavorMidAngle - 90;
                } else {
                  // 오른쪽 반원: 텍스트가 왼쪽에서 오른쪽으로 흐르도록
                  labelRotation = flavorMidAngle + 90;
                }

                // 텍스트가 뒤집히지 않도록 추가 조정
                if (labelRotation > 90 && labelRotation < 270) {
                  labelRotation += 180;
                }

                // 세부 풍미와 내부 레이블 추가
                elements.push(
                  <G key={`flavor-${mainIndex}-${subIndex}-${flavorIndex}-${flavor.name}`}>
                    {/* 세부 풍미 부채꼴 */}
                    <Path
                      d={flavorArcPath}
                      fill={flavor.colour}
                      stroke="#FFFFFF"
                      strokeWidth={0.5}
                      onPress={() => handlePathClick(flavor)}
                    />

                    {/* 내부 레이블 - 슬래시 무시하고 한 줄로 표시 */}
                    <SvgText
                      x={labelPoint.x}
                      y={labelPoint.y + 3}
                      textAnchor="middle"
                      fontSize={10}
                      fontWeight="normal"
                      fill={getTextColor(flavor.colour)}
                      rotation={labelRotation}
                      origin={`${labelPoint.x}, ${labelPoint.y}`}
                    >
                      {flavor.name}
                    </SvgText>
                  </G>
                );
              });
            }
          });
        }
      });

      return elements;
    };

    // 전체 휠 렌더링
    return (
      <Svg
        width={WHEEL_SIZE}
        height={WHEEL_SIZE}
        viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
      >
        {/* 모든 레이어 렌더링 */}
        {renderLayers()}

        {/* 중앙 원 */}
        <Circle
          cx={centerX}
          cy={centerY}
          r={CENTER_RADIUS}
          fill="#FFFFFF"
          stroke="#333"
          strokeWidth={1}
        />
        <SvgText
          x={centerX}
          y={centerY - 10}
          textAnchor="middle"
          fontSize={20}
          fontWeight="bold"
          fill="#333"
        >
          {flavorData.meta.name}
        </SvgText>
        <SvgText
          x={centerX}
          y={centerY + 15}
          textAnchor="middle"
          fontSize={12}
          fill="#333"
        >
          Flavor Wheel
        </SvgText>
      </Svg>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View style={styles.headerContainer}>
        <Text style={styles.title}>{flavorData.meta.name}</Text>
        <Text style={styles.subtitle}>Taster's Flavor Wheel</Text>
      </View>

      {/* Animated.View에 핀치 제스처 지원이 포함된 panResponder 적용 */}
      <Animated.View
        style={[
          styles.wheelContainer,
          { transform: [{ translateX: pan.x }, { translateY: pan.y }, { scale: scale }] }
        ]}
        {...panResponder.panHandlers}
      >
        {renderWheel()}
      </Animated.View>

      {/* 확대/축소 컨트롤은 유지 (필요시 터치해서 확대/축소할 수 있게) */}
      <View style={styles.zoomControls}>
        <TouchableOpacity
          style={styles.zoomButton}
          onPress={() => {
            const newScale = Math.min(scale._value + 0.1, 3);
            Animated.spring(scale, {
              toValue: newScale,
              useNativeDriver: false
            }).start();
            lastScale.current = newScale;
            baseScale.current = newScale;
          }}
        >
          <Text style={styles.zoomButtonText}>+</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.zoomButton}
          onPress={() => {
            const newScale = Math.max(0.5, scale._value - 0.1);
            Animated.spring(scale, {
              toValue: newScale,
              useNativeDriver: false
            }).start();
            lastScale.current = newScale;
            baseScale.current = newScale;
          }}
        >
          <Text style={styles.zoomButtonText}>-</Text>
        </TouchableOpacity>
      </View>

      {!!selectedFlavor && !!modalVisible &&
        <DetailModal
          selectedFlavor={selectedFlavor}
          setSelectedFlavor={setSelectedFlavor}
          modalVisible={modalVisible}
          closeModal={() => setModalVisible(false)}
          textColor={getTextColor(selectedFlavor?.colour)}
        />
      }
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    padding: 10,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666666',
  },
  errorText: {
    fontSize: 16,
    color: '#E74C3C',
    textAlign: 'center',
  },
  headerContainer: {
    alignItems: 'center',
    marginTop: 15,
    marginBottom: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    marginTop: 5,
  },
  wheelContainer: {
    width: WHEEL_SIZE * 0.8,
    height: WHEEL_SIZE * 0.8,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'visible',
  },
  instructionsContainer: {
    marginTop: 15,
    padding: 10,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    marginHorizontal: 20,
  },
  instructions: {
    fontSize: 14,
    color: '#555555',
    textAlign: 'center',
    fontStyle: 'italic',
  },

  // 모달 스타일
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalHeader: {
    padding: 15,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  closeButton: {
    position: 'absolute',
    right: 12,
    top: '50%',
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
    lineHeight: 24,
    textAlign: 'center',
  },
  modalBody: {
    padding: 15,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333333',
  },
  definitionText: {
    fontSize: 16,
    lineHeight: 22,
    color: '#555555',
  },
  childrenGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  childItem: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 10,
    backgroundColor: '#F5F5F5',
    borderRadius: 6,
    borderLeftWidth: 4,
  },
  colorIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 10,
  },
  childName: {
    fontSize: 14,
    flex: 1,
    color: '#333333',
  },
  referenceItem: {
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 6,
    marginBottom: 8,
  },
  referenceText: {
    fontSize: 14,
    marginBottom: 5,
  },
  intensityText: {
    fontSize: 13,
    color: '#E74C3C',
  },
  aromaText: {
    fontSize: 13,
    color: '#3498DB',
  },

  // 확대/축소 버튼 스타일 (선택 사항)
  zoomControls: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    flexDirection: 'column',
  },
  zoomButton: {
    width: 40,
    height: 40,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 5,
    elevation: 3,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  zoomButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
});

const DetailModal = (
  { selectedFlavor, setSelectedFlavor, modalVisible, closeModal, textColor }: { selectedFlavor: FlavorData, setSelectedFlavor: (flavor: FlavorData) => void, modalVisible: boolean, closeModal: () => void, textColor: ColorValue }
) => {
  return <Modal
    visible={modalVisible}
    transparent={true}
    animationType="fade"
    onRequestClose={closeModal}
  >
    <View style={styles.modalContainer}>
      <View style={styles.modalContent}>
        <View style={[styles.modalHeader, { backgroundColor: selectedFlavor.colour }]}>
          <Text style={[styles.modalTitle, { color: textColor }]}>
            {selectedFlavor.name}
          </Text>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={closeModal}
          >
            <Text style={[styles.closeButtonText, { color: textColor }]}>×</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalBody}>
          {selectedFlavor.definition && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>정의</Text>
              <Text style={styles.definitionText}>{selectedFlavor.definition}</Text>
            </View>
          )}

          {selectedFlavor.children && selectedFlavor.children.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>세부 풍미</Text>
              <View style={styles.childrenGrid}>
                {selectedFlavor.children.map((child, index) => (
                  <TouchableOpacity
                    key={`child-${index}-${child.name}`}
                    style={[styles.childItem, { borderLeftColor: child.colour }]}
                    onPress={() => {
                      setSelectedFlavor(child);
                    }}
                  >
                    <View style={[styles.colorIndicator, { backgroundColor: child.colour }]} />
                    <Text style={styles.childName}>{child.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {selectedFlavor.references && selectedFlavor.references.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>참조</Text>
              {selectedFlavor.references.map((ref, index) => (
                <View key={`ref-${index}`} style={styles.referenceItem}>
                  <Text style={styles.referenceText}>{ref.reference}</Text>
                  {ref.flavor && (
                    <Text style={styles.intensityText}>
                      풍미 강도: {ref.flavor.toFixed(1)}
                      {ref.flavor_preparation && ` (${ref.flavor_preparation})`}
                    </Text>
                  )}
                  {ref.aroma && (
                    <Text style={styles.aromaText}>
                      향 강도: {ref.aroma.toFixed(1)}
                      {ref.aroma_preparation && ` (${ref.aroma_preparation})`}
                    </Text>
                  )}
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </View>
    </View>
  </Modal>
}

export default FlavorWheel;
