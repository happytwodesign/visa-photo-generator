import { VariantProps } from 'class-variance-authority';

declare global {
  type CVAVariantProps<T> = VariantProps<T>;
}