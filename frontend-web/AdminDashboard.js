import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Alert,
  Modal,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform
} from 'react-native';

const API_URL = 'http://localhost:8000';

const AdminDashboard = ({ token, username, onLogout }) => {
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
      const statsResponse = await fetch(`${API_URL}/statistics/overview`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const statsData = await statsResponse.json();
      setStats(statsData);

      const studentsResponse = await fetch(`${API_URL}/statistics/students`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const studentsData = await studentsResponse.json();
      setStudents(studentsData);

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
    setShowNewTaskModal(false);
    setNewTask({ title: '', description: '', difficulty: 'Básico', studentId: '', pdfUrl: '' });
    fetchData();
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.adminHeader}>
        <Text style={styles.adminTitle}>👤 Panel de Administración</Text>
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={() => {
            // Borrar sesión del storage y actualizar autenticación global
            if (typeof onLogout === 'function') {
              onLogout();
            }
          }}
        >
          <Text style={styles.logoutButtonText}>🚪 Cerrar Sesión</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.adminStats}>
        <View style={styles.adminStatCard}><Text style={styles.adminStatLabel}>Total Estudiantes</Text><Text style={styles.adminStatValue}>{stats.total_students || 0}</Text></View>
        <View style={styles.adminStatCard}><Text style={styles.adminStatLabel}>Tareas Creadas</Text><Text style={styles.adminStatValue}>{stats.total_tasks || 0}</Text></View>
        <View style={styles.adminStatCard}><Text style={styles.adminStatLabel}>Tasa de Finalización</Text><Text style={[styles.adminStatValue, { color: '#10b981' }]}>{stats.overall_completion_rate || 0}%</Text></View>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity style={[styles.tab, activeTab === 'students' && styles.activeTab]} onPress={() => setActiveTab('students')}>
          <Text style={[styles.tabText, activeTab === 'students' && styles.activeTabText]}>👥 Estudiantes</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'tasks' && styles.activeTab]} onPress={() => setActiveTab('tasks')}>
          <Text style={[styles.tabText, activeTab === 'tasks' && styles.activeTabText]}>📋 Gestión de Tareas</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'students' ? (
        <View style={styles.studentsSection}>
          {students.map(student => (
            <View key={student.student_id} style={styles.studentCard}>
              <Text style={styles.studentName}>{student.student_name}</Text>
              <Text style={styles.studentEmail}>{student.student_email}</Text>
              <View style={styles.progressBar}><View style={[styles.progressFill, { width: `${student.completion_rate}%` }]} /></View>
              <Text style={styles.progressText}>{student.completed_tasks}/{student.total_tasks} completadas</Text>
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.tasksSection}>
          {tasks.map(task => (
            <View key={task.task_id} style={styles.adminTaskCard}>
              <Text style={styles.taskTitle}>{task.task_title}</Text>
              <Text style={styles.taskDate}>Creado: {new Date(task.created_at).toLocaleDateString()}</Text>
            </View>
          ))}
        </View>
      )}

      <Modal visible={showNewTaskModal} animationType="slide" transparent={true} onRequestClose={() => setShowNewTaskModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Nueva Tarea</Text>
            <TextInput style={styles.input} placeholder="Nombre de la Tarea" value={newTask.title} onChangeText={text => setNewTask({ ...newTask, title: text })} />
            <TextInput style={[styles.input, styles.textArea]} placeholder="Descripción" value={newTask.description} onChangeText={text => setNewTask({ ...newTask, description: text })} multiline numberOfLines={4} />
            <TouchableOpacity style={styles.createButton} onPress={createTask}><Text style={styles.createButtonText}>📋 Crear</Text></TouchableOpacity>
            <TouchableOpacity style={styles.cancelButton} onPress={() => setShowNewTaskModal(false)}><Text style={styles.cancelButtonText}>Cancelar</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  adminHeader: { backgroundColor: 'white', padding: 20, paddingTop: Platform.OS === 'ios' ? 50 : 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 5 },
  adminTitle: { fontSize: 24, fontWeight: 'bold' },
  newTaskButton: { backgroundColor: '#7c3aed', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 6 },
  newTaskButtonText: { color: 'white', fontSize: 14, fontWeight: 'bold' },
  adminStats: { flexDirection: 'row', padding: 20, gap: 10 },
  adminStatCard: { flex: 1, backgroundColor: 'white', padding: 15, borderRadius: 10, alignItems: 'center', elevation: 3 },
  adminStatLabel: { fontSize: 12, color: '#6b7280', marginBottom: 5 },
  adminStatValue: { fontSize: 24, fontWeight: 'bold', color: '#7c3aed' },
  tabs: { flexDirection: 'row', backgroundColor: 'white', marginHorizontal: 20, borderRadius: 10, padding: 5 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  activeTab: { backgroundColor: '#ede9fe' },
  tabText: { fontSize: 14, color: '#6b7280' },
  activeTabText: { color: '#7c3aed', fontWeight: 'bold' },
  studentsSection: { padding: 20 },
  studentCard: { backgroundColor: 'white', padding: 15, borderRadius: 10, marginBottom: 10, elevation: 3 },
  studentName: { fontSize: 16, fontWeight: 'bold' },
  studentEmail: { fontSize: 14, color: '#6b7280' },
  progressBar: { height: 8, backgroundColor: '#e5e7eb', borderRadius: 4, overflow: 'hidden', marginTop: 10 },
  progressFill: { height: '100%', backgroundColor: '#7c3aed' },
  progressText: { fontSize: 12, color: '#6b7280', marginTop: 5, textAlign: 'right' },
  tasksSection: { padding: 20 },
  adminTaskCard: { backgroundColor: 'white', padding: 15, borderRadius: 10, marginBottom: 10, elevation: 3 },
  taskTitle: { fontSize: 16, fontWeight: 'bold' },
  taskDate: { fontSize: 12, color: '#9ca3af' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: 'white', borderRadius: 10, padding: 20, width: '90%', maxWidth: 500 },
  modalTitle: { fontSize: 24, fontWeight: 'bold', marginBottom: 15 },
  input: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, padding: 12, marginBottom: 15, fontSize: 16 },
  textArea: { height: 100, textAlignVertical: 'top' },
  createButton: { backgroundColor: '#7c3aed', padding: 15, borderRadius: 8, alignItems: 'center', marginBottom: 10 },
  createButtonText: { color: 'white', fontWeight: 'bold' },
  cancelButton: { backgroundColor: '#e5e7eb', padding: 15, borderRadius: 8, alignItems: 'center' },
  cancelButtonText: { color: '#6b7280' },
  logoutButton: { backgroundColor: '#e3342f', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 6 },
  logoutButtonText: { color: 'white', fontSize: 14, fontWeight: 'bold' }
});

export default AdminDashboard;
