import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://localhost:8000';

export const login = async (username, password) => {
  try {
    console.log('Attempting login for:', username);
    
    const response = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        username: username,
        password: password
      })
    });

    console.log('Login response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json();
      console.log('Login error:', errorData);
      throw new Error(errorData.detail || 'Error de autenticación');
    }

    const userData = await response.json();
    console.log('Login successful, user data:', userData);

    // Determinar el rol correctamente
    let userRole = 'student';
    if (userData.is_admin === true || userData.is_admin === 'true' || userData.role === 'admin') {
      userRole = 'admin';
    }
    const userName = userData.username || username;

    // Guardar solo rol y username
    await AsyncStorage.setItem('user_role', userRole);
    await AsyncStorage.setItem('username', userName);

    console.log('User role and username saved:', userRole, userName);

    return {
      username: userName,
      role: userRole
    };

  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

export const logout = async () => {
  try {
    await AsyncStorage.multiRemove(['user_role', 'username']);
    console.log('Logout successful - user data removed');
  } catch (error) {
    console.error('Logout error:', error);
    throw error;
  }
};

export const getStoredAuth = async () => {
  try {
    const role = await AsyncStorage.getItem('user_role');
    const username = await AsyncStorage.getItem('username');
    
    return {
      role,
      username
    };
  } catch (error) {
    console.error('Error getting stored auth:', error);
    return {
      role: null,
      username: null
    };
  }
};
