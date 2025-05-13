'use client'

import { useState, useEffect, useCallback, useRef } from 'react';
import ReactFlow, {
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  MiniMap,
  MarkerType,
  Edge,
  addEdge,
  ReactFlowProvider
} from 'reactflow';
import 'reactflow/dist/style.css';

// Custom node renderer untuk element nodes
const ElementNode = ({ data }) => {
  return (
    <div className={`
      p-2 rounded-md min-w-36 text-center font-semibold transition-all duration-300
      ${data.highlighted ? 'ring-4 ring-yellow-300 scale-110 z-50' : ''}
      ${data.isBasicElement 
        ? 'bg-green-700 border-2 border-green-500' 
        : data.isCombineNode 
          ? 'bg-gray-600 border-2 border-gray-500' 
          : data.isTargetElement
            ? 'bg-blue-700 border-2 border-blue-500'
            : 'bg-amber-700 border-2 border-amber-500'}
    `}>
      <div className="flex items-center justify-center">
        {data.icon && !data.isCombineNode && (
          <img src={`/images/elements/${data.icon}`} alt={data.label} className="w-6 h-6 mr-2" />
        )}
        <div>{data.label}</div>
      </div>
    </div>
  );
};

// Node types mapping
const nodeTypes = {
  elementNode: ElementNode,
};

const RecipeVisualizer = ({ 
  recipes, 
  liveUpdate = false,
  liveUpdateData = null,
  liveUpdateDelay = 1000 
}) => {
  const [recipeIndex, setRecipeIndex] = useState(0);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [liveUpdateStep, setLiveUpdateStep] = useState(0);
  const [liveUpdateMessage, setLiveUpdateMessage] = useState("");
  const [isLiveUpdateComplete, setIsLiveUpdateComplete] = useState(false);
  
  // State untuk kontrol play/pause
  const [isPlaying, setIsPlaying] = useState(true);
  
  // Refs untuk animasi frame dan timing
  const animationFrameRef = useRef(null);
  const lastUpdateTimeRef = useRef(0);
  const liveUpdateIntervalRef = useRef(null);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);

  // Cek apakah elemen termasuk elemen dasar
  const isBasicElement = (elementName) => {
    return ['earth', 'fire', 'water', 'air'].includes(elementName?.toLowerCase());
  };

  // Fungsi untuk membatalkan semua animasi dan interval
  const clearAllAnimations = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    if (liveUpdateIntervalRef.current) {
      clearInterval(liveUpdateIntervalRef.current);
      liveUpdateIntervalRef.current = null;
    }
  };

  // Fungsi untuk mengkonversi data recipe dari JSON menjadi struktur tree
  const convertRecipeToTree = (recipeData, targetElement) => {
    if (!recipeData || recipeData.length === 0) return null;
    
    // Map untuk melacak elemen yang sudah dibuat
    const elementsMap = new Map();
    
    // Untuk setiap elemen, tambahkan ke map
    recipeData.forEach(recipe => {
      // Tambahkan hasil ke map jika belum ada
      if (!elementsMap.has(recipe.result)) {
        elementsMap.set(recipe.result, {
          element1: recipe.element1,
          element2: recipe.element2,
          icon: recipe.icon_filename
        });
      }
    });
    
    // Membuat struktur hierarki recipe
    const buildRecipeHierarchy = (elementName) => {
      // Jika elemen dasar, kembalikan sebagai leaf node
      if (isBasicElement(elementName)) {
        return {
          name: elementName,
          icon: `${elementName.toLowerCase()}.png`, // Asumsikan nama file icon sama dengan nama elemen
          children: []
        };
      }
      
      // Cari kombinasi yang menghasilkan elemen ini
      const combination = elementsMap.get(elementName);
      
      // Jika tidak ditemukan (atau belum lengkap), kembalikan sebagai leaf
      if (!combination) {
        return {
          name: elementName,
          icon: `${elementName.toLowerCase()}.png`,
          children: []
        };
      }
      
      // Rekursif untuk elemen1 dan elemen2
      return {
        name: elementName,
        icon: combination.icon || `${elementName.toLowerCase()}.png`,
        children: [
          buildRecipeHierarchy(combination.element1),
          buildRecipeHierarchy(combination.element2)
        ]
      };
    };
    
    // Bangun struktur tree dari elemen target
    return buildRecipeHierarchy(targetElement);
  };
  const ElementNode = ({ data }) => {
    return (
      <div className={`
        p-2 rounded-md min-w-32 text-center font-semibold transition-all duration-300
        ${data.highlighted ? 'ring-4 ring-yellow-300 scale-110 z-50' : ''}
        ${data.isBasicElement 
          ? 'bg-green-700 border-2 border-green-500' 
          : data.isCombineNode 
            ? 'bg-gray-600 border-2 border-gray-500' 
            : data.isTargetElement
              ? 'bg-blue-700 border-2 border-blue-500'
              : 'bg-amber-700 border-2 border-amber-500'}
      `}>
        <div className="flex items-center justify-center">
          {data.icon && !data.isCombineNode && (
            <img src={`/images/elements/${data.icon}`} alt={data.label} className="w-6 h-6 mr-2" />
          )}
          <div>{data.label}</div>
        </div>
      </div>
    );
  };
  // Generate nodes dan edges untuk ReactFlow berdasarkan struktur tree
 const generateNodesAndEdges = (treeData, highlightNodes = []) => {
  if (!treeData) return { nodes: [], edges: [] };

  const nodes = [];
  const edges = [];
  let nodeId = 0;

  const HORIZONTAL_UNIT = 120; // 1 unit width
  const VERTICAL_GAP = 200;

  // Hitung lebar (jumlah daun) dari subtree
  const getSubtreeWidth = (node) => {
    if (!node.children || node.children.length === 0) return 1.5;
    return node.children.reduce((acc, child) => acc + getSubtreeWidth(child), 0);
  };

  // recursive layout engine
  const placeNode = (node, depth, xOffset) => {
    const id = `node_${nodeId++}`;
    const isBasic = isBasicElement(node.name);
    const isTarget = depth === 0;
    const isHighlighted = highlightNodes.includes(node.name);

    const width = getSubtreeWidth(node);

    const currentX = xOffset + (width * HORIZONTAL_UNIT) / 2;
    const currentY = depth * VERTICAL_GAP;

    // Tambahkan node utama
    nodes.push({
      id,
      type: 'elementNode',
      position: { x: currentX, y: currentY },
      data: {
        label: node.name,
        icon: node.icon,
        isBasicElement: isBasic,
        isCombineNode: false,
        isTargetElement: isTarget,
        highlighted: isHighlighted
      },
      sourcePosition: 'bottom',
      targetPosition: 'top',
      className: isHighlighted ? 'highlighted-node' : ''
    });

    if (node.children && node.children.length === 2) {
      const combineId = `combine_${nodeId++}`;
      const combineX = currentX;
      const combineY = currentY + VERTICAL_GAP / 2;

      // Tambahkan node combine
      nodes.push({
        id: combineId,
        type: 'elementNode',
        position: { x: combineX, y: combineY },
        data: {
          label: '+',
          isCombineNode: true,
          highlighted: isHighlighted
        },
        sourcePosition: 'bottom',
        targetPosition: 'top',
        className: 'combine-node'
      });

      // Edge dari parent ke combine
      edges.push({
        id: `edge_${id}_${combineId}`,
        source: id,
        target: combineId,
        type: 'default',
        animated: isHighlighted,
        style: {
          stroke: isHighlighted ? '#FFD700' : '#ffffff',
          strokeWidth: isHighlighted ? 5 : 4
        },
        zIndex: 999
      });

      // Proses anak-anak
      let childOffset = xOffset;
      for (const child of node.children) {
        const childWidth = getSubtreeWidth(child);
        const childXOffset = childOffset;
        const childId = placeNode(child, depth + 1, childXOffset);

        edges.push({
          id: `edge_${childId}_${combineId}`,
          source: childId,
          target: combineId,
          type: 'default',
          animated: isHighlighted,
          style: {
            stroke: isHighlighted ? '#FFD700' : '#ffffff',
            strokeWidth: isHighlighted ? 5 : 4
          },
          zIndex: 998
        });

        childOffset += childWidth * HORIZONTAL_UNIT;
      }
    }

    return id;
  };

  placeNode(treeData, 0, 0);
  return { nodes, edges };
};

  // PERUBAHAN: Fungsi khusus untuk memaksa render ulang edges
  const forceRenderEdges = (flowNodes, flowEdges) => {
    // Jika tidak ada nodes atau edges, tidak perlu render ulang
    if (flowNodes.length === 0 || flowEdges.length === 0) return;
    
    // Set timeout untuk memastikan nodes dirender terlebih dahulu
    setTimeout(() => {
      // Clone edges dan tambahkan properti untuk memaksa render ulang
      const updatedEdges = flowEdges.map(edge => ({
        ...edge,
        forceRender: Date.now()
      }));
      
      // Update edges
      setEdges(updatedEdges);
      
      // Fit view setelah edges terupdate
      if (reactFlowInstance) {
        reactFlowInstance.fitView({ padding: 0.5 });
      }
    }, 200);
  };

  // Handle Live Update dengan interval yang lebih panjang
  useEffect(() => {
    // Jika mode live update aktif dan ada data live update
    if (liveUpdate && liveUpdateData && liveUpdateData.length > 0 && !isLiveUpdateComplete) {
      // Clear interval sebelumnya jika ada
      if (liveUpdateIntervalRef.current) {
        clearInterval(liveUpdateIntervalRef.current);
      }
      
      // Mulai dengan step 0
      setLiveUpdateStep(0);
      
      // Tambahkan delay awal agar UI dapat dimuat terlebih dahulu
      setTimeout(() => {
        // Buat interval untuk update bertahap dengan delay yang lebih panjang
        liveUpdateIntervalRef.current = setInterval(() => {
          setLiveUpdateStep(prevStep => {
            const nextStep = prevStep + 1;
            
            // Jika sudah sampai step terakhir, clear interval
            if (nextStep >= liveUpdateData.length) {
              clearInterval(liveUpdateIntervalRef.current);
              setIsLiveUpdateComplete(true);
              return prevStep; // Tetap return step terakhir
            }
            
            // Update message untuk step ini
            setLiveUpdateMessage(liveUpdateData[nextStep].message);
            
            // Return next step
            return nextStep;
          });
        }, liveUpdateDelay); // Menggunakan delay yang lebih panjang
        
        // Set message awal
        if (liveUpdateData[0]) {
          setLiveUpdateMessage(liveUpdateData[0].message);
        }
      }, 1000); // Delay awal 1 detik untuk memastikan UI siap
      
      // Cleanup function
      return () => {
        if (liveUpdateIntervalRef.current) {
          clearInterval(liveUpdateIntervalRef.current);
        }
      };
    }
  }, [liveUpdate, liveUpdateData, liveUpdateDelay, isLiveUpdateComplete]);

  // Create the recipe tree visualization when recipes or recipeIndex change
  useEffect(() => {
    if (liveUpdate && liveUpdateData) {
      // Jika mode live update aktif
      setIsLoading(true);
      
      try {
        // Ambil data pada step saat ini
        const currentStepData = liveUpdateData[liveUpdateStep];
        
        if (currentStepData && currentStepData.partial_tree) {
          // Konversi data recipe menjadi struktur tree
          const targetElement = currentStepData.partial_tree.targetElement;
          const recipeTree = convertRecipeToTree(currentStepData.partial_tree.steps, targetElement);
          
          // Generate nodes dan edges untuk ReactFlow dengan highlight
          const highlightNodes = currentStepData.highlight_nodes || [];
          const { nodes: flowNodes, edges: flowEdges } = generateNodesAndEdges(recipeTree, highlightNodes);
          
          setNodes(flowNodes);
          setEdges(flowEdges);
          
          // PERUBAHAN: Force render edges
          forceRenderEdges(flowNodes, flowEdges);
        } else {
          // Belum ada data tree, clear nodes dan edges
          setNodes([]);
          setEdges([]);
        }
      } catch (error) {
        console.error("Error processing live update data:", error);
      } finally {
        setIsLoading(false);
      }
    } else {
      // Mode normal, bukan live update
      if (!recipes || recipes.length === 0 || recipeIndex >= recipes.length) {
        setNodes([]);
        setEdges([]);
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      
      try {
        // Data recipe saat ini
        const currentRecipe = recipes[recipeIndex];
        
        // Target element (hasil akhir)
        const targetElement = currentRecipe.targetElement;
        
        // Konversi data recipe menjadi struktur tree
        const recipeTree = convertRecipeToTree(currentRecipe.steps, targetElement);
        
        // Generate nodes dan edges untuk ReactFlow
        const { nodes: flowNodes, edges: flowEdges } = generateNodesAndEdges(recipeTree);
        
        setNodes(flowNodes);
        setEdges(flowEdges);
        
        // PERUBAHAN: Force render edges
        forceRenderEdges(flowNodes, flowEdges);
      } catch (error) {
        console.error("Error processing recipe data:", error);
      } finally {
        setIsLoading(false);
      }
    }
  }, [recipes, recipeIndex, liveUpdate, liveUpdateData, liveUpdateStep, setNodes, setEdges]);
  
  // Toggle play/pause
  const togglePlayPause = () => {
    setIsPlaying(prev => !prev);
    
    if (!isPlaying) {
      // Resume dengan membuat interval baru
      if (liveUpdateIntervalRef.current) {
        clearInterval(liveUpdateIntervalRef.current);
      }
      
      liveUpdateIntervalRef.current = setInterval(() => {
        setLiveUpdateStep(prevStep => {
          const nextStep = prevStep + 1;
          
          if (nextStep >= liveUpdateData.length) {
            clearInterval(liveUpdateIntervalRef.current);
            setIsLiveUpdateComplete(true);
            return prevStep;
          }
          
          setLiveUpdateMessage(liveUpdateData[nextStep].message);
          return nextStep;
        });
      }, liveUpdateDelay);
    } else {
      // Pause dengan menghapus interval
      if (liveUpdateIntervalRef.current) {
        clearInterval(liveUpdateIntervalRef.current);
      }
    }
  };
  
  // Restart live update
  const restartLiveUpdate = () => {
    // Clear interval yang ada
    if (liveUpdateIntervalRef.current) {
      clearInterval(liveUpdateIntervalRef.current);
    }
    
    // Reset state
    setLiveUpdateStep(0);
    setIsLiveUpdateComplete(false);
    setIsPlaying(true);
    
    // Set message awal
    if (liveUpdateData && liveUpdateData[0]) {
      setLiveUpdateMessage(liveUpdateData[0].message);
    }
    
    // Mulai interval baru setelah delay kecil
    setTimeout(() => {
      liveUpdateIntervalRef.current = setInterval(() => {
        setLiveUpdateStep(prevStep => {
          const nextStep = prevStep + 1;
          
          if (nextStep >= liveUpdateData.length) {
            clearInterval(liveUpdateIntervalRef.current);
            setIsLiveUpdateComplete(true);
            return prevStep;
          }
          
          setLiveUpdateMessage(liveUpdateData[nextStep].message);
          return nextStep;
        });
      }, liveUpdateDelay);
    }, 100);
  };
  
  // Reset live update state jika recipes berubah
  useEffect(() => {
    if (liveUpdateIntervalRef.current) {
      clearInterval(liveUpdateIntervalRef.current);
    }
    setIsLiveUpdateComplete(false);
    setLiveUpdateStep(0);
    setLiveUpdateMessage("");
    setIsPlaying(true);
  }, [recipes]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (liveUpdateIntervalRef.current) {
        clearInterval(liveUpdateIntervalRef.current);
      }
    };
  }, []);
  
  const fitView = useCallback(() => {
    if (reactFlowInstance) {
      reactFlowInstance.fitView({ padding: 0.2 });
    }
  }, [reactFlowInstance]);
  
  // PERUBAHAN: Tampilkan info jika tidak ada edges yang terlihat
  const [edgesVisible, setEdgesVisible] = useState(true);
  useEffect(() => {
    // Check if edges are visible after a delay
    if (edges.length > 0 && nodes.length > 0) {
      setTimeout(() => {
        const edgeElements = document.querySelectorAll('.react-flow__edge');
        setEdgesVisible(edgeElements.length > 0);
      }, 500);
    }
  }, [edges, nodes]);
  
  return (
    <div className="flex flex-col h-full">
      {/* Navigation buttons untuk multiple recipes (hanya tampil jika tidak dalam mode live update) */}
      {!liveUpdate && recipes && recipes.length > 1 && (
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setRecipeIndex(prev => Math.max(0, prev - 1))}
            disabled={recipeIndex === 0}
            className={`
              px-3 py-1 rounded-md text-sm
              ${recipeIndex === 0 
                ? 'bg-gray-700 text-gray-400 cursor-not-allowed' 
                : 'bg-blue-700 hover:bg-blue-600 text-white'}
            `}
          >
            Previous Recipe
          </button>
          
          <div className="text-gray-300 text-sm">
            Recipe {recipeIndex + 1} of {recipes?.length || 0}
          </div>
          
          <button
            onClick={() => setRecipeIndex(prev => Math.min((recipes?.length || 0) - 1, prev + 1))}
            disabled={recipeIndex === ((recipes?.length || 0) - 1)}
            className={`
              px-3 py-1 rounded-md text-sm
              ${recipeIndex === ((recipes?.length || 0) - 1)
                ? 'bg-gray-700 text-gray-400 cursor-not-allowed' 
                : 'bg-blue-700 hover:bg-blue-600 text-white'}
            `}
          >
            Next Recipe
          </button>
        </div>
      )}
      
      {/* Live update controls */}
      {liveUpdate && liveUpdateData && (
        <div className="bg-gray-800 rounded-md p-3 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button 
                onClick={togglePlayPause}
                className="mr-3 w-8 h-8 flex items-center justify-center bg-gray-700 hover:bg-gray-600 rounded-full"
              >
                {isPlaying ? (
                  // Pause icon
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 00-1 1v2a1 1 0 002 0V9a1 1 0 00-1-1zm5 0a1 1 0 00-1 1v2a1 1 0 002 0V9a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                ) : (
                  // Play icon
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
              <button 
                onClick={restartLiveUpdate}
                className="mr-3 w-8 h-8 flex items-center justify-center bg-gray-700 hover:bg-gray-600 rounded-full"
              >
                {/* Restart icon */}
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                </svg>
              </button>
              <div className="text-green-400 font-mono text-sm">{liveUpdateMessage}</div>
            </div>
            <div className="text-gray-400 text-xs">
              Step {liveUpdateStep + 1} of {liveUpdateData.length}
            </div>
          </div>
          <div className="mt-2 h-1 bg-gray-700 rounded overflow-hidden">
            <div 
              className="h-full bg-green-500 transition-all duration-300" 
              style={{ width: `${(liveUpdateStep / (liveUpdateData.length - 1 || 1)) * 100}%` }}
            ></div>
          </div>
        </div>
      )}
      
      {isLoading ? (
        <div className="flex justify-center items-center h-80">
          <div className="text-gray-400">Building recipe visualization...</div>
        </div>
      ) : nodes.length > 0 ? (
        <div style={{ height: '60vh' }} className="border border-gray-700 rounded-md overflow-hidden">
          {/* PERUBAHAN: Tambahkan styling wrapper untuk ReactFlow */}
          <div className="react-flow-wrapper h-full">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              nodeTypes={nodeTypes}
              onInit={setReactFlowInstance}
              fitView
              attributionPosition="bottom-right"
              minZoom={0.1}
              maxZoom={1.5}
              defaultZoom={0.8}
              // PERUBAHAN: Tambahkan prop penting untuk edges
              defaultEdgeOptions={{
                type: 'default',
                style: { stroke: '#ffffff', strokeWidth: 4 },
                markerEnd: {
                  type: MarkerType.ArrowClosed,
                  width: 25,
                  height: 25,
                },
                animated: false
              }}
              // Non-draggable nodes
              nodesDraggable={false}
              // Non-selectable
              elementsSelectable={false}
              // Zoom options
              zoomOnScroll={true}
              panOnScroll={true}
              panOnDrag={true}
              // PERUBAHAN: Tambahkan className
              className="recipe-visualization-flow"
            >
              <Controls />
              <Background color="#444" gap={16} />
            </ReactFlow>
          </div>
          
          {/* PERUBAHAN: Tambahkan pesan jika edges tidak terlihat */}
          {!edgesVisible && (
            <div className="absolute top-2 left-2 bg-red-500 text-white px-3 py-1 rounded text-xs">
              Edge rendering issue detected. Please try zooming out or refreshing.
            </div>
          )}
        </div>
      ) : (
        <div className="flex justify-center items-center h-40 text-gray-400">
          {liveUpdate 
            ? "Searching for recipes..." 
            : "No recipes found for this element. Try another search."}
        </div>
      )}
      
      {/* Legends for highlighting and colors */}
      {nodes.length > 0 && (
        <div className="mt-4 p-3 bg-gray-800 bg-opacity-90 rounded-md flex flex-wrap justify-between text-sm">
          <div className="flex items-center mr-4 mb-2">
            <div className="w-4 h-4 bg-green-700 border-2 border-green-500 rounded-sm mr-2"></div>
            <span className="text-gray-300">Basic Element</span>
          </div>
          <div className="flex items-center mr-4 mb-2">
            <div className="w-4 h-4 bg-amber-700 border-2 border-amber-500 rounded-sm mr-2"></div>
            <span className="text-gray-300">Intermediate Element</span>
          </div>
          <div className="flex items-center mr-4 mb-2">
            <div className="w-4 h-4 bg-blue-700 border-2 border-blue-500 rounded-sm mr-2"></div>
            <span className="text-gray-300">Target Element</span>
          </div>
          <div className="flex items-center mr-4 mb-2">
            <div className="w-4 h-4 bg-gray-600 border-2 border-gray-500 rounded-sm mr-2"></div>
            <span className="text-gray-300">Combine Node (+)</span>
          </div>
          <div className="flex items-center mb-2">
            <div className="w-4 h-4 bg-amber-700 border-2 border-amber-500 rounded-sm ring-2 ring-yellow-300 mr-2"></div>
            <span className="text-gray-300">Newly Discovered</span>
          </div>
        </div>
      )}
    </div>
  );
};

<div style={{ height: '70vh' }} className="border border-gray-700 rounded-md overflow-hidden">
  {/* ReactFlow */}
</div>

export default RecipeVisualizer;