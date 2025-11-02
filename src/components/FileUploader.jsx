import { useState } from 'react';
import Papa from 'papaparse';

/**
 * FileUploader Component
 * Permite al usuario cargar un archivo CSV con las tablas de ruteo
 * Valida el formato del CSV y parsea los datos
 */
const FileUploader = ({ onDataLoaded, onError }) => {
  const [fileName, setFileName] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  // Valida que el CSV tenga las columnas requeridas
  const validateCSVStructure = (data) => {
    if (!data || data.length === 0) {
      throw new Error('El archivo CSV está vacío');
    }

    const requiredColumns = ['Equipo', 'IP_Destino', 'Mascara', 'Gateway'];
    const headers = Object.keys(data[0]);

    const missingColumns = requiredColumns.filter(col => !headers.includes(col));
    if (missingColumns.length > 0) {
      throw new Error(`Columnas faltantes en el CSV: ${missingColumns.join(', ')}`);
    }

    return true;
  };

  // Limpia y filtra datos del CSV
  const cleanCSVData = (data) => {
    return data.filter(row => {
      // Filtrar filas vacías o con datos incompletos
      return row.Equipo &&
             row.IP_Destino &&
             row.Mascara &&
             row.Gateway &&
             row.Equipo.trim() !== '' &&
             row.IP_Destino.trim() !== '' &&
             row.Mascara.trim() !== '' &&
             row.Gateway.trim() !== '';
    });
  };

  // Procesa el archivo CSV
  const processFile = (file) => {
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      onError('Por favor, selecciona un archivo CSV válido');
      return;
    }

    setFileName(file.name);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          validateCSVStructure(results.data);
          const cleanedData = cleanCSVData(results.data);

          if (cleanedData.length === 0) {
            throw new Error('No se encontraron filas válidas en el CSV');
          }

          onDataLoaded(cleanedData);
          onError(null);
        } catch (error) {
          onError(error.message);
          setFileName('');
        }
      },
      error: (error) => {
        onError(`Error al procesar el archivo: ${error.message}`);
        setFileName('');
      }
    });
  };

  // Manejo de selección de archivo
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    processFile(file);
  };

  // Manejo de drag & drop
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    processFile(file);
  };

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Cargar Tabla de Ruteo (CSV)
      </label>
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          isDragging
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 bg-white hover:border-gray-400'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          className="hidden"
          id="csv-upload"
        />
        <label
          htmlFor="csv-upload"
          className="cursor-pointer flex flex-col items-center"
        >
          <svg
            className="w-12 h-12 text-gray-400 mb-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
          {fileName ? (
            <p className="text-sm text-gray-700 font-medium">{fileName}</p>
          ) : (
            <>
              <p className="text-sm text-gray-700 mb-1">
                Arrastra un archivo CSV aquí o haz clic para seleccionar
              </p>
              <p className="text-xs text-gray-500">
                Formato: Equipo, IP_Destino, Mascara, Gateway
              </p>
            </>
          )}
        </label>
      </div>
    </div>
  );
};

export default FileUploader;
