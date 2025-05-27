import React, { useState, useEffect, createContext, useContext } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Image,
  ActivityIndicator,
  RefreshControl,
  Modal,
  Dimensions
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialIcons';

const API_BASE_URL = 'http://127.0.0.1:8000'; // Cambia por tu IP local

// Context para el estado global
const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const savedToken = await AsyncStorage.getItem('token');
      const savedUser = await AsyncStorage.getItem('user');
      
      if (savedToken && savedUser) {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    try {
      const formData = new FormData();
      formData.append('username', username);
      formData.append('password', password);

      const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        const userToken = data.access_token;
        
        // Obtener datos del usuario
        const userResponse = await fetch(`${API_BASE_URL}/me`, {
          headers: {
            'Authorization': `Bearer ${userToken}`,
          },
        });

        if (userResponse.ok) {
          const userData = await userResponse.json();
          
          await AsyncStorage.setItem('token', userToken);
          await AsyncStorage.setItem('user', JSON.stringify(userData));
          
          setToken(userToken);
          setUser(userData);
          return { success: true };
        }
      }
      
      const errorData = await response.json();
      return { success: false, error: errorData.detail || 'Error de login' };
    } catch (error) {
      return { success: false, error: 'Error de conexión' };
    }
  };

  const logout = async () => {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  const register = async (email, username, password, isAdmin = false) => {
    try {
      const response = await fetch(`${API_BASE_URL}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          username,
          password,
          is_admin: isAdmin,
        }),
      });

      if (response.ok) {
        return { success: true };
      }
      
      const errorData = await response.json();
      return { success: false, error: errorData.detail || 'Error de registro' };
    } catch (error) {
      return { success: false, error: 'Error de conexión' };
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      login,
      logout,
      register,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

// Pantalla de Login
const LoginScreen = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    setLoading(true);
    const result = await login(username, password);
    setLoading(false);

    if (!result.success) {
      Alert.alert('Error', result.error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tareas Educativas</Text>
      
      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Usuario"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
        />
        
        <TextInput
          style={styles.input}
          placeholder="Contraseña"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        
        <TouchableOpacity 
          style={styles.button} 
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.buttonText}>Iniciar Sesión</Text>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.linkButton}
          onPress={() => navigation.navigate('Register')}
        >
          <Text style={styles.linkText}>¿No tienes cuenta? Regístrate</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// Pantalla de Registro
const RegisterScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();

  const handleRegister = async () => {
    if (!email || !username || !password) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    setLoading(true);
    const result = await register(email, username, password, isAdmin);
    setLoading(false);

    if (result.success) {
      Alert.alert('Éxito', 'Usuario registrado correctamente', [
        { text: 'OK', onPress: () => navigation.navigate('Login') }
      ]);
    } else {
      Alert.alert('Error', result.error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Registro</Text>
      
      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        
        <TextInput
          style={styles.input}
          placeholder="Usuario"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
        />
        
        <TextInput
          style={styles.input}
          placeholder="Contraseña"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        
        <TouchableOpacity 
          style={[styles.checkboxContainer, isAdmin && styles.checkboxSelected]}
          onPress={() => setIsAdmin(!isAdmin)}
        >
          <Text style={styles.checkboxText}>
            {isAdmin ? '✓' : ''} Soy administrador
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.button} 
          onPress={handleRegister}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.buttonText}>Registrarse</Text>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.linkButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.linkText}>¿Ya tienes cuenta? Inicia sesión</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// Pantalla de Tareas para Estudiantes
const StudentTasksScreen = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { token } = useAuth();

  const fetchTasks = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/my-tasks`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTasks(data);
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudieron cargar las tareas');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const toggleTaskCompletion = async (taskId, isCompleted) => {
    try {
      const endpoint = isCompleted ? 'uncomplete' : 'complete';
      const response = await fetch(`${API_BASE_URL}/tasks/${taskId}/${endpoint}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        fetchTasks(); // Recargar tareas
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo actualizar la tarea');
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchTasks();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <Text style={styles.screenTitle}>Mis Tareas</Text>
      
      {tasks.length === 0 ? (
        <Text style={styles.emptyText}>No hay tareas asignadas</Text>
      ) : (
        tasks.map((item) => (
          <View key={item.submission_id} style={styles.taskCard}>
            <View style={styles.taskHeader}>
              <Text style={styles.taskTitle}>{item.task.title}</Text>
              <TouchableOpacity
                style={[
                  styles.statusButton,
                  item.completed ? styles.completedButton : styles.pendingButton
                ]}
                onPress={() => toggleTaskCompletion(item.task.id, item.completed)}
              >
                <Text style={styles.statusButtonText}>
                  {item.completed ? 'Completada' : 'Pendiente'}
                </Text>
              </TouchableOpacity>
            </View>
            
            <Text style={styles.taskDescription}>{item.task.description}</Text>
            
            {item.task.image_path && (
              <Image
                source={{ uri: `${API_BASE_URL}${item.task.image_path}` }}
                style={styles.taskImage}
                resizeMode="contain"
              />
            )}
            
            {item.task.due_date && (
              <Text style={styles.dueDate}>
                Fecha límite: {new Date(item.task.due_date).toLocaleDateString()}
              </Text>
            )}
            
            {item.completed_at && (
              <Text style={styles.completedDate}>
                Completada: {new Date(item.completed_at).toLocaleDateString()}
              </Text>
            )}
          </View>
        ))
      )}
    </ScrollView>
  );
};

// Pantalla para Crear Tareas (Administradores)
const CreateTaskScreen = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const { token } = useAuth();

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert('Error', 'Se necesitan permisos para acceder a las fotos');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImage(result.assets[0]);
    }
  };

  const createTask = async () => {
    if (!title || !description || !image) {
      Alert.alert('Error', 'Por favor completa todos los campos y selecciona una imagen');
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      if (dueDate) {
        formData.append('due_date', new Date(dueDate).toISOString());
      }
      
      formData.append('image', {
        uri: image.uri,
        type: image.type || 'image/jpeg',
        name: image.fileName || 'task_image.jpg',
      });

      const response = await fetch(`${API_BASE_URL}/tasks`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });

      if (response.ok) {
        Alert.alert('Éxito', 'Tarea creada correctamente');
        setTitle('');
        setDescription('');
        setDueDate('');
        setImage(null);
      } else {
        const errorData = await response.json();
        Alert.alert('Error', errorData.detail || 'No se pudo crear la tarea');
      }
    } catch (error) {
      Alert.alert('Error', 'Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.screenTitle}>Crear Tarea</Text>
      
      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Título de la tarea"
          value={title}
          onChangeText={setTitle}
        />
        
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Descripción"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
        />
        
        <TextInput
          style={styles.input}
          value={dueDate}
          onChangeText={setDueDate}
          placeholder="YYYY-MM-DD"
        />
        
        <TouchableOpacity style={styles.imageButton} onPress={pickImage}>
          <Text style={styles.imageButtonText}>
            {image ? 'Cambiar Imagen' : 'Seleccionar Imagen del Robot'}
          </Text>
        </TouchableOpacity>
        
        {image && (
          <Image source={{ uri: image.uri }} style={styles.selectedImage} />
        )}
        
        <TouchableOpacity 
          style={styles.button} 
          onPress={createTask}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.buttonText}>Crear Tarea</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

// Pantalla de Estadísticas para Administradores
const StatisticsScreen = () => {
  const [stats, setStats] = useState(null);
  const [taskStats, setTaskStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();

  const fetchStatistics = async () => {
    try {
      const [overviewResponse, tasksResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/statistics/overview`, {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
        fetch(`${API_BASE_URL}/statistics/tasks`, {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
      ]);

      if (overviewResponse.ok && tasksResponse.ok) {
        const overviewData = await overviewResponse.json();
        const tasksData = await tasksResponse.json();
        
        setStats(overviewData);
        setTaskStats(tasksData);
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudieron cargar las estadísticas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatistics();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.screenTitle}>Estadísticas</Text>
      
      {stats && (
        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>Resumen General</Text>
          <Text style={styles.statItem}>Total de Tareas: {stats.total_tasks}</Text>
          <Text style={styles.statItem}>Total de Estudiantes: {stats.total_students}</Text>
          <Text style={styles.statItem}>Tareas Completadas: {stats.completed_submissions}</Text>
          <Text style={styles.statItem}>Tareas Pendientes: {stats.pending_submissions}</Text>
          <Text style={styles.statItem}>
            Tasa de Finalización: {stats.overall_completion_rate}%
          </Text>
        </View>
      )}
      
      <Text style={styles.sectionTitle}>Estadísticas por Tarea</Text>
      
      {taskStats.map((task) => (
        <View key={task.task_id} style={styles.taskStatsCard}>
          <Text style={styles.taskStatsTitle}>{task.task_title}</Text>
          <Text style={styles.statItem}>Completadas: {task.completed}</Text>
          <Text style={styles.statItem}>Pendientes: {task.pending}</Text>
          <Text style={styles.statItem}>
            Tasa de Finalización: {task.completion_rate}%
          </Text>
        </View>
      ))}
    </ScrollView>
  );
};

// Pantalla de Perfil
const ProfileScreen = () => {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro de que quieres cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Sí', onPress: logout },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.screenTitle}>Mi Perfil</Text>
      
      <View style={styles.profileCard}>
        <Text style={styles.profileLabel}>Usuario:</Text>
        <Text style={styles.profileValue}>{user?.username}</Text>
        
        <Text style={styles.profileLabel}>Email:</Text>
        <Text style={styles.profileValue}>{user?.email}</Text>
        
        <Text style={styles.profileLabel}>Tipo de cuenta:</Text>
        <Text style={styles.profileValue}>
          {user?.is_admin ? 'Administrador' : 'Estudiante'}
        </Text>
      </View>
      
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
      </TouchableOpacity>
    </View>
  );
};

// Navegación
const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const StudentTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ focused, color, size }) => {
        let iconName;
        if (route.name === 'Tasks') iconName = 'assignment';
        else if (route.name === 'Profile') iconName = 'person';
        
        return <Icon name={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: '#007AFF',
      tabBarInactiveTintColor: 'gray',
    })}
  >
    <Tab.Screen name="Tasks" component={StudentTasksScreen} options={{ title: 'Mis Tareas' }} />
    <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Perfil' }} />
  </Tab.Navigator>
);

const AdminTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ focused, color, size }) => {
        let iconName;
        if (route.name === 'CreateTask') iconName = 'add-circle';
        else if (route.name === 'Statistics') iconName = 'bar-chart';
        else if (route.name === 'Profile') iconName = 'person';
        
        return <Icon name={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: '#007AFF',
      tabBarInactiveTintColor: 'gray',
    })}
  >
    <Tab.Screen name="CreateTask" component={CreateTaskScreen} options={{ title: 'Crear Tarea' }} />
    <Tab.Screen name="Statistics" component={StatisticsScreen} options={{ title: 'Estadísticas' }} />
    <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Perfil' }} />
  </Tab.Navigator>
);

const AuthStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Register" component={RegisterScreen} />
  </Stack.Navigator>
);

const App = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {user ? (
        user.is_admin ? <AdminTabs /> : <StudentTabs />
      ) : (
        <AuthStack />
      )}
    </NavigationContainer>
  );
};

const AppWithProvider = () => (
  <AuthProvider>
    <App />
  </AuthProvider>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 40,
    color: '#333',
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  form: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  linkButton: {
    marginTop: 15,
    alignItems: 'center',
  },
  linkText: {
    color: '#007AFF',
    fontSize: 16,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 15,
    backgroundColor: '#fff',
  },
  checkboxSelected: {
    backgroundColor: '#e3f2fd',
    borderColor: '#007AFF',
  },
  checkboxText: {
    fontSize: 16,
    color: '#333',
  },
  taskCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  taskTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginRight: 10,
  },
  taskDescription: {
    fontSize: 16,
    color: '#666',
    marginBottom: 15,
    lineHeight: 22,
  },
  taskImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 15,
  },
  dueDate: {
    fontSize: 14,
    color: '#ff6b6b',
    fontWeight: '500',
  },
  completedDate: {
    fontSize: 14,
    color: '#28a745',
    fontWeight: '500',
  },
  statusButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 100,
    alignItems: 'center',
  },
  completedButton: {
    backgroundColor: '#28a745',
  },
  pendingButton: {
    backgroundColor: '#ffc107',
  },
  statusButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    marginTop: 50,
  },
  imageButton: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 2,
    borderColor: '#007AFF',
    borderStyle: 'dashed',
  },
  imageButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '500',
  },
  selectedImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 15,
  },
  statsCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  statItem: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
    paddingLeft: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    marginTop: 10,
  },
  taskStatsCard: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  taskStatsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  profileCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  profileLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
    marginTop: 10,
  },
  profileValue: {
    fontSize: 16,
    color: '#666',
    marginBottom: 10,
  },
  logoutButton: {
    backgroundColor: '#dc3545',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default AppWithProvider;