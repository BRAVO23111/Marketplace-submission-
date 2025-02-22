import React from "react";
import { cn } from "../../utils/cn";
import { motion } from "framer-motion";

export const Input = React.forwardRef(
  ({ className, type, error, ...props }, ref) => {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="relative"
      >
        <input
          type={type}
          className={cn(
            "w-full px-4 py-3 rounded-lg transition-all duration-200",
            "bg-gray-800 border border-gray-700",
            "text-white placeholder-gray-400",
            "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
            error && "border-red-500 focus:ring-red-500",
            className
          )}
          ref={ref}
          {...props}
        />
        {error && (
          <motion.span
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-red-500 text-sm mt-1 block"
          >
            {error}
          </motion.span>
        )}
      </motion.div>
    );
  }
); 