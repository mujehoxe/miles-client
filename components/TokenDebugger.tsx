import { useEffect, useState } from 'react';
import { View, Text, Button, Alert } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { jwtDecode } from 'jwt-decode';

export default function TokenDebugger() {
  const [tokenInfo, setTokenInfo] = useState<string>('Checking...');

  useEffect(() => {
    checkToken();
  }, []);

  const checkToken = async () => {
    try {
      const token = await SecureStore.getItemAsync('userToken');
      
      if (!token) {
        setTokenInfo('❌ No token found in storage');
        return;
      }

      const parts = token.split('.');
      
      if (parts.length !== 3) {
        setTokenInfo(`❌ JWT malformed - has ${parts.length} parts instead of 3`);
        return;
      }

      try {
        const decoded = jwtDecode(token);
        const now = Math.floor(Date.now() / 1000);
        const exp = decoded.exp as number;
        
        const info = [
          '✅ Token structure is valid',
          `📅 Expires: ${new Date(exp * 1000).toLocaleString()}`,
          `⏳ Time until expiry: ${Math.floor((exp - now) / 60)} minutes`,
          exp < now ? '❌ Token is EXPIRED' : '✅ Token is not expired'
        ].join('\n');
        
        setTokenInfo(info);
      } catch (decodeError) {
        setTokenInfo(`❌ JWT decode failed: ${(decodeError as Error).message}`);
      }
    } catch (error) {
      setTokenInfo(`❌ Error: ${(error as Error).message}`);
    }
  };

  const clearToken = async () => {
    await SecureStore.deleteItemAsync('userToken');
    await SecureStore.deleteItemAsync('refreshToken');
    setTokenInfo('🧹 Tokens cleared');
    Alert.alert('Success', 'Tokens cleared. Please login again.');
  };

  return (
    <View style={{ padding: 20, backgroundColor: '#f5f5f5', margin: 10, borderRadius: 8 }}>
      <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 10 }}>
        Token Debug Info:
      </Text>
      <Text style={{ fontFamily: 'monospace', fontSize: 12, marginBottom: 15 }}>
        {tokenInfo}
      </Text>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Button title="Refresh Check" onPress={checkToken} />
        <Button title="Clear Tokens" onPress={clearToken} color="red" />
      </View>
    </View>
  );
}
