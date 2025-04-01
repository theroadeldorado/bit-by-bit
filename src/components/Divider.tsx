import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '../theme/globalStyles';

interface DividerProps {
  style?: ViewStyle;
  color?: string;
  vertical?: boolean;
  thickness?: number;
  length?: number | string;
  marginVertical?: number;
  marginHorizontal?: number;
}

export const Divider = ({ style, color = colors.gray[300], vertical = false, thickness = 1, length, marginVertical = 8, marginHorizontal = 0 }: DividerProps) => {
  const dividerStyle = vertical
    ? ({
        width: thickness,
        height: length || '100%',
        backgroundColor: color,
        marginHorizontal,
      } as ViewStyle)
    : ({
        height: thickness,
        width: length || '100%',
        backgroundColor: color,
        marginVertical,
      } as ViewStyle);

  return <View style={[dividerStyle, style]} />;
};

const styles = StyleSheet.create({
  // Additional styles can be added as needed
});
