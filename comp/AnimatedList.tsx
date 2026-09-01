'use client';

import { motion } from 'motion/react';
import type { ReactNode } from 'react';

type AnimatedListProps = {
  children: ReactNode;
  className?: string;
};

type AnimatedListItemProps = {
  children: ReactNode;
  className?: string;
};

/** Homeの記事カードと同じ、左から静かに入る一覧用アニメーション。 */
export const AnimatedList = ({ children, className }: AnimatedListProps) => (
  <div className={className}>{children}</div>
);

export const AnimatedListItem = ({
  children,
  className,
}: AnimatedListItemProps) => (
  <motion.div
    initial={{ opacity: 0, x: -16 }}
    whileInView={{ opacity: 1, x: 0 }}
    viewport={{ once: true, amount: 0.15 }}
    transition={{
      type: 'tween',
      duration: 0.5,
      ease: 'easeInOut',
    }}
    className={`transform-gpu will-change-[transform,opacity] ${className ?? ''}`}
  >
    {children}
  </motion.div>
);
