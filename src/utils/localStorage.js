/**
 * Utilidades para gestión de localStorage
 * Maneja la persistencia de datos de ruteo y configuraciones
 */

const STORAGE_KEY = 'traceroute_routing_data';
const STORAGE_HISTORY_KEY = 'traceroute_data_history';
const MAX_HISTORY_ITEMS = 10;

/**
 * Guarda los datos de ruteo en localStorage
 * @param {Array} data - Array de objetos de ruteo
 * @returns {boolean} - true si se guardó exitosamente
 */
export const saveRoutingData = (data) => {
  try {
    const dataToSave = {
      data,
      timestamp: new Date().toISOString(),
      version: '1.0'
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
    addToHistory(dataToSave);
    return true;
  } catch (error) {
    console.error('Error guardando en localStorage:', error);
    return false;
  }
};

/**
 * Obtiene los datos de ruteo desde localStorage
 * @returns {Array|null} - Array de datos de ruteo o null si no existe
 */
export const loadRoutingData = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;

    const parsed = JSON.parse(stored);
    return parsed.data || null;
  } catch (error) {
    console.error('Error cargando desde localStorage:', error);
    return null;
  }
};

/**
 * Obtiene los metadatos de los datos guardados
 * @returns {Object|null} - Objeto con timestamp y versión
 */
export const getStorageMetadata = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;

    const parsed = JSON.parse(stored);
    return {
      timestamp: parsed.timestamp,
      version: parsed.version,
      itemCount: parsed.data?.length || 0
    };
  } catch (error) {
    console.error('Error obteniendo metadatos:', error);
    return null;
  }
};

/**
 * Limpia todos los datos de localStorage
 * @returns {boolean} - true si se limpió exitosamente
 */
export const clearRoutingData = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
    return true;
  } catch (error) {
    console.error('Error limpiando localStorage:', error);
    return false;
  }
};

/**
 * Agrega datos al historial
 * @param {Object} dataObject - Objeto con data y timestamp
 */
const addToHistory = (dataObject) => {
  try {
    const history = getHistory();
    history.unshift({
      timestamp: dataObject.timestamp,
      itemCount: dataObject.data?.length || 0,
      preview: dataObject.data?.slice(0, 3) || []
    });

    // Mantener solo los últimos MAX_HISTORY_ITEMS
    const trimmedHistory = history.slice(0, MAX_HISTORY_ITEMS);
    localStorage.setItem(STORAGE_HISTORY_KEY, JSON.stringify(trimmedHistory));
  } catch (error) {
    console.error('Error agregando al historial:', error);
  }
};

/**
 * Obtiene el historial de datos guardados
 * @returns {Array} - Array de objetos de historial
 */
export const getHistory = () => {
  try {
    const history = localStorage.getItem(STORAGE_HISTORY_KEY);
    return history ? JSON.parse(history) : [];
  } catch (error) {
    console.error('Error obteniendo historial:', error);
    return [];
  }
};

/**
 * Limpia el historial
 * @returns {boolean} - true si se limpió exitosamente
 */
export const clearHistory = () => {
  try {
    localStorage.removeItem(STORAGE_HISTORY_KEY);
    return true;
  } catch (error) {
    console.error('Error limpiando historial:', error);
    return false;
  }
};

/**
 * Exporta los datos actuales a un archivo CSV
 * @param {Array} data - Array de objetos de ruteo
 * @param {string} filename - Nombre del archivo (opcional)
 */
export const exportToCSV = (data, filename = 'routing-data-export.csv') => {
  if (!data || data.length === 0) {
    console.error('No hay datos para exportar');
    return;
  }

  // Crear encabezados
  const headers = ['Equipo', 'IP_Destino', 'Mascara', 'Gateway'];

  // Crear filas
  const rows = data.map(row => [
    row.Equipo || '',
    row.IP_Destino || '',
    row.Mascara || '',
    row.Gateway || ''
  ]);

  // Combinar encabezados y filas
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');

  // Crear blob y descargar
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Calcula el tamaño usado en localStorage
 * @returns {Object} - Objeto con tamaño usado y total
 */
export const getStorageSize = () => {
  try {
    let totalSize = 0;
    let routingDataSize = 0;

    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        const itemSize = localStorage[key].length + key.length;
        totalSize += itemSize;

        if (key === STORAGE_KEY) {
          routingDataSize = itemSize;
        }
      }
    }

    return {
      totalBytes: totalSize,
      totalKB: (totalSize / 1024).toFixed(2),
      routingDataBytes: routingDataSize,
      routingDataKB: (routingDataSize / 1024).toFixed(2),
      percentageUsed: ((totalSize / (5 * 1024 * 1024)) * 100).toFixed(2) // Asumiendo 5MB de límite
    };
  } catch (error) {
    console.error('Error calculando tamaño de storage:', error);
    return null;
  }
};
