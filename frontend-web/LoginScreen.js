import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LoginScreen = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Configuración de tu API - ajusta la URL según tu servidor
  const API_BASE_URL = 'http://localhost:8000'; // Cambia por tu IP si usas dispositivo físico

  const handleLogin = async () => {
    // Validaciones básicas
    if (!username.trim()) {
      Alert.alert('Error', 'Por favor ingresa tu nombre de usuario');
      return;
    }

    if (!password.trim()) {
      Alert.alert('Error', 'Por favor ingresa tu contraseña');
      return;
    }

    setLoading(true);

    try {
      // Crear datos como URLSearchParams para application/x-www-form-urlencoded
      const formData = new URLSearchParams();
      formData.append('username', username.trim());
      formData.append('password', password);

      const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      const data = await response.json();

      if (response.ok) {
        // Login exitoso
        const { access_token, token_type } = data;
        
        // Guardar token en AsyncStorage
        await AsyncStorage.setItem('access_token', access_token);
        await AsyncStorage.setItem('token_type', token_type);
        
        // Obtener información del usuario
        const userInfo = await getUserInfo(access_token);
        if (userInfo) {
          await AsyncStorage.setItem('user_info', JSON.stringify(userInfo));
          
          Alert.alert(
            'Éxito', 
            `¡Bienvenido ${userInfo.username}!`,
            [
              {
                text: 'OK',
                onPress: () => {
                  // Navegar según el tipo de usuario
                  if (userInfo.is_admin) {
                    navigation.replace('AdminDashboard');
                  } else {
                    navigation.replace('StudentDashboard');
                  }
                }
              }
            ]
          );
        }
      } else {
        // Error en login
        Alert.alert(
          'Error de autenticación',
          data.detail || 'Usuario o contraseña incorrectos'
        );
      }
    } catch (error) {
      console.error('Error en login:', error);
      Alert.alert(
        'Error de conexión',
        'No se pudo conectar con el servidor. Verifica tu conexión a internet.'
      );
    } finally {
      setLoading(false);
    }
  };

  const getUserInfo = async (token) => {
    try {
      const response = await fetch(`${API_BASE_URL}/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch (error) {
      console.error('Error obteniendo información del usuario:', error);
      return null;
    }
  };

  const navigateToRegister = () => {
    navigation.navigate('Register');
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.formContainer}>
          {/* Logo o título */}
          <View style={styles.headerContainer}>
            <Text style={styles.title}>Sistema de Tareas</Text>
            <Text style={styles.subtitle}>Iniciar Sesión</Text>
          </View>

          {/* Formulario */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Nombre de Usuario</Text>
            <TextInput
              style={styles.input}
              placeholder="Ingresa tu usuario"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Contraseña</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Ingresa tu contraseña"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowPassword(!showPassword)}
                disabled={loading}
              >
                <Text style={styles.eyeText}>
                  {showPassword ? '🙈' : '👁️'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Botón de login */}
          <TouchableOpacity
            style={[styles.loginButton, loading && styles.disabledButton]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.loginButtonText}>Iniciar Sesión</Text>
            )}
          </TouchableOpacity>

          {/* Credenciales de prueba */}
          <View style={styles.testCredentials}>
            <Text style={styles.testTitle}>Credenciales de prueba:</Text>
            <Text style={styles.testText}>Admin: admin / admin123</Text>
            <Text style={styles.testText}>
              (Crea estudiantes desde el registro)
            </Text>
          </View>

          {/* Link a registro */}
          <TouchableOpacity
            style={styles.registerLink}
            onPress={navigateToRegister}
            disabled={loading}
          >
            <Text style={styles.registerLinkText}>
              ¿No tienes cuenta? Regístrate aquí
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  formContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fafafa',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fafafa',
  },
  passwordInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
  },
  eyeButton: {
    padding: 12,
  },
  eyeText: {
    fontSize: 18,
  },
  loginButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  disabledButton: {
    backgroundColor: '#cccccc',
  },
  loginButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  testCredentials: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#f0f8ff',
    borderRadius: 8,
    alignItems: 'center',
  },
  testTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  testText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  registerLink: {
    alignItems: 'center',
    marginTop: 20,
    padding: 10,
  },
  registerLinkText: {
    color: '#007AFF',
    fontSize: 16,
    textDecorationLine: 'underline',
  },
});

export default LoginScreen;