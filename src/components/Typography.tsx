import React, { ReactNode } from 'react';
import { Text, StyleSheet, TextStyle } from 'react-native';
import { colors, fontFamily, fontSize, lineHeight } from '../theme/globalStyles';

interface TypographyProps {
  children: ReactNode;
  style?: TextStyle;
  color?: string;
  textAlign?: 'auto' | 'left' | 'right' | 'center' | 'justify';
}

export const Title = ({ children, style, color = colors.black, textAlign = 'left' }: TypographyProps) => {
  return <Text style={[styles.title, { color, textAlign }, style]}>{children}</Text>;
};

export const Heading = ({ children, style, color = colors.black, textAlign = 'left' }: TypographyProps) => {
  return <Text style={[styles.heading, { color, textAlign }, style]}>{children}</Text>;
};

export const Subheading = ({ children, style, color = colors.black, textAlign = 'left' }: TypographyProps) => {
  return <Text style={[styles.subheading, { color, textAlign }, style]}>{children}</Text>;
};

export const Body = ({ children, style, color = colors.black, textAlign = 'left' }: TypographyProps) => {
  return <Text style={[styles.body, { color, textAlign }, style]}>{children}</Text>;
};

export const Caption = ({ children, style, color = colors.gray[600], textAlign = 'left' }: TypographyProps) => {
  return <Text style={[styles.caption, { color, textAlign }, style]}>{children}</Text>;
};

export const PixelText = ({ children, style, color = colors.black, textAlign = 'left' }: TypographyProps) => {
  return <Text style={[styles.pixel, { color, textAlign }, style]}>{children}</Text>;
};

const styles = StyleSheet.create({
  title: {
    fontFamily: fontFamily.pixel,
    fontSize: fontSize.xxxl,
    lineHeight: lineHeight.xxxl * 1.5, // Increase line height for pixel font
    marginBottom: 8,
  },
  heading: {
    fontFamily: fontFamily.pixel,
    fontSize: fontSize.xxl,
    lineHeight: lineHeight.xxl * 1.5,
    marginBottom: 8,
  },
  subheading: {
    fontFamily: fontFamily.bodyBold,
    fontSize: fontSize.xl,
    lineHeight: lineHeight.xl,
    marginBottom: 4,
  },
  body: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.md,
    lineHeight: lineHeight.md,
  },
  caption: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.sm,
    lineHeight: lineHeight.sm,
  },
  pixel: {
    fontFamily: fontFamily.pixel,
    fontSize: fontSize.md,
    lineHeight: lineHeight.md * 1.5,
  },
});
