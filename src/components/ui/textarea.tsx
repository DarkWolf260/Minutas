import * as React from 'react';
import { cn } from '@/lib/utils';
import { ScrollArea } from './scroll-area';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  autoSize?: boolean;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, autoSize = true, ...props }, ref) => {
    const internalRef = React.useRef<HTMLTextAreaElement>(null);
    React.useImperativeHandle(ref, () => internalRef.current!);

    const { rows: _rows, style, ...rest } = props;

    // Standard auto-growing logic when autoSize is true
    React.useLayoutEffect(() => {
      const textarea = internalRef.current;
      if (textarea && autoSize) {
        textarea.style.height = 'inherit';
        textarea.style.height = `${textarea.scrollHeight}px`;
      } else if (textarea && !autoSize) {
        // If scrollable mode, the textarea INSIDE the ScrollArea should expand
        // to its content height so the ScrollArea can scroll it.
        textarea.style.height = 'inherit';
        textarea.style.height = `${textarea.scrollHeight}px`;
      }
    }, [props.value, autoSize]);

    const textareaStyles = cn(
      'flex w-full bg-transparent text-sm placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
      autoSize ? 'resize-none overflow-hidden' : 'resize-none overflow-hidden min-h-full',
      autoSize && 'rounded-md border border-input px-3 py-2 ring-offset-background focus-visible:ring-1 focus-visible:ring-primary focus-visible:ring-offset-0 transition-all duration-200 bg-background'
    );

    if (autoSize) {
      return (
        <textarea
          className={cn(textareaStyles, className)}
          ref={internalRef}
          autoComplete="off"
          autoCorrect="off"
          spellCheck="false"
          style={style}
          {...rest}
        />
      );
    }

    return (
      <ScrollArea 
        className={cn(
          'flex w-full rounded-md border border-input bg-background ring-offset-background focus-within:ring-1 focus-within:ring-primary focus-within:ring-offset-0 transition-all duration-200',
          className
        )}
        onClick={() => internalRef.current?.focus()}
      >
        <div className="px-3 py-2 min-h-full w-full">
          <textarea
            className={textareaStyles}
            ref={internalRef}
            autoComplete="off"
            autoCorrect="off"
            spellCheck="false"
            style={{ ...style, height: 'auto' }}
            {...rest}
          />
        </div>
      </ScrollArea>
    );
  }
);
Textarea.displayName = 'Textarea';

export { Textarea };
