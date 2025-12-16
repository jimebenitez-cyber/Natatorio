import React, { useState, useEffect } from 'react';
import { Users, Search, UserPlus, GraduationCap, ClipboardList, ArrowLeft, Save, UserCog, CheckCircle, Trash2, Edit } from 'lucide-react';
import './App.css'; 

export default function App() {
  const [view, setView] = useState('main');
  const [mensaje, setMensaje] = useState('');
  
  // Estados
  const [formAlumno, setFormAlumno] = useState({ id: null, dni: '', nombre: '', apellido: '', celular: '', gmail: '' });
  const [formProfesor, setFormProfesor] = useState({ id: null, nombre: '', apellido: '', dni: '', telefono: '', especialidad: '', horarios: [{ dia: '', horario: '' }] });
  
  const [busquedaDni, setBusquedaDni] = useState('');
  const [socioEncontrado, setSocioEncontrado] = useState(null);
  const [turno, setTurno] = useState({ dia: '', horario: '' });
  
  const [filtroListado, setFiltroListado] = useState({ dia: '', horario: '' });
  const [listaAsistencia, setListaAsistencia] = useState([]);
  const [horariosBD, setHorariosBD] = useState([]);

  const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const listaHoras = ['08:00', '09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'];

  // Carga inicial
  useEffect(() => {
      fetch('http://localhost:5000/api/horarios-disponibles')
          .then(res => res.json()).then(data => setHorariosBD(data))
          .catch(console.error);
  }, [view]);

  // Helpers
  const getDiasDisponibles = () => diasSemana.filter(d => [...new Set(horariosBD.map(i => i.dia))].includes(d));
  const getHorasPorDia = (dia) => horariosBD.filter(i => i.dia === dia).map(i => i.horario).sort();

  // --- LÓGICA ALUMNO (CON DETECCIÓN DE ERROR) ---
  const handleGuardarAlumno = async () => {
    const esEdicion = !!formAlumno.id;
    try {
        const url = esEdicion ? `http://localhost:5000/api/alumnos/${formAlumno.id}` : 'http://localhost:5000/api/alumnos';
        const metodo = esEdicion ? 'PUT' : 'POST';
        
        const res = await fetch(url, { 
            method: metodo, 
            headers: {'Content-Type':'application/json'}, 
            body: JSON.stringify(formAlumno) 
        });

        // LEEMOS LA RESPUESTA (Sea éxito o error)
        const data = await res.json();

        if (res.ok) {
            setMensaje(esEdicion ? '¡Alumno actualizado!' : '¡Alumno registrado!');
            setFormAlumno({id: null, dni:'', nombre:'', apellido:'', celular:'', gmail:''});
            setTimeout(() => { setMensaje(''); setView('main'); }, 1500);
        } else {
            // MOSTRAMOS EL MENSAJE DE DUPLICADO
            setMensaje(data.message || 'Error al guardar.');
        }
    } catch(e) { setMensaje('Error de conexión con el servidor.'); }
  };

  const buscarAlumnoEditar = async () => {
      if(!busquedaDni) return;
      try {
          const res = await fetch(`http://localhost:5000/api/alumnos/${busquedaDni}`);
          if(res.ok) {
              const data = await res.json();
              setFormAlumno({
                  id: data.id, dni: data.dni, nombre: data.nombre, 
                  apellido: data.apellido, celular: data.telefono, gmail: data.email
              });
              setView('formAlumno');
          } else setMensaje('Alumno no encontrado.');
      } catch (e) { setMensaje('Error de conexión'); }
  };

  // --- LÓGICA PROFESOR (CON DETECCIÓN DE ERROR) ---
  const handleGuardarProfesor = async () => {
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
      } else {
        setMensaje(data.message || 'Error al guardar.');
      }
    } catch (e) { setMensaje('Error de conexión.'); }
  };

  const buscarProfesor = async () => {
      if(!busquedaDni) return;
      try {
          const res = await fetch(`http://localhost:5000/api/profesores/${busquedaDni}`);
          if(res.ok) {
              const data = await res.json();
              setFormProfesor({ ...data, horarios: data.horarios.length ? data.horarios : [{dia:'', horario:''}] });
              setView('formProfesor');
          } else setMensaje('Profesor no encontrado.');
      } catch (e) { setMensaje('Error conexión'); }
  };

  // --- LÓGICA OTROS ---
  const buscarSocioIngreso = async () => {
    if (!busquedaDni) return;
    try {
        const r = await fetch(`http://localhost:5000/api/alumnos/${busquedaDni}`);
        if(r.ok) {
            setSocioEncontrado(await r.json());
            setMensaje('¡Alumno verificado!');
            setTimeout(() => setMensaje(''), 1500);
        } else {
            setMensaje('DNI no encontrado.');
            setSocioEncontrado(null);
        }
    } catch(e) { setMensaje('Error conexión'); }
  };

  const registrarAsistencia = async () => {
      try {
          const res = await fetch('http://localhost:5000/api/asistencias', {
              method: 'POST', headers: {'Content-Type': 'application/json'},
              body: JSON.stringify({ dni: socioEncontrado.dni, dia: turno.dia, horario: turno.horario })
          });
          if(res.ok) {
              setMensaje(`✅ Ingreso registrado: ${socioEncontrado.nombre}`);
              setTimeout(() => { setMensaje(''); setSocioEncontrado(null); setBusquedaDni(''); setTurno({dia:'', horario:''}); setView('main'); }, 2000);
          }
      } catch (error) { setMensaje('Error al guardar asistencia'); }
  };

  const verListado = async () => {
      if(!filtroListado.dia || !filtroListado.horario) return;
      try {
          const res = await fetch(`http://localhost:5000/api/asistencias/listado?dia=${filtroListado.dia}&horario=${filtroListado.horario}`);
          if(res.ok) setListaAsistencia(await res.json());
      } catch (error) { setMensaje('Error al cargar lista'); }
  };

  // --- VISTAS ---
  return (
    <div className="container">
      <div className="card">
        
        <div className="header">
          <div style={{background:'#2563eb', padding:'10px', borderRadius:'10px', color:'white'}}><Users size={28}/></div>
          <div>
            <h1>Gestión Natatorio</h1>
            <p>Panel de Administración</p>
          </div>
        </div>

        {mensaje && <div className={`alerta ${mensaje.includes('Error') || mensaje.includes('⚠️') || mensaje.includes('No') ? 'error' : 'exito'}`}>{mensaje}</div>}

        {/* MENÚ PRINCIPAL */}
        {view === 'main' && (
          <div className="grid-menu">
            <button className="btn-menu" onClick={() => setView('menuAgregar')}>
              <UserPlus size={32} color="#2563eb"/>
              <span>Registrar Nuevo</span>
            </button>

            <button className="btn-menu" onClick={() => setView('menuEditar')}>
              <Edit size={32} color="#7c3aed"/>
              <span>Editar Datos</span>
            </button>

            <button className="btn-menu" onClick={() => { setView('ingreso'); setBusquedaDni(''); }}>
              <CheckCircle size={32} color="#059669"/>
              <span>Registrar Ingreso</span>
            </button>

            <button className="btn-menu" onClick={() => { setView('listados'); setListaAsistencia([]); setFiltroListado({dia:'', horario:''}); }}>
              <ClipboardList size={32} color="#475569"/>
              <span>Ver Listados</span>
            </button>
          </div>
        )}

        {/* SUB-MENU AGREGAR */}
        {view === 'menuAgregar' && (
            <div>
                <button onClick={() => setView('main')} className="btn-volver"><ArrowLeft size={18}/> Volver al Inicio</button>
                <h2 style={{marginBottom:'20px'}}>¿Qué deseas registrar?</h2>
                <div className="grid-menu" style={{gridTemplateColumns:'1fr 1fr'}}>
                    <button className="btn-menu" onClick={() => { setFormAlumno({id:null, dni:'', nombre:'', apellido:'', celular:'', gmail:''}); setView('formAlumno'); }}>
                        <Users size={32} color="#2563eb"/> 
                        <span>Nuevo Alumno</span>
                    </button>
                    <button className="btn-menu" onClick={() => { setFormProfesor({id:null, nombre:'', apellido:'', dni:'', telefono:'', especialidad:'', horarios:[{dia:'', horario:''}]}); setView('formProfesor'); }}>
                        <GraduationCap size={32} color="#059669"/> 
                        <span>Nuevo Profesor</span>
                    </button>
                </div>
            </div>
        )}

        {/* SUB-MENU EDITAR */}
        {view === 'menuEditar' && (
            <div>
                <button onClick={() => setView('main')} className="btn-volver"><ArrowLeft size={18}/> Volver al Inicio</button>
                <h2 style={{marginBottom:'20px'}}>¿Qué deseas editar?</h2>
                <div className="grid-menu" style={{gridTemplateColumns:'1fr 1fr'}}>
                    <button className="btn-menu" onClick={() => { setView('buscarAlumno'); setBusquedaDni(''); }}>
                        <UserCog size={32} color="#7c3aed"/> 
                        <span>Editar Alumno</span>
                    </button>
                    <button className="btn-menu" onClick={() => { setView('buscarProfe'); setBusquedaDni(''); }}>
                        <Search size={32} color="#d97706"/> 
                        <span>Editar Profesor</span>
                    </button>
                </div>
            </div>
        )}

        {/* FORMULARIO ALUMNO */}
        {view === 'formAlumno' && (
            <div>
                <button onClick={() => setView('menuAgregar')} className="btn-volver"><ArrowLeft size={18}/> Volver</button>
                <h2 style={{marginBottom:'20px'}}>{formAlumno.id ? 'Editar Alumno' : 'Registrar Nuevo Alumno'}</h2>
                
                <input placeholder="Nombre" value={formAlumno.nombre} onChange={e=>setFormAlumno({...formAlumno, nombre:e.target.value})}/>
                <input placeholder="Apellido" value={formAlumno.apellido} onChange={e=>setFormAlumno({...formAlumno, apellido:e.target.value})}/>
                <input placeholder="DNI" value={formAlumno.dni} onChange={e=>setFormAlumno({...formAlumno, dni:e.target.value})}/>
                <input placeholder="Celular" value={formAlumno.celular} onChange={e=>setFormAlumno({...formAlumno, celular:e.target.value})}/>
                <input placeholder="Email" value={formAlumno.gmail} onChange={e=>setFormAlumno({...formAlumno, gmail:e.target.value})}/>
                
                <button onClick={handleGuardarAlumno} className="btn-primary">
                    <Save size={18} style={{marginRight:'5px'}}/> {formAlumno.id ? 'Guardar Cambios' : 'Registrar'}
                </button>
            </div>
        )}

        {/* BUSCAR ALUMNO */}
        {view === 'buscarAlumno' && (
            <div>
                <button onClick={() => setView('menuEditar')} className="btn-volver"><ArrowLeft size={18}/> Volver</button>
                <h2>Editar Alumno</h2>
                <div style={{display:'flex', gap:'10px', marginTop:'15px'}}>
                    <input value={busquedaDni} onChange={e=>setBusquedaDni(e.target.value)} placeholder="Ingrese DNI del Alumno" style={{marginBottom:0}}/>
                    <button onClick={buscarAlumnoEditar} className="btn-primary" style={{marginTop:0, width:'auto'}}>Buscar</button>
                </div>
            </div>
        )}

        {/* FORMULARIO PROFESOR */}
        {view === 'formProfesor' && (
            <div>
                <button onClick={() => setView('menuAgregar')} className="btn-volver"><ArrowLeft size={18}/> Volver</button>
                <h2>{formProfesor.id ? 'Editar Profesor' : 'Nuevo Profesor'}</h2>
                
                <input placeholder="Nombre" value={formProfesor.nombre} onChange={e=>setFormProfesor({...formProfesor, nombre:e.target.value})}/>
                <input placeholder="Apellido" value={formProfesor.apellido} onChange={e=>setFormProfesor({...formProfesor, apellido:e.target.value})}/>
                <input placeholder="DNI" value={formProfesor.dni} onChange={e=>setFormProfesor({...formProfesor, dni:e.target.value})}/>
                <input placeholder="Teléfono" value={formProfesor.telefono} onChange={e=>setFormProfesor({...formProfesor, telefono:e.target.value})}/>
                <input placeholder="Especialidad" value={formProfesor.especialidad} onChange={e=>setFormProfesor({...formProfesor, especialidad:e.target.value})}/>
                
                <div style={{background:'#f8fafc', padding:'15px', borderRadius:'10px', marginTop:'15px', border:'1px solid #e2e8f0'}}>
                    <h4>Horarios</h4>
                    {formProfesor.horarios.map((h, i) => (
                        <div key={i} style={{display:'flex', gap:'10px', marginBottom:'10px'}}>
                            <select value={h.dia} onChange={e => {const n=[...formProfesor.horarios]; n[i].dia=e.target.value; setFormProfesor({...formProfesor, horarios:n})}} style={{marginBottom:0}}>
                                <option value="">Día...</option>{diasSemana.map(d=><option key={d}>{d}</option>)}
                            </select>
                            <select value={h.horario} onChange={e => {const n=[...formProfesor.horarios]; n[i].horario=e.target.value; setFormProfesor({...formProfesor, horarios:n})}} style={{marginBottom:0}}>
                                <option value="">Hora...</option>{listaHoras.map(l=><option key={l}>{l}</option>)}
                            </select>
                            <button onClick={()=>{const n=[...formProfesor.horarios]; n.splice(i,1); setFormProfesor({...formProfesor, horarios:n})}} style={{border:'none', background:'#fee2e2', color:'#b91c1c', borderRadius:'5px', cursor:'pointer'}}><Trash2 size={18}/></button>
                        </div>
                    ))}
                    <button onClick={()=>setFormProfesor({...formProfesor, horarios:[...formProfesor.horarios, {dia:'', horario:''}]})} style={{border:'none', background:'#e2e8f0', padding:'5px 10px', borderRadius:'5px', cursor:'pointer'}}>+ Agregar</button>
                </div>
                <button onClick={handleGuardarProfesor} className="btn-primary">Guardar</button>
            </div>
        )}

        {/* BUSCAR PROFESOR */}
        {view === 'buscarProfe' && (
            <div>
                <button onClick={() => setView('menuEditar')} className="btn-volver"><ArrowLeft size={18}/> Volver</button>
                <h2>Editar Profesor</h2>
                <div style={{display:'flex', gap:'10px', marginTop:'15px'}}>
                    <input value={busquedaDni} onChange={e=>setBusquedaDni(e.target.value)} placeholder="Ingrese DNI del Profesor" style={{marginBottom:0}}/>
                    <button onClick={buscarProfesor} className="btn-primary" style={{marginTop:0, width:'auto'}}>Buscar</button>
                </div>
            </div>
        )}

        {/* INGRESO */}
        {view === 'ingreso' && (
            <div>
                <button onClick={() => setView('main')} className="btn-volver"><ArrowLeft size={18}/> Volver</button>
                <h2>Registrar Ingreso</h2>
                <div style={{display:'flex', gap:'10px', marginTop:'10px'}}>
                    <input value={busquedaDni} onChange={e=>setBusquedaDni(e.target.value)} placeholder="DNI Alumno" style={{marginBottom:0}}/>
                    <button onClick={buscarSocioIngreso} className="btn-primary" style={{marginTop:0, width:'auto'}}>Buscar</button>
                </div>

                {socioEncontrado && (
                    <div style={{marginTop:'20px', padding:'20px', background:'#f0fdf4', borderRadius:'10px', border:'1px solid #bbf7d0'}}>
                        <h3 style={{color:'#166534', margin:0}}>{socioEncontrado.nombre} {socioEncontrado.apellido}</h3>
                        <p style={{color:'#15803d'}}>DNI: {socioEncontrado.dni}</p>
                        
                        <label style={{display:'block', marginTop:'15px', fontWeight:'bold', color:'#14532d'}}>Turno:</label>
                        <div style={{display:'flex', gap:'10px'}}>
                            <select value={turno.dia} onChange={e=>setTurno({...turno, dia:e.target.value, horario:''})} style={{marginBottom:0}}>
                                <option value="">Día...</option>{getDiasDisponibles().map(d=><option key={d} value={d}>{d}</option>)}
                            </select>
                            <select value={turno.horario} onChange={e=>setTurno({...turno, horario:e.target.value})} disabled={!turno.dia} style={{marginBottom:0}}>
                                <option value="">Hora...</option>{getHorasPorDia(turno.dia).map(h=><option key={h} value={h}>{h}</option>)}
                            </select>
                        </div>
                        <button onClick={registrarAsistencia} className="btn-primary" style={{background:'#16a34a'}}>Confirmar Acceso</button>
                    </div>
                )}
            </div>
        )}

        {/* LISTADOS */}
        {view === 'listados' && (
            <div>
                <button onClick={() => setView('main')} className="btn-volver"><ArrowLeft size={18}/> Volver</button>
                <h2>Listado de Asistencia</h2>
                <div style={{display:'flex', gap:'10px', marginTop:'15px', alignItems:'center'}}>
                    <select value={filtroListado.dia} onChange={e=>setFiltroListado({...filtroListado, dia:e.target.value, horario:''})} style={{marginBottom:0}}>
                        <option value="">Día...</option>{getDiasDisponibles().map(d=><option key={d} value={d}>{d}</option>)}
                    </select>
                    <select value={filtroListado.horario} onChange={e=>setFiltroListado({...filtroListado, horario:e.target.value})} disabled={!filtroListado.dia} style={{marginBottom:0}}>
                        <option value="">Hora...</option>{getHorasPorDia(filtroListado.dia).map(h=><option key={h} value={h}>{h}</option>)}
                    </select>
                    <button onClick={verListado} className="btn-primary" style={{marginTop:0, width:'auto'}}>Ver</button>
                </div>

                {listaAsistencia.length > 0 ? (
                    <table>
                        <thead>
                            <tr><th>Fecha</th><th>Nombre</th><th>DNI</th></tr>
                        </thead>
                        <tbody>
                            {listaAsistencia.map((a, i) => (
                                <tr key={i}>
                                    <td>{new Date(a.fecha_registro).toLocaleDateString()}</td>
                                    <td>{a.nombre} {a.apellido}</td>
                                    <td>{a.dni}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : filtroListado.horario && <p style={{textAlign:'center', marginTop:'20px', color:'#64748b'}}>No hay registros.</p>}
            </div>
        )}

      </div>
    </div>
  );
}