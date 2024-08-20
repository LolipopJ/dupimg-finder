# dupimg-finder / 重复图像查找工具

![search-duplicate-images](./docs/search-duplicate-images.png)

> Based on [EfficientIR](https://github.com/Sg4Dylan/EfficientIR).

A tool to find **duplicate image pairs** or **the most similar images of target image** in your file system.

## Support Platforms

- `Windows`

## Usage

[Download](https://github.com/LolipopJ/dupimg-finder/releases) and install the tool.

1. `Home` page: add index paths that contain images.
2. `Home` page: update index to generate the eigenvalues of images.
3. Start a search progress using generated eigenvalues.
   - `Search` page: search duplicate image pairs.
   - `Search Target` page: search the most similar images of target image.

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

Python environment is required. Tested successfully on `python==3.12.4`.

```bash
cd EfficientIR
git submodule update --init
pip install -r requirements.txt
pyinstaller build_nogui.spec
```

### Development

```bash
yarn dev
```

### Lint

```bash
yarn lint

# fix resolvable lint errors
yarn lint --fix
```

### Production

```bash
yarn build
```
