//PROBANDO
import React, { useState, useEffect } from 'react';
import { Users, Search, UserPlus, GraduationCap, ClipboardList, ArrowLeft, Save, UserCog, CheckCircle, Trash2, Edit, Moon, Sun, CalendarDays, FileText } from 'lucide-react';
import './App.css'; 

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
  const [editarFecha, setEditarFecha] = useState(false);

  const [formAlumno, setFormAlumno] = useState({ id: null, dni: '', nombre: '', apellido: '', celular: '', gmail: '' });
  const [formProfesor, setFormProfesor] = useState({ id: null, nombre: '', apellido: '', dni: '', telefono: '', especialidad: '', horarios: [{ dia: '', horario: '' }] });
  
  const [busquedaDni, setBusquedaDni] = useState('');
  const [socioEncontrado, setSocioEncontrado] = useState(null);
  
  // ESTADO TURNO: dia y horario
  const [turno, setTurno] = useState({ dia: '', horario: '' });
  
  // ESTADO FECHA: Inicializamos con HOY
  const [fechaIngreso, setFechaIngreso] = useState(new Date().toISOString().split('T')[0]);

  // Estados Listado y Historial
  const [filtroListado, setFiltroListado] = useState({ dia: '', horario: '' });
  const [listaAsistencia, setListaAsistencia] = useState([]);
  const [historialPersonal, setHistorialPersonal] = useState([]);
  const [alumnoHistorial, setAlumnoHistorial] = useState(null);

  const [horariosBD, setHorariosBD] = useState([]);
  const [busquedaRealizada, setBusquedaRealizada] = useState(false);

  const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado','Domingo'];
  const listaHoras = ['08:00', '09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'];

  useEffect(() => {
      fetch('http://localhost:5000/api/horarios-disponibles')
          .then(res => res.json()).then(data => setHorariosBD(data))
          .catch(console.error);
  }, [view]);

  const getDiasDisponibles = () => diasSemana.filter(d => [...new Set(horariosBD.map(i => i.dia))].includes(d));
  // Filtra horarios basándose en el día seleccionado
  const getHorasPorDia = (dia) => horariosBD.filter(i => i.dia === dia).map(i => i.horario).sort();

  // --- NUEVA LÓGICA: DETECTAR DÍA DE LA SEMANA AUTOMÁTICAMENTE ---
  useEffect(() => {
    if (fechaIngreso && view === 'ingreso') {
        // 1. Convertir string "YYYY-MM-DD" a objeto Date correctamente (evitando error de zona horaria)
        const [year, month, day] = fechaIngreso.split('-').map(Number);
        const fechaObj = new Date(year, month - 1, day); // Mes es index 0-11
        
        // 2. Obtener día de la semana (0=Domingo, 1=Lunes...)
        const indexDia = fechaObj.getDay();
        const nombresDias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        const nombreDia = nombresDias[indexDia];

        // 3. Verificar si el natatorio abre ese día
        const abreEseDia = getDiasDisponibles().includes(nombreDia);

        if (abreEseDia) {
            // Si abre, seleccionamos el día automáticamente y reseteamos la hora
            setTurno(prev => 
                ({ ...prev, dia: nombreDia, horario: '' }));
        } else {
            // Si es Domingo o un día que no abren
            setTurno({ dia: '', horario: '' });
            setMensaje(`⚠️ El natatorio no abre los ${nombreDia}s`);
            setTimeout(() => setMensaje(''), 3000);
        }
    }
  }, [fechaIngreso, view, horariosBD]); // Se ejecuta cada vez que cambias la fecha

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
        setTimeout(() => setMensaje(''), 3000);
    } catch (error) {
        setMensaje('❌ Error al conectar con el servidor');
        setTimeout(() => setMensaje(''), 3000);
    }
};
  const eliminarAlumno = async () => {
  if (!window.confirm('¿Seguro que deseas eliminar este alumno?')) return;

  try {
    const res = await fetch(`http://localhost:5000/api/alumnos/${formAlumno.id}`, {
      method: 'DELETE'
    });

    if (res.ok) {
      setMensaje('🗑️ Alumno eliminado correctamente');
      setFormAlumno({ id:null, dni:'', nombre:'', apellido:'', celular:'', gmail:'' });
      setTimeout(() => {
        setMensaje('');
        setView('main');
      }, 1500);
    } else {
      setMensaje('Error al eliminar alumno');
    }
  } catch {
    setMensaje('Error de conexión');
  }
};

const eliminarProfesor = async () => {
  if (!window.confirm('¿Seguro que deseas eliminar este profesor?')) return;

  try {
    const res = await fetch(`http://localhost:5000/api/profesores/${formProfesor.id}`, {
      method: 'DELETE'
    });

    if (res.ok) {
      setMensaje('🗑️ Profesor eliminado correctamente');
      setFormProfesor({ id:null, nombre:'', apellido:'', dni:'', telefono:'', especialidad:'', horarios:[{dia:'', horario:''}] });
      setTimeout(() => {
        setMensaje('');
        setView('main');
      }, 1500);
    } else {
      setMensaje('Error al eliminar profesor');
    }
  } catch {
    setMensaje('Error de conexión');
  }
};


  const handleGuardarAlumno = async () => {
    //VALIDACION DEL DNI
    if (!formAlumno.dni || formAlumno.dni.trim() === "") {
        setMensaje('⚠️ El DNI es obligatorio para registrar al alumno.');
        setTimeout(() => setMensaje(''), 3000);
        return;
    }
    //VALIDACION DEL NOMBRE
    if (!formAlumno.nombre || formAlumno.nombre.trim() === "") {
        setMensaje('⚠️ El Nombre es obligatorio para registrar al alumno.');
        setTimeout(() => setMensaje(''), 3000);
        return;
    }
    //VALIDACION DEL APELLIDO
    if (!formAlumno.apellido || formAlumno.apellido.trim() === "") {
        setMensaje('⚠️ El Apellido es obligatorio para registrar al alumno.');
        setTimeout(() => setMensaje(''), 3000);
        return;
    }
    const esEdicion = !!formAlumno.id;
    try {
        const url = esEdicion ? `http://localhost:5000/api/alumnos/${formAlumno.id}` : 'http://localhost:5000/api/alumnos';
        const metodo = esEdicion ? 'PUT' : 'POST';
        const res = await fetch(url, { method: metodo, headers: {'Content-Type':'application/json'}, body: JSON.stringify(formAlumno) });
        const data = await res.json();
        if (res.ok) {
            setMensaje(esEdicion ? '¡Alumno actualizado!' : '¡Alumno registrado!');
            setFormAlumno({id: null, dni:'', nombre:'', apellido:'', celular:'', gmail:''});
            setTimeout(() => { setMensaje(''); setView('main'); }, 1500);
        } else { setMensaje(data.message || 'Error al guardar.'); setTimeout(() => setMensaje(''), 3000); }
    } catch(e) { setMensaje('Error conexión.'); setTimeout(() => setMensaje(''), 3000); }
  };

  const buscarAlumnoEditar = async () => {
      if(!busquedaDni) return;
      try {
          const res = await fetch(`http://localhost:5000/api/alumnos/${busquedaDni}`);
          if(res.ok) {
              const data = await res.json();
              setFormAlumno({ id: data.id, dni: data.dni, nombre: data.nombre, apellido: data.apellido, celular: data.telefono, gmail: data.email });
              setView('formAlumno');
              setBusquedaDni(''); 
          } else { setMensaje('⚠️ Alumno no encontrado.'); setTimeout(() => setMensaje(''), 3000); }
      } catch (e) { setMensaje('Error conexión'); setTimeout(() => setMensaje(''), 3000); }
  };

  const handleGuardarProfesor = async () => {
    // VALIDACION DEL DNI
    if (!formProfesor.dni || formProfesor.dni.trim() === "") {
        setMensaje('⚠️ El DNI es obligatorio para registrar al profesor.');
        setTimeout(() => setMensaje(''), 3000);
        return;
    }
    //VALIDACION DEL NOMBRE
    if (!formProfesor.nombre || formProfesor.nombre.trim() === "") {
        setMensaje('⚠️ El Nombre es obligatorio para registrar al profesor.');
        setTimeout(() => setMensaje(''), 3000);
        return;
    }
    //VALIDACION DEL APELLIDO
    if (!formProfesor.apellido || formProfesor.apellido.trim() === "") {
        setMensaje('⚠️ El Apellido es obligatorio para registrar al profesor.');
        setTimeout(() => setMensaje(''), 3000);
        return;
    }
    const esEdicion = !!formProfesor.id;
    try {
      const url = esEdicion ? `http://localhost:5000/api/profesores/${formProfesor.id}` : 'http://localhost:5000/api/profesores';
      const metodo = esEdicion ? 'PUT' : 'POST';
      const res = await fetch(url, { method: metodo, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formProfesor) });
      const data = await res.json();
      if (res.ok) {
        setMensaje('¡Profesor guardado!');
        setFormProfesor({ id: null, nombre: '', apellido: '', dni: '', telefono: '', especialidad: '', horarios: [{ dia: '', horario: '' }] });
        setTimeout(() => { setMensaje(''); setView('main'); }, 1500);
      } else { setMensaje(data.message || 'Error al guardar.'); setTimeout(() => setMensaje(''), 3000); }
    } catch (e) { setMensaje('Error conexión.'); setTimeout(() => setMensaje(''), 3000); }
  };

  const buscarProfesor = async () => {
      if(!busquedaDni) return;
      try {
          const res = await fetch(`http://localhost:5000/api/profesores/${busquedaDni}`);
          if(res.ok) {
              const data = await res.json();
              setFormProfesor({ ...data, horarios: data.horarios.length ? data.horarios : [{dia:'', horario:''}] });
              setView('formProfesor');
              setBusquedaDni('');
          } else { setMensaje('⚠️ Profesor no encontrado.'); setTimeout(() => setMensaje(''), 3000); }
      } catch (e) { setMensaje('Error conexión'); setTimeout(() => setMensaje(''), 3000); }
  };

  const buscarSocioIngreso = async () => {
    if (!busquedaDni) return;
    try {
        const r = await fetch(`http://localhost:5000/api/alumnos/${busquedaDni}`);
        if(r.ok) {
            setSocioEncontrado(await r.json());
            setMensaje('¡Alumno verificado!');
            // Al buscar socio, forzamos la actualización del día por si ya había fecha seleccionada
            const [y,m,d] = fechaIngreso.split('-');
            const date = new Date(y, m-1, d);
            const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
            const diaNombre = dias[date.getDay()];
            if (getDiasDisponibles().includes(diaNombre)) {
                setTurno(prev => ({ ...prev, dia: diaNombre, horario: '' }));
            }
            setTimeout(() => setMensaje(''), 1500);
        } else { setMensaje('⚠️ DNI no encontrado.'); setSocioEncontrado(null); setTimeout(() => setMensaje(''), 3000); }
    } catch(e) { setMensaje('Error conexión'); setTimeout(() => setMensaje(''), 3000); }
  };

  const registrarAsistencia = async () => {
      if (!turno.dia || !turno.horario) {
          setMensaje('⚠️ Por favor selecciona un horario válido.');
          setTimeout(() => setMensaje(''), 3000);
          return;
      }
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
                  setTurno({dia:'', horario:''}); 
                  setFechaIngreso(new Date().toISOString().split('T')[0]); 
                  setView('main'); 
              }, 2000);
          } else { setMensaje(data.message || 'Error al guardar.'); setTimeout(() => setMensaje(''), 3000); }
      } catch (error) { setMensaje('Error de conexión.'); setTimeout(() => setMensaje(''), 3000); }
  };

  const verListado = async () => {
      if(!filtroListado.dia || !filtroListado.horario) return;
      try {
          const res = await fetch(`http://localhost:5000/api/asistencias/listado?dia=${filtroListado.dia}&horario=${filtroListado.horario}`);
          if(res.ok) { setListaAsistencia(await res.json()); setBusquedaRealizada(true); }
      } catch (error) { setMensaje('Error al cargar lista'); setTimeout(() => setMensaje(''), 3000); }
  };

  const eliminarAsistencia = async (idAsistencia) => {
      if(!window.confirm('¿Seguro que quieres quitar a esta persona de la lista?')) return;

      try {
          const res = await fetch(`http://localhost:5000/api/asistencias/${idAsistencia}`, {
              method: 'DELETE'
          });

          if(res.ok) {
              setMensaje('🗑️ Registro eliminado correctamente');
              // Actualizamos la lista automáticamente quitando el elemento borrado
              setListaAsistencia(listaAsistencia.filter(item => item.id !== idAsistencia));
              setTimeout(() => setMensaje(''), 3000);
          } else {
              setMensaje('Error al eliminar');
          }
      } catch (error) {
          setMensaje('Error de conexión');
      }
  };

  const buscarHistorialPersonal = async () => {
      if(!busquedaDni) return;
      try {
          const resAlumno = await fetch(`http://localhost:5000/api/alumnos/${busquedaDni}`);
          if(!resAlumno.ok) { setMensaje('⚠️ Alumno no encontrado'); setTimeout(() => setMensaje(''), 3000); return; }
          setAlumnoHistorial(await resAlumno.json());
          const resHistorial = await fetch(`http://localhost:5000/api/asistencias/historial/${busquedaDni}`);
          if(resHistorial.ok) { setHistorialPersonal(await resHistorial.json()); }
      } catch (e) { setMensaje('Error de conexión'); setTimeout(() => setMensaje(''), 3000); }
  };

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

        {mensaje && <div className={`alerta ${mensaje.includes('Error') || mensaje.includes('⚠️') || mensaje.includes('No') ? 'error' : 'exito'}`}>{mensaje}</div>}

        {view === 'main' && (
          <div className="grid-menu">
            <button className="btn-menu" onClick={() => setView('menuAgregar')}><UserPlus size={36} color="var(--primary)"/><span>Registrar</span></button>
            <button className="btn-menu" onClick={() => setView('menuEditar')}><Edit size={36} color="#7c3aed"/><span>Editar Datos</span></button>
            <button className="btn-menu" onClick={() => { setView('ingreso'); setBusquedaDni(''); setSocioEncontrado(null);setTurno({ dia:'', horario:'' });setMensaje('');setFechaIngreso(new Date().toISOString().split('T')[0]); }}><CheckCircle size={36} color="#059669"/><span>Registrar Ingreso</span></button>
            <button className="btn-menu" onClick={() => setView('menuReportes')}><FileText size={36} color="#64748b"/><span>Reportes</span></button>
          </div>
        )}

        {/* ... (SUBMENUS y FORMULARIOS IGUAL QUE ANTES) ... */}
        {view === 'menuReportes' && (
            <div>
                <button onClick={() => setView('main')} className="btn-volver"><ArrowLeft size={20}/> Volver al Inicio</button>
                <h2 style={{marginBottom:'30px'}}>Seleccione el Reporte</h2>
                <div className="grid-menu">
                    <button className="btn-menu" onClick={() => { setView('listados'); setListaAsistencia([]); setFiltroListado({dia:'', horario:''}); setBusquedaRealizada(false); }}><ClipboardList size={36} color="var(--primary)"/> <span>Asistencias por Turno</span></button>
                    <button className="btn-menu" onClick={() => { setView('buscarHistorial'); setBusquedaDni(''); setHistorialPersonal([]); setAlumnoHistorial(null); }}><CalendarDays size={36} color="#059669"/> <span>Historial de Alumno</span></button>
                </div>
            </div>
        )}
        
        {view === 'menuAgregar' && (
            <div>
                <button onClick={() => setView('main')} className="btn-volver"><ArrowLeft size={20}/> Volver</button>
                <h2 style={{marginBottom:'30px'}}>¿Qué deseas registrar?</h2>
                <div className="grid-menu">
                    <button className="btn-menu" onClick={() => { setFormAlumno({id:null, dni:'', nombre:'', apellido:'', celular:'', gmail:''}); setView('formAlumno'); }}><Users size={36} color="var(--primary)"/> <span>Nuevo Alumno</span></button>
                    <button className="btn-menu" onClick={() => { setFormProfesor({id:null, nombre:'', apellido:'', dni:'', telefono:'', especialidad:'', horarios:[{dia:'', horario:''}]}); setView('formProfesor'); }}><GraduationCap size={36} color="#059669"/> <span>Nuevo Profesor</span></button>
                </div>
            </div>
        )}
        
        {view === 'menuEditar' && (
            <div>
                <button onClick={() => setView('main')} className="btn-volver"><ArrowLeft size={20}/> Volver</button>
                <h2 style={{marginBottom:'30px'}}>¿Qué deseas editar?</h2>
                <div className="grid-menu">
                    <button className="btn-menu" onClick={() => { setView('buscarAlumno'); setBusquedaDni(''); }}><UserCog size={36} color="#7c3aed"/> <span>Editar Alumno</span></button>
                    <button className="btn-menu" onClick={() => { setView('buscarProfe'); setBusquedaDni(''); }}><Search size={36} color="#d97706"/> <span>Editar Profesor</span></button>
                </div>
            </div>
        )}

        {view === 'formAlumno' && (
    <div>
        {/* CORRECCIÓN: Vuelve al menú correspondiente según si es edición o nuevo */}
        <button onClick={() => setView(formAlumno.id ? 'menuEditar' : 'menuAgregar')} className="btn-volver"> <ArrowLeft size={20}/> Volver</button>
        
        <h2 style={{marginBottom:'20px'}}>{formAlumno.id ? 'Editar Alumno' : 'Registrar Nuevo Alumno'}</h2>
        {/* ... resto del código igual ... */}
                <label>Nombre<span style={{color: '#ef4444'}}>*</span></label><input value={formAlumno.nombre} onChange={e=>setFormAlumno({...formAlumno, nombre:e.target.value})} required placeholder='Campo obligatorio'/>
                <label>Apellido<span style={{color: '#ef4444'}}>*</span></label><input value={formAlumno.apellido} onChange={e=>setFormAlumno({...formAlumno, apellido:e.target.value})} required placeholder='Campo obligatorio'/>
                <label>DNI<span style={{color: '#ef4444'}}>*</span></label><input value={formAlumno.dni} onChange={e=>setFormAlumno({...formAlumno, dni:e.target.value})} required placeholder='Campo obligatorio'/>
                <button type="button" onClick={() => asignarDniTemporal('alumno')}
                style={{ background: 'none', border: 'none', color: 'var(--primary)',textDecoration: 'underline', cursor: 'pointer', fontSize: '0.8rem',marginTop: '-12px', marginBottom: '15px', display: 'block', textAlign: 'left'}}>No tengo DNI</button>
                <label>Celular</label><input value={formAlumno.celular} onChange={e=>setFormAlumno({...formAlumno, celular:e.target.value})}/>
                <label>Email</label><input value={formAlumno.gmail} onChange={e=>setFormAlumno({...formAlumno, gmail:e.target.value})}/>
                <button onClick={handleGuardarAlumno} className="btn-primary"><Save size={20}/> {formAlumno.id ? 'Guardar Cambios' : 'Registrar'}</button>
                
                
                {view === 'formAlumno' && formAlumno.dni && (
                <button 
                    onClick={eliminarAlumno}
                    style={{
                    marginTop:'15px',
                    background:'rgba(239,68,68,0.15)',
                    color:'#ef4444',
                    border:'none',
                    padding:'15px',
                    borderRadius:'12px',
                    cursor:'pointer',
                    width:'100%',
                    fontWeight:'bold'
                    }}
                >
                    <Trash2 size={18}/> Eliminar Alumno
                </button>
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
        {/* CORRECCIÓN: Vuelve al menú correspondiente según si es edición o nuevo */}
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
               
                {view === 'formProfesor' && formProfesor.dni && (
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

        {/* --- VISTA INGRESO MODIFICADA --- */}
        {view === 'ingreso' && (
            <div>
                <button onClick={() => setView('main')} className="btn-volver"><ArrowLeft size={20}/> Volver</button>
                <h2>Registrar Ingreso</h2>
                <label>Ingrese DNI del Alumno</label>
                <div style={{display:'flex', gap:'10px', marginTop:'15px'}}><input value={busquedaDni} onChange={e=>setBusquedaDni(e.target.value)} placeholder="Ej: 33444555" style={{marginBottom:0}}/><button onClick={buscarSocioIngreso} className="btn-primary" style={{marginTop:0, width:'auto'}}>Buscar</button></div>
                {socioEncontrado && (
                    <div style={{marginTop:'30px', padding:'30px', background:'rgba(16, 185, 129, 0.1)', borderRadius:'15px', border:'1px solid #059669'}}>
                        <h3 style={{color:'#10b981', margin:0, fontSize:'1.5rem'}}>{socioEncontrado.nombre} {socioEncontrado.apellido}</h3>
                        <p style={{color:'#34d399'}}>DNI: {socioEncontrado.dni}</p>
                        
                        {/* CALENDARIO */}
                        <label style={{display:'block', marginTop:'20px', fontWeight:'bold', color:'#34d399'}}>Fecha de Asistencia:</label>
                        <input 
                            type="date" 
                            value={fechaIngreso} 
                            onChange={(e) => setFechaIngreso(e.target.value)}
                            style={{width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #059669', background: 'transparent', color: 'inherit'}}
                        />

                        {/* SELECTOR DE TURNO (Día bloqueado, Horario filtrado) */}
                        <label style={{display:'block', marginTop:'20px', fontWeight:'bold', color:'#34d399'}}>Seleccionar Turno:</label>
                        <div style={{display:'flex', gap:'15px'}}>
                            {/* Input del Día: Ahora está DESHABILITADO (disabled) porque se calcula solo */}
                            <input 
                                value={turno.dia || 'Seleccione fecha...'} 
                                disabled 
                                style={{flex:1, padding:'10px', borderRadius:'8px', border:'1px solid #059669', background:'rgba(0,0,0,0.2)', color:'white', opacity: 0.8}} 
                            />
                            
                            {/* Selector de Horario: Solo muestra los del día elegido */}
                            <select 
                                value={turno.horario} 
                                onChange={e=>setTurno({...turno, horario:e.target.value})} 
                                disabled={!turno.dia} 
                                style={{flex:1, padding:'10px', borderRadius:'8px', border:'1px solid #059669', background:'rgba(0,0,0,0.2)', color:'white', opacity: 0.8}}
                            >
                                <option value="">Horario...</option>
                                {turno.dia ? getHorasPorDia(turno.dia).map(h=><option key={h} value={h}>{h}</option>) : null}
                            </select>
                        </div>
                        
                        {/* Aviso si no hay día válido */}
                        {fechaIngreso && !turno.dia && <p style={{color:'#ef4444', fontSize:'0.9rem', marginTop:'5px'}}>* No hay turnos disponibles para esta fecha .</p>}
                        
                        <button onClick={registrarAsistencia} disabled={!turno.dia || !turno.horario} className="btn-primary" style={{background:'#059669', border:'none', opacity: (!turno.dia || !turno.horario) ? 0.5 : 1}}>Confirmar Acceso</button>
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
                                        <th>Fecha de Asistencia</th>
                                        <th>Turno</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {historialPersonal.map((h, i) => (
                                        <tr key={i}>
                                            <td style={{fontWeight:'600'}}>
                                            {h.fecha_registro.split('T')[0].split('-').reverse().join('/')}
                                            </td>

                                            <td style={{fontWeight:'bold', color:'var(--primary)'}}>{h.dia} {h.horario}</td>
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
                <div style={{display:'flex', gap:'15px', marginTop:'20px', alignItems:'center'}}>
                    <select value={filtroListado.dia} onChange={e=>{setFiltroListado({...filtroListado, dia:e.target.value, horario:''}); setBusquedaRealizada(false);}} style={{marginBottom:0}}><option value="">Día...</option>{getDiasDisponibles().map(d=><option key={d} value={d}>{d}</option>)}</select>
                    <select value={filtroListado.horario} onChange={e=>{setFiltroListado({...filtroListado, horario:e.target.value}); setBusquedaRealizada(false);}} disabled={!filtroListado.dia} style={{marginBottom:0}}><option value="">Hora...</option>{getHorasPorDia(filtroListado.dia).map(h=><option key={h} value={h}>{h}</option>)}</select>
                    <button onClick={verListado} className="btn-primary" style={{marginTop:0, width:'auto'}}>Ver</button>
                </div>

                {listaAsistencia.length > 0 ? (
                    <table>
                        <thead>
                            <tr>
                                <th>Fecha</th> 
                                <th>Turno</th>
                                <th>Nombre</th>
                                <th>DNI</th>
                                <th>Acción</th> {/* Nueva Columna */}
                            </tr>
                        </thead>
                        <tbody>
                            {listaAsistencia.map((a, i) => (
                                <tr key={i}>
                                    <td>{new Date(a.fecha_registro).toLocaleDateString()}</td>
                                    <td style={{fontWeight:'bold', color:'var(--primary)'}}>{a.dia} {a.horario}</td>
                                    <td>{a.nombre} {a.apellido}</td>
                                    <td>{a.dni}</td>
                                    <td>
                                        {/* Botón de borrar */}
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

      </div>
    </div>
  );
}