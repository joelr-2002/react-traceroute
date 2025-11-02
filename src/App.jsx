import { useState } from 'react';
import FileUploader from './components/FileUploader';
import TraceRouteForm from './components/TraceRouteForm';
import NetworkDiagram from './components/NetworkDiagram';
import HopsTable from './components/HopsTable';
import ResultsSummary from './components/ResultsSummary';
import { executeTraceroute } from './utils/traceroute';

/**
 * App Component - Componente principal
 * Gestiona el estado global de la aplicación:
 * - Tabla de ruteo cargada desde CSV
 * - Resultado del traceroute
 * - Errores y validaciones
 */
function App() {
  const [routingData, setRoutingData] = useState([]);
  const [traceResult, setTraceResult] = useState(null);
  const [error, setError] = useState(null);

  // Maneja la carga de datos desde el CSV
  const handleDataLoaded = (data) => {
    // Clonar el array para asegurar que React detecte el cambio
    const clonedData = [...data];

    setTimeout(() => {
      setRoutingData(clonedData);
      setTraceResult(null);
      setError(null);
    }, 0);
  };

  // Maneja errores del FileUploader
  const handleFileError = (errorMessage) => {
    setError(errorMessage);
    setRoutingData([]);
    setTraceResult(null);
  };

  // Ejecuta el traceroute cuando el usuario presiona el botón
  const handleExecuteTraceroute = ({ sourceEquipment, sourceIP, destIP }) => {
    try {
      const result = executeTraceroute(
        sourceEquipment,
        sourceIP,
        destIP,
        routingData
      );
      setTraceResult(result);
      setError(result.success ? null : result.error);
    } catch (err) {
      setError(`Error inesperado: ${err.message}`);
      setTraceResult(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Simulador de Traceroute
          </h1>
          <p className="text-gray-600">
            Visualiza el recorrido de paquetes a través de tablas de ruteo estáticas
          </p>
        </div>

        {/* Mensaje de error global */}
        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4 rounded">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Layout principal - Grid de 2 columnas */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Columna izquierda - Controles */}
          <div className="lg:col-span-1 space-y-6">
            {/* File Uploader */}
            <FileUploader
              onDataLoaded={handleDataLoaded}
              onError={handleFileError}
            />

            {/* Formulario de Traceroute */}
            <TraceRouteForm
              onExecute={handleExecuteTraceroute}
              disabled={routingData.length === 0}
              equipos={routingData}
            />

            {/* Resumen de resultados */}
            {traceResult && <ResultsSummary result={traceResult} />}
          </div>

          {/* Columna derecha - Visualización */}
          <div className="lg:col-span-2 space-y-6">
            {/* Diagrama de red */}
            <NetworkDiagram
              routingData={routingData}
              traceResult={traceResult}
            />

            {/* Tabla de saltos */}
            {traceResult?.success && <HopsTable hops={traceResult.hops} />}
          </div>
        </div>

        {/* Footer con instrucciones */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            📘 Instrucciones de uso
          </h3>
          <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
            <li>
              Carga un archivo CSV con las tablas de ruteo (formato: Equipo,
              IP_Destino, Mascara, Gateway)
            </li>
            <li>Selecciona el equipo origen desde el cual iniciar el traceroute</li>
            <li>Ingresa la IP origen (puede ser cualquier IP dentro de la red del equipo)</li>
            <li>Ingresa la IP destino que deseas alcanzar</li>
            <li>
              Presiona "Ejecutar Traceroute" para ver la ruta y el diagrama de
              red
            </li>
          </ol>
          <div className="mt-4 text-sm text-blue-700">
            <p>
              💡 <strong>Tip:</strong> Puedes encontrar un archivo CSV de ejemplo en{' '}
              <code className="bg-blue-100 px-2 py-1 rounded">
                public/example-routing-table.csv
              </code>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
