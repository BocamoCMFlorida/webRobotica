import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { View, Text, ActivityIndicator, StyleSheet, Alert } from 'react-native';

import LoginScreen from './LoginScreen';
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
  const [role, setRole] = useState(null);
  const [username, setUsername] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    async function loadSession() {
      try {
        const savedRole = await AsyncStorage.getItem('user_role');
        const savedUsername = await AsyncStorage.getItem('username');

        if (savedRole) {
          setRole(savedRole);
          setUsername(savedUsername || 'Usuario');
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }
      } catch (e) {
        console.error('Error al cargar sesión:', e);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    }
    loadSession();
  }, []);

  // Esta función borra sesión y resetea estados
  const handleLogout = async () => {
    try {
      await AsyncStorage.multiRemove(['user_role', 'username', 'user_info']);
      setRole(null);
      setUsername(null);
      setIsAuthenticated(false);
      Alert.alert('Sesión cerrada', 'Has cerrado sesión exitosamente');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      Alert.alert('Error', 'No se pudo cerrar sesión correctamente');
    }
  };

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <Stack.Screen
            name="Login"
            options={{ title: 'Iniciar Sesión' }}
          >
            {(props) => (
              <LoginScreen
                {...props}
                setRole={setRole}
                setUsername={setUsername}
                setIsAuthenticated={setIsAuthenticated}
              />
            )}
          </Stack.Screen>
        ) : (
          <>
            {role === 'admin' ? (
              <Stack.Screen
                name="AdminDashboard"
                options={{ title: 'Dashboard Admin' }}
              >
                {(props) => (
                  <AdminDashboard
                    {...props}
                    username={username}
                    onLogout={handleLogout}
                  />
                )}
              </Stack.Screen>
            ) : (
              <Stack.Screen
                name="StudentDashboard"
                options={{ title: 'Dashboard Estudiante' }}
              >
                {(props) => (
                  <StudentDashboard
                    {...props}
                    username={username}
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
