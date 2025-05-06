import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

/**
 * This component preloads all the icon fonts to ensure they're available
 * throughout the app. This helps solve the issue of "?" appearing instead
 * of proper icons.
 */
const IconFix: React.FC = () => {
  useEffect(() => {
    // Force load the icon font
    const iconNames = [
      'cog',
      'arrow-left',
      'shield-check',
      'phone-in-talk',
      'volume-high',
      'phone-check',
      'check',
      'microphone',
      'record-circle',
      'stop-circle',
      'robot',
      'account',
      'play',
      'refresh',
      'toggle-switch',
      'toggle-switch-off',
      'information',
      'delete',
      'history',
      'chevron-right'
    ];

    // Pre-load all icons to ensure they're cached
    const loadIcons = async () => {
      try {
        if (Platform.OS === 'ios') {
          // iOS specific fix
          await Promise.all(
            iconNames.map(iconName => 
              MaterialCommunityIcons.getImageSource(iconName, 20, '#000000')
            )
          );
        }
        
        console.log('Icons preloaded successfully');
      } catch (error) {
        console.error('Failed to preload icons:', error);
      }
    };

    loadIcons();
  }, []);

  // This is a utility component that doesn't render anything
  return null;
};

export default IconFix;
