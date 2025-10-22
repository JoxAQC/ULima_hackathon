import argparse
import json
from pathlib import Path

from mediapipe_model_maker import object_detector


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--train_images', required=True)
    ap.add_argument('--val_images', required=True)
    ap.add_argument('--train_ann', required=True, help='COCO JSON con anotaciones de train')
    ap.add_argument('--val_ann', required=True, help='COCO JSON con anotaciones de val')
    ap.add_argument('--epochs', type=int, default=40)
    ap.add_argument('--output_dir', default='export_det')
    args = ap.parse_args()

    out = Path(args.output_dir)
    out.mkdir(parents=True, exist_ok=True)

    train_ds = object_detector.Dataset.from_coco(
        annotations_file=args.train_ann,
        images_dir=args.train_images,
    )
    val_ds = object_detector.Dataset.from_coco(
        annotations_file=args.val_ann,
        images_dir=args.val_images,
    )

    spec = object_detector.SupportedModels.EFFICIENTDET_LITE0
    model = object_detector.create(
        train_ds,
        model_spec=spec,
        validation_data=val_ds,
        epochs=args.epochs,
    )

    model.export(export_dir=str(out))  # genera model.tflite y label_map

    # Intentar construir labels.json desde el label_map.txt si existe
    # Algunos exports incluyen label_map.txt o label_map.json
    label_json = out / 'labels.json'
    if not label_json.exists():
        # buscar archivos con 'label' en el nombre
        cand = None
        for p in out.iterdir():
            if 'label' in p.name.lower() and p.suffix in {'.txt', '.json'}:
                cand = p
                break
        labels = []
        if cand and cand.suffix == '.json':
            try:
                obj = json.loads(cand.read_text(encoding='utf-8'))
                if isinstance(obj, dict) and 'labels' in obj:
                    labels = obj['labels']
                elif isinstance(obj, list):
                    labels = obj
            except Exception:
                pass
        elif cand and cand.suffix == '.txt':
            for line in cand.read_text(encoding='utf-8').splitlines():
                line = line.strip()
                if not line:
                    continue
                # Soporta formato "id: name" o solo "name"
                if ':' in line:
                    name = line.split(':', 1)[1].strip()
                else:
                    name = line
                labels.append(name)
        if labels:
            label_json.write_text(json.dumps(labels, ensure_ascii=False, indent=2), encoding='utf-8')
            print('labels.json generado en', label_json)
        else:
            print('No se generó labels.json automáticamente, crea uno manualmente (array de strings).')

    print('Export completo en', out)


if __name__ == '__main__':
    main()
