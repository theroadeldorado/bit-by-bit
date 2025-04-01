import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteParams, Round } from '../types';
import { loadData, STORAGE_KEYS } from '../services/storage';

type HomeScreenNavigationProp = StackNavigationProp<RouteParams, 'HomeScreen'>;

const HomeScreen = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const [recentRounds, setRecentRounds] = useState<Round[]>([]);
  const [averages, setAverages] = useState({
    driving: 0,
    approach: 0,
    shortGame: 0,
    putting: 0,
  });

  useEffect(() => {
    // Load data from AsyncStorage
    const loadRounds = async () => {
      try {
        const savedRounds = await loadData<Round[]>(STORAGE_KEYS.ROUNDS);
        if (savedRounds) {
          // Get the 10 most recent rounds
          const sortedRounds = savedRounds.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10);

          setRecentRounds(sortedRounds);

          // In a real app, we would calculate the averages here
          // For now, use placeholder data
          setAverages({
            driving: 0.8, // Strokes gained values
            approach: -0.5,
            shortGame: 0.2,
            putting: 1.1,
          });
        }
      } catch (error) {
        console.error('Error loading rounds data', error);
      }
    };

    loadRounds();
  }, []);

  const handleStartRound = () => {
    navigation.navigate('StartRoundScreen');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Bit by Bit</Text>
        <Text style={styles.subtitle}>Golf Performance Tracker</Text>
      </View>

      <TouchableOpacity style={styles.startButton} onPress={handleStartRound}>
        <Text style={styles.startButtonText}>Start Round</Text>
      </TouchableOpacity>

      <View style={styles.statsContainer}>
        <Text style={styles.statsHeader}>Last 10 Rounds Averages</Text>

        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Driving:</Text>
          <Text style={styles.statValue}>{averages.driving.toFixed(1)}</Text>
        </View>

        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Approach:</Text>
          <Text style={styles.statValue}>{averages.approach.toFixed(1)}</Text>
        </View>

        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Short Game:</Text>
          <Text style={styles.statValue}>{averages.shortGame.toFixed(1)}</Text>
        </View>

        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Putting:</Text>
          <Text style={styles.statValue}>{averages.putting.toFixed(1)}</Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 16,
    marginTop: 5,
  },
  startButton: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 5,
    margin: 20,
    alignItems: 'center',
  },
  startButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  statsContainer: {
    backgroundColor: 'white',
    borderRadius: 5,
    margin: 20,
    padding: 15,
  },
  statsHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  statLabel: {
    fontSize: 16,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default HomeScreen;
