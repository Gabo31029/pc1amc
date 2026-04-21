## Prompts de diseño web y escenarios técnicos (consolidado)

### Especificación común para todos los prompts (pegar al inicio de cada prompt)

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
- Incluir nombres reales de **secciones**, **campos**, **tablas**, **botones** y **acciones**.
- Mostrar layout claro con **header**, **breadcrumb**, formulario o tabla, **acciones principales** y **mensajes del sistema**.
- El resultado debe verse como una pantalla implementable en un **sistema administrativo universitario**.

---

## 1) Registrar ficha de postulación

### Prompt de diseño web

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
- Mostrar claramente cuáles campos son obligatorios
- El formulario debe estar preparado para validación antes del envío
- El sistema debe poder bloquear el envío si faltan campos o documentos

Usa una interfaz sobria, en escala de grises, con apariencia académica e institucional, lista para ser usada como base de implementación.

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

---

## 2) Realizar seguimiento al registro de postulación

### Prompt de diseño web

Diseña una pantalla web low-fidelity para el caso de uso **"Realizar seguimiento al registro de postulación"** dentro de un sistema institucional de gestión de proyectos concursables.
La pantalla debe estar orientada al **Especialista del Comité de Evaluación** y funcionar como una bandeja de seguimiento de postulaciones registradas.

Debe incluir:
- Header institucional
- Breadcrumb
- Título de pantalla: **"Seguimiento de postulaciones"**
- Buscador por código o nombre del proyecto
- Filtros por estado, fecha, fondo concursable y facultad
- Tabla principal con 10 registros por página
- Columnas: código, proyecto, facultad, fondo, estado, fecha de registro, documentos, acciones
- Indicadores de documentos completos, incompletos o no presentados
- Botón **"Descargar Excel"**
- Mensaje cuando no existan postulaciones registradas
- Mensajes de error en caso de fallo de exportación

La interfaz debe permitir revisar la trazabilidad de cada postulación y el estado documental sin necesidad de ingresar aún al detalle completo.
Usa estilo sobrio, institucional, claro y programable.

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

---

## 3) Actualizar ficha para asociación

### Prompt de diseño web

Diseña una pantalla web low-fidelity para el caso de uso **"Actualizar ficha para asociación"** dentro de un sistema institucional de gestión de proyectos concursables.
La pantalla debe representar la actualización de una ficha de postulación ya registrada para incorporar o modificar la participación de una entidad externa asociada.

Debe incluir:
- Header institucional
- Breadcrumb
- Título de pantalla: **"Actualizar ficha para asociación"**
- Cabecera con código de ficha, versión actual y estado
- Sección de datos generales del proyecto
- Sección de datos de la entidad externa asociada
- Sección de tipo de participación
- Sección de documento de asociación
- Área de carga de archivos PDF
- Sección de historial de versiones
- Botón **"Guardar actualización"**
- Botón **"Cancelar"**
- Mensajes de validación
- Mensaje de confirmación de nueva versión

Condiciones funcionales a reflejar:
- La pantalla parte de una ficha base ya registrada
- Debe permitir modificar datos del proyecto vinculados a la asociación
- Debe registrar o actualizar la información de la entidad externa asociada
- Debe adjuntar el documento de asociación
- Al guardar, la versión anterior se inactiva y se genera una nueva versión
- Si el contrato ya fue firmado, la ficha debe mostrarse en modo solo lectura o bloqueada
- Mostrar claramente que la actualización ocurre antes de la adjudicación final

Usa una interfaz académica, sobria, en escala de grises y lista para ser implementada.

### Escenario técnico corregido

1. El Representante de la Facultad Proponente accede al sistema.
2. El sistema solicita credenciales y ejecuta autenticación y doble factor.
3. El sistema valida permisos de edición sobre fichas de postulación.
4. El sistema muestra las fichas registradas para la Facultad.
5. El Representante selecciona la ficha base que desea actualizar.
6. El Representante selecciona la opción Actualizar ficha para asociación.
7. El sistema valida que la ficha exista, pertenezca a la Facultad y se encuentre en estado editable.
8. El sistema valida que el proyecto contemple participación con entidad externa asociada.
9. El sistema valida que el contrato aún no haya sido firmado.
10. El sistema carga la versión vigente de la ficha y habilita la edición.
11. El Representante actualiza los datos del proyecto vinculados a la asociación.
12. El Representante registra o modifica la información de la entidad externa asociada.
13. El Representante adjunta el documento de asociación y el sustento requerido.
14. El Representante confirma la actualización.
15. El sistema valida campos obligatorios, consistencia de datos y presencia de documentos requeridos.
16. Si existen errores, el sistema muestra observaciones y permite la corrección.
17. Si la validación es conforme, el sistema guarda la actualización.
18. El sistema inactiva la versión anterior y genera una nueva versión de la ficha.
19. El sistema registra el historial de cambios.
20. El sistema muestra el mensaje de confirmación.

---

## 4) Actualizar ficha para adjudicación

### Prompt de diseño web

Diseña una pantalla web low-fidelity para el caso de uso **"Actualizar ficha para adjudicación"** dentro de un sistema institucional de gestión de proyectos concursables.
La pantalla debe representar la actualización de una ficha de postulación ya registrada luego de la adjudicación del proyecto, incorporando el documento de adjudicación y permitiendo ajustes finales antes de la formalización definitiva.

Debe incluir:
- Header institucional
- Breadcrumb
- Título de pantalla: **"Actualizar ficha para adjudicación"**
- Cabecera con código de ficha, versión, estado del proyecto y tipo de participación
- Sección de datos generales del proyecto
- Sección de financiamiento
- Sección de cronograma y actividades
- Sección de alcance actualizado
- Sección de entidad ejecutora externa si aplica
- Sección de documento de adjudicación
- Sección de convenio de asociación y documentos legales si aplica
- Historial de versiones
- Botón **"Guardar y enviar"**
- Botón **"Cancelar"**
- Mensajes de validación y confirmación

Condiciones funcionales a reflejar:
- Solo aplica a proyectos adjudicados
- Parte de la ficha base ya registrada
- Permite actualizar datos generales, financiamiento, cronograma y alcance
- Obliga a cargar el documento de adjudicación
- Si aplica entidad asociada, exige convenio de asociación y documentos legales
- Al guardar, la versión anterior se reemplaza o inactiva y se genera la nueva
- Si el convenio ya fue formalizado, la ficha queda bloqueada para edición

La interfaz debe ser clara, institucional y lista para servir como base de desarrollo.

### Escenario técnico corregido

1. El Representante de la Facultad Proponente accede al sistema.
2. El sistema solicita credenciales y ejecuta autenticación y doble factor.
3. El sistema valida permisos de edición y verifica que el proyecto se encuentre adjudicado.
4. El sistema muestra los proyectos ganadores disponibles para actualización.
5. El Representante selecciona el proyecto correspondiente.
6. El sistema carga la ficha de postulación base.
7. El Representante selecciona la opción Actualizar ficha para adjudicación.
8. El sistema valida si el convenio ya fue formalizado.
9. Si el convenio ya fue formalizado, el sistema bloquea la edición y deja la ficha en solo consulta.
10. Si la ficha puede editarse, el sistema habilita la actualización.
11. El Representante actualiza datos generales, financiamiento, alcance, cronograma y actividades.
12. El Representante confirma el tipo de participación del proyecto.
13. Si el proyecto aplica como entidad asociada, el Representante registra o confirma la entidad ejecutora externa.
14. El Representante adjunta el informe técnico y el documento de adjudicación.
15. Si corresponde, adjunta también convenio de asociación y documentos legales.
16. El Representante selecciona la opción Guardar y enviar.
17. El sistema valida la integridad de campos y documentos requeridos.
18. Si existen inconsistencias o faltantes, el sistema muestra observaciones y permite corrección.
19. Si la validación es conforme, el sistema guarda la actualización y reemplaza la versión anterior.
20. El sistema remite la ficha al Comité de Evaluación.
