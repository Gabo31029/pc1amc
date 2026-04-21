## 3) Actualizar ficha para asociación

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
- Incluir nombres reales de **secciones**, **campos**, **historial**, **botones** y **acciones**.
- Layout claro con **header**, **breadcrumb**, cabecera de ficha, formulario, **acciones** y **mensajes del sistema**.

#### Prompt específico
Diseña una pantalla web low-fidelity para el caso de uso **"Actualizar ficha para asociación"** dentro de un sistema institucional de gestión de proyectos concursables.
La pantalla debe representar la actualización de una ficha de postulación ya registrada para incorporar o modificar la participación de una **entidad externa asociada**.

Debe incluir:
- Header institucional
- Breadcrumb
- Título de pantalla: **"Actualizar ficha para asociación"**
- Cabecera con **código de ficha, versión actual y estado**
- Sección de datos generales del proyecto
- Sección de datos de la entidad externa asociada
- Sección de tipo de participación
- Sección de documento de asociación
- Área de carga de archivos **PDF**
- Sección de historial de versiones
- Botón **"Guardar actualización"**
- Botón **"Cancelar"**
- Mensajes de validación
- Mensaje de confirmación de **nueva versión**

Condiciones funcionales a reflejar:
- La pantalla parte de una **ficha base** ya registrada
- Debe permitir modificar datos del proyecto vinculados a la **asociación**
- Debe registrar o actualizar la información de la **entidad externa asociada**
- Debe adjuntar el **documento de asociación**
- Al guardar, la **versión anterior se inactiva** y se genera una **nueva versión**
- Si el contrato ya fue firmado, la ficha debe mostrarse en **solo lectura** o **bloqueada**
- Mostrar claramente que la actualización ocurre **antes de la adjudicación final**

Usa una interfaz académica, sobria, en escala de grises y lista para ser implementada.

---

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
