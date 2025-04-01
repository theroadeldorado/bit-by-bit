import React, { useEffect, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteParams, Course } from '../types';
import { loadData, STORAGE_KEYS } from '../services/storage';
import { colors, spacing } from '../theme/globalStyles';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Header } from '../components/Header';
import { Title, Subheading, Body, PixelText } from '../components/Typography';
import { Divider } from '../components/Divider';

type StartRoundNavigationProp = StackNavigationProp<RouteParams, 'StartRoundScreen'>;

const StartRoundScreen = () => {
  const navigation = useNavigation<StartRoundNavigationProp>();
  const [hasCourses, setHasCourses] = useState(false);

  useEffect(() => {
    // Check if there are any saved courses
    const checkCourses = async () => {
      try {
        const courses = await loadData<Course[]>(STORAGE_KEYS.COURSES);
        setHasCourses(!!courses && courses.length > 0);
      } catch (error) {
        console.error('Error checking courses:', error);
      }
    };

    checkCourses();
  }, []);

  const handleSelectCourse = () => {
    navigation.navigate('CourseSelectionScreen');
  };

  const handleAddCourse = () => {
    navigation.navigate('AddCourseScreen');
  };

  return (
    <View style={styles.container}>
      <Header title="Start Round" />

      <ScrollView contentContainerStyle={styles.content}>
        <PixelText style={styles.title}>Ready to track your game?</PixelText>

        <Card variant="elevated" style={styles.card}>
          <Subheading>Select an Option</Subheading>
          <Divider color={colors.gold} />

          {hasCourses && <Button title="Select Existing Course" onPress={handleSelectCourse} variant="primary" fullWidth style={styles.button} />}

          <Button title="Add New Course" onPress={handleAddCourse} variant={hasCourses ? 'outline' : 'primary'} fullWidth style={styles.button} />
        </Card>

        <View style={styles.infoSection}>
          <Body>Track shot-by-shot data to see your strokes gained analysis. Compare your performance to previous rounds and identify areas for improvement.</Body>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  content: {
    padding: spacing.md,
    alignItems: 'center',
  },
  title: {
    marginVertical: spacing.xl,
    textAlign: 'center',
  },
  card: {
    marginBottom: spacing.xl,
  },
  button: {
    marginVertical: spacing.sm,
  },
  infoSection: {
    marginTop: spacing.lg,
    padding: spacing.md,
    borderWidth: 2,
    borderColor: colors.black,
    borderStyle: 'dashed',
    backgroundColor: colors.gray[100],
    borderRadius: 8,
  },
});

export default StartRoundScreen;
