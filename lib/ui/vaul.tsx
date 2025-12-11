'use client'

import * as DialogPrimitive from "@radix-ui/react-dialog"

// Lightweight shim so existing Drawer component can keep importing `vaul`
export const Drawer = {
  Root: DialogPrimitive.Root,
  Trigger: DialogPrimitive.Trigger,
  Portal: DialogPrimitive.Portal,
  Close: DialogPrimitive.Close,
  Overlay: DialogPrimitive.Overlay,
  Content: DialogPrimitive.Content,
  Title: DialogPrimitive.Title,
  Description: DialogPrimitive.Description,
}

