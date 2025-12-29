//APP.JSX
import React, { useState, useEffect } from 'react';
import { Users, Search, UserPlus, GraduationCap, ClipboardList, ArrowLeft, Save, UserCog, CheckCircle, Trash2, Edit, Moon, Sun, CalendarDays, FileText, UserPen, UserStar, LogOut} from 'lucide-react';
import './App.css'; 

const regexTexto = /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/; //valida que se letra
const regexDni = /^\d+$/; //valida que sea numero 

const diasReporte = ['Lunes','Martes','Miércoles','Jueves', 'Viernes', 'Sábado', 'Domingo'];
const horasReporte = ['08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00','21:00','22:00'];

export default function App() {
  const [view, setView] = useState('main');
  const [mensaje, setMensaje] = useState('');
  
  // --- TEMA ---
  const [isDarkMode, setIsDarkMode] = useState(true); 

  useEffect(() => {
    if (isDarkMode) document.body.setAttribute('data-theme', 'dark');
    else document.body.removeAttribute('data-theme');
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  // Estados
  const [esEdicionAlumno, setEsEdicionAlumno] = useState(false);
  const [esEdicionProfesor, setEsEdicionProfesor] = useState(false);

  const [formAlumno, setFormAlumno] = useState({ id: null, dni: '', nombre: '', apellido: '', celular: '', gmail: '' });
  const [formProfesor, setFormProfesor] = useState({ id: null, nombre: '', apellido: '', dni: '', telefono: '', especialidad: '', horarios: [{ dia: '', horario: '' }] });
  
  const [busquedaDni, setBusquedaDni] = useState('');
  const [socioEncontrado, setSocioEncontrado] = useState(null);
  const [asistenciaHoy, setAsistenciaHoy] = useState(null); // Nuevo estado: Guarda info si ya vino hoy
  
  // ESTADO TURNO: dia y horario
  const [turno, setTurno] = useState({ dia: '', horario: '' });
  
  // ESTADO FECHA: Inicializamos con HOY (YYYY-MM-DD)
  const [fechaIngreso, setFechaIngreso] = useState(new Date().toISOString().split('T')[0]);

  // Estados Listado y Historial
  const [filtroListado, setFiltroListado] = useState({ dia: '', horario: '' });
 const [filtroReporteFecha, setFiltroReporteFecha] = useState({ fecha: '', horario: '' });
  const [listaAsistencia, setListaAsistencia] = useState([]);
  const [historialPersonal, setHistorialPersonal] = useState([]);
  const [alumnoHistorial, setAlumnoHistorial] = useState(null);
const [listaActivos, setListaActivos] = useState([]);

  const [horariosBD, setHorariosBD] = useState([]);
  const [busquedaRealizada, setBusquedaRealizada] = useState(false);
  const [enviando,setEnviando]=useState(false);

  const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado','Domingo'];
  const listaHoras = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00','21:00','22:00'];
// Estado para el Modal de Confirmación
const [modal, setModal] = useState({ show: false, titulo: '', mensaje: '', accionConfirmar: null });
  // Helper para mostrar Salida (Real o Estimada)
  const getHoraSalida = (ingreso, egreso) => {
    if (egreso) return egreso; 
    if (!ingreso) return '-';
    // Si no hay egreso, calculamos +1 hora
    const [hh, mm] = ingreso.split(':').map(Number);
    let nuevoHH = hh + 1;
    if (nuevoHH >= 24) nuevoHH = 0;
    return `${nuevoHH.toString().padStart(2, '0')}:${mm.toString().padStart(2, '0')} (Est.)`;
  };

  useEffect(() => {
      fetch('http://localhost:5000/api/horarios-disponibles')
          .then(res => res.json()).then(data => setHorariosBD(data))
          .catch(console.error);
  }, [view]);

  const getDiasDisponibles = () => diasSemana.filter(d => [...new Set(horariosBD.map(i => i.dia))].includes(d));
  const getHorasPorDia = (dia) => horariosBD.filter(i => i.dia === dia).map(i => i.horario).sort();

  const obtenerHoraTurno = () => {
    const ahora = new Date();
    let hora = ahora.getHours();
    const minutos = ahora.getMinutes();
    if(minutos >= 45) { hora = (hora + 1) % 24; }
    return `${hora.toString().padStart(2, '0')}:00`;
  };

  const obtenerFechaHoy= () => {
    const hoy = new Date();
    return hoy.toISOString().split('T')[0];
  }

  useEffect(() => {
    if (!turno.dia) return;
    setTurno(prev => ({ ...prev, horario: obtenerHoraTurno() }));
  }, [turno.dia]);
  

  const obtenerDiaSemana = (fechaISO) => {
  const [year, month, day] = fechaISO.split('-');
  const fecha = new Date(year, month - 1, day);

  const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  return dias[fecha.getDay()];
};

useEffect(() => {
  if (socioEncontrado) {
    // 1. Obtenemos la fecha de hoy en formato YYYY-MM-DD
    const hoyISO = new Date().toISOString().split('T')[0];
    
    // 2. Calculamos el nombre del día usando tu función
    const nombreDiaActual = obtenerDiaSemana(hoyISO);
    
    // 3. Obtenemos la hora con tu lógica de los 45 minutos
    const horaCalculada = obtenerHoraTurno();

    // 4. Seteamos el estado del turno (ajusta los nombres si tus estados son diferentes)
    setTurno({
      fecha: hoyISO,
      dia: nombreDiaActual,
      horario: horaCalculada
    });
  }
}, [socioEncontrado]); // Se ejecuta cada vez que encuentras un socio nuevo


useEffect(() => {
  if (!fechaIngreso) return;

  const dia = obtenerDiaSemana(fechaIngreso);

  setTurno(prev => ({
    ...prev,
    dia
  }));
}, [fechaIngreso]);

useEffect(() => {
  if (!turno.dia) return;

  setTurno(prev => ({
    ...prev,
    horario: obtenerHoraTurno()
  }));
}, [turno.dia]);


  // --- FUNCIONES API ---
  const asignarDniTemporal = async (tipo) => {
    try {
        const res = await fetch('http://localhost:5000/api/siguiente-dni-temporal');
        if (!res.ok) throw new Error('Error en el servidor');
        const data = await res.json();
        
        if (tipo === 'alumno') {
            setFormAlumno({ ...formAlumno, dni: data.siguiente.toString() });
        } else {
            setFormProfesor({ ...formProfesor, dni: data.siguiente.toString() });
        }
        setMensaje(`🔢 Número temporal asignado: ${data.siguiente}`);
    } catch (error) {
        setMensaje('❌ Error al conectar con el servidor');
    }
  };

  const eliminarAlumno = async () => {
    if (!window.confirm('¿Seguro que deseas eliminar este alumno?')) return;
    try {
      const res = await fetch(`http://localhost:5000/api/alumnos/${formAlumno.id}`, { method: 'DELETE' });
      if (res.ok) {
        setMensaje('🗑️ Alumno eliminado correctamente');
        setFormAlumno({ id:null, dni:'', nombre:'', apellido:'', celular:'', gmail:'' });
      } else { setMensaje('Error al eliminar alumno'); }
    } catch { setMensaje('Error de conexión'); }
  };

  const eliminarProfesor = async () => {
    if (!window.confirm('¿Seguro que deseas eliminar este profesor?')) return;
    try {
      const res = await fetch(`http://localhost:5000/api/profesores/${formProfesor.id}`, { method: 'DELETE' });
      if (res.ok) {
        setMensaje('🗑️ Profesor eliminado correctamente');
        setFormProfesor({ id:null, nombre:'', apellido:'', dni:'', telefono:'', especialidad:'', horarios:[{dia:'', horario:''}] });
      } else { setMensaje('Error al eliminar profesor'); }
    } catch { setMensaje('Error de conexión'); }
  };
const handleGuardarAlumno = async () => {
    // Validaciones
    if (!formAlumno.dni || !regexDni.test(formAlumno.dni)) { setMensaje('⚠️ DNI inválido.'); setTimeout(() => setMensaje(''), 3000); return; }
    if (!formAlumno.nombre || !regexNombre.test(formAlumno.nombre)) { setMensaje('⚠️ Nombre inválido.'); setTimeout(() => setMensaje(''), 3000); return; }
    if (!formAlumno.apellido || !regexNombre.test(formAlumno.apellido)) { setMensaje('⚠️ Apellido inválido.'); setTimeout(() => setMensaje(''), 3000); return; }

    const esEdicion = !!formAlumno.id;

    try {
        const url = esEdicion ? `http://localhost:5000/api/alumnos/${formAlumno.id}` : 'http://localhost:5000/api/alumnos';
        const metodo = esEdicion ? 'PUT' : 'POST';
        
        const res = await fetch(url, { method: metodo, headers: {'Content-Type':'application/json'}, body: JSON.stringify(formAlumno) });
        const data = await res.json();
        
        if (res.ok) {
            setMensaje(esEdicion ? '¡Alumno actualizado!' : '¡Alumno registrado!');
            
            // Esperamos 1.5 seg para que se lea el mensaje de éxito
            setTimeout(() => { 
                setMensaje(''); 
                
                // Limpiamos el formulario
                setFormAlumno({id: null, dni:'', nombre:'', apellido:'', celular:'', gmail:''});
                
                // 👇 CAMBIO: Ahora SIEMPRE vamos al menú principal ('main')
                setView('main'); 
            }, 1500);

        } else { 
            setMensaje(data.message || 'Error al guardar.'); 
            setTimeout(() => setMensaje(''), 3000); 
        }
    } catch(e) { 
        setMensaje('Error conexión.'); 
        setTimeout(() => setMensaje(''), 3000); 
    }
  };
  const buscarAlumnoEditar = async () => {
      if(!busquedaDni) return;
      try {
          const res = await fetch(`http://localhost:5000/api/alumnos/${busquedaDni}`);
          if(res.ok) {
              const data = await res.json();
              setFormAlumno({ id: data.id, dni: data.dni, nombre: data.nombre, apellido: data.apellido, celular: data.telefono, gmail: data.email });
              setEsEdicionAlumno(true);
              setView('formAlumno');
              setBusquedaDni(''); 
                if (!formAlumno.dni || !regexDni.test(formAlumno.dni)) { setMensaje('⚠️ DNI inválido.'); return; }
                if (!formAlumno.nombre || !regexTexto.test(formAlumno.nombre)) { setMensaje('⚠️ Nombre inválido.'); return; }
                if (!formAlumno.apellido || !regexTexto.test(formAlumno.apellido)) { setMensaje('⚠️ Apellido inválido.'); return; }
          } else { setMensaje('⚠️ Alumno no encontrado.'); }
      } catch (e) { setMensaje('Error conexión'); }
  };

  const handleGuardarProfesor = async () => {
    if (!formProfesor.dni || !regexDni.test(formProfesor.dni)) { setMensaje('⚠️ DNI inválido.'); return; }
    if (!formProfesor.nombre || !regexTexto.test(formProfesor.nombre)) { setMensaje('⚠️ Nombre inválido.');  return; }
    if (!formProfesor.apellido || !regexTexto.test(formProfesor.apellido)) { setMensaje('⚠️ Apellido inválido.');  return; }
    
    const esEdicion = !!formProfesor.id;
    
    try {
      const url = esEdicion ? `http://localhost:5000/api/profesores/${formProfesor.id}` : 'http://localhost:5000/api/profesores';
      const metodo = esEdicion ? 'PUT' : 'POST';
      
      const res = await fetch(url, { method: metodo, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formProfesor) });
      const data = await res.json();
      
      if (res.ok) {
        setMensaje(esEdicion ? '¡Profesor actualizado!' : '¡Profesor registrado!');
        
        // Esperamos 1.5 seg antes de limpiar y salir
        setTimeout(() => { 
            setMensaje(''); 
            
            // Limpiamos el formulario (incluyendo horarios)
            setFormProfesor({ id: null, nombre: '', apellido: '', dni: '', telefono: '', especialidad: '', horarios: [{ dia: '', horario: '' }] });
            
            // 👇 Redirigimos siempre al Main
            setView('main'); 
        }, 1500);

      } else { 
          setMensaje(data.message || 'Error al guardar.'); 
          setTimeout(() => setMensaje(''), 3000); 
      }
    } catch (e) { 
        setMensaje('Error conexión.'); 
        setTimeout(() => setMensaje(''), 3000); 
    }
  };

  const buscarProfesor = async () => {
      if(!busquedaDni) return;
      try {
          const res = await fetch(`http://localhost:5000/api/profesores/${busquedaDni}`);
          if(res.ok) {
              const data = await res.json();
              setFormProfesor({ ...data, horarios: data.horarios.length ? data.horarios : [{dia:'', horario:''}] });
              setEsEdicionProfesor(true);
              setView('formProfesor');
              setBusquedaDni('');
          } else { setMensaje('⚠️ Profesor no encontrado.'); setTimeout(() => setMensaje(''), 4000); }
      } catch (e) { setMensaje('Error conexión'); setTimeout(() => setMensaje(''), 3000); }
  };

  // --- LÓGICA DE INGRESO / EGRESO MEJORADA ---
  const buscarSocioIngreso = async () => {
    if (!busquedaDni) return;
    setTurno({ dia: '', horario: '' });
    try {
        // 1. Buscar Datos del Alumno
        const rAlumno = await fetch(`http://localhost:5000/api/alumnos/${busquedaDni}`);
        
        if(rAlumno.ok) {
            const dataAlumno = await rAlumno.json();
            setSocioEncontrado(dataAlumno);
            
            // 2. Buscar si ya tiene asistencia hoy
            const rEstado = await fetch(`http://localhost:5000/api/asistencias/estado-hoy/${dataAlumno.dni}`);
            if (rEstado.ok) {
                const dataEstado = await rEstado.json(); 
                setAsistenciaHoy(dataEstado); // Guarda el estado (null, o objeto asistencia)
                
                if (dataEstado && !dataEstado.horario_egreso) {
                    setMensaje('⚠️ El alumno ya está ingresado. Puedes registrar su egreso.');
                } else if (dataEstado && dataEstado.horario_egreso) {
                    setMensaje('ℹ️ El alumno ya completó su turno hoy.');
                } else {
                    setMensaje('¡Alumno verificado!');
                }
            }
            setTimeout(() => setMensaje(''), 10000);
        } else { 
            setMensaje('DNI no encontrado.'); 
            setSocioEncontrado(null); 
            setAsistenciaHoy(null);
           
        }
    } catch(e) { 
        setMensaje('Error conexión'); 
   
    }
  };

  const registrarAsistencia = async () => {
      if (enviando||!turno.dia || !turno.horario) return;
        setEnviando(true);
      
      try {
          const res = await fetch('http://localhost:5000/api/asistencias', {
              method: 'POST', headers: {'Content-Type': 'application/json'},
              body: JSON.stringify({ 
                  dni: socioEncontrado.dni, 
                  dia: turno.dia, 
                  horario: turno.horario,
                  fecha: fechaIngreso
              })
          });
          const data = await res.json();
          if(res.ok) {
              setMensaje(`✅ Ingreso registrado: ${socioEncontrado.nombre}`);
              setTimeout(() => { 
                  setMensaje(''); 
                  setSocioEncontrado(null); 
                  setBusquedaDni(''); 
                  setAsistenciaHoy(null);
                  setTurno({dia:'', horario:''}); 
                  setFechaIngreso(new Date().toISOString().split('T')[0]); 
                  setView('main'); 
                  setEnviando(false); // 🔓 DESBLOQUEAMOS AL TERMINAR
              }, 2000);
          } else { 
              setMensaje(data.message || 'Error al guardar.'); 
              setEnviando(false); // 🔓 DESBLOQUEAR SI HUBO ERROR
              setTimeout(() => setMensaje(''), 3000); 
          }
      } catch (error) { 
          setMensaje('Error de conexión.'); 
          setEnviando(false); // 🔓 DESBLOQUEAR SI HUBO ERROR
          setTimeout(() => setMensaje(''), 4000); 
      }
  };

  const registrarEgreso = async () => {
    if (!asistenciaHoy || !asistenciaHoy.id) return;
    
    const ahora = new Date();
    const horaActual = `${ahora.getHours().toString().padStart(2, '0')}:${ahora.getMinutes().toString().padStart(2, '0')}`;

    try {
        const res = await fetch(`http://localhost:5000/api/asistencias/egreso/${asistenciaHoy.id}`, {
            method: 'PUT', 
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ horario_egreso: horaActual })
        });

        if(res.ok) {
            setMensaje(`👋 Salida registrada a las ${horaActual}`);
            setTimeout(() => { 
                setMensaje(''); 
                setSocioEncontrado(null); 
                setBusquedaDni(''); 
                setAsistenciaHoy(null);
                setTurno({dia:'', horario:''}); 
                setView('main'); 
            }, 2000);
        } else {
            setMensaje('Error al registrar egreso');
        }
    } catch (error) {
        setMensaje('Error de conexión');
    }
  };

//listado por dni
  const verListado = async () => {
      if(!filtroListado.fecha || !filtroListado.horario) return;
      try {
          const res = await fetch(`http://localhost:5000/api/asistencias/listado?fecha=${filtroListado.fecha}&horario=${filtroListado.horario}`);
          console.log(res)
          if(res.ok) { setListaAsistencia(await res.json()); setBusquedaRealizada(true); }
      } catch (error) { setMensaje('Error al cargar lista'); }
  };

//listado por fecha
    const verListadoPorFecha = async () => {
    if (!filtroReporteFecha.fecha || !filtroReporteFecha.horario) return;

    try {
        const res = await fetch(`http://localhost:5000/api/asistencias/listado-por-fecha?fecha=${filtroReporteFecha.fecha}&horario=${filtroReporteFecha.horario}`);

        if (res.ok) {
        setListaAsistencia(await res.json());
        setBusquedaRealizada(true);
        }
    } catch (error) {
        setMensaje('Error al cargar lista');
        setTimeout(() => setMensaje(''), 3000);
    }
    };

  const eliminarAsistencia = async (idAsistencia) => {
      if(!window.confirm('¿Seguro que quieres quitar a esta persona de la lista?')) return;
      try {
          const res = await fetch(`http://localhost:5000/api/asistencias/${idAsistencia}`, { method: 'DELETE' });
          if(res.ok) {
              setMensaje('🗑️ Registro eliminado correctamente');
              setListaAsistencia(listaAsistencia.filter(item => item.id !== idAsistencia));
          } else { setMensaje('Error al eliminar'); }
      } catch (error) { setMensaje('Error de conexión'); }
  };

  const buscarHistorialPersonal = async () => {
      if(!busquedaDni) return;
      try {
          const resAlumno = await fetch(`http://localhost:5000/api/alumnos/${busquedaDni}`);
          if(!resAlumno.ok) { setMensaje('⚠️ Alumno no encontrado'); return; }
          setAlumnoHistorial(await resAlumno.json());
          const resHistorial = await fetch(`http://localhost:5000/api/asistencias/historial/${busquedaDni}`);
          if(resHistorial.ok) { setHistorialPersonal(await resHistorial.json()); }
      } catch (e) { setMensaje('Error de conexión'); }
  };
  // Obtener la lista de gente que está en el agua
  const obtenerActivos = async () => {
      try {
          const res = await fetch('http://localhost:5000/api/asistencias/activos');
          if (res.ok) {
              setListaActivos(await res.json());
          }
      } catch (error) { console.error(error); }
  };

 // --- NUEVA LÓGICA CON MODAL ---

// 1. Al tocar el botón de la lista, SE ABRE EL MODAL
const confirmarEgresoIndividual = (id, nombre) => {
    setModal({
        show: true,
        titulo: '¿Registrar Salida?',
        mensaje: `Vas a registrar el egreso de ${nombre}.`,
        accionConfirmar: () => ejecutarEgresoReal(id) // Guardamos la función a ejecutar
    });
};

// 2. Al tocar el botón rojo de todos, SE ABRE EL MODAL
const confirmarEgresoMasivo = () => {
    if(listaActivos.length === 0) return;
    setModal({
        show: true,
        titulo: '⚠️ CIERRE MASIVO',
        mensaje: `Vas a sacar a ${listaActivos.length} personas del sistema. ¿Estás seguro?`,
        accionConfirmar: () => ejecutarEgresoMasivoReal()
    });
};

// 3. Esta es la función que REALMENTE conecta con la BD (Individual)
const ejecutarEgresoReal = async (id) => {
    const ahora = new Date();
    const horaActual = `${ahora.getHours().toString().padStart(2, '0')}:${ahora.getMinutes().toString().padStart(2, '0')}`;
    try {
        const res = await fetch(`http://localhost:5000/api/asistencias/egreso/${id}`, {
            method: 'PUT', headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ horario_egreso: horaActual })
        });
        if(res.ok) {
            setMensaje(`👋 Salida registrada`);
            obtenerActivos();
            cerrarModal(); // Cerramos el modal
            setTimeout(() => setMensaje(''), 2000);
        }
    } catch (e) { setMensaje('Error de conexión'); cerrarModal(); }
};

// 4. Esta es la función que REALMENTE conecta con la BD (Masivo)
const ejecutarEgresoMasivoReal = async () => {
    const ahora = new Date();
    const horaActual = `${ahora.getHours().toString().padStart(2, '0')}:${ahora.getMinutes().toString().padStart(2, '0')}`;
    try {
        const res = await fetch('http://localhost:5000/api/asistencias/cerrar-todos', {
            method: 'PUT', headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ horario_egreso: horaActual })
        });
        if(res.ok) {
            setMensaje('✅ Todos han salido.');
            setListaActivos([]);
            cerrarModal(); // Cerramos el modal
            setTimeout(() => setMensaje(''), 4000);
        }
    } catch (e) { setMensaje('Error masivo falló'); cerrarModal(); }
};

// Función auxiliar para cerrar
const cerrarModal = () => setModal({ show: false, titulo: '', mensaje: '', accionConfirmar: null });

  // --- VISTAS ---
  return (
    <div className="container">
      <div className="card">
        <div className="header">
          <div className="header-content">
            <div style={{background: 'var(--primary)', padding:'10px', borderRadius:'12px', color:'white'}}><Users size={32}/></div>
            <div><h1>Natatorio</h1><p>Puerta de hierro</p></div>
          </div>
          <button className="btn-theme" onClick={toggleTheme}>{isDarkMode ? <Sun size={28} /> : <Moon size={28} />}</button>
        </div>

        {mensaje && (
        <div className={`alerta ${mensaje.includes('Error') || mensaje.includes('⚠️') ? 'error' : 'exito'}`}>
            <span>{mensaje}</span>

            <button
            onClick={() => setMensaje('')}
            className="btn-cerrar-alerta"
            aria-label="Cerrar"
            >
            ✖
            </button>
        </div>
)}


    {view === 'main' && (
    <div className="menu-container">

        <button className="btn-Acceso btn-control" onClick={() => { setView('ingreso');setBusquedaDni(''); setSocioEncontrado(null); setTurno({ dia:'', horario:'' }); setMensaje(''); setFechaIngreso(new Date().toISOString().split('T')[0]); }}>
        <CheckCircle size={36} color="#059669"/>
        <span>Control Acceso</span>
        </button>

        <div className="grid-menu">
        <button className="btn-menu" onClick={() => setView('menuAgregar')}>
            <UserPlus size={36} color="var(--primary)"/>
            <span>Registrar</span>
        </button>

        <button className="btn-menu" onClick={() => setView('menuEditar')}>
            <Edit size={36} color="#7c3aed"/>
            <span>Editar Datos</span>
        </button>

        <button className="btn-menu" onClick={() => setView('menuReportes')}>
            <FileText size={36} color="#64748b"/>
            <span>Reportes</span>
        </button>

        <button className="btn-menu" onClick={() => { setView('activos'); obtenerActivos(); }}>
            <Users size={36} color="#3b82f6"/>
            <span>Gente en Pileta</span>
        </button>
    </div>

  </div>
)}


        {view === 'menuReportes' && (
            <div>
                <button onClick={() => setView('main')} className="btn-volver"><ArrowLeft size={20}/> Volver al Inicio</button>
                <h2 style={{marginBottom:'30px'}}>Seleccione el Reporte</h2>
                <div className="grid-menu">
                    <button className="btn-menu" onClick={() => { setView('listados'); setListaAsistencia([]); setFiltroListado({fecha:'', horario:''}); setBusquedaRealizada(false); }}><CalendarDays  size={36} color="var(--primary)"/> <span>Historial por fecha</span></button>
                    <button className="btn-menu" onClick={() => { setView('buscarHistorial'); setBusquedaDni(''); setHistorialPersonal([]); setAlumnoHistorial(null); }}><ClipboardList size={36} color="#059669"/> <span>Historial por DNI</span></button>
                </div>
            </div>
        )}
        
        {view === 'menuAgregar' && (
            <div>
                <button onClick={() => setView('main')} className="btn-volver"><ArrowLeft size={20}/> Volver</button>
                <h2 style={{marginBottom:'30px'}}>¿Qué deseas registrar?</h2>
                <div className="grid-menu">
                    <button className="btn-menu" onClick={() => { setFormAlumno({id:null, dni:'', nombre:'', apellido:'', celular:'', gmail:''}); setEsEdicionAlumno(false); setView('formAlumno'); }}><Users size={36} color="var(--primary)"/> <span>Nuevo Alumno</span></button>
                    <button className="btn-menu" onClick={() => { setFormProfesor({id:null, nombre:'', apellido:'', dni:'', telefono:'', especialidad:'', horarios:[{dia:'', horario:''}]}); setEsEdicionProfesor(false); setView('formProfesor'); }}><GraduationCap size={36} color="#059669"/> <span>Nuevo Profesor</span></button>
                </div>
            </div>
        )}
        
        {view === 'menuEditar' && (
            <div>
                <button onClick={() => setView('main')} className="btn-volver"><ArrowLeft size={20}/> Volver</button>
                <h2 style={{marginBottom:'30px'}}>¿Qué deseas editar?</h2>
                <div className="grid-menu">
                    <button className="btn-menu" onClick={() => { setView('buscarAlumno'); setBusquedaDni(''); }}><UserPen size={36} color="#7c3aed"/> <span>Editar Alumno</span></button>
                    <button className="btn-menu" onClick={() => { setView('buscarProfe'); setBusquedaDni(''); }}><UserStar size={36} color="#d97706"/> <span>Editar Profesor</span></button>
                </div>
            </div>
        )}

        {view === 'formAlumno' && (
            <div>
                <button onClick={() => setView(formAlumno.id ? 'menuEditar' : 'menuAgregar')} className="btn-volver"> <ArrowLeft size={20}/> Volver</button>
                <h2 style={{marginBottom:'20px'}}>{formAlumno.id ? 'Editar Alumno' : 'Registrar Nuevo Alumno'}</h2>
                <label>Nombre<span style={{color: '#ef4444'}}>*</span></label><input value={formAlumno.nombre} onChange={e=>setFormAlumno({...formAlumno, nombre:e.target.value})} required placeholder='Campo obligatorio'/>
                <label>Apellido<span style={{color: '#ef4444'}}>*</span></label><input value={formAlumno.apellido} onChange={e=>setFormAlumno({...formAlumno, apellido:e.target.value})} required placeholder='Campo obligatorio'/>
                <label>DNI<span style={{color: '#ef4444'}}>*</span></label><input value={formAlumno.dni} onChange={e=>setFormAlumno({...formAlumno, dni:e.target.value})} required placeholder='Campo obligatorio'/>
                <button type="button" onClick={() => asignarDniTemporal('alumno')}
                style={{ background: 'none', border: 'none', color: 'var(--primary)',textDecoration: 'underline', cursor: 'pointer', fontSize: '0.8rem',marginTop: '-12px', marginBottom: '15px', display: 'block', textAlign: 'left'}}>No tengo DNI</button>
                <label>Celular</label><input value={formAlumno.celular} onChange={e=>setFormAlumno({...formAlumno, celular:e.target.value})}/>
                <label>Email</label><input value={formAlumno.gmail} onChange={e=>setFormAlumno({...formAlumno, gmail:e.target.value})}/>
                <button onClick={handleGuardarAlumno} className="btn-primary"><Save size={20}/> {formAlumno.id ? 'Guardar Cambios' : 'Registrar'}</button>
                
                {view === 'formAlumno' && formAlumno.dni && esEdicionAlumno && (
                <button onClick={eliminarAlumno} 
                style={{marginTop:'15px',background:'rgba(239,68,68,0.15)',color:'#ef4444',border:'none',padding:'15px', borderRadius:'12px',cursor:'pointer', width:'100%',fontWeight:'bold'}}>
                    <Trash2 size={18}/> Eliminar Alumno</button>
                )}
            </div>
        )}

        {view === 'buscarAlumno' && (
            <div>
                <button onClick={() => setView('menuEditar')} className="btn-volver"><ArrowLeft size={20}/> Volver</button>
                <h2>Editar Alumno</h2>
                <label>Ingrese DNI del Alumno</label>
                <div style={{display:'flex', gap:'10px', marginTop:'15px'}}><input value={busquedaDni} onChange={e=>setBusquedaDni(e.target.value)} placeholder="Ej: 33444555" style={{marginBottom:0}}/><button onClick={buscarAlumnoEditar} className="btn-primary" style={{marginTop:0, width:'auto'}}>Buscar</button></div>
            </div>
        )}

        {view === 'formProfesor' && (
            <div>
                <button onClick={() => setView(formProfesor.id ? 'menuEditar' : 'menuAgregar')} className="btn-volver"><ArrowLeft size={20}/> Volver</button>
                <h2>{formProfesor.id ? 'Editar Profesor' : 'Nuevo Profesor'}</h2>
                <label>Nombre<span style={{color: '#ef4444'}}>*</span></label><input value={formProfesor.nombre} onChange={e=>setFormProfesor({...formProfesor, nombre:e.target.value})} required placeholder='Campo obligatorio'/>
                <label>Apellido<span style={{color: '#ef4444'}}>*</span></label><input value={formProfesor.apellido} onChange={e=>setFormProfesor({...formProfesor, apellido:e.target.value})} required placeholder='Campo obligatorio'/>
                <label>DNI<span style={{color: '#ef4444'}}>*</span></label><input value={formProfesor.dni} onChange={e=>setFormProfesor({...formProfesor, dni:e.target.value})}required placeholder="Campo obligatorio"/>
                <button type="button" onClick={() => asignarDniTemporal('profesor')}
                style={{ background: 'none', border: 'none', color: 'var(--primary)',textDecoration: 'underline', cursor: 'pointer', fontSize: '0.8rem',marginTop: '-12px', marginBottom: '15px', display: 'block', textAlign: 'left'}}>No tengo DNI</button>
                <label>Teléfono</label><input value={formProfesor.telefono} onChange={e=>setFormProfesor({...formProfesor, telefono:e.target.value})}/>
                <label>Especialidad</label><input value={formProfesor.especialidad} onChange={e=>setFormProfesor({...formProfesor, especialidad:e.target.value})}/>
                <div style={{background:'rgba(255,255,255,0.05)', padding:'20px', borderRadius:'15px', marginTop:'20px', border:'1px solid var(--border)'}}>
                    <h4 style={{marginTop:0}}>Horarios de Atención</h4>
                    {formProfesor.horarios.map((h, i) => (
                        <div key={i} style={{display:'flex', gap:'15px', marginBottom:'15px'}}>
                            <select value={h.dia} onChange={e => {const n=[...formProfesor.horarios]; n[i].dia=e.target.value; setFormProfesor({...formProfesor, horarios:n})}} style={{marginBottom:0}}><option value="">Día...</option>{diasSemana.map(d=><option key={d}>{d}</option>)}</select>
                            <select value={h.horario} onChange={e => {const n=[...formProfesor.horarios]; n[i].horario=e.target.value; setFormProfesor({...formProfesor, horarios:n})}} style={{marginBottom:0}}><option value="">Hora...</option>{listaHoras.map(l=><option key={l}>{l}</option>)}</select>
                            <button onClick={()=>{const n=[...formProfesor.horarios]; n.splice(i,1); setFormProfesor({...formProfesor, horarios:n})}} style={{border:'none', background:'rgba(239, 68, 68, 0.2)', color:'#ef4444', borderRadius:'8px', cursor:'pointer', padding:'0 15px'}}><Trash2 size={20}/></button>
                        </div>
                    ))}
                    <button onClick={()=>setFormProfesor({...formProfesor, horarios:[...formProfesor.horarios, {dia:'', horario:''}]})} style={{border:'1px dashed var(--border)', background:'transparent', color:'white', padding:'10px', borderRadius:'8px', cursor:'pointer', width:'100%'}}>+ Agregar Horario</button>
                </div>
                <button onClick={handleGuardarProfesor} className="btn-primary">Guardar</button>
                
                {view === 'formProfesor' && formProfesor.dni && esEdicionProfesor && (
                <button onClick={eliminarProfesor} 
                style={{marginTop:'15px',background:'rgba(239,68,68,0.15)',color:'#ef4444',border:'none', padding:'15px',borderRadius:'12px',cursor:'pointer',width:'100%',fontWeight:'bold'}}>
                    <Trash2 size={18}/> Eliminar Profesor</button>)}
            </div>
        )}

        {view === 'buscarProfe' && (
            <div>
                <button onClick={() => setView('menuEditar')} className="btn-volver"><ArrowLeft size={20}/> Volver</button>
                <h2>Editar Profesor</h2>
                <label>Ingrese DNI del Profesor</label>
                <div style={{display:'flex', gap:'10px', marginTop:'15px'}}><input value={busquedaDni} onChange={e=>setBusquedaDni(e.target.value)} placeholder="Ej: 12345678" style={{marginBottom:0}}/><button onClick={buscarProfesor} className="btn-primary" style={{marginTop:0, width:'auto'}}>Buscar</button></div>
            </div>
        )}

        {view === 'ingreso' && (
            <div>
                <button onClick={() => setView('main')} className="btn-volver"><ArrowLeft size={20}/> Volver</button>
                <h2>Control de Acceso</h2>
                <label>Ingrese DNI del Alumno</label>
                <div style={{display:'flex', gap:'10px', marginTop:'15px'}}><input value={busquedaDni} onChange={e=>setBusquedaDni(e.target.value)} placeholder="Ej: 33444555" style={{marginBottom:0}} onKeyDown={(e) => e.key === 'Enter' && buscarSocioIngreso()} /><button onClick={buscarSocioIngreso} className="btn-primary" style={{marginTop:0, width:'auto'}}>Buscar</button></div>
                
                {socioEncontrado && (
                    <div style={{marginTop:'30px', padding:'30px', background:'rgba(16, 185, 129, 0.1)', borderRadius:'15px', border:'1px solid #059669'}}>
                        <h3 style={{color:'#10b981', margin:0, fontSize:'1.5rem'}}>{socioEncontrado.nombre} {socioEncontrado.apellido}</h3>
                        <p style={{color:'#34d399'}}>DNI: {socioEncontrado.dni}</p>
                        
                        {asistenciaHoy && !asistenciaHoy.horario_egreso ? (
                            // CASO A: YA ESTÁ ADENTRO -> BOTÓN EGRESO
                            <div style={{textAlign:'center', marginTop:'20px'}}>
                                <p style={{fontSize:'1.2rem', fontWeight:'bold', color:'white'}}>🏊 Alumno actualmente en el natatorio</p>
                                <p>Ingresó a las: {asistenciaHoy.horario_ingreso} hs</p>
                                <button onClick={registrarEgreso} className="btn-primary" style={{background:'#eab308', color:'black', fontWeight:'bold', marginTop:'20px'}}>
                                    👋 Registrar Egreso
                                </button>
                            </div>
                        ) : asistenciaHoy && asistenciaHoy.horario_egreso ? (
                            // CASO B: YA SE FUE
                            <div style={{textAlign:'center', marginTop:'20px'}}>
                                <p style={{color:'#ef4444', fontWeight:'bold'}}>Este alumno ya completó su turno hoy.</p>
                                <p>Ingreso: {asistenciaHoy.horario_ingreso} - Egreso: {asistenciaHoy.horario_egreso}</p>
                                 
                            </div>
                        ) : (
                            // CASO C: NO VINO -> MOSTRAR INGRESO
                            <>
                               <label style={{display:'block', marginTop:'20px', fontWeight:'bold', color:'#34d399'}}>
            Fecha de Asistencia (Hoy):
        </label>
        
        {/* 👇 ESTE ES EL INPUT QUE CAMBIAMOS 👇 */}
        <input 
            type="date" 
            value={fechaIngreso} 
            disabled={true} 
            style={{
                width: '100%', 
                padding: '10px', 
                borderRadius: '8px', 
                border: '1px solid #059669', 
                background: 'rgba(0,0,0,0.2)', // Fondo oscurecido
                color: 'white', 
                opacity: 0.8,
                cursor: 'not-allowed' // Icono de prohibido
            }}
        />

        <label style={{display:'block', marginTop:'20px', fontWeight:'bold', color:'#34d399'}}> Turno:</label> <div style={{display:'flex', gap:'15px'}}>
                                    <input value={turno.dia || 'Seleccione fecha...'} disabled style={{flex:1, padding:'10px', borderRadius:'8px', border:'1px solid #059669', background:'rgba(0,0,0,0.2)', color:'white', opacity: 0.8}} />


                                    <select className='select-sin-flecha' value={turno.horario} disabled style={{flex:1, padding:'10px', borderRadius:'8px', border:'1px solid #059669', background:'rgba(0,0,0,0.2)', color:'white', opacity: 0.8}}>
                                        <option value={turno.horario}>{turno.horario || 'Horario...'}</option>

                                    </select>
                                </div>
                                {fechaIngreso && !turno.dia && <p style={{color:'#ef4444', fontSize:'0.9rem', marginTop:'5px'}}>* No hay turnos disponibles.</p>}
                                <button onClick={registrarAsistencia} disabled={!turno.dia || !turno.horario} className="btn-primary" style={{background:'#059669', border:'none', opacity: (!turno.dia || !turno.horario) ? 0.5 : 1}}>Confirmar Acceso</button>
                            </>
                        )}
                    </div>
                )}
            </div>
        )}

       {view === 'buscarHistorial' && (
            <div>
                <button onClick={() => setView('menuReportes')} className="btn-volver"><ArrowLeft size={20}/> Volver</button>
                <h2>Historial de Asistencia</h2>
                <label>Ingrese DNI del Alumno</label>
                <div style={{display:'flex', gap:'10px', marginTop:'15px'}}>
                    <input value={busquedaDni} onChange={e=>setBusquedaDni(e.target.value)} placeholder="Ej: 33444555" style={{marginBottom:0}}/>
                    <button onClick={buscarHistorialPersonal} className="btn-primary" style={{marginTop:0, width:'auto'}}>Buscar</button>
                </div>

                {alumnoHistorial && (
                    <div style={{marginTop:'30px'}}>
                          <div style={{background:'rgba(255,255,255,0.05)', padding:'15px', borderRadius:'10px', border:'1px solid var(--border)', marginBottom:'20px'}}>
                             <h3 style={{margin:0, color:'var(--primary)'}}>{alumnoHistorial.nombre} {alumnoHistorial.apellido}</h3>
                             <p style={{margin:0, color:'var(--text-muted)'}}>DNI: {alumnoHistorial.dni}</p>
                          </div>

                          {historialPersonal.length > 0 ? (
                            <table>
                                <thead>
                                    <tr>
                                        <th>Fecha</th>
                                        <th>Ingreso</th> {/* Antes decía Turno */}
                                        <th>Salida</th>  {/* Columna NUEVA */}
                                    </tr>
                                </thead>
                                <tbody>
                                    {historialPersonal.map((h, i) => (
                                        <tr key={i}>
                                            <td style={{fontWeight:'600'}}>
                                                {/* Corrección de fecha para que no reste un día */}
                                                {h.fecha_registro.split('T')[0].split('-').reverse().join('/')}
                                            </td>
                                            {/* CAMBIO: h.horario ahora es h.horario_ingreso */}
                                            <td style={{fontWeight:'bold', color:'var(--primary)'}}>
                                                {h.dia} {h.horario_ingreso}
                                            </td>
                                            {/* CAMBIO: Nueva columna calculada */}
                                            <td>{getHoraSalida(h.horario_ingreso, h.horario_egreso)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                          ) : <p style={{textAlign:'center', padding:'20px'}}>Este alumno no tiene asistencias registradas.</p>}
                    </div>
                )}
            </div>
        )}

        {view === 'listados' && (
            <div>
                <button onClick={() => setView('menuReportes')} className="btn-volver"><ArrowLeft size={20}/> Volver</button>
                <h2>Listado de Asistencia</h2>
                
                {/* Filtros */}
                <div style={{display:'flex', gap:'15px', marginTop:'20px', alignItems:'center'}}>
                    <input type="date" value={filtroReporteFecha.fecha} onChange={e => {setFiltroReporteFecha({...filtroReporteFecha,fecha: e.target.value});setBusquedaRealizada(false);}}style={{ marginBottom: 0 }}/>
                    <select value={filtroReporteFecha.horario} onChange={e => { setFiltroReporteFecha({   ...filtroReporteFecha,   horario: e.target.value });  setBusquedaRealizada(false);}}style={{ marginBottom: 0 }}>
                        <option value="">Hora...</option>
                        {horasReporte.map(h => (<option key={h} value={h}>{h}</option>))}</select>

                    <button onClick={verListadoPorFecha} className="btn-primary"style={{ marginTop: 0, width: 'auto' }}> Ver</button>
                </div>
                    

                {/* Tabla */}
                {listaAsistencia.length > 0 ? (
                    <table>
                      <thead>
                            <tr>
                                <th>Fecha</th> 
                                <th>Ingreso</th> {/* Antes Turno */}
                                <th>Salida</th>  {/* Columna NUEVA */}
                                <th>Nombre</th>
                                <th>DNI</th>
                                <th>Acción</th>
                            </tr>
                        </thead>
                        <tbody>
                            {listaAsistencia.map((a) => (
                                <tr key={a.id}>
                                    <td>{a.fecha_registro.split('T')[0].split('-').reverse().join('/')}</td>
                                    
                                    {/* CAMBIO: a.horario ahora es a.horario_ingreso */}
                                    <td style={{fontWeight:'bold', color:'var(--primary)'}}>
                                        {a.dia} {a.horario_ingreso}
                                    </td>
                                    
                                    {/* CAMBIO: Nueva columna calculada */}
                                    <td>{getHoraSalida(a.horario_ingreso, a.horario_egreso)}</td>
                                    
                                    <td>{a.nombre} {a.apellido}</td>
                                    <td>{a.alumno_dni}</td>
                                    <td>
                                        <button 
                                            onClick={() => eliminarAsistencia(a.id)} 
                                            style={{
                                                background: 'rgba(239, 68, 68, 0.15)', 
                                                color: '#ef4444', 
                                                border: 'none', 
                                                padding: '8px', 
                                                borderRadius: '8px', 
                                                cursor: 'pointer'
                                            }}
                                            title="Eliminar de la lista"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : busquedaRealizada && <p style={{textAlign:'center', marginTop:'30px', color:'var(--text-muted)'}}>No hay registros para este turno.</p>}
            </div>
        )}
        {view === 'activos' && (
            <div>
                <button onClick={() => setView('main')} className="btn-volver"><ArrowLeft size={20}/> Volver</button>
                
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px'}}>
                    <h2>Personas en el Agua ({listaActivos.length})</h2>
                    
                </div>

                {listaActivos.length > 0 ? (
                    <>
                        <div style={{maxHeight:'400px', overflowY:'auto', border:'1px solid var(--border)', borderRadius:'12px'}}>
                            <table style={{width:'100%', borderCollapse:'collapse'}}>
                                <thead style={{position:'sticky', top:0, background:'var(--bg-card)', zIndex:1}}>
                                    <tr>
                                        <th style={{textAlign:'left', padding:'12px'}}>Nombre</th>
                                        <th style={{textAlign:'left', padding:'12px'}}>Ingreso</th>
                                        <th style={{textAlign:'center', padding:'12px'}}>Acción</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {listaActivos.map((p) => (
                                        <tr key={p.id} style={{borderBottom:'1px solid var(--border)'}}>
                                            <td style={{padding:'12px'}}>
                                                <strong>{p.nombre} {p.apellido}</strong><br/>
                                                <span style={{fontSize:'0.8rem', opacity:0.7}}>{p.dni}</span>
                                            </td>
                                            <td style={{padding:'12px', color:'var(--primary)', fontWeight:'bold'}}>{p.horario_ingreso}</td>
                                            <td style={{textAlign:'center', padding:'12px'}}>
                                                <button 
                                                    onClick={() => confirmarEgresoIndividual(p.id, p.nombre)}                                                    className="btn-primary"
                                                    style={{padding:'8px 15px', fontSize:'0.9rem', width:'auto', marginTop:0, background:'#eab308', color:'black'}}
                                                >
                                                    Salir 👋
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* BOTÓN DE CIERRE MASIVO */}
                        <div style={{marginTop:'30px', borderTop:'2px dashed var(--border)', paddingTop:'20px'}}>
                            <p style={{fontSize:'0.9rem', color:'var(--text-muted)', marginBottom:'10px'}}>Zona de Cierre de Turno</p>
                            <button 
                                onClick={confirmarEgresoMasivo}
                                style={{
                                    width:'100%', 
                                    padding:'15px', 
                                    background:'rgba(239, 68, 68, 0.15)', 
                                    color:'#ef4444', 
                                    border:'2px solid #ef4444', 
                                    borderRadius:'12px', 
                                    fontWeight:'bold',
                                    cursor:'pointer',
                                    display:'flex',
                                    alignItems:'center',
                                    justifyContent:'center',
                                    gap:'10px'
                                }}
                            >
                                <LogOut size={24}/> SACAR A TODOS ({listaActivos.length})
                            </button>
                        </div>
                        
                    </>
                ) : (
                    <div style={{textAlign:'center', padding:'50px', color:'var(--text-muted)'}}>
                        <CheckCircle size={64} style={{opacity:0.3, marginBottom:'20px'}}/>
                        <p>No hay nadie en la pileta actualmente.</p>
                    </div>
                )}
            </div>
        )} {modal.show && (
            <div className="modal-overlay" onClick={cerrarModal}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                    <h3 style={{color: 'var(--primary)', marginTop:0}}>{modal.titulo}</h3>
                    <p style={{fontSize:'1.1rem', color:'var(--text-primary)'}}>{modal.mensaje}</p>

                    <div className="modal-actions">
                        <button onClick={cerrarModal} className="btn-cancelar">Cancelar</button>
                        <button 
                            onClick={modal.accionConfirmar} 
                            className="btn-primary" 
                            style={{width:'auto', marginTop:0}}
                        >
                            Confirmar
                        </button>
                    </div>
                </div>
            </div>
        )}
        
      </div>
    </div>
  );
}