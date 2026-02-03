import React, { createContext, useState, useContext, useEffect } from "react";
import auth, { GoogleAuthProvider } from "@react-native-firebase/auth";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { GOOGLE_WEB_CLIENT_ID } from "../../config/googleAuth";

// Configure Google Sign-In (required for idToken)
GoogleSignin.configure({
  webClientId: GOOGLE_WEB_CLIENT_ID,
});

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);

  // Handle user state changes
  useEffect(() => {
    const subscriber = auth().onAuthStateChanged((userState) => {
      setUser(userState);
      if (initializing) setInitializing(false);
    });
    return subscriber; // unsubscribe on unmount
  }, []);

  const login = async (email, password) => {
    try {
      await auth().signInWithEmailAndPassword(email, password);
    } catch (e) {
      throw e; // Throw error so UI can handle it
    }
  };

  const register = async (email, password, name) => {
    try {
      const userCredential = await auth().createUserWithEmailAndPassword(
        email,
        password
      );
      // Update the user's display name
      if (userCredential.user) {
        await userCredential.user.updateProfile({
          displayName: name,
        });
      }
      return userCredential.user;
    } catch (e) {
      throw e;
    }
  };

  const signInWithGoogle = async () => {
    try {
      await GoogleSignin.hasPlayServices({
        showPlayServicesUpdateDialog: true,
      });
      const response = await GoogleSignin.signIn();
      if (response.type === "cancelled") {
        throw new Error("Sign in was cancelled");
      }
      const idToken = response.data?.idToken;
      if (!idToken)
        throw new Error(
          "No ID token received. Ensure Web Client ID is configured."
        );
      const credential = GoogleAuthProvider.credential(idToken);
      await auth().signInWithCredential(credential);
    } catch (e) {
      throw e;
    }
  };

  const logout = async () => {
    try {
      await GoogleSignin.signOut();
      await auth().signOut();
    } catch (e) {
      console.error(e);
    }
  };

  const deleteAccount = async () => {
    try {
      const currentUser = auth().currentUser;
      if (currentUser) {
        await currentUser.delete();
      }
    } catch (e) {
      console.error(e);
      throw e;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        initializing,
        login,
        register,
        signInWithGoogle,
        logout,
        deleteAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
