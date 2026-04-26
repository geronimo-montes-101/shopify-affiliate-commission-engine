

![][image1]  
**Shopify App Developer / Prueba técnica**

---

## **¡Bienvenido/a a la prueba técnica\!** 

Felicidades por avanzar a esta etapa de nuestro proceso de selección en **Converxity**. Este reto ha sido diseñado para permitirnos evaluar y entender a profundidad tu nivel de conocimiento técnico, tu criterio arquitectónico y la madurez necesaria para desempeñar este rol estratégico en nuestro equipo. Queremos ver cómo piensas, cómo estructuras tus soluciones y cómo resuelves problemas reales del ecosistema de Shopify en un entorno de producción.

---

# **Shopify App**  **Affiliate & Commission Engine**

**Modalidad:** Take-home (Tiempo estimado: 10-14 horas de trabajo efectivo)  
**Enfoque:** Arquitectura, Modern Stack 2026, Billing Complejo y DevOps.

## **1\. Objetivo de la Aplicación**

El objetivo es construir el MVP de una aplicación de Afiliados para Shopify. Esta herramienta debe permitir a los comerciantes crear campañas y rastrear ventas mediante enlaces de afiliados.

Como modelo de monetización del sistema, la aplicación cobrará al comerciante una comisión (tarifa de servicio) por el uso de nuestra infraestructura tecnológica, la cual será calculada con base en cada venta referida.

## **2\. Stack Tecnológico Obligatorio**

* **Framework:** React Router.  
* **Lenguaje:** TypeScript.  
* **Frontend:** React \+ Polaris \+ Shopify App Bridge.  
* **Base de Datos:** SQLite \+ Prisma.  
* **Infraestructura:** Desarrollo Local.

## **3\. Requerimientos Funcionales (El Reto)**

### **A. Panel Administrativo (Merchant Admin)**

Desarrollar una interfaz en el Admin de Shopify usando componentes de **Polaris** que permita:

1. **Dashboard:** Ver métricas simples (Total de ventas referidas, Total de comisiones generadas para la App, Total de comisiones a pagar a afiliados).  
2. **Gestión de Afiliados:** CRUD de afiliados. Cada afiliado debe tener un identificador único (ej: `TIENDASMART`).  
3. **Configuración de Comisión del Afiliado:** El comerciante define qué porcentaje de la venta se le pagará al afiliado por cada venta.

### **B. Captura de Tráfico (Tracking Inicial)**

Para que el sistema funcione, debemos saber qué afiliado trajo al cliente.

* La aplicación debe detectar cuando un cliente visita la tienda a través de un enlace de afiliado (ej. `midominio.com/?ref=TIENDASMART2026`).  
* Debes persistir este identificador de afiliado en la sesión del usuario (Client-side) para que el dato esté disponible durante todo el proceso de compra.

### **C. Tracking de Conversiones**

**Punto Crítico:** No usar ScriptTags (Legacy).

* Debes implementar una extensión de tipo **Web Pixel** dentro de la app.  
* Este píxel debe suscribirse al evento estándar `checkout_completed`.  
* **Lógica Solicitada:** Al finalizar una compra, el píxel debe recuperar el identificador de afiliado persistido (del paso 3.B) y enviar un reporte detallado de la venta (incluyendo el total de la orden) al backend de la app.

### **D. Sistema de Facturación (Billing API & Usage Charges)**

La monetización de nuestra infraestructura es clave para la viabilidad del producto.

* Al instalar, la app debe solicitar al merchant un plan "Capped Amount" (Monto máximo mensual, ej: $100 USD).  
* **Regla de Negocio:** La aplicación cobra una tarifa de servicio fija del **5%** sobre el total de cada venta referida.  
* **Lógica Solicitada:** En el momento en que el backend reciba el evento de conversión proveniente del Web Pixel (paso 3.C), debe calcular el 5% del total de esa venta y crear inmediatamente un **UsageRecord** mediante GraphQL en la suscripción activa de la tienda.  
  * *Ejemplo:* Si la venta referida fue de $100, se debe crear un cargo de uso de $5 USD.

### **E. Infraestructura y DevOps (Sustentación Teórica)**

Queremos conocer tu flujo de trabajo profesional. Dado que la prueba es de ejecución local, te pedimos que **sustentes en tu README.md** lo siguiente:

* **Gestión de Entornos:** ¿Cómo manejas el ciclo de vida del desarrollo (ambientes de `dev`, `staging` y `prod`)? Explica tu estrategia tanto a nivel de infraestructura como en la gestión de la App dentro del Partner Dashboard.  
* **Pipelines de CI/CD:** ¿Qué pasos incluirías en un workflow de GitHub Actions (o similar) antes de realizar un despliegue seguro a producción?  
* **Estrategia de Despliegue:** ¿Cómo configurarías el entorno (ej. docker, variables de entorno, manejo de secretos) para desplegar esta app y su base de datos en un VPS, infraestructura Cloud o plataformas Serverless (ej. Vercel, AWS Lambda, Fly.io, Render)?  
* **Arquitectura de Base de Datos:** Explica y justifica tu esquema de base de datos actual. ¿Cómo garantizarías la integridad de los datos ante picos de tráfico? ¿Qué cambios realizarías al migrar de SQLite a una base de datos de producción (PostgreSQL, MongoDB u otra) para soportar el almacenamiento y consulta de millones de eventos de tracking?

## **4\. Requerimientos No Funcionales (Criterios de Evaluación Senior)**

1. **Seguridad y Validaciones:** Validación estricta de integridad en las comunicaciones con el backend (firmas de seguridad) y sanitización de inputs.  
2. **Manejo de Errores GraphQL:** La API de Shopify tiene límites (rate limits). Debes demostrar cómo manejas el *Throttling* (reintentos, colas o leaky bucket).  
3. **Git Flow:** Uso de **Trunk-based development** o Feature Branch workflow.  
4. **Escalabilidad Teórica (Alta Concurrencia):** Aunque construyas un MVP local con SQLite, queremos que tus decisiones arquitectónicas contemplen un escenario real de producción: **la app instalada en más de 1,000 tiendas, procesando picos de miles de eventos y transacciones por minuto** (ej. durante un Black Friday).

## **5\. Entregables y Envío**

Para completar tu entrega, por favor envía la información solicitada **respondiendo directamente al hilo de correo electrónico donde recibiste esta prueba técnica**. La respuesta debe incluir:

1. **Enlace al Repositorio de GitHub:** Debe ser público y contener el código fuente completo y funcional.  
2. **Archivo `README.md` detallado con:**  
   * **Instrucciones:** Pasos claros para la instalación y ejecución local.  
   * **Decisiones de Arquitectura:** ¿Por qué elegiste esa estructura? ¿Qué alternativas consideraste y por qué las descartaste? ¿Cómo manejaste la asincronía y la **idempotencia** en el procesamiento de eventos de facturación? ¿Cómo adaptarías tu solución para soportar la alta concurrencia mencionada en el punto 4?  
   * **Sustentación de Base de Datos:** Justificación técnica del esquema de datos. ¿Cómo garantizas la integridad y rapidez de las consultas bajo carga? ¿Qué estrategia de indexación o particionamiento sugerirías para manejar millones de registros de eventos? ¿Cómo manejarías la consistencia de datos entre el reporte del Pixel y la creación del cargo de facturación?  
   * **Sustentación de DevOps:** Respuestas a las preguntas planteadas en la sección 3.E, incluyendo cómo manejarías la rotación de secretos y el monitoreo de salud (health checks).  
3. **Video corto (Loom/YouTube oculto) de 3 a 5 minutos:**  
   * Demostración de la aplicación funcionando (creación de afiliado, simulación de compra y generación del cobro).  
   * Explicación breve de tus decisiones más críticas para garantizar la robustez, seguridad y escalabilidad en un entorno productivo.

[image1]: <data:image/png;base64,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>