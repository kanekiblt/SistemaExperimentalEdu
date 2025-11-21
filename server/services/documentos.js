const PDFDocument = require('pdfkit');
const db = require('../config/database');

const generarConstancia = async (matriculaId) => {
  return new Promise((resolve, reject) => {
    const database = db.getDb();
    
    database.get(
      `SELECT m.*, e.*, a.*
       FROM matriculas m
       JOIN estudiantes e ON m.estudiante_id = e.id
       LEFT JOIN apoderados a ON e.id = a.estudiante_id
       WHERE m.id = ?`,
      [matriculaId],
      (err, matricula) => {
        if (err) {
          return reject(err);
        }

        if (!matricula) {
          return reject(new Error('Matrícula no encontrada'));
        }

        const doc = new PDFDocument({ margin: 50 });
        const chunks = [];

        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Encabezado
        doc.fontSize(16).text('COLEGIO EXPERIMENTAL', { align: 'center' });
        doc.fontSize(14).text('UNIVERSIDAD NACIONAL DEL SANTA', { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).text('AVENIDA UNIVERSITARIA S/N - NUEVO CHIMBOTE', { align: 'center' });
        doc.moveDown(2);

        // Título
        doc.fontSize(14).text('CONSTANCIA DE MATRÍCULA', { align: 'center', underline: true });
        doc.moveDown(2);

        // Contenido
        doc.fontSize(11);
        doc.text(`Por medio del presente documento, se hace constar que el estudiante:`);
        doc.moveDown();
        
        doc.fontSize(12).font('Helvetica-Bold');
        doc.text(`${matricula.nombres} ${matricula.apellidos}`, { indent: 50 });
        doc.font('Helvetica').fontSize(11);
        doc.moveDown();

        doc.text(`DNI: ${matricula.dni}`);
        doc.text(`Nivel: ${matricula.nivel}`);
        if (matricula.grado) {
          doc.text(`Grado: ${matricula.grado}`);
        }
        doc.text(`Turno: ${matricula.turno}`);
        doc.text(`Año Académico: ${matricula.año_academico}`);
        doc.moveDown();

        doc.text(`Se encuentra matriculado en esta institución educativa para el año académico ${matricula.año_academico}.`);
        doc.moveDown(2);

        if (matricula.apoderado_nombres) {
          doc.text(`Apoderado: ${matricula.apoderado_nombres} ${matricula.apoderado_apellidos || ''}`);
          doc.text(`DNI Apoderado: ${matricula.apoderado_dni || 'N/A'}`);
          doc.moveDown();
        }

        doc.text(`Pensión Referencial: S/ ${matricula.pension}`);
        doc.moveDown(2);

        // Fecha
        const fecha = new Date().toLocaleDateString('es-PE', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
        doc.text(`Chimbote, ${fecha}`);
        doc.moveDown(3);

        // Firma
        doc.text('_________________________', { align: 'center' });
        doc.text('SECRETARÍA ACADÉMICA', { align: 'center' });
        doc.text('Colegio Experimental UNS', { align: 'center' });

        // Marcar como generada
        database.run(
          'UPDATE matriculas SET constancia_generada = 1 WHERE id = ?',
          [matriculaId]
        );

        doc.end();
      }
    );
  });
};

module.exports = {
  generarConstancia
};

