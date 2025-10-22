import argparse
import sys
from pathlib import Path

# 1) Intentar usar los módulos locales que agregaste (metadata_writers/ ...)
LOCAL_OK = False
try:
    here = Path(__file__).resolve().parent
    sys.path.append(str(here))
    from metadata_writers import object_detector, writer_utils  # type: ignore
    LOCAL_OK = True
except Exception:
    LOCAL_OK = False

# 2) Si no están los locales, intentar con tflite-support oficial
TF_SUPPORT_OK = False
if not LOCAL_OK:
    try:
        from tflite_support.metadata_writers import object_detector, writer_utils  # type: ignore
        TF_SUPPORT_OK = True
    except Exception:
        TF_SUPPORT_OK = False


def main():
    ap = argparse.ArgumentParser(description='Adjunta TFLite Model Metadata a un modelo de detección COCO SSD.')
    ap.add_argument('--model', help='detect.tflite original (sin metadata)')
    ap.add_argument('--labels', help='labelmap.txt o labels.txt (una etiqueta por línea)')
    ap.add_argument('--output', help='ruta de salida detect_meta.tflite')
    args = ap.parse_args()

    # Defaults a la carpeta del proyecto si no se pasan argumentos
    root = Path(__file__).resolve().parents[1]
    default_dir = root / 'public' / 'models' / 'coco_ssd_mobilenet_v1_1.0_quant_2018_06_29'
    model_file = Path(args.model) if args.model else (default_dir / 'detect.tflite')
    label_file = Path(args.labels) if args.labels else (default_dir / 'labelmap.txt')
    out_file = Path(args.output) if args.output else (default_dir / 'detect_meta.tflite')

    if not (LOCAL_OK or TF_SUPPORT_OK):
        raise SystemExit('No se encontraron los módulos de metadata. Usa las carpetas locales (metadata_writers/) o instala: pip install tflite-support==0.4.4')

    if not model_file.exists():
        raise SystemExit(f"No existe el modelo: {model_file}")
    if not label_file.exists():
        raise SystemExit(f"No existe el archivo de etiquetas: {label_file}")

    # --- Crea el escritor de metadata para object detection ---
    writer = object_detector.MetadataWriter.create_for_inference(
        model_buffer=model_file.read_bytes(),
        input_norm_mean=[127.5],
        input_norm_std=[127.5],
        label_file_paths=[str(label_file)]
    )

    # --- Escribe metadata y archivo asociado ---
    tflite_with_md = writer.populate()
    writer_utils.save_file(tflite_with_md, str(out_file))

    print(f"✅ Metadata escrita correctamente en: {out_file}")
    print("Puedes apuntar tu app a:", out_file)


if __name__ == '__main__':
    main()
