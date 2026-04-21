## 1) Registrar ficha de postulación

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
- Mostrar **estados**, **validaciones**, **mensajes de error** y **confirmación**.
- Estilo **escala de grises**, minimalista, sin decoración innecesaria.
- Incluir nombres reales de **secciones**, **campos**, **botones** y **acciones**.
- Layout claro con **header**, **breadcrumb**, formulario, **acciones** y **mensajes del sistema**.

#### Prompt específico
Diseña una pantalla web low-fidelity para el caso de uso **"Registrar ficha de postulación"** dentro de un sistema institucional de gestión de proyectos concursables.
La pantalla debe representar el formulario de registro de una nueva ficha de postulación por parte del **Representante de la Facultad Proponente**.

Debe incluir:
- Header institucional
- Breadcrumb de navegación
- Título de pantalla: **"Nueva ficha de postulación"**
- Sección de datos generales del proyecto
- Sección de datos del fondo concursable y concurso
- Sección de tipo de participación
- Sección de cronograma
- Sección de financiamiento
- Sección de documentos obligatorios
- Área para adjuntar archivos
- Botón **"Guardar borrador"**
- Botón **"Enviar ficha"**
- Mensajes de validación
- Resumen lateral o inferior del estado del formulario

Condiciones funcionales a reflejar:
- Si el proyecto tiene entidad asociada, habilitar campos adicionales para asociación
- Si el proyecto incluye infraestructura/equipamiento, habilitar carga del informe técnico del Grupo Técnico
- Si el proyecto incluye I+D+i+TT, habilitar carga de validación del Grupo de Investigación
- Mostrar claramente cuáles campos son **obligatorios**
- El formulario debe estar preparado para validación antes del envío
- El sistema debe **bloquear el envío** si faltan campos o documentos

---

### Escenario técnico corregido
1. El Representante de la Facultad Proponente accede al sistema.
2. El sistema solicita credenciales y ejecuta el proceso de autenticación y doble factor.
3. El sistema valida permisos de registro para el usuario autenticado.
4. El sistema valida que el registro se realice dentro del plazo permitido.
5. El Representante selecciona la opción Nueva ficha de postulación.
6. El sistema carga el formulario de registro de ficha.
7. El sistema habilita dinámicamente secciones adicionales según el tipo de proyecto: asociación, infraestructura/equipamiento o I+D+i+TT.
8. El Representante ingresa la información general del proyecto.
9. El Representante registra cronograma, financiamiento y demás datos requeridos.
10. El Representante adjunta los documentos obligatorios.
11. El Representante selecciona la opción de envío.
12. El sistema valida campos obligatorios, consistencia de la información y documentos requeridos.
13. Si existen errores, el sistema muestra observaciones y permite la corrección.
14. Si la validación es conforme, el sistema registra la ficha.
15. El sistema cambia el estado a Enviado para evaluación.
16. El sistema notifica al Comité de Evaluación.
