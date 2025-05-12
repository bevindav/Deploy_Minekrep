// Mock data untuk testing visualisasi recipe tree dengan format ideal
export const mockRecipeData = {
    "recipes": [
      {
        "targetElement": "Brick",
        "steps": [
          {
            "element1": "Water",
            "element2": "Earth",
            "result": "Mud",
            "icon_filename": "mud.png"
          },
          {
            "element1": "Mud",
            "element2": "Fire",
            "result": "Brick",
            "icon_filename": "brick.png"
          }
        ]
      },
      {
        "targetElement": "Brick",
        "steps": [
          {
            "element1": "Earth", 
            "element2": "Fire",
            "result": "Lava",
            "icon_filename": "lava.png"
          },
          {
            "element1": "Lava",
            "element2": "Air",
            "result": "Stone",
            "icon_filename": "stone.png"
          },
          {
            "element1": "Earth",
            "element2": "Water",
            "result": "Mud",
            "icon_filename": "mud.png"
          },
          {
            "element1": "Mud",
            "element2": "Stone",
            "result": "Clay",
            "icon_filename": "clay.png"
          },
          {
            "element1": "Clay",
            "element2": "Fire",
            "result": "Brick",
            "icon_filename": "brick.png"
          }
        ]
      }
    ],
    "liveUpdateSteps": [
      {
        "step": 1,
        "message": "Starting search for Brick...",
        "partial_tree": null,
        "highlight_nodes": []
      },
      {
        "step": 2,
        "message": "Exploring basic element combinations...",
        "partial_tree": {
          "targetElement": "Brick",
          "steps": []
        },
        "highlight_nodes": ["Earth", "Fire", "Water", "Air"]
      },
      {
        "step": 3,
        "message": "Found combination: Water + Earth = Mud",
        "partial_tree": {
          "targetElement": "Brick",
          "steps": [
            {
              "element1": "Water",
              "element2": "Earth",
              "result": "Mud",
              "icon_filename": "mud.png"
            }
          ]
        },
        "highlight_nodes": ["Mud", "Water", "Earth"]
      },
      {
        "step": 4,
        "message": "Trying combinations with Mud...",
        "partial_tree": {
          "targetElement": "Brick",
          "steps": [
            {
              "element1": "Water",
              "element2": "Earth",
              "result": "Mud",
              "icon_filename": "mud.png"
            }
          ]
        },
        "highlight_nodes": ["Mud"]
      },
      {
        "step": 5,
        "message": "Found recipe: Mud + Fire = Brick!",
        "partial_tree": {
          "targetElement": "Brick",
          "steps": [
            {
              "element1": "Water",
              "element2": "Earth",
              "result": "Mud",
              "icon_filename": "mud.png"
            },
            {
              "element1": "Mud",
              "element2": "Fire",
              "result": "Brick",
              "icon_filename": "brick.png"
            }
          ]
        },
        "highlight_nodes": ["Brick", "Mud", "Fire"]
      }
    ],
    "metrics": {
      "time": 120.5,
      "nodesVisited": 45
    }
  };
  
  // Mock live update steps untuk recipe simple
  export const mockLiveUpdateSteps = mockRecipeData.liveUpdateSteps;
  
  // Mock live update steps untuk recipe kompleks
  export const mockComplexLiveUpdateSteps = [
    {
      "step": 1,
      "message": "Starting search for Brick...",
      "partial_tree": null,
      "highlight_nodes": []
    },
    {
      "step": 2,
      "message": "Exploring basic element combinations...",
      "partial_tree": {
        "targetElement": "Brick",
        "steps": []
      },
      "highlight_nodes": ["Earth", "Fire", "Water", "Air"]
    },
    {
      "step": 3,
      "message": "Found combination: Earth + Fire = Lava",
      "partial_tree": {
        "targetElement": "Brick",
        "steps": [
          {
            "element1": "Earth", 
            "element2": "Fire",
            "result": "Lava",
            "icon_filename": "lava.png"
          }
        ]
      },
      "highlight_nodes": ["Lava", "Earth", "Fire"]
    },
    {
      "step": 4,
      "message": "Found combination: Lava + Air = Stone",
      "partial_tree": {
        "targetElement": "Brick",
        "steps": [
          {
            "element1": "Earth", 
            "element2": "Fire",
            "result": "Lava",
            "icon_filename": "lava.png"
          },
          {
            "element1": "Lava",
            "element2": "Air",
            "result": "Stone",
            "icon_filename": "stone.png"
          }
        ]
      },
      "highlight_nodes": ["Stone", "Lava", "Air"]
    },
    {
      "step": 5,
      "message": "Found combination: Earth + Water = Mud",
      "partial_tree": {
        "targetElement": "Brick",
        "steps": [
          {
            "element1": "Earth", 
            "element2": "Fire",
            "result": "Lava",
            "icon_filename": "lava.png"
          },
          {
            "element1": "Lava",
            "element2": "Air",
            "result": "Stone",
            "icon_filename": "stone.png"
          },
          {
            "element1": "Earth",
            "element2": "Water",
            "result": "Mud",
            "icon_filename": "mud.png"
          }
        ]
      },
      "highlight_nodes": ["Mud", "Earth", "Water"]
    },
    {
      "step": 6,
      "message": "Found combination: Mud + Stone = Clay",
      "partial_tree": {
        "targetElement": "Brick",
        "steps": [
          {
            "element1": "Earth", 
            "element2": "Fire",
            "result": "Lava",
            "icon_filename": "lava.png"
          },
          {
            "element1": "Lava",
            "element2": "Air",
            "result": "Stone",
            "icon_filename": "stone.png"
          },
          {
            "element1": "Earth",
            "element2": "Water",
            "result": "Mud",
            "icon_filename": "mud.png"
          },
          {
            "element1": "Mud",
            "element2": "Stone",
            "result": "Clay",
            "icon_filename": "clay.png"
          }
        ]
      },
      "highlight_nodes": ["Clay", "Mud", "Stone"]
    },
    {
      "step": 7,
      "message": "Found recipe: Clay + Fire = Brick!",
      "partial_tree": {
        "targetElement": "Brick",
        "steps": [
          {
            "element1": "Earth", 
            "element2": "Fire",
            "result": "Lava",
            "icon_filename": "lava.png"
          },
          {
            "element1": "Lava",
            "element2": "Air",
            "result": "Stone",
            "icon_filename": "stone.png"
          },
          {
            "element1": "Earth",
            "element2": "Water",
            "result": "Mud",
            "icon_filename": "mud.png"
          },
          {
            "element1": "Mud",
            "element2": "Stone",
            "result": "Clay",
            "icon_filename": "clay.png"
          },
          {
            "element1": "Clay",
            "element2": "Fire",
            "result": "Brick",
            "icon_filename": "brick.png"
          }
        ]
      },
      "highlight_nodes": ["Brick", "Clay", "Fire"]
    }
  ];
  
  // Mock data untuk contoh elemen Bakery (lebih kompleks)
  export const mockBakeryRecipeData = {
    "recipes": [
      {
        "targetElement": "Bakery",
        "steps": [
          {
            "element1": "Fire",
            "element2": "Earth",
            "result": "Lava",
            "icon_filename": "lava.png"
          },
          {
            "element1": "Lava",
            "element2": "Air",
            "result": "Stone",
            "icon_filename": "stone.png"
          },
          {
            "element1": "Stone",
            "element2": "Fire",
            "result": "Metal",
            "icon_filename": "metal.png"
          },
          {
            "element1": "Metal",
            "element2": "Earth",
            "result": "Plow",
            "icon_filename": "plow.png"
          },
          {
            "element1": "Plow",
            "element2": "Earth",
            "result": "Field",
            "icon_filename": "field.png"
          },
          {
            "element1": "Field",
            "element2": "Earth",
            "result": "Wheat",
            "icon_filename": "wheat.png"
          },
          {
            "element1": "Wheat",
            "element2": "Stone",
            "result": "Flour",
            "icon_filename": "flour.png"
          },
          {
            "element1": "Flour",
            "element2": "Fire",
            "result": "Bread",
            "icon_filename": "bread.png"
          },
          {
            "element1": "Bread",
            "element2": "Human",
            "result": "Baker",
            "icon_filename": "baker.png"
          },
          {
            "element1": "Baker",
            "element2": "House",
            "result": "Bakery",
            "icon_filename": "bakery.png"
          }
        ]
      }
    ],
    "metrics": {
      "time": 250.7,
      "nodesVisited": 102
    }
  };
  
  // Fungsi untuk membuat live update steps dari recipe data (untuk digunakan dengan recipe custom)
  export const createLiveUpdateSteps = (recipeData) => {
    // Pastikan ada recipe yang valid
    if (!recipeData || !recipeData.recipes || recipeData.recipes.length === 0) {
      return [];
    }
    
    // Ambil recipe pertama untuk live update
    const targetRecipe = recipeData.recipes[0];
    const steps = targetRecipe.steps;
    const targetElement = targetRecipe.targetElement;
    
    // Buat array langkah-langkah secara dinamis
    const liveUpdateSteps = [
      {
        step: 1,
        message: `Starting search for ${targetElement}...`,
        partial_tree: null,
        highlight_nodes: []
      },
      {
        step: 2,
        message: "Exploring basic element combinations...",
        partial_tree: {
          targetElement: targetElement,
          steps: []
        },
        highlight_nodes: ["Earth", "Fire", "Water", "Air"]
      }
    ];
    
    // Tambahkan langkah untuk setiap step dalam recipe
    let stepCounter = 3;
    
    for (let i = 0; i < steps.length; i++) {
      const currentSteps = steps.slice(0, i + 1);
      const currentStep = steps[i];
      
      // Tambahkan langkah menemukan elemen
      liveUpdateSteps.push({
        step: stepCounter++,
        message: `Found combination: ${currentStep.element1} + ${currentStep.element2} = ${currentStep.result}`,
        partial_tree: {
          targetElement: targetElement,
          steps: currentSteps
        },
        highlight_nodes: [currentStep.result, currentStep.element1, currentStep.element2]
      });
      
      // Jika bukan langkah terakhir, tambahkan langkah exploring
      if (i < steps.length - 1) {
        liveUpdateSteps.push({
          step: stepCounter++,
          message: `Trying combinations with ${currentStep.result}...`,
          partial_tree: {
            targetElement: targetElement,
            steps: currentSteps
          },
          highlight_nodes: [currentStep.result]
        });
      }
    }
    
    return liveUpdateSteps;
  };