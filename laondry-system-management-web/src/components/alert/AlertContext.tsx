"use client";

import type { CSSProperties } from "react";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import AlertModal from "./AlertModal";

export type AlertType = "success" | "danger" | "warning" | "info";

export type AlertButton = {
  text: string;
  onPress?: () => void;
  ghost?: boolean;
};

export type AlertOptions = {
  type?: AlertType;
  title?: string;
  message?: string;
  autoClose?: number;
  buttons?: AlertButton[];
  containerStyle?: CSSProperties;
  dismissible?: boolean;
};

type Ctx = {
  show: (opts: AlertOptions) => void;
  hide: () => void;
  confirm: (opts: {
    title?: string;
    message?: string;
    okText?: string;
    cancelText?: string;
    type?: AlertType;
    dismissible?: boolean;
  }) => Promise<boolean>;
};

const AlertContext = createContext<Ctx | null>(null);

let _controller: Ctx | null = null;
export const AppAlert = {
  show: (opts: AlertOptions) => _controller?.show(opts),
  hide: () => _controller?.hide(),
  confirm: (opts: Parameters<Ctx["confirm"]>[0]) => _controller!.confirm(opts),
};

export const AlertProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [visible, setVisible] = useState(false);
  const [opts, setOpts] = useState<AlertOptions | null>(null);
  const timerRef = useRef<number | null>(null);
  const resolverRef = useRef<((v: boolean) => void) | null>(null);

  const hide = useCallback(() => {
    setVisible(false);
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    // jika sedang confirm dan ditutup via backdrop/ESC -> resolve(false)
    if (resolverRef.current) {
      resolverRef.current(false);
      resolverRef.current = null;
    }
  }, []);

  const show = useCallback(
    (o: AlertOptions) => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      setOpts({
        type: o.type ?? "info",
        title: o.title ?? "",
        message: o.message ?? "",
        autoClose: o.autoClose,
        buttons: o.buttons && o.buttons.length ? o.buttons : [{ text: "OK" }],
        containerStyle: o.containerStyle,
        dismissible: o.dismissible !== false,
      });
      setVisible(true);
      if (o.autoClose && o.autoClose > 0) {
        timerRef.current = window.setTimeout(() => hide(), o.autoClose);
      }
    },
    [hide]
  );

  const confirm: Ctx["confirm"] = useCallback(
    (o) => {
      return new Promise<boolean>((resolve) => {
        resolverRef.current = resolve;
        const type = o.type ?? "warning";
        const okText = o.okText ?? "OK";
        const cancelText = o.cancelText ?? "Batal";
        show({
          type,
          title: o.title ?? "Konfirmasi",
          message: o.message ?? "",
          dismissible: o.dismissible ?? false,
          buttons: [
            { text: cancelText, ghost: true, onPress: () => resolve(false) },
            { text: okText, onPress: () => resolve(true) },
          ],
        });
      });
    },
    [show]
  );

  const value = useMemo<Ctx>(() => ({ show, hide, confirm }), [show, hide, confirm]);

  useEffect(() => {
    _controller = value;
    return () => {
      _controller = null;
    };
  }, [value]);

  return (
    <AlertContext.Provider value={value}>
      {children}
      <AlertModal
        visible={visible}
        options={
          opts ?? {
            type: "info",
            title: "",
            message: "",
            buttons: [{ text: "OK" }],
            dismissible: true,
          }
        }
        onClose={hide}
      />
    </AlertContext.Provider>
  );
};

export const useAlert = () => {
  const ctx = useContext(AlertContext);
  if (!ctx) throw new Error("useAlert must be used within AlertProvider");
  return ctx;
};
