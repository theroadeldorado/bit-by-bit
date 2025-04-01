import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView, KeyboardAvoidingView, Platform, Modal } from 'react-native';
import { useRoute, RouteProp, useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteParams, LieCondition, Shot, Course, Round, Hole } from '../types';
import { loadData, saveData, STORAGE_KEYS } from '../services/storage';

type HoleScreenRouteProp = RouteProp<RouteParams, 'HoleScreen'>;
type HoleScreenNavigationProp = StackNavigationProp<RouteParams, 'HoleScreen'>;

const parOptions = [3, 4, 5];

// Baseline performance for strokes gained calculations
// Values represent expected strokes to hole out from various distances and lies
const baselinePerformance: Record<LieCondition, Record<string, number>> = {
  Tee: {
    // Distance: expected strokes to hole
    '450': 4.3,
    '400': 4.1,
    '350': 3.9,
    '300': 3.65,
    '250': 3.3,
    '200': 3.0,
    '150': 2.8,
    '100': 2.5,
    '50': 2.2,
  },
  Fairway: {
    '200': 2.9,
    '175': 2.7,
    '150': 2.5,
    '125': 2.3,
    '100': 2.1,
    '75': 1.8,
    '50': 1.5,
    '25': 1.0,
    '10': 0.5,
  },
  Rough: {
    '200': 3.2,
    '175': 3.0,
    '150': 2.8,
    '125': 2.6,
    '100': 2.4,
    '75': 2.1,
    '50': 1.8,
    '25': 1.3,
    '10': 0.8,
  },
  Sand: {
    '100': 2.6,
    '75': 2.3,
    '50': 2.0,
    '25': 1.5,
    '10': 1.0,
    '5': 0.7,
  },
  Recovery: {
    '150': 3.0,
    '100': 2.7,
    '75': 2.4,
    '50': 2.1,
    '25': 1.7,
    '10': 1.3,
  },
  Green: {
    '60': 2.0,
    '50': 1.9,
    '40': 1.8,
    '30': 1.6,
    '20': 1.4,
    '15': 1.2,
    '10': 1.0,
    '5': 0.6,
    '3': 0.3,
    '1': 0.1,
  },
};

const HoleScreen = () => {
  const route = useRoute<HoleScreenRouteProp>();
  const navigation = useNavigation<HoleScreenNavigationProp>();
  const { holeNumber, courseId, teeColor, roundId } = route.params;

  // States
  const [distance, setDistance] = useState<string>('');
  const [par, setPar] = useState<number | null>(null);
  const [shots, setShots] = useState<Shot[]>([]);
  const [holeCompleted, setHoleCompleted] = useState(false);
  const [course, setCourse] = useState<Course | null>(null);
  const [round, setRound] = useState<Round | null>(null);
  const [currentShot, setCurrentShot] = useState<Shot | null>(null);
  const [holeDataSet, setHoleDataSet] = useState(false);
  const [editingHoleData, setEditingHoleData] = useState(false);
  const [selectedShotIndex, setSelectedShotIndex] = useState<number | null>(null);
  const [editingShotIndex, setEditingShotIndex] = useState<number | null>(null);
  const [editShotLie, setEditShotLie] = useState<LieCondition>('Fairway');
  const [editDistanceToHole, setEditDistanceToHole] = useState<string>('');
  const [showEditShotModal, setShowEditShotModal] = useState(false);

  // For new shot entry
  const [shotLie, setShotLie] = useState<LieCondition>('Fairway');
  const [distanceToHole, setDistanceToHole] = useState<string>('');

  // Add holed state
  const [isHoled, setIsHoled] = useState(false);

  // Load course and hole data
  const loadCourseAndRound = useCallback(async () => {
    try {
      // Load course data
      const courses = (await loadData<Course[]>(STORAGE_KEYS.COURSES)) || [];
      const foundCourse = courses.find((c) => c.id === courseId);

      if (foundCourse) {
        setCourse(foundCourse);

        // Check if hole data exists for this tee color
        const holeData = foundCourse.holes[teeColor]?.[holeNumber - 1];

        if (holeData && holeData.distance > 0) {
          // Pre-fill hole data
          setDistance(holeData.distance.toString());
          setPar(holeData.par);
          setHoleDataSet(true);
        }
      }

      // Load round data
      const rounds = (await loadData<Round[]>(STORAGE_KEYS.ROUNDS)) || [];
      const foundRound = rounds.find((r) => r.id === roundId);

      if (foundRound) {
        setRound(foundRound);

        // Get shots for this hole
        const holeShots = foundRound.shots.filter((s) => s.holeNumber === holeNumber);

        if (holeShots.length > 0) {
          setShots(holeShots);

          // If last shot is completed, hole is completed
          const lastShot = holeShots[holeShots.length - 1];
          setHoleCompleted(lastShot.completed);
        } else {
          // No shots yet for this hole
          setShots([]);
        }
      }
    } catch (error) {
      console.error('Error loading data', error);
      Alert.alert('Error', 'Failed to load hole data');
    }
  }, [courseId, holeNumber, roundId, teeColor]);

  // Reset state when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      // Reset states for the new hole
      setDistance('');
      setPar(null);
      setShots([]);
      setHoleCompleted(false);
      setCourse(null);
      setRound(null);
      setCurrentShot(null);
      setHoleDataSet(false);
      setShotLie('Fairway');
      setDistanceToHole('');
      setEditingHoleData(false);
      setSelectedShotIndex(null);
      setEditingShotIndex(null);
      setEditShotLie('Fairway');
      setEditDistanceToHole('');
      setShowEditShotModal(false);
      setIsHoled(false);

      // Load data for the current hole
      loadCourseAndRound();

      return () => {
        // Cleanup if needed
      };
    }, [loadCourseAndRound])
  );

  // Initialize first shot when hole data is set
  useEffect(() => {
    if (holeDataSet && shots.length === 0 && distance) {
      // Create first shot automatically
      const firstShot: Shot = {
        id: Date.now().toString(),
        holeNumber,
        shotNumber: 1,
        lie: 'Tee',
        distanceToHole: parseFloat(distance),
        completed: false,
      };

      setShots([firstShot]);
      setCurrentShot(firstShot);
    }
  }, [holeDataSet, shots.length, distance, holeNumber]);

  const handleSetHoleData = () => {
    // Validate inputs
    if (!distance || isNaN(parseFloat(distance)) || parseFloat(distance) <= 0) {
      Alert.alert('Error', 'Please enter a valid distance');
      return;
    }

    if (par === null) {
      Alert.alert('Error', 'Please select par for this hole');
      return;
    }

    setHoleDataSet(true);
    setEditingHoleData(false);

    // Save hole data to course
    if (course) {
      updateCourseHoleData();
    }
  };

  const handleEditHoleData = () => {
    setEditingHoleData(true);
  };

  const cancelEditHoleData = () => {
    // If we were just editing and not initially setting, cancel back to previous values
    if (course) {
      const holeData = course.holes[teeColor]?.[holeNumber - 1];
      if (holeData) {
        setDistance(holeData.distance.toString());
        setPar(holeData.par);
      }
    }
    setEditingHoleData(false);
  };

  const updateCourseHoleData = async () => {
    if (!course || !par || !distance) return;

    try {
      const updatedHoles = { ...course.holes };

      // Ensure the hole array exists for this tee color
      if (!updatedHoles[teeColor]) {
        updatedHoles[teeColor] = Array(18)
          .fill(null)
          .map((_, i) => ({
            number: i + 1,
            par: 4,
            distance: 0,
          }));
      }

      // Update this specific hole
      updatedHoles[teeColor][holeNumber - 1] = {
        number: holeNumber,
        par,
        distance: parseFloat(distance),
      };

      const updatedCourse: Course = {
        ...course,
        holes: updatedHoles,
      };

      // Save updated course
      const courses = (await loadData<Course[]>(STORAGE_KEYS.COURSES)) || [];
      const updatedCourses = courses.map((c) => (c.id === courseId ? updatedCourse : c));

      await saveData(STORAGE_KEYS.COURSES, updatedCourses);
      setCourse(updatedCourse);

      // If distance changed and there are shots, update first shot's distance
      if (shots.length > 0 && parseFloat(distance) !== shots[0].distanceToHole) {
        const updatedShots = [...shots];
        updatedShots[0] = {
          ...updatedShots[0],
          distanceToHole: parseFloat(distance),
        };
        setShots(updatedShots);
        saveShots(updatedShots);
      }
    } catch (error) {
      console.error('Error updating course hole data', error);
      Alert.alert('Error', 'Failed to save hole data');
    }
  };

  // Calculate expected strokes from current position
  const calculateExpectedStrokes = (lie: LieCondition, distance: number): number => {
    if (!baselinePerformance[lie]) {
      console.warn(`No baseline data for lie: ${lie}`);
      return 0;
    }

    // Get available distances for this lie
    const distances = Object.keys(baselinePerformance[lie])
      .map(Number)
      .sort((a, b) => a - b);

    // Find closest distance points for interpolation
    if (distance <= distances[0]) {
      return baselinePerformance[lie][distances[0].toString()];
    }

    if (distance >= distances[distances.length - 1]) {
      return baselinePerformance[lie][distances[distances.length - 1].toString()];
    }

    // Find two closest points for linear interpolation
    let lowerDist = distances[0];
    let upperDist = distances[distances.length - 1];

    for (let i = 0; i < distances.length - 1; i++) {
      if (distances[i] <= distance && distance <= distances[i + 1]) {
        lowerDist = distances[i];
        upperDist = distances[i + 1];
        break;
      }
    }

    // Linear interpolation
    const lowerStrokes = baselinePerformance[lie][lowerDist.toString()];
    const upperStrokes = baselinePerformance[lie][upperDist.toString()];

    return lowerStrokes + ((distance - lowerDist) / (upperDist - lowerDist)) * (upperStrokes - lowerStrokes);
  };

  // Calculate strokes gained for a shot
  const calculateStrokesGained = (shot: Shot, nextShot: Shot | null): number => {
    // Expected strokes from current position
    const expectedFromCurrent = calculateExpectedStrokes(shot.lie, shot.distanceToHole);

    // Expected strokes from next position (or 0 if holed)
    const expectedFromNext = nextShot ? calculateExpectedStrokes(nextShot.lie, nextShot.distanceToHole) : 0;

    // Strokes gained = expected before - (expected after + 1)
    // The +1 represents the actual stroke taken
    return parseFloat((expectedFromCurrent - (expectedFromNext + 1)).toFixed(2));
  };

  // Update strokes gained for all shots
  const updateStrokesGained = (shots: Shot[]): Shot[] => {
    return shots.map((shot, index) => {
      // Only calculate strokes gained if this shot has a following shot
      // The last shot will always show "—" until there's a next shot
      if (index < shots.length - 1) {
        const nextShot = shots[index + 1];
        const strokesGained = calculateStrokesGained(shot, nextShot);

        return {
          ...shot,
          strokesGained,
        };
      } else {
        // Last shot - no strokes gained calculation yet
        return {
          ...shot,
          strokesGained: undefined, // Clear any previous value
        };
      }
    });
  };

  // Update the handleAddShot function to handle holed shots
  const handleAddShot = () => {
    if (!holeDataSet) {
      Alert.alert('Error', 'Please set hole data first');
      return;
    }

    // Validate distance to hole
    if (!distanceToHole || isNaN(parseFloat(distanceToHole)) || parseFloat(distanceToHole) < 0) {
      Alert.alert('Error', 'Please enter a valid distance to hole');
      return;
    }

    // Complete previous shot by calculating distance traveled
    const updatedShots = [...shots];
    const lastShotIndex = updatedShots.length - 1;
    const lastShot = updatedShots[lastShotIndex];

    if (lastShot && !lastShot.completed) {
      const prevDistanceToHole = lastShot.distanceToHole;
      const currentDistanceToHole = parseFloat(distanceToHole);
      const distanceTraveled = Math.max(0, prevDistanceToHole - currentDistanceToHole);

      updatedShots[lastShotIndex] = {
        ...lastShot,
        distanceTraveled,
        completed: true,
      };
    }

    // Create new shot
    const newShot: Shot = {
      id: Date.now().toString(),
      holeNumber,
      shotNumber: shots.length + 1,
      lie: shotLie,
      distanceToHole: parseFloat(distanceToHole),
      completed: isHoled, // Mark as completed if holed
      distanceTraveled: isHoled ? parseFloat(distanceToHole) : undefined, // Set distance traveled if holed
    };

    updatedShots.push(newShot);

    // Update strokes gained for all shots
    const shotsWithSG = updateStrokesGained(updatedShots);

    setShots(shotsWithSG);
    setCurrentShot(newShot);
    setHoleCompleted(isHoled); // Mark hole as completed if shot was holed

    // Reset inputs
    setDistanceToHole('');
    setIsHoled(false);

    // Save shots to round
    saveShots(shotsWithSG);
  };

  // Also update handleCompleteHole
  const handleCompleteHole = () => {
    if (!holeDataSet || shots.length === 0) {
      Alert.alert('Error', 'No shots to complete');
      return;
    }

    // Complete last shot
    const updatedShots = [...shots];
    const lastShotIndex = updatedShots.length - 1;
    const lastShot = updatedShots[lastShotIndex];

    updatedShots[lastShotIndex] = {
      ...lastShot,
      distanceTraveled: lastShot.distanceToHole,
      completed: true,
    };

    // Update strokes gained for all shots
    const shotsWithSG = updateStrokesGained(updatedShots);

    setShots(shotsWithSG);
    setHoleCompleted(true);

    // Save shots to round
    saveShots(shotsWithSG);
  };

  const saveShots = async (updatedShots: Shot[]) => {
    try {
      if (!round) return;

      // Filter out this hole's shots and add updated ones
      const otherShots = round.shots.filter((s) => s.holeNumber !== holeNumber);
      const totalStrokes = otherShots.length + updatedShots.length;

      const updatedRound: Round = {
        ...round,
        shots: [...otherShots, ...updatedShots],
        totalStrokes,
      };

      // Save to AsyncStorage
      const rounds = (await loadData<Round[]>(STORAGE_KEYS.ROUNDS)) || [];
      const updatedRounds = rounds.map((r) => (r.id === roundId ? updatedRound : r));

      await saveData(STORAGE_KEYS.ROUNDS, updatedRounds);
      setRound(updatedRound);
    } catch (error) {
      console.error('Error saving shots', error);
      Alert.alert('Error', 'Failed to save shot data');
    }
  };

  const handleNextHole = () => {
    if (!holeCompleted) {
      Alert.alert('Error', 'Please complete the current hole first');
      return;
    }

    if (holeNumber === 18) {
      // Navigate to summary screen after hole 18
      navigation.navigate('RoundSummaryScreen', { roundId });
    } else {
      // Navigate to next hole
      navigation.navigate('HoleScreen', {
        holeNumber: holeNumber + 1,
        courseId,
        teeColor,
        roundId,
      });
    }
  };

  const handlePreviousHole = () => {
    if (holeNumber > 1) {
      // Navigate to previous hole
      navigation.navigate('HoleScreen', {
        holeNumber: holeNumber - 1,
        courseId,
        teeColor,
        roundId,
      });
    }
  };

  const handleRemoveLastShot = () => {
    if (shots.length <= 1) {
      Alert.alert('Error', 'Cannot remove the first shot');
      return;
    }

    // Remove the last shot
    const updatedShots = [...shots];
    updatedShots.pop();

    // Set the previous shot as incomplete so we can continue from there
    const lastShotIndex = updatedShots.length - 1;
    if (lastShotIndex >= 0) {
      updatedShots[lastShotIndex] = {
        ...updatedShots[lastShotIndex],
        completed: false,
      };
    }

    setShots(updatedShots);
    setHoleCompleted(false);

    // Save updated shots
    saveShots(updatedShots);
  };

  // Handle editing a shot
  const handleEditShot = (index: number) => {
    // Don't allow editing first shot's lie (always Tee)
    if (index === 0) {
      // For first shot, only edit distance if needed
      setEditingShotIndex(index);
      setEditDistanceToHole(shots[index].distanceToHole.toString());
      setEditShotLie('Tee'); // Fixed as Tee
    } else {
      const shot = shots[index];
      setEditingShotIndex(index);
      setEditShotLie(shot.lie);
      setEditDistanceToHole(shot.distanceToHole.toString());
    }
    setShowEditShotModal(true);
  };

  // Save edited shot
  const handleSaveEditedShot = () => {
    if (editingShotIndex === null) return;

    // Validate inputs
    if (!editDistanceToHole || isNaN(parseFloat(editDistanceToHole)) || parseFloat(editDistanceToHole) < 0) {
      Alert.alert('Error', 'Please enter a valid distance to hole');
      return;
    }

    const updatedShots = [...shots];
    const currentShot = updatedShots[editingShotIndex];
    const newDistanceToHole = parseFloat(editDistanceToHole);

    // Update shot data
    updatedShots[editingShotIndex] = {
      ...currentShot,
      lie: editingShotIndex === 0 ? 'Tee' : editShotLie, // First shot always Tee
      distanceToHole: newDistanceToHole,
    };

    // If this is not the last shot and it's completed, update distanceTraveled
    if (editingShotIndex < shots.length - 1 && currentShot.completed) {
      // Calculate based on next shot's distance
      const nextShot = updatedShots[editingShotIndex + 1];
      const distanceTraveled = Math.max(0, newDistanceToHole - nextShot.distanceToHole);
      updatedShots[editingShotIndex] = {
        ...updatedShots[editingShotIndex],
        distanceTraveled,
      };
    }

    // If this is the last shot and the hole is completed
    if (editingShotIndex === shots.length - 1 && currentShot.completed) {
      updatedShots[editingShotIndex] = {
        ...updatedShots[editingShotIndex],
        distanceTraveled: newDistanceToHole, // Shot made to the hole
      };
    }

    // Update strokes gained for all shots
    const shotsWithSG = updateStrokesGained(updatedShots);

    setShots(shotsWithSG);
    saveShots(shotsWithSG);
    closeEditShotModal();
  };

  // Close edit shot modal
  const closeEditShotModal = () => {
    setShowEditShotModal(false);
    setEditingShotIndex(null);
    setEditShotLie('Fairway');
    setEditDistanceToHole('');
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Updated header with compact hole data display */}
        <View style={styles.headerContainer}>
          <Text style={styles.header}>Hole {holeNumber}</Text>

          {holeDataSet && !editingHoleData && (
            <View style={styles.compactHoleData}>
              <Text style={styles.compactHoleDataText}>
                {distance}yd Par {par}
              </Text>
              <TouchableOpacity style={styles.editIconButton} onPress={handleEditHoleData}>
                <Text style={styles.editIconText}>⚙️</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Navigation between holes */}
        <View style={styles.navigationButtons}>
          {holeNumber > 1 && (
            <TouchableOpacity style={styles.navButton} onPress={handlePreviousHole}>
              <Text style={styles.navButtonText}>← Previous Hole</Text>
            </TouchableOpacity>
          )}
          {holeCompleted && holeNumber < 18 && (
            <TouchableOpacity style={styles.navButton} onPress={handleNextHole}>
              <Text style={styles.navButtonText}>Next Hole →</Text>
            </TouchableOpacity>
          )}
        </View>

        {!holeDataSet || editingHoleData ? (
          <View style={styles.holeDataSection}>
            <Text style={styles.sectionTitle}>{editingHoleData ? 'Edit Hole Data' : 'Hole Data'}</Text>

            <View style={styles.inputRow}>
              <Text style={styles.label}>Distance (yards):</Text>
              <TextInput style={styles.input} value={distance} onChangeText={setDistance} keyboardType="numeric" placeholder="Enter distance" />
            </View>

            <View style={styles.inputRow}>
              <Text style={styles.label}>Par:</Text>
              <View style={styles.parButtons}>
                {parOptions.map((option) => (
                  <TouchableOpacity key={option} style={[styles.parButton, par === option && styles.selectedParButton]} onPress={() => setPar(option)}>
                    <Text style={styles.parButtonText}>{option}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.buttonsRow}>
              <TouchableOpacity style={[styles.actionButton, styles.saveButton]} onPress={handleSetHoleData}>
                <Text style={styles.buttonText}>{editingHoleData ? 'Save Changes' : 'Set Hole Data'}</Text>
              </TouchableOpacity>

              {editingHoleData && (
                <TouchableOpacity style={[styles.actionButton, styles.cancelButton]} onPress={cancelEditHoleData}>
                  <Text style={styles.buttonText}>Cancel</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ) : (
          <>
            <View style={styles.shotListSection}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>Shots</Text>
                {shots.length > 1 && !holeCompleted && (
                  <TouchableOpacity style={styles.removeButton} onPress={handleRemoveLastShot}>
                    <Text style={styles.removeButtonText}>Remove Last Shot</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Table Header */}
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderCell, styles.shotNumberCell]}>Shot</Text>
                <Text style={[styles.tableHeaderCell, styles.lieCell]}>Lie</Text>
                <Text style={[styles.tableHeaderCell, styles.distanceCell]}>Dist.</Text>
                <Text style={[styles.tableHeaderCell, styles.sgCell]}>SG</Text>
                <Text style={[styles.tableHeaderCell, styles.actionCell]}>Act.</Text>
              </View>

              {/* Table Rows */}
              {shots.map((shot, index) => (
                <View key={shot.id} style={styles.tableRow}>
                  <Text style={[styles.tableCell, styles.shotNumberCell]}>{shot.shotNumber}</Text>
                  <Text style={[styles.tableCell, styles.lieCell]}>{shot.lie}</Text>
                  <Text style={[styles.tableCell, styles.distanceCell]}>{shot.distanceToHole}</Text>
                  <Text
                    style={[
                      styles.tableCell,
                      styles.sgCell,
                      shot.strokesGained !== undefined && shot.strokesGained > 0 ? styles.positiveValue : shot.strokesGained !== undefined && shot.strokesGained < 0 ? styles.negativeValue : null,
                    ]}
                  >
                    {shot.strokesGained !== undefined ? shot.strokesGained.toFixed(1) : '-'}
                  </Text>
                  <View style={styles.actionCell}>
                    <TouchableOpacity style={styles.editButtonSmall} onPress={() => handleEditShot(index)}>
                      <Text style={styles.editButtonText}>Edit</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>

            {!holeCompleted && (
              <View style={styles.newShotSection}>
                <Text style={styles.sectionTitle}>{shots.length > 0 ? 'Add Next Shot' : 'First Shot'}</Text>

                {/* Lie selection - flex wrap instead of scroll */}
                <View style={styles.lieSelectionContainer}>
                  {(['Fairway', 'Rough', 'Sand', 'Recovery', 'Green'] as LieCondition[]).map((lie) => (
                    <TouchableOpacity key={lie} style={[styles.lieChip, shotLie === lie && styles.selectedLieChip]} onPress={() => setShotLie(lie)}>
                      <Text style={[styles.lieChipText, shotLie === lie && styles.selectedLieChipText]}>{lie}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Distance input with Add Shot button inline */}
                <View style={styles.distanceInputRow}>
                  <TextInput style={styles.distanceInput} value={distanceToHole} onChangeText={setDistanceToHole} keyboardType="numeric" placeholder="Distance to hole (yards)" />

                  <TouchableOpacity style={[styles.holedButton, isHoled && styles.holedButtonActive]} onPress={() => setIsHoled(!isHoled)}>
                    <Text style={[styles.holedButtonText, isHoled && styles.holedButtonTextActive]}>{isHoled ? 'Holed' : 'Holed It'}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={[styles.inlineButton, (!distanceToHole || !shotLie) && styles.disabledButton]} onPress={handleAddShot} disabled={!distanceToHole || !shotLie}>
                    <Text style={styles.buttonText}>Add Shot</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Complete Hole button - outside and full width */}
            {!holeCompleted && shots.length > 0 && (
              <TouchableOpacity style={styles.completeHoleButton} onPress={handleCompleteHole}>
                <Text style={styles.buttonText}>Complete Hole</Text>
              </TouchableOpacity>
            )}

            {holeCompleted && holeNumber === 18 && (
              <TouchableOpacity style={[styles.actionButton, styles.nextHoleButton]} onPress={handleNextHole}>
                <Text style={styles.buttonText}>View Summary</Text>
              </TouchableOpacity>
            )}
          </>
        )}

        {/* Edit Shot Modal */}
        <Modal animationType="slide" transparent={true} visible={showEditShotModal} onRequestClose={closeEditShotModal}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Edit Shot</Text>

              <View style={styles.inputRow}>
                <Text style={styles.label}>Lie:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.lieButtons}>
                  {(['Fairway', 'Rough', 'Sand', 'Recovery', 'Green'] as LieCondition[]).map((lie) => (
                    <TouchableOpacity
                      key={lie}
                      style={[styles.lieButton, editShotLie === lie && styles.selectedLieButton, editingShotIndex === 0 && lie !== 'Tee' && styles.disabledLieButton]}
                      onPress={() => editingShotIndex !== 0 && setEditShotLie(lie)}
                      disabled={editingShotIndex === 0}
                    >
                      <Text style={styles.lieButtonText}>{lie}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.inputRow}>
                <Text style={styles.label}>Distance to Hole (yards):</Text>
                <TextInput style={styles.input} value={editDistanceToHole} onChangeText={setEditDistanceToHole} keyboardType="numeric" placeholder="Enter distance" />
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity style={[styles.actionButton, styles.cancelButton]} onPress={closeEditShotModal}>
                  <Text style={styles.buttonText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.actionButton, styles.saveButton]} onPress={handleSaveEditedShot}>
                  <Text style={styles.buttonText}>Save Changes</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    padding: 20,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 15,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
    textAlign: 'center',
  },
  compactHoleData: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  compactHoleDataText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
  },
  editIconButton: {
    marginLeft: 8,
    padding: 3,
  },
  editIconText: {
    fontSize: 16,
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  navButton: {
    padding: 10,
    borderRadius: 5,
    backgroundColor: '#607D8B',
  },
  navButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  holeDataSection: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  removeButton: {
    padding: 5,
    backgroundColor: '#FF5252',
    borderRadius: 5,
  },
  removeButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  inputRow: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    fontSize: 16,
  },
  parButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  parButton: {
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e0e0e0',
    borderRadius: 30,
    margin: 5,
  },
  selectedParButton: {
    backgroundColor: '#4CAF50',
  },
  parButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  actionButton: {
    backgroundColor: '#2196F3',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 10,
    flex: 1,
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    marginRight: 5,
  },
  cancelButton: {
    backgroundColor: '#FF5252',
    marginLeft: 5,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  shotListSection: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    paddingVertical: 10,
    marginBottom: 5,
  },
  tableHeaderCell: {
    fontWeight: 'bold',
    fontSize: 14,
    color: 'black',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingVertical: 12,
    alignItems: 'center',
  },
  tableCell: {
    fontSize: 14,
    color: 'black',
  },
  shotNumberCell: {
    width: 40,
    textAlign: 'center',
  },
  lieCell: {
    flex: 1.2,
    paddingLeft: 5,
  },
  distanceCell: {
    width: 50,
    textAlign: 'right',
    paddingRight: 5,
  },
  sgCell: {
    width: 40,
    textAlign: 'center',
  },
  actionCell: {
    width: 60,
    alignItems: 'center',
  },
  editButtonSmall: {
    backgroundColor: '#2196F3',
    padding: 4,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 2,
    width: '90%',
  },
  positiveValue: {
    color: 'green',
    fontWeight: 'bold',
  },
  negativeValue: {
    color: 'red',
  },
  distanceFullCell: {
    flex: 1,
    textAlign: 'right',
    paddingRight: 5,
  },
  subSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 10,
  },
  newShotSection: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
  },
  lieSelectionContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 15,
  },
  lieChip: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#e0e0e0',
    borderRadius: 20,
    margin: 5,
  },
  selectedLieChip: {
    backgroundColor: '#4CAF50',
  },
  lieChipText: {
    fontSize: 14,
    color: '#333',
  },
  selectedLieChipText: {
    color: 'white',
    fontWeight: 'bold',
  },
  distanceInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  distanceInput: {
    flex: 3,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    fontSize: 16,
    marginRight: 10,
  },
  holedButton: {
    flex: 1.2,
    backgroundColor: '#e0e0e0',
    padding: 12,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  holedButtonActive: {
    backgroundColor: '#4CAF50',
  },
  holedButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  holedButtonTextActive: {
    color: 'white',
  },
  inlineButton: {
    flex: 1.5,
    backgroundColor: '#2196F3',
    padding: 12,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledButton: {
    backgroundColor: '#cccccc',
    opacity: 0.7,
  },
  completeHoleButton: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  disabledLieButton: {
    backgroundColor: '#e0e0e0',
    opacity: 0.5,
  },
  buttonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  nextHoleButton: {
    backgroundColor: '#FF9800',
  },
  lieButtons: {
    flexDirection: 'row',
    marginVertical: 10,
  },
  lieButton: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#e0e0e0',
    borderRadius: 20,
    marginRight: 10,
  },
  selectedLieButton: {
    backgroundColor: '#4CAF50',
  },
  lieButtonText: {
    fontSize: 14,
  },
  editButtonText: {
    color: 'black',
    fontWeight: 'bold',
    fontSize: 12,
  },
});

export default HoleScreen;
