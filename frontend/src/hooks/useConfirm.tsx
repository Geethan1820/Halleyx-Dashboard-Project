import { useState, useCallback } from 'react';
import ConfirmDialog, { type ConfirmDialogProps } from '../components/ConfirmDialog';

export type ConfirmOptions = {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'default';
};

export function useConfirm() {
  const [dialogProps, setDialogProps] = useState<ConfirmDialogProps | null>(null);

  const confirm = useCallback((options: ConfirmOptions | string): Promise<boolean> => {
    const opts: ConfirmOptions =
      typeof options === 'string' ? { message: options } : options;

    return new Promise((resolve) => {
      const close = (result: boolean) => {
        setDialogProps(null);
        resolve(result);
      };

      setDialogProps({
        isOpen: true,
        title: opts.title ?? (opts.variant === 'default' ? 'Confirm' : 'Delete item'),
        message: opts.message,
        confirmText: opts.confirmText ?? (opts.variant === 'default' ? 'Continue' : 'Delete'),
        cancelText: opts.cancelText ?? 'Cancel',
        variant: opts.variant ?? 'danger',
        onConfirm: () => close(true),
        onCancel: () => close(false),
      });
    });
  }, []);

  const dialog = dialogProps ? <ConfirmDialog {...dialogProps} /> : null;

  return { confirm, dialog };
}
