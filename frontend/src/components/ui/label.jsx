import React from "react";
import { cn } from "../../utils/cn";
import { motion } from "framer-motion";

export const Label = ({ children, className, htmlFor, required }) => {
  return (
    <motion.label
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      htmlFor={htmlFor}
      className={cn(
        "block text-sm font-medium mb-2",
        "text-gray-300",
        "transition-colors duration-200",
        className
      )}
    >
      {children}
      {required && <span className="text-red-500 ml-1">*</span>}
    </motion.label>
  );
}; 