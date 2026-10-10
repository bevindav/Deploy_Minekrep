// utils/api.js

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '');

const buildApiUrl = (path) => `${API_BASE_URL}/${path.replace(/^\//, '')}`;

/**
 * Makes a search request to the API
 * @param {Object} options - Search options
 * @param {string} options.algorithm - Algorithm to use ('bfs' or 'dfs')
 * @param {string} options.targetElement - Target element to find
 * @param {boolean} options.multipleRecipes - Whether to return multiple recipes
 * @param {number} options.recipeCount - Number of recipes to return
 * @returns {Promise<Object>} - Search results
 */
export const searchRecipes = async (options) => {
  try {
    const response = await fetch(buildApiUrl('/api/search'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
      algorithm: options.algorithm,
      targetElement: options.targetElement, 
      multipleRecipes: options.multipleRecipes, 
      recipeCount: options.recipeCount, 
      startElements: options.startElements || [],
    }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.metrics || !data.metrics.time) {
      data.metrics = {
        ...data.metrics,
        time: data.metrics?.time || 0,
        nodesVisited: data.metrics?.nodesVisited || 0,
      };
    }

    return data;
  } catch (error) {
    console.error('API Request Error:', error);
    throw new Error(`Failed to search recipes: ${error.message}`);
  }
};

/**
 * Gets all available elements from the API
 * @returns {Promise<Array>} - List of all elements
 */
export const getAllElements = async () => {
  try {
    const response = await fetch(buildApiUrl('/api/elements'));
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API Request Error:', error);
    throw new Error(`Failed to get elements: ${error.message}`);
  }
};

/**
 * Gets basic elements from the API
 * @returns {Promise<Array>} - List of basic elements
 */
export const getBasicElements = async () => {
  try {
    const response = await fetch(buildApiUrl('/api/elements/basic'));
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API Request Error:', error);
    throw new Error(`Failed to get basic elements: ${error.message}`);
  }
};