'use client';

import * as React from "react"
import { motion, PanInfo, useMotionValue, useTransform } from "framer-motion"
import { Trash2, Edit2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface SwipeableItemProps {
  children: React.ReactNode
  onDelete?: () => void
  onEdit?: () => void
  className?: string
  enabled?: boolean
}

export function SwipeableItem({ 
  children, 
  onDelete, 
  onEdit, 
  className,
  enabled = true 
}: SwipeableItemProps) {
  const x = useMotionValue(0)
  const [isDragging, setIsDragging] = React.useState(false)

  // Only enable if enabled prop is true
  if (!enabled) {
    return <div className={className}>{children}</div>
  }

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    setIsDragging(false)
    
    // Threshold for triggering action (e.g., 100px swipe)
    const threshold = 100
    
    if (info.offset.x < -threshold && onDelete) {
      // Swipe Left -> Delete
      // Ideally we might want to confirm or snap to delete position, 
      // but for now let's just snap back and trigger action or snap to visual indicator
      onDelete()
    } else if (info.offset.x > threshold && onEdit) {
      // Swipe Right -> Edit
      onEdit()
    }
  }

  // Background opacity based on drag distance
  const deleteOpacity = useTransform(x, [0, -100], [0, 1])
  const editOpacity = useTransform(x, [0, 100], [0, 1])
  
  // Background color interpolation
  const backgroundColor = useTransform(
    x,
    [-100, 0, 100], // Left, Center, Right
    ["rgba(239, 68, 68, 0.2)", "rgba(0,0,0,0)", "rgba(59, 130, 246, 0.2)"]
  )

  return (
    <div className="relative overflow-hidden rounded-lg touch-pan-y">
      <motion.div
        className="absolute inset-0 flex items-center justify-between px-4"
        style={{ backgroundColor }}
      >
        <motion.div style={{ opacity: editOpacity }} className="flex items-center text-blue-600">
          <Edit2 className="w-5 h-5 mr-2" />
          <span className="font-medium">Editar</span>
        </motion.div>
        <motion.div style={{ opacity: deleteOpacity }} className="flex items-center text-red-600">
          <span className="font-medium">Excluir</span>
          <Trash2 className="w-5 h-5 ml-2" />
        </motion.div>
      </motion.div>

      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }} // Snap back always
        dragElastic={0.1} // Resistance
        onDragStart={() => setIsDragging(true)}
        onDragEnd={handleDragEnd}
        style={{ x }}
        className={cn("relative bg-card z-10", className)}
        whileTap={{ cursor: "grabbing" }}
      >
        {children}
      </motion.div>
    </div>
  )
}
