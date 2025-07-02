import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Defines the interface for the returned debounced function, including the cancel method.
interface DebouncedFunction<F extends (...args: any[]) => any> {
    (...args: Parameters<F>): void;
    cancel(): void;
    flush(): void;
}

export function debounce<F extends (...args: any[]) => any>(func: F, waitFor: number): DebouncedFunction<F> {
    let timeout: NodeJS.Timeout | undefined;
    let lastArgs: Parameters<F> | undefined;

    const debounced: DebouncedFunction<F> = (...args: Parameters<F>): void => {
        lastArgs = args;
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            if (lastArgs) {
                func(...lastArgs);
                lastArgs = undefined;
            }
        }, waitFor);
    };

    debounced.cancel = () => {
        clearTimeout(timeout);
        lastArgs = undefined;
    };

    debounced.flush = () => {
        clearTimeout(timeout);
        if (lastArgs) {
            func(...lastArgs);
            lastArgs = undefined;
        }
    };

    return debounced;
}
