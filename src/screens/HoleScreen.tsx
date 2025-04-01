import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView, KeyboardAvoidingView, Platform, Modal } from 'react-native';
import { useRoute, RouteProp, useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteParams, LieCondition, Shot, Course, Round, Hole } from '../types';
import { loadData, saveData, STORAGE_KEYS } from '../services/storage';
import { colors, spacing, fontFamily } from '../theme/globalStyles';
import { PixelText, Body, Caption } from '../components/Typography';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Header } from '../components/Header';

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
    '20': 2.5,
    '15': 2.3,
    '10': 2.0,
    '7': 1.9,
    '5': 1.7,
    '3': 1.5,
    '2': 1.3,
    '1': 1.1,
    '0.33': 1.0,
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

      // Load data for the current hole
      loadCourseAndRound();

      return () => {
        // Cleanup if needed
      };
    }, [loadCourseAndRound])
  );

  // Initialize first shot when hole data is set - update to support hole-in-one
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

      // Clear other input states when creating first shot
      setDistanceToHole('');
      setShotLie('Fairway');
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

  // Fix calculateExpectedStrokes to handle feet vs yards correctly
  const calculateExpectedStrokes = (lie: LieCondition, distance: number): number => {
    if (!baselinePerformance[lie]) {
      console.warn(`No baseline data for lie: ${lie}`);
      return 0;
    }

    // Important: Our baseline data is stored with distances in yards
    // But for Green, the UI displays in feet
    // Ensure distance is in proper units (yards) before calculating
    let distanceInYards = distance;
    if (lie === 'Green') {
      // If we're on the green, distance is in feet in the UI, but our baseline data expects yards
      // Convert feet to yards (3 feet = 1 yard)
      distanceInYards = distance / 3;
    }

    // Get available distances for this lie
    const distances = Object.keys(baselinePerformance[lie])
      .map(Number)
      .sort((a, b) => a - b);

    // Find closest distance points for interpolation
    if (distanceInYards <= distances[0]) {
      return baselinePerformance[lie][distances[0].toString()];
    }

    if (distanceInYards >= distances[distances.length - 1]) {
      return baselinePerformance[lie][distances[distances.length - 1].toString()];
    }

    // Find two closest points for linear interpolation
    let lowerDist = distances[0];
    let upperDist = distances[distances.length - 1];

    for (let i = 0; i < distances.length - 1; i++) {
      if (distances[i] <= distanceInYards && distanceInYards <= distances[i + 1]) {
        lowerDist = distances[i];
        upperDist = distances[i + 1];
        break;
      }
    }

    // Linear interpolation
    const lowerStrokes = baselinePerformance[lie][lowerDist.toString()];
    const upperStrokes = baselinePerformance[lie][upperDist.toString()];

    return lowerStrokes + ((distanceInYards - lowerDist) / (upperDist - lowerDist)) * (upperStrokes - lowerStrokes);
  };

  // Fix the calculation formula - it was reversed
  const calculateStrokesGained = (shot: Shot, nextShot: Shot | null): number => {
    // Expected strokes from current position
    const expectedFromCurrent = calculateExpectedStrokes(shot.lie, shot.distanceToHole);

    // Expected strokes from next position (or 0 if holed)
    const expectedFromNext = nextShot ? calculateExpectedStrokes(nextShot.lie, nextShot.distanceToHole) : 0;

    // When shooting from position A to position B:
    // Positive SG means you did BETTER than expected
    // SG = (Expected strokes from A) - (1 shot taken + Expected strokes from B)
    // If you took more shots than expected or left yourself in a worse position, SG will be negative
    return parseFloat((expectedFromCurrent - (1 + expectedFromNext)).toFixed(2));
  };

  // Add a debug function to help diagnose issues
  const debugStrokesGainedCalculation = (shot: Shot): void => {
    if (shot.lie === 'Green') {
      console.log(`Green putt at ${shot.distanceToHole} yards (${shot.distanceToHole * 3}ft):`);
      const expected = calculateExpectedStrokes(shot.lie, shot.distanceToHole);
      console.log(`Expected strokes: ${expected}`);
      console.log(`Made in 1 stroke, SG = ${expected - 1}`);
    }
  };

  // Fix handleCompleteHole to handle units correctly
  const handleCompleteHole = () => {
    if (!holeDataSet || shots.length === 0) {
      Alert.alert('Error', 'No shots to complete');
      return;
    }

    // Complete last shot
    const updatedShots = [...shots];
    const lastShotIndex = updatedShots.length - 1;
    const lastShot = updatedShots[lastShotIndex];

    // Debug calculation for Green shots
    if (lastShot.lie === 'Green') {
      debugStrokesGainedCalculation(lastShot);
    }

    updatedShots[lastShotIndex] = {
      ...lastShot,
      distanceTraveled: lastShot.distanceToHole,
      completed: true,
    };

    // For the final putt/shot:
    // Expected strokes to hole out from this lie/distance
    const expectedStrokes = calculateExpectedStrokes(lastShot.lie, lastShot.distanceToHole);

    // Positive SG means better than expected
    const strokesGained = parseFloat((expectedStrokes - 1).toFixed(2));

    const lastShotWithSG = {
      ...updatedShots[lastShotIndex],
      strokesGained,
    };
    updatedShots[lastShotIndex] = lastShotWithSG;

    // For previous shots, recalculate SG normally
    const shotsWithSG = updatedShots.map((shot, index) => {
      if (index < updatedShots.length - 1) {
        // For previous shots, calculate against the next shot
        const nextShot = updatedShots[index + 1];
        const strokesGained = calculateStrokesGained(shot, nextShot);
        return { ...shot, strokesGained };
      }
      // Return the already calculated last shot
      return shot;
    });

    setShots(shotsWithSG);
    setHoleCompleted(true);

    // Save shots to round
    saveShots(shotsWithSG);
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

  // Ensure the display converts properly
  const formatDistanceWithUnits = (distance: number, lie: LieCondition): string => {
    if (lie === 'Green') {
      // Convert to feet (1 yard = 3 feet)
      // Note: distance is already stored in yards in our data model
      const feet = Math.round(distance * 3);
      return `${feet} ft`;
    }
    return `${distance} yds`;
  };

  // Helper function to handle input conversion when lie type is Green
  const handleDistanceInputChange = (value: string) => {
    setDistanceToHole(value);
  };

  // Update distance placeholder based on lie
  const getDistancePlaceholder = (): string => {
    if (shotLie === 'Green') {
      return 'Distance to hole (feet)';
    }
    return 'Distance to hole (yards)';
  };

  // Simplify handleAddShot function without holed options
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
      let currentDistanceToHole = parseFloat(distanceToHole);

      // If current shot is on the green and previous was not, convert feet to yards
      if (shotLie === 'Green' && lastShot.lie !== 'Green') {
        currentDistanceToHole = currentDistanceToHole / 3;
      }
      // If current shot is not on green and previous was on green, convert yards to feet
      else if (shotLie !== 'Green' && lastShot.lie === 'Green') {
        currentDistanceToHole = currentDistanceToHole * 3;
      }

      const distanceTraveled = Math.max(0, prevDistanceToHole - currentDistanceToHole);

      updatedShots[lastShotIndex] = {
        ...lastShot,
        distanceTraveled,
        completed: true,
      };
    }

    // Create new shot with proper distance units
    let shotDistanceToHole = parseFloat(distanceToHole);

    // If on green, convert feet to yards for storage
    if (shotLie === 'Green') {
      shotDistanceToHole = shotDistanceToHole / 3;
    }

    const newShot: Shot = {
      id: Date.now().toString(),
      holeNumber,
      shotNumber: shots.length + 1,
      lie: shotLie,
      distanceToHole: shotDistanceToHole, // Always store in yards
      completed: false,
    };

    updatedShots.push(newShot);

    // Update strokes gained for all shots
    const shotsWithSG = updateStrokesGained(updatedShots);

    setShots(shotsWithSG);
    setCurrentShot(newShot);

    // Reset inputs
    setDistanceToHole('');

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
    const shot = shots[index];
    setEditingShotIndex(index);
    setEditShotLie(shot.lie);

    // Set distance with proper unit conversion
    setEditDistanceToHole(getInitialEditDistance(shot));

    setShowEditShotModal(true);
  };

  // Update the getInitialEditDistance function
  const getInitialEditDistance = (shot: Shot): string => {
    if (shot.lie === 'Green') {
      // Convert yards to feet for display
      return (shot.distanceToHole * 3).toFixed(0);
    }
    return shot.distanceToHole.toString();
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
    let newDistanceToHole = parseFloat(editDistanceToHole);

    // If editing a shot on the green, convert feet to yards
    if (editShotLie === 'Green') {
      newDistanceToHole = newDistanceToHole / 3;
    }

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

    // Recalculate strokes gained for all shots
    let shotsWithSG = [];

    if (holeCompleted) {
      // If hole is completed, handle calculations like in handleCompleteHole
      // For previous shots, recalculate SG normally
      shotsWithSG = updatedShots.map((shot, index) => {
        if (index < updatedShots.length - 1) {
          // For previous shots, calculate against the next shot
          const nextShot = updatedShots[index + 1];
          const strokesGained = calculateStrokesGained(shot, nextShot);
          return { ...shot, strokesGained };
        } else {
          // For the final shot (holed shot)
          const expectedStrokes = calculateExpectedStrokes(shot.lie, shot.distanceToHole);
          const strokesGained = parseFloat((expectedStrokes - 1).toFixed(2));
          return { ...shot, strokesGained };
        }
      });
    } else {
      // If hole is not completed, update strokes gained for all shots up to the last one
      shotsWithSG = updateStrokesGained(updatedShots);
    }

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
      <Header title={`Hole ${holeNumber}`} />
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Hole Info */}
        <View style={styles.holeInfoContainer}>
          <PixelText style={styles.holeTitle}>HOLE {holeNumber}</PixelText>
          {holeDataSet && !editingHoleData && (
            <Text style={styles.holeDetails}>
              {distance}yd Par {par}
            </Text>
          )}
        </View>

        {!holeDataSet || editingHoleData ? (
          <Card variant="elevated" style={styles.cardContainer}>
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
              <Button title={editingHoleData ? 'Save Changes' : 'Set Hole Data'} onPress={handleSetHoleData} variant="primary" style={styles.actionButton} />

              {editingHoleData && <Button title="Cancel" onPress={cancelEditHoleData} variant="outline" style={styles.actionButton} />}
            </View>
          </Card>
        ) : (
          <>
            {/* Shots Section */}
            <Card variant="filled" style={styles.cardContainer}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>Shots</Text>
                {shots.length > 1 && !holeCompleted && <Button title="Remove Last Shot" onPress={handleRemoveLastShot} variant="outline" size="small" />}
              </View>

              {/* Table Header */}
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderCell, styles.shotNumberCell]}>Shot</Text>
                <Text style={[styles.tableHeaderCell, styles.lieCell]}>Lie</Text>
                <Text style={[styles.tableHeaderCell, styles.distanceCell]}>Dist.</Text>
                <Text style={[styles.tableHeaderCell, styles.sgCell]}>SG</Text>
                <Text style={[styles.tableHeaderCell, styles.actionCell]}></Text>
              </View>

              {/* Table Rows */}
              {shots.map((shot, index) => (
                <View key={shot.id} style={styles.tableRow}>
                  <Text style={[styles.tableCell, styles.shotNumberCell]}>{shot.shotNumber}</Text>
                  <Text style={[styles.tableCell, styles.lieCell]}>{shot.lie}</Text>
                  <Text style={[styles.tableCell, styles.distanceCell]}>{formatDistanceWithUnits(shot.distanceToHole, shot.lie)}</Text>
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
                    <TouchableOpacity style={styles.editButton} onPress={() => handleEditShot(index)}>
                      <Text style={styles.editButtonText}>Edit</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </Card>

            {!holeCompleted && (
              <Card variant="filled" style={styles.cardContainer}>
                <Text style={styles.sectionTitle}>{shots.length > 0 ? 'Add Next Shot' : 'First Shot'}</Text>

                {/* Lie selection buttons */}
                <View style={styles.lieSelectionContainer}>
                  {(['Fairway', 'Rough', 'Sand', 'Recovery', 'Green'] as LieCondition[]).map((lie) => (
                    <TouchableOpacity key={lie} style={[styles.lieChip, shotLie === lie && styles.selectedLieChip]} onPress={() => setShotLie(lie)}>
                      <Text style={[styles.lieChipText, shotLie === lie && styles.selectedLieChipText]}>{lie}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Distance input with placeholder */}
                <TextInput
                  style={styles.distanceInput}
                  value={distanceToHole}
                  onChangeText={handleDistanceInputChange}
                  keyboardType="numeric"
                  placeholder={`Distance to hole ${shotLie === 'Green' ? '(feet)' : '(yards)'}`}
                />

                <Button title="Add Shot" onPress={handleAddShot} variant="primary" disabled={!distanceToHole || !shotLie} fullWidth style={styles.addShotButton} />
              </Card>
            )}

            {/* Complete Hole button */}
            {!holeCompleted && shots.length > 0 && <Button title="Complete Hole" onPress={handleCompleteHole} variant="primary" fullWidth style={styles.completeHoleButton} />}

            {holeCompleted && holeNumber === 18 && <Button title="View Summary" onPress={handleNextHole} variant="primary" fullWidth style={styles.viewSummaryButton} />}
          </>
        )}

        {/* Navigation buttons */}
        <View style={styles.navigationButtons}>
          {holeNumber > 1 ? <Button title="← Previous Hole" onPress={handlePreviousHole} variant="outline" style={styles.navButton} /> : <View style={styles.emptyNavButton} />}

          {holeCompleted && holeNumber < 18 && <Button title="Next Hole →" onPress={handleNextHole} variant="outline" style={styles.navButton} />}
        </View>

        {/* Edit Shot Modal */}
        <Modal animationType="slide" transparent={true} visible={showEditShotModal} onRequestClose={closeEditShotModal}>
          <View style={styles.modalOverlay}>
            <Card variant="elevated" style={styles.modalContent}>
              <Text style={styles.modalTitle}>Edit Shot</Text>

              <View style={styles.inputRow}>
                <Text style={styles.label}>Lie:</Text>
                <View style={styles.lieSelectionContainer}>
                  {(['Fairway', 'Rough', 'Sand', 'Recovery', 'Green'] as LieCondition[]).map((lie) => (
                    <TouchableOpacity
                      key={lie}
                      style={[styles.lieChip, editShotLie === lie && styles.selectedLieChip, editingShotIndex === 0 && lie !== 'Tee' && styles.disabledLieChip]}
                      onPress={() => editingShotIndex !== 0 && setEditShotLie(lie)}
                      disabled={editingShotIndex === 0}
                    >
                      <Text style={[styles.lieChipText, editShotLie === lie && styles.selectedLieChipText]}>{lie}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputRow}>
                <Text style={styles.label}>Distance to hole {editShotLie === 'Green' ? '(feet)' : '(yards)'}:</Text>
                <TextInput
                  style={styles.input}
                  value={editDistanceToHole}
                  onChangeText={setEditDistanceToHole}
                  keyboardType="numeric"
                  placeholder={editShotLie === 'Green' ? 'Enter distance in feet' : 'Enter distance in yards'}
                />
              </View>

              <View style={styles.modalButtons}>
                <Button title="Cancel" onPress={closeEditShotModal} variant="outline" style={styles.modalButton} />
                <Button title="Save Changes" onPress={handleSaveEditedShot} variant="primary" style={styles.modalButton} />
              </View>
            </Card>
          </View>
        </Modal>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  scrollContainer: {
    padding: spacing.md,
  },
  holeInfoContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
    marginTop: spacing.md,
  },
  holeTitle: {
    fontSize: 32,
    marginBottom: spacing.sm,
    textAlign: 'center',
    color: colors.black,
  },
  holeDetails: {
    fontSize: 18,
    color: colors.gray[600],
    fontFamily: 'Inter',
  },
  cardContainer: {
    marginBottom: spacing.lg,
    padding: spacing.md,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: spacing.md,
    fontFamily: 'Inter-Bold',
    color: colors.black,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  inputRow: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: 16,
    marginBottom: spacing.xs,
    fontFamily: 'Inter',
    color: colors.gray[600],
  },
  input: {
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderRadius: 8,
    padding: spacing.sm,
    fontSize: 16,
    fontFamily: 'Inter',
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
    backgroundColor: colors.gray[200],
    borderRadius: 30,
    margin: 5,
    borderWidth: 2,
    borderColor: colors.gray[300],
  },
  selectedParButton: {
    backgroundColor: colors.green,
    borderColor: colors.black,
  },
  parButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.black,
  },
  buttonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    marginHorizontal: spacing.xs,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: colors.gray[200],
    borderBottomWidth: 2,
    borderBottomColor: colors.black,
    paddingVertical: spacing.sm,
    marginBottom: spacing.xs,
  },
  tableHeaderCell: {
    fontWeight: 'bold',
    fontSize: 14,
    color: colors.black,
    fontFamily: 'Inter-Bold',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  tableCell: {
    fontSize: 16,
    color: colors.black,
    fontFamily: 'Inter',
  },
  shotNumberCell: {
    width: 40,
    textAlign: 'center',
  },
  lieCell: {
    flex: 1.2,
    paddingLeft: spacing.xs,
  },
  distanceCell: {
    width: 80,
    textAlign: 'right',
    paddingRight: spacing.xs,
  },
  sgCell: {
    width: 60,
    textAlign: 'center',
  },
  actionCell: {
    width: 60,
    alignItems: 'center',
  },
  editButton: {
    backgroundColor: colors.green,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.black,
  },
  editButtonText: {
    color: colors.black,
    fontWeight: 'bold',
    fontSize: 12,
  },
  positiveValue: {
    color: colors.green,
    fontWeight: 'bold',
  },
  negativeValue: {
    color: '#d32f2f',
  },
  lieSelectionContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.md,
  },
  lieChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.gray[200],
    borderRadius: 20,
    margin: spacing.xs,
    borderWidth: 1,
    borderColor: colors.gray[300],
  },
  selectedLieChip: {
    backgroundColor: colors.green,
    borderColor: colors.black,
  },
  disabledLieChip: {
    opacity: 0.5,
  },
  lieChipText: {
    fontSize: 14,
    color: colors.black,
    fontFamily: 'Inter',
  },
  selectedLieChipText: {
    color: colors.black,
    fontWeight: 'bold',
  },
  distanceInput: {
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderRadius: 8,
    padding: spacing.md,
    fontSize: 16,
    fontFamily: 'Inter',
    marginBottom: spacing.md,
  },
  addShotButton: {
    marginTop: spacing.sm,
  },
  completeHoleButton: {
    marginBottom: spacing.lg,
  },
  viewSummaryButton: {
    marginBottom: spacing.lg,
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  navButton: {
    minWidth: 120,
  },
  emptyNavButton: {
    minWidth: 120,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    padding: spacing.lg,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: spacing.lg,
    textAlign: 'center',
    fontFamily: 'Inter-Bold',
    color: colors.black,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
  },
  modalButton: {
    flex: 1,
    marginHorizontal: spacing.xs,
  },
});

export default HoleScreen;
