import React, { ReactNode } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors, borderRadius, shadows } from '../theme/globalStyles';

interface CardProps {
  children: ReactNode;
  variant?: 'filled' | 'outline' | 'elevated';
  style?: ViewStyle;
  padding?: boolean;
}

export const Card = ({ children, variant = 'filled', style, padding = true }: CardProps) => {
  const getCardStyle = () => {
    let cardStyle: ViewStyle = { ...styles.card };

    if (variant === 'filled') {
      cardStyle = { ...cardStyle, ...styles.cardFilled };
    } else if (variant === 'outline') {
      cardStyle = { ...cardStyle, ...styles.cardOutline };
    } else if (variant === 'elevated') {
      cardStyle = { ...cardStyle, ...styles.cardElevated };
    }

    if (padding) {
      cardStyle = { ...cardStyle, padding: 16 };
    }

    return cardStyle;
  };

  return <View style={[getCardStyle(), style]}>{children}</View>;
};

const styles = StyleSheet.create({
  cardBase: {
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  card: {
    backgroundColor: colors.cream,
  },
  cardFilled: {
    backgroundColor: colors.cream,
    borderWidth: 2,
    borderColor: colors.black,
  },
  cardOutline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.green,
  },
  cardElevated: {
    backgroundColor: colors.cream,
    borderWidth: 2,
    borderColor: colors.black,
    ...shadows.md,
  },
  cardRound: {
    backgroundColor: colors.cream,
    borderRadius: 24,
  },
});
