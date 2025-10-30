import { useState } from "react";

interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmColor?: "error" | "primary" | "secondary";
}

export const useConfirm = () => {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions>({
    title: "",
    message: "",
  });
  const [resolveRef, setResolveRef] = useState<{
    resolve: (value: boolean) => void;
  } | null>(null);

  const confirm = (opts: ConfirmOptions): Promise<boolean> => {
    setOptions(opts);
    setOpen(true);

    return new Promise((resolve) => {
      setResolveRef({ resolve });
    });
  };

  const handleConfirm = () => {
    if (resolveRef) {
      resolveRef.resolve(true);
    }
    setOpen(false);
  };

  const handleCancel = () => {
    if (resolveRef) {
      resolveRef.resolve(false);
    }
    setOpen(false);
  };

  return {
    confirm,
    dialogProps: {
      open,
      ...options,
      onConfirm: handleConfirm,
      onCancel: handleCancel,
    },
  };
};
