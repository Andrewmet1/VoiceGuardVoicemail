/**
 * Permissions Handler Utility
 * Handles requesting and checking permissions for the VoiceGuard app
 */

import { Platform, Alert } from 'react-native';
import { 
  request, 
  check, 
  PERMISSIONS, 
  RESULTS, 
  Permission,
  openSettings
} from 'react-native-permissions';

// Define permission types
export enum PermissionType {
  MICROPHONE = 'microphone',
  CONTACTS = 'contacts',
}

// Map permission types to platform-specific permission keys
const permissionMap: Record<PermissionType, Permission> = {
  [PermissionType.MICROPHONE]: Platform.select({
    ios: PERMISSIONS.IOS.MICROPHONE,
    android: PERMISSIONS.ANDROID.RECORD_AUDIO,
  }) as Permission,
  [PermissionType.CONTACTS]: Platform.select({
    ios: PERMISSIONS.IOS.CONTACTS,
    android: PERMISSIONS.ANDROID.READ_CONTACTS,
  }) as Permission,
};

// Permission descriptions for alerts
const permissionDescriptions: Record<PermissionType, string> = {
  [PermissionType.MICROPHONE]: 'VoiceGuard needs microphone access to analyze voice patterns during speakerphone calls.',
  [PermissionType.CONTACTS]: 'VoiceGuard needs contacts access to identify known vs. unknown callers.',
};

/**
 * Check if a permission is granted
 * @param permissionType The type of permission to check
 * @returns Promise<boolean> True if permission is granted, false otherwise
 */
export const checkPermission = async (permissionType: PermissionType): Promise<boolean> => {
  try {
    const permission = permissionMap[permissionType];
    if (!permission) {
      console.warn(`Permission type ${permissionType} not found in map`);
      return false;
    }

    const result = await check(permission);
    return result === RESULTS.GRANTED;
  } catch (error) {
    console.error(`Error checking ${permissionType} permission:`, error);
    return false;
  }
};

/**
 * Request a permission with proper user messaging
 * @param permissionType The type of permission to request
 * @param showSettings Whether to show settings option if denied
 * @returns Promise<boolean> True if permission is granted, false otherwise
 */
export const requestPermission = async (
  permissionType: PermissionType,
  showSettings: boolean = true
): Promise<boolean> => {
  try {
    const permission = permissionMap[permissionType];
    if (!permission) {
      console.warn(`Permission type ${permissionType} not found in map`);
      return false;
    }

    console.log(`Requesting ${permissionType} permission...`);
    const result = await request(permission);
    console.log(`${permissionType} permission result:`, result);

    if (result === RESULTS.GRANTED) {
      return true;
    }

    // If denied or blocked and we should show settings option
    if (showSettings && (result === RESULTS.DENIED || result === RESULTS.BLOCKED)) {
      Alert.alert(
        `${permissionType.charAt(0).toUpperCase() + permissionType.slice(1)} Permission Required`,
        `${permissionDescriptions[permissionType]} Please enable it in your device settings.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Open Settings', 
            onPress: () => openSettings().catch(() => console.warn('Cannot open settings'))
          }
        ]
      );
    }

    return false;
  } catch (error) {
    console.error(`Error requesting ${permissionType} permission:`, error);
    return false;
  }
};

/**
 * Request multiple permissions at once
 * @param permissionTypes Array of permission types to request
 * @returns Promise<Record<PermissionType, boolean>> Object with permission results
 */
export const requestMultiplePermissions = async (
  permissionTypes: PermissionType[]
): Promise<Record<PermissionType, boolean>> => {
  const results: Record<PermissionType, boolean> = {} as Record<PermissionType, boolean>;

  for (const permissionType of permissionTypes) {
    results[permissionType] = await requestPermission(permissionType, false);
  }

  // Show settings alert if any permission is denied
  const deniedPermissions = Object.entries(results)
    .filter(([_, granted]) => !granted)
    .map(([type]) => type);

  if (deniedPermissions.length > 0) {
    Alert.alert(
      'Permissions Required',
      'Some permissions are required for VoiceGuard to function properly. Please enable them in your device settings.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Open Settings', 
          onPress: () => openSettings().catch(() => console.warn('Cannot open settings'))
        }
      ]
    );
  }

  return results;
};

/**
 * Request all permissions needed for the app
 * @returns Promise<boolean> True if all critical permissions are granted
 */
export const requestAllPermissions = async (): Promise<boolean> => {
  const results = await requestMultiplePermissions([
    PermissionType.MICROPHONE,
    PermissionType.CONTACTS,
  ]);

  // Microphone is critical for the app to function
  return results[PermissionType.MICROPHONE];
};
