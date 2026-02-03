import 'react-native-url-polyfill/auto';
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Platform, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Import AuthContext directly - it handles platform differences internally
import { AuthProvider } from './screens/Auth/AuthContext';

import Home from './screens/Home';
import LinkScreen from './screens/link';
import Login from './screens/Auth/Login';
import Signup from './screens/Auth/Signup';

// Use simplified error monitoring for better Expo Go compatibility
let errorMonitor, setupGlobalErrorHandlers, crashDetector, setupAutoRecovery, getSystemStatus;

try {
  const errorModule = require('./utils/simpleErrorMonitoring');
  errorMonitor = errorModule.errorMonitor;
  setupGlobalErrorHandlers = errorModule.setupGlobalErrorHandlers;
  crashDetector = errorModule.crashDetector;
  setupAutoRecovery = errorModule.setupAutoRecovery;
  getSystemStatus = errorModule.getSystemStatus;
  console.log('[App] Using simplified error monitoring');
} catch (error) {
  console.log('[App] Error monitoring not available, continuing without it');
}

const Stack = createNativeStackNavigator();

// Error Boundary Component
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error using error monitoring system if available
    if (errorMonitor) {
      errorMonitor.logError(error, 'App Error Boundary', {
        componentStack: errorInfo.componentStack,
        isFatal: true
      });
    } else {
      console.error('[App Error Boundary]:', error, errorInfo);
    }

    // Check if we're in a crash state
    const isCrashState = crashDetector ? crashDetector.isCrashState() : false;
    if (isCrashState) {
      console.log('[App Error Boundary] Crash state detected, attempting recovery');
      this.attemptRecovery();
    }

    this.setState({
      error: error,
      errorInfo: errorInfo,
      isCrashState
    });
  }

  handleRetry = async () => {
    console.log('[App Error Boundary] Manual retry triggered');
    
    // Try to recover first
    if (this.state.isCrashState) {
      await this.attemptRecovery();
    }
    
    this.setState({ hasError: false, error: null, errorInfo: null, isCrashState: false });
  };

  attemptRecovery = async () => {
    console.log('[App Error Boundary] Attempting automatic recovery');
    
    if (!crashDetector) {
      console.log('[App Error Boundary] Crash detection not available, basic retry');
      this.setState({ isCrashState: false });
      return true;
    }
    
    const recovered = await crashDetector.attemptRecovery();
    
    if (recovered) {
      console.log('[App Error Boundary] Recovery successful');
      this.setState({ isCrashState: false });
    } else {
      console.log('[App Error Boundary] Recovery failed, showing recovery options');
    }
    
    return recovered;
  };

  render() {
    if (this.state.hasError) {
      const isCrashState = this.state.isCrashState;
      
      return (
        <View style={styles.errorContainer}>
          <View style={styles.errorContent}>
            <Text style={[
              styles.errorTitle,
              isCrashState && styles.crashTitle
            ]}>
              {isCrashState ? 'App Needs Recovery' : 'Oops! Something went wrong'}
            </Text>
            
            <Text style={styles.errorMessage}>
              {isCrashState 
                ? 'The app has encountered multiple errors and is attempting to recover.'
                : 'The app encountered an unexpected error. Please try again.'
              }
            </Text>
            
            {isCrashState && (
              <View style={styles.recoveryInfo}>
                <Text style={styles.recoveryText}>
                  Automatic recovery is being attempted...
                </Text>
                <TouchableOpacity 
                  style={styles.refreshButton} 
                  onPress={() => window.location.reload()}
                >
                  <Text style={styles.refreshButtonText}>Refresh App</Text>
                </TouchableOpacity>
              </View>
            )}
            
            {__DEV__ && this.state.error && (
              <View style={styles.debugInfo}>
                <Text style={styles.debugTitle}>Debug Information:</Text>
                <Text style={styles.debugText}>
                  {this.state.error.message}
                </Text>
                {this.state.errorInfo && (
                  <Text style={styles.debugText} numberOfLines={5}>
                    {this.state.errorInfo.componentStack}
                  </Text>
                )}
                <Text style={styles.debugText}>
                  Crash State: {isCrashState ? 'Yes' : 'No'}
                </Text>
                {getSystemStatus && (
                  <Text style={styles.debugText}>
                    System Status: {JSON.stringify(getSystemStatus(), null, 2)}
                  </Text>
                )}
              </View>
            )}
            
            <TouchableOpacity style={styles.retryButton} onPress={this.handleRetry}>
              <Text style={styles.retryButtonText}>
                {isCrashState ? 'Force Recovery' : 'Try Again'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

// Main App Component
function AppContent() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <Stack.Navigator 
          initialRouteName="Home" 
          screenOptions={{ headerShown: false }}
        >
          <Stack.Screen name="Home" component={Home} />
          <Stack.Screen name="Link" component={LinkScreen} />
          <Stack.Screen name="Login" component={Login} />
          <Stack.Screen name="Signup" component={Signup} />
        </Stack.Navigator>
      </NavigationContainer>
    </AuthProvider>
  );
}

export default function App() {
  // Initialize error monitoring and global error handlers if available
  React.useEffect(() => {
    console.log('[App] Starting app initialization');
    
    if (setupGlobalErrorHandlers) {
      console.log('[App] Setting up global error handlers');
      setupGlobalErrorHandlers();
    }
    
    if (setupAutoRecovery) {
      console.log('[App] Setting up auto-recovery');
      setupAutoRecovery();
    }
    
    // Log app initialization
    if (errorMonitor) {
      errorMonitor.logError(
        new Error('App initialized successfully'),
        'App Initialization',
        { platform: Platform.OS, timestamp: new Date().toISOString() }
      );
    } else {
      console.log('[App] App initialized successfully (no error monitoring)');
    }

    // Log system status
    if (getSystemStatus) {
      console.log('[App] System status:', getSystemStatus());
    }
  }, []);

  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorContent: {
    backgroundColor: '#fff',
    padding: 30,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    maxWidth: 400,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#dc3545',
    marginBottom: 12,
    textAlign: 'center',
  },
  crashTitle: {
    color: '#ff6b35',
  },
  errorMessage: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 24,
  },
  recoveryInfo: {
    backgroundColor: '#fff3cd',
    padding: 15,
    borderRadius: 8,
    width: '100%',
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
  },
  recoveryText: {
    fontSize: 14,
    color: '#856404',
    marginBottom: 12,
    textAlign: 'center',
  },
  refreshButton: {
    backgroundColor: '#ffc107',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  refreshButtonText: {
    color: '#212529',
    fontSize: 14,
    fontWeight: '600',
  },
  debugInfo: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 8,
    width: '100%',
    marginBottom: 20,
  },
  debugTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#495057',
    marginBottom: 8,
  },
  debugText: {
    fontSize: 12,
    color: '#6c757d',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  retryButton: {
    backgroundColor: '#007bff',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});