import React from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ViewStyle, 
  TextStyle,
  ActivityIndicator
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors, typography, spacing, borderRadius, shadows } from '../theme/theme';

// Button Component
interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: string;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  disabled = false,
  loading = false,
  style,
  textStyle,
}) => {
  const getButtonStyle = (): ViewStyle => {
    let buttonStyle: ViewStyle = {};
    
    // Variant styles
    switch (variant) {
      case 'primary':
        buttonStyle = {
          backgroundColor: colors.primary,
        };
        break;
      case 'secondary':
        buttonStyle = {
          backgroundColor: colors.secondary,
        };
        break;
      case 'outline':
        buttonStyle = {
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: colors.primary,
        };
        break;
      case 'ghost':
        buttonStyle = {
          backgroundColor: 'transparent',
        };
        break;
    }
    
    // Size styles
    switch (size) {
      case 'sm':
        buttonStyle = {
          ...buttonStyle,
          paddingVertical: spacing.xs,
          paddingHorizontal: spacing.md,
        };
        break;
      case 'md':
        buttonStyle = {
          ...buttonStyle,
          paddingVertical: spacing.sm,
          paddingHorizontal: spacing.lg,
        };
        break;
      case 'lg':
        buttonStyle = {
          ...buttonStyle,
          paddingVertical: spacing.md,
          paddingHorizontal: spacing.xl,
        };
        break;
    }
    
    // Disabled style
    if (disabled) {
      buttonStyle = {
        ...buttonStyle,
        opacity: 0.5,
      };
    }
    
    return buttonStyle;
  };
  
  const getTextStyle = (): TextStyle => {
    let textStyleObj: TextStyle = {};
    
    // Variant text styles
    switch (variant) {
      case 'primary':
      case 'secondary':
        textStyleObj = {
          color: colors.white,
        };
        break;
      case 'outline':
      case 'ghost':
        textStyleObj = {
          color: colors.primary,
        };
        break;
    }
    
    // Size text styles
    switch (size) {
      case 'sm':
        textStyleObj = {
          ...textStyleObj,
          fontSize: typography.fontSize.sm,
        };
        break;
      case 'md':
        textStyleObj = {
          ...textStyleObj,
          fontSize: typography.fontSize.base,
        };
        break;
      case 'lg':
        textStyleObj = {
          ...textStyleObj,
          fontSize: typography.fontSize.lg,
        };
        break;
    }
    
    return textStyleObj;
  };
  
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.button,
        getButtonStyle(),
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator 
          size="small" 
          color={variant === 'primary' || variant === 'secondary' ? colors.white : colors.primary} 
        />
      ) : (
        <View style={styles.buttonContent}>
          {icon && (
            <Icon 
              name={icon} 
              size={size === 'sm' ? 16 : size === 'md' ? 20 : 24} 
              color={variant === 'primary' || variant === 'secondary' ? colors.white : colors.primary}
              style={styles.buttonIcon} 
            />
          )}
          <Text style={[styles.buttonText, getTextStyle(), textStyle]}>
            {title}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

// Card Component
interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  elevation?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  elevation = 'md',
}) => {
  const getShadowStyle = () => {
    switch (elevation) {
      case 'none':
        return shadows.none;
      case 'sm':
        return shadows.sm;
      case 'md':
        return shadows.md;
      case 'lg':
        return shadows.lg;
    }
  };
  
  return (
    <View 
      style={[
        styles.card,
        getShadowStyle(),
        style,
      ]}
    >
      {children}
    </View>
  );
};

// Section Title Component
interface SectionTitleProps {
  title: string;
  style?: TextStyle;
}

export const SectionTitle: React.FC<SectionTitleProps> = ({
  title,
  style,
}) => {
  return (
    <Text style={[styles.sectionTitle, style]}>
      {title}
    </Text>
  );
};

// Checklist Item Component
interface ChecklistItemProps {
  text: string;
  checked: boolean;
  onToggle: () => void;
  disabled?: boolean;
}

export const ChecklistItem: React.FC<ChecklistItemProps> = ({
  text,
  checked,
  onToggle,
  disabled = false,
}) => {
  return (
    <TouchableOpacity 
      style={styles.checklistItem}
      onPress={onToggle}
      disabled={disabled}
    >
      <View style={[
        styles.checkbox,
        checked ? styles.checkboxChecked : {},
        disabled ? { opacity: 0.5 } : {},
      ]}>
        {checked && (
          <Icon name="check" size={16} color={colors.white} />
        )}
      </View>
      <Text style={[
        styles.checklistText,
        disabled ? { opacity: 0.5 } : {},
      ]}>
        {text}
      </Text>
    </TouchableOpacity>
  );
};

// Divider Component
interface DividerProps {
  style?: ViewStyle;
}

export const Divider: React.FC<DividerProps> = ({
  style,
}) => {
  return (
    <View style={[styles.divider, style]} />
  );
};

// Styles
const styles = StyleSheet.create({
  // Button styles
  button: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: borderRadius.md,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontWeight: '600',
    textAlign: 'center',
  },
  buttonIcon: {
    marginRight: spacing.xs,
  },
  
  // Card styles
  card: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginVertical: spacing.md,
  },
  
  // Section title styles
  sectionTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  
  // Checklist item styles
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.sm,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: borderRadius.sm,
    borderWidth: 2,
    borderColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
  },
  checklistText: {
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
    flex: 1,
  },
  
  // Divider styles
  divider: {
    height: 1,
    backgroundColor: colors.gray200,
    marginVertical: spacing.md,
  },
});
