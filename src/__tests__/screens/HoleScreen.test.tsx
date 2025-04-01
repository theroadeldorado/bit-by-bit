import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Alert } from 'react-native';
import HoleScreen from '../../screens/HoleScreen';
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
        holeNumber: 1,
        courseId: 'course-1',
        teeColor: 'Blue',
        roundId: 'round-1',
      },
    }),
  };
});

// Mock AsyncStorage and storage service
jest.mock('../../services/storage', () => ({
  loadData: jest.fn(),
  saveData: jest.fn(() => Promise.resolve()),
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
        distance: 0,
      }));
  });

  return holes;
};

describe('HoleScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock default course and round data
    const mockCourse: Course = {
      id: 'course-1',
      name: 'Test Course',
      teeColors: ['Blue', 'White'],
      holes: createEmptyHoles(),
    };

    const mockRound: Round = {
      id: 'round-1',
      date: new Date().toISOString(),
      courseId: 'course-1',
      teeColor: 'Blue',
      shots: [],
      totalStrokes: 0,
      completed: false,
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
  });

  it('renders correctly with hole data form when no data exists', async () => {
    const { getByText, getByPlaceholderText } = render(<HoleScreen />);

    await waitFor(() => {
      expect(getByText('Hole 1')).toBeTruthy();
      expect(getByText('Hole Data')).toBeTruthy();
      expect(getByPlaceholderText('Enter distance')).toBeTruthy();
      expect(getByText('Par:')).toBeTruthy();
      expect(getByText('3')).toBeTruthy();
      expect(getByText('4')).toBeTruthy();
      expect(getByText('5')).toBeTruthy();
      expect(getByText('Set Hole Data')).toBeTruthy();
    });
  });

  it('shows error when trying to set hole data without distance', async () => {
    const { getByText } = render(<HoleScreen />);

    await waitFor(() => {
      const setButton = getByText('Set Hole Data');
      fireEvent.press(setButton);
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Please enter a valid distance');
    });
  });

  it('shows error when trying to set hole data without par', async () => {
    const { getByText, getByPlaceholderText } = render(<HoleScreen />);

    await waitFor(() => {
      const distanceInput = getByPlaceholderText('Enter distance');
      fireEvent.changeText(distanceInput, '350');

      const setButton = getByText('Set Hole Data');
      fireEvent.press(setButton);
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Please select par for this hole');
    });
  });

  it('saves hole data and creates first shot when data is valid', async () => {
    // Use specific mock implementation for this test
    (saveData as jest.Mock).mockImplementation(() => {
      // Deliberately return a delayed promise to give time for assertions
      return new Promise((resolve) => {
        setTimeout(() => resolve(undefined), 50);
      });
    });

    const { getByText, getByPlaceholderText } = render(<HoleScreen />);

    // Wait for initial render
    await waitFor(() => expect(getByText('Hole Data')).toBeTruthy());

    // Fill out the hole data form
    const distanceInput = getByPlaceholderText('Enter distance');
    act(() => {
      fireEvent.changeText(distanceInput, '350');
    });

    const parButton = getByText('4');
    act(() => {
      fireEvent.press(parButton);
    });

    // Press the Set Hole Data button
    const setButton = getByText('Set Hole Data');
    act(() => {
      fireEvent.press(setButton);
    });

    // Wait for saveData to be called
    await waitFor(
      () => {
        expect(saveData).toHaveBeenCalled();
      },
      { timeout: 3000 }
    );

    // Wait for transition to shot entry screen
    await waitFor(
      () => {
        expect(getByText('Shots')).toBeTruthy();
      },
      { timeout: 3000 }
    );
  });

  it('shows error when trying to add shot without distance to hole', async () => {
    // Mock hole with data already set
    (loadData as jest.Mock).mockImplementation((key: string) => {
      if (key === STORAGE_KEYS.COURSES) {
        const mockCourse: Course = {
          id: 'course-1',
          name: 'Test Course',
          teeColors: ['Blue'],
          holes: createEmptyHoles(),
        };
        // Set distance for first hole on Blue tees
        mockCourse.holes.Blue[0].distance = 350;

        return Promise.resolve([mockCourse]);
      }
      if (key === STORAGE_KEYS.ROUNDS) {
        return Promise.resolve([
          {
            id: 'round-1',
            date: new Date().toISOString(),
            courseId: 'course-1',
            teeColor: 'Blue',
            shots: [],
            totalStrokes: 0,
            completed: false,
          },
        ]);
      }
      return Promise.resolve(null);
    });

    const { getByText } = render(<HoleScreen />);

    await waitFor(() => {
      // Should have transitioned to shot entry
      expect(getByText('Shots')).toBeTruthy();

      // Try to add shot without distance
      const addButton = getByText('Add Shot');
      fireEvent.press(addButton);

      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Please enter a valid distance to hole');
    });
  });

  it('navigates to next hole when hole is completed', async () => {
    // Mock a completed hole
    (loadData as jest.Mock).mockImplementation((key: string) => {
      if (key === STORAGE_KEYS.COURSES) {
        const mockCourse: Course = {
          id: 'course-1',
          name: 'Test Course',
          teeColors: ['Blue'],
          holes: createEmptyHoles(),
        };
        // Set distance for all holes on Blue tees
        mockCourse.holes.Blue.forEach((hole) => {
          hole.distance = 350;
        });

        return Promise.resolve([mockCourse]);
      }
      if (key === STORAGE_KEYS.ROUNDS) {
        const completedShot: Shot = {
          id: 'shot-1',
          holeNumber: 1,
          shotNumber: 1,
          lie: 'Tee',
          distanceToHole: 350,
          distanceTraveled: 350,
          completed: true,
        };
        return Promise.resolve([
          {
            id: 'round-1',
            date: new Date().toISOString(),
            courseId: 'course-1',
            teeColor: 'Blue',
            shots: [completedShot],
            totalStrokes: 1,
            completed: false,
          },
        ]);
      }
      return Promise.resolve(null);
    });

    const { getByText } = render(<HoleScreen />);

    await waitFor(() => {
      // Should show Next Hole button
      const nextButton = getByText('Next Hole');
      fireEvent.press(nextButton);

      // Should navigate to next hole
      expect(mockNavigate).toHaveBeenCalledWith('HoleScreen', {
        holeNumber: 2,
        courseId: 'course-1',
        teeColor: 'Blue',
        roundId: 'round-1',
      });
    });
  });

  it('navigates to summary screen after hole 18', async () => {
    // Mock route for hole 18
    jest.spyOn(require('@react-navigation/native'), 'useRoute').mockReturnValue({
      params: {
        holeNumber: 18,
        courseId: 'course-1',
        teeColor: 'Blue',
        roundId: 'round-1',
      },
    });

    // Mock a completed hole 18
    (loadData as jest.Mock).mockImplementation((key: string) => {
      if (key === STORAGE_KEYS.COURSES) {
        const mockCourse: Course = {
          id: 'course-1',
          name: 'Test Course',
          teeColors: ['Blue'],
          holes: createEmptyHoles(),
        };
        // Set distance for all holes on Blue tees
        mockCourse.holes.Blue.forEach((hole) => {
          hole.distance = 350;
        });

        return Promise.resolve([mockCourse]);
      }
      if (key === STORAGE_KEYS.ROUNDS) {
        const completedShot: Shot = {
          id: 'shot-1',
          holeNumber: 18,
          shotNumber: 1,
          lie: 'Tee',
          distanceToHole: 350,
          distanceTraveled: 350,
          completed: true,
        };
        return Promise.resolve([
          {
            id: 'round-1',
            date: new Date().toISOString(),
            courseId: 'course-1',
            teeColor: 'Blue',
            shots: [completedShot],
            totalStrokes: 1,
            completed: false,
          },
        ]);
      }
      return Promise.resolve(null);
    });

    const { getByText } = render(<HoleScreen />);

    await waitFor(() => {
      // Should show View Summary button
      const summaryButton = getByText('View Summary');
      fireEvent.press(summaryButton);

      // Should navigate to summary screen
      expect(mockNavigate).toHaveBeenCalledWith('RoundSummaryScreen', {
        roundId: 'round-1',
      });
    });
  });
});
