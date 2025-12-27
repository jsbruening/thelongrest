"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown, GripVertical, Pin, PinOff } from "lucide-react";
import { cn } from "~/lib/utils";

export type TileSize = "small" | "medium" | "large";

interface TileProps {
  title?: string;
  children: ReactNode;
  size?: TileSize;
  collapsible?: boolean;
  defaultExpanded?: boolean;
  draggable?: boolean;
  pinnable?: boolean;
  pinned?: boolean;
  onPinToggle?: (pinned: boolean) => void;
  onSizeChange?: (size: TileSize) => void;
  className?: string;
}

const sizeConfig = {
  small: { minHeight: "200px", maxHeight: "300px" },
  medium: { minHeight: "300px", maxHeight: "500px" },
  large: { minHeight: "400px", maxHeight: "80vh" },
};

export function Tile({
  title,
  children,
  size = "medium",
  collapsible = false,
  defaultExpanded = true,
  draggable = false,
  pinnable = false,
  pinned = false,
  onPinToggle,
  onSizeChange: _onSizeChange,
  className,
}: TileProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [isDragging] = useState(false);

  const handleExpand = () => {
    if (collapsible) {
      setExpanded(!expanded);
    }
  };

  const handlePinToggle = () => {
    if (pinnable && onPinToggle) {
      onPinToggle(!pinned);
    }
  };

  const sizeStyles = sizeConfig[size];

  return (
    <div
      className={cn(
        "card bg-base-100 shadow-lg relative overflow-hidden transition-all duration-300",
        draggable && "cursor-grab active:cursor-grabbing",
        isDragging && "opacity-70",
        className
      )}
      style={{
        minHeight: sizeStyles.minHeight,
        maxHeight: expanded ? sizeStyles.maxHeight : "auto",
      }}
    >
      {/* Title Bar */}
      {(title || collapsible || pinnable || draggable) && (
        <div className="card-title flex flex-row items-center justify-between border-b border-base-300 bg-base-200/50 px-4 py-3">
          <div className="flex items-center gap-2 flex-1">
            {draggable && (
              <GripVertical className="h-4 w-4 text-base-content/60 cursor-grab active:cursor-grabbing" />
            )}
            {title && (
              <h3 className="text-sm font-semibold tracking-tight">{title}</h3>
            )}
          </div>

          <div className="flex items-center gap-1">
            {pinnable && (
              <button
                onClick={handlePinToggle}
                className="app-btn app-btn-ghost app-btn-icon"
              >
                {pinned ? (
                  <Pin className="h-4 w-4 text-primary" />
                ) : (
                  <PinOff className="h-4 w-4 text-base-content/60" />
                )}
              </button>
            )}
            {collapsible && (
              <button
                onClick={handleExpand}
                className="app-btn app-btn-ghost app-btn-icon"
              >
                <ChevronDown
                  className={cn(
                    "h-4 w-4 text-base-content/60 transition-transform duration-300",
                    expanded ? "rotate-0" : "rotate-180"
                  )}
                />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Content */}
      <div
        className={cn(
          "card-body flex-1 overflow-auto relative",
          !expanded && "overflow-hidden"
        )}
      >
        <div className={cn("transition-all duration-300", expanded ? "block" : "hidden")}>
          {children}
        </div>
      </div>
    </div>
  );
}
