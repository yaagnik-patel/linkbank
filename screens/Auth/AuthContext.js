import React, { createContext, useState, useContext, useEffect } from "react";
import { Platform } from "react-native";
import auth, { GoogleAuthProvider } from "@react-native-firebase/auth";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { GOOGLE_WEB_CLIENT_ID } from "../../config/googleAuth";

const AuthContext = createContext();

// Error logger function
const logError = (error, context) => {
  console.error(`[AuthContext Error - ${context}]:`, {
    message: error.message,
    code: error.code,
    stack: error.stack,
    platform: Platform.OS,
    timestamp: new Date().toISOString(),
  });
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Initialize Google Sign-In and handle user state changes
  useEffect(() => {
    let unsubscribe;

    const initializeAuth = async () => {
      try {
        // Configure Google Sign-In only on native platforms and if available
        if (Platform.OS !== "web" && GoogleSignin) {
          try {
            await GoogleSignin.configure({
              webClientId: GOOGLE_WEB_CLIENT_ID,
              offlineAccess: false,
            });
            console.log("[AuthContext] Google Sign-In configured successfully");
          } catch (configError) {
            logError(configError, "Google Sign-In Configuration");
            // Don't throw here, just log and continue
          }
        } else if (Platform.OS !== "web") {
          console.log(
            "[AuthContext] Google Sign-In not available, continuing without it"
          );
        }

        unsubscribe = auth().onAuthStateChanged((userState) => {
          try {
            setUser(userState);
            setInitializing(false);
            setAuthError(null); // Clear any previous errors
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
        setAuthError("Failed to initialize authentication");
        setInitializing(false);
      }
    };

    initializeAuth();

    return () => {
      if (typeof unsubscribe === "function") {
        unsubscribe();
      }
    };
  }, []);

  const login = async (email, password) => {
    try {
      setAuthError(null);
      console.log("[AuthContext] Attempting login for:", email);

      if (!email || !password) {
        const error = new Error("Email and password are required");
        logError(error, "Login Validation");
        throw error;
      }

      await auth().signInWithEmailAndPassword(email, password);
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

      const userCredential = await auth().createUserWithEmailAndPassword(
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

      if (!GoogleSignin) {
        const error = new Error(
          "Google Sign-In is not available on this device"
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

      const credential = GoogleAuthProvider.credential(idToken);
      await auth().signInWithCredential(credential);
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

      try {
        if (Platform.OS !== "web" && GoogleSignin) {
          await GoogleSignin.signOut();
        }
      } catch (googleSignOutError) {
        logError(googleSignOutError, "Google Sign-Out");
        // Continue with Firebase logout even if Google sign-out fails
      }

      await auth().signOut();
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

      const currentUser = auth().currentUser;
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
