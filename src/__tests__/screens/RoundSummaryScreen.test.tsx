import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import RoundSummaryScreen from '../../screens/RoundSummaryScreen';
import { loadData, saveData, STORAGE_KEYS } from '../../services/storage';
import { Course, Round, Shot, TeeColor } from '../../types';

// Mock navigation and route
const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => {
  return {
    ...jest.requireActual('@react-navigation/native'),
    useNavigation: () => ({
      navigate: mockNavigate,
    }),
    useRoute: () => ({
      params: {
        roundId: 'round-1',
      },
    }),
  };
});

// Mock AsyncStorage and storage service
jest.mock('../../services/storage', () => ({
  loadData: jest.fn(),
  saveData: jest.fn(),
  STORAGE_KEYS: {
    COURSES: 'bit_by_bit_courses',
    ROUNDS: 'bit_by_bit_rounds',
  },
}));

// Mock Alert
jest.spyOn(Alert, 'alert');

// Helper function to create empty holes array for all tee colors
const createEmptyHoles = () => {
  const holes = {} as Record<TeeColor, any[]>;
  const teeColors: TeeColor[] = ['Red', 'White', 'Blue', 'Gold'];

  teeColors.forEach((color) => {
    holes[color] = Array(18)
      .fill(null)
      .map((_, i) => ({
        number: i + 1,
        par: 4,
        distance: 350,
      }));
  });

  return holes;
};

describe('RoundSummaryScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Create test data
    const mockShots: Shot[] = [
      {
        id: 'shot-1',
        holeNumber: 1,
        shotNumber: 1,
        lie: 'Tee',
        distanceToHole: 350,
        distanceTraveled: 250,
        completed: true,
      },
      {
        id: 'shot-2',
        holeNumber: 1,
        shotNumber: 2,
        lie: 'Fairway',
        distanceToHole: 100,
        distanceTraveled: 80,
        completed: true,
      },
      {
        id: 'shot-3',
        holeNumber: 1,
        shotNumber: 3,
        lie: 'Green',
        distanceToHole: 20,
        distanceTraveled: 20,
        completed: true,
      },
    ];

    const mockRound: Round = {
      id: 'round-1',
      date: new Date().toISOString(),
      courseId: 'course-1',
      teeColor: 'Blue',
      shots: mockShots,
      totalStrokes: mockShots.length,
      completed: false,
    };

    const mockCourse: Course = {
      id: 'course-1',
      name: 'Test Course',
      teeColors: ['Blue', 'White', 'Red', 'Gold'],
      holes: createEmptyHoles(),
    };

    // Mock loadData to return our test data
    (loadData as jest.Mock).mockImplementation((key: string) => {
      if (key === STORAGE_KEYS.COURSES) {
        return Promise.resolve([mockCourse]);
      } else if (key === STORAGE_KEYS.ROUNDS) {
        return Promise.resolve([mockRound]);
      }
      return Promise.resolve(null);
    });

    (saveData as jest.Mock).mockResolvedValue(undefined);
  });

  it('renders correctly with round summary data', async () => {
    const { getByText } = render(<RoundSummaryScreen />);

    await waitFor(() => {
      // Check header is present
      expect(getByText('Round Summary')).toBeTruthy();

      // Check round info is displayed
      expect(getByText('Round Information')).toBeTruthy();
      expect(getByText('Course:')).toBeTruthy();
      expect(getByText('Test Course')).toBeTruthy();
      expect(getByText('Tees:')).toBeTruthy();
      expect(getByText('Blue')).toBeTruthy();

      // Check score info is displayed
      expect(getByText('Score Statistics')).toBeTruthy();
      expect(getByText('Total Strokes:')).toBeTruthy();
      expect(getByText('3')).toBeTruthy(); // 3 shots

      // Check shots by lie is displayed
      expect(getByText('Shots by Lie')).toBeTruthy();
      expect(getByText('Tee:')).toBeTruthy();
      expect(getByText('Fairway:')).toBeTruthy();
      expect(getByText('Green:')).toBeTruthy();

      // Check strokes gained placeholder is shown
      expect(getByText('Strokes Gained')).toBeTruthy();
      expect(getByText('Strokes gained analysis will be added in a future update')).toBeTruthy();

      // Check home button is present
      expect(getByText('Return to Home')).toBeTruthy();
    });
  });

  it('marks the round as completed and saves it', async () => {
    render(<RoundSummaryScreen />);

    await waitFor(() => {
      // Check that saveData was called to mark round as completed
      expect(saveData).toHaveBeenCalled();
      const saveCall = (saveData as jest.Mock).mock.calls[0];
      expect(saveCall[0]).toBe(STORAGE_KEYS.ROUNDS);

      const updatedRounds = saveCall[1] as Round[];
      const updatedRound = updatedRounds.find((r) => r.id === 'round-1');
      expect(updatedRound?.completed).toBe(true);
    });
  });

  it('navigates to home screen when Return to Home button is pressed', async () => {
    const { getByText } = render(<RoundSummaryScreen />);

    await waitFor(() => {
      const homeButton = getByText('Return to Home');
      fireEvent.press(homeButton);

      expect(mockNavigate).toHaveBeenCalledWith('HomeScreen');
    });
  });

  it('shows loading state when data is not available yet', () => {
    (loadData as jest.Mock).mockImplementation(() => Promise.resolve([]));

    const { getByText } = render(<RoundSummaryScreen />);

    expect(getByText('Loading round data...')).toBeTruthy();
  });

  it('shows error alert when round is not found', async () => {
    (loadData as jest.Mock).mockImplementation(() => Promise.resolve([]));

    render(<RoundSummaryScreen />);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Round not found');
    });
  });
});
