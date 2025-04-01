import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteParams, Course } from '../types';
import { loadData, STORAGE_KEYS } from '../services/storage';

type StartRoundNavigationProp = StackNavigationProp<RouteParams, 'StartRoundScreen'>;

const StartRoundScreen = () => {
  const navigation = useNavigation<StartRoundNavigationProp>();
  const [courses, setCourses] = useState<Course[]>([]);

  useEffect(() => {
    const loadCourses = async () => {
      try {
        const savedCourses = await loadData<Course[]>(STORAGE_KEYS.COURSES);
        if (savedCourses) {
          setCourses(savedCourses);
        }
      } catch (error) {
        console.error('Error loading courses data', error);
      }
    };

    loadCourses();
  }, []);

  const handleAddCourse = () => {
    navigation.navigate('AddCourseScreen');
  };

  const handleSelectCourse = (course: Course) => {
    navigation.navigate('CourseSelectionScreen');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Select a Course</Text>

      {courses.length === 0 ? (
        <View style={styles.noCourses}>
          <Text style={styles.noCoursesText}>No courses saved yet</Text>
        </View>
      ) : (
        <FlatList
          data={courses}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.courseItem} onPress={() => handleSelectCourse(item)}>
              <Text style={styles.courseName}>{item.name}</Text>
              <Text style={styles.courseTees}>{item.teeColors.join(', ')}</Text>
            </TouchableOpacity>
          )}
        />
      )}

      <TouchableOpacity style={styles.addButton} onPress={handleAddCourse}>
        <Text style={styles.addButtonText}>Add New Course</Text>
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
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  noCourses: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noCoursesText: {
    fontSize: 16,
    color: '#777',
  },
  courseItem: {
    backgroundColor: 'white',
    borderRadius: 5,
    padding: 15,
    marginBottom: 10,
  },
  courseName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  courseTees: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  addButton: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 10,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default StartRoundScreen;
