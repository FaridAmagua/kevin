# Guardado de leads en Google Sheets

El formulario envia un JSON con el email normalizado como `id`. Ese email se usa como clave unica para no duplicar clientes.

## Opcion recomendada con n8n

1. Crea un Webhook en n8n.
2. En el workflow, busca el email en la hoja de Google Sheets.
3. Si existe, actualiza la fila.
4. Si no existe, crea una fila nueva.
5. Devuelve un `200` con JSON, por ejemplo `{ "ok": true }`. Activa CORS en el webhook si tu n8n lo requiere.
6. Pega la URL del webhook en `LEAD_WEBHOOK_URL` dentro de `calorias/calorias.js`.

## Opcion directa con Google Apps Script

1. Abre la hoja:
   `https://docs.google.com/spreadsheets/d/1znXYf7TIj78cdJoakJ4oEJtj8g33sjSuJk797CgYK_c/edit`
2. Ve a `Extensiones > Apps Script`.
3. Pega el contenido de `apps-script-upsert.gs`.
4. Despliega como `Aplicacion web`.
5. Configura:
   `Ejecutar como: tu usuario`
   `Quien tiene acceso: cualquiera`
6. Copia la URL `/exec` y pegala en `LEAD_WEBHOOK_URL`.

Con Apps Script directo, el navegador envia la peticion en modo compatible con CORS y no puede leer la respuesta. Si necesitas confirmar al 100% que Google Sheets guardo antes de pasar a resultado, usa n8n como endpoint intermedio.

Columnas esperadas:

`id, email, name, age, gender, height, weight, activity, maintenance, loss, gain, source, createdAt, updatedAt`
