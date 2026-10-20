import { create } from 'zustand';

export interface DialogInputConfig {
  label?: string;
  defaultValue?: string;
  placeholder?: string;
  inputMode?: 'text' | 'numeric';
}

export interface DialogOptions {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  /** 传入即进入「输入」模式：返回字符串；取消返回 null */
  input?: DialogInputConfig;
}

type DialogResult = string | boolean | null;

interface DialogRequest extends DialogOptions {
  resolve: (value: DialogResult) => void;
}

interface DialogState {
  request: DialogRequest | null;
  requestDialog: (options: DialogOptions) => Promise<DialogResult>;
  settle: (value: DialogResult) => void;
}

export const useDialogStore = create<DialogState>((set, get) => ({
  request: null,

  requestDialog: (options) =>
    new Promise<DialogResult>((resolve) => {
      // 同一时刻只允许一个确认框，后来的直接覆盖（实际业务不会并发触发）
      get().request?.resolve(null);
      set({ request: { ...options, resolve } });
    }),

  settle: (value) => {
    const req = get().request;
    set({ request: null });
    req?.resolve(value);
  },
}));

/**
 * 命令式确认 / 输入对话框，替代 window.confirm 与 window.prompt。
 *
 * 原生对话框在 Capacitor WebView 里是系统级弹窗：不继承应用深浅色主题、
 * 阻塞 JS 主线程（会打断正在运行的专注计时），且部分 WebView 会忽略 prompt 的
 * 默认值参数。统一走应用内 BottomSheet。
 *
 * - confirm 模式：`await confirmDialog({...})` → true / false
 * - prompt 模式：`await confirmDialog({ input: {...} })` → string / null
 */
export const confirmDialog = (options: DialogOptions): Promise<DialogResult> =>
  useDialogStore.getState().requestDialog(options);
