// Error Monitoring and Logging System
import { Platform } from 'react-native';

class ErrorMonitor {
  constructor() {
    this.errors = [];
    this.maxErrors = 100; // Keep only last 100 errors
  }

  // Log error with context
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

    // Add to errors array
    this.errors.push(errorInfo);

    // Keep only last maxErrors
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(-this.maxErrors);
    }

    return errorInfo;
  }

  // Get recent errors
  getRecentErrors(count = 10) {
    return this.errors.slice(-count);
  }

  // Clear error log
  clearErrors() {
    this.errors = [];
  }

  // Get error summary
  getErrorSummary() {
    const summary = {};
    this.errors.forEach(error => {
      const key = `${error.context}: ${error.code || error.message}`;
      summary[key] = (summary[key] || 0) + 1;
    });
    return summary;
  }

  // Check if app is in error state
  isInErrorState() {
    const recentErrors = this.getRecentErrors(5);
    return recentErrors.length >= 3; // Consider error state if 3+ recent errors
  }
}

// Global error monitor instance
export const errorMonitor = new ErrorMonitor();

// Performance monitoring
export class PerformanceMonitor {
  constructor() {
    this.metrics = {};
  }

  // Start timing an operation
  startTimer(operation) {
    this.metrics[operation] = {
      startTime: Date.now(),
      endTime: null,
      duration: null
    };
  }

  // End timing an operation
  endTimer(operation) {
    if (this.metrics[operation]) {
      this.metrics[operation].endTime = Date.now();
      this.metrics[operation].duration = 
        this.metrics[operation].endTime - this.metrics[operation].startTime;
      
      console.log(`[Performance] ${operation}: ${this.metrics[operation].duration}ms`);
      
      // Log warning if operation takes too long
      if (this.metrics[operation].duration > 3000) {
        errorMonitor.logError(
          new Error(`Slow operation detected: ${operation}`),
          'Performance',
          { duration: this.metrics[operation].duration }
        );
      }
    }
  }

  // Get performance metrics
  getMetrics() {
    return this.metrics;
  }

  // Clear metrics
  clearMetrics() {
    this.metrics = {};
  }
}

export const performanceMonitor = new PerformanceMonitor();

// Network error handler
export const handleNetworkError = (error, context) => {
  const networkErrors = {
    'NETWORK_ERROR': 'Network connection failed. Please check your internet connection.',
    'TIMEOUT': 'Request timed out. Please try again.',
    'SERVER_ERROR': 'Server error. Please try again later.',
    'OFFLINE': 'You appear to be offline. Please check your connection.'
  };

  let message = networkErrors[error.code] || error.message || 'Network error occurred';
  
  errorMonitor.logError(error, context, {
    type: 'network',
    isOnline: navigator.onLine
  });

  return message;
};

// Firebase error handler
export const handleFirebaseError = (error, context) => {
  const firebaseErrors = {
    'auth/user-not-found': 'No account found with this email.',
    'auth/wrong-password': 'Incorrect password.',
    'auth/email-already-in-use': 'An account with this email already exists.',
    'auth/weak-password': 'Password should be at least 6 characters.',
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/invalid-credential': 'Invalid email or password.',
    'auth/too-many-requests': 'Too many attempts. Please try again later.',
    'auth/network-request-failed': 'Network error. Please check your connection.',
    'firestore/permission-denied': 'Permission denied. You may not have access to this data.',
    'firestore/unavailable': 'Firestore service is currently unavailable.',
    'firestore/deadline-exceeded': 'Request timed out. Please try again.'
  };

  let message = firebaseErrors[error.code] || error.message || 'Firebase error occurred';
  
  errorMonitor.logError(error, context, {
    type: 'firebase',
    code: error.code
  });

  return message;
};

// Component error boundary helper
export const withErrorBoundary = (WrappedComponent, fallbackMessage = 'Something went wrong') => {
  return class extends React.Component {
    constructor(props) {
      super(props);
      this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
      return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
      errorMonitor.logError(error, 'Component Error Boundary', {
        componentStack: errorInfo.componentStack
      });
    }

    render() {
      if (this.state.hasError) {
        return (
          <div style={{ padding: 20, textAlign: 'center' }}>
            <h3>{fallbackMessage}</h3>
            <p>Please refresh the page and try again.</p>
            {__DEV__ && (
              <details style={{ marginTop: 20, textAlign: 'left' }}>
                <summary>Error Details</summary>
                <pre>{this.state.error?.stack}</pre>
              </details>
            )}
          </div>
        );
      }

      return <WrappedComponent {...this.props} />;
    }
  };
};

// Global error handler setup
export const setupGlobalErrorHandlers = () => {
  // Handle unhandled promise rejections
  if (typeof window !== 'undefined') {
    window.addEventListener('unhandledrejection', (event) => {
      errorMonitor.logError(
        new Error(event.reason),
        'Unhandled Promise Rejection',
        { promise: event.promise }
      );
    });

    // Handle uncaught errors
    window.addEventListener('error', (event) => {
      errorMonitor.logError(
        event.error || new Error(event.message),
        'Uncaught Error',
        { filename: event.filename, lineno: event.lineno, colno: event.colno }
      );
    });
  }
};

export default {
  errorMonitor,
  performanceMonitor,
  handleNetworkError,
  handleFirebaseError,
  withErrorBoundary,
  setupGlobalErrorHandlers
};
