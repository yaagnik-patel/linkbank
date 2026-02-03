import React, { useState, useRef, useEffect } from "react";
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
import {
  subscribeUserLinks,
  addUserLink,
  deleteUserLink,
  updateUserLink,
} from "@/firebase/links";

const { width, height } = Dimensions.get("window");

const DATE_FILTERS = ["All", "Today", "Yesterday", "Older"];

function LinkRow({ item, onPress, onLongPress }) {
  const [logoError, setLogoError] = useState(false);
  useEffect(() => {
    setLogoError(false);
  }, [item.id]);
  const showLogo = item.logo && !logoError;
  return (
    <TouchableOpacity
      className="bg-white p-4 mb-3 rounded-2xl flex-row items-center shadow-sm border border-purple-100"
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={500}
      activeOpacity={0.7}
    >
      <View className="w-12 h-12 bg-white rounded-full items-center justify-center mr-4 shadow-sm border border-gray-100 overflow-hidden">
        {showLogo ? (
          <Image
            source={{ uri: item.logo }}
            className="w-8 h-8"
            resizeMode="contain"
            onError={() => setLogoError(true)}
          />
        ) : (
          <Text className="text-xl">🔗</Text>
        )}
      </View>
      <View className="flex-1">
        <View className="flex-row items-center flex-wrap gap-2">
          <Text className="text-gray-900 font-bold text-lg">{item.name}</Text>
          {(item.category || "Uncategorised") !== "Uncategorised" && (
            <View className="bg-purple-100 px-2 py-0.5 rounded-full">
              <Text className="text-purple-700 text-[10px] font-semibold">
                {item.category || "Uncategorised"}
              </Text>
            </View>
          )}
        </View>
        <Text className="text-gray-500 text-xs" numberOfLines={1}>
          {item.url}
        </Text>
        {item.note ? (
          <Text className="text-gray-500 text-xs mt-1" numberOfLines={2}>
            📝 {item.note}
          </Text>
        ) : null}
        <Text className="text-gray-400 text-[10px] mt-1">{item.date}</Text>
      </View>
      <Text className="text-purple-300 font-bold text-xl">›</Text>
    </TouchableOpacity>
  );
}

export default function LinkScreen({ navigation }) {
  const { isLargeScreen } = useResponsive();
  const { user, logout, deleteAccount } = useAuth();
  const [links, setLinks] = useState([]);

  // Load and sync links from Firestore for the current user (saved per user, persists across sessions)
  useEffect(() => {
    if (!user?.uid) {
      setLinks([]);
      return;
    }
    const unsubscribe = subscribeUserLinks(user.uid, setLinks);
    return unsubscribe;
  }, [user?.uid]);
  const [accountMenuVisible, setAccountMenuVisible] = useState(false);
  const [activeDateFilter, setActiveDateFilter] = useState("All");
  const [activeCategory, setActiveCategory] = useState("All");

  const [addModalVisible, setAddModalVisible] = useState(false);
  const [newName, setNewName] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [newNote, setNewNote] = useState("");
  const [newCategory, setNewCategory] = useState("");

  const [optionsModalVisible, setOptionsModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedLink, setSelectedLink] = useState(null);
  const [editNote, setEditNote] = useState("");
  const [editCategory, setEditCategory] = useState("");

  const lastTap = useRef(null);
  const singleClickTimer = useRef(null);

  const getFaviconUrl = (url) => {
    try {
      const domain = url
        .replace(/^(?:https?:\/\/)?(?:www\.)?/i, "")
        .split("/")[0];
      if (!domain) return null;
      return `https://icons.duckduckgo.com/ip3/${encodeURIComponent(
        domain
      )}.ico`;
    } catch (e) {
      return null;
    }
  };

  const handleAddLink = async () => {
    if (!newName.trim() || !newUrl.trim()) {
      Alert.alert(
        "Missing Information",
        "Please enter both a name and a link URL."
      );
      return;
    }
    if (!user?.uid) {
      Alert.alert("Log in required", "Please log in to save links.");
      return;
    }

    const timestamp = Date.now();
    const logoUrl = getFaviconUrl(newUrl);

    const urlFinal = newUrl.trim().startsWith("http")
      ? newUrl.trim()
      : `https://${newUrl.trim()}`;
    const newLinkItem = {
      name: newName.trim(),
      url: urlFinal,
      date: new Date(timestamp).toLocaleDateString(),
      timestamp,
      logo: logoUrl || null,
      note: newNote.trim() || null,
      category: newCategory.trim() || "Uncategorised",
    };

    try {
      await addUserLink(user.uid, newLinkItem);
      setNewName("");
      setNewUrl("");
      setNewNote("");
      setNewCategory("");
      setAddModalVisible(false);
      setActiveDateFilter("All");
      setActiveCategory("All");
      // List updates in realtime via Firestore onSnapshot (no optimistic add to avoid duplicate)
    } catch (e) {
      Alert.alert("Error", e?.message || "Failed to save link.");
    }
  };

  const categories = React.useMemo(() => {
    const set = new Set();
    links.forEach((l) => {
      const c = l.category?.trim() || "Uncategorised";
      if (c) set.add(c);
    });
    return ["All", ...Array.from(set).sort()];
  }, [links]);

  const getFilteredLinks = () => {
    let list = links;

    if (activeDateFilter !== "All") {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      list = list.filter((link) => {
        const linkDate = new Date(link.timestamp);
        if (activeDateFilter === "Today")
          return linkDate.toDateString() === today.toDateString();
        if (activeDateFilter === "Yesterday")
          return linkDate.toDateString() === yesterday.toDateString();
        if (activeDateFilter === "Older")
          return (
            linkDate < yesterday &&
            linkDate.toDateString() !== yesterday.toDateString()
          );
        return true;
      });
    }

    if (activeCategory !== "All") {
      const cat = activeCategory === "Uncategorised" ? "" : activeCategory;
      list = list.filter(
        (link) =>
          (link.category?.trim() || "Uncategorised") ===
          (cat || "Uncategorised")
      );
    }

    return list;
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
    setEditNote(item.note || "");
    setEditCategory(item.category?.trim() || "Uncategorised");
    setOptionsModalVisible(true);
  };

  const openEditModal = () => {
    setOptionsModalVisible(false);
    setEditModalVisible(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedLink || !user?.uid) return;
    const updates = {
      note: editNote.trim() || null,
      category: editCategory.trim() || "Uncategorised",
    };
    try {
      await updateUserLink(user.uid, selectedLink.id, updates);
      setEditModalVisible(false);
      setSelectedLink(null);
      // List updates in realtime via Firestore onSnapshot
    } catch (e) {
      Alert.alert("Error", e?.message || "Failed to update.");
    }
  };

  const handleDelete = async () => {
    if (!selectedLink) return;
    if (!user?.uid) {
      setOptionsModalVisible(false);
      setSelectedLink(null);
      return;
    }
    try {
      const id = selectedLink.id;
      setOptionsModalVisible(false);
      setEditModalVisible(false);
      setSelectedLink(null);
      await deleteUserLink(user.uid, id);
      // List updates in realtime via Firestore onSnapshot
    } catch (e) {
      Alert.alert("Error", e?.message || "Failed to delete link.");
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
    <LinkRow
      item={item}
      onPress={() => handleItemPress(item)}
      onLongPress={() => handleOptions(item)}
    />
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

        {/* Date Filter Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingBottom: 6 }}
        >
          {DATE_FILTERS.map((filter) => (
            <TouchableOpacity
              key={filter}
              onPress={() => setActiveDateFilter(filter)}
              className={`px-4 py-2 rounded-full border ${
                activeDateFilter === filter
                  ? "bg-purple-600 border-purple-600"
                  : "bg-white border-gray-200"
              }`}
            >
              <Text
                className={`font-semibold text-xs ${
                  activeDateFilter === filter ? "text-white" : "text-gray-500"
                }`}
              >
                {filter}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        {/* Category Pills */}
        {categories.length > 1 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8, paddingBottom: 8 }}
          >
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat}
                onPress={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-full border ${
                  activeCategory === cat
                    ? "bg-purple-600 border-purple-600"
                    : "bg-white border-gray-200"
                }`}
              >
                <Text
                  className={`font-semibold text-xs ${
                    activeCategory === cat ? "text-white" : "text-gray-500"
                  }`}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>

      {/* List or Empty State */}
      {!user ? (
        <View className="flex-1 items-center justify-center opacity-60 pb-20">
          <View className="w-24 h-24 bg-white rounded-full items-center justify-center mb-6 shadow-sm">
            <Text className="text-5xl">🔐</Text>
          </View>
          <Text className="text-xl font-bold text-purple-900">
            Log in to see your saved links
          </Text>
          <Text className="text-gray-500 text-center px-10 mt-2 leading-6">
            Your links are saved to your account and sync across devices.
          </Text>
          <TouchableOpacity
            className="mt-6 px-6 py-3 bg-purple-600 rounded-full"
            onPress={() => navigation.navigate("Login")}
          >
            <Text className="text-white font-bold">Log In</Text>
          </TouchableOpacity>
        </View>
      ) : displayedLinks.length === 0 ? (
        <View className="flex-1 items-center justify-center opacity-60 pb-20">
          <View className="w-24 h-24 bg-white rounded-full items-center justify-center mb-6 shadow-sm">
            <Text className="text-5xl">
              {activeDateFilter === "All" && activeCategory === "All"
                ? "📂"
                : "📅"}
            </Text>
          </View>
          <Text className="text-xl font-bold text-purple-900">
            {activeDateFilter === "All" && activeCategory === "All"
              ? "No links yet"
              : `No links for this filter`}
          </Text>
          {activeDateFilter === "All" && activeCategory === "All" && (
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

      {/* Add Button - only when logged in */}
      {user && (
        <TouchableOpacity
          className="absolute bottom-8 right-8 w-16 h-16 bg-gray-900 rounded-full items-center justify-center shadow-2xl active:scale-90 transition-transform"
          activeOpacity={0.8}
          onPress={() => setAddModalVisible(true)}
        >
          <Text className="text-white text-3xl font-light mb-1">+</Text>
        </TouchableOpacity>
      )}

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

            <View className="mb-4">
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

            <View className="mb-4">
              <Text className="text-gray-500 font-bold text-xs uppercase mb-2 ml-1">
                Note (optional)
              </Text>
              <TextInput
                className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-4 text-gray-900 text-base"
                placeholder="e.g. Login: my@email.com"
                placeholderTextColor="#9CA3AF"
                value={newNote}
                onChangeText={setNewNote}
                multiline
                numberOfLines={2}
              />
            </View>

            <View className="mb-8">
              <Text className="text-gray-500 font-bold text-xs uppercase mb-2 ml-1">
                Category (optional)
              </Text>
              <TextInput
                className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-4 text-gray-900 text-base"
                placeholder="e.g. Work, Personal, Learning"
                placeholderTextColor="#9CA3AF"
                value={newCategory}
                onChangeText={setNewCategory}
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
              onPress={openEditModal}
            >
              <View className="w-8 h-8 bg-amber-50 rounded-full items-center justify-center mr-3">
                <Text className="text-amber-600">✏️</Text>
              </View>
              <Text className="text-gray-800 font-semibold text-base">
                Edit note & category
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

      {/* --- MODAL: Edit note & category --- */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={editModalVisible}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1 justify-end"
        >
          <TouchableOpacity
            className="absolute inset-0 bg-black/50"
            activeOpacity={1}
            onPress={() => setEditModalVisible(false)}
          />
          <View className="bg-white rounded-t-[30px] p-8 shadow-2xl">
            <View className="w-12 h-1 bg-gray-300 rounded-full self-center mb-6" />
            <Text className="text-xl font-bold text-gray-900 mb-6">
              Edit note & category
            </Text>

            <View className="mb-4">
              <Text className="text-gray-500 font-bold text-xs uppercase mb-2 ml-1">
                Note
              </Text>
              <TextInput
                className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-4 text-gray-900 text-base"
                placeholder="Add a note..."
                placeholderTextColor="#9CA3AF"
                value={editNote}
                onChangeText={setEditNote}
                multiline
              />
            </View>

            <View className="mb-8">
              <Text className="text-gray-500 font-bold text-xs uppercase mb-2 ml-1">
                Category
              </Text>
              <TextInput
                className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-4 text-gray-900 text-base"
                placeholder="e.g. Work, Personal"
                placeholderTextColor="#9CA3AF"
                value={editCategory}
                onChangeText={setEditCategory}
              />
            </View>

            <View className="flex-row gap-4">
              <TouchableOpacity
                className="flex-1 py-4 rounded-full items-center bg-gray-100"
                onPress={() => setEditModalVisible(false)}
              >
                <Text className="text-gray-900 font-bold">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 py-4 rounded-full items-center bg-purple-600"
                onPress={handleSaveEdit}
              >
                <Text className="text-white font-bold">Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
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
