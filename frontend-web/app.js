# Crear el archivo app.js para frontend web (JavaScript vanilla)
app_js_content = '''// Configuración de la API
const API_BASE_URL = 'http://localhost:8000';

// Estado global de la aplicación
let currentUser = null;
let authToken = null;

// Elementos del DOM
const loginScreen = document.getElementById('loginScreen');
const registerScreen = document.getElementById('registerScreen');
const dashboardScreen = document.getElementById('dashboardScreen');
const studentView = document.getElementById('studentView');
const adminView = document.getElementById('adminView');

// Inicialización de la aplicación
document.addEventListener('DOMContentLoaded', function() {
    checkAuthStatus();
    setupEventListeners();
});

// Verificar si el usuario está autenticado
function checkAuthStatus() {
    const token = localStorage.getItem('authToken');
    const user = localStorage.getItem('currentUser');
    
    if (token && user) {
        authToken = token;
        currentUser = JSON.parse(user);
        showDashboard();
    } else {
        showLogin();
    }
}

// Configurar event listeners
function setupEventListeners() {
    // Formulario de login
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    
    // Formulario de registro
    document.getElementById('registerForm').addEventListener('submit', handleRegister);
    
    // Botones de navegación
    document.getElementById('showRegister').addEventListener('click', showRegister);
    document.getElementById('showLogin').addEventListener('click', showLogin);
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);
    
    // Navegación del dashboard
    document.getElementById('tasksTab').addEventListener('click', () => showStudentTasks());
    document.getElementById('createTaskTab').addEventListener('click', () => showCreateTask());
    document.getElementById('statisticsTab').addEventListener('click', () => showStatistics());
    
    // Formulario de crear tarea
    document.getElementById('createTaskForm').addEventListener('submit', handleCreateTask);
    
    // Botón de seleccionar imagen
    document.getElementById('selectImageBtn').addEventListener('click', () => {
        document.getElementById('taskImage').click();
    });
    
    // Preview de imagen
    document.getElementById('taskImage').addEventListener('change', handleImagePreview);
}

// Mostrar pantalla de login
function showLogin() {
    hideAllScreens();
    loginScreen.style.display = 'block';
    document.getElementById('loginUsername').focus();
}

// Mostrar pantalla de registro
function showRegister() {
    hideAllScreens();
    registerScreen.style.display = 'block';
    document.getElementById('registerEmail').focus();
}

// Mostrar dashboard
function showDashboard() {
    hideAllScreens();
    dashboardScreen.style.display = 'block';
    
    // Mostrar vista según tipo de usuario
    if (currentUser.is_admin) {
        showAdminView();
    } else {
        showStudentView();
    }
    
    // Actualizar información del usuario
    document.getElementById('userInfo').textContent = 
        `${currentUser.username} (${currentUser.is_admin ? 'Administrador' : 'Estudiante'})`;
}

// Ocultar todas las pantallas
function hideAllScreens() {
    loginScreen.style.display = 'none';
    registerScreen.style.display = 'none';
    dashboardScreen.style.display = 'none';
}

// Mostrar vista de estudiante
function showStudentView() {
    adminView.style.display = 'none';
    studentView.style.display = 'block';
    
    // Mostrar solo las pestañas de estudiante
    document.getElementById('createTaskTab').style.display = 'none';
    document.getElementById('statisticsTab').style.display = 'none';
    document.getElementById('tasksTab').style.display = 'block';
    
    showStudentTasks();
}

// Mostrar vista de administrador
function showAdminView() {
    studentView.style.display = 'none';
    adminView.style.display = 'block';
    
    // Mostrar todas las pestañas
    document.getElementById('createTaskTab').style.display = 'block';
    document.getElementById('statisticsTab').style.display = 'block';
    document.getElementById('tasksTab').style.display = 'none';
    
    showCreateTask();
}

// Manejar login
async function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    
    if (!username || !password) {
        showAlert('Por favor completa todos los campos', 'error');
        return;
    }
    
    showLoading('loginBtn', true);
    
    try {
        const formData = new FormData();
        formData.append('username', username);
        formData.append('password', password);
        
        const response = await fetch(`${API_BASE_URL}/login`, {
            method: 'POST',
            body: formData
        });
        
        if (response.ok) {
            const data = await response.json();
            authToken = data.access_token;
            
            // Obtener datos del usuario
            const userResponse = await fetch(`${API_BASE_URL}/me`, {
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });
            
            if (userResponse.ok) {
                currentUser = await userResponse.json();
                
                // Guardar en localStorage
                localStorage.setItem('authToken', authToken);
                localStorage.setItem('currentUser', JSON.stringify(currentUser));
                
                showAlert('Login exitoso', 'success');
                showDashboard();
            }
        } else {
            const errorData = await response.json();
            showAlert(errorData.detail || 'Error de login', 'error');
        }
    } catch (error) {
        showAlert('Error de conexión', 'error');
    } finally {
        showLoading('loginBtn', false);
    }
}

// Manejar registro
async function handleRegister(e) {
    e.preventDefault();
    
    const email = document.getElementById('registerEmail').value;
    const username = document.getElementById('registerUsername').value;
    const password = document.getElementById('registerPassword').value;
    const isAdmin = document.getElementById('registerIsAdmin').checked;
    
    if (!email || !username || !password) {
        showAlert('Por favor completa todos los campos', 'error');
        return;
    }
    
    showLoading('registerBtn', true);
    
    try {
        const response = await fetch(`${API_BASE_URL}/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email,
                username,
                password,
                is_admin: isAdmin
            })
        });
        
        if (response.ok) {
            showAlert('Usuario registrado correctamente', 'success');
            document.getElementById('registerForm').reset();
            showLogin();
        } else {
            const errorData = await response.json();
            showAlert(errorData.detail || 'Error de registro', 'error');
        }
    } catch (error) {
        showAlert('Error de conexión', 'error');
    } finally {
        showLoading('registerBtn', false);
    }
}

// Manejar logout
function handleLogout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    authToken = null;
    currentUser = null;
    showLogin();
    showAlert('Sesión cerrada', 'info');
}

// Mostrar tareas del estudiante
async function showStudentTasks() {
    setActiveTab('tasksTab');
    
    try {
        const response = await fetch(`${API_BASE_URL}/my-tasks`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (response.ok) {
            const tasks = await response.json();
            renderStudentTasks(tasks);
        } else {
            showAlert('Error al cargar las tareas', 'error');
        }
    } catch (error) {
        showAlert('Error de conexión', 'error');
    }
}

// Renderizar tareas del estudiante
function renderStudentTasks(tasks) {
    const container = document.getElementById('studentTasksList');
    
    if (tasks.length === 0) {
        container.innerHTML = '<p class="text-center text-muted">No hay tareas asignadas</p>';
        return;
    }
    
    container.innerHTML = tasks.map(item => `
        <div class="card mb-3">
            <div class="card-body">
                <div class="d-flex justify-content-between align-items-start mb-2">
                    <h5 class="card-title">${item.task.title}</h5>
                    <button class="btn btn-sm ${item.completed ? 'btn-success' : 'btn-warning'}" 
                            onclick="toggleTaskCompletion(${item.task.id}, ${item.completed})">
                        ${item.completed ? 'Completada' : 'Pendiente'}
                    </button>
                </div>
                <p class="card-text">${item.task.description}</p>
                ${item.task.image_path ? `
                    <img src="${API_BASE_URL}${item.task.image_path}" 
                         class="img-fluid mb-2" style="max-height: 200px;">
                ` : ''}
                ${item.task.due_date ? `
                    <p class="text-danger"><small>Fecha límite: ${formatDate(item.task.due_date)}</small></p>
                ` : ''}
                ${item.completed_at ? `
                    <p class="text-success"><small>Completada: ${formatDate(item.completed_at)}</small></p>
                ` : ''}
            </div>
        </div>
    `).join('');
}

// Alternar completado de tarea
async function toggleTaskCompletion(taskId, isCompleted) {
    try {
        const endpoint = isCompleted ? 'uncomplete' : 'complete';
        const response = await fetch(`${API_BASE_URL}/tasks/${taskId}/${endpoint}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (response.ok) {
            showAlert(`Tarea ${isCompleted ? 'marcada como pendiente' : 'completada'}`, 'success');
            showStudentTasks(); // Recargar tareas
        } else {
            showAlert('Error al actualizar la tarea', 'error');
        }
    } catch (error) {
        showAlert('Error de conexión', 'error');
    }
}

// Mostrar formulario de crear tarea
function showCreateTask() {
    setActiveTab('createTaskTab');
    document.getElementById('adminContent').innerHTML = `
        <h3>Crear Nueva Tarea</h3>
        <form id="createTaskForm">
            <div class="mb-3">
                <label for="taskTitle" class="form-label">Título</label>
                <input type="text" class="form-control" id="taskTitle" required>
            </div>
            <div class="mb-3">
                <label for="taskDescription" class="form-label">Descripción</label>
                <textarea class="form-control" id="taskDescription" rows="4" required></textarea>
            </div>
            <div class="mb-3">
                <label for="taskDueDate" class="form-label">Fecha límite (opcional)</label>
                <input type="date" class="form-control" id="taskDueDate">
            </div>
            <div class="mb-3">
                <label class="form-label">Imagen del robot</label>
                <input type="file" class="form-control" id="taskImage" accept="image/*" style="display: none;">
                <button type="button" class="btn btn-outline-primary" id="selectImageBtn">
                    Seleccionar Imagen
                </button>
                <div id="imagePreview" class="mt-2"></div>
            </div>
            <button type="submit" class="btn btn-primary" id="createTaskBtn">
                Crear Tarea
            </button>
        </form>
    `;
    
    // Reconfigurar event listeners
    document.getElementById('createTaskForm').addEventListener('submit', handleCreateTask);
    document.getElementById('selectImageBtn').addEventListener('click', () => {
        document.getElementById('taskImage').click();
    });
    document.getElementById('taskImage').addEventListener('change', handleImagePreview);
}

// Manejar preview de imagen
function handleImagePreview(e) {
    const file = e.target.files[0];
    const preview = document.getElementById('imagePreview');
    
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            preview.innerHTML = `
                <img src="${e.target.result}" class="img-thumbnail" style="max-height: 200px;">
                <p class="mt-1 text-muted">${file.name}</p>
            `;
        };
        reader.readAsDataURL(file);
    } else {
        preview.innerHTML = '';
    }
}

// Manejar creación de tarea
async function handleCreateTask(e) {
    e.preventDefault();
    
    const title = document.getElementById('taskTitle').value;
    const description = document.getElementById('taskDescription').value;
    const dueDate = document.getElementById('taskDueDate').value;
    const imageFile = document.getElementById('taskImage').files[0];
    
    if (!title || !description || !imageFile) {
        showAlert('Por favor completa todos los campos y selecciona una imagen', 'error');
        return;
    }
    
    showLoading('createTaskBtn', true);
    
    try {
        const formData = new FormData();
        formData.append('title', title);
        formData.append('description', description);
        if (dueDate) {
            formData.append('due_date', new Date(dueDate).toISOString());
        }
        formData.append('image', imageFile);
        
        const response = await fetch(`${API_BASE_URL}/tasks`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`
            },
            body: formData
        });
        
        if (response.ok) {
            showAlert('Tarea creada correctamente', 'success');
            document.getElementById('createTaskForm').reset();
            document.getElementById('imagePreview').innerHTML = '';
        } else {
            const errorData = await response.json();
            showAlert(errorData.detail || 'Error al crear la tarea', 'error');
        }
    } catch (error) {
        showAlert('Error de conexión', 'error');
    } finally {
        showLoading('createTaskBtn', false);
    }
}

// Mostrar estadísticas
async function showStatistics() {
    setActiveTab('statisticsTab');
    
    try {
        const [overviewResponse, tasksResponse] = await Promise.all([
            fetch(`${API_BASE_URL}/statistics/overview`, {
                headers: { 'Authorization': `Bearer ${authToken}` }
            }),
            fetch(`${API_BASE_URL}/statistics/tasks`, {
                headers: { 'Authorization': `Bearer ${authToken}` }
            })
        ]);
        
        if (overviewResponse.ok && tasksResponse.ok) {
            const overview = await overviewResponse.json();
            const taskStats = await tasksResponse.json();
            renderStatistics(overview, taskStats);
        } else {
            showAlert('Error al cargar las estadísticas', 'error');
        }
    } catch (error) {
        showAlert('Error de conexión', 'error');
    }
}

// Renderizar estadísticas
function renderStatistics(overview, taskStats) {
    document.getElementById('adminContent').innerHTML = `
        <h3>Estadísticas</h3>
        
        <div class="row mb-4">
            <div class="col-md-6">
                <div class="card">
                    <div class="card-body">
                        <h5 class="card-title">Resumen General</h5>
                        <p><strong>Total de Tareas:</strong> ${overview.total_tasks}</p>
                        <p><strong>Total de Estudiantes:</strong> ${overview.total_students}</p>
                        <p><strong>Tareas Completadas:</strong> ${overview.completed_submissions}</p>
                        <p><strong>Tareas Pendientes:</strong> ${overview.pending_submissions}</p>
                        <p><strong>Tasa de Finalización:</strong> ${overview.overall_completion_rate}%</p>
                    </div>
                </div>
            </div>
        </div>
        
        <h4>Estadísticas por Tarea</h4>
        <div class="row">
            ${taskStats.map(task => `
                <div class="col-md-6 mb-3">
                    <div class="card">
                        <div class="card-body">
                            <h6 class="card-title">${task.task_title}</h6>
                            <p class="mb-1">Completadas: ${task.completed}</p>
                            <p class="mb-1">Pendientes: ${task.pending}</p>
                            <p class="mb-0">Tasa: ${task.completion_rate}%</p>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

// Funciones auxiliares
function setActiveTab(activeTabId) {
    // Remover clase active de todas las pestañas
    document.querySelectorAll('.nav-link').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Agregar clase active a la pestaña seleccionada
    document.getElementById(activeTabId).classList.add('active');
}

function showAlert(message, type) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type === 'error' ? 'danger' : type} alert-dismissible fade show`;
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    // Insertar al inicio del body
    document.body.insertBefore(alertDiv, document.body.firstChild);
    
    // Auto-remover después de 5 segundos
    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.remove();
        }
    }, 5000);
}

function showLoading(buttonId, isLoading) {
    const button = document.getElementById(buttonId);
    if (isLoading) {
        button.disabled = true;
        button.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Cargando...';
    } else {
        button.disabled = false;
        // Restaurar texto original basado en el ID
        const originalTexts = {
            'loginBtn': 'Iniciar Sesión',
            'registerBtn': 'Registrarse',
            'createTaskBtn': 'Crear Tarea'
        };
        button.innerHTML = originalTexts[buttonId] || 'Enviar';
    }
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('es-ES');
}

// Función global para toggle de tareas (llamada desde HTML)
window.toggleTaskCompletion = toggleTaskCompletion;
'''

# Escribir el archivo
with open('app.js', 'w', encoding='utf-8') as f:
    f.write(app_js_content)

print("✅ Archivo app.js creado exitosamente")
print("📁 Ubicación: app.js")
print("🌐 Este archivo es para el frontend web (JavaScript vanilla)")
print("📱 Es diferente al app.js de React Native que ya tienes")