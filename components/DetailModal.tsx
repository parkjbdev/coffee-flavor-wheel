import React from "react";
import { 
    ColorValue, 
    Modal, 
    ScrollView, 
    StyleSheet, 
    TouchableOpacity, 
    View, 
    Text 
} from "react-native";
import { FlavorData } from "@/types/scaaFlavor";

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

export default DetailModal;