import React, { useState } from "react";
import { Text as SvgText } from "react-native-svg";
import Svg, { Circle } from "react-native-svg";
import TouchableOpacityG from "./TouchableOpacityG";
import { FlavorData, ScaaFlavor } from "@/types/scaaFlavor";
import getTextColor from "@/utils/getTextColor";
import { ColorValue, Dimensions, Modal, ScrollView, StyleSheet, TouchableOpacity, View, Text } from "react-native";

// SVG 좌표 변환 유틸리티 함수
const polarToCartesian = (
    centerX: number,
    centerY: number,
    radius: number,
    angleInDegrees: number,
) => {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
    return {
        x: centerX + radius * Math.cos(angleInRadians),
        y: centerY + radius * Math.sin(angleInRadians),
    };
};

// 부채꼴 경로 생성 함수
const createArcPath = (
    centerX: number,
    centerY: number,
    innerRadius: number,
    outerRadius: number,
    startAngle: number,
    endAngle: number,
) => {
    const start = polarToCartesian(centerX, centerY, outerRadius, endAngle);
    const end = polarToCartesian(centerX, centerY, outerRadius, startAngle);
    const innerStart = polarToCartesian(
        centerX,
        centerY,
        innerRadius,
        endAngle,
    );
    const innerEnd = polarToCartesian(
        centerX,
        centerY,
        innerRadius,
        startAngle,
    );

    const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1;

    return `M ${innerStart.x} ${innerStart.y} L ${start.x} ${start.y} A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 0 ${end.x} ${end.y} L ${innerEnd.x} ${innerEnd.y} A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 1 ${innerStart.x} ${innerStart.y} Z`;
};


const FlavorWheel = ({ flavorData, WHEEL_SIZE, CENTER_RADIUS }: { flavorData: ScaaFlavor, WHEEL_SIZE: number, CENTER_RADIUS: number }) => {
    const [selectedFlavor, setSelectedFlavor] = useState<FlavorData | null>(null);
    const [modalVisible, setModalVisible] = useState(false);

    // SVG 크기를 키워서 모든 내용이 보이도록 함
    const viewBoxSize = WHEEL_SIZE * 2;
    const centerX = viewBoxSize / 2;
    const centerY = viewBoxSize / 2;
    const outerRadius = viewBoxSize / 3; // 크기 조정
    const maxDepth = flavorData.meta.maxDepth || 3;

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


    // 패스 클릭 처리
    const handlePathClick = (flavor: FlavorData) => {
        setSelectedFlavor(flavor);
        setModalVisible(true);
    };

    const renderLayers = () => {
        const elements: React.ReactNode[] = [];

        // 부채꼴 레이어 설정
        const segmentWidth = (outerRadius - CENTER_RADIUS) / maxDepth;

        // 재귀적으로 각 레이어의 항목 렌더링 (모든 계층에 동일한 로직 적용)
        const renderLayerItems = (
            nodes: FlavorData[],
            depth: number,
            startAngle: number,
            totalAngle: number,
            parentIdPath: string = "",
            innerRadius: number = CENTER_RADIUS
        ) => {
            // 해당 계층의 총 가중치 계산
            const totalWeight = nodes.reduce(
                (sum, node) => sum + countLeafNodes(node),
                0
            );

            // 현재 각도 위치 추적
            let currentAngle = startAngle;

            // 각 노드 처리
            nodes.forEach((node, index) => {
                // 노드의 가중치에 비례한 각도 계산
                const segmentWidth = 160 - (depth * 10);
                const nodeWeight = countLeafNodes(node);
                const angleSize = totalAngle * (nodeWeight / totalWeight);
                const nodeStartAngle = currentAngle;
                const nodeEndAngle = currentAngle + angleSize;
                const nodeMidAngle = nodeStartAngle + angleSize / 2;

                // 현재 노드의 ID 경로 생성
                const idPath = parentIdPath ? `${parentIdPath}-${index}` : `${index}`;

                // 노드의 부채꼴 경로 생성
                const arcPath = createArcPath(
                    centerX,
                    centerY,
                    innerRadius,
                    innerRadius + segmentWidth,
                    nodeStartAngle,
                    nodeEndAngle
                );

                // 텍스트 위치 계산
                const textRadius = innerRadius + segmentWidth * 0.5;
                const textPoint = polarToCartesian(
                    centerX,
                    centerY,
                    textRadius,
                    nodeMidAngle
                );

                // 텍스트 회전 조정
                let textRotation = nodeMidAngle;
                if (nodeMidAngle > 90 && nodeMidAngle < 270) {
                    textRotation = nodeMidAngle - 90;
                } else {
                    textRotation = nodeMidAngle + 90;
                }
                if (textRotation > 90 && textRotation < 270) {
                    textRotation += 180;
                }

                // 텍스트 크기 결정 (깊이와 각도에 따라 조정)
                const textSize = [16, 14, 12][depth];

                // 노드 추가
                elements.push(
                    <TouchableOpacityG
                        key={`layer-${depth}-${idPath}-${node.name}`}
                        arcPath={arcPath}
                        color={node.colour}
                        onPress={() => handlePathClick(node)}
                        text={node.name}
                        textSize={textSize}
                        textColor={getTextColor(node.colour)}
                        textPoint={textPoint}
                        rotation={textRotation}
                    />
                );

                // 자식 노드가 있으면 재귀적으로 처리
                if (node.children && node.children.length > 0) {
                    renderLayerItems(
                        node.children,
                        depth + 1,
                        nodeStartAngle,
                        angleSize,
                        idPath,
                        innerRadius + segmentWidth
                    );
                }

                // 현재 각도 업데이트
                currentAngle = nodeEndAngle;
            });
        };

        // 최상위 노드부터 재귀 시작
        renderLayerItems(flavorData.data, 0, 0, 360);

        return elements;
    };

    // 전체 휠 렌더링
    return (
        <>
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


            {!!selectedFlavor && (
                <DetailModal
                    selectedFlavor={selectedFlavor}
                    setSelectedFlavor={setSelectedFlavor}
                    modalVisible={modalVisible}
                    closeModal={() => setModalVisible(false)}
                    textColor={getTextColor(selectedFlavor?.colour)}
                />
            )}
        </>
    );
};

const styles = StyleSheet.create({
    // 모달 스타일
    modalContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
    },
    modalContent: {
        width: "90%",
        maxHeight: "80%",
        backgroundColor: "#FFFFFF",
        borderRadius: 12,
        overflow: "hidden",
        elevation: 5,
        shadowColor: "#000000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    modalHeader: {
        padding: 15,
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: "bold",
        textAlign: "center",
    },
    closeButton: {
        position: "absolute",
        right: 12,
        top: "50%",
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: "rgba(255, 255, 255, 0.3)",
        justifyContent: "center",
        alignItems: "center",
    },
    closeButtonText: {
        fontSize: 24,
        fontWeight: "bold",
        lineHeight: 24,
        textAlign: "center",
    },
    modalBody: {
        padding: 15,
    },
    section: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "bold",
        marginBottom: 15,
        color: "#333333",
    },
    definitionText: {
        fontSize: 16,
        lineHeight: 22,
        color: "#555555",
    },
    childrenGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
    },
    childItem: {
        width: "48%",
        flexDirection: "row",
        alignItems: "center",
        padding: 12,
        marginBottom: 10,
        backgroundColor: "#F5F5F5",
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
        color: "#333333",
    },
    referenceItem: {
        backgroundColor: "#F5F5F5",
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
        color: "#E74C3C",
    },
    aromaText: {
        fontSize: 13,
        color: "#3498DB",
    },
});

const DetailModal = ({
    selectedFlavor,
    setSelectedFlavor,
    modalVisible,
    closeModal,
    textColor,
}: {
    selectedFlavor: FlavorData;
    setSelectedFlavor: (flavor: FlavorData) => void;
    modalVisible: boolean;
    closeModal: () => void;
    textColor: ColorValue;
}) => {
    return (
        <Modal
            visible={modalVisible}
            transparent={true}
            animationType="fade"
            onRequestClose={closeModal}
        >
            <View style={styles.modalContainer}>
                <View style={styles.modalContent}>
                    <View
                        style={[
                            styles.modalHeader,
                            { backgroundColor: selectedFlavor.colour },
                        ]}
                    >
                        <Text style={[styles.modalTitle, { color: textColor }]}>
                            {selectedFlavor.name}
                        </Text>
                        <TouchableOpacity style={styles.closeButton} onPress={closeModal}>
                            <Text style={[styles.closeButtonText, { color: textColor }]}>
                                ×
                            </Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.modalBody}>
                        {selectedFlavor.definition && (
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>정의</Text>
                                <Text style={styles.definitionText}>
                                    {selectedFlavor.definition}
                                </Text>
                            </View>
                        )}

                        {selectedFlavor.children && selectedFlavor.children.length > 0 && (
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>세부 풍미</Text>
                                <View style={styles.childrenGrid}>
                                    {selectedFlavor.children.map((child, index) => (
                                        <TouchableOpacity
                                            key={`child-${index}-${child.name}`}
                                            style={[
                                                styles.childItem,
                                                { borderLeftColor: child.colour },
                                            ]}
                                            onPress={() => {
                                                setSelectedFlavor(child);
                                            }}
                                        >
                                            <View
                                                style={[
                                                    styles.colorIndicator,
                                                    { backgroundColor: child.colour },
                                                ]}
                                            />
                                            <Text style={styles.childName}>{child.name}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                        )}

                        {selectedFlavor.references &&
                            selectedFlavor.references.length > 0 && (
                                <View style={styles.section}>
                                    <Text style={styles.sectionTitle}>참조</Text>
                                    {selectedFlavor.references.map((ref, index) => (
                                        <View key={`ref-${index}`} style={styles.referenceItem}>
                                            <Text style={styles.referenceText}>{ref.reference}</Text>
                                            {ref.flavor && (
                                                <Text style={styles.intensityText}>
                                                    풍미 강도: {ref.flavor.toFixed(1)}
                                                    {ref.flavor_preparation &&
                                                        ` (${ref.flavor_preparation})`}
                                                </Text>
                                            )}
                                            {ref.aroma && (
                                                <Text style={styles.aromaText}>
                                                    향 강도: {ref.aroma.toFixed(1)}
                                                    {ref.aroma_preparation &&
                                                        ` (${ref.aroma_preparation})`}
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
    );
};




export default FlavorWheel;