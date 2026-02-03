import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useRef,
} from "react";
import { Platform } from "react-native";
import { GOOGLE_WEB_CLIENT_ID } from "../../config/googleAuth";

const AuthContext = createContext();

// Error logger function
const logError = (error, context) => {
  console.error(`[AuthContext Error - ${context}]:`, {
    message: error?.message,
    code: error?.code,
    stack: error?.stack,
    platform: Platform.OS,
    timestamp: new Date().toISOString(),
  });
};

// Lazy-load native auth modules only on native (avoids crash at app startup)
function getNativeAuth() {
  if (Platform.OS === "web")
    return { auth: null, GoogleAuthProvider: null, GoogleSignin: null };
  try {
    const firebaseAuth = require("@react-native-firebase/auth");
    const googleSignin = require("@react-native-google-signin/google-signin");
    return {
      auth: firebaseAuth.default,
      GoogleAuthProvider: firebaseAuth.GoogleAuthProvider,
      GoogleSignin: googleSignin.GoogleSignin,
    };
  } catch (e) {
    logError(e, "Native Auth Module Load");
    return { auth: null, GoogleAuthProvider: null, GoogleSignin: null };
  }
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);
  const [authError, setAuthError] = useState(null);
  const authRef = useRef(null);
  const GoogleSigninRef = useRef(null);
  const GoogleAuthProviderRef = useRef(null);

  // Defer auth init so native app is fully ready (reduces startup crash risk)
  useEffect(() => {
    let unsubscribe;
    let cancelled = false;

    const initTimer = setTimeout(() => {
      const initializeAuth = async () => {
        try {
          const { auth, GoogleAuthProvider, GoogleSignin } = getNativeAuth();

          if (Platform.OS !== "web") {
            authRef.current = auth;
            GoogleSigninRef.current = GoogleSignin;
            GoogleAuthProviderRef.current = GoogleAuthProvider;
          }

          if (Platform.OS === "web") {
            setInitializing(false);
            return;
          }

          if (!auth) {
            setAuthError(
              "Authentication could not be loaded. Please restart the app."
            );
            setInitializing(false);
            return;
          }

          if (GoogleSignin) {
            try {
              await GoogleSignin.configure({
                webClientId: GOOGLE_WEB_CLIENT_ID,
                offlineAccess: false,
              });
              console.log(
                "[AuthContext] Google Sign-In configured successfully"
              );
            } catch (configError) {
              logError(configError, "Google Sign-In Configuration");
            }
          }

          if (cancelled) return;
          unsubscribe = auth().onAuthStateChanged((userState) => {
            try {
              if (cancelled) return;
              setUser(userState);
              setInitializing(false);
              setAuthError(null);
              console.log(
                "[AuthContext] Auth state changed:",
                userState ? "User logged in" : "User logged out"
              );
            } catch (stateError) {
              logError(stateError, "Auth State Change");
              setAuthError("Failed to update authentication state");
            }
          });
        } catch (initError) {
          logError(initError, "Auth Initialization");
          setAuthError(
            "Authentication failed to start. Please restart the app."
          );
          setInitializing(false);
        }
      };

      initializeAuth();
    }, 200);

    return () => {
      cancelled = true;
      clearTimeout(initTimer);
      if (typeof unsubscribe === "function") {
        unsubscribe();
      }
    };
  }, []);

  const getAuth = () => authRef.current?.() ?? null;

  const login = async (email, password) => {
    try {
      setAuthError(null);
      console.log("[AuthContext] Attempting login for:", email);

      if (!email || !password) {
        const error = new Error("Email and password are required");
        logError(error, "Login Validation");
        throw error;
      }

      const authInstance = getAuth();
      if (!authInstance)
        throw new Error("Authentication is not ready. Please try again.");
      await authInstance.signInWithEmailAndPassword(email, password);
      console.log("[AuthContext] Login successful");
    } catch (e) {
      logError(e, "Login");
      setAuthError(getUserFriendlyErrorMessage(e));
      throw e;
    }
  };

  const register = async (email, password, name) => {
    try {
      setAuthError(null);
      console.log("[AuthContext] Attempting registration for:", email);

      const authInstance = getAuth();
      if (!authInstance)
        throw new Error("Authentication is not ready. Please try again.");

      if (!email || !password || !name) {
        const error = new Error("Email, password, and name are required");
        logError(error, "Registration Validation");
        throw error;
      }

      if (password.length < 6) {
        const error = new Error("Password must be at least 6 characters");
        logError(error, "Password Validation");
        throw error;
      }

      const userCredential = await authInstance.createUserWithEmailAndPassword(
        email,
        password
      );

      // Update the user's display name
      if (userCredential.user) {
        try {
          await userCredential.user.updateProfile({
            displayName: name,
          });
          console.log("[AuthContext] User profile updated successfully");
        } catch (profileError) {
          logError(profileError, "Profile Update");
          // Don't throw here, user is still created
        }
      }

      console.log("[AuthContext] Registration successful");
      return userCredential.user;
    } catch (e) {
      logError(e, "Registration");
      setAuthError(getUserFriendlyErrorMessage(e));
      throw e;
    }
  };

  const signInWithGoogle = async () => {
    try {
      setAuthError(null);
      console.log("[AuthContext] Attempting Google Sign-In");

      if (Platform.OS === "web") {
        const error = new Error("Google Sign-In is not available on web");
        logError(error, "Google Sign-In Platform Check");
        throw error;
      }

      const GoogleSignin = GoogleSigninRef.current;
      const GoogleAuthProvider = GoogleAuthProviderRef.current;
      const authInstance = getAuth();

      if (!GoogleSignin || !authInstance) {
        const error = new Error(
          "Google Sign-In is not available. Please restart the app."
        );
        logError(error, "Google Sign-In Unavailable");
        throw error;
      }

      try {
        await GoogleSignin.hasPlayServices({
          showPlayServicesUpdateDialog: true,
        });
      } catch (playServicesError) {
        logError(playServicesError, "Google Play Services");
        throw new Error(
          "Google Play Services is not available or needs to be updated"
        );
      }

      const response = await GoogleSignin.signIn();

      if (response.type === "cancelled") {
        const error = new Error("Sign in was cancelled");
        logError(error, "Google Sign-In Cancelled");
        throw error;
      }

      const idToken = response.data?.idToken;
      if (!idToken) {
        const error = new Error(
          "No ID token received. Ensure Web Client ID is configured."
        );
        logError(error, "Google Sign-In Token Missing");
        throw error;
      }

      const credential = GoogleAuthProvider
        ? GoogleAuthProvider.credential(idToken)
        : null;
      if (!credential) throw new Error("Google Sign-In not configured.");
      await authInstance.signInWithCredential(credential);
      console.log("[AuthContext] Google Sign-In successful");
    } catch (e) {
      logError(e, "Google Sign-In");
      setAuthError(getUserFriendlyErrorMessage(e));
      throw e;
    }
  };

  const logout = async () => {
    try {
      setAuthError(null);
      console.log("[AuthContext] Attempting logout");

      const authInstance = getAuth();
      const GoogleSignin = GoogleSigninRef.current;

      try {
        if (Platform.OS !== "web" && GoogleSignin) {
          await GoogleSignin.signOut();
        }
      } catch (googleSignOutError) {
        logError(googleSignOutError, "Google Sign-Out");
      }

      if (authInstance) await authInstance.signOut();
      console.log("[AuthContext] Logout successful");
    } catch (e) {
      logError(e, "Logout");
      setAuthError("Failed to log out. Please try again.");
    }
  };

  const deleteAccount = async () => {
    try {
      setAuthError(null);
      console.log("[AuthContext] Attempting account deletion");

      const authInstance = getAuth();
      if (!authInstance)
        throw new Error("Authentication is not ready. Please try again.");
      const currentUser = authInstance.currentUser;
      if (!currentUser) {
        const error = new Error("No user is currently signed in");
        logError(error, "Delete Account - No User");
        throw error;
      }

      await currentUser.delete();
      console.log("[AuthContext] Account deleted successfully");
    } catch (e) {
      logError(e, "Delete Account");
      setAuthError(getUserFriendlyErrorMessage(e));
      throw e;
    }
  };

  // Helper function to get user-friendly error messages
  const getUserFriendlyErrorMessage = (error) => {
    if (!error) return "An unknown error occurred";

    // Firebase auth error codes
    const errorMessages = {
      "auth/user-not-found": "No account found with this email address.",
      "auth/wrong-password": "Incorrect password. Please try again.",
      "auth/email-already-in-use": "An account with this email already exists.",
      "auth/weak-password": "Password should be at least 6 characters long.",
      "auth/invalid-email": "Please enter a valid email address.",
      "auth/invalid-credential": "Invalid email or password.",
      "auth/too-many-requests":
        "Too many failed attempts. Please try again later.",
      "auth/user-disabled": "This account has been disabled.",
      "auth/requires-recent-login":
        "Please log in again to perform this action.",
      "auth/network-request-failed":
        "Network error. Please check your connection.",
      "auth/popup-closed-by-user": "Sign in was cancelled.",
      "auth/popup-blocked":
        "Popup was blocked. Please allow popups and try again.",
    };

    return (
      errorMessages[error.code] ||
      error.message ||
      "An unexpected error occurred."
    );
  };

  const clearError = () => {
    setAuthError(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        initializing,
        authError,
        login,
        register,
        signInWithGoogle,
        logout,
        deleteAccount,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
