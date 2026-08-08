# TinnitusLab

Aplicación web de terapia de sonido personalizada para tinnitus.

## Stack

- **Frontend**: Next.js 14 + Tailwind CSS — detector de frecuencia con Web Audio API + generador
- **Backend**: FastAPI (Python) — genera archivos WAV personalizados con scipy/numpy

## Desarrollo local

### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
NEXT_PUBLIC_API_URL=http://localhost:8000 npm run dev
```

Abrir http://localhost:3000

## Deploy en Railway

### Servicio 1 — Backend (FastAPI)

1. Nuevo servicio desde el directorio `/backend`
2. Railway detecta el `Dockerfile` automáticamente
3. Variables de entorno: ninguna requerida
4. Railway expone el servicio en una URL pública (ej: `https://tinnituslab-backend.up.railway.app`)

### Servicio 2 — Frontend (Next.js)

1. Nuevo servicio desde el directorio `/frontend`
2. Railway detecta el `Dockerfile`
3. Variable de entorno:
   ```
   NEXT_PUBLIC_API_URL=https://tinnituslab-backend.up.railway.app
   ```

## Tipos de audio generados

| Tipo | Descripción | Uso |
|------|-------------|-----|
| `pink_noise` | Ruido rosa con notch | Fondo, trabajo |
| `am_tones` | Banco de tonos AM | Sesiones dedicadas |
| `brown_noise` | Ruido marrón con notch | Noche, dormir |
| `binaural_40hz` | Binaural gamma 40 Hz estéreo | Neuroplasticidad |
| `binaural_10hz` | Binaural alpha 10 Hz estéreo | Relajación |
| `chirp_sweep` | Sweep de frecuencias | Variación |

## API

```
POST /generate
{
  "frequency": 4000,
  "type": "pink_noise",
  "duration_minutes": 30,
  "notch_bandwidth": 500,
  "modulation_freq": 10
}
→ WAV 44100 Hz 16-bit
```
