import React, { useState } from 'react';
import { Users, Search, UserPlus, GraduationCap } from 'lucide-react';

export default function NatatorioApp() {
  const [view, setView] = useState('main');
  const [personas, setPersonas] = useState([]);
  const [asistencias, setAsistencias] = useState([]);
  const [mensaje, setMensaje] = useState('');

  const [formAlumno, setFormAlumno] = useState({
    dni: '',
    nombre: '',
    apellido: '',
    edad: '',
    celular: '',
    facebook: '',
    gmail: '',
    turno: { dia: '', horario: '' }
  });

  const [formProfesor, setFormProfesor] = useState({
    nombre: '',
    apellido: '',
    dni: '',
    telefono: '',
    horarios: [{ dia: '', horario: '' }]
  });

  const [busquedaDni, setBusquedaDni] = useState('');
  const [socioEncontrado, setSocioEncontrado] = useState(null);
  const [turnoAsistencia, setTurnoAsistencia] = useState({ dia: '', horario: '' });

  const generarNumeroUnico = () => {
    return 'TMP-' + Math.floor(Math.random() * 1000000);
  };

  const handleInscribirAlumno = (e) => {
    e.preventDefault();
    const dniFinal = formAlumno.dni.trim() === '' ? generarNumeroUnico() : formAlumno.dni;
    
    const nuevoAlumno = {
      ...formAlumno,
      dni: dniFinal,
      tipo: 'alumno',
      id: Date.now()
    };

    setPersonas([...personas, nuevoAlumno]);
    setMensaje(¡Alumno ${formAlumno.nombre} ${formAlumno.apellido} inscrito exitosamente!);
    
    setFormAlumno({
      dni: '',
      nombre: '',
      apellido: '',
      edad: '',
      celular: '',
      facebook: '',
      gmail: '',
      turno: { dia: '', horario: '' }
    });

    setTimeout(() => {
      setMensaje('');
      setView('main');
    }, 2000);
  };

  const handleInscribirProfesor = (e) => {
    e.preventDefault();
    
    const nuevoProfesor = {
      ...formProfesor,
      tipo: 'profesor',
      id: Date.now()
    };

    setPersonas([...personas, nuevoProfesor]);
    setMensaje(¡Profesor ${formProfesor.nombre} ${formProfesor.apellido} inscrito exitosamente!);
    
    setFormProfesor({
      nombre: '',
      apellido: '',
      dni: '',
      telefono: '',
      horarios: [{ dia: '', horario: '' }]
    });

    setTimeout(() => {
      setMensaje('');
      setView('main');
    }, 2000);
  };

  const buscarSocio = () => {
    const socio = personas.find(p => p.dni === busquedaDni && p.tipo === 'alumno');
    if (socio) {
      setSocioEncontrado(socio);
      setMensaje('');
    } else {
      setSocioEncontrado(null);
      setMensaje('No se encontró ningún socio con ese DNI');
    }
  };

  const registrarAsistencia = () => {
    if (!turnoAsistencia.dia || !turnoAsistencia.horario) {
      setMensaje('Por favor complete día y horario');
      return;
    }

    const nuevaAsistencia = {
      dni: socioEncontrado.dni,
      nombre: ${socioEncontrado.nombre} ${socioEncontrado.apellido},
      dia: turnoAsistencia.dia,
      horario: turnoAsistencia.horario,
      fecha: new Date().toLocaleDateString(),
      id: Date.now()
    };

    setAsistencias([...asistencias, nuevaAsistencia]);
    setMensaje('¡Asistencia registrada exitosamente!');
    
    setTimeout(() => {
      setMensaje('');
      setSocioEncontrado(null);
      setBusquedaDni('');
      setTurnoAsistencia({ dia: '', horario: '' });
      setView('main');
    }, 2000);
  };

  const agregarHorarioProfesor = () => {
    setFormProfesor({
      ...formProfesor,
      horarios: [...formProfesor.horarios, { dia: '', horario: '' }]
    });
  };

  const actualizarHorarioProfesor = (index, campo, valor) => {
    const nuevosHorarios = [...formProfesor.horarios];
    nuevosHorarios[index][campo] = valor;
    setFormProfesor({ ...formProfesor, horarios: nuevosHorarios });
  };

  const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
  const horarios = ['08:00', '09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-xl p-6 mb-4">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-blue-500 p-3 rounded-full">
              <Users className="text-white" size={32} />
            </div>
            <h1 className="text-3xl font-bold text-gray-800">Sistema de Gestión - Natatorio</h1>
          </div>

          {mensaje && (
            <div className={mb-4 p-4 rounded-lg ${mensaje.includes('exitosamente') ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}}>
              {mensaje}
            </div>
          )}

          {view === 'main' && (
            <div className="grid md:grid-cols-2 gap-4">
              <button
                onClick={() => setView('inscribir')}
                className="bg-blue-500 hover:bg-blue-600 text-white p-8 rounded-lg flex flex-col items-center gap-3 transition-all transform hover:scale-105"
              >
                <UserPlus size={48} />
                <span className="text-xl font-semibold">Inscribir Persona</span>
              </button>
              
              <button
                onClick={() => setView('buscar')}
                className="bg-cyan-500 hover:bg-cyan-600 text-white p-8 rounded-lg flex flex-col items-center gap-3 transition-all transform hover:scale-105"
              >
                <Search size={48} />
                <span className="text-xl font-semibold">Buscar Socio</span>
              </button>
            </div>
          )}

          {view === 'inscribir' && (
            <div>
              <button
                onClick={() => setView('main')}
                className="mb-4 text-blue-600 hover:text-blue-800"
              >
                ← Volver
              </button>
              
              <div className="grid md:grid-cols-2 gap-4">
                <button
                  onClick={() => setView('inscribirAlumno')}
                  className="bg-green-500 hover:bg-green-600 text-white p-6 rounded-lg flex flex-col items-center gap-3"
                >
                  <Users size={40} />
                  <span className="text-lg font-semibold">Inscribir Alumno</span>
                </button>
                
                <button
                  onClick={() => setView('inscribirProfesor')}
                  className="bg-purple-500 hover:bg-purple-600 text-white p-6 rounded-lg flex flex-col items-center gap-3"
                >
                  <GraduationCap size={40} />
                  <span className="text-lg font-semibold">Inscribir Profesor</span>
                </button>
              </div>
            </div>
          )}

          {view === 'inscribirAlumno' && (
            <div>
              <button
                onClick={() => setView('inscribir')}
                className="mb-4 text-blue-600 hover:text-blue-800"
              >
                ← Volver
              </button>
              
              <h2 className="text-2xl font-bold mb-4 text-gray-800">Inscribir Alumno</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    DNI (dejar vacío para generar número automático)
                  </label>
                  <input
                    type="text"
                    value={formAlumno.dni}
                    onChange={(e) => setFormAlumno({ ...formAlumno, dni: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre *
                    </label>
                    <input
                      type="text"
                      required
                      value={formAlumno.nombre}
                      onChange={(e) => setFormAlumno({ ...formAlumno, nombre: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Apellido *
                    </label>
                    <input
                      type="text"
                      required
                      value={formAlumno.apellido}
                      onChange={(e) => setFormAlumno({ ...formAlumno, apellido: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Edad *
                    </label>
                    <input
                      type="number"
                      required
                      value={formAlumno.edad}
                      onChange={(e) => setFormAlumno({ ...formAlumno, edad: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Celular *
                    </label>
                    <input
                      type="tel"
                      required
                      value={formAlumno.celular}
                      onChange={(e) => setFormAlumno({ ...formAlumno, celular: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Facebook (opcional)
                  </label>
                  <input
                    type="text"
                    value={formAlumno.facebook}
                    onChange={(e) => setFormAlumno({ ...formAlumno, facebook: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Gmail (opcional)
                  </label>
                  <input
                    type="email"
                    value={formAlumno.gmail}
                    onChange={(e) => setFormAlumno({ ...formAlumno, gmail: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-3 text-gray-800">Turno Asignado</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Día *
                      </label>
                      <select
                        required
                        value={formAlumno.turno.dia}
                        onChange={(e) => setFormAlumno({ ...formAlumno, turno: { ...formAlumno.turno, dia: e.target.value } })}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Seleccionar día</option>
                        {diasSemana.map(dia => (
                          <option key={dia} value={dia}>{dia}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Horario *
                      </label>
                      <select
                        required
                        value={formAlumno.turno.horario}
                        onChange={(e) => setFormAlumno({ ...formAlumno, turno: { ...formAlumno.turno, horario: e.target.value } })}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Seleccionar horario</option>
                        {horarios.map(h => (
                          <option key={h} value={h}>{h}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleInscribirAlumno}
                  className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-lg transition-colors"
                >
                  Inscribir Alumno
                </button>
              </div>
            </div>
          )}

          {view === 'inscribirProfesor' && (
            <div>
              <button
                onClick={() => setView('inscribir')}
                className="mb-4 text-blue-600 hover:text-blue-800"
              >
                ← Volver
              </button>
              
              <h2 className="text-2xl font-bold mb-4 text-gray-800">Inscribir Profesor</h2>
              
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre *
                    </label>
                    <input
                      type="text"
                      required
                      value={formProfesor.nombre}
                      onChange={(e) => setFormProfesor({ ...formProfesor, nombre: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Apellido *
                    </label>
                    <input
                      type="text"
                      required
                      value={formProfesor.apellido}
                      onChange={(e) => setFormProfesor({ ...formProfesor, apellido: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      DNI *
                    </label>
                    <input
                      type="text"
                      required
                      value={formProfesor.dni}
                      onChange={(e) => setFormProfesor({ ...formProfesor, dni: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Teléfono *
                    </label>
                    <input
                      type="tel"
                      required
                      value={formProfesor.telefono}
                      onChange={(e) => setFormProfesor({ ...formProfesor, telefono: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-semibold text-gray-800">Horarios de Clases</h3>
                    <button
                      type="button"
                      onClick={agregarHorarioProfesor}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
                    >
                      + Agregar horario
                    </button>
                  </div>
                  
                  {formProfesor.horarios.map((horario, index) => (
                    <div key={index} className="grid md:grid-cols-2 gap-4 mb-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Día *
                        </label>
                        <select
                          required
                          value={horario.dia}
                          onChange={(e) => actualizarHorarioProfesor(index, 'dia', e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">Seleccionar día</option>
                          {diasSemana.map(dia => (
                            <option key={dia} value={dia}>{dia}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Horario *
                        </label>
                        <select
                          required
                          value={horario.horario}
                          onChange={(e) => actualizarHorarioProfesor(index, 'horario', e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">Seleccionar horario</option>
                          {horarios.map(h => (
                            <option key={h} value={h}>{h}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={handleInscribirProfesor}
                  className="w-full bg-purple-500 hover:bg-purple-600 text-white font-semibold py-3 rounded-lg transition-colors"
                >
                  Inscribir Profesor
                </button>
              </div>
            </div>
          )}

          {view === 'buscar' && (
            <div>
              <button
                onClick={() => setView('main')}
                className="mb-4 text-blue-600 hover:text-blue-800"
              >
                ← Volver
              </button>
              
              <h2 className="text-2xl font-bold mb-4 text-gray-800">Buscar Socio y Registrar Asistencia</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    DNI del Socio
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={busquedaDni}
                      onChange={(e) => setBusquedaDni(e.target.value)}
                      className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Ingrese DNI"
                    />
                    <button
                      onClick={buscarSocio}
                      className="bg-cyan-500 hover:bg-cyan-600 text-white px-6 py-2 rounded-lg font-semibold"
                    >
                      Buscar
                    </button>
                  </div>
                </div>

                {socioEncontrado && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h3 className="font-semibold text-lg mb-2 text-green-800">Socio Encontrado</h3>
                    <div className="grid md:grid-cols-2 gap-2 text-sm">
                      <p><span className="font-medium">Nombre:</span> {socioEncontrado.nombre} {socioEncontrado.apellido}</p>
                      <p><span className="font-medium">DNI:</span> {socioEncontrado.dni}</p>
                      <p><span className="font-medium">Edad:</span> {socioEncontrado.edad}</p>
                      <p><span className="font-medium">Celular:</span> {socioEncontrado.celular}</p>
                      <p><span className="font-medium">Turno asignado:</span> {socioEncontrado.turno.dia} - {socioEncontrado.turno.horario}</p>
                    </div>

                    <div className="mt-4 bg-white p-4 rounded-lg">
                      <h4 className="font-semibold mb-3 text-gray-800">Registrar Asistencia</h4>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Día *
                          </label>
                          <select
                            value={turnoAsistencia.dia}
                            onChange={(e) => setTurnoAsistencia({ ...turnoAsistencia, dia: e.target.value })}
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="">Seleccionar día</option>
                            {diasSemana.map(dia => (
                              <option key={dia} value={dia}>{dia}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Horario *
                          </label>
                          <select
                            value={turnoAsistencia.horario}
                            onChange={(e) => setTurnoAsistencia({ ...turnoAsistencia, horario: e.target.value })}
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="">Seleccionar horario</option>
                            {horarios.map(h => (
                              <option key={h} value={h}>{h}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <button
                        onClick={registrarAsistencia}
                        className="w-full mt-4 bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-lg transition-colors"
                      >
                        Registrar Asistencia
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {personas.length > 0 && view === 'main' && (
          <div className="bg-white rounded-lg shadow-xl p-6 mb-4">
            <h2 className="text-xl font-bold mb-4 text-gray-800">Personas Inscritas ({personas.length})</h2>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {personas.map(p => (
                <div key={p.id} className={p-3 rounded-lg ${p.tipo === 'alumno' ? 'bg-green-50' : 'bg-purple-50'}}>
                  <span className="font-semibold">{p.nombre} {p.apellido}</span>
                  <span className="ml-2 text-sm text-gray-600">({p.tipo === 'alumno' ? 'Alumno' : 'Profesor'})</span>
                  <span className="ml-2 text-sm text-gray-500">DNI: {p.dni}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {asistencias.length > 0 && view === 'main' && (
          <div className="bg-white rounded-lg shadow-xl p-6">
            <h2 className="text-xl font-bold mb-4 text-gray-800">Últimas Asistencias ({asistencias.length})</h2>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {asistencias.slice(-10).reverse().map(a => (
                <div key={a.id} className="p-3 bg-blue-50 rounded-lg">
                  <span className="font-semibold">{a.nombre}</span>
                  <span className="ml-2 text-sm text-gray-600">- {a.dia} {a.horario}</span>
                  <span className="ml-2 text-xs text-gray-500">({a.fecha})</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}