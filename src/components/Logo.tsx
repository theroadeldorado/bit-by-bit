import React from 'react';
import { View, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { colors } from '../theme/globalStyles';
import { PixelText, Caption } from './Typography';

interface LogoProps {
  size?: 'small' | 'medium' | 'large';
  showTagline?: boolean;
  style?: ViewStyle;
}

export const Logo = ({ size = 'medium', showTagline = true, style }: LogoProps) => {
  const getFontSize = (): TextStyle => {
    switch (size) {
      case 'small':
        return { fontSize: 18, lineHeight: 30 };
      case 'large':
        return { fontSize: 32, lineHeight: 50 };
      case 'medium':
      default:
        return { fontSize: 24, lineHeight: 40 };
    }
  };

  return (
    <View style={[styles.container, style]}>
      <View style={styles.logo}>
        <PixelText style={{ ...styles.text, ...getFontSize() }}>BIT</PixelText>
        <PixelText style={{ ...styles.text, ...getFontSize() }}>BY</PixelText>
        <PixelText style={{ ...styles.text, ...getFontSize() }}>BIT</PixelText>
      </View>

      {showTagline && <Caption style={styles.tagline}>Track shots. Gain strokes. Improve.</Caption>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  logo: {
    backgroundColor: colors.black,
    padding: 8,
    borderWidth: 2,
    borderColor: colors.black,
  },
  text: {
    color: colors.green,
    textAlign: 'center',
  },
  tagline: {
    textAlign: 'center',
    marginTop: 8,
  },
});
