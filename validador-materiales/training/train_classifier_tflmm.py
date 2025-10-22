import argparse
import json
from pathlib import Path

from tflite_model_maker import image_classifier, model_spec
from tflite_model_maker.image_classifier import DataLoader


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--data_dir', required=True, help='Carpeta con subcarpetas por clase')
    ap.add_argument('--epochs', type=int, default=10)
    ap.add_argument('--output_dir', default='export_cls')
    args = ap.parse_args()

    data = DataLoader.from_folder(args.data_dir)
    train, test = data.split(0.8)

    spec = model_spec.get('efficientnet_lite0')
    model = image_classifier.create(
        train,
        model_spec=spec,
        validation_data=test,
        epochs=args.epochs,
    )

    out = Path(args.output_dir)
    out.mkdir(parents=True, exist_ok=True)
    tflite_path = out / 'model.tflite'
    labels_txt = out / 'labels.txt'
    model.export(export_dir=str(out), tflite_filename=tflite_path.name, label_filename=labels_txt.name)

    # Convertir labels.txt a labels.json (array de strings)
    labels = [l.strip() for l in labels_txt.read_text(encoding='utf-8').splitlines() if l.strip()]
    (out / 'labels.json').write_text(json.dumps(labels, ensure_ascii=False, indent=2), encoding='utf-8')
    print('Exportado:', tflite_path, 'y labels.json')


if __name__ == '__main__':
    main()
