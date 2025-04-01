import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

// Import screens
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
        initialRouteName="HomeScreen"
        screenOptions={{
          headerTitleAlign: 'center',
        }}
      >
        <Stack.Screen name="HomeScreen" component={HomeScreen} options={{ title: 'Bit by Bit' }} />
        <Stack.Screen name="StartRoundScreen" component={StartRoundScreen} options={{ title: 'Start Round' }} />
        <Stack.Screen name="CourseSelectionScreen" component={CourseSelectionScreen} options={{ title: 'Select Course' }} />
        <Stack.Screen name="AddCourseScreen" component={AddCourseScreen} options={{ title: 'Add New Course' }} />
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
