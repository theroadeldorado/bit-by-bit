import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys
export const STORAGE_KEYS = {
  COURSES: 'bit_by_bit_courses',
  ROUNDS: 'bit_by_bit_rounds',
};

/**
 * Save data to AsyncStorage
 * @param key The storage key
 * @param value The data to save
 */
export const saveData = async <T>(key: string, value: T): Promise<void> => {
  try {
    const jsonValue = JSON.stringify(value);
    await AsyncStorage.setItem(key, jsonValue);
  } catch (e) {
    console.error('Error saving data', e);
    throw e;
  }
};

/**
 * Load data from AsyncStorage
 * @param key The storage key
 * @returns The loaded data or null if not found
 */
export const loadData = async <T>(key: string): Promise<T | null> => {
  try {
    const jsonValue = await AsyncStorage.getItem(key);
    return jsonValue != null ? JSON.parse(jsonValue) : null;
  } catch (e) {
    console.error('Error loading data', e);
    throw e;
  }
};

/**
 * Delete data from AsyncStorage
 * @param key The storage key
 */
export const deleteData = async (key: string): Promise<void> => {
  try {
    await AsyncStorage.removeItem(key);
  } catch (e) {
    console.error('Error deleting data', e);
    throw e;
  }
};
