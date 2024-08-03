# dupimg-finder / 重复图像查找工具

![search-duplicate-images](./docs/search-duplicate-images.png)

> Based on [EfficientIR](https://github.com/Sg4Dylan/EfficientIR).

A tool to find **duplicate image pairs** or **the most similar images of target image** in your file system.

## Usage

1. Add index paths that contain images.
2. Update index to generate the eigenvalues of images.
3. Start to search using generated eigenvalues.
   - Click `Search` in menu. Search duplicate image pairs.
   - Click `Search Target` in menu. Search the most similar images of target image.

## Performance

Generate eigenvalues for approximately 50,000 images (≈ 170GB) takes:

| Image Processing Model | Device Type | Device Model | Time Consuming |
| ---------------------- | ----------- | ------------ | -------------- |
| `EfficientNet-B2`      | CPU         | `i5-12600KF` | 90min          |

## Developer

### Frontend Dependencies

```bash
yarn
```

### Backend Binary

Python environment is required and `pyinstaller` has been installed.

```bash
cd EfficientIR
git submodule update --init
pip install -r requirements.txt
# build passed with `python==3.12.4`
pyinstaller build_nogui.spec
```

## Development

```bash
yarn dev
```

## Lint

```bash
yarn lint

# fix resolvable lint errors
yarn lint --fix
```

## Production

```bash
yarn build
```
