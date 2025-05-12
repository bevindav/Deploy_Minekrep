'use client'

import { useState, useEffect, useRef } from 'react';
import MinecraftButton from './MinecraftButton';
import recipesData from '../data/recipes.json';

const SearchForm = ({ 
  targetElement, 
  setTargetElement, 
  algorithm,
  setAlgorithm,
  shortestPath, 
  setShortestPath, 
  recipeCount, 
  setRecipeCount, 
  handleSearch, 
  loading 
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [filteredElements, setFilteredElements] = useState([]);
  const [recipeCountInput, setRecipeCountInput] = useState(recipeCount.toString());
  const [recipeCountError, setRecipeCountError] = useState("");
  const [elementError, setElementError] = useState("");
  const [allElements, setAllElements] = useState([]);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);
  const basicElements = ["Air", "Earth", "Fire", "Water"];

  // Extract all unique elements from recipes data on component mount
  useEffect(() => {
    const extractUniqueElements = () => {
      const uniqueElements = new Set();
      
      recipesData.forEach(recipe => {
        uniqueElements.add(recipe.element1);
        uniqueElements.add(recipe.element2);
        uniqueElements.add(recipe.result);
      });
      
      return Array.from(uniqueElements).sort();
    };

    const elements = extractUniqueElements();
    setAllElements(elements);
  }, []);

  // Filter elements based on input
  useEffect(() => {
    if (targetElement.trim() === '') {
      setFilteredElements([]);
      return;
    }
    
    const filtered = allElements.filter(element => 
      element.toLowerCase().includes(targetElement.toLowerCase())
    ).slice(0, 10); // Limit to 10 suggestions for better UX
    
    setFilteredElements(filtered);
  }, [targetElement, allElements]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target) && 
          inputRef.current && !inputRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle element selection
  const handleElementSelect = (element) => {
    setTargetElement(element);
    setShowDropdown(false);
    setElementError("");
  };

  // Handle recipe count input change
  const handleRecipeCountChange = (e) => {
    const value = e.target.value;
    setRecipeCountInput(value);
    
    // Validate - only allow numbers
    if (value === "" || /^\d+$/.test(value)) {
      setRecipeCountError("");
    } else {
      setRecipeCountError("Only numbers are allowed ^^");
    }
  };
  
  // Update actual recipe count when input is valid
  const handleRecipeCountBlur = () => {
    if (recipeCountInput === "" || !(/^\d+$/.test(recipeCountInput))) {
      // Reset to previous valid value if input is invalid
      setRecipeCountInput(recipeCount.toString());
      setRecipeCountError("");
      return;
    }
    
    const value = parseInt(recipeCountInput);
    
    // Clamp value between 1 and minimum allowed value (1)
    const clampedValue = Math.max(value, 1);
    setRecipeCount(clampedValue);
    setRecipeCountInput(clampedValue.toString());
    setRecipeCountError("");
  };

  // Handle form submission with validation
  const handleSubmitWithValidation = (e) => {
    e.preventDefault();
    
    // Validate element exists
    if (allElements.length > 0 && !allElements.includes(targetElement)) {
      setElementError(`"${targetElement}" is not on the Little Alchemy 2 element list ^^`);
      return;
    }
    
    if (basicElements.includes(targetElement)) {
      setElementError(`"${targetElement}" is a basic element and cannot be searched because it has no recipes ^^`);
      return;
    }

    // Clear any errors and submit
    setElementError("");
    handleSearch(e);
  };

  return (
    <form onSubmit={handleSubmitWithValidation} className="space-y-4">
      {/* Element Input with Autocomplete */}
      <div className="relative">
        <label className="block text-sm font-medium text-gray-300 mb-1">
          Target Element
        </label>
        <input
          ref={inputRef}
          type="text"
          value={targetElement}
          onChange={(e) => {
            setTargetElement(e.target.value);
            setShowDropdown(true);
            setElementError("");
          }}
          onFocus={() => setShowDropdown(true)}
          placeholder="Enter element name (e.g., Brick, Metal, Human)"
          className={`w-full px-4 py-2 bg-gray-700 border ${elementError ? 'border-red-500' : 'border-gray-600'} rounded-md 
                    focus:ring-2 focus:ring-green-500 focus:border-transparent
                    placeholder-gray-400 text-white`}
          required
        />
        {elementError && (
          <p className="text-xs text-red-500 mt-1">{elementError}</p>
        )}
        <p className="text-xs text-gray-400 mt-1">
          Search for any of the 720 elements available in Little Alchemy 2
        </p>
        
        {/* Dropdown for element suggestions */}
        {showDropdown && filteredElements.length > 0 && (
          <div 
            ref={dropdownRef}
            className="absolute z-10 mt-1 w-full bg-gray-800 border border-gray-600 rounded-md shadow-lg max-h-60 overflow-auto"
          >
            {filteredElements.map((element, index) => (
              <div
                key={index}
                className="px-4 py-2 hover:bg-green-900 cursor-pointer text-white"
                onClick={() => handleElementSelect(element)}
              >
                {element}
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Toggle for Shortest Path or Multiple Recipes */}
      <div className="pt-2">
        <label className="block text-sm font-medium text-gray-300 mb-3">
          Search Type
        </label>
        
        <div className="flex gap-4">
          <div 
            className={`
              flex-1 p-3 rounded-md cursor-pointer transition-all
              ${shortestPath 
                ? 'bg-green-900 border-2 border-green-600' 
                : 'bg-gray-700 border-2 border-gray-600'}
            `}
            onClick={() => setShortestPath(true)}
          >
            <div className="flex items-center">
              <div className={`
                w-4 h-4 rounded-full mr-2
                ${shortestPath ? 'bg-green-400' : 'bg-gray-500'}
                flex items-center justify-center
              `}>
                {shortestPath && (
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                )}
              </div>
              <div>
                <h4 className="font-medium text-sm">One Recipe</h4>
                <p className="text-xs text-gray-400">Find one way to create</p>
              </div>
            </div>
          </div>
          
          <div 
            className={`
              flex-1 p-3 rounded-md cursor-pointer transition-all
              ${!shortestPath 
                ? 'bg-green-900 border-2 border-green-600' 
                : 'bg-gray-700 border-2 border-gray-600'}
            `}
            onClick={() => setShortestPath(false)}
          >
            <div className="flex items-center">
              <div className={`
                w-4 h-4 rounded-full mr-2
                ${!shortestPath ? 'bg-green-400' : 'bg-gray-500'}
                flex items-center justify-center
              `}>
                {!shortestPath && (
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                )}
              </div>
              <div>
                <h4 className="font-medium text-sm">Multiple Recipes</h4>
                <p className="text-xs text-gray-400">Find different ways to create</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Recipe Count Input (only visible when Multiple Recipes is selected) */}
      {!shortestPath && (
        <div className="pt-1">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-gray-300">
              Max Recipe Count:
            </label>
            <div className="flex flex-col items-end">
              <input
                type="text"
                value={recipeCountInput}
                onChange={handleRecipeCountChange}
                onBlur={handleRecipeCountBlur}
                onKeyDown={(e) => e.key === 'Enter' && handleRecipeCountBlur()}
                className={`w-16 h-8 px-2 text-center border ${recipeCountError ? 'border-red-500' : 'border-gray-600'} rounded bg-gray-700 text-white`}
              />
              {recipeCountError && (
                <span className="text-xs text-red-500 mt-1">{recipeCountError}</span>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Submit Button */}
      <div className="pt-2">
        <MinecraftButton
          text={loading ? "Searching..." : "Find Recipes"}
          variant="primary"
          className="w-full"
          disabled={loading}
          type="submit"
        />
      </div>
    </form>
  );
};

export default SearchForm;