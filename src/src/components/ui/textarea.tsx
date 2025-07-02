
"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => {
  const internalRef = React.useRef<HTMLTextAreaElement | null>(null);

  const setRefs = React.useCallback(
    (node: HTMLTextAreaElement) => {
      internalRef.current = node;
      if (typeof ref === 'function') {
        ref(node);
      } else if (ref) {
        ref.current = node;
      }
    },
    [ref]
  );

  React.useLayoutEffect(() => {
    const textarea = internalRef.current;
    // Only auto-resize if it's not read-only, as read-only textareas
    // are used for previews and should scroll instead of growing.
    if (textarea && !props.readOnly) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [props.value, props.readOnly]); // Re-run effect if value or readOnly status changes

  return (
    <textarea
      className={cn(
        "w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        props.readOnly ? "resize-none overflow-y-auto" : "resize-none overflow-hidden",
        className
      )}
      ref={setRefs}
      rows={1}
      {...props}
    />
  )
})
Textarea.displayName = "Textarea"

export { Textarea }
