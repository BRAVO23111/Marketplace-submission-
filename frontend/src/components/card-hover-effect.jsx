import React from "react";
import { motion } from "framer-motion";
import { cn } from "../../utils/cn";

export const CardHoverEffect = ({ items, className }) => {
  return (
    <div
      className={cn(
        "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 py-10",
        className
      )}
    >
      {items.map((item, idx) => (
        <motion.div
          key={item?.link || idx}
          className="relative group block p-2 h-full w-full"
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.2 }}
        >
          <div
            className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 h-full"
          >
            {item?.icon && (
              <div className="text-4xl mb-4">{item.icon}</div>
            )}
            <div className="font-bold text-xl mb-2 dark:text-gray-100">{item.title}</div>
            <p className="text-sm text-gray-500 dark:text-gray-400">{item.description}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
};