import { useState } from 'react';

/**
 * RoutingTableEditor Component
 * Permite editar las entradas de la tabla de ruteo manualmente
 * Útil para ajustar IPs, máscaras y gateways de las rutas creadas
 */
const RoutingTableEditor = ({ routingData, onUpdate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [editForm, setEditForm] = useState({
    Equipo: '',
    IP_Destino: '',
    Mascara: '',
    Gateway: ''
  });

  const handleEdit = (index) => {
    setEditingIndex(index);
    setEditForm({ ...routingData[index] });
  };

  const handleSave = () => {
    if (editingIndex !== null) {
      const updated = [...routingData];
      updated[editingIndex] = editForm;
      onUpdate(updated);
      setEditingIndex(null);
    }
  };

  const handleCancel = () => {
    setEditingIndex(null);
    setEditForm({
      Equipo: '',
      IP_Destino: '',
      Mascara: '',
      Gateway: ''
    });
  };

  const handleDelete = (index) => {
    if (confirm('¿Eliminar esta entrada de la tabla de ruteo?')) {
      const updated = routingData.filter((_, i) => i !== index);
      onUpdate(updated);
    }
  };

  const handleAddNew = () => {
    const newEntry = {
      Equipo: prompt('Nombre del equipo:') || 'NuevoEquipo',
      IP_Destino: prompt('IP Destino (ej: 192.168.1.0):') || '0.0.0.0',
      Mascara: prompt('Máscara (ej: /24):') || '/0',
      Gateway: prompt('Gateway (ej: 192.168.1.1 o "directo"):') || 'directo'
    };
    onUpdate([...routingData, newEntry]);
  };

  if (!routingData || routingData.length === 0) {
    return null;
  }

  return (
    <div className="w-full">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-between"
      >
        <span className="font-medium">Editor de Tabla de Ruteo</span>
        <svg
          className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="mt-3 bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold text-gray-800">
              Entradas de Ruteo ({routingData.length})
            </h3>
            <button
              onClick={handleAddNew}
              className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
            >
              + Agregar
            </button>
          </div>

          <div className="max-h-96 overflow-y-auto">
            <div className="space-y-2">
              {routingData.map((route, index) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded p-3 bg-gray-50"
                >
                  {editingIndex === index ? (
                    // Modo edición
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs text-gray-600">Equipo</label>
                          <input
                            type="text"
                            value={editForm.Equipo}
                            onChange={(e) => setEditForm({ ...editForm, Equipo: e.target.value })}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-600">IP Destino</label>
                          <input
                            type="text"
                            value={editForm.IP_Destino}
                            onChange={(e) => setEditForm({ ...editForm, IP_Destino: e.target.value })}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-600">Máscara</label>
                          <input
                            type="text"
                            value={editForm.Mascara}
                            onChange={(e) => setEditForm({ ...editForm, Mascara: e.target.value })}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-600">Gateway</label>
                          <input
                            type="text"
                            value={editForm.Gateway}
                            onChange={(e) => setEditForm({ ...editForm, Gateway: e.target.value })}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={handleSave}
                          className="flex-1 px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                        >
                          Guardar
                        </button>
                        <button
                          onClick={handleCancel}
                          className="flex-1 px-3 py-1 bg-gray-400 text-white text-sm rounded hover:bg-gray-500"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    // Modo vista
                    <div>
                      <div className="grid grid-cols-2 gap-2 text-sm mb-2">
                        <div>
                          <span className="text-gray-600 font-medium">Equipo:</span>{' '}
                          <span className="text-gray-800">{route.Equipo}</span>
                        </div>
                        <div>
                          <span className="text-gray-600 font-medium">IP:</span>{' '}
                          <span className="text-gray-800">{route.IP_Destino}</span>
                        </div>
                        <div>
                          <span className="text-gray-600 font-medium">Máscara:</span>{' '}
                          <span className="text-gray-800">{route.Mascara}</span>
                        </div>
                        <div>
                          <span className="text-gray-600 font-medium">Gateway:</span>{' '}
                          <span className="text-gray-800">{route.Gateway}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(index)}
                          className="flex-1 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(index)}
                          className="flex-1 px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
            <strong>Nota:</strong> Edita los valores de IP, máscara y gateway según tu topología de red.
            Los cambios se guardan automáticamente.
          </div>
        </div>
      )}
    </div>
  );
};

export default RoutingTableEditor;
