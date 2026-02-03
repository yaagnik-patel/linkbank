import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useAuth } from "@/screens/Auth/AuthContext";

const SIDEBAR_WIDTH = 260;

const navItemsLoggedIn = [
  { name: "Home", screen: "Home", icon: "home" },
  { name: "My Links", screen: "Link", icon: "link-variant" },
];

const navItemsLoggedOut = [
  { name: "Home", screen: "Home", icon: "home" },
  { name: "Log In", screen: "Login", icon: "login" },
  { name: "Sign Up", screen: "Signup", icon: "account-plus" },
];

export default function Sidebar({ currentScreen }) {
  const navigation = useNavigation();
  const { user, logout, deleteAccount } = useAuth();
  const activeScreen = currentScreen || "Home";
  const navItems = user ? navItemsLoggedIn : navItemsLoggedOut;

  const goToSignup = () => {
    navigation.replace("Signup");
  };

  const handleLogout = async () => {
    try {
      await logout();
      goToSignup();
    } catch (e) {
      Alert.alert("Error", e?.message || "Failed to log out");
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "Are you sure? This will permanently delete your account and cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteAccount();
              goToSignup();
            } catch (e) {
              Alert.alert(
                "Error",
                e?.message ||
                  "Failed to delete account. You may need to sign in again first."
              );
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.sidebar}>
      <View style={styles.logo}>
        <Text style={styles.logoIcon}>🔗</Text>
        <Text style={styles.logoText}>LinkBank</Text>
        <Text style={styles.logoTagline}>Save. Find. Instantly.</Text>
      </View>

      <View style={styles.nav}>
        {navItems.map((item) => {
          const isActive = activeScreen === item.screen;
          return (
            <TouchableOpacity
              key={item.screen}
              style={[styles.navItem, isActive && styles.navItemActive]}
              onPress={() => navigation.navigate(item.screen)}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name={item.icon}
                size={22}
                color={isActive ? "#7C3AED" : "#6B7280"}
              />
              <Text style={[styles.navText, isActive && styles.navTextActive]}>
                {item.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.footer}>
        {user ? (
          <>
            <TouchableOpacity
              style={styles.footerButton}
              onPress={handleLogout}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="logout" size={20} color="#6B7280" />
              <Text style={styles.footerButtonText}>Logout</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.footerButton, styles.footerButtonDanger]}
              onPress={handleDeleteAccount}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name="delete-outline"
                size={20}
                color="#DC2626"
              />
              <Text style={styles.footerButtonTextDanger}>Delete account</Text>
            </TouchableOpacity>
          </>
        ) : (
          <Text style={styles.footerText}>One place for all your links</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    width: SIDEBAR_WIDTH,
    backgroundColor: "#fff",
    borderRightWidth: 1,
    borderRightColor: "#E5E7EB",
    paddingVertical: 24,
    paddingHorizontal: 20,
    justifyContent: "space-between",
  },
  logo: {
    marginBottom: 32,
  },
  logoIcon: {
    fontSize: 36,
    marginBottom: 8,
  },
  logoText: {
    fontSize: 22,
    fontWeight: "800",
    color: "#111827",
    letterSpacing: -0.5,
  },
  logoTagline: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 4,
  },
  nav: {
    flex: 1,
  },
  navItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginBottom: 4,
    gap: 12,
  },
  navItemActive: {
    backgroundColor: "#F3E8FF",
  },
  navText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#6B7280",
  },
  navTextActive: {
    color: "#7C3AED",
  },
  footer: {
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  footerText: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  footerButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 4,
    gap: 10,
  },
  footerButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
  },
  footerButtonTextDanger: {
    fontSize: 14,
    fontWeight: "600",
    color: "#DC2626",
  },
});
