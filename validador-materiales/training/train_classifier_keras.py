import argparse
import json
from pathlib import Path
import random

import numpy as np
import tensorflow as tf
from tensorflow.keras import layers, models
from tensorflow.keras.preprocessing import image_dataset_from_directory


def build_model(num_classes, img_size=(224, 224)):
    base = tf.keras.applications.MobileNetV2(
        input_shape=img_size + (3,), include_top=False, weights='imagenet'
    )
    base.trainable = False
    inputs = layers.Input(shape=img_size + (3,))
    x = tf.keras.applications.mobilenet_v2.preprocess_input(inputs)
    x = base(x, training=False)
    x = layers.GlobalAveragePooling2D()(x)
    x = layers.Dropout(0.2)(x)
    outputs = layers.Dense(num_classes, activation='softmax')(x)
    model = models.Model(inputs, outputs)
    model.compile(
        optimizer=tf.keras.optimizers.Adam(1e-3),
        loss='sparse_categorical_crossentropy',
        metrics=['accuracy']
    )
    return model


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--data_dir', required=True, help='Carpeta con subcarpetas por clase')
    ap.add_argument('--epochs', type=int, default=8)
    ap.add_argument('--batch_size', type=int, default=16)
    ap.add_argument('--img_size', type=int, default=224)
    ap.add_argument('--output_dir', default='export_cls')
    args = ap.parse_args()

    data_dir = Path(args.data_dir)
    out = Path(args.output_dir)
    out.mkdir(parents=True, exist_ok=True)

    img_size = (args.img_size, args.img_size)

    ds_train = image_dataset_from_directory(
        data_dir,
        validation_split=0.2,
        subset='training',
        seed=123,
        image_size=img_size,
        batch_size=args.batch_size
    )
    ds_val = image_dataset_from_directory(
        data_dir,
        validation_split=0.2,
        subset='validation',
        seed=123,
        image_size=img_size,
        batch_size=args.batch_size
    )

    class_names = ds_train.class_names
    num_classes = len(class_names)

    model = build_model(num_classes, img_size)
    model.fit(ds_train, validation_data=ds_val, epochs=args.epochs)

    # Exportar a TFLite
    converter = tf.lite.TFLiteConverter.from_keras_model(model)
    tflite_model = converter.convert()
    (out / 'model.tflite').write_bytes(tflite_model)

    # Guardar labels.json
    (out / 'labels.json').write_text(json.dumps(class_names, ensure_ascii=False, indent=2), encoding='utf-8')
    print('Exportado:', out / 'model.tflite', 'y labels.json')


if __name__ == '__main__':
    main()
