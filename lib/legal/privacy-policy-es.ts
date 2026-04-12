/**
 * Texto canónico (ES) de la política de privacidad — OL-PRIVACY-001.
 * Mantener alineado con el comportamiento real de la app (geoloc, auth, Mapbox, Supabase).
 */

export type PrivacySection = { title: string; paragraphs: string[] };

/** Fecha de última actualización del documento (ISO visual). */
export const PRIVACY_POLICY_LAST_UPDATED_ES = '12 de abril de 2026';

export const PRIVACY_POLICY_SECTIONS_ES: PrivacySection[] = [
  {
    title: '1. Quiénes somos',
    paragraphs: [
      'FLOWYA es una aplicación para descubrir, guardar y organizar lugares en un mapa. Esta política describe cómo tratamos información personal y datos técnicos en la versión actual del servicio.',
    ],
  },
  {
    title: '2. Geolocalización',
    paragraphs: [
      'La ubicación del dispositivo se usa solo en el cliente para mejorar la experiencia: por ejemplo, centrar el mapa, calcular distancias aproximadas o ofrecer la acción «Mi ubicación».',
      'No guardamos tu posición como dato de perfil en nuestros servidores por el hecho de usar el mapa. Las coordenadas obtenidas con la API de geolocalización del navegador o del sistema operativo permanecen en el dispositivo salvo que una función explícita envíe otro tipo de dato (por ejemplo, al crear un lugar elijas guardar unas coordenadas concretas como parte del spot).',
      'El permiso de ubicación se solicita de forma acorde a la plataforma: en la web, típicamente cuando eliges usar «Mi ubicación» o una acción equivalente. Si ya concediste el permiso antes, la app puede obtener la posición al cargar sin volver a mostrar el diálogo del sistema.',
    ],
  },
  {
    title: '3. Cuenta y acceso (correo electrónico)',
    paragraphs: [
      'Para guardar datos asociados a tu usuario utilizamos autenticación basada en correo electrónico mediante enlace mágico (sin contraseña almacenada en FLOWYA). El tratamiento del correo y de la sesión lo realiza nuestro proveedor de autenticación (Supabase Auth) según su rol de procesador.',
      'Usamos tu correo únicamente para validar el acceso y comunicaciones necesarias del servicio (por ejemplo, el enlace de inicio de sesión).',
    ],
  },
  {
    title: '4. Mapas y Mapbox',
    paragraphs: [
      'Los mapas se renderizan con Mapbox. Al usar el mapa, el cliente descarga teselas y puede realizar peticiones de geocodificación o búsqueda según las funciones que actives. Esas peticiones pueden incluir texto de búsqueda o coordenadas necesarias para el servicio de mapas.',
      'Mapbox actúa como proveedor externo; consulta también su política de privacidad si necesitas detalle sobre tratamiento en su lado.',
    ],
  },
  {
    title: '5. Datos de tus lugares (backend)',
    paragraphs: [
      'Los spots, pins, imágenes asociadas y metadatos que guardas se almacenan en nuestra base de datos (Supabase), con acceso protegido por las reglas de seguridad configuradas para la aplicación.',
    ],
  },
  {
    title: '6. Almacenamiento local y cookies',
    paragraphs: [
      'La aplicación puede usar almacenamiento local del dispositivo (por ejemplo, preferencias o caché de sesión) para que la experiencia funcione sin tener que repetir ciertos pasos.',
      'En el navegador, el almacenamiento puede realizarse mediante mecanismos como localStorage o equivalentes según la plataforma. No utilizamos cookies de publicidad de terceros para seguimiento entre sitios en la versión actual de la app.',
    ],
  },
  {
    title: '7. Analítica',
    paragraphs: [
      'La versión actual de la aplicación cliente no integra herramientas de analítica de terceros (por ejemplo, píxeles de medición de audiencia publicitaria). Si esto cambiara, actualizaremos esta política antes de activar mediciones nuevas.',
    ],
  },
  {
    title: '8. Conservación y seguridad',
    paragraphs: [
      'Aplicamos medidas técnicas razonables (incluidas reglas de acceso en base de datos y comunicaciones cifradas con proveedores) para proteger la información. Los datos se conservan mientras mantengas tu cuenta y el uso del servicio lo requieran, salvo obligación legal distinta.',
    ],
  },
  {
    title: '9. Cambios',
    paragraphs: [
      'Podemos actualizar esta política cuando cambien las funciones de la app o la normativa aplicable. La fecha de la última revisión aparece al inicio del documento en la app.',
    ],
  },
  {
    title: '10. Contacto',
    paragraphs: [
      'Para dudas sobre privacidad puedes usar el canal de feedback disponible en la aplicación (por ejemplo, desde el modal «FLOWYA (beta)» en Explorar).',
    ],
  },
];
