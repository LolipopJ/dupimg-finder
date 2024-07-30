# dupimg-finder / 重复图像查找工具

Based on [EfficientIR](https://github.com/Sg4Dylan/EfficientIR).

## Preparations

### Frontend Dependencies

```bash
yarn
```

### Backend Binary

Python environment is required and `pyinstaller` has been installed.

```bash
cd EfficientIR
git submodule init
git submodule update

# test passed with `python==3.12.4` and `pyinstaller==6.9.0`
pyinstaller build_nogui.spec
```

## Development

```bash
yarn dev
```

## Lint

```bash
yarn lint

# Fix resolvable lint errors
yarn lint --fix
```

## Production

```bash
yarn build
```
