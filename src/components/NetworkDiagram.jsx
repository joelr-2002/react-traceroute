import { useEffect, useState, useCallback, useRef } from 'react';
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
  const nodePositionsRef = useRef({});
  const isConnectingRef = useRef(false);

  useEffect(() => {
    if (!routingData || routingData.length === 0) {
      setNodes([]);
      setEdges([]);
      nodePositionsRef.current = {};
      return;
    }

    // Crear nodos para cada equipo único
    const equipos = [...new Set(routingData.map(r => r.Equipo))];

    const newNodes = equipos.map((equipo, index) => {
      // Usar posición guardada si existe, sino calcular nueva posición circular
      let position;
      if (nodePositionsRef.current[equipo]) {
        position = nodePositionsRef.current[equipo];
      } else {
        const angle = (index / equipos.length) * 2 * Math.PI;
        const radius = 250;
        const x = 400 + radius * Math.cos(angle);
        const y = 300 + radius * Math.sin(angle);
        position = { x, y };
        nodePositionsRef.current[equipo] = position;
      }

      // Verificar si este nodo está en la ruta
      const isInPath = traceResult?.hops?.some(
        hop => hop.currentEquipment === equipo || hop.nextEquipment === equipo
      );

      return {
        id: equipo,
        data: { label: equipo },
        position,
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
              markerEnd: {
                type: MarkerType.ArrowClosed,
              },
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

  // Actualizar posiciones cuando los nodos se mueven
  const handleNodesChange = useCallback((changes) => {
    changes.forEach(change => {
      if (change.type === 'position' && change.position && change.id) {
        nodePositionsRef.current[change.id] = change.position;
      }
    });
    onNodesChange(changes);
  }, [onNodesChange]);

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

  // Obtener red del equipo destino
  const getEquipmentNetwork = (equipName) => {
    const directRoutes = routingData.filter(r =>
      r.Equipo === equipName &&
      r.Gateway === 'directo' &&
      r.IP_Destino !== '0.0.0.0'
    );
    return directRoutes[0] || null;
  };

  // Manejo de conexiones entre nodos
  const onConnect = useCallback((params) => {
    if (!editMode || isConnectingRef.current) return;

    isConnectingRef.current = true;

    try {
      const sourceEquipo = params.source;
      const targetEquipo = params.target;

      // Validación 1: No conectar un nodo consigo mismo
      if (sourceEquipo === targetEquipo) {
        alert('No puedes conectar un nodo consigo mismo');
        return;
      }

      // Validación 2: Verificar que ambos nodos existen
      if (!sourceEquipo || !targetEquipo) {
        alert('Error: Nodos no válidos');
        return;
      }

      // Validación 3: Verificar que no exista ya una conexión
      const existingConnection = routingData.find(r =>
        r.Equipo === sourceEquipo &&
        r.Gateway !== 'directo' &&
        routingData.some(target =>
          target.Equipo === targetEquipo &&
          target.Gateway === 'directo' &&
          isIPInNetwork(r.Gateway, target.IP_Destino, target.Mascara)
        )
      );

      if (existingConnection) {
        alert(`Ya existe una conexión entre ${sourceEquipo} y ${targetEquipo}`);
        return;
      }

      // Obtener la red del equipo destino
      const targetNetwork = getEquipmentNetwork(targetEquipo);

      if (!targetNetwork) {
        // Si el equipo destino no tiene una red configurada, pedirla al usuario
        const ipDestino = prompt(
          `El equipo "${targetEquipo}" necesita una red configurada.\n\nIngresa la IP de red (ej: 192.168.1.0):`,
          '192.168.1.0'
        );

        if (!ipDestino) {
          alert('Se canceló la conexión');
          return;
        }

        const mascara = prompt(
          `Ingresa la máscara en formato CIDR (ej: /24):`,
          '/24'
        );

        if (!mascara) {
          alert('Se canceló la conexión');
          return;
        }

        // Agregar la red directa al equipo destino
        const newTargetRoute = {
          Equipo: targetEquipo,
          IP_Destino: ipDestino,
          Mascara: mascara,
          Gateway: 'directo'
        };

        // Pedir el gateway (debe estar dentro de la red del destino)
        const gateway = prompt(
          `Ingresa la IP del gateway en ${sourceEquipo} para alcanzar ${targetEquipo}\n(debe estar en la red ${ipDestino}${mascara}):`,
          ipDestino.replace(/\d+$/, '1')
        );

        if (!gateway) {
          alert('Se canceló la conexión');
          return;
        }

        // Crear la ruta en el equipo origen
        const newSourceRoute = {
          Equipo: sourceEquipo,
          IP_Destino: ipDestino,
          Mascara: mascara,
          Gateway: gateway
        };

        // Actualizar routingData con ambas rutas
        if (onRoutingDataChange) {
          onRoutingDataChange([...routingData, newTargetRoute, newSourceRoute]);
        }
      } else {
        // El equipo destino ya tiene una red configurada
        const gateway = prompt(
          `Ingresa la IP del gateway en ${sourceEquipo} para alcanzar la red ${targetNetwork.IP_Destino}${targetNetwork.Mascara} de ${targetEquipo}:`,
          targetNetwork.IP_Destino.replace(/\d+$/, '1')
        );

        if (!gateway) {
          alert('Se canceló la conexión');
          return;
        }

        // Crear la ruta en el equipo origen
        const newSourceRoute = {
          Equipo: sourceEquipo,
          IP_Destino: targetNetwork.IP_Destino,
          Mascara: targetNetwork.Mascara,
          Gateway: gateway
        };

        // Actualizar routingData
        if (onRoutingDataChange) {
          onRoutingDataChange([...routingData, newSourceRoute]);
        }
      }
    } finally {
      // Resetear el flag después de un breve delay
      setTimeout(() => {
        isConnectingRef.current = false;
      }, 100);
    }
  }, [editMode, routingData, onRoutingDataChange]);

  // Agregar nuevo nodo
  const handleAddNode = useCallback(() => {
    if (!editMode) return;

    const newNodeName = prompt('Nombre del nuevo equipo:');
    if (!newNodeName || newNodeName.trim() === '') return;

    // Validar que no exista ya
    const exists = routingData.some(r => r.Equipo === newNodeName);
    if (exists) {
      alert('Ya existe un equipo con ese nombre');
      return;
    }

    // Pedir configuración de red
    const ipDestino = prompt(
      'Ingresa la IP de red del nuevo equipo (ej: 192.168.1.0):',
      '192.168.1.0'
    );

    if (!ipDestino) return;

    const mascara = prompt(
      'Ingresa la máscara en formato CIDR (ej: /24):',
      '/24'
    );

    if (!mascara) return;

    // Calcular posición para el nuevo nodo
    const existingPositions = Object.values(nodePositionsRef.current);
    let newPosition;

    if (existingPositions.length === 0) {
      newPosition = { x: 400, y: 300 };
    } else {
      // Colocar en una posición ligeramente desplazada del centro
      const offset = existingPositions.length * 50;
      newPosition = { x: 400 + offset, y: 300 + offset };
    }

    nodePositionsRef.current[newNodeName] = newPosition;

    // Agregar entrada de ruteo
    if (onRoutingDataChange) {
      const newRoute = {
        Equipo: newNodeName,
        IP_Destino: ipDestino,
        Mascara: mascara,
        Gateway: 'directo',
      };
      onRoutingDataChange([...routingData, newRoute]);
    }
  }, [editMode, routingData, onRoutingDataChange]);

  // Eliminar nodo
  const handleDeleteNode = useCallback((nodeId) => {
    if (!editMode) return;

    if (confirm(`¿Eliminar el equipo "${nodeId}" y todas sus rutas?`)) {
      // Eliminar posición guardada
      delete nodePositionsRef.current[nodeId];

      // Eliminar de routingData (todas las rutas de este equipo)
      if (onRoutingDataChange) {
        const filtered = routingData.filter(r => r.Equipo !== nodeId);
        onRoutingDataChange(filtered);
      }
    }
  }, [editMode, routingData, onRoutingDataChange]);

  // Manejador de doble click en nodos (para editar)
  const onNodeDoubleClick = useCallback((event, node) => {
    if (!editMode) return;

    const newName = prompt('Nuevo nombre del equipo:', node.data.label);
    if (newName && newName.trim() !== '' && newName !== node.data.label) {
      // Validar que no exista ya
      const exists = routingData.some(r => r.Equipo === newName);
      if (exists) {
        alert('Ya existe un equipo con ese nombre');
        return;
      }

      // Actualizar posición en el ref
      nodePositionsRef.current[newName] = nodePositionsRef.current[node.data.label];
      delete nodePositionsRef.current[node.data.label];

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
  }, [editMode, routingData, onRoutingDataChange]);

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
          <strong>Modo Edición:</strong> Arrastra para mover nodos. Conecta nodos arrastrando desde un borde a otro nodo. Doble-click en nodos para renombrar.
        </div>
      )}

      <div className="w-full h-96 border border-gray-200 rounded-lg overflow-hidden">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={handleNodesChange}
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
