import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Animated,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useAuth } from "./AuthContext";
import { useResponsive } from "@/hooks/useResponsive";

export default function Login({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const { login, signInWithGoogle, authError, clearError } = useAuth();
  const { isLargeScreen } = useResponsive();
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -10,
          duration: 2500,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 2500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  // Show auth error alert when authError changes
  useEffect(() => {
    if (authError) {
      Alert.alert("Authentication Error", authError, [
        { text: "OK", onPress: () => {
          if (clearError && typeof clearError === 'function') {
            clearError();
          }
        }}
      ]);
    }
  }, [authError, clearError]);

  const handleLogin = async () => {
    // Clear any previous errors
    if (clearError && typeof clearError === 'function') {
      clearError();
    }
    
    if (!email || !password) {
      Alert.alert("Missing Fields", "Please enter both email and password.");
      return;
    }
    
    setLoading(true);
    try {
      console.log('[Login] Attempting login for user');
      await login(email, password);
      console.log('[Login] Login successful, navigating to Link screen');
      navigation.replace("Link");
    } catch (error) {
      console.error('[Login] Login failed:', error);
      // Error is already handled by AuthContext, but show fallback
      Alert.alert("Login Failed", error.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    // Clear any previous errors
    if (clearError && typeof clearError === 'function') {
      clearError();
    }
    
    setLoading(true);
    try {
      console.log('[Login] Attempting Google Sign-In');
      await signInWithGoogle();
      console.log('[Login] Google Sign-In successful, navigating to Link screen');
      navigation.replace("Link");
    } catch (error) {
      console.error('[Login] Google Sign-In failed:', error);
      // Error is already handled by AuthContext, but show fallback
      Alert.alert("Google Sign-In Failed", error.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const formContent = (
    <>
      <Text style={styles.formLabel}>Email</Text>
      <TextInput
        style={styles.input}
        placeholder="user@example.com"
        placeholderTextColor="#9CA3AF"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <Text style={styles.formLabel}>Password</Text>
      <TextInput
        style={styles.input}
        placeholder="••••••••"
        placeholderTextColor="#9CA3AF"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <TouchableOpacity
        style={styles.primaryBtn}
        onPress={handleLogin}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.primaryBtnText}>Log In</Text>
        )}
      </TouchableOpacity>
      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>or</Text>
        <View style={styles.dividerLine} />
      </View>
      <TouchableOpacity
        style={styles.googleBtn}
        onPress={handleGoogleSignIn}
        disabled={loading}
        activeOpacity={0.7}
      >
        <MaterialCommunityIcons
          name="google"
          size={22}
          color="#4285F4"
          style={{ marginRight: 10 }}
        />
        <Text style={styles.googleBtnText}>Continue with Google</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.switchAuth}
        onPress={() => navigation.navigate("Signup")}
        activeOpacity={0.7}
      >
        <Text style={styles.switchAuthText}>
          Don't have an account?{" "}
          <Text style={styles.switchAuthAccent}>Sign Up</Text>
        </Text>
      </TouchableOpacity>
    </>
  );

  const mobileView = (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.mobileRoot}
    >
      <View style={styles.mobileBg}>
        <View style={styles.mobileHeader}>
          <View style={styles.mobileBlob1} />
          <View style={styles.mobileBlob2} />
          <Animated.View
            style={[
              styles.mobileHeroWrap,
              { transform: [{ translateY: floatAnim }] },
            ]}
          >
            <Text style={styles.mobileEmoji}>🔐</Text>
          </Animated.View>
          <Text style={styles.mobileTitle}>Welcome Back</Text>
        </View>
        <View style={styles.mobileForm}>
          <Text style={styles.mobileFormIntro}>
            Enter your details to access your vault.
          </Text>
          {formContent}
        </View>
      </View>
    </KeyboardAvoidingView>
  );

  const desktopView = (
    <View style={styles.desktopRoot}>
      <View style={styles.desktopLeft}>
        <View style={styles.desktopLeftInner}>
          <View style={styles.desktopBlob1} />
          <View style={styles.desktopBlob2} />
          <View style={styles.desktopBlob3} />
          <Animated.View
            style={[
              styles.desktopHeroWrap,
              { transform: [{ translateY: floatAnim }] },
            ]}
          >
            <Text style={styles.desktopEmoji}>🔐</Text>
          </Animated.View>
          <Text style={styles.desktopWelcome}>Welcome Back</Text>
          <Text style={styles.desktopTagline}>
            Your links are safe. Sign in to access your vault from any device.
          </Text>
        </View>
      </View>
      <View style={styles.desktopRight}>
        <View style={styles.desktopCard}>
          <Text style={styles.desktopCardTitle}>Log in to LinkBank</Text>
          <Text style={styles.desktopCardSub}>Enter your details below</Text>
          {formContent}
        </View>
      </View>
    </View>
  );

  return isLargeScreen ? desktopView : mobileView;
}

const styles = StyleSheet.create({
  mobileRoot: { flex: 1, backgroundColor: "#fff" },
  mobileBg: { flex: 1, backgroundColor: "#F3E8FF" },
  mobileHeader: {
    height: "33%",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    overflow: "hidden",
  },
  mobileBlob1: {
    position: "absolute",
    top: -100,
    right: -80,
    width: 256,
    height: 256,
    borderRadius: 9999,
    backgroundColor: "#E9D5FF",
    opacity: 0.4,
  },
  mobileBlob2: {
    position: "absolute",
    bottom: -80,
    left: -80,
    width: 192,
    height: 192,
    borderRadius: 9999,
    backgroundColor: "#FBCFE8",
    opacity: 0.4,
  },
  mobileHeroWrap: { alignItems: "center", justifyContent: "center" },
  mobileEmoji: { fontSize: 80 },
  mobileTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
    marginTop: 16,
  },
  mobileForm: {
    flex: 1,
    backgroundColor: "#fff",
    borderTopLeftRadius: 40,
    paddingHorizontal: 32,
    paddingTop: 40,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  mobileFormIntro: { color: "#6B7280", fontWeight: "600", marginBottom: 32 },
  formLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#9CA3AF",
    textTransform: "uppercase",
    marginBottom: 8,
    marginLeft: 4,
  },
  input: {
    width: "100%",
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: "#111827",
    marginBottom: 16,
  },
  primaryBtn: {
    backgroundColor: "#7C3AED",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryBtnText: { color: "#fff", fontWeight: "700", fontSize: 18 },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: "#E5E7EB" },
  dividerText: {
    marginHorizontal: 16,
    color: "#9CA3AF",
    fontSize: 14,
    fontWeight: "500",
  },
  googleBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  googleBtnText: { color: "#374151", fontWeight: "600", fontSize: 16 },
  switchAuth: { alignItems: "center", paddingVertical: 8 },
  switchAuthText: { color: "#9CA3AF", fontSize: 15 },
  switchAuthAccent: { color: "#7C3AED", fontWeight: "700" },
  desktopRoot: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#F3E8FF",
  },
  desktopLeft: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 48,
    position: "relative",
    overflow: "hidden",
  },
  desktopLeftInner: { width: "100%", maxWidth: 420, position: "relative" },
  desktopBlob1: {
    position: "absolute",
    top: -60,
    right: -40,
    width: 280,
    height: 280,
    borderRadius: 9999,
    backgroundColor: "#E9D5FF",
    opacity: 0.5,
  },
  desktopBlob2: {
    position: "absolute",
    bottom: -40,
    left: -60,
    width: 220,
    height: 220,
    borderRadius: 9999,
    backgroundColor: "#FBCFE8",
    opacity: 0.5,
  },
  desktopBlob3: {
    position: "absolute",
    top: "40%",
    right: -80,
    width: 200,
    height: 200,
    borderRadius: 9999,
    backgroundColor: "#C4B5FD",
    opacity: 0.3,
  },
  desktopHeroWrap: { alignItems: "center", marginBottom: 24 },
  desktopEmoji: { fontSize: 100 },
  desktopWelcome: {
    fontSize: 36,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 12,
  },
  desktopTagline: {
    fontSize: 18,
    color: "#6B7280",
    lineHeight: 28,
  },
  desktopRight: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 48,
  },
  desktopCard: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 40,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 8,
  },
  desktopCardTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 8,
  },
  desktopCardSub: { fontSize: 15, color: "#6B7280", marginBottom: 32 },
});
