'use client'

import { useState } from 'react';

const MinecraftButton = ({ text, onClick, variant = 'primary', isActive = false, className = '' }) => {
  const [isPressed, setIsPressed] = useState(false);
  
  // Button variants
  const variants = {
    primary: {
      base: 'bg-green-600',
      top: 'bg-green-500',
      side: 'bg-green-800',
      textColor: 'text-white',
      hoverBase: 'hover:bg-green-700',
      hoverTop: 'group-hover:bg-green-600',
      hoverSide: 'group-hover:bg-green-900',
      activeBase: 'bg-green-800',
      activeTop: 'bg-green-700',
      activeSide: 'bg-green-900'
    },
    secondary: {
      base: 'bg-gray-600',
      top: 'bg-gray-500',
      side: 'bg-gray-800',
      textColor: 'text-white',
      hoverBase: 'hover:bg-gray-700',
      hoverTop: 'group-hover:bg-gray-600',
      hoverSide: 'group-hover:bg-gray-900',
      activeBase: 'bg-gray-800',
      activeTop: 'bg-gray-700',
      activeSide: 'bg-gray-900'
    },
    danger: {
      base: 'bg-red-600',
      top: 'bg-red-500',
      side: 'bg-red-800',
      textColor: 'text-white',
      hoverBase: 'hover:bg-red-700',
      hoverTop: 'group-hover:bg-red-600',
      hoverSide: 'group-hover:bg-red-900',
      activeBase: 'bg-red-800',
      activeTop: 'bg-red-700',
      activeSide: 'bg-red-900'
    }
  };
  
  const currentVariant = variants[variant] || variants.primary;
  
  return (
    <button
      onClick={(e) => {
        setIsPressed(true);
        setTimeout(() => setIsPressed(false), 150);
        onClick && onClick(e);
      }}
      className={`
        relative group w-full 
        ${isPressed || isActive ? 'transform translate-y-1' : 'transform translate-y-0'}
        transition-transform duration-75 outline-none focus:outline-none
        ${className}
      `}
    >
      {/* Bottom layer (shadow) */}
      <div className={`
        absolute inset-0 
        ${currentVariant.side} 
        ${currentVariant.hoverSide}
        rounded-md transform translate-y-2
      `}></div>
      
      {/* Middle layer (base) */}
      <div className={`
        absolute inset-0 
        ${currentVariant.base} 
        ${currentVariant.hoverBase}
        rounded-md transform translate-y-1 
        ${isPressed || isActive ? 'translate-y-1' : ''}
      `}></div>
      
      {/* Top layer (visible) */}
      <div className={`
        relative px-8 py-3 rounded-md 
        ${currentVariant.top} 
        ${currentVariant.hoverTop} 
        border-b-4 border-t-2 border-r-2 border-l-2
        border-gray-900 border-opacity-20
        ${isPressed || isActive ? `${currentVariant.activeTop} border-b-2` : 'border-b-4'}
        text-center font-bold ${currentVariant.textColor}
        text-lg tracking-wide
      `}>
        {text}
      </div>
    </button>
  );
};

export default MinecraftButton;