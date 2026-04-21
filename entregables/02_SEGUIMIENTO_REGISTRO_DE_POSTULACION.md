## 2) Realizar seguimiento al registro de postulación

### Prompt de diseño web

#### Especificación común (mantener en todos los diseños)
- Diseña una interfaz web **low-fidelity / wireframe**, sobria, institucional y programable.
- Vista pensada para **desktop**, ancho de contenido máximo de **1200 px**.
- **Título principal**: 28 px.
- **Títulos de sección**: 20 px.
- **Labels y texto de campos**: 14 px.
- **Inputs y selects**: 40 px de alto.
- **Textareas**: 120 px mínimo.
- **Botones primarios y secundarios**: 40 px de alto, 120 px de ancho mínimo.
- **Tablas** con 10 registros por página.
- Mostrar **estados**, **validaciones**, **mensajes de error** y **confirmación**.
- Estilo **escala de grises**, minimalista, sin decoración innecesaria.
- Incluir nombres reales de **secciones**, **campos**, **tabla**, **botones** y **acciones**.
- Layout claro con **header**, **breadcrumb**, filtros, tabla, **acciones** y **mensajes del sistema**.

#### Prompt específico
Diseña una pantalla web low-fidelity para el caso de uso **"Realizar seguimiento al registro de postulación"** dentro de un sistema institucional de gestión de proyectos concursables.
La pantalla debe estar orientada al **Especialista del Comité de Evaluación** y funcionar como una **bandeja de seguimiento** de postulaciones registradas.

Debe incluir:
- Header institucional
- Breadcrumb
- Título de pantalla: **"Seguimiento de postulaciones"**
- Buscador por **código o nombre** del proyecto
- Filtros por **estado, fecha, fondo concursable y facultad**
- Tabla principal con **10 registros por página**
- Columnas: **código, proyecto, facultad, fondo, estado, fecha de registro, documentos, acciones**
- Indicadores de documentos: **completos / incompletos / no presentados**
- Botón **"Descargar Excel"**
- Mensaje cuando no existan postulaciones registradas
- Mensajes de error en caso de fallo de exportación

La interfaz debe permitir revisar la **trazabilidad** de cada postulación y el **estado documental** sin necesidad de ingresar aún al detalle completo.
Usa estilo sobrio, institucional, claro y programable.

---

### Escenario técnico corregido
1. El Especialista del Comité de Evaluación accede al sistema.
2. El sistema solicita credenciales y ejecuta autenticación y doble factor.
3. El sistema valida permisos de seguimiento para el usuario autenticado.
4. El Especialista selecciona la opción Seguimiento de postulaciones.
5. El sistema consulta la existencia de postulaciones registradas.
6. Si existen postulaciones, el sistema muestra la bandeja de seguimiento con filtros, tabla y estado documental.
7. El Especialista revisa la información de cada postulación.
8. El Especialista identifica documentos cargados, incompletos o no presentados.
9. El Especialista solicita la descarga del listado de postulaciones.
10. El sistema genera el archivo Excel correspondiente.
11. El sistema incluye para cada postulación la información general y el estado de los documentos requeridos.
12. Si la generación o descarga falla, el sistema informa el error.
13. Si la descarga es satisfactoria, el archivo queda disponible para el Especialista.
14. El Especialista utiliza la información exportada para el seguimiento de las postulaciones registradas.
