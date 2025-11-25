'use client';

import * as React from "react"
import { cn } from "@/lib/utils"

interface ScrollAreaHorizontalProps extends React.HTMLAttributes<HTMLDivElement> {}

export function ScrollAreaHorizontal({ className, children, ...props }: ScrollAreaHorizontalProps) {
  return (
    <div
      className={cn(
        "w-full overflow-x-auto pb-2 -mb-2", // Negative margin to hide scrollbar if needed, but keep accessible
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
