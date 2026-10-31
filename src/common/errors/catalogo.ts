// Catálogo público del contrato v1.1.
export const CATALOGO = {
  JSON_INVALIDO: {
    estado: 400,
    mensaje:
      "La información enviada no tiene un formato válido. Vuelve a intentarlo desde el formulario.",
  },
  DATOS_INVALIDOS: {
    estado: 400,
    mensaje: "Revisa los datos señalados antes de continuar.",
  },
  CAMPO_OBLIGATORIO: {
    estado: 400,
    mensaje: "Completa los campos obligatorios.",
  },
  FORMATO_INVALIDO: {
    estado: 400,
    mensaje: "Uno o más datos tienen un formato incorrecto.",
  },
  FECHA_INVALIDA: {
    estado: 400,
    mensaje: "Ingresa una fecha válida.",
  },
  IDENTIFICADOR_INVALIDO: {
    estado: 400,
    mensaje: "El identificador del registro no es válido.",
  },
  TEXTO_DEMASIADO_LARGO: {
    estado: 400,
    mensaje: "El texto supera la longitud permitida.",
  },
  CAMPO_NO_PERMITIDO: {
    estado: 400,
    mensaje: "La solicitud contiene campos que esta operación no admite.",
  },
  SOLICITUD_INCOMPLETA: {
    estado: 400,
    mensaje: "Faltan datos para completar la operación.",
  },
  SOLICITUD_SIN_CAMBIOS: {
    estado: 400,
    mensaje: "Modifica al menos un dato antes de guardar.",
  },
  FILTROS_INVALIDOS: {
    estado: 400,
    mensaje: "Revisa los filtros de búsqueda.",
  },
  FECHAS_INCOMPATIBLES: {
    estado: 422,
    mensaje: "La fecha final no puede ser anterior a la fecha inicial.",
  },
  REGISTRO_NO_ENCONTRADO: {
    estado: 404,
    mensaje: "No se encontró el registro solicitado.",
  },
  ARCHIVO_NO_ENCONTRADO: {
    estado: 404,
    mensaje: "No se encontró el archivo solicitado.",
  },
  REGISTRO_DUPLICADO: {
    estado: 409,
    mensaje:
      "Ya existe un registro con estos datos. Revisa el registro existente antes de continuar.",
  },
  VERSION_DESACTUALIZADA: {
    estado: 409,
    mensaje:
      "Otra persona modificó este registro. Vuelve a consultarlo antes de guardar.",
  },
  RELACION_INCOMPATIBLE: {
    estado: 409,
    mensaje:
      "Los registros seleccionados no corresponden entre sí. Revisa tu selección.",
  },
  ESTADO_NO_PERMITIDO: {
    estado: 409,
    mensaje: "El estado actual del registro no permite realizar esta acción.",
  },
  FORMULARIO_NO_CONFIRMADO: {
    estado: 409,
    mensaje: "Confirma el formulario antes de registrar un seguimiento.",
  },
  FORMULARIO_YA_CONFIRMADO: {
    estado: 409,
    mensaje: "El formulario ya está confirmado.",
  },
  REGISTRO_INACTIVO: {
    estado: 409,
    mensaje:
      "Este registro está inactivo. Debe reactivarse antes de realizar esta acción.",
  },
  REGISTRO_ANULADO: {
    estado: 409,
    mensaje: "Este registro está anulado. No se puede realizar esta acción.",
  },
  INSCRIPCION_REQUERIDA: {
    estado: 409,
    mensaje:
      "El niño o la niña debe estar inscrito en Guardería para realizar esta acción.",
  },
  ESTANCIA_ACTIVA_EXISTENTE: {
    estado: 409,
    mensaje: "La beneficiaria ya tiene una estancia activa.",
  },
  SALIDA_TEMPORAL_EXISTENTE: {
    estado: 409,
    mensaje:
      "La beneficiaria ya tiene una salida temporal pendiente de retorno.",
  },
  SALIDA_TEMPORAL_NO_EXISTENTE: {
    estado: 409,
    mensaje: "No hay una salida temporal pendiente para registrar el retorno.",
  },
  ESTANCIA_FINALIZADA: {
    estado: 409,
    mensaje:
      "La estancia ya finalizó. No se pueden registrar nuevos movimientos.",
  },
  OPERACION_EN_PROCESO: {
    estado: 409,
    mensaje:
      "Esta operación ya está en proceso. Espera antes de volver a intentarla.",
  },
  ARCHIVO_REQUERIDO: {
    estado: 400,
    mensaje: "Selecciona un archivo PDF para continuar.",
  },
  ARCHIVO_VACIO: {
    estado: 400,
    mensaje: "El archivo seleccionado está vacío. Selecciona otro PDF.",
  },
  TIPO_CONTENIDO_NO_ADMITIDO: {
    estado: 415,
    mensaje: "El formato de la solicitud no es compatible con esta operación.",
  },
  TIPO_ARCHIVO_NO_PERMITIDO: {
    estado: 415,
    mensaje: "Solo se permiten archivos PDF.",
  },
  ARCHIVO_DEMASIADO_GRANDE: {
    estado: 413,
    mensaje: "El archivo supera el tamaño máximo permitido de 20 MiB.",
  },
  PDF_INVALIDO: {
    estado: 422,
    mensaje:
      "No se pudo leer el PDF. Comprueba que el archivo sea válido y vuelve a intentarlo.",
  },
  PDF_PROTEGIDO: {
    estado: 422,
    mensaje:
      "El PDF está protegido con contraseña. Selecciona una copia sin contraseña.",
  },
  VERSION_DOCUMENTAL_DESACTUALIZADA: {
    estado: 409,
    mensaje:
      "El documento tiene una versión más reciente. Vuelve a consultarlo antes de cargar otra versión.",
  },
  DOCUMENTO_ANULADO: {
    estado: 409,
    mensaje: "El documento está anulado y esta acción no está disponible.",
  },
  ALMACENAMIENTO_NO_DISPONIBLE: {
    estado: 503,
    mensaje:
      "No se puede acceder al servicio de documentos en este momento. Inténtalo más tarde.",
  },
  INTEGRIDAD_DOCUMENTO_NO_VERIFICADA: {
    estado: 500,
    mensaje:
      "No se pudo verificar la integridad del documento. Comunícate con soporte e indica el número de solicitud.",
  },
  AUTENTICACION_REQUERIDA: {
    estado: 401,
    mensaje: "Inicia sesión para continuar.",
  },
  SESION_VENCIDA: {
    estado: 401,
    mensaje: "Tu sesión venció. Inicia sesión nuevamente.",
  },
  CREDENCIALES_INVALIDAS: {
    estado: 401,
    mensaje: "No se pudo iniciar sesión. Revisa tus datos de acceso.",
  },
  ACCESO_DENEGADO: {
    estado: 403,
    mensaje: "No tienes permiso para realizar esta acción.",
  },
  AREA_NO_AUTORIZADA: {
    estado: 403,
    mensaje: "Esta operación no está disponible para tu área.",
  },
  CASO_NO_AUTORIZADO: {
    estado: 403,
    mensaje:
      "No tienes permiso para realizar esta operación en el caso seleccionado.",
  },
  COORDINACION_REQUERIDA: {
    estado: 403,
    mensaje: "Esta acción requiere permisos de coordinación del área.",
  },
  ENLACE_RECUPERACION_INVALIDO: {
    estado: 400,
    mensaje:
      "El enlace de recuperación no es válido o ya venció. Solicita uno nuevo.",
  },
  DEMASIADOS_INTENTOS: {
    estado: 429,
    mensaje:
      "Se realizaron demasiados intentos. Espera antes de volver a intentarlo.",
  },
  SOLICITUD_RECHAZADA: {
    estado: 400,
    mensaje:
      "No se pudo completar la solicitud. Revisa los datos o comunícate con soporte e indica el número de solicitud.",
  },
  FORMATO_RESPUESTA_NO_ADMITIDO: {
    estado: 406,
    mensaje:
      "La operación no puede entregar la información en el formato solicitado.",
  },
  SOLICITUD_NO_COMPLETADA_A_TIEMPO: {
    estado: 408,
    mensaje:
      "No se terminó de recibir la solicitud a tiempo. Verifica su estado antes de volver a enviarla.",
  },
  CLAVE_OPERACION_REUTILIZADA: {
    estado: 409,
    mensaje:
      "Esta solicitud reutiliza un identificador de operación con datos diferentes. Revisa la operación antes de continuar.",
  },
  CONDICION_ACTUALIZACION_NO_CUMPLIDA: {
    estado: 412,
    mensaje:
      "El registro ya no cumple las condiciones para este cambio. Vuelve a consultarlo antes de guardar.",
  },
  PROCESAMIENTO_FALLIDO: {
    estado: 500,
    mensaje:
      "No se pudo completar el procesamiento. Comunícate con soporte e indica el número de solicitud.",
  },
  RESPUESTA_SERVICIO_INVALIDA: {
    estado: 502,
    mensaje:
      "Un servicio necesario devolvió una respuesta no válida. Inténtalo más tarde.",
  },
  RESULTADO_OPERACION_INCIERTO: {
    estado: 503,
    mensaje:
      "No se pudo confirmar si la operación se completó. Consulta su estado antes de volver a enviarla.",
  },
  RUTA_NO_ENCONTRADA: {
    estado: 404,
    mensaje: "No se encontró la operación solicitada.",
  },
  METODO_NO_PERMITIDO: {
    estado: 405,
    mensaje: "La operación solicitada no admite esta acción.",
  },
  OPERACION_RETIRADA: {
    estado: 410,
    mensaje:
      "Esta operación ya no está disponible. Actualiza la página o comunícate con soporte.",
  },
  SOLICITUD_DEMASIADO_GRANDE: {
    estado: 413,
    mensaje: "La información enviada supera el tamaño permitido.",
  },
  DEMASIADAS_SOLICITUDES: {
    estado: 429,
    mensaje:
      "Se realizaron demasiadas solicitudes. Espera un momento antes de continuar.",
  },
  SERVICIO_NO_DISPONIBLE: {
    estado: 503,
    mensaje:
      "El servicio no está disponible temporalmente. Inténtalo más tarde.",
  },
  BASE_DATOS_NO_DISPONIBLE: {
    estado: 503,
    mensaje:
      "No se puede consultar ni guardar información en este momento. Inténtalo más tarde.",
  },
  CONFIGURACION_INCOMPLETA: {
    estado: 503,
    mensaje:
      "Esta función todavía no está disponible. Comunícate con la persona administradora.",
  },
  TIEMPO_ESPERA_AGOTADO: {
    estado: 504,
    mensaje:
      "La operación está tardando más de lo esperado. Consulta su estado antes de volver a enviarla.",
  },
  ERROR_INTERNO: {
    estado: 500,
    mensaje:
      "Ocurrió un problema inesperado. Comunícate con soporte e indica el número de solicitud.",
  },
} as const;
export type CodigoError = keyof typeof CATALOGO;
