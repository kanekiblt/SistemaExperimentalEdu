const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, '../../data/matricula.db');

let db = null;

const init = () => {
  return new Promise((resolve, reject) => {
    db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        console.error('Error al conectar con la base de datos:', err);
        reject(err);
      } else {
        console.log('✅ Base de datos conectada');
        createTables();
        resolve();
      }
    });
  });
};

const createTables = () => {
  // Tabla de usuarios (directores, secretarios, etc.)
  db.run(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      rol TEXT NOT NULL,
      activo INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Tabla de estudiantes
  db.run(`
    CREATE TABLE IF NOT EXISTS estudiantes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      dni TEXT UNIQUE NOT NULL,
      nombres TEXT NOT NULL,
      apellidos TEXT NOT NULL,
      fecha_nacimiento DATE NOT NULL,
      nivel TEXT NOT NULL,
      grado TEXT,
      turno TEXT,
      estado TEXT DEFAULT 'activo',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Tabla de padres/apoderados
  db.run(`
    CREATE TABLE IF NOT EXISTS apoderados (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      estudiante_id INTEGER,
      nombres TEXT NOT NULL,
      apellidos TEXT NOT NULL,
      dni TEXT NOT NULL,
      telefono TEXT,
      email TEXT,
      parentesco TEXT,
      FOREIGN KEY (estudiante_id) REFERENCES estudiantes(id)
    )
  `);

  // Tabla de matrículas
  db.run(`
    CREATE TABLE IF NOT EXISTS matriculas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      estudiante_id INTEGER,
      año_academico TEXT NOT NULL,
      nivel TEXT NOT NULL,
      grado TEXT,
      turno TEXT,
      pension REAL,
      estado TEXT DEFAULT 'pendiente',
      fecha_inscripcion DATETIME DEFAULT CURRENT_TIMESTAMP,
      fecha_ratificacion DATETIME,
      fecha_pago DATETIME,
      numero_voucher TEXT,
      documentos_completos INTEGER DEFAULT 0,
      constancia_generada INTEGER DEFAULT 0,
      FOREIGN KEY (estudiante_id) REFERENCES estudiantes(id)
    )
  `);

  // Tabla de vacantes
  db.run(`
    CREATE TABLE IF NOT EXISTS vacantes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      año_academico TEXT NOT NULL,
      nivel TEXT NOT NULL,
      grado TEXT,
      turno TEXT,
      total INTEGER NOT NULL,
      ocupadas INTEGER DEFAULT 0,
      disponibles INTEGER NOT NULL
    )
  `);

  // Tabla de notificaciones
  db.run(`
    CREATE TABLE IF NOT EXISTS notificaciones (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      destinatario TEXT NOT NULL,
      tipo TEXT NOT NULL,
      canal TEXT NOT NULL,
      mensaje TEXT NOT NULL,
      estado TEXT DEFAULT 'pendiente',
      fecha_envio DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Tabla de documentos
  db.run(`
    CREATE TABLE IF NOT EXISTS documentos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      matricula_id INTEGER,
      tipo_documento TEXT NOT NULL,
      nombre_archivo TEXT,
      ruta_archivo TEXT,
      estado TEXT DEFAULT 'pendiente',
      fecha_subida DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (matricula_id) REFERENCES matriculas(id)
    )
  `);

  // Tabla de planificación de matrícula
  db.run(`
    CREATE TABLE IF NOT EXISTS planificacion_matricula (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      año_academico TEXT NOT NULL,
      fecha_inicio DATE,
      fecha_fin DATE,
      estado TEXT DEFAULT 'borrador',
      creado_por INTEGER,
      aprobado_por INTEGER,
      fecha_aprobacion DATETIME,
      observaciones TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (creado_por) REFERENCES usuarios(id),
      FOREIGN KEY (aprobado_por) REFERENCES usuarios(id)
    )
  `);

  // Tabla de convocatorias
  db.run(`
    CREATE TABLE IF NOT EXISTS convocatorias (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      año_academico TEXT NOT NULL,
      titulo TEXT NOT NULL,
      descripcion TEXT,
      fecha_inicio DATE,
      fecha_fin DATE,
      estado TEXT DEFAULT 'activa',
      publicada INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Tabla de consultas de padres
  db.run(`
    CREATE TABLE IF NOT EXISTS consultas_padres (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      apoderado_dni TEXT,
      estudiante_dni TEXT,
      tipo_consulta TEXT,
      mensaje TEXT,
      respuesta TEXT,
      estado TEXT DEFAULT 'pendiente',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Insertar usuarios por defecto
  const bcrypt = require('bcryptjs');
  const adminPassword = bcrypt.hashSync('admin123', 10);
  const directorPassword = bcrypt.hashSync('director123', 10);
  const secretariaPassword = bcrypt.hashSync('secretaria123', 10);
  
  db.run(`
    INSERT OR IGNORE INTO usuarios (nombre, email, password, rol)
    VALUES 
    ('Administrador', 'admin@uns.edu.pe', ?, 'admin'),
    ('Director General', 'director@uns.edu.pe', ?, 'director'),
    ('Secretaría Académica', 'secretaria@uns.edu.pe', ?, 'secretaria')
  `, [adminPassword, directorPassword, secretariaPassword]);

  // Insertar estudiantes de ejemplo con sus padres
  const estudiantesEjemplo = [
    {
      estudiante: { dni: '12345678', nombres: 'Juan Carlos', apellidos: 'Pérez García', fecha_nacimiento: '2015-03-15', nivel: 'Primaria', grado: '3ro', turno: 'Mañana' },
      apoderado: { nombres: 'Mirian', apellidos: 'Pérez López', dni: '87654321', telefono: '987654321', email: 'mirian2demayo@gmail.com', parentesco: 'Madre' }
    },
    {
      estudiante: { dni: '23456789', nombres: 'María Elena', apellidos: 'González Sánchez', fecha_nacimiento: '2016-07-20', nivel: 'Primaria', grado: '2do', turno: 'Tarde' },
      apoderado: { nombres: 'Kane', apellidos: 'González Martínez', dni: '76543210', telefono: '987654322', email: 'kanekik0902@gmail.com', parentesco: 'Padre' }
    },
    {
      estudiante: { dni: '34567890', nombres: 'Antony', apellidos: 'Boyer Rodríguez', fecha_nacimiento: '2014-11-10', nivel: 'Primaria', grado: '4to', turno: 'Mañana' },
      apoderado: { nombres: 'Antony', apellidos: 'Boyer', dni: '65432109', telefono: '987654323', email: 'antonyboyer980@gmail.com', parentesco: 'Padre' }
    },
    {
      estudiante: { dni: '45678901', nombres: 'Luis Fernando', apellidos: 'Ramírez Torres', fecha_nacimiento: '2013-05-25', nivel: 'Secundaria', grado: '1ro', turno: 'Mañana' },
      apoderado: { nombres: 'Fernando', apellidos: 'Ramírez', dni: '54321098', telefono: '987654324', email: 'fernando.ramirez@email.com', parentesco: 'Padre' }
    },
    {
      estudiante: { dni: '56789012', nombres: 'Ana Sofía', apellidos: 'Morales Díaz', fecha_nacimiento: '2017-09-12', nivel: 'Inicial', grado: '4 años', turno: 'Mañana' },
      apoderado: { nombres: 'Sofía', apellidos: 'Morales', dni: '43210987', telefono: '987654325', email: 'sofia.morales@email.com', parentesco: 'Madre' }
    },
    {
      estudiante: { dni: '67890123', nombres: 'Diego Alejandro', apellidos: 'Vargas Castro', fecha_nacimiento: '2015-12-30', nivel: 'Primaria', grado: '3ro', turno: 'Tarde' },
      apoderado: { nombres: 'Alejandro', apellidos: 'Vargas', dni: '32109876', telefono: '987654326', email: 'alejandro.vargas@email.com', parentesco: 'Padre' }
    },
    {
      estudiante: { dni: '78901234', nombres: 'Valentina', apellidos: 'Herrera Mendoza', fecha_nacimiento: '2016-02-14', nivel: 'Primaria', grado: '2do', turno: 'Mañana' },
      apoderado: { nombres: 'Valentina', apellidos: 'Herrera', dni: '21098765', telefono: '987654327', email: 'valentina.herrera@email.com', parentesco: 'Madre' }
    },
    {
      estudiante: { dni: '89012345', nombres: 'Sebastián', apellidos: 'Jiménez Ruiz', fecha_nacimiento: '2012-08-05', nivel: 'Secundaria', grado: '2do', turno: 'Tarde' },
      apoderado: { nombres: 'Sebastián', apellidos: 'Jiménez', dni: '10987654', telefono: '987654328', email: 'sebastian.jimenez@email.com', parentesco: 'Padre' }
    }
  ];

  // Insertar estudiantes de ejemplo
  estudiantesEjemplo.forEach((item) => {
    db.run(
      `INSERT OR IGNORE INTO estudiantes (dni, nombres, apellidos, fecha_nacimiento, nivel, grado, turno, estado)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'activo')`,
      [
        item.estudiante.dni,
        item.estudiante.nombres,
        item.estudiante.apellidos,
        item.estudiante.fecha_nacimiento,
        item.estudiante.nivel,
        item.estudiante.grado,
        item.estudiante.turno
      ],
      function(err) {
        if (err) {
          console.error('Error al insertar estudiante:', err);
          return;
        }
        const estudianteId = this.lastID || this.changes;
        
        // Obtener el ID del estudiante recién insertado
        db.get('SELECT id FROM estudiantes WHERE dni = ?', [item.estudiante.dni], (err, row) => {
          if (err || !row) return;
          
          // Insertar apoderado
          db.run(
            `INSERT OR IGNORE INTO apoderados (estudiante_id, nombres, apellidos, dni, telefono, email, parentesco)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
              row.id,
              item.apoderado.nombres,
              item.apoderado.apellidos,
              item.apoderado.dni,
              item.apoderado.telefono,
              item.apoderado.email,
              item.apoderado.parentesco
            ]
          );
        });
      }
    );
  });

  console.log('✅ Tablas creadas correctamente');
  console.log('✅ Estudiantes de ejemplo insertados');
};

const getDb = () => {
  if (!db) {
    throw new Error('Base de datos no inicializada');
  }
  return db;
};

const close = () => {
  if (db) {
    db.close((err) => {
      if (err) {
        console.error('Error al cerrar la base de datos:', err);
      } else {
        console.log('Base de datos cerrada');
      }
    });
  }
};

module.exports = {
  init,
  getDb,
  close
};

