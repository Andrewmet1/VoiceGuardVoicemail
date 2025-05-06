import { Platform } from 'react-native';
import Contacts from 'react-native-contacts';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';

// Cache permission status to avoid excessive checks
let contactsPermissionGranted: boolean | null = null;

/**
 * Check and request contacts permission
 * @returns Promise that resolves to true if permission is granted
 */
export const requestContactsPermission = async (): Promise<boolean> => {
  try {
    // Return cached result if available
    if (contactsPermissionGranted !== null) {
      return contactsPermissionGranted;
    }

    const permission = Platform.OS === 'ios'
      ? PERMISSIONS.IOS.CONTACTS
      : PERMISSIONS.ANDROID.READ_CONTACTS;
    
    // Check current permission status
    const result = await check(permission);
    
    if (result !== RESULTS.GRANTED) {
      // Request permission if not granted
      const requestResult = await request(permission);
      contactsPermissionGranted = requestResult === RESULTS.GRANTED;
      return contactsPermissionGranted;
    }
    
    contactsPermissionGranted = true;
    return true;
  } catch (error) {
    console.error('Error requesting contacts permission:', error);
    contactsPermissionGranted = false;
    return false;
  }
};

/**
 * Get contact name from phone number
 * @param phoneNumber - Phone number to look up
 * @returns Contact name if found, null otherwise
 */
export const getContactName = async (phoneNumber: string): Promise<string | null> => {
  try {
    if (!phoneNumber) {
      console.warn('getContactName called with empty phone number');
      return null;
    }

    // Normalize the phone number for comparison
    const normalizedNumber = normalizePhoneNumber(phoneNumber);
    
    // Check permission
    const hasPermission = await requestContactsPermission();
    if (!hasPermission) {
      console.log('Contacts permission not granted');
      return null;
    }
    
    // Get all contacts
    const contacts = await Contacts.getAll();
    
    // Find contact with matching phone number
    for (const contact of contacts) {
      if (contact.phoneNumbers && contact.phoneNumbers.length > 0) {
        for (const phone of contact.phoneNumbers) {
          if (!phone.number) continue;
          
          const contactNumber = normalizePhoneNumber(phone.number);
          if (contactNumber === normalizedNumber) {
            // Return the contact's display name
            return contact.displayName || 
                  `${contact.givenName || ''} ${contact.familyName || ''}`.trim() || 
                  phone.number;
          }
        }
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error getting contact name:', error);
    return null;
  }
};

/**
 * Get all contacts
 * @returns Array of contacts
 */
export const getAllContacts = async (): Promise<any[]> => {
  try {
    // Check permission
    const hasPermission = await requestContactsPermission();
    if (!hasPermission) {
      console.log('Contacts permission not granted');
      return [];
    }
    
    // Get all contacts
    const contacts = await Contacts.getAll();
    return contacts;
  } catch (error) {
    console.error('Error getting all contacts:', error);
    return [];
  }
};

/**
 * Normalize a phone number for comparison
 * @param phoneNumber - Phone number to normalize
 * @returns Normalized phone number (digits only)
 */
export const normalizePhoneNumber = (phoneNumber: string): string => {
  if (!phoneNumber) return '';
  // Remove all non-digit characters
  return phoneNumber.replace(/\D/g, '');
};

/**
 * Format a phone number for display
 * @param phoneNumber - Phone number to format
 * @returns Formatted phone number
 */
export const formatPhoneNumber = (phoneNumber: string): string => {
  if (!phoneNumber) return '';
  
  // Normalize first
  const normalized = normalizePhoneNumber(phoneNumber);
  if (normalized.length === 0) return phoneNumber;
  
  // Format based on length and country
  if (normalized.length === 10) {
    // US format: (XXX) XXX-XXXX
    return `(${normalized.substring(0, 3)}) ${normalized.substring(3, 6)}-${normalized.substring(6)}`;
  } else if (normalized.length === 11 && normalized.startsWith('1')) {
    // US with country code: +1 (XXX) XXX-XXXX
    return `+1 (${normalized.substring(1, 4)}) ${normalized.substring(4, 7)}-${normalized.substring(7)}`;
  } else {
    // Generic international format
    return `+${normalized}`;
  }
};

/**
 * Get contact photo URI
 * @param contact - Contact object
 * @returns Photo URI if available, null otherwise
 */
export const getContactPhotoUri = (contact: any): string | null => {
  try {
    if (!contact) return null;
    
    if (contact.thumbnailPath) {
      return contact.thumbnailPath;
    } else if (contact.hasThumbnail) {
      // On iOS, we might need to use the contact ID to get the thumbnail
      if (Platform.OS === 'ios' && contact.recordID) {
        return `contact-thumbnail://${contact.recordID}`;
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error getting contact photo URI:', error);
    return null;
  }
};
