import AsyncStorage from '@react-native-async-storage/async-storage';
import { saveData, loadData, deleteData, STORAGE_KEYS } from '../../services/storage';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
}));

describe('Storage Service', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('saveData', () => {
    it('should call AsyncStorage.setItem with correct parameters', async () => {
      const testKey = 'test_key';
      const testData = { id: 1, name: 'Test Data' };

      await saveData(testKey, testData);

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(testKey, JSON.stringify(testData));
    });

    it('should throw error when AsyncStorage.setItem fails', async () => {
      const testKey = 'test_key';
      const testData = { id: 1, name: 'Test Data' };
      const errorMessage = 'Async storage error';

      (AsyncStorage.setItem as jest.Mock).mockRejectedValueOnce(new Error(errorMessage));

      await expect(saveData(testKey, testData)).rejects.toThrow(errorMessage);
    });
  });

  describe('loadData', () => {
    it('should return parsed data when AsyncStorage.getItem returns data', async () => {
      const testKey = 'test_key';
      const testData = { id: 1, name: 'Test Data' };

      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify(testData));

      const result = await loadData(testKey);

      expect(AsyncStorage.getItem).toHaveBeenCalledWith(testKey);
      expect(result).toEqual(testData);
    });

    it('should return null when AsyncStorage.getItem returns null', async () => {
      const testKey = 'test_key';

      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);

      const result = await loadData(testKey);

      expect(AsyncStorage.getItem).toHaveBeenCalledWith(testKey);
      expect(result).toBeNull();
    });

    it('should throw error when AsyncStorage.getItem fails', async () => {
      const testKey = 'test_key';
      const errorMessage = 'Async storage error';

      (AsyncStorage.getItem as jest.Mock).mockRejectedValueOnce(new Error(errorMessage));

      await expect(loadData(testKey)).rejects.toThrow(errorMessage);
    });
  });

  describe('deleteData', () => {
    it('should call AsyncStorage.removeItem with correct key', async () => {
      const testKey = 'test_key';

      await deleteData(testKey);

      expect(AsyncStorage.removeItem).toHaveBeenCalledWith(testKey);
    });

    it('should throw error when AsyncStorage.removeItem fails', async () => {
      const testKey = 'test_key';
      const errorMessage = 'Async storage error';

      (AsyncStorage.removeItem as jest.Mock).mockRejectedValueOnce(new Error(errorMessage));

      await expect(deleteData(testKey)).rejects.toThrow(errorMessage);
    });
  });

  describe('STORAGE_KEYS', () => {
    it('should have correct keys', () => {
      expect(STORAGE_KEYS).toEqual({
        COURSES: 'bit_by_bit_courses',
        ROUNDS: 'bit_by_bit_rounds',
      });
    });
  });
});
