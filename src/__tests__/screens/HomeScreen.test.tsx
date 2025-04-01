import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import HomeScreen from '../../screens/HomeScreen';
import { loadData } from '../../services/storage';
import { Round } from '../../types';

// Mock navigation
const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => {
  return {
    ...jest.requireActual('@react-navigation/native'),
    useNavigation: () => ({
      navigate: mockNavigate,
    }),
  };
});

// Mock AsyncStorage and storage service
jest.mock('../../services/storage', () => ({
  loadData: jest.fn(() => Promise.resolve([])),
  STORAGE_KEYS: {
    ROUNDS: 'bit_by_bit_rounds',
  },
}));

describe('HomeScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly with title and Start Round button', async () => {
    const { getByText } = render(<HomeScreen />);

    // Check that the component renders the title and button
    await waitFor(() => {
      expect(getByText('Bit by Bit')).toBeTruthy();
      expect(getByText('Start Round')).toBeTruthy();
    });
  });

  it('displays "No recent rounds" when no data is available', async () => {
    // Explicitly mock empty rounds data
    (loadData as jest.Mock).mockResolvedValueOnce([]);

    const { getByText } = render(<HomeScreen />);

    // Wait for component to render with empty state
    await waitFor(() => {
      expect(getByText('No recent rounds')).toBeTruthy();
    });
  });

  it('displays recent rounds when data is available', async () => {
    // Mock data for rounds
    const mockRounds: Round[] = [
      {
        id: '1',
        date: new Date().toISOString(),
        courseId: 'course-1',
        teeColor: 'Blue',
        shots: [],
        totalStrokes: 75,
        completed: true,
      },
    ];

    // Mock loadData to return rounds
    (loadData as jest.Mock).mockResolvedValueOnce(mockRounds);

    const { getByText } = render(<HomeScreen />);

    // Wait for component to render with data
    await waitFor(() => {
      expect(getByText('Recent Rounds')).toBeTruthy();
    });
  });

  it('navigates to StartRoundScreen when Start Round button is pressed', async () => {
    const { getByText } = render(<HomeScreen />);

    // Wait for button to be rendered
    await waitFor(() => {
      expect(getByText('Start Round')).toBeTruthy();
    });

    // Press the button
    const startButton = getByText('Start Round');
    fireEvent.press(startButton);

    // Check that we navigated to the correct screen
    expect(mockNavigate).toHaveBeenCalledWith('StartRoundScreen');
  });
});
