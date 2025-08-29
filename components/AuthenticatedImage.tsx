import React, { useState, useEffect } from 'react';
import { Image, View, StyleSheet } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import Ionicons from '@expo/vector-icons/Ionicons';

interface AuthenticatedImageProps {
  source: { uri: string };
  style?: any;
  className?: string;
  onError?: (error: any) => void;
  onLoad?: () => void;
  fallbackComponent?: React.ReactNode;
}

const AuthenticatedImage: React.FC<AuthenticatedImageProps> = ({
  source,
  style,
  className,
  onError,
  onLoad,
  fallbackComponent
}) => {
  const [imageData, setImageData] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const loadImageWithAuth = async () => {
      try {
        const token = await SecureStore.getItemAsync('userToken');
        if (!token) {
          setError(true);
          onError?.({ message: 'No authentication token' });
          setLoading(false);
          return;
        }

        const response = await fetch(source.uri, {
          method: 'GET',
          headers: {
            'Cookie': `token=${token}`,
            'Accept': 'image/*',
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const blob = await response.blob();
        const reader = new FileReader();
        
        reader.onload = () => {
          setImageData(reader.result as string);
          setLoading(false);
          onLoad?.();
        };
        
        reader.onerror = () => {
          setError(true);
          onError?.({ message: 'Failed to read image data' });
          setLoading(false);
        };
        
        reader.readAsDataURL(blob);
      } catch (err: any) {
        console.error('AuthenticatedImage error:', err);
        setError(true);
        onError?.(err);
        setLoading(false);
      }
    };

    loadImageWithAuth();
  }, [source.uri]);

  if (loading) {
    return (
      <View style={style} className={className || ""} >
        <View style={styles.placeholder}>
          <Ionicons name="person" size={16} color="#9CA3AF" />
        </View>
      </View>
    );
  }

  if (error || !imageData) {
    return fallbackComponent || (
      <View style={style} className={className || ""}>
        <View style={styles.placeholder}>
          <Ionicons name="person" size={16} color="#9CA3AF" />
        </View>
      </View>
    );
  }

  return (
    <Image
      source={{ uri: imageData }}
      style={style}
      className={className || ""}
      onError={(e) => {
        setError(true);
        onError?.(e);
      }}
    />
  );
};

const styles = StyleSheet.create({
  placeholder: {
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default AuthenticatedImage;
