import * as React from "react"
import * as ToastPrimitives from "@radix-ui/react-toast"
import { cva, type VariantProps } from "class-variance-authority"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"

const ToastProvider = ToastPrimitives.Provider

const TOAST_SWIPE_THRESHOLD = 50

type ToastSwipeDirection = "up" | "down" | "left" | "right"

type ToastSwipeState = {
  direction: Exclude<ToastSwipeDirection, "down" | "right"> | null
  pointerId: number
  startX: number
  startY: number
  started: boolean
}

const getDominantSwipeDirection = (
  deltaX: number,
  deltaY: number
): ToastSwipeDirection => {
  if (Math.abs(deltaX) > Math.abs(deltaY)) {
    return deltaX < 0 ? "left" : "right"
  }

  return deltaY < 0 ? "up" : "down"
}

const getSwipeDeltaForDirection = (
  direction: ToastSwipeState["direction"],
  deltaX: number,
  deltaY: number
) => ({
  x: direction === "left" ? Math.min(0, deltaX) : 0,
  y: direction === "up" ? Math.min(0, deltaY) : 0,
})

const clearToastSwipeStyles = (toast: HTMLElement) => {
  toast.style.removeProperty("--radix-toast-swipe-move-x")
  toast.style.removeProperty("--radix-toast-swipe-move-y")
  toast.style.removeProperty("--radix-toast-swipe-end-x")
  toast.style.removeProperty("--radix-toast-swipe-end-y")
  toast.style.removeProperty("--tw-exit-translate-x")
  toast.style.removeProperty("--tw-exit-translate-y")
}

const cancelToastSwipe = (toast: HTMLElement) => {
  toast.setAttribute("data-swipe", "cancel")
  clearToastSwipeStyles(toast)
}

const setToastExitDirection = (
  toast: HTMLElement,
  direction: ToastSwipeState["direction"]
) => {
  if (direction === "left") {
    toast.style.setProperty("--tw-exit-translate-x", "-100%")
    toast.style.setProperty("--tw-exit-translate-y", "0")
  }

  if (direction === "up") {
    toast.style.setProperty("--tw-exit-translate-x", "0")
    toast.style.setProperty("--tw-exit-translate-y", "-100%")
  }
}

const preventNextToastClick = (toast: HTMLElement) => {
  toast.addEventListener("click", (event) => event.preventDefault(), {
    once: true,
  })
}

const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Viewport
    ref={ref}
    className={cn(
      "fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]",
      className
    )}
    {...props}
  />
))
ToastViewport.displayName = ToastPrimitives.Viewport.displayName

const toastVariants = cva(
  "group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=cancel]:translate-y-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=end]:translate-y-[var(--radix-toast-swipe-end-y)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:translate-y-[var(--radix-toast-swipe-move-y)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full",
  {
    variants: {
      variant: {
        default: "border bg-background text-foreground",
        destructive:
          "destructive group border-destructive bg-destructive text-destructive-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root> &
    VariantProps<typeof toastVariants>
>(
  (
    {
      className,
      variant,
      open: openProp,
      defaultOpen,
      onOpenChange,
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel,
      ...props
    },
    ref
  ) => {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(
    defaultOpen ?? true
  )
  const isControlled = openProp !== undefined
  const open = isControlled ? openProp : uncontrolledOpen
  const swipeStateRef = React.useRef<ToastSwipeState | null>(null)

  const handleOpenChange = React.useCallback(
    (nextOpen: boolean) => {
      if (!isControlled) {
        setUncontrolledOpen(nextOpen)
      }

      onOpenChange?.(nextOpen)
    },
    [isControlled, onOpenChange]
  )

  const handlePointerDown = React.useCallback<
    React.PointerEventHandler<React.ElementRef<typeof ToastPrimitives.Root>>
  >(
    (event) => {
      onPointerDown?.(event)
      if (event.defaultPrevented || event.button !== 0) return

      clearToastSwipeStyles(event.currentTarget)
      swipeStateRef.current = {
        direction: null,
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        started: false,
      }
    },
    [onPointerDown]
  )

  const handlePointerMove = React.useCallback<
    React.PointerEventHandler<React.ElementRef<typeof ToastPrimitives.Root>>
  >(
    (event) => {
      onPointerMove?.(event)
      if (event.defaultPrevented) return

      const swipeState = swipeStateRef.current
      if (!swipeState || swipeState.pointerId !== event.pointerId) return

      const deltaX = event.clientX - swipeState.startX
      const deltaY = event.clientY - swipeState.startY
      const moveStartBuffer = event.pointerType === "touch" ? 10 : 2
      const dominantDirection = getDominantSwipeDirection(deltaX, deltaY)
      const shouldHandleSwipe =
        dominantDirection === "left" || dominantDirection === "up"

      if (!swipeState.started) {
        if (
          !shouldHandleSwipe
          && (Math.abs(deltaX) > moveStartBuffer
            || Math.abs(deltaY) > moveStartBuffer)
        ) {
          swipeStateRef.current = null
          return
        }

        if (
          !shouldHandleSwipe
          || Math.max(Math.abs(deltaX), Math.abs(deltaY)) <= moveStartBuffer
        ) {
          return
        }

        swipeState.started = true
        swipeState.direction = dominantDirection
        event.currentTarget.setPointerCapture?.(event.pointerId)
      }

      const delta = getSwipeDeltaForDirection(
        swipeState.direction,
        deltaX,
        deltaY
      )

      event.currentTarget.setAttribute("data-swipe", "move")
      event.currentTarget.style.setProperty(
        "--radix-toast-swipe-move-x",
        `${delta.x}px`
      )
      event.currentTarget.style.setProperty(
        "--radix-toast-swipe-move-y",
        `${delta.y}px`
      )
    },
    [onPointerMove]
  )

  const handlePointerUp = React.useCallback<
    React.PointerEventHandler<React.ElementRef<typeof ToastPrimitives.Root>>
  >(
    (event) => {
      onPointerUp?.(event)
      if (event.defaultPrevented) return

      const swipeState = swipeStateRef.current
      if (!swipeState || swipeState.pointerId !== event.pointerId) return

      if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
        event.currentTarget.releasePointerCapture?.(event.pointerId)
      }

      swipeStateRef.current = null

      if (!swipeState.started || !swipeState.direction) {
        return
      }

      const delta = getSwipeDeltaForDirection(
        swipeState.direction,
        event.clientX - swipeState.startX,
        event.clientY - swipeState.startY
      )
      const dismissDistance =
        swipeState.direction === "left" ? Math.abs(delta.x) : Math.abs(delta.y)

      if (dismissDistance > TOAST_SWIPE_THRESHOLD) {
        event.currentTarget.setAttribute("data-swipe", "end")
        event.currentTarget.style.removeProperty("--radix-toast-swipe-move-x")
        event.currentTarget.style.removeProperty("--radix-toast-swipe-move-y")
        event.currentTarget.style.setProperty(
          "--radix-toast-swipe-end-x",
          `${delta.x}px`
        )
        event.currentTarget.style.setProperty(
          "--radix-toast-swipe-end-y",
          `${delta.y}px`
        )
        setToastExitDirection(event.currentTarget, swipeState.direction)
        preventNextToastClick(event.currentTarget)
        handleOpenChange(false)
        return
      }

      cancelToastSwipe(event.currentTarget)
      preventNextToastClick(event.currentTarget)
    },
    [handleOpenChange, onPointerUp]
  )

  const handlePointerCancel = React.useCallback<
    React.PointerEventHandler<React.ElementRef<typeof ToastPrimitives.Root>>
  >(
    (event) => {
      onPointerCancel?.(event)
      const swipeState = swipeStateRef.current
      if (!swipeState || swipeState.pointerId !== event.pointerId) return

      swipeStateRef.current = null
      cancelToastSwipe(event.currentTarget)
    },
    [onPointerCancel]
  )

  return (
    <ToastPrimitives.Root
      ref={ref}
      open={open}
      onOpenChange={handleOpenChange}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      className={cn(toastVariants({ variant }), className)}
      {...props}
    />
  )
  }
)
Toast.displayName = ToastPrimitives.Root.displayName

const ToastAction = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Action>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Action>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Action
    ref={ref}
    className={cn(
      "inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-sm font-medium ring-offset-background transition-colors hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 group-[.destructive]:border-muted/40 group-[.destructive]:hover:border-destructive/30 group-[.destructive]:hover:bg-destructive group-[.destructive]:hover:text-destructive-foreground group-[.destructive]:focus:ring-destructive",
      className
    )}
    {...props}
  />
))
ToastAction.displayName = ToastPrimitives.Action.displayName

const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Close>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Close
    ref={ref}
    className={cn(
      "absolute right-2 top-2 rounded-md p-1 text-foreground/50 opacity-0 transition-opacity hover:text-foreground focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100 group-[.destructive]:text-red-300 group-[.destructive]:hover:text-red-50 group-[.destructive]:focus:ring-red-400 group-[.destructive]:focus:ring-offset-red-600",
      className
    )}
    toast-close=""
    {...props}
  >
    <X className="h-4 w-4" />
  </ToastPrimitives.Close>
))
ToastClose.displayName = ToastPrimitives.Close.displayName

const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Title
    ref={ref}
    className={cn("text-sm font-semibold", className)}
    {...props}
  />
))
ToastTitle.displayName = ToastPrimitives.Title.displayName

const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Description
    ref={ref}
    className={cn("text-sm opacity-90", className)}
    {...props}
  />
))
ToastDescription.displayName = ToastPrimitives.Description.displayName

type ToastProps = React.ComponentPropsWithoutRef<typeof Toast>

type ToastActionElement = React.ReactElement<typeof ToastAction>

export {
  type ToastProps,
  type ToastActionElement,
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
}
