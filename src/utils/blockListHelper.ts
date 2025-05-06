import AsyncStorage from '@react-native-async-storage/async-storage';

const BLOCK_LIST_KEY = 'voiceguard_block_list';

/**
 * Add a phone number to the block list
 */
export const addToBlockList = async (phoneNumber: string): Promise<boolean> => {
  try {
    if (!phoneNumber) {
      console.warn('Attempted to add empty phone number to block list');
      return false;
    }
    
    const blockList = await getBlockList();
    if (!blockList.includes(phoneNumber)) {
      blockList.push(phoneNumber);
      await AsyncStorage.setItem(BLOCK_LIST_KEY, JSON.stringify(blockList));
      console.log(`Added ${phoneNumber} to block list`);
    } else {
      console.log(`${phoneNumber} is already in block list`);
    }
    return true;
  } catch (error) {
    console.error('Failed to add number to block list:', error);
    // Don't throw, just return false to indicate failure
    return false;
  }
};

/**
 * Remove a phone number from the block list
 */
export const removeFromBlockList = async (phoneNumber: string): Promise<boolean> => {
  try {
    if (!phoneNumber) {
      console.warn('Attempted to remove empty phone number from block list');
      return false;
    }
    
    const blockList = await getBlockList();
    const updatedList = blockList.filter(num => num !== phoneNumber);
    await AsyncStorage.setItem(BLOCK_LIST_KEY, JSON.stringify(updatedList));
    console.log(`Removed ${phoneNumber} from block list`);
    return true;
  } catch (error) {
    console.error('Failed to remove number from block list:', error);
    // Don't throw, just return false to indicate failure
    return false;
  }
};

/**
 * Get the current block list
 */
export const getBlockList = async (): Promise<string[]> => {
  try {
    const list = await AsyncStorage.getItem(BLOCK_LIST_KEY);
    if (!list) {
      return [];
    }
    
    try {
      const parsed = JSON.parse(list);
      if (Array.isArray(parsed)) {
        return parsed;
      } else {
        console.warn('Block list is not an array, resetting');
        await AsyncStorage.setItem(BLOCK_LIST_KEY, JSON.stringify([]));
        return [];
      }
    } catch (parseError) {
      console.error('Failed to parse block list:', parseError);
      // Reset the block list if it's corrupted
      await AsyncStorage.setItem(BLOCK_LIST_KEY, JSON.stringify([]));
      return [];
    }
  } catch (error) {
    console.error('Failed to get block list:', error);
    return [];
  }
};

/**
 * Check if a number is blocked
 */
export const isNumberBlocked = async (phoneNumber: string): Promise<boolean> => {
  try {
    if (!phoneNumber) {
      return false;
    }
    
    const blockList = await getBlockList();
    return blockList.includes(phoneNumber);
  } catch (error) {
    console.error('Failed to check if number is blocked:', error);
    return false;
  }
};
