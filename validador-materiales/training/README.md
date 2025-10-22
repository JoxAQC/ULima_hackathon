# Entrenamiento de modelos (TFLite)

Esta carpeta contiene guías y scripts para crear modelos TFLite de:
- Clasificación de imágenes (rápido para empezar)
- Detección de objetos (ideal para validar partes clave)

Requiere Python 3.10–3.11 (sugerido) y virtualenv/conda.

## 0) Preparar entorno (elige 1 de 2)
Hay dos flujos con dependencias incompatibles entre sí, por eso dividimos en entornos separados:

- Detección de objetos (MediaPipe Model Maker): `requirements_det.txt`
- Clasificación (Keras + TFLite Converter): `requirements_cls.txt`

Ejemplos (Windows PowerShell):
```powershell
# Detección
python -m venv .venv_det
. .venv_det\Scripts\Activate.ps1
pip install --upgrade pip
pip install -r requirements_det.txt

# o Clasificación
python -m venv .venv_cls
. .venv_cls\Scripts\Activate.ps1
pip install --upgrade pip
pip install -r requirements_cls.txt
```

## 1) Clasificación de imágenes (rápido)
Estructura de datos esperada:
```
training/data_cls/
  horno_solar_ok/              # imágenes del horno construido correctamente
  horno_solar_incorrecto/      # imágenes incompletas/malas
```
Entrena y exporta con Keras (sin tflite-model-maker):
```powershell
# activa tu .venv_cls
python .\train_classifier_keras.py --data_dir .\data_cls --epochs 8 --output_dir .\export_cls
```
Resultados:
- `export_cls/model.tflite`
- `export_cls/labels.json` (generado del labels.txt)

Instala en la app:
- Copia `model.tflite` y `labels.json` a `validador-vision/public/models/horno_solar/`
- En `src/main.js` ajusta `CONFIGS.horno_solar.type = 'image_classification'`

## 2) Detección de objetos (ideal)
Etiquetado recomendado: LabelImg, Roboflow, Label Studio, MakeSense.ai. Exporta a formato COCO:
```
training/data_det/
  images/train/*.jpg
  images/val/*.jpg
  annotations_train.json   # COCO
  annotations_val.json     # COCO
```
Entrena y exporta con MediaPipe Model Maker:
```powershell
# activa tu .venv_det
python .\train_detector_mediapipe.py `
  --train_images .\data_det\images\train `
  --val_images .\data_det\images\val `
  --train_ann .\data_det\annotations_train.json `
  --val_ann .\data_det\annotations_val.json `
  --epochs 40 `
  --output_dir .\export_det
```
Resultados:
- `export_det/model.tflite`
- `export_det/labels.json` (array de strings)

Instala en la app:
- Copia `model.tflite` y `labels.json` a `validador-vision/public/models/horno_solar/`
- En `src/main.js` deja `CONFIGS.horno_solar.type = 'object_detection'`
- Ajusta `expected` y `thresholds` según tus clases (ej: `caja_carton`, `papel_aluminio`, `tapa_transparente`, `olla_oscura`).

## Consejos de dataset
- Variedad: ángulos, iluminación, fondos, tamaños.
- 200–500 imágenes totales por misión mejora mucho la generalización; si no puedes, arranca con 50–100 y crece.
- Balancea clases (similar cantidad por clase) o usa técnicas de data augmentation.

## Problemas comunes
- `tf` no encuentra GPU: está bien, CPU sirve (más lento).
- Error de compatibilidad de TensorFlow: usa Python 3.10–3.11 y TensorFlow==2.15.x.
- Valores de `thresholds` muy altos → baja la confianza.
- Clases mal nombradas: asegúrate que `labels.json` coincide con lo que esperas en `CONFIGS`.

## Agregar Metadata a un modelo COCO SSD (requerido por MediaPipe Tasks)
Si tienes un `detect.tflite` sin Metadata (error INVALID_ARGUMENT en el navegador), añade metadata con el script incluido:

```powershell
cd validador-vision/training
. .\.venv\Scripts\Activate.ps1   # si ya creaste el venv
pip install tflite-support==0.4.4
python .\add_coco_metadata.py `
  --model ..\public\models\coco_ssd_mobilenet_v1_1.0_quant_2018_06_29\detect.tflite `
  --labels ..\public\models\coco_ssd_mobilenet_v1_1.0_quant_2018_06_29\labelmap.txt `
  --output ..\public\models\coco_ssd_mobilenet_v1_1.0_quant_2018_06_29\detect_meta.tflite
```

Luego, en `src/main.js`, apunta `modelPath` a `detect_meta.tflite` o reemplaza el archivo original.
