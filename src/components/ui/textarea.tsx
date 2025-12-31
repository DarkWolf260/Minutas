
"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  autoSize?: boolean
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, autoSize = true, ...props }, ref) => {
    const internalRef = React.useRef<HTMLTextAreaElement>(null)
    React.useImperativeHandle(ref, () => internalRef.current!)

    const { rows, ...rest } = props;

    React.useLayoutEffect(() => {
      const textarea = internalRef.current
      if (autoSize && textarea) {
        // Reset height to recalculate scrollHeight
        textarea.style.height = "inherit"
        // Set height to scrollHeight to fit content
        textarea.style.height = `${textarea.scrollHeight}px`
      }
    }, [props.value, autoSize])

    return (
      <textarea
        className={cn(
          "flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          autoSize ? "resize-none overflow-hidden" : "",
          className
        )}
        ref={internalRef}
        autoComplete="off"
        autoCorrect="off"
        spellCheck="false"
        {...rest}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }
