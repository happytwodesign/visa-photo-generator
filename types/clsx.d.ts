declare module 'clsx' {
  type ClassValue = string | number | boolean | undefined | null | ClassValue[]
  export default function clsx(...inputs: ClassValue[]): string
  export type { ClassValue }
}