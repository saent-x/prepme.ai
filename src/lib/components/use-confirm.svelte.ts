import { type Component } from 'svelte';
import ConfirmationDialog from './confirmation-dialog.svelte';

type ComponentProps = {
  promise: { resolve: (value: boolean) => void } | null;
  handleCancel: () => void;
  handleConfirm: () => void;
  title: string;
  description: string;
};

type RenderComponent = {
  component: Component<ComponentProps>;
  props: Omit<ComponentProps, 'promise' | 'title' | 'description'>;
};

type PromiseFlag = { resolve: (value: boolean) => void } | null;

export const useConfirm = (): [RenderComponent, () => Promise<unknown>, () => PromiseFlag] => {
  let promise = $state<PromiseFlag>(null);

  const getPromise = () => promise;
  const confirm = () => new Promise((resolve) => (promise = { resolve }));

  const handleClose = () => (promise = null);

  const handleConfirm = () => {
    promise?.resolve(true);
    handleClose();
  };

  const handleCancel = () => {
    promise?.resolve(false);
    handleClose();
  };

  let props = {
    handleCancel,
    handleConfirm
  };

  return [
    {
      component: ConfirmationDialog,
      props
    },
    confirm,
    getPromise
  ];
};
