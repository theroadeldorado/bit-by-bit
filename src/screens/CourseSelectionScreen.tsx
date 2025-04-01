import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteParams, TeeColor, Course, Round } from '../types';
import { loadData, saveData, STORAGE_KEYS } from '../services/storage';

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

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Select a Course</Text>

      <FlatList
        data={courses}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={[styles.courseItem, selectedCourse?.id === item.id && styles.selectedItem]} onPress={() => handleSelectCourse(item)}>
            <Text style={styles.courseName}>{item.name}</Text>
          </TouchableOpacity>
        )}
        style={styles.list}
      />

      {selectedCourse && (
        <>
          <Text style={styles.header}>Select Tee Color</Text>
          <View style={styles.teeContainer}>
            {selectedCourse.teeColors.map((tee) => (
              <TouchableOpacity key={tee} style={[styles.teeButton, { backgroundColor: tee.toLowerCase() }, selectedTee === tee && styles.selectedTee]} onPress={() => handleSelectTee(tee)}>
                <Text style={styles.teeText}>{tee}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}

      <TouchableOpacity style={[styles.startButton, (!selectedCourse || !selectedTee) && styles.disabledButton]} onPress={handleStartRound} disabled={!selectedCourse || !selectedTee}>
        <Text style={styles.startButtonText}>Start Round</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  header: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  list: {
    maxHeight: 200,
  },
  courseItem: {
    backgroundColor: 'white',
    borderRadius: 5,
    padding: 15,
    marginBottom: 10,
  },
  selectedItem: {
    backgroundColor: '#e0f7fa',
    borderWidth: 2,
    borderColor: '#4dd0e1',
  },
  courseName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  teeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 20,
  },
  teeButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  selectedTee: {
    borderWidth: 3,
    borderColor: '#000',
  },
  teeText: {
    color: 'white',
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  startButton: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 20,
  },
  disabledButton: {
    backgroundColor: '#cccccc',
  },
  startButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default CourseSelectionScreen;
