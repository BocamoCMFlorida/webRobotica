import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function AdminDashboard({ navigation, setToken, setRole }) {
  const handleLogout = async () => {
    await AsyncStorage.clear();
    setToken(null);
    setRole(null);
    Alert.alert('Sesión cerrada', 'Has cerrado sesión correctamente.');
    navigation.replace('Login');
  };

  const [username, setUsername] = React.useState('');

  React.useEffect(() => {
    async function loadUser() {
      const userInfo = await AsyncStorage.getItem('user_info');
      if (userInfo) {
        const user = JSON.parse(userInfo);
        setUsername(user.username);
      }
    }
    loadUser();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Hola, {username}</Text>
      <Text style={styles.subtitle}>Bienvenido al Panel de Administración</Text>

      <TouchableOpacity style={styles.button} onPress={handleLogout}>
        <Text style={styles.buttonText}>Cerrar Sesión</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 20, 
    backgroundColor: '#fff' 
  },
  title: { 
    fontSize: 28, 
    fontWeight: 'bold', 
    marginBottom: 10 
  },
  subtitle: { 
    fontSize: 18, 
    marginBottom: 40, 
    color: '#666' 
  },
  button: {
    backgroundColor: '#FF3B30',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  buttonText: { 
    color: '#fff', 
    fontSize: 16, 
    fontWeight: 'bold' 
  },
});
