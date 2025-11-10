import { useState, useEffect } from 'react';
import FileUploader from './components/FileUploader';
import TraceRouteForm from './components/TraceRouteForm';
import NetworkDiagram from './components/NetworkDiagram';
import HopsTable from './components/HopsTable';
import ResultsSummary from './components/ResultsSummary';
import DataManager from './components/DataManager';
import RoutingTableEditor from './components/RoutingTableEditor';
import { executeTraceroute } from './utils/traceroute';
import { saveRoutingData, loadRoutingData } from './utils/localStorage';

/**
 * App Component - Componente principal
 * Gestiona el estado global de la aplicación:
 * - Tabla de ruteo cargada desde CSV o creada manualmente
 * - Resultado del traceroute
 * - Persistencia en localStorage
 * - Modo de edición para drag & drop
 * - Errores y validaciones
 */
function App() {
  const [routingData, setRoutingData] = useState([]);
  const [traceResult, setTraceResult] = useState(null);
  const [error, setError] = useState(null);
  const [editMode, setEditMode] = useState(false);

  // Cargar datos desde localStorage al montar el componente
  useEffect(() => {
    const storedData = loadRoutingData();
    if (storedData && storedData.length > 0) {
      setRoutingData(storedData);
    }
  }, []);

  // Guardar datos en localStorage cuando cambien
  useEffect(() => {
    if (routingData && routingData.length > 0) {
      saveRoutingData(routingData);
    }
  }, [routingData]);

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

  // Maneja cambios en los datos de ruteo (desde el diagrama editable)
  const handleRoutingDataChange = (newData) => {
    setRoutingData(newData);
  };

  // Maneja la limpieza de datos desde DataManager
  const handleClearData = () => {
    setRoutingData([]);
    setTraceResult(null);
    setError(null);
  };

  // Toggle del modo de edición
  const toggleEditMode = () => {
    setEditMode(!editMode);
    if (!editMode && routingData.length === 0) {
      // Si activamos modo edición sin datos, crear un nodo inicial
      setRoutingData([
        {
          Equipo: 'Equipo1',
          IP_Destino: '0.0.0.0',
          Mascara: '/0',
          Gateway: 'directo'
        }
      ]);
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

            {/* Toggle Modo Edición */}
            <div className="bg-white rounded-lg shadow-md p-4">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <span className="font-medium text-gray-800">Modo Edición</span>
                  <p className="text-sm text-gray-600 mt-1">
                    Activa para crear y editar nodos manualmente
                  </p>
                </div>
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={editMode}
                    onChange={toggleEditMode}
                    className="sr-only"
                  />
                  <div
                    className={`block w-14 h-8 rounded-full transition-colors ${
                      editMode ? 'bg-green-600' : 'bg-gray-300'
                    }`}
                  >
                    <div
                      className={`absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${
                        editMode ? 'translate-x-6' : ''
                      }`}
                    ></div>
                  </div>
                </div>
              </label>
            </div>

            {/* Gestor de Datos */}
            <DataManager
              routingData={routingData}
              onClearData={handleClearData}
            />

            {/* Editor de Tabla de Ruteo */}
            <RoutingTableEditor
              routingData={routingData}
              onUpdate={handleRoutingDataChange}
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
              onRoutingDataChange={handleRoutingDataChange}
              editMode={editMode}
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-blue-900 mb-2">Método 1: Cargar CSV</h4>
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
            </div>
            <div>
              <h4 className="font-semibold text-blue-900 mb-2">Método 2: Crear manualmente (Drag & Drop)</h4>
              <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
                <li>Activa el "Modo Edición" con el toggle</li>
                <li>Haz clic en "+ Nodo" para agregar equipos a la red</li>
                <li>Arrastra desde el borde de un nodo para crear conexiones</li>
                <li>Doble-click en un nodo para renombrarlo</li>
                <li>Los datos se guardan automáticamente en tu navegador</li>
              </ol>
            </div>
          </div>
          <div className="mt-4 text-sm text-blue-700 space-y-2">
            <p>
              💡 <strong>Tip:</strong> Si estás ejecutando el proyecto localmente, puedes encontrar un archivo CSV de ejemplo en{' '}
              <code className="bg-blue-100 px-2 py-1 rounded">
                public/example-routing-table.csv
              </code>
            </p>
            <p>
              📥 O puedes{' '}
              <a
                href="./example-routing-table.csv"
                download="example-routing-table.csv"
                className="font-semibold underline hover:text-blue-900"
              >
                descargar este archivo de ejemplo
              </a>
              {' '}para probarlo.
            </p>
            <p>
              💾 <strong>Persistencia:</strong> Tus datos se guardan automáticamente en el navegador.
              Usa el panel "Gestión de Datos" para exportar a CSV o limpiar el almacenamiento.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
