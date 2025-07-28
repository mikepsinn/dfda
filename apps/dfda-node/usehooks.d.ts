import 'usehooks-ts'
import type { RefObject } from 'react'

// React 19 issue: https://github.com/juliencrn/usehooks-ts/issues/663
declare module 'usehooks-ts' {
  type EventType =
    | 'mousedown'
    | 'mouseup'
    | 'touchstart'
    | 'touchend'
    | 'focusin'
    | 'focusout'

  export function useOnClickOutside<T extends HTMLElement = HTMLElement>(
    ref: RefObject<T | null | undefined> | RefObject<T | null | undefined>[],
    handler: (event: MouseEvent | TouchEvent | FocusEvent) => void,
    eventType?: EventType,
    eventListenerOptions?: AddEventListenerOptions
  ): void

  // Add other hooks here if they have similar issues, for example:
  // export function useHover<T extends HTMLElement = HTMLElement>(
  //   elementRef: RefObject<T | null | undefined>
  // ): boolean;
} 