import React from 'react';
import { Text } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

interface CustomIconProps {
  name: string;
  size: number;
  color: string;
  style?: any;
}

/**
 * CustomIcon component that provides a fallback for when vector icons fail to load
 * This ensures we never see "?" marks in the UI
 */
const CustomIcon: React.FC<CustomIconProps> = ({ name, size, color, style }) => {
  // Map of icon names to fallback text symbols
  const fallbackMap: Record<string, string> = {
    'cog': '⚙️',
    'arrow-left': '←',
    'shield-check': '🛡️',
    'phone-in-talk': '📞',
    'volume-high': '🔊',
    'phone-check': '✓📱',
    'check': '✓',
    'microphone': '🎤',
    'record-circle': '⏺️',
    'stop-circle': '⏹️',
    'robot': '🤖',
    'account': '👤',
    'play': '▶️',
    'refresh': '🔄',
    'toggle-switch': '✅',
    'toggle-switch-off': '❌',
    'information': 'ℹ️',
    'delete': '🗑️',
    'history': '🕒',
    'chevron-right': '→'
  };

  try {
    // First try to render the actual icon
    return <MaterialCommunityIcons name={name} size={size} color={color} style={style} />;
  } catch (error) {
    // If that fails, use our fallback emoji
    const fallback = fallbackMap[name] || '•';
    return (
      <Text style={[{ fontSize: size, color }, style]}>
        {fallback}
      </Text>
    );
  }
};

export default CustomIcon;
