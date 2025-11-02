/**
 * ResultsSummary Component
 * Muestra un resumen de los resultados del traceroute
 * Incluye: total de saltos, tiempo simulado, y estado (exitoso/error)
 */
const ResultsSummary = ({ result }) => {
  if (!result) {
    return null;
  }

  const { success, hops, error, sourceIP, destIP, sourceEquipment } = result;

  // Simular tiempo basado en número de saltos (10ms por salto)
  const simulatedTime = hops ? hops.length * 10 : 0;

  return (
    <div className="w-full bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">
        Resumen del Traceroute
      </h2>

      {/* Información de origen y destino */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-xs text-gray-500 uppercase font-medium mb-1">
            Equipo Origen
          </p>
          <p className="text-lg font-semibold text-gray-900">
            {sourceEquipment}
          </p>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-xs text-gray-500 uppercase font-medium mb-1">
            IP Origen
          </p>
          <p className="text-lg font-semibold text-gray-900">
            {sourceIP}
          </p>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-xs text-gray-500 uppercase font-medium mb-1">
            IP Destino
          </p>
          <p className="text-lg font-semibold text-gray-900">
            {destIP}
          </p>
        </div>
      </div>

      {/* Estado del resultado */}
      {success ? (
        <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-4">
          <div className="flex items-center">
            <svg
              className="w-6 h-6 text-green-400 mr-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <p className="text-sm font-medium text-green-800">
                Ruta encontrada exitosamente
              </p>
              <p className="text-xs text-green-700 mt-1">
                El paquete llegó al destino a través de {hops.length} salto(s)
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
          <div className="flex items-center">
            <svg
              className="w-6 h-6 text-red-400 mr-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <p className="text-sm font-medium text-red-800">
                Error en el traceroute
              </p>
              <p className="text-xs text-red-700 mt-1">
                {error}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Estadísticas */}
      {success && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-xs text-blue-600 uppercase font-medium mb-1">
              Total de Saltos
            </p>
            <p className="text-3xl font-bold text-blue-900">
              {hops.length}
            </p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <p className="text-xs text-purple-600 uppercase font-medium mb-1">
              Tiempo Simulado
            </p>
            <p className="text-3xl font-bold text-purple-900">
              {simulatedTime} ms
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResultsSummary;
