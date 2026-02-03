import React from "react";
import { View, StyleSheet } from "react-native";
import Sidebar from "./Sidebar";

export default function DesktopLayout({ children, currentScreen }) {
  return (
    <View style={styles.container}>
      <Sidebar currentScreen={currentScreen} />
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "row",
  },
  content: {
    flex: 1,
    overflow: "hidden",
  },
});
