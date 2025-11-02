import { useEffect, useState } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
} from 'reactflow';
import 'reactflow/dist/style.css';

/**
 * NetworkDiagram Component
 * Visualiza la topología de red usando ReactFlow
 * Muestra equipos como nodos y conexiones como edges
 * Resalta la ruta del traceroute cuando está disponible
 */
const NetworkDiagram = ({ routingData, traceResult }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

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

  if (!routingData || routingData.length === 0) {
    return (
      <div className="w-full h-96 bg-white rounded-lg shadow-md flex items-center justify-center">
        <p className="text-gray-500">Carga un archivo CSV para ver el diagrama de red</p>
      </div>
    );
  }

  return (
    <div className="w-full bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">
        Diagrama de Red
      </h2>
      <div className="w-full h-96 border border-gray-200 rounded-lg overflow-hidden">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          fitView
          attributionPosition="bottom-left"
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
