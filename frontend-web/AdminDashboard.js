import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';

const API_URL = 'http://localhost:8000/tasks'; // Cambiar según configuración

const AdminDashboard = ({ token, username, onLogout }) => {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('Fetching admin stats...');
      const statsRes = await fetch(`${API_URL}/admin/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('Stats response:', statsRes.status);
      const statsData = await statsRes.json();
      console.log('Stats data:', statsData);

      const usersRes = await fetch(`${API_URL}/admin/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('Users response:', usersRes.status);
      const usersData = await usersRes.json();
      console.log('Users data:', usersData);

      if (statsRes.ok && usersRes.ok) {
        setStats(statsData);
        setUsers(usersData);
      } else {
        setError('No se pudieron cargar los datos administrativos');
      }
    } catch (e) {
      console.error(e);
      setError('Error de conexión con el servidor');
    } finally {
      setLoading(false);
    }
  };

  console.log('Render AdminDashboard', { loading, error, stats, users });

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#7c3aed" />
        <Text style={styles.infoText}>Cargando datos administrativos...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchAdminData}>
          <Text style={styles.retryButtonText}>Reintentar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
          <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>👑 Panel Administrativo</Text>
        <Text style={styles.welcomeText}>Bienvenido, {username}</Text>
        <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
          <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Total de Usuarios</Text>
          <Text style={styles.statValue}>{stats.total_users}</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Tareas Totales</Text>
          <Text style={styles.statValue}>{stats.total_tasks}</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Tareas Completadas</Text>
          <Text style={styles.statValue}>{stats.completed_tasks}</Text>
        </View>
      </View>

      <View style={styles.usersList}>
        <Text style={styles.sectionTitle}>Usuarios Registrados</Text>
        {users.length === 0 ? (
          <Text style={styles.infoText}>No hay usuarios para mostrar</Text>
        ) : (
          users.map((user) => (
            <View key={user.id} style={styles.userCard}>
              <Text style={styles.userName}>{user.username}</Text>
              <Text style={styles.userEmail}>{user.email}</Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
  },
  header: {
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#7c3aed',
    marginBottom: 4,
  },
  welcomeText: {
    fontSize: 18,
    color: '#333',
    marginBottom: 12,
  },
  logoutButton: {
    backgroundColor: '#ef4444',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  logoutButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    marginHorizontal: 4,
    backgroundColor: '#f3e8ff',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 16,
    color: '#7c3aed',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4c1d95',
  },
  usersList: {
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#7c3aed',
  },
  userCard: {
    backgroundColor: '#ede9fe',
    padding: 12,
    borderRadius: 6,
    marginBottom: 8,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#312e81',
  },
  userEmail: {
    fontSize: 14,
    color: '#6b7280',
  },
  errorText: {
    color: '#b91c1c',
    fontSize: 18,
    marginBottom: 12,
    textAlign: 'center',
  },
  infoText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 8,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#7c3aed',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 6,
    marginTop: 10,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default AdminDashboard;
