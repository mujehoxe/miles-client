import { Ionicons } from "@expo/vector-icons";
import * as SecureStore from "expo-secure-store";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const { width } = Dimensions.get("window");

interface LoginPageProps {
  onLoginSuccess: (token: string) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [fadeAnim] = useState(new Animated.Value(0));
  const [logoError, setLogoError] = useState(false);

  // Force light mode colors
  const backgroundColor = "#ffffff";
  const textColor = "#000000";
  const tintColor = "#176298"; // Miles primary color

  // Use the high-quality SVG-generated Miles logo
  const logoSource = require("../assets/images/miles-logo-mobile-hq.png");

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      setEmailError("Email is required");
      return false;
    }
    if (!emailRegex.test(email)) {
      setEmailError("Please enter a valid email address");
      return false;
    }

    setEmailError("");
    return true;
  };

  const validatePassword = (password: string) => {
    if (!password) {
      setPasswordError("Password is required");
      return false;
    }
    if (password.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      return false;
    }

    setPasswordError("");
    return true;
  };

  const handleLogin = async () => {
    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);

    if (!isEmailValid || !isPasswordValid) {
      return;
    }

    setIsLoading(true);

    try {
      const loginUrl = `${process.env.EXPO_PUBLIC_BASE_URL?.replace(/\/$/, "")}/api/users/login`;
      const requestHeaders = {
        "Content-Type": "application/json",
      };
      const requestBody = { email, password };

      const response = await fetch(loginUrl, {
        method: "POST",
        headers: requestHeaders,
        body: JSON.stringify(requestBody),
      });

      const result = await response.json();

      if (result.success) {
        // Store refresh token if provided
        if (result.refreshToken) {
          await SecureStore.setItemAsync("refreshToken", result.refreshToken);
        }
        onLoginSuccess(result.token);
      } else {
        const errorMessage =
          result.message || "Invalid email or password. Please try again.";
        Alert.alert("Login Failed", errorMessage, [
          { text: "OK", style: "default" },
        ]);
      }
    } catch (error) {
      console.error(error);

      Alert.alert(
        "Connection Error",
        "Unable to connect to the server. Please check your internet connection and try again.",
        [{ text: "OK", style: "default" }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {/* Logo/Brand Section */}
        <View style={styles.brandSection}>
          {!logoError ? (
            <Image
              source={logoSource}
              style={styles.logo}
              resizeMode="contain"
              accessibilityLabel="Miles Homes Real Estate Logo"
              onError={() => {
                setLogoError(true);
              }}
            />
          ) : (
            <View style={styles.fallbackLogoContainer}>
              <Ionicons name="business" size={50} color={tintColor} />
              <Text style={[styles.fallbackTitle, { color: textColor }]}>
                Miles CRM
              </Text>
            </View>
          )}
          <Text style={[styles.brandSubtitle, { color: textColor + "80" }]}>
            Welcome back
          </Text>
        </View>

        {/* Form Section */}
        <View style={styles.formSection}>
          <View style={styles.inputContainer}>
            <View
              style={[
                styles.inputWrapper,
                emailError ? styles.inputError : null,
              ]}
            >
              <Ionicons
                name="mail-outline"
                size={20}
                color={tintColor}
                style={styles.inputIcon}
              />
              <TextInput
                style={[styles.input, { color: textColor }]}
                placeholder="Email address"
                placeholderTextColor={textColor + "60"}
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (emailError) validateEmail(text);
                }}
                onBlur={() => validateEmail(email)}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                accessibilityLabel="Email input"
                accessibilityHint="Enter your email address"
              />
            </View>
            {emailError ? (
              <Text style={styles.errorText}>{emailError}</Text>
            ) : null}
          </View>

          <View style={styles.inputContainer}>
            <View
              style={[
                styles.inputWrapper,
                passwordError ? styles.inputError : null,
              ]}
            >
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color={tintColor}
                style={styles.inputIcon}
              />
              <TextInput
                style={[styles.input, { color: textColor }]}
                placeholder="Password"
                placeholderTextColor={textColor + "60"}
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (passwordError) validatePassword(text);
                }}
                onBlur={() => validatePassword(password)}
                secureTextEntry={!showPassword}
                accessibilityLabel="Password input"
                accessibilityHint="Enter your password"
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeIcon}
                accessibilityLabel={
                  showPassword ? "Hide password" : "Show password"
                }
              >
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color={tintColor}
                />
              </TouchableOpacity>
            </View>
            {passwordError ? (
              <Text style={styles.errorText}>{passwordError}</Text>
            ) : null}
          </View>

          {/* Login Button */}
          <TouchableOpacity
            style={[styles.loginButton, { backgroundColor: tintColor }]}
            onPress={handleLogin}
            disabled={isLoading}
            accessibilityLabel="Login button"
            accessibilityHint="Tap to sign in to your account"
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.loginButtonText}>Sign In</Text>
            )}
          </TouchableOpacity>

          {/* Forgot Password */}
          <TouchableOpacity
            style={styles.forgotPassword}
            accessibilityLabel="Forgot password link"
          >
            <Text style={[styles.forgotPasswordText, { color: tintColor }]}>
              Forgot your password?
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: "center",
  },
  brandSection: {
    alignItems: "center",
    marginBottom: 50,
  },
  logo: {
    width: width * 0.6, // 60% of screen width for crisp 200x47 logo
    height: 55, // Optimized height for the SVG-generated logo
    marginBottom: 20,
  },
  fallbackLogoContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  fallbackTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 8,
  },
  brandSubtitle: {
    fontSize: 16,
    opacity: 0.7,
    marginTop: 8,
  },
  formSection: {
    width: "100%",
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#E1E5E9",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  inputError: {
    borderColor: "#FF6B6B",
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 4,
  },
  eyeIcon: {
    padding: 4,
  },
  errorText: {
    color: "#FF6B6B",
    fontSize: 12,
    marginTop: 4,
    marginLeft: 16,
  },
  loginButton: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  loginButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  forgotPassword: {
    alignItems: "center",
    marginTop: 20,
  },
  forgotPasswordText: {
    fontSize: 14,
    fontWeight: "500",
  },
});

export default LoginPage;
