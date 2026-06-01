/**
 * React 19 removed implicit `children` from component prop types (PropsWithChildren).
 * Radix UI and many other libraries rely on the old behavior. This declaration
 * restores `children` as an optional prop globally, making React 19 compatible
 * with Radix UI components such as Label, DialogTitle, TabsContent, etc.
 */
import type { ReactNode } from "react";

declare module "react" {
  interface Attributes {
    children?: ReactNode | undefined;
  }
}
