import React, { useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Animated, 
  Dimensions,
  StyleSheet,
  Platform
} from 'react-native';

const { width, height } = Dimensions.get('window');

export default function LinkBankHome({ navigation }) {
  // Animations
  const slideUpAnim = useRef(new Animated.Value(height * 0.3)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const bgFloat = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 1. Entrance Sequence
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
      })
    ]).start();

    // 2. Floating Loop for Hero Icon (Smooth Hover)
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: -20, duration: 2000, useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0, duration: 2000, useNativeDriver: true }),
      ])
    ).start();

    // 3. Slow Float for Background Clouds
    Animated.loop(
      Animated.sequence([
        Animated.timing(bgFloat, { toValue: -10, duration: 4000, useNativeDriver: true }),
        Animated.timing(bgFloat, { toValue: 0, duration: 4000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const handleLogin = () => navigation.navigate('Login');
  const handleStart = () => navigation.navigate('Signup');

  return (
    <View className="flex-1" style={{ backgroundColor: '#F3E8FF' }}> 
      
      {/* --- Top Illustration --- */}
      <View className="flex-1 relative overflow-hidden">
        <Animated.View style={{ transform: [{ translateY: bgFloat }] }}>
          <View className="absolute top-16 right-10 w-16 h-16 rounded-full opacity-80" style={{ backgroundColor: '#FDE047' }} />
          <View className="absolute top-24 -left-10 w-40 h-40 rounded-full opacity-40" style={{ backgroundColor: '#F472B6' }} />
          <View className="absolute top-40 -right-10 w-48 h-48 rounded-full opacity-30" style={{ backgroundColor: '#A78BFA' }} />
        </Animated.View>

        <View className="absolute bottom-0 w-full flex-row items-end justify-center opacity-30">
          <View className="w-12 h-24 bg-purple-300 mx-1 rounded-t-md" />
          <View className="w-16 h-32 bg-purple-400 mx-1 rounded-t-lg" />
          <View className="w-10 h-16 bg-purple-300 mx-1 rounded-t-md" />
          <View className="w-20 h-40 bg-purple-500 mx-1 rounded-t-xl" />
          <View className="w-14 h-28 bg-purple-400 mx-1 rounded-t-lg" />
        </View>

        <Animated.View 
          className="absolute inset-0 items-center justify-center pb-20"
          style={{ transform: [{ translateY: floatAnim }] }}
        >
          {/* Soft Glow Behind */}
          <View className="w-48 h-48 bg-white/30 backdrop-blur-sm rounded-full items-center justify-center">
            <View className="w-40 h-40 bg-white/60 rounded-full items-center justify-center shadow-lg shadow-purple-200">
              {/* Large 3D Emoji */}
              <Text style={{ fontSize: 80 }}>🔗</Text>
            </View>
          </View>
          
          {/* Floating Particles */}
          <View className="absolute top-1/3 left-1/4 w-3 h-3 bg-yellow-400 rounded-full" />
          <View className="absolute bottom-1/3 right-1/4 w-2 h-2 bg-purple-400 rounded-full" />
        </Animated.View>
      </View>

      {/* --- Bottom Card --- */}
      <Animated.View 
        className="bg-white w-full rounded-t-[40px] px-8 pt-10 pb-12 shadow-2xl absolute bottom-0"
        style={{ 
          height: height * 0.45,
          transform: [{ translateY: slideUpAnim }]
        }}
      >
        <Animated.View style={{ opacity: fadeAnim, flex: 1 }}>
          <Text className="text-3xl font-extrabold text-center text-gray-900 mb-4 leading-tight">
            Paste Your Links Here.{'\n'}
            <Text style={{ color: '#7C3AED' }}>Find Them Instantly.</Text>
          </Text>

          <Text className="text-base text-gray-500 text-center mb-8 leading-6 px-4">
            Stop scrolling through chats and notes. Save everything important in one place.
          </Text>

          <TouchableOpacity
            onPress={handleStart}
            className="w-full bg-gray-900 py-4 rounded-full shadow-lg items-center justify-center mb-4 active:scale-95 transition-transform"
            activeOpacity={0.8}
          >
            <Text className="text-white font-bold text-lg">Let's Start!</Text>
          </TouchableOpacity>

          <View className="flex-1 justify-end mt-8">
            <TouchableOpacity onPress={handleLogin} className="w-full py-3 items-center justify-center" activeOpacity={0.6}>
              <Text className="text-gray-400 font-semibold text-base">
                Already have an account? <Text style={{ color: '#7C3AED' }}>Log In</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animated.View>
    </View>
  );
}