# Model Checkpoints

This folder is designated for saving trained PyTorch / ONNX model weights and checkpoints.

## Supported Checkpoints
- `cubicasa_unet_resnet34.pth`: Weights for the CubiCasa5k 10-class architectural segmentation model.
- `room_classifier_mobilenet.pth`: Fast room type classification network.

## Checkpoint Loading Policy
1. The FastAPI AI service attempts to load local checkpoints from this directory at startup.
2. If no checkpoint weights are present (e.g. fresh clone before training), the service falls back gracefully to the deterministic **Geometric Optimization Engine** and standard rule-based heuristics.
3. Checkpoints are excluded from git via `.gitignore`.
