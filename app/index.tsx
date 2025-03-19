import FlavorWheel from "@/components/FlavorWheel";
import PannableView from "@/components/PannableView";
import React from "react";
import scaa2016 from "@/assets/scaa-2016-flavor-map.json";
import { Dimensions, View, Text, StyleSheet } from "react-native";

// 화면 크기 계산
const { width } = Dimensions.get("window");
const WHEEL_SIZE = width * 1.4;
const CENTER_RADIUS = 70;

function Home() {
  return (
    <PannableView
      header={
        <View style={styles.headerContainer}>
          <Text style={styles.title}>{scaa2016.meta.name}</Text>
          <Text style={styles.subtitle}>Taster's Flavor Wheel</Text>
        </View>
      }
      size={WHEEL_SIZE * 0.8}
    >
      <FlavorWheel
        flavorData={scaa2016}
        WHEEL_SIZE={WHEEL_SIZE}
        CENTER_RADIUS={CENTER_RADIUS}
      />
    </PannableView>
  );
}

const styles = StyleSheet.create({
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
});

export default Home;
