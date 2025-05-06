/**
 * @format
 */

import {AppRegistry, LogBox} from 'react-native';
import App from './App';

// Hide the Metro connection banner and other development warnings
LogBox.ignoreAllLogs(true);

// Register the app with the correct name
AppRegistry.registerComponent("VoiceGuardMobile", () => App);
