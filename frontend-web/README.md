# Sistema de Tareas Educativas - Frontend Web

Este es el frontend web para el sistema de asignación de tareas educativas, creado para complementar la aplicación móvil React Native.

## 🚀 Características

### Para Estudiantes:
- ✅ Ver tareas asignadas
- ✅ Marcar tareas como completadas/pendientes
- ✅ Ver imágenes de robots asociadas a las tareas
- ✅ Seguimiento de fechas de entrega y completado
- ✅ Perfil de usuario

### Para Administradores:
- ✅ Crear nuevas tareas con imágenes
- ✅ Ver todas las tareas creadas
- ✅ Estadísticas detalladas de progreso
- ✅ Ver detalles de cada tarea y submissions
- ✅ Gestión de usuarios

## 📁 Archivos del Frontend

- `index.html` - Página principal con toda la estructura HTML
- `app.js` - Lógica JavaScript de la aplicación
- `styles.css` - Estilos CSS adicionales y mejoras visuales

## 🛠️ Instalación y Uso

### 1. Asegúrate de que la API esté ejecutándose:
```bash
# En el directorio del proyecto
uvicorn api:app --reload --host 0.0.0.0 --port 8000
```

### 2. Abrir el frontend:
- Simplemente abre `index.html` en tu navegador web
- O usa un servidor local:
```bash
# Con Python
python -m http.server 3000

# Con Node.js (si tienes live-server instalado)
npx live-server --port=3000
```

### 3. Acceder a la aplicación:
- Frontend: http://localhost:3000 (si usas servidor local) o directamente el archivo HTML
- API: http://localhost:8000
- Documentación API: http://localhost:8000/docs

## 👤 Credenciales por Defecto

- **Administrador:** `admin` / `admin123`

## 🔧 Configuración

### Cambiar URL de la API:
En `app.js`, línea 2:
```javascript
const API_BASE_URL = 'http://127.0.0.1:8000'; // Cambia por tu URL
```

## 📱 Funcionalidades Implementadas

### Autenticación:
- Login con usuario/contraseña
- Registro de nuevos usuarios
- Gestión de tokens JWT
- Persistencia de sesión en localStorage

### Gestión de Tareas:
- Crear tareas con imágenes (solo admin)
- Ver lista de tareas asignadas (estudiantes)
- Marcar tareas como completadas
- Ver detalles completos de cada tarea

### Estadísticas (Solo Admin):
- Resumen general del sistema
- Estadísticas por tarea
- Progreso de estudiantes
- Tasas de finalización

### Interfaz:
- Diseño responsive (móvil y desktop)
- Tema Bootstrap 5
- Iconos Font Awesome
- Animaciones CSS
- Alertas y modales
- Carga de archivos con preview

## 🎨 Características de Diseño

- **Responsive:** Funciona en móviles, tablets y desktop
- **Moderno:** Usa Bootstrap 5 y Font Awesome
- **Intuitivo:** Navegación clara y fácil de usar
- **Accesible:** Cumple estándares de accesibilidad web
- **Rápido:** Carga asíncrona de contenido

## 🔄 Sincronización con App Móvil

Este frontend web comparte la misma API que la aplicación móvil React Native, por lo que:
- Los datos están sincronizados en tiempo real
- Los usuarios pueden usar ambas interfaces
- Las tareas creadas en web aparecen en móvil y viceversa

## 🐛 Solución de Problemas

### Error de CORS:
Si tienes problemas de CORS, asegúrate de que la API tenga configurado:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En producción, especifica dominios
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Imágenes no se cargan:
- Verifica que la carpeta `uploads/` exista
- Comprueba que la API esté sirviendo archivos estáticos
- Revisa la URL base en `app.js`

### Problemas de autenticación:
- Limpia localStorage: `localStorage.clear()`
- Verifica que el token JWT sea válido
- Comprueba la configuración de SECRET_KEY en la API

## 📚 Tecnologías Utilizadas

- **HTML5** - Estructura semántica
- **CSS3** - Estilos y animaciones
- **JavaScript ES6+** - Lógica de aplicación
- **Bootstrap 5** - Framework CSS
- **Font Awesome** - Iconografía
- **Fetch API** - Comunicación con backend

## 🚀 Próximas Mejoras

- [ ] Modo oscuro
- [ ] Notificaciones push
- [ ] Chat entre usuarios
- [ ] Exportar estadísticas a PDF
- [ ] Filtros avanzados de tareas
- [ ] Calendario de tareas
- [ ] Gamificación (puntos, badges)

## 📄 Licencia

Este proyecto es parte del sistema educativo de robótica.
