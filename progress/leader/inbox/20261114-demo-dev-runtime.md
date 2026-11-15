# Evidencia runtime root — DEV y DEMO

Root detuvo únicamente Vite anterior PID verificado 126543 y lanzó desde admin_web_app los comandos npm run dev y npm run demo sin overrides de entorno. Ambos ready y HTTP200 en localhost5173/5174. Se leyó /src/services/services.ts servido y se parseó import.meta.env entero (no solo define expresión): 5173 MODE=dev VITE_SERVICE_MODE=http API localhost3000/api/v1; 5174 MODE=demo VITE_SERVICE_MODE=mock. No se imprimieron otras variables/claves del bundle. API health200. Procesos activos, no iniciar duplicados.

Cua Chrome detecta tabs usuario en ambos puertos pero getTab sigue fallando timeoutMs interno; no acreditar comparación visual ni login físico nuevo. Usuario comparará ambos. Esta evidencia permite revisión de configuración efectiva runtime, sin claim navegador. Consolidar evidencia útil al cerrar y consumir inbox.

Comprobación real de puerto ocupado por root: ejecutar segundo npm run dev exit1 «Port 5173 is already in use»; segundo npm run demo exit1 «Port 5174 is already in use». Ambos procesos originales permanecen activos. Se demuestra strictPort real, no sólo configuración.
