import React from 'react';
import { View, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, shadows, spacing } from '../theme/globalStyles';
import { PixelText } from './Typography';

interface HeaderProps {
  title: string;
  showBackButton?: boolean;
  right?: React.ReactNode;
  style?: ViewStyle;
}

export const Header = ({ title, showBackButton = true, right, style }: HeaderProps) => {
  const navigation = useNavigation();

  return (
    <View style={[styles.header, style]}>
      <View style={styles.leftContainer}>
        {showBackButton && navigation.canGoBack() && (
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <PixelText>←</PixelText>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.titleContainer}>
        <PixelText style={styles.title}>{title}</PixelText>
      </View>

      <View style={styles.rightContainer}>{right}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    backgroundColor: colors.cream,
    borderBottomWidth: 2,
    borderBottomColor: colors.black,
    ...shadows.sm,
  },
  leftContainer: {
    flex: 1,
    alignItems: 'flex-start',
  },
  titleContainer: {
    flex: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightContainer: {
    flex: 1,
    alignItems: 'flex-end',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.black,
    backgroundColor: colors.green,
  },
  title: {
    color: colors.black,
    textAlign: 'center',
  },
});
