# 🚗 CarMarket - Marketplace de Vehículos

<div align="center">
  <img src="/public/logos/mainLogo.png" alt="CarMarket Logo" width="200"/>
  <p><strong>Una plataforma moderna para la compra y venta de vehículos</strong></p>
</div>

## 📋 Descripción

CarMarket es una plataforma web moderna y robusta diseñada para facilitar la compra y venta de vehículos. Construida con tecnologías de última generación, ofrece una experiencia fluida y segura tanto para compradores como vendedores.

## ✨ Características Principales

- 🔐 **Sistema de Autenticación Robusto**
  - Registro y login de usuarios
  - Roles diferenciados (admin, vendedor, comprador)
  - Gestión de sesiones segura

- 📝 **Gestión de Listados**
  - Creación y edición de anuncios con auto-guardado
  - Sistema avanzado de formularios multi-paso
  - Carga de imágenes y documentos
  - Vista previa de anuncios

- 🖼️ **Gestión de Multimedia**
  - Soporte para múltiples imágenes por anuncio
  - Carga de documentos del vehículo
  - Almacenamiento seguro en Supabase Storage
  - Generación de URLs firmadas para documentos privados

- 👥 **Panel de Administración**
  - Gestión de usuarios y roles
  - Moderación de anuncios
  - Estadísticas y reportes

- 🌐 **Características Adicionales**
  - Soporte multiidioma
  - Diseño responsivo
  - Interfaz moderna con Tailwind CSS y shadcn/ui
  - Optimización SEO

## 🛠️ Tecnologías Utilizadas

- **Frontend:**
  - Next.js 14 (App Router)
  - React
  - TypeScript
  - Tailwind CSS
  - shadcn/ui
  - Lucide Icons

- **Backend:**
  - Supabase
  - PostgreSQL
  - Row Level Security (RLS)
  - Edge Functions

- **Almacenamiento:**
  - Supabase Storage
  - Gestión de archivos segura

## 📦 Requisitos Previos

- Node.js 18.x o superior
- npm o pnpm
- Cuenta en Supabase
- Git

## 🚀 Instalación y Configuración

1. **Clonar el repositorio**
   ```bash
   git clone [URL_DEL_REPOSITORIO]
   cd carmarket
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   # o
   pnpm install
   ```

3. **Configurar variables de entorno**
   ```bash
   cp .env.example .env.local
   ```
   Editar `.env.local` con tus credenciales de Supabase:
   ```
   NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
   NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_anonima
   ```

4. **Iniciar el servidor de desarrollo**
   ```bash
   npm run dev
   # o
   pnpm dev
   ```

## 📁 Estructura del Proyecto

```
carmarket/
├── app/                # Componentes y páginas de Next.js
├── components/         # Componentes reutilizables
├── lib/               # Utilidades y configuraciones
├── public/            # Archivos estáticos
├── services/          # Servicios de la aplicación
├── styles/            # Estilos globales
├── types/             # Definiciones de TypeScript
└── utils/             # Funciones auxiliares
```

## 🔧 Configuración de Base de Datos

El proyecto utiliza Supabase como backend. Necesitarás:

1. Crear un proyecto en Supabase
2. Ejecutar las migraciones SQL incluidas
3. Configurar las políticas de RLS
4. Habilitar el almacenamiento y crear los buckets necesarios

## 📚 Documentación Adicional

- [Guía de Contribución](CONTRIBUTING.md)
- [Documentación de API](API.md)
- [Guía de Despliegue](DEPLOYMENT.md)

## 🌟 Características Próximas

- [ ] Sistema de mensajería entre usuarios
- [ ] Integración con pasarelas de pago
- [ ] Sistema de reseñas y calificaciones
- [ ] Búsqueda avanzada con filtros
- [ ] Notificaciones en tiempo real

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE.md](LICENSE.md) para más detalles.

## 👥 Equipo

- [Nombre del Desarrollador Principal]
- [Otros Contribuidores]

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor, lee la [guía de contribución](CONTRIBUTING.md) antes de enviar un pull request.

## 📞 Soporte

Si tienes alguna pregunta o problema, por favor abre un issue en el repositorio o contacta al equipo de desarrollo. kodeandoando2023@gmail.com

---

<div align="center">
  <p>Desarrollado con ❤️ por ROR2022</p>
</div>
