# tirusmo

<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1G8O0cKTkAUoJbiUcqJTGE8QGHVtU5okk

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. (Opcional) Para el autocompletado de ubicación al editar hoteles en el admin, añade `VITE_GOOGLE_MAPS_API_KEY` en `.env` o `.env.local`. Sin esta clave, "Mi ubicación" sigue funcionando (usa Nominatim).
4. **Producción:** Para que el mapa y el autocompletado se vean en producción, configura en tu plataforma de despliegue la variable `VITE_GOOGLE_MAPS_API_KEY` y vuelve a desplegar. Ver [docs/despliegue.md](docs/despliegue.md).
5. Run the app:
   `npm run dev`
