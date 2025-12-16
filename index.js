const express = require('express');
const cors = require('cors');
const sql = require('mssql');

const app = express();

// Middleware
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

// 1. Guardar Alumno (CORREGIDO: Ahora lee 'gmail')
app.post('/api/alumnos', async (req, res) => {
    try {
        const pool = await sql.connect(dbConfig);
        
        // A. VERIFICAR DUPLICADO
        const check = await pool.request()
            .input('dni', sql.VarChar, req.body.dni)
            .query('SELECT id FROM Alumnos WHERE dni = @dni');
            
        if (check.recordset.length > 0) {
            return res.status(400).json({ message: '⚠️ Ese DNI ya está registrado en el sistema.' });
        }

        // B. GUARDAR (Aquí estaba el error, ahora lee req.body.gmail)
        await pool.request()
            .input('dni', sql.VarChar, req.body.dni)
            .input('nombre', sql.VarChar, req.body.nombre)
            .input('apellido', sql.VarChar, req.body.apellido)
            .input('telefono', sql.VarChar, req.body.celular)
            .input('email', sql.VarChar, req.body.gmail) // <--- ¡ARREGLADO!
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
            return res.status(404).json({ message: 'Profesor no encontrado' });
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

// 7. Guardar Asistencia
app.post('/api/asistencias', async (req, res) => {
    try {
        const pool = await sql.connect(dbConfig);
        await pool.request()
            .input('dni', sql.VarChar, req.body.dni)
            .input('dia', sql.VarChar, req.body.dia)
            .input('horario', sql.VarChar, req.body.horario)
            .query('INSERT INTO Asistencias (alumno_dni, dia, horario) VALUES (@dni, @dia, @horario)');
        res.status(201).json({ message: 'Asistencia guardada' });
    } catch (error) {
        res.status(500).send('Error al guardar asistencia');
    }
});

// 8. Listado Asistencia
app.get('/api/asistencias/listado', async (req, res) => {
    const { dia, horario } = req.query; 
    try {
        const pool = await sql.connect(dbConfig);
        const result = await pool.request()
            .input('dia', sql.VarChar, dia)
            .input('horario', sql.VarChar, horario)
            .query(`
                SELECT a.fecha_registro, al.nombre, al.apellido, al.dni
                FROM Asistencias a
                INNER JOIN Alumnos al ON a.alumno_dni = al.dni
                WHERE a.dia = @dia AND a.horario = @horario
                ORDER BY a.fecha_registro DESC
            `);
        res.json(result.recordset);
    } catch (error) {
        res.status(500).send('Error al obtener listado');
    }
});

// 9. Actualizar Alumno (CORREGIDO: También lee 'gmail')
app.put('/api/alumnos/:id', async (req, res) => {
    try {
        const pool = await sql.connect(dbConfig);
        await pool.request()
            .input('id', sql.Int, req.params.id)
            .input('dni', sql.VarChar, req.body.dni)
            .input('nombre', sql.VarChar, req.body.nombre)
            .input('apellido', sql.VarChar, req.body.apellido)
            .input('telefono', sql.VarChar, req.body.celular)
            .input('email', sql.VarChar, req.body.gmail) // <--- ¡ARREGLADO!
            .query('UPDATE Alumnos SET dni=@dni, nombre=@nombre, apellido=@apellido, telefono=@telefono, email=@email WHERE id=@id');
        res.json({ message: 'Alumno actualizado' });
    } catch (error) {
        res.status(500).send('Error al actualizar');
    }
});

// --- INICIAR SERVIDOR ---
const PORT = 5000;
app.listen(PORT, async () => {
    console.log(`🚀 SERVIDOR LISTO - CORREO ARREGLADO`);
    try { await sql.connect(dbConfig); console.log('✅ BD Conectada'); } catch (err) { console.error('❌ Error BD:', err); }
});