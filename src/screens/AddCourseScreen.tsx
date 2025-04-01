import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Switch, Alert, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteParams, TeeColor, Course, Hole } from '../types';
import { loadData, saveData, STORAGE_KEYS } from '../services/storage';

type AddCourseNavigationProp = StackNavigationProp<RouteParams, 'AddCourseScreen'>;

const teeColors: TeeColor[] = ['Red', 'White', 'Blue', 'Gold'];

const AddCourseScreen = () => {
  const navigation = useNavigation<AddCourseNavigationProp>();
  const [courseName, setCourseName] = useState('');
  const [selectedTees, setSelectedTees] = useState<Record<TeeColor, boolean>>({
    Red: false,
    White: false,
    Blue: false,
    Gold: false,
  });

  const toggleTee = (tee: TeeColor) => {
    setSelectedTees((prev) => ({
      ...prev,
      [tee]: !prev[tee],
    }));
  };

  const handleSaveCourse = async () => {
    // Basic validation
    if (!courseName.trim()) {
      Alert.alert('Error', 'Please enter a course name');
      return;
    }

    // Check if at least one tee is selected
    const selectedTeeColors = Object.keys(selectedTees).filter((tee) => selectedTees[tee as TeeColor]) as TeeColor[];

    if (selectedTeeColors.length === 0) {
      Alert.alert('Error', 'Please select at least one tee color');
      return;
    }

    try {
      // Create empty holes for each tee
      const holes: Record<TeeColor, Hole[]> = {} as Record<TeeColor, Hole[]>;

      selectedTeeColors.forEach((tee) => {
        holes[tee] = Array.from({ length: 18 }, (_, i) => ({
          number: i + 1,
          par: 4, // Default par
          distance: 0, // Will be filled in later
        }));
      });

      // Create the new course
      const newCourse: Course = {
        id: Date.now().toString(),
        name: courseName.trim(),
        teeColors: selectedTeeColors,
        holes,
      };

      // Save to AsyncStorage
      const existingCourses = (await loadData<Course[]>(STORAGE_KEYS.COURSES)) || [];
      await saveData(STORAGE_KEYS.COURSES, [...existingCourses, newCourse]);

      // Navigate back
      navigation.goBack();
    } catch (error) {
      console.error('Error saving course', error);
      Alert.alert('Error', 'Failed to save course');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Add New Course</Text>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Course Name</Text>
        <TextInput style={styles.input} value={courseName} onChangeText={setCourseName} placeholder="Enter course name" />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Available Tee Colors</Text>
        <Text style={styles.sublabel}>Select all that apply</Text>

        {teeColors.map((tee) => (
          <View key={tee} style={styles.teeRow}>
            <View style={[styles.teeColorIndicator, { backgroundColor: tee.toLowerCase() }]} />
            <Text style={styles.teeText}>{tee}</Text>
            <Switch value={selectedTees[tee]} onValueChange={() => toggleTee(tee)} trackColor={{ false: '#767577', true: '#81b0ff' }} thumbColor={selectedTees[tee] ? '#4CAF50' : '#f4f3f4'} />
          </View>
        ))}
      </View>

      <TouchableOpacity style={styles.saveButton} onPress={handleSaveCourse}>
        <Text style={styles.saveButtonText}>Save Course</Text>
      </TouchableOpacity>
    </ScrollView>
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
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  sublabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  input: {
    backgroundColor: 'white',
    borderRadius: 5,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    fontSize: 16,
  },
  teeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  teeColorIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 10,
  },
  teeText: {
    fontSize: 16,
    flex: 1,
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default AddCourseScreen;
