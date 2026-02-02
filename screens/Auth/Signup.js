import React, { useState, useEffect, useRef } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, Alert, 
  KeyboardAvoidingView, Platform, Animated, ActivityIndicator 
} from 'react-native';
import { useAuth } from './AuthContext'; // Import hook

export default function Signup({ navigation }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useAuth(); // Get register function
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: -10, duration: 2500, useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0, duration: 2500, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const handleSignup = async () => {
    if (!name || !email || !password) {
      Alert.alert("Missing Fields", "Please fill in all fields to continue.");
      return;
    }

    setLoading(true);
    try {
      await register(email, password, name);
      // Success!
      Alert.alert(
        "Account Created! 🚀", 
        `Welcome to LinkIt, ${name}!`,
        [{ text: "OK", onPress: () => navigation.replace('Link') }]
      );
    } catch (error) {
      let msg = error.message;
      if (error.code === 'auth/email-already-in-use') msg = "That email is already in use!";
      if (error.code === 'auth/invalid-email') msg = "That email address is invalid!";
      if (error.code === 'auth/weak-password') msg = "Password should be at least 6 characters.";
      Alert.alert('Signup Failed', msg);
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
        
        {/* Header */}
        <View className="h-[25%] w-full items-center justify-center relative">
          <Animated.View 
            className="items-center justify-center relative"
            style={{ transform: [{ translateY: floatAnim }] }}
          >
            <Text style={{ fontSize: 80 }}>🚀</Text>
          </Animated.View>
          <Text className="text-2xl font-bold text-gray-900 mt-4">Create Account</Text>
        </View>

        {/* Signup Form */}
        <View className="flex-1 bg-white rounded-t-[40px] px-8 pt-10 shadow-2xl">
          
          <View className="mb-4">
            <Text className="text-xs font-bold text-gray-400 uppercase mb-2 ml-1">Full Name</Text>
            <TextInput 
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-4 text-gray-900"
              placeholder="John Doe"
              value={name}
              onChangeText={setName}
            />
          </View>

          <View className="mb-4">
            <Text className="text-xs font-bold text-gray-400 uppercase mb-2 ml-1">Email</Text>
            <TextInput 
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-4 text-gray-900"
              placeholder="john@linkit.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View className="mb-8">
            <Text className="text-xs font-bold text-gray-400 uppercase mb-2 ml-1">Password</Text>
            <TextInput 
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-4 text-gray-900"
              placeholder="Create a strong password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <TouchableOpacity 
            className="w-full bg-gray-900 py-4 rounded-xl shadow-lg items-center mb-6"
            onPress={handleSignup}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-bold text-lg">Create Account</Text>
            )}
          </TouchableOpacity>

          <View className="flex-row justify-center pb-8">
            <Text className="text-gray-400">Already a member? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text className="text-purple-600 font-bold">Log In</Text>
            </TouchableOpacity>
          </View>
        </View>

      </View>
    </KeyboardAvoidingView>
  );
}