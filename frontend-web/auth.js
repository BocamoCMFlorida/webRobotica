import AsyncStorage from '@react-native-async-storage/async-storage';

// Función para hacer login y guardar token y role en AsyncStorage
export async function login(username, password) {
  const formData = new FormData();
  formData.append('username', username);
  formData.append('password', password);

  const response = await fetch('http://localhost:8000/login', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.detail || 'Login failed');
  }

  const data = await response.json();

  // Guardar token y rol en AsyncStorage
  await AsyncStorage.setItem('access_token', data.access_token);
  await AsyncStorage.setItem('user_role', data.role); // Asumo que la API devuelve el role

  return data;
}

// Función para registrar usuario
export async function register(username, password, email) {
  const formData = new FormData();
  formData.append('username', username);
  formData.append('password', password);
  formData.append('email', email);

  const response = await fetch('http://localhost:8000/register', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.detail || 'Registration failed');
  }

  const data = await response.json();
  return data;
}

// Función para cerrar sesión: llama al endpoint logout y limpia almacenamiento local
export async function logout() {
  try {
    const token = await AsyncStorage.getItem('access_token');
    if (!token) {
      throw new Error('No token found');
    }

    const response = await fetch('http://localhost:8000/logout', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.detail || 'Logout failed');
    }

    // Eliminar token y otros datos locales
    await AsyncStorage.multiRemove(['access_token', 'user_role', 'user_info']);
  } catch (error) {
    console.error('Error al cerrar sesión:', error);
    throw error;
  }
}