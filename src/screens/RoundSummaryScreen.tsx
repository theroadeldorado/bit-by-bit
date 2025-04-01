import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteParams, Round, LieCondition, Course, RoundSummary } from '../types';
import { loadData, saveData, STORAGE_KEYS } from '../services/storage';

type RoundSummaryScreenRouteProp = RouteProp<RouteParams, 'RoundSummaryScreen'>;
type RoundSummaryScreenNavigationProp = StackNavigationProp<RouteParams, 'RoundSummaryScreen'>;

const RoundSummaryScreen = () => {
  const route = useRoute<RoundSummaryScreenRouteProp>();
  const navigation = useNavigation<RoundSummaryScreenNavigationProp>();
  const { roundId } = route.params;

  const [round, setRound] = useState<Round | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [summary, setSummary] = useState<RoundSummary | null>(null);

  useEffect(() => {
    const loadRoundData = async () => {
      try {
        // Load round data
        const rounds = (await loadData<Round[]>(STORAGE_KEYS.ROUNDS)) || [];
        const foundRound = rounds.find((r) => r.id === roundId);

        if (!foundRound) {
          Alert.alert('Error', 'Round not found');
          return;
        }

        setRound(foundRound);

        // Load course data
        const courses = (await loadData<Course[]>(STORAGE_KEYS.COURSES)) || [];
        const foundCourse = courses.find((c) => c.id === foundRound.courseId);

        if (foundCourse) {
          setCourse(foundCourse);
        }

        // Calculate summary
        const shotsByLie: Record<LieCondition, number> = {
          Tee: 0,
          Fairway: 0,
          Rough: 0,
          Sand: 0,
          Recovery: 0,
          Green: 0,
        };

        // Count shots by lie
        foundRound.shots.forEach((shot) => {
          shotsByLie[shot.lie] = (shotsByLie[shot.lie] || 0) + 1;
        });

        setSummary({
          totalStrokes: foundRound.totalStrokes,
          shotsByLie,
        });

        // Mark round as completed
        if (!foundRound.completed) {
          const updatedRound = {
            ...foundRound,
            completed: true,
          };

          const updatedRounds = rounds.map((r) => (r.id === roundId ? updatedRound : r));

          await saveData(STORAGE_KEYS.ROUNDS, updatedRounds);
          setRound(updatedRound);
        }
      } catch (error) {
        console.error('Error loading round data', error);
        Alert.alert('Error', 'Failed to load round data');
      }
    };

    loadRoundData();
  }, [roundId]);

  const handleGoHome = () => {
    navigation.navigate('HomeScreen');
  };

  if (!round || !summary) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading round data...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Round Summary</Text>

      <View style={styles.infoSection}>
        <Text style={styles.sectionTitle}>Round Information</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Date:</Text>
          <Text style={styles.infoValue}>{new Date(round.date).toLocaleDateString()}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Course:</Text>
          <Text style={styles.infoValue}>{course?.name || 'Unknown Course'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Tees:</Text>
          <Text style={styles.infoValue}>{round.teeColor}</Text>
        </View>
      </View>

      <View style={styles.statsSection}>
        <Text style={styles.sectionTitle}>Score Statistics</Text>
        <View style={styles.statsRow}>
          <Text style={styles.statsLabel}>Total Strokes:</Text>
          <Text style={styles.statsValue}>{summary.totalStrokes}</Text>
        </View>

        {course && (
          <View style={styles.statsRow}>
            <Text style={styles.statsLabel}>vs Par:</Text>
            <Text style={styles.statsValue}>{calculateScoreVsPar(round, course)}</Text>
          </View>
        )}
      </View>

      <View style={styles.lieStatsSection}>
        <Text style={styles.sectionTitle}>Shots by Lie</Text>
        {Object.entries(summary.shotsByLie).map(
          ([lie, count]) =>
            count > 0 && (
              <View key={lie} style={styles.lieRow}>
                <Text style={styles.lieLabel}>{lie}:</Text>
                <Text style={styles.lieValue}>{count}</Text>
                <View style={styles.lieBar}>
                  <View style={[styles.lieBarFill, { width: `${(count / summary.totalStrokes) * 100}%` }]} />
                </View>
              </View>
            )
        )}
      </View>

      <View style={styles.strokesGainedSection}>
        <Text style={styles.sectionTitle}>Strokes Gained</Text>
        <Text style={styles.comingSoonText}>Strokes gained analysis will be added in a future update</Text>
      </View>

      <TouchableOpacity style={styles.homeButton} onPress={handleGoHome}>
        <Text style={styles.homeButtonText}>Return to Home</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

// Helper function to calculate score vs par
const calculateScoreVsPar = (round: Round, course: Course): string => {
  // Get total par for the course
  const holes = course.holes[round.teeColor];
  if (!holes) return 'N/A';

  const totalPar = holes.reduce((sum, hole) => sum + hole.par, 0);
  const scoreDiff = round.totalStrokes - totalPar;

  if (scoreDiff === 0) return 'Even';
  if (scoreDiff > 0) return `+${scoreDiff}`;
  return scoreDiff.toString();
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  infoSection: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  infoLabel: {
    fontWeight: 'bold',
  },
  infoValue: {},
  statsSection: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  statsLabel: {
    fontWeight: 'bold',
  },
  statsValue: {
    fontSize: 18,
  },
  lieStatsSection: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
  },
  lieRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  lieLabel: {
    width: 80,
    fontWeight: 'bold',
  },
  lieValue: {
    width: 30,
    textAlign: 'center',
  },
  lieBar: {
    flex: 1,
    height: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
    marginLeft: 10,
  },
  lieBarFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 5,
  },
  strokesGainedSection: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
    alignItems: 'center',
  },
  comingSoonText: {
    fontStyle: 'italic',
    color: '#888',
    marginTop: 10,
  },
  homeButton: {
    backgroundColor: '#2196F3',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginVertical: 20,
  },
  homeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default RoundSummaryScreen;
