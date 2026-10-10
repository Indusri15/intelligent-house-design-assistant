# Datasets Directory

This directory manages training, validation, and benchmarking datasets for the Intelligent House Design and Construction Assistant project.

## Structure
- `cubicasa5k/`: Dataset import, conversion scripts, and annotation metadata for the CubiCasa5K architectural floor-plan dataset.
- `README.md`: Overall dataset documentation and licensing guidelines.

## Dataset Policy
1. **No Large Binary Commits**: Raw image and raster files exceeding repository thresholds must be kept out of version control (enforced via `.gitignore`).
2. **Reproducible Pipelines**: All datasets are imported and processed using deterministic scripts located in `ai-service/scripts/`.
3. **Licensing Compliance**: Ensure that third-party research datasets such as CubiCasa5K are used in accordance with their respective non-commercial academic research licenses.
