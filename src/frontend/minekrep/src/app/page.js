'use client'

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import MinecraftButton from '@/components/MinecraftButton';

export default function Home() {
  const router = useRouter();
  const [hoveredButton, setHoveredButton] = useState(null);

  return (
    <div className="min-h-screen bg-cover bg-center flex flex-col items-center justify-center"
      style={{ 
        backgroundImage: 'url("/images/minecraft_background.jpg")', 
        fontFamily: '"Minecraft", sans-serif' 
      }}>
      
      <div className="p-8 bg-black rounded-lg border-4 border-gray-700 max-w-4xl w-full text-center">
        <h1 className="text-4xl md:text-6xl font-bold mb-8 minecraft-text" style={{ textShadow: '3px 3px 0 #000' }}>
          <a 
            href="https://littlealchemy2.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-yellow-400 hover:underline"
          >
            Little Alchemy 2
          </a>
          <span className="block text-green-400 mt-2">Recipe Finder</span>
        </h1>
        
        <div className="mb-12 text-white text-lg" style={{ textShadow: '2px 2px 0 #000' }}>
          <p>Find all possible recipes from basic elements using BFS, DFS, and Bidirectional algorithms.</p>
          <p className="mt-4">Combine elements, discover new creations, and visualize recipe trees!</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <div 
            className="transform transition-all duration-300 hover:scale-105"
            onMouseEnter={() => setHoveredButton('search')}
            onMouseLeave={() => setHoveredButton(null)}
          >
            <MinecraftButton 
              text="Start Crafting" 
              onClick={() => router.push('/search')}
              isActive={hoveredButton === 'search'}
            />
            <p className="text-white mt-2" style={{ textShadow: '2px 2px 0 #000' }}>Start Crafting :p</p>
          </div>
          
          <div 
            className="transform transition-all duration-300 hover:scale-105"
            onMouseEnter={() => setHoveredButton('profile')}
            onMouseLeave={() => setHoveredButton(null)}
          >
            <MinecraftButton 
              text="Team Minekrep" 
              onClick={() => router.push('/profile')}
              isActive={hoveredButton === 'profile'}
            />
            <p className="text-white mt-2" style={{ textShadow: '2px 2px 0 #000' }}>Get to know our team ^^</p>
          </div>
        </div>
        
        <div className="text-white mt-8 text-sm" style={{ textShadow: '2px 2px 0 #000' }}>
          <p>Tugas Besar 2 IF2211 Strategi Algoritma</p>
          <p>Institut Teknologi Bandung - 2025</p>
        </div>
      </div>
    </div>
  );
}