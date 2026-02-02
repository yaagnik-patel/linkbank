import React, { useState, useEffect, useRef } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, Alert, 
  KeyboardAvoidingView, Platform, Animated, ActivityIndicator 
} from 'react-native';
import { useAuth } from './AuthContext'; // Import hook

export default function Login({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth(); // Get login function
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: -10, duration: 2500, useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0, duration: 2500, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Missing Fields', 'Please enter both email and password.');
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      // No need to navigate manually if your AppNavigator watches 'user' state.
      // If you manual navigate, use: navigation.replace('Link');
    } catch (error) {
      let msg = error.message;
      if (error.code === 'auth/invalid-email') msg = "That email address is invalid.";
      if (error.code === 'auth/user-not-found') msg = "No account found with this email.";
      if (error.code === 'auth/wrong-password') msg = "Incorrect password.";
      if (error.code === 'auth/invalid-credential') msg = "Invalid email or password.";
      Alert.alert('Login Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-white"
    >
      <View className="flex-1" style={{ backgroundColor: '#F3E8FF' }}>
        
        {/* Header Illustration */}
        <View className="h-1/3 w-full items-center justify-center relative overflow-hidden">
          <View className="absolute top-[-50%] right-[-20%] w-64 h-64 bg-purple-200 rounded-full opacity-40" />
          <View className="absolute bottom-[-20%] left-[-20%] w-48 h-48 bg-pink-200 rounded-full opacity-40" />
          
          <Animated.View 
            className="items-center justify-center"
            style={{ transform: [{ translateY: floatAnim }] }}
          >
            <Text style={{ fontSize: 80 }}>🔐</Text>
          </Animated.View>

          <Text className="text-2xl font-bold text-gray-900 mt-4">Welcome Back</Text>
        </View>

        {/* Login Form */}
        <View className="flex-1 bg-white rounded-t-[40px] px-8 pt-10 shadow-2xl">
          <Text className="text-gray-500 font-semibold mb-8">Enter your details to access your vault.</Text>

          <View className="mb-4">
            <Text className="text-xs font-bold text-gray-400 uppercase mb-2 ml-1">Email</Text>
            <TextInput 
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-4 text-gray-900"
              placeholder="user@example.com"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <View className="mb-8">
            <Text className="text-xs font-bold text-gray-400 uppercase mb-2 ml-1">Password</Text>
            <TextInput 
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-4 text-gray-900"
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <TouchableOpacity 
            className="w-full bg-purple-600 py-4 rounded-xl shadow-lg shadow-purple-200 items-center mb-6"
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-bold text-lg">Log In</Text>
            )}
          </TouchableOpacity>

          <View className="flex-row justify-center pb-6">
            <Text className="text-gray-400">Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
              <Text className="text-purple-600 font-bold">Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>

      </View>
    </KeyboardAvoidingView>
  );
}