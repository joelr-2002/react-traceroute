import { useEffect, useState, useCallback } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';

/**
 * NetworkDiagram Component
 * Visualiza la topología de red usando ReactFlow
 * Muestra equipos como nodos y conexiones como edges
 * Resalta la ruta del traceroute cuando está disponible
 * Permite agregar nodos y conexiones manualmente
 */
const NetworkDiagram = ({ routingData, traceResult, onRoutingDataChange, editMode = false }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [editingNode, setEditingNode] = useState(null);
  const [showNodeDialog, setShowNodeDialog] = useState(false);

  useEffect(() => {
    if (!routingData || routingData.length === 0) {
      setNodes([]);
      setEdges([]);
      return;
    }

    // Crear nodos para cada equipo único
    const equipos = [...new Set(routingData.map(r => r.Equipo))];
    const newNodes = equipos.map((equipo, index) => {
      // Distribuir nodos en círculo
      const angle = (index / equipos.length) * 2 * Math.PI;
      const radius = 250;
      const x = 400 + radius * Math.cos(angle);
      const y = 300 + radius * Math.sin(angle);

      // Verificar si este nodo está en la ruta
      const isInPath = traceResult?.hops?.some(
        hop => hop.currentEquipment === equipo || hop.nextEquipment === equipo
      );

      return {
        id: equipo,
        data: { label: equipo },
        position: { x, y },
        style: {
          background: isInPath ? '#3b82f6' : '#f3f4f6',
          color: isInPath ? '#ffffff' : '#1f2937',
          border: isInPath ? '3px solid #1e40af' : '2px solid #d1d5db',
          borderRadius: '8px',
          padding: '12px 20px',
          fontSize: '14px',
          fontWeight: isInPath ? 'bold' : 'normal',
          boxShadow: isInPath ? '0 4px 6px rgba(59, 130, 246, 0.3)' : '0 2px 4px rgba(0,0,0,0.1)',
        },
      };
    });

    // Crear edges basados en las conexiones en la tabla de ruteo
    const edgesMap = new Map();
    routingData.forEach(route => {
      if (route.Gateway !== 'directo') {
        // Buscar qué equipo tiene este gateway en su tabla
        const targetEquipo = routingData.find(r =>
          r.IP_Destino && route.Gateway &&
          r.Gateway === 'directo' &&
          isIPInNetwork(route.Gateway, r.IP_Destino, r.Mascara)
        );

        if (targetEquipo) {
          const edgeId = `${route.Equipo}-${targetEquipo.Equipo}`;
          const reverseEdgeId = `${targetEquipo.Equipo}-${route.Equipo}`;

          if (!edgesMap.has(edgeId) && !edgesMap.has(reverseEdgeId)) {
            edgesMap.set(edgeId, {
              id: edgeId,
              source: route.Equipo,
              target: targetEquipo.Equipo,
              animated: false,
              style: { stroke: '#d1d5db', strokeWidth: 2 },
            });
          }
        }
      }
    });

    // Resaltar edges que están en la ruta del traceroute
    if (traceResult?.hops) {
      traceResult.hops.forEach(hop => {
        if (hop.nextEquipment) {
          const edgeId = `${hop.currentEquipment}-${hop.nextEquipment}`;
          const reverseEdgeId = `${hop.nextEquipment}-${hop.currentEquipment}`;

          if (edgesMap.has(edgeId)) {
            edgesMap.get(edgeId).animated = true;
            edgesMap.get(edgeId).style = { stroke: '#3b82f6', strokeWidth: 3 };
          } else if (edgesMap.has(reverseEdgeId)) {
            edgesMap.get(reverseEdgeId).animated = true;
            edgesMap.get(reverseEdgeId).style = { stroke: '#3b82f6', strokeWidth: 3 };
          }
        }
      });
    }

    setNodes(newNodes);
    setEdges(Array.from(edgesMap.values()));
  }, [routingData, traceResult]);

  // Helper: Verificar si una IP está en una red
  const isIPInNetwork = (ip, network, mask) => {
    if (!ip || !network || !mask) return false;

    // Convertir máscara CIDR a número
    const maskBits = parseInt(mask.replace('/', ''));
    const ipParts = ip.split('.').map(Number);
    const networkParts = network.split('.').map(Number);

    // Convertir IPs a números de 32 bits
    const ipNum = (ipParts[0] << 24) | (ipParts[1] << 16) | (ipParts[2] << 8) | ipParts[3];
    const networkNum = (networkParts[0] << 24) | (networkParts[1] << 16) | (networkParts[2] << 8) | networkParts[3];

    // Crear máscara
    const maskNum = (-1 << (32 - maskBits)) >>> 0;

    return (ipNum & maskNum) === (networkNum & maskNum);
  };

  // Manejo de conexiones entre nodos
  const onConnect = useCallback((params) => {
    if (!editMode) return;

    const newEdge = {
      ...params,
      type: 'default',
      markerEnd: {
        type: MarkerType.ArrowClosed,
      },
      style: { stroke: '#d1d5db', strokeWidth: 2 },
    };

    setEdges((eds) => addEdge(newEdge, eds));

    // Agregar ruta a routingData
    if (onRoutingDataChange) {
      const sourceEquipo = nodes.find(n => n.id === params.source)?.data.label;
      const targetEquipo = nodes.find(n => n.id === params.target)?.data.label;

      if (sourceEquipo && targetEquipo) {
        const newRoute = {
          Equipo: sourceEquipo,
          IP_Destino: '0.0.0.0',
          Mascara: '/0',
          Gateway: 'directo', // Por defecto, el usuario puede editarlo después
        };
        onRoutingDataChange([...routingData, newRoute]);
      }
    }
  }, [editMode, nodes, setEdges, routingData, onRoutingDataChange]);

  // Agregar nuevo nodo
  const handleAddNode = useCallback(() => {
    if (!editMode) return;

    const newNodeName = prompt('Nombre del nuevo equipo:');
    if (!newNodeName || newNodeName.trim() === '') return;

    const newNode = {
      id: newNodeName,
      data: { label: newNodeName },
      position: { x: 400, y: 300 },
      style: {
        background: '#f3f4f6',
        color: '#1f2937',
        border: '2px solid #d1d5db',
        borderRadius: '8px',
        padding: '12px 20px',
        fontSize: '14px',
        fontWeight: 'normal',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      },
    };

    setNodes((nds) => [...nds, newNode]);

    // Agregar entrada de ruteo por defecto
    if (onRoutingDataChange) {
      const newRoute = {
        Equipo: newNodeName,
        IP_Destino: '0.0.0.0',
        Mascara: '/0',
        Gateway: 'directo',
      };
      onRoutingDataChange([...routingData, newRoute]);
    }
  }, [editMode, setNodes, routingData, onRoutingDataChange]);

  // Eliminar nodo
  const handleDeleteNode = useCallback((nodeId) => {
    if (!editMode) return;

    if (confirm('¿Eliminar este nodo y todas sus conexiones?')) {
      setNodes((nds) => nds.filter(n => n.id !== nodeId));
      setEdges((eds) => eds.filter(e => e.source !== nodeId && e.target !== nodeId));

      // Eliminar de routingData
      if (onRoutingDataChange) {
        const nodeName = nodes.find(n => n.id === nodeId)?.data.label;
        const filtered = routingData.filter(r => r.Equipo !== nodeName);
        onRoutingDataChange(filtered);
      }
    }
  }, [editMode, nodes, setNodes, setEdges, routingData, onRoutingDataChange]);

  // Eliminar edge
  const handleDeleteEdge = useCallback((edgeId) => {
    if (!editMode) return;

    setEdges((eds) => eds.filter(e => e.id !== edgeId));
  }, [editMode, setEdges]);

  // Manejador de doble click en nodos (para editar)
  const onNodeDoubleClick = useCallback((event, node) => {
    if (!editMode) return;

    const newName = prompt('Nuevo nombre del equipo:', node.data.label);
    if (newName && newName.trim() !== '' && newName !== node.data.label) {
      // Actualizar nodo
      setNodes((nds) =>
        nds.map((n) =>
          n.id === node.id
            ? { ...n, data: { ...n.data, label: newName } }
            : n
        )
      );

      // Actualizar routingData
      if (onRoutingDataChange) {
        const updated = routingData.map(r =>
          r.Equipo === node.data.label
            ? { ...r, Equipo: newName }
            : r
        );
        onRoutingDataChange(updated);
      }
    }
  }, [editMode, setNodes, routingData, onRoutingDataChange]);

  if (!routingData || routingData.length === 0) {
    return (
      <div className="w-full h-96 bg-white rounded-lg shadow-md flex items-center justify-center">
        <p className="text-gray-500">Carga un archivo CSV o activa el modo edición para crear tu red</p>
      </div>
    );
  }

  return (
    <div className="w-full bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800">
          Diagrama de Red
        </h2>
        {editMode && (
          <div className="flex gap-2">
            <button
              onClick={handleAddNode}
              className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
              title="Agregar nodo"
            >
              + Nodo
            </button>
          </div>
        )}
      </div>

      {editMode && (
        <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
          <strong>Modo Edición:</strong> Arrastra para mover nodos. Conecta nodos arrastrando desde un borde. Doble-click en nodos para renombrar.
        </div>
      )}

      <div className="w-full h-96 border border-gray-200 rounded-lg overflow-hidden">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeDoubleClick={onNodeDoubleClick}
          fitView
          attributionPosition="bottom-left"
          connectionMode="loose"
          snapToGrid={editMode}
          snapGrid={[15, 15]}
          nodesDraggable={editMode}
          nodesConnectable={editMode}
          elementsSelectable={editMode}
        >
          <Background color="#f3f4f6" gap={16} />
          <Controls />
          <MiniMap
            nodeColor={(node) => {
              return node.style?.background || '#f3f4f6';
            }}
            maskColor="rgba(0, 0, 0, 0.1)"
          />
        </ReactFlow>
      </div>
      {traceResult?.success && (
        <div className="mt-3 text-sm text-gray-600">
          <span className="inline-block w-3 h-3 bg-blue-600 rounded-full mr-2"></span>
          Los nodos y conexiones en azul muestran la ruta del traceroute
        </div>
      )}
    </div>
  );
};

export default NetworkDiagram;
