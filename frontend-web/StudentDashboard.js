import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Alert,
  Modal,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  StyleSheet,
  Platform
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

const API_URL = 'http://localhost:8000';

const StudentDashboard = ({ username, onLogout }) => {
  const navigation = useNavigation();

  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState({ completed: 0, pending: 0, progress: 0 });
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null);
  const [debugInfo, setDebugInfo] = useState('');

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (loading) {
        setLoading(false);
        Alert.alert('Timeout', 'La carga está tardando demasiado. Verifica la conexión.');
      }
    }, 15000);

    fetchTasks();

    return () => clearTimeout(timeoutId);
  }, []);

  // Actualizar estadísticas cada vez que cambian las tareas
  useEffect(() => {
    const completed = tasks.filter(t => t.completed).length;
    const total = tasks.length;
    setStats({
      completed,
      pending: total - completed,
      progress: total > 0 ? Math.round((completed / total) * 100) : 0
    });
  }, [tasks]);

  const fetchTasks = async () => {
    try {
      setDebugInfo('Obteniendo tareas...');
      const response = await fetch(`${API_URL}/tasks`, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error(`Status: ${response.status}`);

      const data = await response.json();
      const completed = data.filter(t => t.completed).length;
      const total = data.length;

      setTasks(data);
      setStats({
        completed,
        pending: total - completed,
        progress: total > 0 ? Math.round((completed / total) * 100) : 0
      });

      setDebugInfo('Tareas cargadas correctamente.');
      setLoading(false);
    } catch (error) {
      console.error('Error al obtener tareas:', error);
      setDebugInfo('No se pudieron cargar las tareas.');
      Alert.alert('Error', 'No se pudo conectar al servidor o cargar las tareas.');
      setTasks([]);
      setStats({ completed: 0, pending: 0, progress: 0 });
      setLoading(false);
    }
  };

 const toggleTaskCompletion = async (taskId, currentStatus) => {
  const endpoint = currentStatus ? 'uncomplete' : 'complete';
  try {
    const response = await fetch(`${API_URL}/tasks/${taskId}/${endpoint}`, {
      method: 'PUT'
    });
    if (!response.ok) throw new Error(`Error: ${response.status}`);

    // Actualizamos localmente solo si la petición fue exitosa
    setTasks(prevTasks =>
      prevTasks.map(t =>
        t.id === taskId ? { ...t, completed: !currentStatus } : t
      )
    );

    // Actualizamos las estadísticas locales
    setStats(prevStats => {
      const completedDelta = currentStatus ? -1 : 1;
      const completed = prevStats.completed + completedDelta;
      const total = prevStats.completed + prevStats.pending;
      return {
        completed,
        pending: total - completed,
        progress: total > 0 ? Math.round((completed / total) * 100) : 0
      };
    });
  } catch (error) {
    console.error('Error updating task:', error);
    Alert.alert('Error', 'No se pudo actualizar la tarea');
  }
};


  const handleLogout = () => {
  Alert.alert(
    'Cerrar Sesión',
    '¿Estás seguro de que quieres cerrar sesión?',
    [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Cerrar Sesión',
        style: 'destructive',
        onPress: async () => {
          try {
            // Primero hacer el reset de navegación
            navigation.reset({
              index: 0,
              routes: [{ name: 'Login' }],
            });

            // Luego llamar onLogout si existe
            if (onLogout && typeof onLogout === 'function') {
              await onLogout();
            }
          } catch (error) {
            console.error('Error durante logout:', error);
            // Aunque haya error, intentar navegar de vuelta al login
            navigation.reset({
              index: 0,
              routes: [{ name: 'Login' }],
            });
            Alert.alert('Aviso', 'Sesión cerrada con algunos errores menores.');
          }
        }
      }
    ]
  );
};

// ALTERNATIVA MÁS SIMPLE (si onLogout no es crítica):
const handleLogoutSimple = () => {
  Alert.alert(
    'Cerrar Sesión',
    '¿Estás seguro de que quieres cerrar sesión?',
    [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Cerrar Sesión',
        style: 'destructive',
        onPress: () => {
          // Limpiar cualquier estado local si es necesario
          setTasks([]);
          setStats({ completed: 0, pending: 0, progress: 0 });
          
          // Navegar directamente al login
          navigation.reset({
            index: 0,
            routes: [{ name: 'Login' }],
          });
        }
      }
    ]
  );
};
  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#7c3aed" />
        <Text style={styles.loadingText}>Cargando tareas...</Text>
        <Text style={styles.debugText}>{debugInfo}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => { setLoading(true); fetchTasks(); }}>
          <Text style={styles.retryButtonText}>Reintentar Conexión</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.skipButton} onPress={() => { setLoading(false); setTasks([]); }}>
          <Text style={styles.skipButtonText}>Continuar Sin Datos</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>🤖 Cantera de Empresas</Text>
            <Text style={styles.welcomeText}>Bienvenido, {username || 'Usuario'}</Text>
            {debugInfo ? <Text style={styles.debugInfo}>{debugInfo}</Text> : null}
          </View>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={() => {
              // Limpiar cualquier estado local si es necesario
              setTasks([]);
              setStats({ completed: 0, pending: 0, progress: 0 });
              // Borrar sesión del storage y actualizar autenticación global
              if (typeof onLogout === 'function') {
                onLogout();
              }
            }}
          >
            <Text style={styles.logoutButtonText}>🚪 Cerrar Sesión</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Tareas Completadas</Text>
          <Text style={styles.statValue}>{stats.completed}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Tareas Pendientes</Text>
          <Text style={[styles.statValue, { color: '#f97316' }]}>{stats.pending}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Progreso Total</Text>
          <Text style={[styles.statValue, { color: '#7c3aed' }]}>{stats.progress}%</Text>
        </View>
      </View>

      <View style={styles.tasksSection}>
        <TouchableOpacity style={styles.refreshButton} onPress={() => { setLoading(true); fetchTasks(); }}>
          <Text style={styles.refreshButtonText}>🔄 Actualizar</Text>
        </TouchableOpacity>

        {tasks.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No hay tareas disponibles</Text>
            <Text style={styles.emptySubtext}>{debugInfo || 'Verifica tu conexión al servidor'}</Text>
          </View>
        ) : (
          tasks.map((item) => (
            <TouchableOpacity key={item.id} style={styles.taskCard} onPress={() => setSelectedTask(item)}>
              {item.image_path && <Image source={{ uri: `${API_URL}${item.image_path}` }} style={styles.taskImage} />}
              <View style={styles.taskInfo}>
                <Text style={styles.taskTitle}>{item.title}</Text>
                <Text style={styles.taskDescription}>{item.description}</Text>
                <TouchableOpacity
                  style={[styles.taskButton, item.completed && styles.completedButton]}
                  onPress={async () => {
                    setTasks(prevTasks =>
                      prevTasks.map(t =>
                        t.id === item.id ? { ...t, completed: !item.completed } : t
                      )
                    );
                    await toggleTaskCompletion(item.id, item.completed);
                  }}
                >
                  <Text style={styles.taskButtonText}>
                    {item.completed ? 'Marcar como Pendiente' : 'Marcar como Completada'}
                  </Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>

      <Modal visible={selectedTask !== null} animationType="slide" transparent={true} onRequestClose={() => setSelectedTask(null)}>
        {selectedTask && (
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>{selectedTask.title}</Text>
              {selectedTask.image_path && (
                <Image source={{ uri: `${API_URL}${selectedTask.image_path}` }} style={styles.modalImage} />
              )}
              <Text style={styles.modalDescription}>{selectedTask.description}</Text>
              <TouchableOpacity
                style={[styles.modalButton, selectedTask.completed && styles.completedButton]}
                onPress={async () => {
                  setTasks(prevTasks =>
                    prevTasks.map(t =>
                      t.id === selectedTask.id ? { ...t, completed: !selectedTask.completed } : t
                    )
                  );
                  await toggleTaskCompletion(selectedTask.id, selectedTask.completed);
                  setSelectedTask(null);
                }}
              >
                <Text style={styles.taskButtonText}>
                  {selectedTask.completed ? 'Marcar como Pendiente' : 'Marcar como Completada'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.closeButton} onPress={() => setSelectedTask(null)}>
                <Text style={styles.closeButtonText}>Cerrar</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  loadingText: { marginTop: 10, fontSize: 16, color: '#6b7280', textAlign: 'center' },
  debugText: { marginTop: 5, fontSize: 12, color: '#9ca3af', textAlign: 'center' },
  debugInfo: { fontSize: 12, color: '#9ca3af', marginTop: 5 },
  header: { backgroundColor: 'white', padding: 20, paddingTop: Platform.OS === 'ios' ? 50 : 20 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#7c3aed' },
  welcomeText: { fontSize: 16, color: '#6b7280', marginTop: 5 },
  logoutButton: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
    justifyContent: 'center',
    minWidth: 120
  },
  logoutButtonText: { color: 'white', fontWeight: 'bold', fontSize: 14, textAlign: 'center' },
  statsContainer: { padding: 20 },
  statCard: { backgroundColor: 'white', padding: 20, borderRadius: 10, marginBottom: 15, elevation: 3 },
  statLabel: { fontSize: 14, color: '#6b7280' },
  statValue: { fontSize: 32, fontWeight: 'bold', color: '#10b981' },
  tasksSection: { padding: 20 },
  refreshButton: { backgroundColor: '#7c3aed', padding: 10, borderRadius: 8, alignItems: 'center', marginBottom: 15 },
  refreshButtonText: { color: 'white', fontWeight: 'bold' },
  emptyState: { backgroundColor: 'white', padding: 40, borderRadius: 10, alignItems: 'center' },
  emptyText: { fontSize: 16, color: '#6b7280', marginBottom: 5 },
  emptySubtext: { fontSize: 12, color: '#9ca3af', textAlign: 'center' },
  taskCard: { backgroundColor: 'white', borderRadius: 10, marginBottom: 15, elevation: 3, overflow: 'hidden' },
  taskImage: { width: '100%', height: 200 },
  taskInfo: { padding: 15 },
  taskTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 5 },
  taskDescription: { fontSize: 14, color: '#6b7280', marginBottom: 10 },
  taskButton: { backgroundColor: '#7c3aed', padding: 12, borderRadius: 8, alignItems: 'center' },
  completedButton: { backgroundColor: '#10b981' },
  taskButtonText: { color: 'white', fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: 'white', borderRadius: 10, padding: 20, width: '90%', maxWidth: 500 },
  modalTitle: { fontSize: 24, fontWeight: 'bold', marginBottom: 15 },
  modalImage: { width: '100%', height: 300, marginBottom: 15 },
  modalDescription: { fontSize: 16, color: '#6b7280', marginBottom: 20 },
  modalButton: { backgroundColor: '#7c3aed', padding: 15, borderRadius: 8, alignItems: 'center' },
  closeButton: { marginTop: 15, padding: 10, alignItems: 'center' },
  closeButtonText: { color: '#7c3aed', fontWeight: 'bold' },
  retryButton: {
    backgroundColor: '#7c3aed',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
    marginBottom: 10,
  },
  retryButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  skipButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    borderColor: '#7c3aed',
    borderWidth: 1,
  },
  skipButtonText: { color: '#7c3aed', fontWeight: 'bold', fontSize: 16 },
});

export default StudentDashboard;
