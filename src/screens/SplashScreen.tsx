import React, { useEffect } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteParams } from '../types';
import { colors, spacing } from '../theme/globalStyles';
import { Logo } from '../components/Logo';
import { Caption } from '../components/Typography';

type SplashScreenNavigationProp = StackNavigationProp<RouteParams, 'SplashScreen'>;

const SplashScreen = () => {
  const navigation = useNavigation<SplashScreenNavigationProp>();
  const fadeAnim = new Animated.Value(0);
  const scaleAnim = new Animated.Value(0.9);

  useEffect(() => {
    // Animation sequence
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
        easing: Easing.out(Easing.quad),
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
        easing: Easing.out(Easing.quad),
      }),
    ]).start();

    // Navigate to home screen after delay
    const timer = setTimeout(() => {
      navigation.reset({
        index: 0,
        routes: [{ name: 'HomeScreen' }],
      });
    }, 2500);

    return () => clearTimeout(timer);
  }, [navigation, fadeAnim, scaleAnim]);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <Logo size="large" showTagline={false} />

        <View style={styles.taglineContainer}>
          <Caption style={styles.tagline}>Track shots. Gain strokes. Improve.</Caption>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.cream,
  },
  content: {
    alignItems: 'center',
  },
  taglineContainer: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  tagline: {
    textAlign: 'center',
  },
});

export default SplashScreen;
