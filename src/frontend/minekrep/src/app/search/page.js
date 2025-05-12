'use client'

import { useState, useEffect } from 'react';
import Link from 'next/link';
import NavBar from '@/components/NavBar';
import AlgorithmSelector from '@/components/AlgorithmSelector';
import SearchForm from '@/components/SearchForm';
import RecipeVisualizer from '@/components/RecipeVisualizer';
import { searchRecipes } from '@/utils/api';
import MinecraftButton from '@/components/MinecraftButton';

export default function SearchPage() {
  const [algorithm, setAlgorithm] = useState('bfs');
  const [targetElement, setTargetElement] = useState('');
  const [recipeCount, setRecipeCount] = useState(1);
  const [shortestPath, setShortestPath] = useState(true);
  const [searchResults, setSearchResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [metrics, setMetrics] = useState({ time: 0, nodesVisited: 0 });
  
  // Live Update State
  const [liveUpdateEnabled, setLiveUpdateEnabled] = useState(true);
  const [liveUpdateDelay, setLiveUpdateDelay] = useState(3000); // Default delay
  const [liveUpdateData, setLiveUpdateData] = useState(null);
  const [isLiveUpdateComplete, setIsLiveUpdateComplete] = useState(false);
  const [currentRecipeIndex, setCurrentRecipeIndex] = useState(0);

  
  const handleSearch = async (e) => {
    e.preventDefault();
    
    if (!targetElement) {
      setError('Please enter an element name to search for');
      return;
    }
    
    setLoading(true);
    setError(null);
    setSearchResults(null);
    setLiveUpdateData(null);
    setIsLiveUpdateComplete(false);
    
    try {
      const results = await searchRecipes({
        algorithm,
        targetElement,
        multipleRecipes: !shortestPath,
        recipeCount: shortestPath ? 1 : recipeCount
      });
      
      // Set the search results
      setSearchResults(results.recipes);
      
      // Set metrics
      setMetrics({
        time: results.metrics?.time || 0,
        nodesVisited: results.metrics?.nodesVisited || 0
      });
      
      // Handle live update data
      if (results.liveUpdateSteps && results.liveUpdateSteps.length > 0) {
        setLiveUpdateData(results.liveUpdateSteps); // pastikan ini adalah list of lists
        setCurrentRecipeIndex(0);
      }
      
    } catch (err) {
      console.error('Search error:', err);
      setError(err.message || 'Failed to search for recipes. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Notify when live update visualization is complete
  useEffect(() => {
    if (liveUpdateData && liveUpdateData.length > 0 && searchResults) {
      const timer = setTimeout(() => {
        setIsLiveUpdateComplete(true);
      }, liveUpdateData.length * liveUpdateDelay + 1000);
      
      return () => clearTimeout(timer);
    }
  }, [liveUpdateData, searchResults, liveUpdateDelay]);
  
  // Reset live update data if algorithm or target element changes
  useEffect(() => {
    setLiveUpdateData(null);
    setIsLiveUpdateComplete(false);
  }, [algorithm, targetElement]);
  
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
            Recipe Finder
          </h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-gray-800 bg-opacity-80 p-4 rounded-lg border border-gray-700">
              <h2 className="text-xl font-semibold mb-4 text-green-400">Algorithm</h2>
              <AlgorithmSelector 
                algorithm={algorithm} 
                setAlgorithm={setAlgorithm} 
              />
            </div>
            
            <div className="bg-gray-800 bg-opacity-80 p-4 rounded-lg border border-gray-700">
              <h2 className="text-xl font-semibold mb-4 text-green-400">Search Options</h2>
              <SearchForm 
                targetElement={targetElement}
                setTargetElement={setTargetElement}
                shortestPath={shortestPath}
                setShortestPath={setShortestPath}
                recipeCount={recipeCount}
                setRecipeCount={setRecipeCount}
                handleSearch={handleSearch}
                loading={loading}
              />
            </div>
          </div>
          
          {/* Live Update Options */}
          <div className="bg-gray-800 bg-opacity-80 p-4 rounded-lg border border-gray-700 mb-6">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-xl font-semibold text-green-400">Visualization Options</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center mb-3">
                  <div 
                    onClick={() => setLiveUpdateEnabled(!liveUpdateEnabled)}
                    className={`w-10 h-5 flex items-center rounded-full p-1 cursor-pointer mr-3
                                ${liveUpdateEnabled ? 'bg-green-500' : 'bg-gray-600'}`}
                  >
                    <div className={`bg-white w-4 h-4 rounded-full transform transition duration-300 ease-in-out
                                    ${liveUpdateEnabled ? 'translate-x-5' : 'translate-x-0'}`}>
                    </div>
                  </div>
                  <label className="text-gray-300">Live Update Visualization</label>
                </div>
                
                <p className="text-gray-400 text-xs mb-3">
                  Watch the search process in real-time as the algorithm builds the recipe tree step by step.
                </p>
                
                {liveUpdateEnabled && (
                  <div>
                    <label className="block text-sm text-gray-300 mb-1">
                      Update Delay: {liveUpdateDelay}ms
                    </label>
                    <input
                      type="range"
                      min="1000"
                      max="10000"
                      step="500"
                      value={liveUpdateDelay}
                      onChange={(e) => setLiveUpdateDelay(Number(e.target.value))}
                      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-green-600"
                    />
                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                      <span>Faster (1s)</span>
                      <span>Medium (5s)</span>
                      <span>Slower (10s)</span>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="text-gray-300 text-sm">
                <p className="mb-2">
                  <span className="text-green-400 font-semibold">Basic elements</span> are shown in green
                </p>
                <p className="mb-2">
                  <span className="text-amber-400 font-semibold">Intermediate elements</span> are shown in amber
                </p>
                <p>
                  <span className="text-blue-400 font-semibold">Target elements</span> are shown in blue
                </p>
              </div>
            </div>
          </div>
          
          {error && (
            <div className="bg-red-900 bg-opacity-80 p-4 rounded-lg border border-red-700 mb-6 text-white">
              {error}
            </div>
          )}
          
          {loading && !liveUpdateEnabled && (
            <div className="flex justify-center items-center p-12">
              <div className="animate-bounce text-xl text-green-400">
                Searching recipes...
              </div>
            </div>
          )}  
          
          {(searchResults || (loading && liveUpdateEnabled && liveUpdateData)) && (
            <div className="bg-gray-800 bg-opacity-80 p-4 rounded-lg border border-gray-700 mt-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-green-400">Recipe Results</h2>
                {(!loading || isLiveUpdateComplete) && (
                  <div className="text-sm text-gray-400">
                    <div>Time: {metrics.time.toFixed(2)}ms</div>
                    <div>Nodes visited: {metrics.nodesVisited}</div>
                  </div>
                )}
              </div>
              
              <RecipeVisualizer 
                recipes={liveUpdateEnabled ? null : searchResults}
                liveUpdate={liveUpdateEnabled}
                liveUpdateData={liveUpdateEnabled ? liveUpdateData : null}
                liveUpdateDelay={liveUpdateDelay}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}