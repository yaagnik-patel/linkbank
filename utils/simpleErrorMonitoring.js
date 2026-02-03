// Simplified Error Monitoring for Expo Go compatibility
import { Platform } from 'react-native';

class SimpleErrorMonitor {
  constructor() {
    this.errors = [];
    this.maxErrors = 50;
  }

  logError(error, context = 'Unknown', additionalData = {}) {
    const errorInfo = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      context,
      message: error.message || 'Unknown error',
      stack: error.stack,
      code: error.code,
      platform: Platform.OS,
      ...additionalData
    };

    console.error(`[Error Monitor - ${context}]:`, errorInfo);

    this.errors.push(errorInfo);
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(-this.maxErrors);
    }

    return errorInfo;
  }

  getRecentErrors(count = 10) {
    return this.errors.slice(-count);
  }

  clearErrors() {
    this.errors = [];
  }

  isCrashState() {
    const recentErrors = this.getRecentErrors(5);
    return recentErrors.length >= 3;
  }
}

// Simple crash detector
class SimpleCrashDetector {
  constructor() {
    this.recoveryAttempts = 0;
    this.maxRecoveryAttempts = 2;
  }

  isCrashState() {
    return simpleErrorMonitor.isCrashState();
  }

  async attemptRecovery() {
    if (this.recoveryAttempts >= this.maxRecoveryAttempts) {
      return false;
    }

    this.recoveryAttempts++;
    console.log(`[SimpleCrashDetector] Recovery attempt ${this.recoveryAttempts}/${this.maxRecoveryAttempts}`);

    // Simple recovery: clear errors and wait
    simpleErrorMonitor.clearErrors();
    await new Promise(resolve => setTimeout(resolve, 1000));

    const recovered = !this.isCrashState();
    if (recovered) {
      this.recoveryAttempts = 0;
      console.log('[SimpleCrashDetector] Recovery successful');
    }

    return recovered;
  }

  resetRecovery() {
    this.recoveryAttempts = 0;
  }
}

const simpleErrorMonitor = new SimpleErrorMonitor();
const simpleCrashDetector = new SimpleCrashDetector();

export {
  simpleErrorMonitor as errorMonitor,
  simpleCrashDetector as crashDetector
};

// Setup functions that work in Expo Go
export const setupGlobalErrorHandlers = () => {
  if (typeof window !== 'undefined') {
    window.addEventListener('unhandledrejection', (event) => {
      simpleErrorMonitor.logError(
        new Error(event.reason),
        'Unhandled Promise Rejection'
      );
    });

    window.addEventListener('error', (event) => {
      simpleErrorMonitor.logError(
        event.error || new Error(event.message),
        'Uncaught Error'
      );
    });
  }
};

export const setupAutoRecovery = () => {
  // Simple auto-recovery check every 30 seconds
  setInterval(async () => {
    if (simpleCrashDetector.isCrashState()) {
      console.log('[AutoRecovery] Crash state detected, attempting recovery');
      await simpleCrashDetector.attemptRecovery();
    }
  }, 30000);
};

export const getSystemStatus = () => {
  return {
    crash: {
      isCrashState: simpleCrashDetector.isCrashState(),
      recoveryAttempts: simpleCrashDetector.recoveryAttempts
    },
    errors: simpleErrorMonitor.getRecentErrors(5),
    timestamp: new Date().toISOString()
  };
};
