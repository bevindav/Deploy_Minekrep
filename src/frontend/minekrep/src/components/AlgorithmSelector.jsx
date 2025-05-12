'use client'

import { useState } from 'react';

const AlgorithmSelector = ({ algorithm, setAlgorithm }) => {
  const algorithms = [
    { id: 'bfs', name: 'Breadth First Search (BFS)', description: 'Explores all neighbor nodes at the present depth before moving to nodes at the next depth level. Good for finding the shortest path.' },
    { id: 'dfs', name: 'Depth First Search (DFS)', description: 'Explores as far as possible along each branch before backtracking. Good for exploring all possible paths.' },
    { id: 'bidirectional', name: 'Bidirectional Search', description: 'Searches from both start and goal simultaneously. Often faster than one-directional search.' }
  ];

  return (
    <div className="space-y-4">
      {algorithms.map((algo) => (
        <div 
          key={algo.id}
          className={`
            p-4 rounded-lg cursor-pointer transition-all duration-200
            ${algorithm === algo.id 
              ? 'bg-green-900 border-2 border-green-600' 
              : 'bg-gray-700 border-2 border-gray-600 hover:border-gray-500'}
          `}
          onClick={() => setAlgorithm(algo.id)}
        >
          <div className="flex items-center">
            <div className={`
              w-5 h-5 rounded-full mr-3 flex-shrink-0
              ${algorithm === algo.id ? 'bg-green-400' : 'bg-gray-500'}
              flex items-center justify-center
            `}>
              {algorithm === algo.id && (
                <div className="w-3 h-3 bg-white rounded-full"></div>
              )}
            </div>
            <div>
              <h3 className={`font-bold ${algorithm === algo.id ? 'text-green-400' : 'text-white'}`}>
                {algo.name}
              </h3>
              <p className="text-sm text-gray-300 mt-1">{algo.description}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default AlgorithmSelector;