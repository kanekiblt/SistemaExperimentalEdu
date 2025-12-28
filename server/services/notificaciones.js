const nodemailer = require('nodemailer');
const db = require('../config/database');


const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: false, 
  auth: {
    user: process.env.SMTP_USER || 'antonyboyer980@gmail.com',
    pass: process.env.SMTP_PASS || 'password'
  },
  tls: {
    rejectUnauthorized: false
  }
});

const verificarEmail = () => {
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  if (!smtpUser || !smtpPass || smtpUser === 'uns.matricula@gmail.com' || smtpPass === 'password') {
    console.log(' Email no configurado');
    console.log('Para habilitar el envío de emails:');
    console.log('   1. Crea un archivo .env en la raíz del proyecto');
    console.log('   2. Agrega las siguientes líneas:');
    console.log('      SMTP_USER=tu_email@gmail.com');
    console.log('      SMTP_PASS=tu_app_password');
    console.log('   3. Si usas Gmail con 2FA, genera una "App Password" en tu cuenta de Google');
    return;
  }

  transporter.verify(function (error, success) {
    if (error) {
      console.log('Error en configuración de email:', error.message);
      if (error.code === 'EAUTH' || error.message.includes('Invalid login') || error.message.includes('BadCredentials')) {
        console.log('');
        console.log('PROBLEMA DE AUTENTICACIÓN DETECTADO');
        console.log('');
        console.log('Soluciones:');
        console.log('   1. Asegúrate de usar una "App Password" (NO tu contraseña normal)');
        console.log('   2. Genera una App Password en: https://myaccount.google.com/apppasswords');
        console.log('   3. Necesitas tener "Verificación en 2 pasos" activada');
        console.log('   4. Copia los 16 caracteres completos de la App Password');
        console.log('   5. Úsala en SMTP_PASS en el archivo .env');
        console.log('');
        console.log(' Ver archivo: SOLUCION_ERROR_GMAIL.md para más detalles');
      } else {
        console.log('Verifica que SMTP_USER y SMTP_PASS sean correctos');
      }
    } else {
      console.log('Servidor de email configurado correctamente');
      console.log(`   Usuario: ${smtpUser}`);
      console.log('   Listo para enviar emails');
    }
  });
};

// Verificar al cargar el módulo
verificarEmail();
console.log("PA NDA JHONA")

// Guardar notificación en BD
const guardarNotificacion = (destinatario, tipo, canal, mensaje, estado = 'enviado') => {
  const database = db.getDb();
  database.run(
    `INSERT INTO notificaciones (destinatario, tipo, canal, mensaje, estado, fecha_envio)
     VALUES (?, ?, ?, ?, ?, datetime('now'))`,
    [destinatario, tipo, canal, mensaje, estado]
  );
};

// Enviar email
const enviarEmail = async (email, mensaje, asunto = 'Notificación - Colegio Experimental UNS') => {
  try {
    if (!email) {
      throw new Error('Email no proporcionado');
    }

    // Verificar configuración
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    if (!smtpUser || !smtpPass || smtpUser === 'uns.matricula@gmail.com' || smtpPass === 'password') {
      console.error('❌ Error: Configuración SMTP no válida');
      console.error('💡 Crea un archivo .env con:');
      console.error('   SMTP_USER=tu_email@gmail.com');
      console.error('   SMTP_PASS=tu_app_password');
      throw new Error('Configuración SMTP no válida. Verifica el archivo .env');
    }

    console.log(`📧 Intentando enviar email a: ${email}`);
    console.log(`📧 Desde: ${smtpUser}`);

    const info = await transporter.sendMail({
      from: `"Colegio Experimental UNS" <${smtpUser}>`,
      to: email,
      subject: asunto,
      html: mensaje
    });

    console.log(`✅ Email enviado exitosamente a ${email}`);
    console.log(`   Message ID: ${info.messageId}`);
    
    guardarNotificacion(email, 'general', 'email', mensaje, 'enviado');
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`❌ Error al enviar email a ${email}:`, error.message);
    console.error('   Detalles:', error);
    
    // Mensajes de error más descriptivos
    let errorMessage = error.message;
    if (error.code === 'EAUTH') {
      errorMessage = 'Error de autenticación. Verifica tu email y contraseña (App Password) en .env';
    } else if (error.code === 'ECONNECTION') {
      errorMessage = 'Error de conexión. Verifica tu conexión a internet y la configuración SMTP';
    } else if (error.code === 'ETIMEDOUT') {
      errorMessage = 'Timeout. El servidor SMTP no respondió a tiempo';
    }
    
    guardarNotificacion(email, 'general', 'email', mensaje, 'error');
    throw new Error(errorMessage);
  }
};

// Enviar WhatsApp (simulado - requiere API real como Twilio o WhatsApp Business API)
const enviarWhatsApp = async (telefono, mensaje) => {
  try {
    if (!telefono) {
      throw new Error('Teléfono no proporcionado');
    }

    // En producción, usar API de WhatsApp Business o Twilio
    // Por ahora, simulamos el envío
    console.log(`📱 WhatsApp enviado a ${telefono}: ${mensaje}`);
    
    guardarNotificacion(telefono, 'general', 'whatsapp', mensaje, 'enviado');
    return { success: true, message: 'Mensaje enviado (simulado)' };
  } catch (error) {
    guardarNotificacion(telefono, 'general', 'whatsapp', mensaje, 'error');
    throw error;
  }
};

// Enviar ratificación de permanencia
const enviarRatificacion = async (email, telefono, nombreEstudiante, añoAcademico, linkPortal = null) => {
  // URL base del portal (se puede configurar en variables de entorno)
  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const portalLink = linkPortal || `${baseUrl}/padres`;
  
  console.log(`📧 Enviando ratificación a ${email || telefono} con link: ${portalLink}`);

  const mensaje = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #0066cc;">Ratificación de Permanencia - Colegio Experimental UNS</h2>
      <p>Estimado apoderado,</p>
      <p>Le informamos que su hijo/a <strong>${nombreEstudiante}</strong> tiene la opción de continuar sus estudios en nuestro centro educativo para el año académico <strong>${añoAcademico}</strong>.</p>
      <p>Para confirmar su permanencia y realizar la matrícula, por favor acceda a nuestro portal web:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${portalLink}" 
           style="display: inline-block; padding: 15px 30px; background-color: #0066cc; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">
          Acceder al Portal de Matrícula
        </a>
      </div>
      <p style="font-size: 12px; color: #666;">
        O copie este enlace en su navegador: <a href="${portalLink}">${portalLink}</a>
      </p>
      <p>También puede acercarse a nuestras oficinas si prefiere realizar el proceso de forma presencial.</p>
      <p>Saludos cordiales,<br><strong>Dirección - Colegio Experimental UNS</strong></p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
      <p style="font-size: 11px; color: #999;">
        AVENIDA UNIVERSITARIA S/N - NUEVO CHIMBOTE<br>
        Teléfono: (043) XXX-XXX
      </p>
    </div>
  `;

  if (email) {
    try {
      await enviarEmail(email, mensaje, 'Ratificación de Permanencia - Año Académico ' + añoAcademico);
    } catch (error) {
      console.error(`⚠️  No se pudo enviar email a ${email}:`, error.message);
      return { success: false, error: error.message };
    }
  }

  if (telefono) {
    try {
      const mensajeWhatsApp = `Ratificación de Permanencia - ${nombreEstudiante} puede continuar en el año ${añoAcademico}. Confirme su permanencia en: ${portalLink}`;
      await enviarWhatsApp(telefono, mensajeWhatsApp);
    } catch (error) {
      console.error(`⚠️  No se pudo enviar WhatsApp a ${telefono}:`, error.message);
    }
  }
  
  return { success: true };
};

// Enviar confirmación de inscripción
const enviarConfirmacionInscripcion = async (email, telefono, nombreEstudiante) => {
  const mensaje = `
    <h2>Confirmación de Inscripción - Colegio Experimental UNS</h2>
    <p>Estimado apoderado,</p>
    <p>Su inscripción para <strong>${nombreEstudiante}</strong> ha sido recibida exitosamente.</p>
    <p>Próximamente recibirá información sobre la fecha de citación para completar el proceso de matrícula.</p>
    <p>Saludos cordiales,<br>Secretaría - Colegio Experimental UNS</p>
  `;

  if (email) {
    try {
      await enviarEmail(email, mensaje, 'Confirmación de Inscripción');
    } catch (error) {
      console.error(`⚠️  No se pudo enviar email de confirmación a ${email}:`, error.message);
      // No lanzar el error, solo registrar para que no crashee el servidor
      return { success: false, error: error.message };
    }
  }

  if (telefono) {
    try {
      const mensajeWhatsApp = `Inscripción confirmada para ${nombreEstudiante}. Próximamente recibirá información sobre la citación.`;
      await enviarWhatsApp(telefono, mensajeWhatsApp);
    } catch (error) {
      console.error(`⚠️  No se pudo enviar WhatsApp a ${telefono}:`, error.message);
      // No lanzar el error, solo registrar
    }
  }
  
  return { success: true };
};

module.exports = {
  enviarEmail,
  enviarWhatsApp,
  enviarRatificacion,
  enviarConfirmacionInscripcion
};

