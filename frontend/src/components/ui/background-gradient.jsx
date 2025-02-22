import React from "react";
import { motion } from "framer-motion";
import { cn } from "../../utils/cn";

export const BackgroundGradient = ({
  children,
  className,
  containerClassName,
  animate = true,
}) => {
  const variants = {
    initial: {
      backgroundPosition: "0 50%",
    },
    animate: {
      backgroundPosition: ["0, 50%", "100% 50%", "0 50%"],
    },
  };
  return (
    <div className={cn("relative p-[4px] group", containerClassName)}>
      <motion.div
        variants={animate ? variants : undefined}
        initial={animate ? "initial" : undefined}
        animate={animate ? "animate" : undefined}
        transition={
          animate
            ? {
                duration: 5,
                repeat: Infinity,
                repeatType: "reverse",
              }
            : undefined
        }
        className={cn(
          "absolute inset-0 rounded-3xl opacity-75 group-hover:opacity-100 blur-xl transition duration-500",
          "bg-gradient-to-r from-blue-500 via-emerald-500 to-blue-500",
          className
        )}
      />
      <div className="relative bg-gray-900 rounded-3xl p-6">{children}</div>
    </div>
  );
}; 