import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { View, Text, ActivityIndicator, StyleSheet, Alert, TouchableOpacity } from 'react-native';

import LoginScreen from './LoginScreen';
import RegisterScreen from './RegisterScreen';
// import AdminDashboard from './AdminDashboard';
// import StudentDashboard from './StudentDashboard';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Stack = createStackNavigator();

// Componente de carga
const LoadingScreen = () => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color="#007AFF" />
    <Text style={styles.loadingText}>Cargando...</Text>
  </View>
);

// Componente temporal para probar
const TempDashboard = ({ role, onLogout }) => (
  <View style={styles.tempContainer}>
    <Text style={styles.tempTitle}>¡Login Exitoso!</Text>
    <Text style={styles.tempText}>Rol: {role}</Text>
    <Text style={styles.tempText}>Dashboard Temporal</Text>
    <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
      <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
    </TouchableOpacity>
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
        console.log('=== INICIANDO CARGA DE SESIÓN ===');
        const savedToken = await AsyncStorage.getItem('access_token');
        const savedRole = await AsyncStorage.getItem('user_role');
        
        console.log('Token guardado:', savedToken ? 'PRESENTE' : 'AUSENTE');
        console.log('Rol guardado:', savedRole || 'AUSENTE');
        
        if (savedToken && savedRole) {
          console.log('RESTAURANDO SESIÓN...');
          setToken(savedToken);
          setRole(savedRole);
          setIsAuthenticated(true);
          console.log('SESIÓN RESTAURADA');
        } else {
          console.log('NO HAY SESIÓN GUARDADA');
          setIsAuthenticated(false);
        }
      } catch (e) {
        console.error('ERROR AL CARGAR SESIÓN:', e);
      } finally {
        setLoading(false);
        console.log('CARGA DE SESIÓN FINALIZADA');
      }
    }
    loadSession();
  }, []);

  // Función para cerrar sesión
  const handleLogout = async () => {
    try {
      console.log('=== CERRANDO SESIÓN ===');
      await AsyncStorage.multiRemove(['access_token', 'user_role', 'user_info']);
      setToken(null);
      setRole(null);
      setIsAuthenticated(false);
      console.log('SESIÓN CERRADA');
      Alert.alert('Sesión cerrada', 'Has cerrado sesión exitosamente');
    } catch (error) {
      console.error('ERROR AL CERRAR SESIÓN:', error);
    }
  };

  // Log para debugging
  useEffect(() => {
    console.log('=== ESTADO ACTUAL ===');
    console.log('Loading:', loading);
    console.log('Token:', token ? 'PRESENTE' : 'NULL');
    console.log('Role:', role || 'NULL');
    console.log('IsAuthenticated:', isAuthenticated);
    console.log('===================');
  }, [token, role, loading, isAuthenticated]);

  console.log('=== RENDERIZANDO APP ===');
  console.log('Loading:', loading, 'Token:', !!token, 'Role:', role, 'IsAuth:', isAuthenticated);

  if (loading) {
    console.log('MOSTRANDO PANTALLA DE CARGA');
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    console.log('MOSTRANDO STACK DE AUTENTICACIÓN');
  } else {
    console.log('MOSTRANDO DASHBOARD PARA ROL:', role);
  }

  return (
    <NavigationContainer>
      <Stack.Navigator 
        screenOptions={{
          headerShown: true,
        }}
      >
        {!isAuthenticated ? (
          // Stack de autenticación
          <>
            <Stack.Screen 
              name="Login"
              options={{ title: 'Iniciar Sesión' }}
            >
              {(props) => {
                console.log('RENDERIZANDO LOGIN SCREEN');
                return (
                  <LoginScreen 
                    {...props} 
                    setToken={setToken} 
                    setRole={setRole}
                    setIsAuthenticated={setIsAuthenticated}
                  />
                );
              }}
            </Stack.Screen>
            <Stack.Screen 
              name="Register" 
              component={RegisterScreen}
              options={{ 
                title: 'Registro',
                headerBackTitle: 'Volver'
              }} 
            />
          </>
        ) : (
          // Stack principal - usando componente temporal
          <Stack.Screen 
            name="Dashboard"
            options={{ title: `Dashboard - ${role}` }}
          >
            {(props) => {
              console.log('RENDERIZANDO DASHBOARD TEMPORAL');
              return (
                <TempDashboard
                  {...props}
                  role={role}
                  onLogout={handleLogout}
                />
              );
            }}
          </Stack.Screen>
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
  tempContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  tempTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  tempText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 10,
    textAlign: 'center',
  },
  logoutButton: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 30,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});