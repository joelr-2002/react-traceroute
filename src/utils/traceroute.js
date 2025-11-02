/**
 * Algoritmo de Traceroute basado en tablas de ruteo estáticas
 * Simula el recorrido de un paquete desde una IP origen a una IP destino
 */

/**
 * Convierte una IP a número para comparaciones
 */
const ipToNumber = (ip) => {
  const parts = ip.split('.').map(Number);
  return (parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3];
};

/**
 * Verifica si una IP pertenece a una red específica
 * @param {string} ip - IP a verificar (ej: "192.168.1.5")
 * @param {string} network - Red (ej: "192.168.1.0")
 * @param {string} mask - Máscara en formato CIDR (ej: "/24")
 */
const isIPInNetwork = (ip, network, mask) => {
  if (!ip || !network || !mask) return false;

  try {
    const maskBits = parseInt(mask.replace('/', ''));
    const ipNum = ipToNumber(ip);
    const networkNum = ipToNumber(network);
    const maskNum = (-1 << (32 - maskBits)) >>> 0;

    return (ipNum & maskNum) === (networkNum & maskNum);
  } catch (error) {
    return false;
  }
};

/**
 * Busca la entrada de ruteo más específica para una IP destino
 * @param {string} equipmentName - Nombre del equipo actual
 * @param {string} destIP - IP destino
 * @param {Array} routingTable - Tabla de ruteo completa
 */
const findRouteEntry = (equipmentName, destIP, routingTable) => {
  // Filtrar entradas de este equipo
  const equipmentRoutes = routingTable.filter(
    route => route.Equipo === equipmentName
  );

  // Buscar coincidencias con la IP destino
  const matches = equipmentRoutes.filter(route =>
    isIPInNetwork(destIP, route.IP_Destino, route.Mascara)
  );

  if (matches.length === 0) return null;

  // Retornar la ruta más específica (máscara más larga)
  return matches.reduce((best, current) => {
    const bestMask = parseInt(best.Mascara.replace('/', ''));
    const currentMask = parseInt(current.Mascara.replace('/', ''));
    return currentMask > bestMask ? current : best;
  });
};

/**
 * Encuentra qué equipo tiene conexión directa a un gateway
 * @param {string} gateway - IP del gateway
 * @param {Array} routingTable - Tabla de ruteo completa
 * @param {string} currentEquipment - Equipo actual (para excluirlo)
 */
const findEquipmentByGateway = (gateway, routingTable, currentEquipment) => {
  // Buscar equipos que tengan una ruta directa a la red del gateway
  // IMPORTANTE: Excluir el equipo actual para evitar loops
  for (const route of routingTable) {
    if (route.Equipo !== currentEquipment &&
        route.Gateway.toLowerCase() === 'directo' &&
        isIPInNetwork(gateway, route.IP_Destino, route.Mascara)) {
      return route.Equipo;
    }
  }

  return null;
};

/**
 * Ejecuta el algoritmo de traceroute
 * @param {string} sourceEquipment - Nombre del equipo origen
 * @param {string} sourceIP - IP origen
 * @param {string} destIP - IP destino
 * @param {Array} routingTable - Tabla de ruteo completa
 * @returns {Object} Resultado con éxito/error y lista de saltos
 */
export const executeTraceroute = (sourceEquipment, sourceIP, destIP, routingTable) => {
  const hops = [];
  const visitedEquipment = new Set();
  let currentEquipment = sourceEquipment;
  const MAX_HOPS = 30; // Límite de seguridad

  // Validación inicial
  if (!sourceEquipment || !sourceIP || !destIP || !routingTable || routingTable.length === 0) {
    return {
      success: false,
      error: 'Parámetros inválidos o tabla de ruteo vacía',
      hops: [],
      sourceEquipment,
      sourceIP,
      destIP,
    };
  }

  // Verificar que el equipo origen existe en la tabla
  const equipmentExists = routingTable.some(r => r.Equipo === sourceEquipment);
  if (!equipmentExists) {
    return {
      success: false,
      error: `El equipo "${sourceEquipment}" no existe en la tabla de ruteo`,
      hops: [],
      sourceEquipment,
      sourceIP,
      destIP,
    };
  }

  // Algoritmo de traceroute
  try {
    for (let hopCount = 0; hopCount < MAX_HOPS; hopCount++) {
      // Detectar loop
      if (visitedEquipment.has(currentEquipment)) {
        return {
          success: false,
          error: `Loop infinito detectado en el equipo "${currentEquipment}"`,
          hops,
          sourceEquipment,
          sourceIP,
          destIP,
        };
      }

      visitedEquipment.add(currentEquipment);

      // Buscar entrada de ruteo para la IP destino
      const routeEntry = findRouteEntry(currentEquipment, destIP, routingTable);

      if (!routeEntry) {
        return {
          success: false,
          error: `No existe ruta hacia ${destIP} desde el equipo "${currentEquipment}"`,
          hops,
          sourceEquipment,
          sourceIP,
          destIP,
        };
      }

      // Si el gateway es "directo", hemos llegado al destino
      if (routeEntry.Gateway.toLowerCase() === 'directo') {
        hops.push({
          currentEquipment,
          destNetwork: `${routeEntry.IP_Destino}${routeEntry.Mascara}`,
          gateway: 'directo',
          nextEquipment: null,
        });

        return {
          success: true,
          error: null,
          hops,
          sourceEquipment,
          sourceIP,
          destIP,
        };
      }

      // Buscar el siguiente equipo usando el gateway (excluyendo el equipo actual)
      const nextEquipment = findEquipmentByGateway(routeEntry.Gateway, routingTable, currentEquipment);

      if (!nextEquipment) {
        return {
          success: false,
          error: `No se puede resolver el gateway ${routeEntry.Gateway} desde "${currentEquipment}"`,
          hops,
          sourceEquipment,
          sourceIP,
          destIP,
        };
      }

      // Agregar salto
      hops.push({
        currentEquipment,
        destNetwork: `${routeEntry.IP_Destino}${routeEntry.Mascara}`,
        gateway: routeEntry.Gateway,
        nextEquipment,
      });

      // Avanzar al siguiente equipo
      currentEquipment = nextEquipment;
    }

    // Si llegamos aquí, excedimos el límite de saltos
    return {
      success: false,
      error: `Se excedió el límite de ${MAX_HOPS} saltos`,
      hops,
      sourceEquipment,
      sourceIP,
      destIP,
    };
  } catch (error) {
    return {
      success: false,
      error: `Error interno: ${error.message}`,
      hops,
      sourceEquipment,
      sourceIP,
      destIP,
    };
  }
};

/**
 * Valida formato de IP
 */
export const validateIP = (ip) => {
  const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (!ipRegex.test(ip)) return false;

  const parts = ip.split('.');
  return parts.every(part => {
    const num = parseInt(part, 10);
    return num >= 0 && num <= 255;
  });
};
