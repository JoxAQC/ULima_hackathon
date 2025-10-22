# Validador de Progreso (Offline, TFLite)

Proyecto separado para validar evidencia fotográfica de misiones con modelos TFLite (MediaPipe Tasks Vision) 100% offline.

## Características
- Sube 1–3 imágenes, sin video.
- Carga un detector de objetos o clasificador (TFLite) local.
- Verifica componentes esperados por misión y calcula una confianza.
- Feedback automático ("Estructura correcta" o sugerencias puntuales).

## Requisitos
- Node 18+.

## Uso rápido
```powershell
cd validador-vision
npm install
npm run vision:prepare   # copia WASM/worker de MediaPipe a /public/mediapipe
npm run dev              # http://localhost:5175
```

Coloca tus modelos y etiquetas en:
```
public/models/horno_solar/model.tflite
public/models/horno_solar/labels.json
public/models/luz_botella/model.tflite
public/models/luz_botella/labels.json
```

> Importante: El proyecto no descarga nada en runtime. Los archivos WASM y los modelos residen localmente.

## Entrenar tu modelo TFLite
Tienes dos caminos recomendados:

### A) Clasificación de imágenes (rápido)
- Útil si quieres validar "¿la foto se parece a una guía de horno solar correcto?" sin partes específicas.
- Herramienta: TensorFlow Lite Model Maker (ImageClassifier)

Pasos (Python local o Colab, exportando `.tflite`):
```python
# pip install tflite-model-maker tensorflow==2.15.0
from tflite_model_maker import image_classifier, model_spec
from tflite_model_maker.image_classifier import DataLoader

# Estructura de carpetas:
# data/
#   horno_solar_ok/
#     img1.jpg ...
#   horno_solar_incorrecto/
#     imgX.jpg ...

data = DataLoader.from_folder('data')
train, test = data.split(0.8)
model = image_classifier.create(train, model_spec=model_spec.get('efficientnet_lite0'), validation_data=test, epochs=10)
model.export(export_dir='export', tflite_filename='model.tflite', label_filename='labels.txt')
```
Convierte `labels.txt` a `labels.json`:
```python
import json
labels = [l.strip() for l in open('export/labels.txt').read().splitlines()]
json.dump(labels, open('labels.json','w'), ensure_ascii=False)
```
Coloca `model.tflite` y `labels.json` en `public/models/<mission>/` y ajusta `CONFIGS` en `src/main.js` a `type: 'image_classification'`.

### B) Detección de objetos (ideal para verificar partes)
- Detecta componentes como `caja_carton`, `papel_aluminio`, `tapa_transparente`, `olla_oscura`.
- Herramienta: MediaPipe Model Maker (Object Detector) o TFOD + conversión a TFLite.

Ejemplo con MediaPipe Model Maker (Python):
```python
# pip install mediapipe-model-maker==0.1.0 tensorflow==2.15.0
from mediapipe_model_maker import object_detector

spec = object_detector.SupportedModels.EFFICIENTDET_LITE0
train_ds = object_detector.Dataset.from_coco(
    annotations_file='data/annotations_train.json',
    images_dir='data/images/train'
)
val_ds = object_detector.Dataset.from_coco(
    annotations_file='data/annotations_val.json',
    images_dir='data/images/val'
)
model = object_detector.create(train_ds, model_spec=spec, validation_data=val_ds, epochs=40)
model.export(export_dir='export')  # genera model.tflite y label_map
```
Convierte el `label_map` a `labels.json` (array de strings) si es necesario. Luego coloca los archivos en `public/models/<mission>/`.

## Qué fotos recolectar (guías y dataset)
Para cada misión, ten ejemplos variados (ángulos, luz, fondo), 200–500 imágenes totales si es posible.

- Horno Solar Casero:
  - Primer plano de la caja de cartón reforzada.
  - Interior forrado con papel aluminio brillante hacia adentro.
  - Tapa transparente (vidrio/acetato) instalada.
  - Olla oscura con tapa dentro del horno.
  - Variaciones: tamaños de caja, tipos de tapa, exteriores/interiores.

- Luz de Botella:
  - Botella PET transparente llena de agua (con 2–3 gotas de cloro por litro).
  - Orificio en techo/lámina con la botella instalada hasta la mitad.
  - Sellado con silicona o similar.
  - Botella limpia por fuera para máxima refracción.

Etiqueta con clases/objetos esperados:
- Horno: `caja_carton`, `papel_aluminio`, `tapa_transparente`, `olla_oscura`.
- Luz botella: `botella_pet`, `agua`, `sellado_techo`.

## Cómo funciona la validación
- Clasificación: usa las categorías y puntajes para decidir si la imagen es "ok" vs "incorrecta" o si contiene etiquetas requeridas.
- Detección: acumula la puntuación por objeto detectado; calcula confianza promedio vs thresholds por parte esperada.
- Resultado:
  - ✔ Estructura correcta (si todos los objetos clave superan el umbral).
  - ⚠ Validación parcial (lista de objetos faltantes o débiles con tips).

## Ajustes
- Edita `src/main.js` → `CONFIGS` para cambiar rutas, tipo de modelo y thresholds.
- Si cambias nombres de clases, ajusta el mapeo de consejos en `adviceFor()`.

## Offline total
- `npm run vision:prepare` copia los WASM/worker de MediaPipe a `public/mediapipe/`.
- Los modelos `.tflite` se leen desde `public/models/`.
- No hay llamadas a redes en runtime.
