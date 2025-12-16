const handleInscribirAlumno = async (e) => {
    e.preventDefault();

    // 1. Mapeamos los datos de tu formulario a lo que espera el Backend
    const datosParaEnviar = {
      dni: formAlumno.dni || null, // Si está vacío, mandamos null
      nombre: formAlumno.nombre,
      apellido: formAlumno.apellido,
      celular: formAlumno.celular, // Tu backend espera recibir 'celular' y lo guarda en 'telefono'
      email: formAlumno.gmail      // Tu backend espera 'email', así que le mandamos tu campo 'gmail'
    };

    try {
      setMensaje('Guardando en base de datos...');
      
      // 2. Enviamos la petición al servidor (puerto 5000)
      const respuesta = await fetch('http://localhost:5000/api/alumnos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(datosParaEnviar),
      });

      // 3. Si el servidor responde OK
      if (respuesta.ok) {
        setMensaje(`¡Éxito! ${formAlumno.nombre} ha sido registrado en SQL Server.`);
        
        // Limpiamos el formulario
        setFormAlumno({
          dni: '', nombre: '', apellido: '', edad: '', 
          celular: '', facebook: '', gmail: '', 
          turno: { dia: '', horario: '' }
        });

        // Volvemos al menú principal en 2 segundos
        setTimeout(() => {
          setMensaje('');
          setView('main');
        }, 2000);
      } else {
        // Si hubo un error en el servidor (ej: DNI duplicado)
        const dataError = await respuesta.json();
        setMensaje(`Error: ${dataError.message || 'No se pudo guardar'}`);
      }
    } catch (error) {
      console.error(error);
      setMensaje('Error: No hay conexión con el servidor (Backend caído).');
    }
  };