import { useState } from 'react';

/**
 * TraceRouteForm Component
 * Formulario para ingresar IP origen, IP destino y equipo origen
 * Ejecuta el traceroute al presionar el botón
 */
const TraceRouteForm = ({ onExecute, disabled, equipos }) => {
  const [sourceEquipment, setSourceEquipment] = useState('');
  const [sourceIP, setSourceIP] = useState('');
  const [destIP, setDestIP] = useState('');
  const [errors, setErrors] = useState({});

  // Validación básica de formato IP
  const validateIP = (ip) => {
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipRegex.test(ip)) return false;

    const parts = ip.split('.');
    return parts.every(part => {
      const num = parseInt(part, 10);
      return num >= 0 && num <= 255;
    });
  };

  // Maneja el submit del formulario
  const handleSubmit = (e) => {
    e.preventDefault();

    const newErrors = {};

    if (!sourceEquipment) {
      newErrors.sourceEquipment = 'Selecciona un equipo origen';
    }

    if (!sourceIP) {
      newErrors.sourceIP = 'Ingresa la IP origen';
    } else if (!validateIP(sourceIP)) {
      newErrors.sourceIP = 'Formato de IP inválido';
    }

    if (!destIP) {
      newErrors.destIP = 'Ingresa la IP destino';
    } else if (!validateIP(destIP)) {
      newErrors.destIP = 'Formato de IP inválido';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    onExecute({ sourceEquipment, sourceIP, destIP });
  };

  // Extrae lista única de equipos
  const uniqueEquipos = equipos ? [...new Set(equipos.map(e => e.Equipo))] : [];

  return (
    <div className="w-full bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">
        Configuración de Traceroute
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Selección de equipo origen */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Equipo Origen
          </label>
          <select
            value={sourceEquipment}
            onChange={(e) => setSourceEquipment(e.target.value)}
            disabled={disabled || uniqueEquipos.length === 0}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            <option value="">Selecciona un equipo...</option>
            {uniqueEquipos.map((equipo) => (
              <option key={equipo} value={equipo}>
                {equipo}
              </option>
            ))}
          </select>
          {errors.sourceEquipment && (
            <p className="text-red-500 text-xs mt-1">{errors.sourceEquipment}</p>
          )}
        </div>

        {/* IP Origen */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            IP Origen
          </label>
          <input
            type="text"
            value={sourceIP}
            onChange={(e) => setSourceIP(e.target.value)}
            placeholder="192.168.1.1"
            disabled={disabled}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
          {errors.sourceIP && (
            <p className="text-red-500 text-xs mt-1">{errors.sourceIP}</p>
          )}
        </div>

        {/* IP Destino */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            IP Destino
          </label>
          <input
            type="text"
            value={destIP}
            onChange={(e) => setDestIP(e.target.value)}
            placeholder="192.168.2.1"
            disabled={disabled}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
          {errors.destIP && (
            <p className="text-red-500 text-xs mt-1">{errors.destIP}</p>
          )}
        </div>

        {/* Botón de ejecutar */}
        <button
          type="submit"
          disabled={disabled || uniqueEquipos.length === 0}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {disabled ? 'Carga un archivo CSV primero' : 'Ejecutar Traceroute'}
        </button>
      </form>
    </div>
  );
};

export default TraceRouteForm;
