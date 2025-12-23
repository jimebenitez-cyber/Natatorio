const express = require('express');
const cors = require('cors');
const sql = require('mssql');
const cron = require('node-cron'); 

const app = express();
app.use(cors());
app.use(express.json()); 

// --- CONFIGURACIÓN DE LA BASE DE DATOS ---
const dbConfig = {
    user: 'sa', 
    password: '123456', // <--- TU CONTRASEÑA
    server: 'localhost', 
    database: 'natatorio', 
    port: 1433,
    options: {
        encrypt: false, 
        trustServerCertificate: true
    }
};

// --- RUTAS (ENDPOINTS) ---

// 1. Guardar Alumno
app.post('/api/alumnos', async (req, res) => {
    try {
        const pool = await sql.connect(dbConfig);
        
        const check = await pool.request()
            .input('dni', sql.VarChar, req.body.dni)
            .query('SELECT id FROM Alumnos WHERE dni = @dni');
            
        if (check.recordset.length > 0) {
            return res.status(400).json({ message: '⚠️ Ese DNI ya está registrado en el sistema.' });
        }

        await pool.request()
            .input('dni', sql.VarChar, req.body.dni)
            .input('nombre', sql.VarChar, req.body.nombre)
            .input('apellido', sql.VarChar, req.body.apellido)
            .input('telefono', sql.VarChar, req.body.celular)
            .input('email', sql.VarChar, req.body.gmail)
            .query('INSERT INTO Alumnos (dni, nombre, apellido, telefono, email) VALUES (@dni, @nombre, @apellido, @telefono, @email)');
        
        res.status(201).json({ message: 'Alumno guardado correctamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
});

// 2. Buscar Alumno por DNI
app.get('/api/alumnos/:dni', async (req, res) => {
    try {
        const pool = await sql.connect(dbConfig);
        const result = await pool.request()
            .input('dni', sql.VarChar, req.params.dni)
            .query('SELECT * FROM Alumnos WHERE dni = @dni');

        if (result.recordset.length > 0) {
            res.json(result.recordset[0]);
        } else {
            res.status(404).json({ message: 'No encontrado' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Error en el servidor');
    }
});

// 3. Guardar Profesor
app.post('/api/profesores', async (req, res) => {
    try {
        const pool = await sql.connect(dbConfig);
        const check = await pool.request()
            .input('dni', sql.VarChar, req.body.dni)
            .query('SELECT id FROM Profesores WHERE dni = @dni');
            
        if (check.recordset.length > 0) {
            return res.status(400).json({ message: '⚠️ Este Profesor ya existe.' });
        }
        
        const resultProfesor = await pool.request()
            .input('nombre', sql.VarChar, req.body.nombre)
            .input('apellido', sql.VarChar, req.body.apellido)
            .input('dni', sql.VarChar, req.body.dni)
            .input('telefono', sql.VarChar, req.body.telefono)
            .input('especialidad', sql.VarChar, req.body.especialidad || 'General')
            .query(`
                INSERT INTO Profesores (nombre, apellido, dni, telefono, especialidad) 
                VALUES (@nombre, @apellido, @dni, @telefono, @especialidad);
                SELECT SCOPE_IDENTITY() AS id;
            `);

        const profesorId = resultProfesor.recordset[0].id;

        if (req.body.horarios && req.body.horarios.length > 0) {
            for (const h of req.body.horarios) {
                if(h.dia && h.horario) {
                    await pool.request()
                        .input('pid', sql.Int, profesorId)
                        .input('dia', sql.VarChar, h.dia)
                        .input('horario', sql.VarChar, h.horario)
                        .query('INSERT INTO Horarios_Profesores (profesor_id, dia, horario) VALUES (@pid, @dia, @horario)');
                }
            }
        }
        res.status(201).json({ message: 'Profesor creado' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error interno' });
    }
});

// 4. Buscar Profesor
app.get('/api/profesores/:dni', async (req, res) => {
    try {
        const pool = await sql.connect(dbConfig);
        const resultProfe = await pool.request()
            .input('dni', sql.VarChar, req.params.dni)
            .query('SELECT * FROM Profesores WHERE dni = @dni');

        if (resultProfe.recordset.length === 0) {
            return res.status(404).json({ message: '⚠️Profesor no encontrado' });
        }
        const profesor = resultProfe.recordset[0];
        const resultHorarios = await pool.request()
            .input('pid', sql.Int, profesor.id)
            .query('SELECT dia, horario FROM Horarios_Profesores WHERE profesor_id = @pid');

        profesor.horarios = resultHorarios.recordset;
        res.json(profesor);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al buscar profesor');
    }
});

// 5. Editar Profesor
app.put('/api/profesores/:id', async (req, res) => {
    try {
        const pool = await sql.connect(dbConfig);
        const profeId = req.params.id;
        
        const checkDni = await pool.request()
            .input('dni', sql.VarChar, req.body.dni)
            .input('id', sql.Int, profeId)
            .query(`SELECT id FROM Profesores WHERE dni = @dni AND id <> @id`);

        if (checkDni.recordset.length > 0) {
            return res.status(400).json({ message: '⚠️ Ese DNI ya está asignado a otro profesor.' });
        }

        await pool.request()
            .input('id', sql.Int, profeId)
            .input('nombre', sql.VarChar, req.body.nombre)
            .input('apellido', sql.VarChar, req.body.apellido)
            .input('dni', sql.VarChar, req.body.dni)
            .input('telefono', sql.VarChar, req.body.telefono)
            .input('especialidad', sql.VarChar, req.body.especialidad)
            .query(`UPDATE Profesores SET nombre=@nombre, apellido=@apellido, dni=@dni, telefono=@telefono, especialidad=@especialidad WHERE id=@id`);

        await pool.request().input('pid', sql.Int, profeId).query('DELETE FROM Horarios_Profesores WHERE profesor_id = @pid');

        if (req.body.horarios && req.body.horarios.length > 0) {
            for (const h of req.body.horarios) {
                if(h.dia && h.horario) {
                    await pool.request()
                        .input('pid', sql.Int, profeId)
                        .input('dia', sql.VarChar, h.dia)
                        .input('horario', sql.VarChar, h.horario)
                        .query('INSERT INTO Horarios_Profesores (profesor_id, dia, horario) VALUES (@pid, @dia, @horario)');
                }
            }
        }
        res.json({ message: 'Profesor actualizado correctamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al actualizar' });
    }
});

// 6. Horarios Disponibles
app.get('/api/horarios-disponibles', async (req, res) => {
    try {
        const pool = await sql.connect(dbConfig);
        const result = await pool.request().query('SELECT DISTINCT dia, horario FROM Horarios_Profesores');
        res.json(result.recordset);
    } catch (error) {
        res.status(500).send('Error al obtener horarios');
    }
});

// 7. Guardar Asistencia (INGRESO)
app.post('/api/asistencias', async (req, res) => {
    try {
        const { dni, dia, horario, fecha } = req.body; 
        const pool = await sql.connect(dbConfig);
        
        await pool.request()
            .input('alumno_dni', sql.VarChar, dni) 
            .input('dia', sql.VarChar, dia)
            .input('horario', sql.VarChar, horario)
            .input('fecha_registro', sql.Date, fecha)
            .query('INSERT INTO Asistencias (alumno_dni, dia, horario_ingreso, fecha_registro) VALUES (@alumno_dni, @dia, @horario, @fecha_registro)');

        res.json({ message: 'Asistencia registrada' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al registrar asistencia', error: error.message });
    }
});

// --- NUEVO: VERIFICAR SI EL ALUMNO ESTÁ HOY ---
app.get('/api/asistencias/estado-hoy/:dni', async (req, res) => {
    try {
        const pool = await sql.connect(dbConfig);
        // Busca si hay una asistencia con la fecha de HOY
        const result = await pool.request()
            .input('dni', sql.VarChar, req.params.dni)
            .query(`
                SELECT TOP 1 id, horario_ingreso, horario_egreso 
                FROM Asistencias 
                WHERE alumno_dni = @dni 
                AND fecha_registro = CAST(GETDATE() AS DATE)
                ORDER BY id DESC
            `);

        if (result.recordset.length > 0) {
            res.json(result.recordset[0]); // Devuelve {id, horario_ingreso, horario_egreso}
        } else {
            res.json(null); // No vino hoy
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al verificar estado');
    }
});

// --- NUEVO: REGISTRAR EGRESO ---
app.put('/api/asistencias/egreso/:id', async (req, res) => {
    try {
        const { horario_egreso } = req.body;
        const pool = await sql.connect(dbConfig);
        
        await pool.request()
            .input('id', sql.Int, req.params.id)
            .input('egreso', sql.VarChar, horario_egreso)
            .query('UPDATE Asistencias SET horario_egreso = @egreso WHERE id = @id');

        res.json({ message: 'Egreso registrado correctamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al registrar egreso' });
    }
});


// 8. Listado Asistencia (ACTUALIZADO CON EGRESO)
app.get('/api/asistencias/listado', async (req, res) => {
    const { dia, horario } = req.query; 
    try {
        const pool = await sql.connect(dbConfig);
        const result = await pool.request()
            .input('dia', sql.VarChar, dia)
            .input('horario', sql.VarChar, horario)
            .query(`
                SELECT a.id, a.fecha_registro, a.dia, 
                       a.horario_ingreso, a.horario_egreso,
                       al.nombre, al.apellido, al.dni
                FROM Asistencias a
                INNER JOIN Alumnos al ON a.alumno_dni = al.dni
                WHERE a.dia = @dia 
                AND a.horario_ingreso = @horario
                AND a.fecha_registro >= CAST(DATEADD(day, -6, GETDATE()) AS DATE)
                ORDER BY a.fecha_registro DESC
            `);
        res.json(result.recordset);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al obtener listado');
    }
});

// 9. Editar Alumno
app.put('/api/alumnos/:id', async (req, res) => {
    try {
        const pool = await sql.connect(dbConfig);
        await pool.request()
            .input('id', sql.Int, req.params.id)
            .input('dni', sql.VarChar, req.body.dni)
            .input('nombre', sql.VarChar, req.body.nombre)
            .input('apellido', sql.VarChar, req.body.apellido)
            .input('telefono', sql.VarChar, req.body.celular)
            .input('email', sql.VarChar, req.body.gmail)
            .query('UPDATE Alumnos SET dni=@dni, nombre=@nombre, apellido=@apellido, telefono=@telefono, email=@email WHERE id=@id');
        res.json({ message: 'Alumno actualizado' });
    } catch (error) {
        res.status(500).send('Error al actualizar');
    }
});

// 10. Historial personal (ACTUALIZADO CON EGRESO)
app.get('/api/asistencias/historial/:dni', async (req, res) => {
    try {
        const pool = await sql.connect(dbConfig);
        const result = await pool.request()
            .input('dni', sql.VarChar, req.params.dni)
            .query(`
                SELECT 
                    fecha_registro,
                    dia, 
                    horario_ingreso,
                    horario_egreso
                FROM Asistencias 
                WHERE alumno_dni = @dni 
                ORDER BY fecha_registro DESC
            `);
        res.json(result.recordset);
    } catch (error) {
        res.status(500).send('Error al obtener historial');
    }
});

// 11. BORRAR UNA ASISTENCIA
app.delete('/api/asistencias/:id', async (req, res) => {
    try {
        const pool = await sql.connect(dbConfig);
        await pool.request()
            .input('id', sql.Int, req.params.id)
            .query('DELETE FROM Asistencias WHERE id = @id');
        res.json({ message: 'Asistencia eliminada' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al eliminar' });
    }
});

// 12. ELIMINAR ALUMNO
app.delete('/api/alumnos/:id', async (req, res) => {
    try {
        const pool = await sql.connect(dbConfig);
        // Borra asistencias
        await pool.request()
            .input('id', sql.Int, req.params.id)
            .query(`DELETE FROM Asistencias WHERE alumno_dni = (SELECT dni FROM Alumnos WHERE id = @id)`);
        // Borra alumno
        await pool.request()
            .input('id', sql.Int, req.params.id)
            .query('DELETE FROM Alumnos WHERE id = @id');
        res.json({ message: 'Alumno eliminado' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al eliminar alumno' });
    }
});

// 13. ELIMINAR PROFESOR
app.delete('/api/profesores/:id', async (req, res) => {
    try {
        const pool = await sql.connect(dbConfig);
        await pool.request().input('id', sql.Int, req.params.id).query('DELETE FROM Horarios_Profesores WHERE profesor_id = @id');
        await pool.request().input('id', sql.Int, req.params.id).query('DELETE FROM Profesores WHERE id = @id');
        res.json({ message: 'Profesor eliminado' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al eliminar profesor' });
    }
});

// 14. DNI Temporal
app.get('/api/siguiente-dni-temporal', async (req, res) => {
    try {
        const pool = await sql.connect(dbConfig);
        let contador=1;
        let existe = true;
        let dniGenerado = '';
        while (contador <= 1000000 && existe) {
            dniGenerado = '00' + contador.toString();
            const result = await pool.request()
                .input('dni', sql.VarChar, dniGenerado)
                .query(`SELECT 1 AS existe FROM Alumnos WHERE LTRIM(RTRIM(dni)) = @dni UNION SELECT 1 AS existe FROM Profesores WHERE LTRIM(RTRIM(dni)) = @dni`);
            existe = result.recordset.length > 0;
            if (existe) { contador++; }
        }
        res.json({ siguiente: dniGenerado });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al generar DNI temporal' });
    }
});
// --- TAREA AUTOMÁTICA (CRON JOB) ---
// Se ejecuta cada 5 minutos para cerrar turnos vencidos
cron.schedule('0 * * * *', async () => {
    console.log('🔄 Ejecutando cierre automático de turnos...');
    try {
        const pool = await sql.connect(dbConfig);
        
        // 1. Buscar asistencias de HOY que sigan abiertas (egreso IS NULL)
        const result = await pool.request().query(`
            SELECT id, horario_ingreso 
            FROM Asistencias 
            WHERE fecha_registro = CAST(GETDATE() AS DATE) 
            AND horario_egreso IS NULL
        `);

        const ahora = new Date();
        const horaActual = ahora.getHours();
        const minActual = ahora.getMinutes();

        // 2. Revisar uno por uno
        for (const registro of result.recordset) {
            const [hStr, mStr] = registro.horario_ingreso.split(':');
            const hIngreso = parseInt(hStr);
            
            // Calculamos la hora de fin (Ingreso + 1 hora)
            let hFin = hIngreso + 1;
            
            // Lógica simple: Si la hora actual es mayor o igual a la hora de fin, CERRAMOS.
            // (Ej: Entró a las 10, sale a las 11. Si son las 11:05, se cierra).
            
            // Ajuste para el cambio de día (si entra a las 23, sale a las 00)
            if (hFin === 24) hFin = 0; 

            // Verificamos si YA pasó la hora
            // Condición: (Hora actual > Hora Fin) O (Misma hora pero ya pasaron minutos y no es punto exacto)
            // Para simplificar: Si hora actual > hora inicio, asumimos que ya pasó la hora de turno completa
            // O mejor: Si hora actual >= hora fin.
            
            const turnoVencido = (horaActual > hFin) || (horaActual === hFin && minActual >= 0);

            if (turnoVencido) {
                // Formateamos la hora de salida (HH:00)
                const egresoAutomatico = `${hFin.toString().padStart(2, '0')}:${mStr}`;
                
                await pool.request()
                    .input('id', sql.Int, registro.id)
                    .input('egreso', sql.VarChar, egresoAutomatico)
                    .query('UPDATE Asistencias SET horario_egreso = @egreso WHERE id = @id');
                
                console.log(`✅ Turno ID ${registro.id} cerrado automáticamente a las ${egresoAutomatico}`);
            }
        }
    } catch (error) {
        console.error('❌ Error en cron job:', error);
    }
});
// --- INICIAR SERVIDOR ---
const PORT = 5000;
app.listen(PORT, async () => {
    console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
    try {
        await sql.connect(dbConfig);
        console.log('✅ BD Conectada');
    } catch (err) {
        console.error('❌ Error BD:', err);
    }
});