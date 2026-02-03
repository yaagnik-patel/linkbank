import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  Dimensions,
  StyleSheet,
} from "react-native";
import { useResponsive } from "@/hooks/useResponsive";
import DesktopLayout from "@/components/DesktopLayout";

const { width: winWidth, height: winHeight } = Dimensions.get("window");

export default function LinkBankHome({ navigation }) {
  const { isLargeScreen } = useResponsive();

  const slideUpAnim = useRef(new Animated.Value(winHeight * 0.3)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const bgFloat = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideUpAnim, {
        toValue: 0,
        tension: 20,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        delay: 300,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -20,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(bgFloat, {
          toValue: -10,
          duration: 4000,
          useNativeDriver: true,
        }),
        Animated.timing(bgFloat, {
          toValue: 0,
          duration: 4000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const handleLogin = () => navigation.navigate("Login");
  const handleStart = () => navigation.navigate("Signup");

  const mobileContent = (
    <View style={styles.mobileRoot}>
      <View style={styles.topSection}>
        <Animated.View style={{ transform: [{ translateY: bgFloat }] }}>
          <View style={[styles.blob, styles.blob1]} />
          <View style={[styles.blob, styles.blob2]} />
          <View style={[styles.blob, styles.blob3]} />
        </Animated.View>
        <View style={styles.bars}>
          <View style={[styles.bar, styles.bar1]} />
          <View style={[styles.bar, styles.bar2]} />
          <View style={[styles.bar, styles.bar3]} />
          <View style={[styles.bar, styles.bar4]} />
          <View style={[styles.bar, styles.bar5]} />
        </View>
        <Animated.View
          style={[styles.heroWrap, { transform: [{ translateY: floatAnim }] }]}
        >
          <View style={styles.heroCircle}>
            <Text style={styles.heroEmoji}>🔗</Text>
          </View>
        </Animated.View>
      </View>
      <Animated.View
        style={[
          styles.bottomCard,
          {
            height: winHeight * 0.45,
            transform: [{ translateY: slideUpAnim }],
          },
        ]}
      >
        <Animated.View style={{ opacity: fadeAnim, flex: 1 }}>
          <Text style={styles.title}>
            Paste Your Links Here.{"\n"}
            <Text style={styles.titleAccent}>Find Them Instantly.</Text>
          </Text>
          <Text style={styles.subtitle}>
            Stop scrolling through chats and notes. Save everything important in
            one place.
          </Text>
          <TouchableOpacity
            style={styles.ctaBtn}
            onPress={handleStart}
            activeOpacity={0.8}
          >
            <Text style={styles.ctaBtnText}>Let's Start!</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.loginLink}
            onPress={handleLogin}
            activeOpacity={0.6}
          >
            <Text style={styles.loginLinkText}>
              Already have an account?{" "}
              <Text style={styles.loginLinkAccent}>Log In</Text>
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </View>
  );

  const desktopContent = (
    <View style={styles.desktopRoot}>
      <View style={styles.desktopLeft}>
        <Text style={styles.desktopEmoji}>🔗</Text>
        <Text style={styles.desktopTitle}>
          Paste Your Links Here.{"\n"}
          <Text style={styles.titleAccent}>Find Them Instantly.</Text>
        </Text>
        <Text style={styles.desktopSubtitle}>
          Stop scrolling through chats and notes. Save everything important in
          one place.
        </Text>
        <View style={styles.desktopBtns}>
          <TouchableOpacity
            style={styles.ctaBtn}
            onPress={handleStart}
            activeOpacity={0.8}
          >
            <Text style={styles.ctaBtnText}>Let's Start!</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.desktopSecondaryBtn}
            onPress={handleLogin}
            activeOpacity={0.8}
          >
            <Text style={styles.desktopSecondaryText}>Log In</Text>
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.desktopRight}>
        <View style={styles.desktopVisual}>
          <Text style={styles.desktopVisualEmoji}>🔗</Text>
        </View>
      </View>
    </View>
  );

  const content = isLargeScreen ? desktopContent : mobileContent;
  if (isLargeScreen) {
    return <DesktopLayout currentScreen="Home">{content}</DesktopLayout>;
  }
  return content;
}

const styles = StyleSheet.create({
  mobileRoot: { flex: 1, backgroundColor: "#F3E8FF" },
  topSection: { flex: 1, position: "relative", overflow: "hidden" },
  blob: { position: "absolute", borderRadius: 9999 },
  blob1: {
    top: 64,
    right: 40,
    width: 64,
    height: 64,
    backgroundColor: "#FDE047",
    opacity: 0.8,
  },
  blob2: {
    top: 96,
    left: -40,
    width: 160,
    height: 160,
    backgroundColor: "#F472B6",
    opacity: 0.4,
  },
  blob3: {
    top: 160,
    right: -40,
    width: 192,
    height: 192,
    backgroundColor: "#A78BFA",
    opacity: 0.3,
  },
  bars: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "center",
    opacity: 0.3,
  },
  bar: { marginHorizontal: 4, borderTopLeftRadius: 4, borderTopRightRadius: 4 },
  bar1: { width: 48, height: 96, backgroundColor: "#C4B5FD" },
  bar2: { width: 64, height: 128, backgroundColor: "#A78BFA" },
  bar3: { width: 40, height: 64, backgroundColor: "#C4B5FD" },
  bar4: { width: 80, height: 160, backgroundColor: "#7C3AED" },
  bar5: { width: 56, height: 112, backgroundColor: "#A78BFA" },
  heroWrap: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 80,
  },
  heroCircle: {
    width: 192,
    height: 192,
    borderRadius: 9999,
    backgroundColor: "rgba(255,255,255,0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  heroEmoji: { fontSize: 80 },
  bottomCard: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderTopLeftRadius: 40,
    paddingHorizontal: 32,
    paddingTop: 40,
    paddingBottom: 48,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#111827",
    textAlign: "center",
    marginBottom: 16,
  },
  titleAccent: { color: "#7C3AED" },
  subtitle: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 32,
    paddingHorizontal: 16,
  },
  ctaBtn: {
    backgroundColor: "#111827",
    paddingVertical: 16,
    borderRadius: 9999,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  ctaBtnText: { color: "#fff", fontWeight: "700", fontSize: 18 },
  loginLink: { alignItems: "center", paddingVertical: 12 },
  loginLinkText: { color: "#9CA3AF", fontWeight: "600", fontSize: 16 },
  loginLinkAccent: { color: "#7C3AED" },
  desktopRoot: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#F3E8FF",
    padding: 48,
    alignItems: "center",
  },
  desktopLeft: { flex: 1, maxWidth: 480 },
  desktopEmoji: { fontSize: 64, marginBottom: 24 },
  desktopTitle: {
    fontSize: 36,
    fontWeight: "800",
    color: "#111827",
    lineHeight: 44,
    marginBottom: 16,
  },
  desktopSubtitle: {
    fontSize: 18,
    color: "#6B7280",
    lineHeight: 28,
    marginBottom: 32,
  },
  desktopBtns: { flexDirection: "row", gap: 16 },
  desktopSecondaryBtn: {
    paddingVertical: 16,
    paddingHorizontal: 28,
    borderRadius: 9999,
    borderWidth: 2,
    borderColor: "#7C3AED",
    alignItems: "center",
    justifyContent: "center",
  },
  desktopSecondaryText: { color: "#7C3AED", fontWeight: "700", fontSize: 16 },
  desktopRight: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  desktopVisual: {
    width: 320,
    height: 320,
    borderRadius: 9999,
    backgroundColor: "rgba(255,255,255,0.7)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 8,
  },
  desktopVisualEmoji: { fontSize: 120 },
});
