## 4) Actualizar ficha para adjudicación

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
Diseña una pantalla web low-fidelity para el caso de uso **"Actualizar ficha para adjudicación"** dentro de un sistema institucional de gestión de proyectos concursables.
La pantalla debe representar la actualización de una ficha de postulación ya registrada **luego de la adjudicación** del proyecto, incorporando el **documento de adjudicación** y permitiendo ajustes finales antes de la formalización definitiva.

Debe incluir:
- Header institucional
- Breadcrumb
- Título de pantalla: **"Actualizar ficha para adjudicación"**
- Cabecera con **código de ficha, versión, estado del proyecto y tipo de participación**
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
- Solo aplica a proyectos **adjudicados**
- Parte de la **ficha base** ya registrada
- Permite actualizar datos generales, **financiamiento, cronograma y alcance**
- Obliga a cargar el **documento de adjudicación**
- Si aplica entidad asociada, exige **convenio de asociación** y **documentos legales**
- Al guardar, la versión anterior se **reemplaza o inactiva** y se genera la nueva
- Si el convenio ya fue **formalizado**, la ficha queda **bloqueada** para edición

La interfaz debe ser clara, institucional y lista para servir como base de desarrollo.

---

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
