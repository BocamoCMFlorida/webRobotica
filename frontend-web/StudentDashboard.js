import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Modal,
  Alert,
  ActivityIndicator,
  Image,
  Platform
} from 'react-native';

// Configuración de la API
const API_URL = 'http://localhost:8000'; // Cambiar según tu configuración

// Componente de Login
const LoginScreen = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('Error', 'Por favor ingresa usuario y contraseña');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('username', username);
      formData.append('password', password);

      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      
      if (response.ok) {
        onLogin(data.access_token, username);
      } else {
        Alert.alert('Error', 'Usuario o contraseña incorrectos');
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo conectar con el servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.loginContainer}>
      <View style={styles.loginCard}>
        <Text style={styles.loginTitle}>🤖 RoboTasks</Text>
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
          style={styles.loginButton}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.loginButtonText}>Iniciar Sesión</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

// Vista del Estudiante
const StudentView = ({ token, username }) => {
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState({ completed: 0, pending: 0, progress: 0 });
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await fetch(`${API_URL}/my-tasks`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setTasks(data);
      
      // Calcular estadísticas
      const completed = data.filter(t => t.completed).length;
      const total = data.length;
      setStats({
        completed,
        pending: total - completed,
        progress: total > 0 ? Math.round((completed / total) * 100) : 0
      });
    } catch (error) {
      Alert.alert('Error', 'No se pudieron cargar las tareas');
    } finally {
      setLoading(false);
    }
  };

  const toggleTaskCompletion = async (taskId, currentStatus) => {
    const endpoint = currentStatus ? 'uncomplete' : 'complete';
    try {
      const response = await fetch(`${API_URL}/tasks/${taskId}/${endpoint}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        fetchTasks();
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo actualizar la tarea');
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#7c3aed" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🤖 RoboTasks</Text>
        <Text style={styles.welcomeText}>Bienvenido, {username}</Text>
      </View>

      {/* Estadísticas */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Tareas Completadas</Text>
          <Text style={styles.statValue}>{stats.completed}</Text>
          <View style={styles.statIcon}>
            <Text style={styles.checkIcon}>✓</Text>
          </View>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Tareas Pendientes</Text>
          <Text style={[styles.statValue, { color: '#f97316' }]}>{stats.pending}</Text>
          <View style={styles.statIcon}>
            <Text style={styles.xIcon}>✕</Text>
          </View>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Progreso Total</Text>
          <Text style={[styles.statValue, { color: '#7c3aed' }]}>{stats.progress}%</Text>
          <View style={styles.statIcon}>
            <Text style={styles.gearIcon}>⚙️</Text>
          </View>
        </View>
      </View>

      {/* Lista de Tareas */}
      <View style={styles.tasksSection}>
        {tasks.map((item) => (
          <TouchableOpacity
            key={item.submission_id}
            style={styles.taskCard}
            onPress={() => setSelectedTask(item)}
          >
            <View style={styles.taskImageContainer}>
              <Image
                source={{ uri: `${API_URL}${item.task.image_path}` }}
                style={styles.taskImage}
                resizeMode="cover"
              />
              {item.completed && (
                <View style={styles.completedBadge}>
                  <Text style={styles.completedBadgeText}>✓</Text>
                </View>
              )}
            </View>
            <View style={styles.taskInfo}>
              <Text style={styles.taskTitle}>{item.task.title}</Text>
              <Text style={styles.taskDescription} numberOfLines={2}>
                {item.task.description}
              </Text>
              <View style={styles.taskMeta}>
                <Text style={styles.taskDate}>
                  Asignado: {new Date(item.task.created_at).toLocaleDateString()}
                </Text>
                {item.completed && (
                  <Text style={styles.completedDate}>
                    Completado: {new Date(item.completed_at).toLocaleDateString()}
                  </Text>
                )}
              </View>
              <TouchableOpacity
                style={[styles.taskButton, item.completed && styles.completedButton]}
                onPress={(e) => {
                  e.stopPropagation();
                  toggleTaskCompletion(item.task.id, item.completed);
                }}
              >
                <Text style={styles.taskButtonText}>
                  {item.completed ? 'Marcar como Pendiente' : 'Marcar como Completada'}
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Modal de Detalle de Tarea */}
      <Modal
        visible={selectedTask !== null}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedTask(null)}
      >
        {selectedTask && (
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <TouchableOpacity
                style={styles.modalClose}
                onPress={() => setSelectedTask(null)}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>{selectedTask.task.title}</Text>
              <Image
                source={{ uri: `${API_URL}${selectedTask.task.image_path}` }}
                style={styles.modalImage}
                resizeMode="contain"
              />
              <Text style={styles.modalDescription}>{selectedTask.task.description}</Text>
              <TouchableOpacity
                style={[styles.modalButton, selectedTask.completed && styles.completedButton]}
                onPress={() => {
                  toggleTaskCompletion(selectedTask.task.id, selectedTask.completed);
                  setSelectedTask(null);
                }}
              >
                <Text style={styles.taskButtonText}>
                  {selectedTask.completed ? 'Marcar como Pendiente' : 'Marcar como Completada'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </Modal>
    </ScrollView>
  );
};

// Vista del Administrador
const AdminView = ({ token, username }) => {
  const [activeTab, setActiveTab] = useState('students');
  const [students, setStudents] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    difficulty: 'Básico',
    studentId: '',
    pdfUrl: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Obtener estadísticas generales
      const statsResponse = await fetch(`${API_URL}/statistics/overview`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const statsData = await statsResponse.json();
      setStats(statsData);

      // Obtener estudiantes
      const studentsResponse = await fetch(`${API_URL}/statistics/students`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const studentsData = await studentsResponse.json();
      setStudents(studentsData);

      // Obtener tareas
      const tasksResponse = await fetch(`${API_URL}/statistics/tasks`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const tasksData = await tasksResponse.json();
      setTasks(tasksData);
    } catch (error) {
      Alert.alert('Error', 'No se pudieron cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const createTask = async () => {
    if (!newTask.title || !newTask.description) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    // Aquí iría la lógica para crear la tarea
    // Por ahora solo cerramos el modal
    setShowNewTaskModal(false);
    setNewTask({
      title: '',
      description: '',
      difficulty: 'Básico',
      studentId: '',
      pdfUrl: ''
    });
    fetchData();
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#7c3aed" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.adminHeader}>
        <View>
          <Text style={styles.adminTitle}>👤 Panel de Administración</Text>
        </View>
        <View style={styles.adminActions}>
          <TouchableOpacity style={styles.switchViewButton}>
            <Text style={styles.switchViewText}>Vista Estudiante</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.newTaskButton}
            onPress={() => setShowNewTaskModal(true)}
          >
            <Text style={styles.newTaskButtonText}>+ Nueva Tarea</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Estadísticas Generales */}
      <View style={styles.adminStats}>
        <View style={styles.adminStatCard}>
          <Text style={styles.adminStatLabel}>Total Estudiantes</Text>
          <Text style={styles.adminStatValue}>{stats.total_students || 0}</Text>
        </View>
        <View style={styles.adminStatCard}>
          <Text style={styles.adminStatLabel}>Tareas Creadas</Text>
          <Text style={styles.adminStatValue}>{stats.total_tasks || 0}</Text>
        </View>
        <View style={styles.adminStatCard}>
          <Text style={styles.adminStatLabel}>Tasa de Finalización</Text>
          <Text style={[styles.adminStatValue, { color: '#10b981' }]}>
            {stats.overall_completion_rate || 0}%
          </Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'students' && styles.activeTab]}
          onPress={() => setActiveTab('students')}
        >
          <Text style={[styles.tabText, activeTab === 'students' && styles.activeTabText]}>
            👥 Estudiantes
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'tasks' && styles.activeTab]}
          onPress={() => setActiveTab('tasks')}
        >
          <Text style={[styles.tabText, activeTab === 'tasks' && styles.activeTabText]}>
            📋 Gestión de Tareas
          </Text>
        </TouchableOpacity>
      </View>

      {/* Contenido según tab activo */}
      {activeTab === 'students' ? (
        <View style={styles.studentsSection}>
          {students.map((student) => (
            <View key={student.student_id} style={styles.studentCard}>
              <View style={styles.studentInfo}>
                <Text style={styles.studentName}>{student.student_name}</Text>
                <Text style={styles.studentEmail}>{student.student_email}</Text>
              </View>
              <View style={styles.studentProgress}>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${student.completion_rate}%` }
                    ]}
                  />
                </View>
                <Text style={styles.progressText}>
                  {student.completed_tasks}/{student.total_tasks} completadas
                </Text>
              </View>
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.tasksSection}>
          {tasks.map((task) => (
            <View key={task.task_id} style={styles.adminTaskCard}>
              <View style={styles.taskHeader}>
                <Text style={styles.taskTitle}>{task.task_title}</Text>
                <View style={styles.taskActions}>
                  <TouchableOpacity style={styles.taskActionButton}>
                    <Text>✏️</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.taskActionButton}>
                    <Text>🗑️</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.taskActionButton}>
                    <Text>📥</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <View style={styles.taskStats}>
                <View style={[styles.taskStatBadge, { backgroundColor: '#e0f2fe' }]}>
                  <Text style={styles.taskStatText}>
                    {task.total_assignments} Asignadas
                  </Text>
                </View>
                <View style={[styles.taskStatBadge, { backgroundColor: '#dcfce7' }]}>
                  <Text style={styles.taskStatText}>
                    {task.completed} Completadas
                  </Text>
                </View>
                <View style={[styles.taskStatBadge, { backgroundColor: '#fef3c7' }]}>
                  <Text style={styles.taskStatText}>
                    {task.pending} Pendientes
                  </Text>
                </View>
              </View>
              <Text style={styles.taskDate}>
                Creado: {new Date(task.created_at).toLocaleDateString()}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Modal Nueva Tarea */}
      <Modal
        visible={showNewTaskModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowNewTaskModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.newTaskModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nueva Tarea</Text>
              <TouchableOpacity
                onPress={() => setShowNewTaskModal(false)}
                style={styles.modalClose}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Nombre de la Tarea"
              value={newTask.title}
              onChangeText={(text) => setNewTask({ ...newTask, title: text })}
            />

            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Descripción"
              value={newTask.description}
              onChangeText={(text) => setNewTask({ ...newTask, description: text })}
              multiline
              numberOfLines={4}
            />

            <View style={styles.pickerContainer}>
              <Text style={styles.inputLabel}>Dificultad</Text>
              <View style={styles.difficultyOptions}>
                {['Básico', 'Intermedio', 'Avanzado'].map((level) => (
                  <TouchableOpacity
                    key={level}
                    style={[
                      styles.difficultyOption,
                      newTask.difficulty === level && styles.selectedDifficulty
                    ]}
                    onPress={() => setNewTask({ ...newTask, difficulty: level })}
                  >
                    <Text
                      style={[
                        styles.difficultyText,
                        newTask.difficulty === level && styles.selectedDifficultyText
                      ]}
                    >
                      {level}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.pickerContainer}>
              <Text style={styles.inputLabel}>Asignar a Estudiante</Text>
              <View style={styles.studentPicker}>
                {students.slice(0, 3).map((student) => (
                  <TouchableOpacity
                    key={student.student_id}
                    style={[
                      styles.studentOption,
                      newTask.studentId === student.student_id && styles.selectedStudent
                    ]}
                    onPress={() => setNewTask({ ...newTask, studentId: student.student_id })}
                  >
                    <Text
                      style={[
                        styles.studentOptionText,
                        newTask.studentId === student.student_id && styles.selectedStudentText
                      ]}
                    >
                      {student.student_name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TextInput
              style={styles.input}
              placeholder="URL del PDF"
              value={newTask.pdfUrl}
              onChangeText={(text) => setNewTask({ ...newTask, pdfUrl: text })}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.createButton}
                onPress={createTask}
              >
                <Text style={styles.createButtonText}>📋 Crear</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowNewTaskModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

// Componente Principal
const App = () => {
  const [token, setToken] = useState(null);
  const [username, setUsername] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (accessToken, user) => {
    setToken(accessToken);
    setUsername(user);
    
    // Verificar si es admin
    try {
      const response = await fetch(`${API_URL}/me`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      const userData = await response.json();
      setIsAdmin(userData.is_admin);
    } catch (error) {
      console.error('Error verificando usuario:', error);
    }
  };

  const handleLogout = () => {
    setToken(null);
    setUsername('');
    setIsAdmin(false);
  };

  if (!token) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <View style={styles.appContainer}>
      {isAdmin ? (
        <AdminView token={token} username={username} />
      ) : (
        <StudentView token={token} username={username} />
      )}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Cerrar Sesión</Text>
      </TouchableOpacity>
    </View>
  );
};

// Estilos
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  appContainer: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Login Styles
  loginContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
  },
  loginCard: {
    backgroundColor: 'white',
    padding: 30,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    width: '90%',
    maxWidth: 400,
  },
  loginTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    color: '#7c3aed',
  },
  loginButton: {
    backgroundColor: '#7c3aed',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  loginButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  
  // Header Styles
  header: {
    backgroundColor: 'white',
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#7c3aed',
  },
  welcomeText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 5,
  },
  
  // Stats Styles
  statsContainer: {
    padding: 20,
    gap: 15,
  },
  statCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 15,
  },
  statLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#10b981',
  },
  statIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
  },
  checkIcon: {
    fontSize: 24,
    color: '#10b981',
  },
  xIcon: {
    fontSize: 24,
    color: '#f97316',
  },
  gearIcon: {
    fontSize: 24,
  },
  
  // Tasks Styles
  tasksSection: {
    padding: 20,
  },
  taskCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  taskImageContainer: {
    height: 200,
    backgroundColor: '#e5e7eb',
    position: 'relative',
  },
  taskImage: {
    width: '100%',
    height: '100%',
  },
  completedBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#10b981',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  completedBadgeText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  taskInfo: {
    padding: 15,
  },
  taskTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  taskDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 10,
  },
  taskMeta: {
    marginBottom: 10,
  },
  taskDate: {
    fontSize: 12,
    color: '#9ca3af',
  },
  completedDate: {
    fontSize: 12,
    color: '#10b981',
    marginTop: 2,
  },
  taskButton: {
    backgroundColor: '#7c3aed',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  completedButton: {
    backgroundColor: '#10b981',
  },
  taskButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    width: '90%',
    maxWidth: 500,
    maxHeight: '80%',
  },
  modalClose: {
    position: 'absolute',
    top: 10,
    right: 10,
    padding: 10,
  },
  modalCloseText: {
    fontSize: 24,
    color: '#6b7280',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 15,
    marginTop: 10,
  },
  modalImage: {
    width: '100%',
    height: 300,
    marginBottom: 15,
  },
  modalDescription: {
    fontSize: 16,
    color: '#4b5563',
    marginBottom: 20,
    lineHeight: 24,
  },
  modalButton: {
    backgroundColor: '#7c3aed',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  
  // Admin Styles
  adminHeader: {
    backgroundColor: 'white',
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  adminTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  adminActions: {
    flexDirection: 'row',
    gap: 10,
  },
  switchViewButton: {
    backgroundColor: '#6b7280',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 6,
  },
  switchViewText: {
    color: 'white',
    fontSize: 14,
  },
  newTaskButton: {
    backgroundColor: '#7c3aed',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 6,
  },
  newTaskButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  
  // Admin Stats
  adminStats: {
    flexDirection: 'row',
    padding: 20,
    gap: 10,
  },
  adminStatCard: {
    flex: 1,
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  adminStatLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 5,
  },
  adminStatValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#7c3aed',
  },
  
  // Tabs
  tabs: {
    flexDirection: 'row',
    backgroundColor: 'white',
    marginHorizontal: 20,
    borderRadius: 10,
    padding: 5,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#ede9fe',
  },
  tabText: {
    fontSize: 14,
    color: '#6b7280',
  },
  activeTabText: {
    color: '#7c3aed',
    fontWeight: 'bold',
  },
  
  // Students Section
  studentsSection: {
    padding: 20,
  },
  studentCard: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  studentInfo: {
    marginBottom: 10,
  },
  studentName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  studentEmail: {
    fontSize: 14,
    color: '#6b7280',
  },
  studentProgress: {
    marginTop: 10,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#7c3aed',
  },
  progressText: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 5,
    textAlign: 'right',
  },
  
  // Admin Task Card
  adminTaskCard: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  taskActions: {
    flexDirection: 'row',
    gap: 10,
  },
  taskActionButton: {
    padding: 5,
  },
  taskStats: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  taskStatBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  taskStatText: {
    fontSize: 12,
    fontWeight: '500',
  },
  
  // New Task Modal
  newTaskModal: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    width: '90%',
    maxWidth: 500,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  inputLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  pickerContainer: {
    marginBottom: 15,
  },
  difficultyOptions: {
    flexDirection: 'row',
    gap: 10,
  },
  difficultyOption: {
    flex: 1,
    padding: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    alignItems: 'center',
  },
  selectedDifficulty: {
    backgroundColor: '#7c3aed',
    borderColor: '#7c3aed',
  },
  difficultyText: {
    color: '#6b7280',
  },
  selectedDifficultyText: {
    color: 'white',
  },
  studentPicker: {
    gap: 10,
  },
  studentOption: {
    padding: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
  },
  selectedStudent: {
    backgroundColor: '#7c3aed',
    borderColor: '#7c3aed',
  },
  studentOptionText: {
    color: '#6b7280',
  },
  selectedStudentText: {
    color: 'white',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  createButton: {
    flex: 1,
    backgroundColor: '#7c3aed',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  createButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#e5e7eb',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#6b7280',
  },
  
  // Logout
  logoutButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#ef4444',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  logoutText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default App;