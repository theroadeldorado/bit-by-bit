import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteParams, Round } from '../types';
import { loadData, STORAGE_KEYS } from '../services/storage';
import { colors, spacing } from '../theme/globalStyles';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Title, Subheading, Body, Caption, PixelText } from '../components/Typography';
import { Divider } from '../components/Divider';
import { Logo } from '../components/Logo';

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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getStrokeGainedColor = (value: number) => {
    return value >= 0 ? colors.gold : '#d32f2f';
  };

  const getStrokeGainedPrefix = (value: number) => {
    return value >= 0 ? '+' : '';
  };

  const renderLatestRound = () => {
    if (recentRounds.length === 0) {
      return (
        <Card variant="outline" style={styles.latestRoundCard}>
          <PixelText color={colors.gray[600]} textAlign="center">
            No rounds recorded yet
          </PixelText>
        </Card>
      );
    }

    const latestRound = recentRounds[0];
    const latestRoundTotal = latestRound.totalStrokes || 0;

    return (
      <Card variant="elevated" style={styles.latestRoundCard}>
        <Subheading>Latest Round</Subheading>
        <Divider color={colors.gold} />
        <View style={styles.latestRoundContent}>
          <Body>{formatDate(latestRound.date)}</Body>
          <View style={styles.scoreContainer}>
            <PixelText style={styles.scoreText} color={getStrokeGainedColor(latestRoundTotal)}>
              {getStrokeGainedPrefix(latestRoundTotal)}
              {latestRoundTotal.toFixed(1)}
            </PixelText>
          </View>
        </View>
      </Card>
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Logo size="large" />
      </View>

      <View style={styles.content}>
        {renderLatestRound()}

        <View style={styles.statsSection}>
          <Subheading>Your Trends</Subheading>
          <Divider color={colors.gold} />

          <View style={styles.statRow}>
            <Body>Driving:</Body>
            <PixelText color={getStrokeGainedColor(averages.driving)}>
              {getStrokeGainedPrefix(averages.driving)}
              {averages.driving.toFixed(1)}
            </PixelText>
          </View>

          <View style={styles.statRow}>
            <Body>Approach:</Body>
            <PixelText color={getStrokeGainedColor(averages.approach)}>
              {getStrokeGainedPrefix(averages.approach)}
              {averages.approach.toFixed(1)}
            </PixelText>
          </View>

          <View style={styles.statRow}>
            <Body>Short Game:</Body>
            <PixelText color={getStrokeGainedColor(averages.shortGame)}>
              {getStrokeGainedPrefix(averages.shortGame)}
              {averages.shortGame.toFixed(1)}
            </PixelText>
          </View>

          <View style={styles.statRow}>
            <Body>Putting:</Body>
            <PixelText color={getStrokeGainedColor(averages.putting)}>
              {getStrokeGainedPrefix(averages.putting)}
              {averages.putting.toFixed(1)}
            </PixelText>
          </View>
        </View>

        <Button title="Start Round" onPress={handleStartRound} variant="primary" size="large" fullWidth style={styles.startButton} />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  header: {
    alignItems: 'center',
    padding: spacing.md,
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
  },
  content: {
    padding: spacing.md,
  },
  latestRoundCard: {
    marginBottom: spacing.lg,
  },
  latestRoundContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  scoreContainer: {
    backgroundColor: colors.black,
    borderRadius: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  scoreText: {
    fontSize: 24,
  },
  statsSection: {
    marginBottom: spacing.xl,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  startButton: {
    marginVertical: spacing.lg,
  },
});

export default HomeScreen;
