import argparse
import json
from pathlib import Path

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--input', required=True, help='labels.txt, label_map.txt o JSON')
    ap.add_argument('--output', required=True, help='ruta a labels.json')
    args = ap.parse_args()

    path = Path(args.input)
    if not path.exists():
        raise SystemExit('No existe ' + str(path))

    labels = []
    if path.suffix.lower() == '.json':
        obj = json.loads(path.read_text(encoding='utf-8'))
        if isinstance(obj, dict) and 'labels' in obj:
            labels = obj['labels']
        elif isinstance(obj, list):
            labels = obj
    else:
        for line in path.read_text(encoding='utf-8').splitlines():
            line = line.strip()
            if not line:
                continue
            if ':' in line:
                name = line.split(':', 1)[1].strip()
            else:
                name = line
            labels.append(name)

    if not labels:
        raise SystemExit('No se encontraron etiquetas en ' + str(path))

    out = Path(args.output)
    out.write_text(json.dumps(labels, ensure_ascii=False, indent=2), encoding='utf-8')
    print('Escrito', out)

if __name__ == '__main__':
    main()
