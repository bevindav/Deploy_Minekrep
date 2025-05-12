'use client'

import { useState } from 'react';
import Image from 'next/image';
import NavBar from '@/components/NavBar';
import MinecraftButton from '@/components/MinecraftButton';

// Define team member data
const teamMembers = [
  {
    id: 1,
    name: "Indah Novita Tangdililing",
    nim: "13523047",
    role: "Skibidi Certified Programmer",
    description: "Kata-kata hari ininya kak, skibidi bop bop yes yes yes",
    image: "/images/team/member1.jpg",
    github: "https://github.com/indahtangdililing"
  },
  {
    id: 2,
    name: "Bevinda Vivian",
    nim: "13523120",
    role: "Delulu with No Solulu Programmer",
    description: "Kata-kata hari ininya kak, delulu delulu delulu with no solulu",
    image: "/images/team/member2.png",
    github: "https://github.com/bevindav"
  },
  {
    id: 3,
    name: "Naomi Risaka Sitorus",
    nim: "13523122",
    role: "Rizz Overload Programmer",
    description: "Kata-kata hari ininya kak, for {giveRizz()}",
    image: "/images/team/member3.jpg",
    github: "https://github.com/naomirisaka"
  }
];

export default function ProfilePage() {
  const [expandedMember, setExpandedMember] = useState(null);
  
  const toggleExpandMember = (id) => {
    if (expandedMember === id) {
      setExpandedMember(null);
    } else {
      setExpandedMember(id);
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-900 text-white"
      style={{ 
        backgroundImage: 'url("/images/minecraft_dark_background.jpg")', 
        backgroundSize: 'cover',
        fontFamily: '"Minecraft", sans-serif' 
      }}>
      <NavBar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="bg-black bg-opacity-80 rounded-lg p-6 border-2 border-gray-700 mb-8">
          <h1 className="text-3xl font-bold mb-6 text-center text-yellow-400">
            Team Minekrep
          </h1>
          
          <div className="bg-gray-800 bg-opacity-80 p-4 rounded-lg border border-gray-700 mb-6">
            <h2 className="text-xl font-semibold mb-4 text-green-400 text-center">
              About Our Project
            </h2>
            <p className="text-gray-300 mb-4 text-center">
              Welcome to Minekrep, a project to fulfill &quotTugas Besar 2 Stima&quot that helps you to enjoy Little Alchemy 2.
              This project implements a recipe finder for Little Alchemy 2 game elements using BFS, DFS, and Bidirectional algorithms.
              You can search for crafting paths from basic elements to any target element, with visualization
              of the search process and recipe trees.
            </p>
            <p className="text-gray-300 text-center">
              Developed as a big project 2 for IF2211 Algorithm Strategies course at Institut Teknologi Bandung.
            </p>
          </div>
          
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4 text-green-400 text-center">
              Meet The Team
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {teamMembers.map((member) => (
                <div 
                  key={member.id} 
                  className={`bg-gray-800 bg-opacity-80 rounded-lg border border-gray-700 overflow-hidden 
                            transition-all duration-300 ${expandedMember === member.id ? 'transform scale-105' : ''}`}
                >
                  <div className="p-4">
                    <div className="relative mb-4 mx-auto w-32 h-32 overflow-hidden rounded-lg border-2 border-gray-600">
                      <Image
                        src={member.image}
                        alt={member.name}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="object-cover"
                        priority={false}
                        placeholder="blur"
                        blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
                        onError={(e) => {
                          console.error('Image failed to load:', member.image);
                          e.target.style.display = 'none';
                        }}
                      />
                    </div>
                    
                    <h3 className="text-lg font-semibold text-center text-amber-400 mb-1">
                      {member.name}
                    </h3>
                    <p className="text-center text-gray-400 text-sm mb-2">
                      {member.nim}
                    </p>
                    <p className="text-center text-green-400 font-medium mb-3">
                      {member.role}
                    </p>
                    
                    {expandedMember === member.id && (
                      <div className="mt-4 text-gray-300 text-sm text-center">
                        <p className="mb-3">{member.description}</p>
                        <a 
                          href={member.github} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:underline flex items-center justify-center"
                        >
                          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                          </svg>
                          GitHub Profile
                        </a>
                      </div>
                    )}
                    
                    <div className="mt-4 flex justify-center">
                      <MinecraftButton 
                        text={expandedMember === member.id ? "Show Less" : "Show More"} 
                        onClick={() => toggleExpandMember(member.id)}
                        variant="secondary"
                        size="small"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-gray-800 bg-opacity-80 p-4 rounded-lg border border-gray-700">
            <h2 className="text-xl font-semibold mb-4 text-green-400 text-center">
              Tech Stack
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gray-700 bg-opacity-70 p-3 rounded border border-gray-600 text-center">
                <h3 className="text-amber-400 font-medium mb-2">Frontend</h3>
                <ul className="text-gray-300 text-sm">
                  <li>Next.js</li>
                  <li>React</li>
                </ul>
              </div>
              
              <div className="bg-gray-700 bg-opacity-70 p-3 rounded border border-gray-600 text-center">
                <h3 className="text-amber-400 font-medium mb-2">Backend</h3>
                <ul className="text-gray-300 text-sm">
                  <li>Go</li>
                </ul>
              </div>
              
              <div className="bg-gray-700 bg-opacity-70 p-3 rounded border border-gray-600 text-center">
                <h3 className="text-amber-400 font-medium mb-2">Algorithms</h3>
                <ul className="text-gray-300 text-sm">
                  <li>BFS (Breadth-First Search)</li>
                  <li>DFS (Depth-First Search)</li>
                  <li>Bi-directional</li>
                </ul>
              </div>
              
              <div className="bg-gray-700 bg-opacity-70 p-3 rounded border border-gray-600 text-center">
                <h3 className="text-amber-400 font-medium mb-2">Deployment</h3>
                <ul className="text-gray-300 text-sm">
                  <li>GitHub</li>
                  <li>Docker</li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="mt-8 text-center">
            <a href="https://github.com/naomirisaka/Tubes2_Minekrep" target="_blank" rel="noopener noreferrer">
              <MinecraftButton 
                text="View Source Code" 
                variant="primary"
              />
            </a>
          </div>
        </div>
        
        <div className="text-center text-gray-400 text-sm">
          <p>© 2025 Team Minekrep | IF2211 Strategi Algoritma</p>
          <p>Institut Teknologi Bandung</p>
        </div>
      </div>
    </div>
  );
}