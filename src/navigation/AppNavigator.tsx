import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { View } from 'react-native';
import { colors } from '../theme/globalStyles';

// Import screens
import SplashScreen from '../screens/SplashScreen';
import HomeScreen from '../screens/HomeScreen';
import StartRoundScreen from '../screens/StartRoundScreen';
import CourseSelectionScreen from '../screens/CourseSelectionScreen';
import AddCourseScreen from '../screens/AddCourseScreen';
import HoleScreen from '../screens/HoleScreen';
import RoundSummaryScreen from '../screens/RoundSummaryScreen';

// Import types
import { RouteParams } from '../types';

// Create the stack navigator
const Stack = createStackNavigator<RouteParams>();

const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="SplashScreen"
        screenOptions={{
          headerShown: false,
          headerTitleAlign: 'center',
          headerStyle: {
            backgroundColor: colors.cream,
            borderBottomWidth: 2,
            borderBottomColor: colors.black,
            elevation: 0,
            shadowOpacity: 0,
          },
          headerTitleStyle: {
            fontFamily: 'PressStart2P',
            fontSize: 16,
            color: colors.black,
          },
          cardStyle: {
            backgroundColor: colors.cream,
          },
          // For a custom slide animation that feels retro
          cardStyleInterpolator: ({ current, layouts }) => {
            return {
              cardStyle: {
                transform: [
                  {
                    translateX: current.progress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [layouts.screen.width, 0],
                    }),
                  },
                ],
              },
            };
          },
        }}
      >
        <Stack.Screen
          name="SplashScreen"
          component={SplashScreen}
          options={{
            headerShown: false,
          }}
        />

        <Stack.Screen
          name="HomeScreen"
          component={HomeScreen}
          options={{
            headerShown: false,
          }}
        />

        <Stack.Screen
          name="StartRoundScreen"
          component={StartRoundScreen}
          options={{
            title: 'Start Round',
          }}
        />

        <Stack.Screen
          name="CourseSelectionScreen"
          component={CourseSelectionScreen}
          options={{
            title: 'Select Course',
          }}
        />

        <Stack.Screen
          name="AddCourseScreen"
          component={AddCourseScreen}
          options={{
            title: 'Add New Course',
          }}
        />

        <Stack.Screen
          name="HoleScreen"
          component={HoleScreen}
          options={({ route }) => ({
            title: `Hole ${route.params.holeNumber}`,
          })}
        />

        <Stack.Screen
          name="RoundSummaryScreen"
          component={RoundSummaryScreen}
          options={{
            title: 'Round Summary',
            headerLeft: () => null, // Prevent going back from summary screen
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
