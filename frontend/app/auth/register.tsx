import { useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, View, ScrollView, Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

// Helper for localhost
const API_URL = Platform.select({
  android: 'http://10.0.2.2:8080',
  ios: 'http://localhost:8080',
  default: 'http://localhost:8080',
});

type UserType = 'INDIVIDUAL' | 'INSTITUTION';
type UserIntent = 'GIVER' | 'ADOPTER';

export default function RegisterScreen() {
  const router = useRouter();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [userType, setUserType] = useState<UserType>('INDIVIDUAL');
  const [userIntent, setUserIntent] = useState<UserIntent>('ADOPTER');

  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name || !email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);

    // Logic: If Institution, intent must be GIVER (handled by frontend logic mostly, but good to be explicit)
    const finalIntent = userType === 'INSTITUTION' ? 'GIVER' : userIntent;

    try {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          password,
          userType,
          userIntent: finalIntent,
        }),
      });

      if (response.ok) {
        Alert.alert('Success', 'Account created! Please login.');
        router.push('/(tabs)/profile'); 
      } else {
        const errorData = await response.json().catch(() => ({}));
        Alert.alert('Registration Failed', errorData.message || 'Something went wrong');
      }
    } catch (error) {
      Alert.alert('Error', 'Network request failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.scroll}>
       <ThemedView style={styles.container}>
        <ThemedText type="title" style={styles.title}>Create Account</ThemedText>

        <View style={styles.formGroup}>
          <ThemedText style={styles.label}>Name</ThemedText>
          <TextInput 
            style={styles.input} 
            value={name} 
            onChangeText={setName} 
            placeholder="John Doe" 
            placeholderTextColor="#999"
          />
        </View>

        <View style={styles.formGroup}>
          <ThemedText style={styles.label}>Email</ThemedText>
          <TextInput 
            style={styles.input} 
            value={email} 
            onChangeText={setEmail} 
            placeholder="john@example.com" 
            keyboardType="email-address"
            autoCapitalize="none"
            placeholderTextColor="#999"
          />
        </View>

        <View style={styles.formGroup}>
          <ThemedText style={styles.label}>Password</ThemedText>
          <TextInput 
            style={styles.input} 
            value={password} 
            onChangeText={setPassword} 
            secureTextEntry 
            placeholder="******" 
            placeholderTextColor="#999"
          />
        </View>

        <View style={styles.divider} />

        <View style={styles.formGroup}>
          <ThemedText style={styles.label}>I am a(n):</ThemedText>
          <View style={styles.radioGroup}>
            <TouchableOpacity 
              style={[styles.radioBtn, userType === 'INDIVIDUAL' && styles.radioBtnSelected]}
              onPress={() => setUserType('INDIVIDUAL')}
            >
              <ThemedText style={userType === 'INDIVIDUAL' ? styles.textSelected : styles.textUnselected}>Individual</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.radioBtn, userType === 'INSTITUTION' && styles.radioBtnSelected]}
              onPress={() => setUserType('INSTITUTION')}
            >
              <ThemedText style={userType === 'INSTITUTION' ? styles.textSelected : styles.textUnselected}>Institution</ThemedText>
            </TouchableOpacity>
          </View>
        </View>

        {userType === 'INDIVIDUAL' && (
          <View style={styles.formGroup}>
            <ThemedText style={styles.label}>My goal is to:</ThemedText>
            <View style={styles.radioGroup}>
              <TouchableOpacity 
                style={[styles.radioBtn, userIntent === 'ADOPTER' && styles.radioBtnSelected]}
                onPress={() => setUserIntent('ADOPTER')}
              >
                <ThemedText style={userIntent === 'ADOPTER' ? styles.textSelected : styles.textUnselected}>Adopt a Pet</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.radioBtn, userIntent === 'GIVER' && styles.radioBtnSelected]}
                onPress={() => setUserIntent('GIVER')}
              >
                <ThemedText style={userIntent === 'GIVER' ? styles.textSelected : styles.textUnselected}>Rehome a Pet</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {userType === 'INSTITUTION' && (
           <ThemedText style={styles.hint}>
             Note: Institutions are registered as pet providers (Rehoming) by default.
           </ThemedText>
        )}

        <TouchableOpacity 
          style={[styles.submitBtn, loading && styles.disabledBtn]} 
          onPress={handleRegister}
          disabled={loading}
        >
          <ThemedText style={styles.submitBtnText}>{loading ? 'Creating...' : 'Register'}</ThemedText>
        </TouchableOpacity>

      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: '#fff', 
  },
  container: {
    padding: 24,
    flex: 1,
    minHeight: '100%',
  },
  title: {
    marginBottom: 32,
    marginTop: 40,
    fontSize: 28,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    marginBottom: 8,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 10,
  },
  radioGroup: {
    flexDirection: 'row',
    gap: 12,
  },
  radioBtn: {
    flex: 1,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioBtnSelected: {
    backgroundColor: '#10b981', // emerald-500
    borderColor: '#10b981',
  },
  textSelected: {
    color: '#fff',
    fontWeight: 'bold',
  },
  textUnselected: {
    color: '#333',
  },
  hint: {
    fontSize: 13,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 20,
  },
  submitBtn: {
    backgroundColor: '#059669', // emerald-600
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  disabledBtn: {
    opacity: 0.7,
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
