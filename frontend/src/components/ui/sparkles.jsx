import React from "react";
import { motion } from "framer-motion";
import { cn } from "../../utils/cn";

export const Sparkles = ({ children, className, ...props }) => {
  const randomNumber = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
  
  const createSparkle = () => ({
    id: crypto.randomUUID(),
    createdAt: Date.now(),
    color: `hsl(${randomNumber(0, 360)}deg, 100%, 75%)`,
    size: randomNumber(10, 20),
    style: {
      top: randomNumber(0, 100) + '%',
      left: randomNumber(0, 100) + '%',
      zIndex: 2
    }
  });

  const [sparkles, setSparkles] = React.useState(() => {
    return Array.from({ length: 3 }, () => createSparkle());
  });

  React.useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const sparkle = createSparkle();
      const nextSparkles = sparkles.filter(sp => {
        const age = now - sp.createdAt;
        return age < 750;
      });
      nextSparkles.push(sparkle);
      setSparkles(nextSparkles);
    }, 250);

    return () => clearInterval(interval);
  }, [sparkles]);

  return (
    <span className={cn("relative inline-block", className)} {...props}>
      {sparkles.map(sparkle => (
        <motion.span
          key={sparkle.id}
          className="absolute inline-block"
          style={sparkle.style}
          initial={{ scale: 0, rotate: 0 }}
          animate={{ scale: 1, rotate: 180 }}
          exit={{ scale: 0, rotate: 0 }}
          transition={{ duration: 0.75, ease: "easeOut" }}
        >
          <svg
            width={sparkle.size}
            height={sparkle.size}
            viewBox="0 0 160 160"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M80 0C80 0 84.2846 41.2925 101.496 58.504C118.707 75.7154 160 80 160 80C160 80 118.707 84.2846 101.496 101.496C84.2846 118.707 80 160 80 160C80 160 75.7154 118.707 58.504 101.496C41.2925 84.2846 0 80 0 80C0 80 41.2925 75.7154 58.504 58.504C75.7154 41.2925 80 0 80 0Z"
              fill={sparkle.color}
            />
          </svg>
        </motion.span>
      ))}
      <strong className="font-bold relative z-10">{children}</strong>
    </span>
  );
}; 