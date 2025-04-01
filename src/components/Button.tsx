import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle, ActivityIndicator } from 'react-native';
import { colors, fontFamily, fontSize, spacing } from '../theme/globalStyles';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

type ButtonStyleKey = 'button' | 'buttonSmall' | 'buttonMedium' | 'buttonLarge' | 'buttonPrimary' | 'buttonSecondary' | 'buttonOutline' | 'buttonDisabled';

type TextStyleKey = 'text' | 'textSmall' | 'textMedium' | 'textLarge' | 'textPrimary' | 'textSecondary' | 'textOutline' | 'textDisabled';

export const Button = ({ title, onPress, variant = 'primary', size = 'medium', disabled = false, loading = false, fullWidth = false, style, textStyle }: ButtonProps) => {
  const getButtonStyle = () => {
    const sizeKey = `button${size.charAt(0).toUpperCase() + size.slice(1)}` as ButtonStyleKey;
    let buttonStyle: ViewStyle = {
      ...styles.button,
      ...styles[sizeKey],
    };

    if (variant === 'primary') {
      buttonStyle = { ...buttonStyle, ...styles.buttonPrimary };
    } else if (variant === 'secondary') {
      buttonStyle = { ...buttonStyle, ...styles.buttonSecondary };
    } else if (variant === 'outline') {
      buttonStyle = { ...buttonStyle, ...styles.buttonOutline };
    }

    if (disabled) {
      buttonStyle = { ...buttonStyle, ...styles.buttonDisabled };
    }

    if (fullWidth) {
      buttonStyle = { ...buttonStyle, width: '100%' };
    }

    return buttonStyle;
  };

  const getTextStyle = () => {
    const sizeKey = `text${size.charAt(0).toUpperCase() + size.slice(1)}` as TextStyleKey;
    let textStyleVar: TextStyle = {
      ...styles.text,
      ...styles[sizeKey],
    };

    if (variant === 'primary') {
      textStyleVar = { ...textStyleVar, ...styles.textPrimary };
    } else if (variant === 'secondary') {
      textStyleVar = { ...textStyleVar, ...styles.textSecondary };
    } else if (variant === 'outline') {
      textStyleVar = { ...textStyleVar, ...styles.textOutline };
    }

    if (disabled) {
      textStyleVar = { ...textStyleVar, ...styles.textDisabled };
    }

    return textStyleVar;
  };

  return (
    <TouchableOpacity style={[getButtonStyle(), style]} onPress={onPress} disabled={disabled || loading} activeOpacity={0.8}>
      {loading ? <ActivityIndicator color={variant === 'outline' ? colors.green : colors.cream} size="small" /> : <Text style={[getTextStyle(), textStyle]}>{title}</Text>}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
  },
  buttonSmall: {
    height: 36,
    paddingHorizontal: spacing.md,
  },
  buttonMedium: {
    height: 48,
    paddingHorizontal: spacing.lg,
  },
  buttonLarge: {
    height: 56,
    paddingHorizontal: spacing.xl,
  },
  buttonPrimary: {
    backgroundColor: colors.green,
    borderWidth: 2,
    borderColor: colors.black,
  },
  buttonSecondary: {
    backgroundColor: colors.black,
    borderWidth: 2,
    borderColor: colors.green,
  },
  buttonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.green,
  },
  buttonDisabled: {
    backgroundColor: colors.gray[300],
    borderColor: colors.gray[400],
    opacity: 0.7,
  },
  text: {
    fontFamily: fontFamily.body,
    textAlign: 'center',
  },
  textSmall: {
    fontSize: fontSize.sm,
  },
  textMedium: {
    fontSize: fontSize.md,
  },
  textLarge: {
    fontSize: fontSize.lg,
  },
  textPrimary: {
    color: colors.black,
    fontFamily: fontFamily.bodyBold,
  },
  textSecondary: {
    color: colors.green,
    fontFamily: fontFamily.bodyBold,
  },
  textOutline: {
    color: colors.green,
    fontFamily: fontFamily.bodyBold,
  },
  textDisabled: {
    color: colors.gray[600],
  },
});
