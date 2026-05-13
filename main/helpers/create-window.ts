import {
  BrowserWindow,
  BrowserWindowConstructorOptions,
  Rectangle,
  screen,
} from "electron";
import Store from "electron-store";

interface WindowState extends Rectangle {
  isMaximized?: boolean;
}

export const createWindow = (
  windowName: string,
  options: BrowserWindowConstructorOptions,
): BrowserWindow => {
  const key = "window-state";
  const name = `window-state-${windowName}`;
  const store = new Store<WindowState>({ name });
  const defaultSize = {
    width: options.width ?? 800,
    height: options.height ?? 600,
  };
  let state: WindowState = {
    width: 800,
    height: 600,
    x: 0,
    y: 0,
  };

  const restore = () => store.get(key, defaultSize) as WindowState;

  const getCurrentPosition = (): WindowState => {
    const position = win.getPosition();
    const size = win.getSize();
    return {
      x: position[0],
      y: position[1],
      width: size[0],
      height: size[1],
    };
  };

  const windowWithinBounds = (windowState: WindowState, bounds: Rectangle) => {
    return (
      windowState.x >= bounds.x &&
      windowState.y >= bounds.y &&
      windowState.x + windowState.width <= bounds.x + bounds.width &&
      windowState.y + windowState.height <= bounds.y + bounds.height
    );
  };

  const resetToDefaults = () => {
    const bounds = screen.getPrimaryDisplay().bounds;
    return Object.assign({}, defaultSize, {
      x: (bounds.width - defaultSize.width) / 2,
      y: (bounds.height - defaultSize.height) / 2,
    });
  };

  const ensureVisibleOnSomeDisplay = (windowState: WindowState) => {
    const visible = screen.getAllDisplays().some((display) => {
      return windowWithinBounds(windowState, display.bounds);
    });
    if (!visible) {
      // Window is partially or fully not visible now.
      // Reset it to safe defaults.
      return resetToDefaults();
    }
    return windowState;
  };

  const saveState = () => {
    if (!win.isMinimized() && !win.isMaximized()) {
      Object.assign(state, getCurrentPosition());
    }
    state.isMaximized = win.isMaximized();
    store.set(key, state);
  };

  const { isMaximized, ...restoreState } = restore();
  state = ensureVisibleOnSomeDisplay(restoreState);

  const win = new BrowserWindow({
    ...options,
    ...state,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: true,
      ...options.webPreferences,
    },
  });

  if (isMaximized) {
    win.maximize();
  }

  win.on("close", saveState);

  return win;
};
