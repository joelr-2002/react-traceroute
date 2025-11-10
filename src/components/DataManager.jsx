import { useState, useEffect } from 'react';
import {
  getStorageMetadata,
  clearRoutingData,
  exportToCSV,
  getHistory,
  clearHistory,
  getStorageSize,
} from '../utils/localStorage';

/**
 * DataManager Component
 * Gestiona los datos guardados en localStorage
 * Permite ver, exportar y limpiar datos almacenados
 */
const DataManager = ({ routingData, onClearData, onExportData }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [metadata, setMetadata] = useState(null);
  const [history, setHistory] = useState([]);
  const [storageSize, setStorageSize] = useState(null);

  // Actualizar información cuando se abre el panel
  useEffect(() => {
    if (isOpen) {
      updateInfo();
    }
  }, [isOpen, routingData]);

  const updateInfo = () => {
    setMetadata(getStorageMetadata());
    setHistory(getHistory());
    setStorageSize(getStorageSize());
  };

  const handleClearData = () => {
    if (confirm('¿Estás seguro de que quieres eliminar todos los datos guardados?')) {
      const success = clearRoutingData();
      if (success) {
        onClearData();
        updateInfo();
        alert('Datos eliminados correctamente');
      } else {
        alert('Error al eliminar los datos');
      }
    }
  };

  const handleClearHistory = () => {
    if (confirm('¿Limpiar el historial de cambios?')) {
      const success = clearHistory();
      if (success) {
        updateInfo();
        alert('Historial limpiado');
      }
    }
  };

  const handleExport = () => {
    if (routingData && routingData.length > 0) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      exportToCSV(routingData, `routing-data-${timestamp}.csv`);
    } else {
      alert('No hay datos para exportar');
    }
  };

  const formatDate = (isoString) => {
    if (!isoString) return 'N/A';
    const date = new Date(isoString);
    return date.toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="w-full">
      {/* Botón para abrir/cerrar el panel */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-between"
      >
        <span className="font-medium">Gestión de Datos</span>
        <svg
          className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Panel expandible */}
      {isOpen && (
        <div className="mt-3 bg-white border border-gray-200 rounded-lg p-4 space-y-4">
          {/* Información de almacenamiento */}
          <div className="border-b pb-3">
            <h3 className="font-semibold text-gray-800 mb-2">Almacenamiento</h3>
            {metadata ? (
              <div className="text-sm text-gray-600 space-y-1">
                <p>
                  <strong>Última actualización:</strong> {formatDate(metadata.timestamp)}
                </p>
                <p>
                  <strong>Registros actuales:</strong> {metadata.itemCount}
                </p>
                {storageSize && (
                  <>
                    <p>
                      <strong>Tamaño datos de ruteo:</strong> {storageSize.routingDataKB} KB
                    </p>
                    <p>
                      <strong>Tamaño total localStorage:</strong> {storageSize.totalKB} KB ({storageSize.percentageUsed}% usado)
                    </p>
                  </>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No hay datos guardados</p>
            )}
          </div>

          {/* Historial */}
          <div className="border-b pb-3">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-semibold text-gray-800">Historial</h3>
              {history.length > 0 && (
                <button
                  onClick={handleClearHistory}
                  className="text-xs text-red-600 hover:text-red-800"
                >
                  Limpiar
                </button>
              )}
            </div>
            {history.length > 0 ? (
              <div className="max-h-40 overflow-y-auto space-y-2">
                {history.map((item, index) => (
                  <div
                    key={index}
                    className="text-sm bg-gray-50 p-2 rounded border border-gray-200"
                  >
                    <div className="flex justify-between">
                      <span className="text-gray-700">{item.itemCount} registros</span>
                      <span className="text-gray-500 text-xs">{formatDate(item.timestamp)}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">Sin historial</p>
            )}
          </div>

          {/* Acciones */}
          <div className="space-y-2">
            <h3 className="font-semibold text-gray-800 mb-2">Acciones</h3>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleExport}
                disabled={!routingData || routingData.length === 0}
                className="px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Exportar CSV
              </button>
              <button
                onClick={handleClearData}
                disabled={!metadata}
                className="px-3 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Limpiar Todo
              </button>
            </div>
          </div>

          {/* Información adicional */}
          <div className="bg-blue-50 border border-blue-200 rounded p-3">
            <p className="text-xs text-blue-800">
              <strong>Nota:</strong> Los datos se guardan automáticamente en tu navegador. Puedes
              exportarlos a CSV en cualquier momento. El historial mantiene un registro de las
              últimas 10 modificaciones.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataManager;
