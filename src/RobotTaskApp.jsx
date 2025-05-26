import React, { useState, useEffect } from 'react';
import { User, Calendar, CheckCircle, XCircle, Download, Plus, Edit, Trash2, Users, BookOpen, Settings, Save, X, Upload, Camera } from 'lucide-react';

const RobotTaskApp = () => {
  const [currentView, setCurrentView] = useState('student');
  const [currentUser, setCurrentUser] = useState({ id: 1, name: 'Ana García', role: 'student' });
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Estados para los datos
  const [students, setStudents] = useState([
    { id: 1, name: 'Ana García', email: 'ana@email.com' },
    { id: 2, name: 'Carlos López', email: 'carlos@email.com' },
    { id: 3, name: 'María Rodríguez', email: 'maria@email.com' },
    { id: 4, name: 'Pedro Martínez', email: 'pedro@email.com' },
    { id: 5, name: 'Laura González', email: 'laura@email.com' }
  ]);

  // Tareas globales - todos los estudiantes las ven
  const [robotTasks, setRobotTasks] = useState([
    {
      id: 1,
      name: 'Robot Seguidor de Líneas',
      description: 'Construir un robot que pueda seguir una línea negra en el suelo usando sensores infrarrojos. Este proyecto incluye programación de Arduino y calibración de sensores.',
      image: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=400&h=300&fit=crop',
      dateCreated: '2024-03-15',
      pdfUrl: '/pdfs/robot-seguidor.pdf',
      difficulty: 'Intermedio'
    },
    {
      id: 2,
      name: 'Robot Evasor de Obstáculos',
      description: 'Robot autónomo que detecta y evita obstáculos usando sensores ultrasónicos. Incluye algoritmos de navegación y toma de decisiones.',
      image: 'https://images.unsplash.com/photo-1563207153-f403bf289096?w=400&h=300&fit=crop',
      dateCreated: '2024-03-22',
      pdfUrl: '/pdfs/robot-evasor.pdf',
      difficulty: 'Avanzado'
    },
    {
      id: 3,
      name: 'Brazo Robótico Simple',
      description: 'Construcción de un brazo robótico con 2 grados de libertad controlado por servomotores. Perfecto para iniciarse en robótica.',
      image: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400&h=300&fit=crop',
      dateCreated: '2024-04-01',
      pdfUrl: '/pdfs/brazo-robotico.pdf',
      difficulty: 'Básico'
    },
    {
      id: 4,
      name: 'Robot Controlado por Bluetooth',
      description: 'Robot móvil que se puede controlar remotamente a través de una aplicación móvil usando conexión Bluetooth.',
      image: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=300&fit=crop',
      dateCreated: '2024-04-08',
      pdfUrl: '/pdfs/robot-bluetooth.pdf',
      difficulty: 'Intermedio'
    }
  ]);

  // Estado de completado por estudiante - cada estudiante tiene su propio progreso
  const [studentProgress, setStudentProgress] = useState({
    1: { completedTasks: [1, 3], completedDates: { 1: '2024-03-20', 3: '2024-04-10' } }, // Ana García
    2: { completedTasks: [1, 2, 3, 4], completedDates: { 1: '2024-03-18', 2: '2024-03-25', 3: '2024-04-08', 4: '2024-04-12' } }, // Carlos López
    3: { completedTasks: [1, 4], completedDates: { 1: '2024-03-22', 4: '2024-04-15' } }, // María Rodríguez
    4: { completedTasks: [1], completedDates: { 1: '2024-03-25' } }, // Pedro Martínez
    5: { completedTasks: [1, 2], completedDates: { 1: '2024-03-20', 2: '2024-04-05' } } // Laura González
  });

  // Simulación de API calls
  const apiCall = async (endpoint, method = 'GET', data = null) => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 800)); // Simular latencia
    
    console.log(`API Call: ${method} ${endpoint}`, data);
    
    setLoading(false);
    return { success: true, data };
  };

  // Función para subir imagen (solo disponible para admin)
  const handleImageUpload = async (file) => {
    if (!file) return null;
    
    setUploadingImage(true);
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simular subida
    
    // Simular URL de imagen subida usando Unsplash para variedad
    const randomId = Math.floor(Math.random() * 1000);
    const uploadedImageUrl = `https://images.unsplash.com/photo-${1485827404703 + randomId}?w=400&h=300&fit=crop`;
    setUploadingImage(false);
    
    console.log('Imagen subida por admin:', file.name, '-> URL:', uploadedImageUrl);
    return uploadedImageUrl;
  };

  // Funciones CRUD para tareas (solo admin)
  const createTask = async (taskData) => {
    const newTask = {
      ...taskData,
      id: Date.now(),
      dateCreated: new Date().toISOString().split('T')[0]
    };
    
    await apiCall('/api/tasks', 'POST', newTask);
    setRobotTasks([...robotTasks, newTask]);
    setShowTaskModal(false);
  };

  const updateTask = async (taskId, taskData) => {
    await apiCall(`/api/tasks/${taskId}`, 'PUT', taskData);
    setRobotTasks(robotTasks.map(task => 
      task.id === taskId ? { ...task, ...taskData } : task
    ));
    setEditingTask(null);
    setShowTaskModal(false);
  };

  const deleteTask = async (taskId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta tarea? Se eliminará el progreso de todos los estudiantes para esta tarea.')) {
      await apiCall(`/api/tasks/${taskId}`, 'DELETE');
      setRobotTasks(robotTasks.filter(task => task.id !== taskId));
      
      // Limpiar progreso de estudiantes para esta tarea
      const updatedProgress = { ...studentProgress };
      Object.keys(updatedProgress).forEach(studentId => {
        updatedProgress[studentId].completedTasks = updatedProgress[studentId].completedTasks.filter(id => id !== taskId);
        delete updatedProgress[studentId].completedDates[taskId];
      });
      setStudentProgress(updatedProgress);
    }
  };

  // Función para que el estudiante marque una tarea como completada
  const markTaskCompleted = async (taskId) => {
    const completedDate = new Date().toISOString().split('T')[0];
    
    await apiCall(`/api/tasks/${taskId}/complete`, 'PATCH', { 
      studentId: currentUser.id,
      completedDate 
    });
    
    const updatedProgress = { ...studentProgress };
    if (!updatedProgress[currentUser.id]) {
      updatedProgress[currentUser.id] = { completedTasks: [], completedDates: {} };
    }
    
    if (!updatedProgress[currentUser.id].completedTasks.includes(taskId)) {
      updatedProgress[currentUser.id].completedTasks.push(taskId);
      updatedProgress[currentUser.id].completedDates[taskId] = completedDate;
    }
    
    setStudentProgress(updatedProgress);
  };

  const downloadPDF = async (pdfUrl, taskName) => {
    await apiCall(`/api/download/${pdfUrl}`, 'GET');
    // Simular descarga
    const link = document.createElement('a');
    link.href = '#';
    link.download = `${taskName}.pdf`;
    alert(`📄 Descargando: ${taskName}.pdf`);
  };

  // Obtener estadísticas del estudiante actual
  const getCurrentUserStats = () => {
    const userProgress = studentProgress[currentUser.id] || { completedTasks: [], completedDates: {} };
    const completedTasks = userProgress.completedTasks.length;
    const totalTasks = robotTasks.length;
    const pendingTasks = totalTasks - completedTasks;
    const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    
    return { completedTasks, totalTasks, pendingTasks, progressPercentage };
  };

  // Verificar si una tarea está completada por el usuario actual
  const isTaskCompleted = (taskId) => {
    const userProgress = studentProgress[currentUser.id] || { completedTasks: [] };
    return userProgress.completedTasks.includes(taskId);
  };

  // Obtener fecha de completado de una tarea
  const getCompletedDate = (taskId) => {
    const userProgress = studentProgress[currentUser.id] || { completedDates: {} };
    return userProgress.completedDates[taskId];
  };

  // Componente Modal para crear/editar tareas (solo admin)
  const TaskModal = () => {
    const [formData, setFormData] = useState(
      editingTask || {
        name: '',
        description: '',
        difficulty: 'Básico',
        image: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=400&h=300&fit=crop',
        pdfUrl: ''
      }
    );
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(formData.image);

    const handleImageChange = (e) => {
      const file = e.target.files[0];
      if (file) {
        setImageFile(file);
        const reader = new FileReader();
        reader.onload = (e) => setImagePreview(e.target.result);
        reader.readAsDataURL(file);
      }
    };

    const handleSubmit = async (e) => {
      e.preventDefault();
      
      let finalImageUrl = formData.image;
      
      // Subir imagen si hay una nueva (solo el admin puede hacer esto)
      if (imageFile) {
        finalImageUrl = await handleImageUpload(imageFile);
      }
      
      const taskData = { ...formData, image: finalImageUrl };
      
      if (editingTask) {
        await updateTask(editingTask.id, taskData);
      } else {
        await createTask(taskData);
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-purple-900">
              {editingTask ? '✏️ Editar Tarea' : '➕ Nueva Tarea'}
            </h3>
            <button 
              onClick={() => {
                setShowTaskModal(false);
                setEditingTask(null);
              }}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                📝 Nombre de la Tarea
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Ej: Robot Seguidor de Líneas"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                📄 Descripción
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                rows="3"
                placeholder="Describe detalladamente qué debe hacer el estudiante..."
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                🎯 Nivel de Dificultad
              </label>
              <select
                value={formData.difficulty}
                onChange={(e) => setFormData({...formData, difficulty: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="Básico">🟢 Básico</option>
                <option value="Intermedio">🟡 Intermedio</option>
                <option value="Avanzado">🔴 Avanzado</option>
              </select>
            </div>
            
            {/* Upload de imagen - Solo admin */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📸 Imagen del Robot
              </label>
              <div className="space-y-3">
                {imagePreview && (
                  <div className="relative">
                    <img 
                      src={imagePreview} 
                      alt="Preview" 
                      className="w-full h-48 object-cover rounded-lg border-2 border-gray-200"
                    />
                    {uploadingImage && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
                        <div className="bg-white rounded-lg p-4 flex items-center space-x-3">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-600"></div>
                          <span className="text-sm font-medium">Subiendo imagen...</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                <div className="flex items-center space-x-3">
                  <label className="flex items-center px-4 py-2 bg-purple-50 text-purple-700 rounded-lg cursor-pointer hover:bg-purple-100 transition-colors border-2 border-purple-200">
                    <Camera className="h-4 w-4 mr-2" />
                    {imageFile ? 'Cambiar Imagen' : 'Subir Imagen'}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                  {imageFile && (
                    <span className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                      📎 {imageFile.name}
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                📋 URL del PDF (Manual de Instrucciones)
              </label>
              <input
                type="text"
                value={formData.pdfUrl}
                onChange={(e) => setFormData({...formData, pdfUrl: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="/pdfs/mi-robot-manual.pdf"
                required
              />
            </div>
            
            <div className="flex space-x-3 pt-4 border-t">
              <button
                type="submit"
                disabled={loading || uploadingImage}
                className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center justify-center font-medium"
              >
                {loading || uploadingImage ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {editingTask ? 'Actualizar Tarea' : 'Crear Tarea'}
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowTaskModal(false);
                  setEditingTask(null);
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const getDifficultyColor = (difficulty) => {
    switch(difficulty) {
      case 'Básico': return 'bg-green-100 text-green-800 border-green-200';
      case 'Intermedio': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Avanzado': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getDifficultyIcon = (difficulty) => {
    switch(difficulty) {
      case 'Básico': return '🟢';
      case 'Intermedio': return '🟡';
      case 'Avanzado': return '🔴';
      default: return '⚪';
    }
  };

  const StudentView = () => {
    const stats = getCurrentUserStats();

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        {/* Header */}
        <header className="bg-white shadow-xl border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div className="flex items-center space-x-3">
                <div className="bg-indigo-100 p-2 rounded-xl">
                  <Settings className="h-8 w-8 text-indigo-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">🤖 RoboTasks</h1>
                  <p className="text-sm text-gray-600">Plataforma de Aprendizaje Robótico</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-sm text-gray-600">Bienvenido,</p>
                  <p className="font-medium text-gray-900">{currentUser.name}</p>
                </div>
                <button 
                  onClick={() => setCurrentView('admin')}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center"
                >
                  <Users className="h-4 w-4 mr-2" />
                  Vista Admin
                </button>
                <select 
                  value={currentUser.id}
                  onChange={(e) => {
                    const student = students.find(s => s.id === parseInt(e.target.value));
                    setCurrentUser({ ...student, role: 'student' });
                  }}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  {students.map(student => (
                    <option key={student.id} value={student.id}>
                      👤 {student.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </header>

        {/* Stats Dashboard */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-lg p-6 border border-green-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">✅ Tareas Completadas</p>
                  <p className="text-3xl font-bold text-green-600">{stats.completedTasks}</p>
                  <p className="text-xs text-green-600 mt-1">¡Excelente progreso!</p>
                </div>
                <div className="bg-green-100 p-3 rounded-full">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6 border border-orange-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">⏳ Tareas Pendientes</p>
                  <p className="text-3xl font-bold text-orange-600">{stats.pendingTasks}</p>
                  <p className="text-xs text-orange-600 mt-1">¡Sigue adelante!</p>
                </div>
                <div className="bg-orange-100 p-3 rounded-full">
                  <XCircle className="h-8 w-8 text-orange-600" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6 border border-indigo-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">📊 Progreso Total</p>
                  <p className="text-3xl font-bold text-indigo-600">{stats.progressPercentage}%</p>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div 
                      className="bg-indigo-600 h-2 rounded-full transition-all duration-500" 
                      style={{ width: `${stats.progressPercentage}%` }}
                    ></div>
                  </div>
                </div>
                <div className="bg-indigo-100 p-3 rounded-full">
                  <Settings className="h-8 w-8 text-indigo-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Tasks Grid - Visible para todos los estudiantes */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">🤖 Tareas Disponibles</h2>
            <p className="text-gray-600 mb-6">Todas las tareas están disponibles para todos los estudiantes. ¡Completa las que puedas!</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {robotTasks.map(task => {
              const completed = isTaskCompleted(task.id);
              const completedDate = getCompletedDate(task.id);
              
              return (
                <div key={task.id} className={`bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 border-2 ${completed ? 'border-green-200' : 'border-gray-100'}`}>
                  <div className="relative">
                    <img 
                      src={task.image} 
                      alt={task.name}
                      className="w-full h-48 object-cover"
                    />
                    <div className="absolute top-4 right-4">
                      {completed ? (
                        <div className="bg-green-500 text-white p-2 rounded-full shadow-lg">
                          <CheckCircle className="h-6 w-6" />
                        </div>
                      ) : (
                        <div className="bg-gray-500 text-white p-2 rounded-full shadow-lg">
                          <XCircle className="h-6 w-6" />
                        </div>
                      )}
                    </div>
                    <div className="absolute top-4 left-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getDifficultyColor(task.difficulty)}`}>
                        {getDifficultyIcon(task.difficulty)} {task.difficulty}
                      </span>
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{task.name}</h3>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-3">{task.description}</p>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-sm text-gray-500">
                        <Calendar className="h-4 w-4 mr-2" />
                        📅 Publicado: {new Date(task.dateCreated).toLocaleDateString('es-ES')}
                      </div>
                      {completed && completedDate && (
                        <div className="flex items-center text-sm text-green-600 bg-green-50 p-2 rounded-lg">
                          <CheckCircle className="h-4 w-4 mr-2" />
                          ✅ Completado: {new Date(completedDate).toLocaleDateString('es-ES')}
                        </div>
                      )}
                    </div>

                    <div className="flex space-x-2">
                      <button 
                        onClick={() => downloadPDF(task.pdfUrl, task.name)}
                        className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center font-medium"
                        disabled={loading}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        📄 Descargar PDF
                      </button>
                      {!completed && (
                        <button 
                          onClick={() => markTaskCompleted(task.id)}
                          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 font-medium"
                          disabled={loading}
                        >
                          {loading ? '⏳' : '✅ Completar'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {robotTasks.length === 0 && (
            <div className="text-center py-16 bg-white rounded-xl shadow-lg">
              <div className="text-6xl mb-4">🤖</div>
              <h3 className="text-xl font-medium text-gray-900 mb-2">No hay tareas disponibles</h3>
              <p className="text-gray-500">El profesor aún no ha publicado tareas robóticas.</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const AdminView = () => {
    // Calcular estadísticas globales
    const totalCompletions = Object.values(studentProgress).reduce((acc, progress) => 
      acc + progress.completedTasks.length, 0
    );
    const totalPossibleCompletions = students.length * robotTasks.length;
    const globalCompletionRate = totalPossibleCompletions > 0 ? 
      Math.round((totalCompletions / totalPossibleCompletions) * 100) : 0;

    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50">
        {/* Header Admin */}
        <header className="bg-white shadow-xl border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div className="flex items-center space-x-3">
                <div className="bg-purple-100 p-2 rounded-xl">
                  <Users className="h-8 w-8 text-purple-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">🎓 Panel de Administración</h1>
                  <p className="text-sm text-gray-600">Gestión de Tareas y Progreso Estudiantil</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <button 
                  onClick={() => setCurrentView('student')}
                  className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center"
                >
                  <User className="h-4 w-4 mr-2" />
                  Vista Estudiante
                </button>
                <button 
                  onClick={() => setShowTaskModal(true)}
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center shadow-lg"
                  disabled={loading}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  ➕ Nueva Tarea
                </button>
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Statistics Dashboard */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-lg p-6 border border-purple-100">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-600">👥 Total Estudiantes</h3>
                  <p className="text-2xl font-bold text-purple-600">{students.length}</p>
                </div>
                <div className="bg-purple-100 p-3 rounded-full">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6 border border-blue-100">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-600">📚 Tareas Publicadas</h3>
                  <p className="text-2xl font-bold text-blue-600">{robotTasks.length}</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-full">
                  <BookOpen className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6 border border-green-100">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-600">✅ Completadas Total</h3>
                  <p className="text-2xl font-bold text-green-600">{totalCompletions}</p>
                </div>
                <div className="bg-green-100 p-3 rounded-full">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6 border border-orange-100">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-600">📊 Tasa Global</h3>
                  <p className="text-2xl font-bold text-orange-600">{globalCompletionRate}%</p>
                </div>
                <div className="bg-orange-100 p-3 rounded-full">
                  <Calendar className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Students Progress */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <Users className="h-5 w-5 mr-2 text-purple-600" />
                  📈 Progreso de Estudiantes
                </h2>
                <div className="space-y-4">
                  {students.map(student => {
                    const progress = studentProgress[student.id] || { completedTasks: [] };
                    const completed = progress.completedTasks.length;
                    const total = robotTasks.length;
                    const percentage = total > 0 ? (completed / total) * 100 : 0;
                    
                    return (
                      <div key={student.id} className="p-4 bg-gradient-to-r from-gray-50 to-purple-50 rounded-lg border">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div className="bg-purple-100 p-2 rounded-full">
                              <User className="h-4 w-4 text-purple-600" />
                            </div>
                            <div>
                              <h3 className="font-medium text-gray-900">{student.name}</h3>
                              <p className="text-sm text-gray-500">{student.email}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-purple-600">
                              {completed}/{total}
                            </p>
                            <p className="text-xs text-gray-500">{Math.round(percentage)}%</p>
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div 
                            className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full transition-all duration-500" 
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                        <div className="mt-2 flex justify-between text-xs text-gray-600">
                          <span>🏁 Iniciado</span>
                          <span>🎯 {Math.round(percentage)}% Completado</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Tasks Management */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                    <BookOpen className="h-5 w-5 mr-2 text-blue-600" />
                    🤖 Gestión de Tareas
                  </h2>
                  <p className="text-sm text-gray-600 bg-blue-50 px-3 py-1 rounded-full">
                    📝 {robotTasks.length} tareas activas
                  </p>
                </div>

                <div className="space-y-4">
                  {robotTasks.map(task => {
                    const completedByStudents = Object.values(studentProgress).filter(
                      progress => progress.completedTasks.includes(task.id)
                    ).length;
                    const completionRate = students.length > 0 ? 
                      Math.round((completedByStudents / students.length) * 100) : 0;
                    
                    return (
                      <div key={task.id} className="border-2 border-gray-100 rounded-xl p-4 hover:shadow-md transition-all duration-300 hover:border-purple-200">
                        <div className="flex items-start justify-between">
                          <div className="flex space-x-4">
                            <div className="relative">
                              <img 
                                src={task.image} 
                                alt={task.name}
                                className="w-24 h-24 object-cover rounded-lg border-2 border-gray-200"
                              />
                              <div className="absolute -top-2 -right-2">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(task.difficulty)}`}>
                                  {getDifficultyIcon(task.difficulty)}
                                </span>
                              </div>
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-900 text-lg">{task.name}</h3>
                              <p className="text-sm text-gray-600 mt-1 line-clamp-2">{task.description}</p>
                              <div className="flex items-center space-x-4 mt-3 text-xs text-gray-500">
                                <span className="flex items-center">
                                  <Calendar className="h-3 w-3 mr-1" />
                                  📅 {new Date(task.dateCreated).toLocaleDateString('es-ES')}
                                </span>
                                <span className="flex items-center">
                                  <Users className="h-3 w-3 mr-1" />
                                  👥 {completedByStudents}/{students.length} completaron
                                </span>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(task.difficulty)}`}>
                                  {task.difficulty}
                                </span>
                              </div>
                              
                              {/* Barra de progreso por tarea */}
                              <div className="mt-3">
                                <div className="flex justify-between items-center mb-1">
                                  <span className="text-xs text-gray-600">Progreso de completado</span>
                                  <span className="text-xs font-medium text-purple-600">{completionRate}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div 
                                    className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-500" 
                                    style={{ width: `${completionRate}%` }}
                                  ></div>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex flex-col space-y-2 ml-4">
                            <button 
                              onClick={() => {
                                setEditingTask(task);
                                setShowTaskModal(true);
                              }}
                              className="bg-blue-50 text-blue-700 px-3 py-2 rounded-lg hover:bg-blue-100 transition-colors flex items-center text-sm"
                              disabled={loading}
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              ✏️ Editar
                            </button>
                            <button 
                              onClick={() => downloadPDF(task.pdfUrl, task.name)}
                              className="bg-green-50 text-green-700 px-3 py-2 rounded-lg hover:bg-green-100 transition-colors flex items-center text-sm"
                              disabled={loading}
                            >
                              <Download className="h-4 w-4 mr-1" />
                              📄 PDF
                            </button>
                            <button 
                              onClick={() => deleteTask(task.id)}
                              className="bg-red-50 text-red-700 px-3 py-2 rounded-lg hover:bg-red-100 transition-colors flex items-center text-sm"
                              disabled={loading}
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              🗑️ Eliminar
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {robotTasks.length === 0 && (
                  <div className="text-center py-12 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border-2 border-dashed border-purple-200">
                    <div className="text-6xl mb-4">🤖</div>
                    <h3 className="text-xl font-medium text-gray-900 mb-2">No hay tareas creadas</h3>
                    <p className="text-gray-600 mb-4">Comienza creando tu primera tarea robótica</p>
                    <button 
                      onClick={() => setShowTaskModal(true)}
                      className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors flex items-center mx-auto"
                    >
                      <Plus className="h-5 w-5 mr-2" />
                      ➕ Crear Primera Tarea
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Modal para crear/editar tareas */}
        {showTaskModal && <TaskModal />}
      </div>
    );
  };

  return (
    <div className="App">
      {currentView === 'student' ? <StudentView /> : <AdminView />}
      {showTaskModal && <TaskModal />}
      
      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-40">
          <div className="bg-white rounded-xl p-6 flex items-center space-x-3 shadow-2xl">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
            <span className="font-medium text-gray-900">Procesando...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default RobotTaskApp;