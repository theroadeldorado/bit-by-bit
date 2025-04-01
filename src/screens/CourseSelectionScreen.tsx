import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, FlatList, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteParams, TeeColor, Course, Round } from '../types';
import { loadData, saveData, STORAGE_KEYS } from '../services/storage';
import { colors, spacing } from '../theme/globalStyles';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Header } from '../components/Header';
import { Title, Subheading, Body, PixelText, Caption } from '../components/Typography';
import { Divider } from '../components/Divider';

type CourseSelectionNavigationProp = StackNavigationProp<RouteParams, 'CourseSelectionScreen'>;

const CourseSelectionScreen = () => {
  const navigation = useNavigation<CourseSelectionNavigationProp>();
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedTee, setSelectedTee] = useState<TeeColor | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);

  useEffect(() => {
    const loadCourses = async () => {
      try {
        const savedCourses = await loadData<Course[]>(STORAGE_KEYS.COURSES);
        if (savedCourses && savedCourses.length > 0) {
          setCourses(savedCourses);
          // If there is at least one course, select it by default
          setSelectedCourse(savedCourses[0]);
        }
      } catch (error) {
        console.error('Error loading courses data', error);
      }
    };

    loadCourses();
  }, []);

  const handleSelectCourse = (course: Course) => {
    setSelectedCourse(course);
    setSelectedTee(null);
  };

  const handleSelectTee = (tee: TeeColor) => {
    setSelectedTee(tee);
  };

  const handleStartRound = async () => {
    if (!selectedCourse || !selectedTee) return;

    try {
      // Create a new round
      const newRound: Round = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        courseId: selectedCourse.id,
        teeColor: selectedTee,
        shots: [],
        totalStrokes: 0,
        completed: false,
      };

      // Save the round to AsyncStorage
      const existingRounds = (await loadData<Round[]>(STORAGE_KEYS.ROUNDS)) || [];
      await saveData(STORAGE_KEYS.ROUNDS, [...existingRounds, newRound]);

      // Navigate to the first hole
      navigation.navigate('HoleScreen', {
        holeNumber: 1,
        courseId: selectedCourse.id,
        teeColor: selectedTee,
        roundId: newRound.id,
      });
    } catch (error) {
      console.error('Error creating new round', error);
    }
  };

  const getTeeButtonStyle = (tee: TeeColor) => {
    let teeStyle = {
      ...styles.teeButton,
      backgroundColor: tee.toLowerCase(),
    };

    if (selectedTee === tee) {
      teeStyle = {
        ...teeStyle,
        ...styles.selectedTee,
      };
    }

    return teeStyle;
  };

  return (
    <View style={styles.container}>
      <Header title="Select Course" />

      <ScrollView contentContainerStyle={styles.content}>
        <Card variant="elevated" style={styles.courseCard}>
          <Subheading>Course</Subheading>
          <Divider color={colors.gold} />

          <FlatList
            data={courses}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity style={[styles.courseItem, selectedCourse?.id === item.id && styles.selectedCourseItem]} onPress={() => handleSelectCourse(item)}>
                <Body style={styles.courseName}>{item.name}</Body>
              </TouchableOpacity>
            )}
            style={styles.list}
            scrollEnabled={false}
            nestedScrollEnabled={false}
          />
        </Card>

        {selectedCourse && (
          <Card variant="elevated" style={styles.teeCard}>
            <Subheading>Tee Color</Subheading>
            <Divider color={colors.gold} />

            <View style={styles.teeContainer}>
              {selectedCourse.teeColors.map((tee) => (
                <TouchableOpacity key={tee} style={getTeeButtonStyle(tee)} onPress={() => handleSelectTee(tee)}>
                  <Caption style={styles.teeText}>{tee}</Caption>
                </TouchableOpacity>
              ))}
            </View>
          </Card>
        )}

        <Button title="Start Round" onPress={handleStartRound} disabled={!selectedCourse || !selectedTee} variant="primary" fullWidth style={styles.startButton} />
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
  },
  courseCard: {
    marginBottom: spacing.lg,
  },
  teeCard: {
    marginBottom: spacing.lg,
  },
  list: {
    maxHeight: 200,
  },
  courseItem: {
    borderRadius: 8,
    padding: spacing.md,
    marginVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.gray[300],
  },
  selectedCourseItem: {
    borderWidth: 2,
    borderColor: colors.green,
    backgroundColor: colors.gray[100],
  },
  courseName: {
    fontWeight: 'bold',
  },
  teeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginVertical: spacing.md,
  },
  teeButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    margin: spacing.sm,
    borderWidth: 2,
    borderColor: colors.black,
  },
  selectedTee: {
    borderWidth: 3,
    borderColor: colors.green,
  },
  teeText: {
    color: colors.cream,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  startButton: {
    marginVertical: spacing.lg,
  },
});

export default CourseSelectionScreen;
