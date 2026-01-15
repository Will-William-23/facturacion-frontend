Frontend - Sistema de Facturación Moderno

Interfaz web moderna desarrollada en Angular 17+ que consume una API REST segura. Cuenta con diseño responsivo (Bootstrap), alertas animadas (SweetAlert2) y gestión completa de facturación electrónica.

********** Características ************

UX/UI Profesional: Interfaz limpia con feedback visual (Toasts, Spinners).

Seguridad: Manejo automático de Tokens JWT e Interceptores.

Módulos:

🔐 Autenticación: Login seguro.

👥 Clientes: CRUD completo.

📦 Productos: Inventario con validación de stock visual.

📝 Facturación: Carrito de compras, cálculos en tiempo real y conexión con SRI/WhatsApp.

🛠️ Tecnologías

Framework: Angular (Standalone Components)

Estilos: Bootstrap 5

Alertas: SweetAlert2

Conexión: HttpClient

⚙️ Instalación y Ejecución

1. Prerrequisitos

Tener instalado Node.js y Angular CLI.

2. Instalar Dependencias

Ejecutar en la terminal dentro de la carpeta del proyecto:

npm install

*************************************************************************

3. Ejecutar el Proyecto
- Abrir y ejecutar primero Faturacion-api (RUN)
- Abrir y ejecutar Facturacion-Frontend
En la terminal:
ng serve -o

NOTA:
La aplicación se abrirá automáticamente en http://localhost:4200.

(Asegúrese de tener el Backend Spring Boot corriendo en el puerto 8080 y la base de datos creada(facturacion_db)).

🔑 Credenciales de Acceso

Usuario: admin

Contraseña: 123