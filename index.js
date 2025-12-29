//INDEX
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
        console.log("entra bien")
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
app.get('/api/horarios-disponibles', (req, res) => {

    const dias = ['Lunes','Martes','Miércoles','Jueves','Viernes'];

    const listaHoras = [
        '08:00','09:00','10:00','11:00','12:00',
        '13:00','14:00','15:00','16:00','17:00',
        '18:00','19:00','20:00','21:00','22:00'
    ];

    const horarios = [];

    dias.forEach(dia => {
        listaHoras.forEach(horario => {
            horarios.push({ dia, horario });
        });
    });

    res.json(horarios);
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

// 8. Listado Asistencia 
// --- NUEVO: VERIFICAR SI EL ALUMNO ESTÁ HOY ---
app.get('/api/asistencias/estado-hoy/:dni', async (req, res) => {
    const {dni} = req.params;
    try {
        const pool = await sql.connect(dbConfig);
        const result = await pool.request()
            .input('dni', sql.VarChar, dni)
            .query(`
                SELECT TOP 1 * FROM Asistencias
                WHERE alumno_dni = @dni 
                AND CAST (fecha_registro AS DATE)= CAST(GETDATE() AS DATE)
                ORDER BY id DESC
            `);
            res.json(result.recordset[0]||null);
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
            .input('fecha', sql.VarChar, dia)
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
//listado por fecha
// LISTADO DE ASISTENCIAS POR FECHA + HORARIO
app.get('/api/asistencias/listado-por-fecha', async (req, res) => {
    const { fecha, horario } = req.query;

    if (!fecha || !horario) {
        return res.status(400).json({ message: 'Fecha y horario requeridos' });
    }

    try {
        const pool = await sql.connect(dbConfig);
        const result = await pool.request()
            .input('fecha', sql.Date, fecha)
            .input('horario', sql.VarChar, horario)
            .query(`
                SELECT  a.id, a.alumno_dni, a.dia, a.horario_ingreso,a.horario_egreso,
                    a.fecha_registro, al.nombre,al.apellido
                FROM Asistencias a
                JOIN Alumnos al ON al.dni = a.alumno_dni
                WHERE 
                    CAST(a.fecha_registro AS DATE) = @fecha
                    AND a.horario_ingreso = @horario
                ORDER BY al.apellido, al.nombre
            `);

        res.json(result.recordset);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener el listado' });
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
        let dni = 1;
        let existe = true;
        let dniGenerado ='';
        while (dni <= 1000000 && existe) {
            dniGenerado='00' + dni.toString();
            const result = await pool.request()
                .input('dni', sql.VarChar,dniGenerado)
                .query(`SELECT 1 AS existe FROM Alumnos WHERE LTRIM(RTRIM(dni)) = @dni UNION SELECT 1 AS existe FROM Profesores WHERE LTRIM(RTRIM(dni)) = @dni`);
            existe = result.recordset.length > 0;
            if (existe) { dni++; }
        }
        res.json({ siguiente: dniGenerado });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al generar DNI temporal' });
    }
});
// --- NUEVO: LISTAR SOLO LOS QUE ESTÁN ADENTRO (ACTIVOS) ---
app.get('/api/asistencias/activos', async (req, res) => {
    try {
        const pool = await sql.connect(dbConfig);
        const result = await pool.request()
            .query(`
                SELECT a.id, a.fecha_registro, a.horario_ingreso, al.nombre, al.apellido, al.dni
                FROM Asistencias a
                INNER JOIN Alumnos al ON a.alumno_dni = al.dni
                WHERE a.fecha_registro = CAST(GETDATE() AS DATE) 
                AND a.horario_egreso IS NULL
                ORDER BY a.horario_ingreso DESC
            `);
        res.json(result.recordset);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al obtener activos');
    }
});

// --- NUEVO: EGRESO MASIVO (CERRAR TODOS LOS TURNOS) ---
app.put('/api/asistencias/cerrar-todos', async (req, res) => {
    try {
        const { horario_egreso } = req.body;
        const pool = await sql.connect(dbConfig);
        
        await pool.request()
            .input('egreso', sql.VarChar, horario_egreso)
            .query(`
                UPDATE Asistencias 
                SET horario_egreso = @egreso 
                WHERE fecha_registro = CAST(GETDATE() AS DATE) 
                AND horario_egreso IS NULL
            `);

        res.json({ message: 'Todos los turnos cerrados correctamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al cerrar turnos' });
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