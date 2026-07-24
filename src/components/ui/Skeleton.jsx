import React from 'react';

export function Skeleton({ className, ...props }) {
  return (
    <div
      className={`animate-pulse rounded-md bg-[#5D8B66]/15 dark:bg-[#7DA085]/15 ${className}`}
      {...props}
    />
  );
}
