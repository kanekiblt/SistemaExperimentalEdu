# Sistema de Matrícula - Colegio Experimental UNS



## 🎯 Acceso Rápido

### Portal Admin
- **URL**: http://localhost:3000/dashboard
- **Credenciales**: `admin@uns.edu.pe` / `admin123`

### Portal Director
- **URL**: http://localhost:3000/director
- **Credenciales**: `director@uns.edu.pe` / `director123`

### Portal Secretaría
- **URL**: http://localhost:3000/secretaria
- **Credenciales**: `secretaria@uns.edu.pe` / `secretaria123`

### Portal Padres (Público)
- **URL**: http://localhost:3000/padres

## Instalación

```bash
# Instalar dependencias
npm run install-all

# Iniciar servidor y cliente
npm run dev
```

## Configuración

Crea archivo `.env` en la raíz:

```env
PORT=5000
JWT_SECRET=secret_key_uns_2024
SMTP_USER=antonyboyer980@gmail.com
SMTP_PASS=tu_app_password
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
```

## Sistema Financiero

### Ingresos
Los ingresos se calculan automáticamente de las matrículas completadas:
- Inicial: S/ 130
- Primaria: S/ 180
- Secundaria: S/ 180

### Egresos
Registra gastos desde el dashboard administrativo o mediante API.

## Reportes Disponibles

- Ingresos mensuales por período
- Egresos mensuales por período
- Ingresos anuales
- Egresos anuales
- Balance financiero
- Lista completa de matriculados

## Tecnologías

- **Backend**: Node.js + Express + SQLite
- **Frontend**: React + Recharts
- **Email**: Nodemailer (Gmail)
- **PDF**: PDFKit


