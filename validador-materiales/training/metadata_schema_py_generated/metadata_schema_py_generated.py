# Minimal schema mock for TFLite metadata writing
# Works for add_coco_metadata.py and similar scripts.

class ModelMetadataT:
    def __init__(self):
        self.name = ""
        self.description = ""
        self.subgraph_metadata = []

class SubGraphMetadataT:
    def __init__(self):
        self.input_tensor_metadata = []
        self.output_tensor_metadata = []

class TensorMetadataT:
    def __init__(self):
        self.name = ""
        self.content = None
        self.process_units = []
        self.associated_files = []

class ProcessUnitT:
    def __init__(self):
        self.options_type = None
        self.options = None

class AssociatedFileT:
    def __init__(self):
        self.name = ""
        self.description = ""
        self.type = None

class ContentT:
    def __init__(self):
        self.content_properties_type = None
        self.content_properties = None
