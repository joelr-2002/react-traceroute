# Simulador de Traceroute

Aplicación React que simula el funcionamiento de traceroute basándose en tablas de ruteo estáticas. Visualiza gráficamente el recorrido de paquetes a través de una red.

## 🚀 Características

- **Carga de tablas de ruteo** desde archivos CSV
- **Algoritmo de traceroute** que simula el recorrido de paquetes
- **Visualización interactiva** de la topología de red con ReactFlow
- **Detección de loops** infinitos y rutas no encontradas
- **Interfaz moderna** con TailwindCSS
- **Tabla detallada** de saltos con información de cada hop
- **Resumen de estadísticas** del traceroute

## 📋 Requisitos

- Node.js 16 o superior
- npm o yarn

## 🛠️ Instalación

```bash
# Clonar o navegar al directorio del proyecto
cd traceroute-simulator

# Instalar dependencias
npm install

# Ejecutar en modo desarrollo
npm run dev
```

## 📁 Estructura del Proyecto

```
traceroute-simulator/
├── public/
│   └── example-routing-table.csv    # Tabla de ruteo de ejemplo
├── src/
│   ├── components/
│   │   ├── FileUploader.jsx         # Componente para cargar CSV
│   │   ├── TraceRouteForm.jsx       # Formulario de entrada
│   │   ├── NetworkDiagram.jsx       # Diagrama de red interactivo
│   │   ├── HopsTable.jsx            # Tabla de saltos
│   │   └── ResultsSummary.jsx       # Resumen de resultados
│   ├── utils/
│   │   └── traceroute.js            # Algoritmo de traceroute
│   ├── App.jsx                      # Componente principal
│   └── index.css                    # Estilos globales
└── README.md
```

## 📝 Formato del CSV

El archivo CSV debe tener el siguiente formato:

```csv
Equipo,IP_Destino,Mascara,Gateway
RouterA,10.0.1.0,/24,directo
RouterA,192.168.1.0,/24,10.0.1.2
RouterB,10.0.1.0,/24,directo
RouterB,192.168.1.0,/24,directo
```

### Columnas:
- **Equipo**: Nombre del router o dispositivo
- **IP_Destino**: Red de destino en formato IP
- **Mascara**: Máscara de subred en formato CIDR (ej: /24)
- **Gateway**: IP del siguiente salto, o "directo" si la red es directamente alcanzable

### Notas importantes:
- Cada equipo debe declarar como "directo" las redes a las que está físicamente conectado
- Los gateways deben ser IPs que pertenezcan a redes declaradas como "directo" por otros equipos
- Múltiples equipos pueden estar conectados a la misma red (tener la misma red como "directo")

## 🎯 Uso

1. **Cargar tabla de ruteo**: Arrastra un archivo CSV o haz clic para seleccionarlo
2. **Seleccionar equipo origen**: Elige desde qué router iniciar el traceroute
3. **Ingresar IP origen**: Dirección IP del origen (puede ser cualquiera dentro de la red)
4. **Ingresar IP destino**: Dirección IP que deseas alcanzar
5. **Ejecutar**: Presiona "Ejecutar Traceroute" para ver los resultados

## 🔍 Algoritmo

El simulador implementa el siguiente algoritmo:

1. Comienza en el equipo origen especificado
2. Busca en su tabla de ruteo la entrada que coincida con la IP destino
3. Si el gateway es "directo", ha llegado al destino
4. Si el gateway es una IP, busca qué equipo tiene acceso directo a esa IP
5. Repite el proceso desde ese nuevo equipo
6. Detecta loops y rutas no encontradas

## 🎨 Tecnologías

- **React 18**: Framework de UI
- **Vite**: Build tool y dev server
- **ReactFlow**: Visualización de grafos y diagramas
- **PapaParse**: Parser de CSV
- **TailwindCSS**: Framework de estilos

## 📊 Ejemplos de Uso

### Archivo CSV de ejemplo:
Ver `public/example-routing-table.csv`

### Caso 1: Ruta de 2 saltos
- **Equipo Origen**: RouterA
- **IP Origen**: 192.168.1.1
- **IP Destino**: 192.168.1.50

**Resultado esperado:**
```
Salto 1: RouterA → Gateway: 10.0.1.2 → RouterB
Salto 2: RouterB → Gateway: directo → Destino alcanzado
```

### Caso 2: Ruta de 2 saltos (otra red)
- **Equipo Origen**: RouterA
- **IP Origen**: 192.168.1.1
- **IP Destino**: 192.168.2.50

**Resultado esperado:**
```
Salto 1: RouterA → Gateway: 10.0.2.3 → RouterC
Salto 2: RouterC → Gateway: directo → Destino alcanzado
```

### Caso 3: Ruta de 3 saltos
- **Equipo Origen**: RouterA
- **IP Origen**: 192.168.1.1
- **IP Destino**: 192.168.3.50

**Resultado esperado:**
```
Salto 1: RouterA → Gateway: 10.0.1.2 → RouterB
Salto 2: RouterB → Gateway: 10.0.3.4 → RouterD
Salto 3: RouterD → Gateway: directo → Destino alcanzado
```

## ⚠️ Validaciones

La aplicación valida:
- ✅ Formato correcto del CSV
- ✅ Formato de direcciones IP
- ✅ Existencia de rutas
- ✅ Detección de loops infinitos
- ✅ Límite máximo de saltos (30)

## 🐛 Posibles Errores

### "No existe ruta hacia X.X.X.X"
La tabla de ruteo no contiene una entrada que permita llegar a la IP destino.

### "Loop infinito detectado"
El algoritmo detectó que está revisitando un equipo, indicando un ciclo en el ruteo.

### "No se puede resolver el gateway X.X.X.X"
El gateway especificado no está accesible directamente desde ningún equipo.

## 📄 Licencia

MIT

## 👥 Autor

Creador por Joel Rodríguez
