import type { PromiseOptions, PromiseStateOption, ToastOptions, Variant } from './toast-manager';
import { toast } from './toast-manager';
import ToastDescription from './ToastDescription.astro';
import Toaster from './Toaster.astro';
import ToastItem from './ToastItem.astro';
import ToastTemplate from './ToastTemplate.astro';
import ToastTitle from './ToastTitle.astro';

export {
  toast,
  ToastDescription,
  Toaster,
  ToastItem,
  ToastTemplate,
  ToastTitle,
  type PromiseOptions,
  type PromiseStateOption,
  type ToastOptions,
  type Variant
};

export default {
  Manager: toast,
  Viewport: Toaster,
  Item: ToastItem,
  Title: ToastTitle,
  Description: ToastDescription,
  Template: ToastTemplate
};
