import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Modal,
  FlatList,
  Alert,
  Linking,
  KeyboardAvoidingView,
  Platform,
  Clipboard,
  Dimensions,
  ScrollView,
  Image,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useResponsive } from "@/hooks/useResponsive";
import DesktopLayout from "@/components/DesktopLayout";
import { useAuth } from "@/screens/Auth/AuthContext";

const { width, height } = Dimensions.get("window");

const FILTERS = ["All", "Today", "Yesterday", "Older"];

export default function LinkScreen({ navigation }) {
  const { isLargeScreen } = useResponsive();
  const { logout, deleteAccount } = useAuth();
  const [links, setLinks] = useState([]);
  const [accountMenuVisible, setAccountMenuVisible] = useState(false);
  const [activeFilter, setActiveFilter] = useState("All");

  const [addModalVisible, setAddModalVisible] = useState(false);
  const [newName, setNewName] = useState("");
  const [newUrl, setNewUrl] = useState("");

  const [optionsModalVisible, setOptionsModalVisible] = useState(false);
  const [selectedLink, setSelectedLink] = useState(null);

  const lastTap = useRef(null);
  const singleClickTimer = useRef(null);

  const getFaviconUrl = (url) => {
    try {
      const domain = url
        .replace(/^(?:https?:\/\/)?(?:www\.)?/i, "")
        .split("/")[0];
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
    } catch (e) {
      return null;
    }
  };

  const handleAddLink = () => {
    if (!newName.trim() || !newUrl.trim()) {
      Alert.alert(
        "Missing Information",
        "Please enter both a name and a link URL."
      );
      return;
    }

    const timestamp = Date.now();
    const logoUrl = getFaviconUrl(newUrl);

    const newLinkItem = {
      id: timestamp.toString(),
      name: newName,
      url: newUrl.startsWith("http") ? newUrl : `https://${newUrl}`,
      date: new Date(timestamp).toLocaleDateString(),
      timestamp: timestamp,
      logo: logoUrl,
    };

    setLinks([newLinkItem, ...links]);
    setNewName("");
    setNewUrl("");
    setAddModalVisible(false);
    setActiveFilter("All");
  };

  const getFilteredLinks = () => {
    if (activeFilter === "All") return links;

    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    return links.filter((link) => {
      const linkDate = new Date(link.timestamp);

      if (activeFilter === "Today") {
        return linkDate.toDateString() === today.toDateString();
      }
      if (activeFilter === "Yesterday") {
        return linkDate.toDateString() === yesterday.toDateString();
      }
      if (activeFilter === "Older") {
        return (
          linkDate < yesterday &&
          linkDate.toDateString() !== yesterday.toDateString()
        );
      }
      return true;
    });
  };

  const displayedLinks = getFilteredLinks();

  const goToSignup = () => {
    setAccountMenuVisible(false);
    navigation.replace("Signup");
  };

  const handleLogout = async () => {
    setAccountMenuVisible(false);
    try {
      await logout();
      goToSignup();
    } catch (e) {
      Alert.alert("Error", e?.message || "Failed to log out");
    }
  };

  const handleDeleteAccount = () => {
    setAccountMenuVisible(false);
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

  const openLink = (url) => {
    Linking.canOpenURL(url).then((supported) => {
      if (supported) {
        Linking.openURL(url);
      } else {
        Alert.alert("Error", "Cannot open this link: " + url);
      }
    });
  };

  const handleItemPress = (item) => {
    if (Platform.OS === "web") {
      const now = Date.now();
      const DOUBLE_PRESS_DELAY = 300;

      if (lastTap.current && now - lastTap.current < DOUBLE_PRESS_DELAY) {
        if (singleClickTimer.current) clearTimeout(singleClickTimer.current);
        handleOptions(item);
        lastTap.current = null;
      } else {
        lastTap.current = now;
        singleClickTimer.current = setTimeout(() => {
          openLink(item.url);
          lastTap.current = null;
        }, DOUBLE_PRESS_DELAY);
      }
    } else {
      openLink(item.url);
    }
  };

  const handleOptions = (item) => {
    setSelectedLink(item);
    setOptionsModalVisible(true);
  };

  const handleDelete = () => {
    if (selectedLink) {
      setLinks(links.filter((l) => l.id !== selectedLink.id));
      setOptionsModalVisible(false);
      setSelectedLink(null);
    }
  };

  const handleCopy = () => {
    if (selectedLink) {
      if (Platform.OS === "web") {
        navigator.clipboard.writeText(selectedLink.url);
        alert("Link copied to clipboard!");
      } else {
        Clipboard.setString(selectedLink.url);
        Alert.alert("Copied", "Link copied to clipboard!");
      }
      setOptionsModalVisible(false);
    }
  };

  const renderLinkItem = ({ item }) => (
    <TouchableOpacity
      className="bg-white p-4 mb-3 rounded-2xl flex-row items-center shadow-sm border border-purple-100"
      onPress={() => handleItemPress(item)}
      onLongPress={() => handleOptions(item)}
      delayLongPress={500}
      activeOpacity={0.7}
    >
      <View className="w-12 h-12 bg-white rounded-full items-center justify-center mr-4 shadow-sm border border-gray-100 overflow-hidden">
        {item.logo ? (
          <Image
            source={{ uri: item.logo }}
            className="w-8 h-8"
            resizeMode="contain"
          />
        ) : (
          <Text className="text-xl">🔗</Text>
        )}
      </View>

      <View className="flex-1">
        <Text className="text-gray-900 font-bold text-lg">{item.name}</Text>
        <Text className="text-gray-500 text-xs" numberOfLines={1}>
          {item.url}
        </Text>
        <Text className="text-gray-400 text-[10px] mt-1">{item.date}</Text>
      </View>
      <Text className="text-purple-300 font-bold text-xl">›</Text>
    </TouchableOpacity>
  );

  const mainContent = (
    <View className="flex-1" style={{ backgroundColor: "#F3E8FF" }}>
      {/* Header */}
      <View className="pt-2 pb-4 px-6 bg-white rounded-b-[30px] shadow-sm z-10">
        <View className="flex-row items-center justify-between mb-4">
          <View>
            <Text className="text-gray-500 text-xs font-bold tracking-widest uppercase">
              My Dashboard
            </Text>
            <Text className="text-2xl font-extrabold text-gray-900">
              Saved Links ({links.length})
            </Text>
          </View>
          <View className="flex-row items-center" style={{ gap: 8 }}>
            {!isLargeScreen && (
              <TouchableOpacity
                className="w-10 h-10 bg-purple-100 rounded-full items-center justify-center"
                onPress={() => setAccountMenuVisible(true)}
              >
                <MaterialCommunityIcons
                  name="dots-vertical"
                  size={22}
                  color="#7C3AED"
                />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              className="w-10 h-10 bg-purple-100 rounded-full items-center justify-center"
              onPress={() => navigation.goBack()}
            >
              <Text className="text-purple-600 font-bold">←</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View className="bg-gray-100 rounded-xl px-4 py-3 flex-row items-center mb-4">
          <Text className="mr-2">🔍</Text>
          <TextInput
            placeholder="Search your links..."
            className="flex-1 text-gray-700"
            placeholderTextColor="#9CA3AF"
          />
        </View>

        {/* Filter Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingBottom: 8 }}
        >
          {FILTERS.map((filter) => (
            <TouchableOpacity
              key={filter}
              onPress={() => setActiveFilter(filter)}
              className={`px-4 py-2 rounded-full border ${
                activeFilter === filter
                  ? "bg-purple-600 border-purple-600"
                  : "bg-white border-gray-200"
              }`}
            >
              <Text
                className={`font-semibold text-xs ${
                  activeFilter === filter ? "text-white" : "text-gray-500"
                }`}
              >
                {filter}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* List or Empty State */}
      {displayedLinks.length === 0 ? (
        <View className="flex-1 items-center justify-center opacity-60 pb-20">
          <View className="w-24 h-24 bg-white rounded-full items-center justify-center mb-6 shadow-sm">
            <Text className="text-5xl">
              {activeFilter === "All" ? "📂" : "📅"}
            </Text>
          </View>
          <Text className="text-xl font-bold text-purple-900">
            {activeFilter === "All"
              ? "No links yet"
              : `No links for "${activeFilter}"`}
          </Text>
          {activeFilter === "All" && (
            <Text className="text-gray-500 text-center px-10 mt-2 leading-6">
              Tap the + button below to save your first important link.
            </Text>
          )}
        </View>
      ) : (
        <FlatList
          data={displayedLinks}
          keyExtractor={(item) => item.id}
          renderItem={renderLinkItem}
          contentContainerStyle={{ padding: 24, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Add Button */}
      <TouchableOpacity
        className="absolute bottom-8 right-8 w-16 h-16 bg-gray-900 rounded-full items-center justify-center shadow-2xl active:scale-90 transition-transform"
        activeOpacity={0.8}
        onPress={() => setAddModalVisible(true)}
      >
        <Text className="text-white text-3xl font-light mb-1">+</Text>
      </TouchableOpacity>

      {/* --- MODAL 1: Add New Link --- */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={addModalVisible}
        onRequestClose={() => setAddModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1 justify-end"
        >
          <TouchableOpacity
            className="absolute inset-0 bg-black/50"
            activeOpacity={1}
            onPress={() => setAddModalVisible(false)}
          />
          <View className="bg-white rounded-t-[30px] p-8 shadow-2xl">
            <View className="w-12 h-1 bg-gray-300 rounded-full self-center mb-8" />
            <Text className="text-2xl font-bold text-gray-900 mb-6">
              Add New Link ✨
            </Text>

            <View className="mb-4">
              <Text className="text-gray-500 font-bold text-xs uppercase mb-2 ml-1">
                Name
              </Text>
              <TextInput
                className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-4 text-gray-900 text-base"
                placeholder="e.g. My Portfolio"
                placeholderTextColor="#9CA3AF"
                value={newName}
                onChangeText={setNewName}
                autoFocus={true}
              />
            </View>

            <View className="mb-8">
              <Text className="text-gray-500 font-bold text-xs uppercase mb-2 ml-1">
                Link URL
              </Text>
              <TextInput
                className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-4 text-gray-900 text-base"
                placeholder="e.g. google.com"
                placeholderTextColor="#9CA3AF"
                value={newUrl}
                onChangeText={setNewUrl}
                autoCapitalize="none"
                keyboardType="url"
              />
            </View>

            <View className="flex-row gap-4">
              <TouchableOpacity
                className="flex-1 py-4 rounded-full items-center bg-gray-100"
                onPress={() => setAddModalVisible(false)}
              >
                <Text className="text-gray-900 font-bold">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 py-4 rounded-full items-center bg-purple-600 shadow-lg shadow-purple-200"
                onPress={handleAddLink}
              >
                <Text className="text-white font-bold">Save Link</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* --- MODAL 2: Options Menu --- */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={optionsModalVisible}
        onRequestClose={() => setOptionsModalVisible(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/30">
          <TouchableOpacity
            className="absolute inset-0"
            activeOpacity={1}
            onPress={() => setOptionsModalVisible(false)}
          />

          <View className="bg-white w-64 rounded-2xl shadow-2xl overflow-hidden p-2">
            <View className="px-4 py-3 border-b border-gray-100">
              <Text className="text-xs text-gray-400 font-bold uppercase tracking-wider text-center">
                Options
              </Text>
            </View>

            <TouchableOpacity
              className="flex-row items-center px-4 py-4 active:bg-gray-50 rounded-lg"
              onPress={handleCopy}
            >
              <View className="w-8 h-8 bg-blue-50 rounded-full items-center justify-center mr-3">
                <Text className="text-blue-500">📋</Text>
              </View>
              <Text className="text-gray-800 font-semibold text-base">
                Copy Link
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-row items-center px-4 py-4 active:bg-gray-50 rounded-lg"
              onPress={handleDelete}
            >
              <View className="w-8 h-8 bg-red-50 rounded-full items-center justify-center mr-3">
                <Text className="text-red-500">🗑️</Text>
              </View>
              <Text className="text-red-600 font-semibold text-base">
                Delete Link
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* --- MODAL 3: Account menu (mobile) --- */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={accountMenuVisible}
        onRequestClose={() => setAccountMenuVisible(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/30">
          <TouchableOpacity
            className="absolute inset-0"
            activeOpacity={1}
            onPress={() => setAccountMenuVisible(false)}
          />
          <View className="bg-white w-64 rounded-2xl shadow-2xl overflow-hidden p-2">
            <View className="px-4 py-3 border-b border-gray-100">
              <Text className="text-xs text-gray-400 font-bold uppercase tracking-wider text-center">
                Account
              </Text>
            </View>
            <TouchableOpacity
              className="flex-row items-center px-4 py-4 active:bg-gray-50 rounded-lg"
              onPress={handleLogout}
            >
              <View className="w-8 h-8 bg-purple-50 rounded-full items-center justify-center mr-3">
                <MaterialCommunityIcons
                  name="logout"
                  size={20}
                  color="#7C3AED"
                />
              </View>
              <Text className="text-gray-800 font-semibold text-base">
                Logout
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-row items-center px-4 py-4 active:bg-gray-50 rounded-lg"
              onPress={handleDeleteAccount}
            >
              <View className="w-8 h-8 bg-red-50 rounded-full items-center justify-center mr-3">
                <MaterialCommunityIcons
                  name="delete-outline"
                  size={20}
                  color="#DC2626"
                />
              </View>
              <Text className="text-red-600 font-semibold text-base">
                Delete account
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );

  if (isLargeScreen) {
    return <DesktopLayout currentScreen="Link">{mainContent}</DesktopLayout>;
  }
  return mainContent;
}
