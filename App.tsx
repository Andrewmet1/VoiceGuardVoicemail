import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar, View, Text, StyleSheet, Platform } from 'react-native';
import Config from 'react-native-config';

// Screens
import HomeScreen from './src/screens/HomeScreen';
import CallHistoryScreen from './src/screens/CallHistoryScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import CallAlertScreen from './src/screens/CallAlertScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import CallScanScreen from './src/screens/CallScanScreen';

// Contexts
import { SettingsProvider, useSettings } from './src/contexts/SettingsContext';
import { CallDetectionProvider } from './src/contexts/CallDetectionContext';

// Utils
import appInitializer from './src/utils/appInitializer';

// Components
import IconFix from './src/components/IconFix';

// Error boundary component
interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, errorMessage: '' };
  
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    console.error('ErrorBoundary caught an error:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
    });
    return { hasError: true, errorMessage: error.toString() };
  }
  
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('App crashed with details:', {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      componentStack: errorInfo.componentStack,
    });
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Something went wrong!</Text>
          <Text style={styles.errorMessage}>{this.state.errorMessage}</Text>
        </View>
      );
    }
    return this.props.children;
  }
}

export type RootStackParamList = {
  Home: undefined;
  Settings: undefined;
  Onboarding: undefined;
  CallAlert: { callerId: string };
  CallScan: { phoneNumber?: string };
  CallHistory: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

// Safe context provider wrapper
const SafeContextProvider: React.FC<{
  children: React.ReactNode;
  ProviderComponent: React.ComponentType<any>;
  providerProps?: any;
  name: string;
}> = ({ children, ProviderComponent, providerProps = {}, name }) => {
  try {
    return (
      <ErrorBoundary>
        <ProviderComponent {...providerProps}>
          {children}
        </ProviderComponent>
      </ErrorBoundary>
    );
  } catch (error) {
    console.error(`Error in ${name} provider:`, error);
    return <>{children}</>;
  }
};

// Main navigation component that checks onboarding status
const MainNavigator: React.FC = () => {
  const { settings, isLoading } = useSettings();
  
  // Show loading screen while settings are being loaded
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading VoiceGuard...</Text>
      </View>
    );
  }
  
  // Determine initial route based on onboarding status
  const initialRoute = settings.onboardingCompleted ? 'Home' : 'Onboarding';
  
  return (
    <Stack.Navigator
      initialRouteName={initialRoute}
      screenOptions={{
        headerStyle: {
          backgroundColor: '#4F46E5',
          elevation: 0, // Remove shadow on Android
          shadowOpacity: 0, // Remove shadow on iOS
          borderBottomWidth: 0, // Remove the bottom border
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        cardStyle: {
          backgroundColor: '#FFFFFF', // Set background color for screens
        },
        // Use proper header height with status bar
        headerStatusBarHeight: Platform.OS === 'ios' ? 44 : StatusBar.currentHeight,
      }}
    >
      <Stack.Screen 
        name="Onboarding" 
        component={OnboardingScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="Home" 
        component={HomeScreen}
        options={{ title: 'VoiceGuard', headerShown: false }}
      />
      <Stack.Screen 
        name="CallHistory" 
        component={CallHistoryScreen}
        options={{ title: 'Call History' }}
      />
      <Stack.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{ title: 'Settings', headerShown: false }}
      />
      <Stack.Screen 
        name="CallAlert" 
        component={CallAlertScreen}
        options={{ title: 'Call Alert' }}
      />
      <Stack.Screen 
        name="CallScan" 
        component={CallScanScreen}
        options={{ title: 'Call Scan', headerShown: false }}
      />
    </Stack.Navigator>
  );
};

function AppContent() {
  // Ensure environment variables are available or provide defaults
  const [envReady, setEnvReady] = useState(false);
  const [envError, setEnvError] = useState<string | null>(null);
  
  // Use a single useEffect for initialization to avoid hook ordering issues
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Log platform info for debugging
        console.log(`Platform: ${Platform.OS} ${Platform.Version}`);
        
        // Initialize app components
        await appInitializer.initializeApp();
        
        // If VOICEGUARD_API_URL is missing, provide a default
        if (!Config?.VOICEGUARD_API_URL) {
          console.warn('VOICEGUARD_API_URL not found in environment, using default');
          // Default will be handled by the service
        }
        
        // Mark environment as ready
        setEnvReady(true);
      } catch (error) {
        console.error('Error initializing environment:', error);
        setEnvError(error instanceof Error ? error.message : String(error));
        // Continue anyway to avoid blocking the app
        setEnvReady(true);
      }
    };

    // Run initialization
    initializeApp();
    
    // No cleanup needed
    return () => {};
  }, []);
  
  // Render loading screen or error screen or main app
  if (!envReady) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading VoiceGuard...</Text>
      </View>
    );
  }
  
  if (envError) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Environment Error</Text>
        <Text style={styles.errorMessage}>{envError}</Text>
        <Text style={styles.errorHint}>The app will continue with default settings</Text>
      </View>
    );
  }
  
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor="#4F46E5" />
      <View style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
        <IconFix />
        <SafeContextProvider ProviderComponent={SettingsProvider} name="SettingsProvider">
          <SafeContextProvider ProviderComponent={CallDetectionProvider} name="CallDetectionProvider">
            <NavigationContainer>
              <MainNavigator />
            </NavigationContainer>
          </SafeContextProvider>
        </SafeContextProvider>
      </View>
    </SafeAreaProvider>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F9FAFB',
  },
  errorText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#EF4444',
    marginBottom: 10,
  },
  errorMessage: {
    fontSize: 16,
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 20,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#EF4444',
    marginBottom: 12,
  },
  errorHint: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    fontSize: 18,
    color: '#4F46E5',
    fontWeight: '600',
  },
});

export default App;
