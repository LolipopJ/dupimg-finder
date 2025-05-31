# dupimg-finder / 重复图像查找工具

![search-duplicate-images](./docs/search-duplicate-images.png)

> Based on [EfficientIR](https://github.com/Sg4Dylan/EfficientIR).

A tool to find **duplicate image pairs** or **the most similar images of target image** in your file system.

## Why Write This?

Like a hamster, I love browsing sites like Pixiv, X, etc., liking and saving the pictures that give me aesthetic pleasure. The problem is that some pictures are uploaded multiple times, and I only want to keep one copy.

There are also multiple softwares that already meet my needs like [EfficientIR](https://github.com/Sg4Dylan/EfficientIR). As a front-end engineer, I want to re-implement it using modern front-end technologies while improving my native coding skills.

That's why I write this software, hope it can save your problems! Pull requests are always welcomed!

## Support Platforms

- `Windows`

## Usage

[Download](https://github.com/LolipopJ/dupimg-finder/releases) and install the tool.

1. `Indexes` page: add index paths that contain images.
2. `Indexes` page: update index to generate the eigenvalues of images.
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
