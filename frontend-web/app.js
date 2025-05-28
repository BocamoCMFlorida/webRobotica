import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { View, Text, ActivityIndicator, StyleSheet, Alert } from 'react-native';

import LoginScreen from './LoginScreen';
import RegisterScreen from './RegisterScreen';
import AdminDashboard from './AdminDashboard';
import StudentDashboard from './StudentDashboard';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Stack = createStackNavigator();

const LoadingScreen = () => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color="#007AFF" />
    <Text style={styles.loadingText}>Cargando...</Text>
  </View>
);

export default function App() {
  const [token, setToken] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    async function loadSession() {
      try {
        const savedToken = await AsyncStorage.getItem('access_token');
        const savedRole = await AsyncStorage.getItem('user_role');

        if (savedToken && savedRole) {
          setToken(savedToken);
          setRole(savedRole);
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }
      } catch (e) {
        console.error('Error al cargar sesión:', e);
      } finally {
        setLoading(false);
      }
    }
    loadSession();
  }, []);

  const handleLogout = async () => {
    try {
      await AsyncStorage.multiRemove(['access_token', 'user_role', 'user_info']);
      setToken(null);
      setRole(null);
      setIsAuthenticated(false);
      Alert.alert('Sesión cerrada', 'Has cerrado sesión exitosamente');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: true }}>
        {!isAuthenticated ? (
          <>
            <Stack.Screen 
              name="Login"
              options={{ title: 'Iniciar Sesión' }}
            >
              {(props) => (
                <LoginScreen 
                  {...props}
                  setToken={setToken}
                  setRole={setRole}
                  setIsAuthenticated={setIsAuthenticated}
                />
              )}
            </Stack.Screen>
            <Stack.Screen 
              name="Register"
              component={RegisterScreen}
              options={{ title: 'Registro', headerBackTitle: 'Volver' }}
            />
          </>
        ) : (
          <>
            {role === 'admin' ? (
              <Stack.Screen
                name="AdminDashboard"
                options={{ title: 'Dashboard de Admin' }}
              >
                {(props) => (
                  <AdminDashboard
                    {...props}
                    onLogout={handleLogout}
                  />
                )}
              </Stack.Screen>
            ) : (
              <Stack.Screen
                name="StudentDashboard"
                options={{ title: 'Dashboard de Estudiante' }}
              >
                {(props) => (
                  <StudentDashboard
                    {...props}
                    onLogout={handleLogout}
                  />
                )}
              </Stack.Screen>
            )}
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
});
