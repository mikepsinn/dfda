// Generated route tree - do not edit manually
// Regenerate after adding new pages with: 
// npx ts-node scripts/generateRouteTree.ts
export const routeTree = {
  "name": "root",
  "path": "/",
  "isDynamic": false,
  "displayName": "Root",
  "children": {
    "(frontpage)": {
      "name": "(frontpage)",
      "path": "/(frontpage)",
      "isDynamic": false,
      "displayName": "(frontpage)",
      "children": {
        "contact-us": {
          "name": "contact-us",
          "path": "/(frontpage)/contact-us",
          "isDynamic": false,
          "displayName": "Contact us",
          "children": {}
        },
        "privacy": {
          "name": "privacy",
          "path": "/(frontpage)/privacy",
          "isDynamic": false,
          "displayName": "Privacy",
          "children": {}
        }
      }
    },
    "articles": {
      "name": "articles",
      "path": "/articles",
      "isDynamic": false,
      "displayName": "Articles",
      "children": {
        "authors": {
          "name": "authors",
          "path": "/articles/authors",
          "isDynamic": false,
          "displayName": "Authors",
          "children": {}
        },
        "categories": {
          "name": "categories",
          "path": "/articles/categories",
          "isDynamic": false,
          "displayName": "Categories",
          "children": {}
        },
        "tags": {
          "name": "tags",
          "path": "/articles/tags",
          "isDynamic": false,
          "displayName": "Tags",
          "children": {}
        }
      }
    },
    "cba": {
      "name": "cba",
      "path": "/cba",
      "isDynamic": false,
      "displayName": "Cba",
      "children": {
        "muscle-mass": {
          "name": "muscle-mass",
          "path": "/cba/muscle-mass",
          "isDynamic": false,
          "displayName": "Muscle mass",
          "children": {}
        }
      }
    },
    "cognition": {
      "name": "cognition",
      "path": "/cognition",
      "isDynamic": false,
      "displayName": "Cognition",
      "children": {
        "reaction-test": {
          "name": "reaction-test",
          "path": "/cognition/reaction-test",
          "isDynamic": false,
          "displayName": "Reaction test",
          "children": {}
        }
      }
    },
    "conditions": {
      "name": "conditions",
      "path": "/conditions",
      "isDynamic": false,
      "displayName": "Conditions",
      "children": {
        "conditionName": {
          "name": "conditionName",
          "path": "/conditions/[conditionName]",
          "isDynamic": true,
          "displayName": "[condition Name]",
          "children": {
            "mega-study": {
              "name": "mega-study",
              "path": "/conditions/[conditionName]/mega-study",
              "isDynamic": false,
              "displayName": "Mega study",
              "children": {}
            },
            "meta-analysis": {
              "name": "meta-analysis",
              "path": "/conditions/[conditionName]/meta-analysis",
              "isDynamic": false,
              "displayName": "Meta analysis",
              "children": {}
            },
            "treatment-reviews": {
              "name": "treatment-reviews",
              "path": "/conditions/[conditionName]/treatment-reviews",
              "isDynamic": false,
              "displayName": "Treatment reviews",
              "children": {}
            },
            "treatments": {
              "name": "treatments",
              "path": "/conditions/[conditionName]/treatments",
              "isDynamic": false,
              "displayName": "Treatments",
              "children": {
                "treatmentName": {
                  "name": "treatmentName",
                  "path": "/conditions/[conditionName]/treatments/[treatmentName]",
                  "isDynamic": true,
                  "displayName": "[treatment Name]",
                  "children": {
                    "cost-benefit-analysis": {
                      "name": "cost-benefit-analysis",
                      "path": "/conditions/[conditionName]/treatments/[treatmentName]/cost-benefit-analysis",
                      "isDynamic": false,
                      "displayName": "Cost benefit analysis",
                      "children": {}
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "docs": {
      "name": "docs",
      "path": "/docs",
      "isDynamic": false,
      "displayName": "Docs",
      "children": {
        "blueprint": {
          "name": "blueprint",
          "path": "/docs/blueprint",
          "isDynamic": false,
          "displayName": "Blueprint",
          "children": {}
        },
        "cure-acceleration-act": {
          "name": "cure-acceleration-act",
          "path": "/docs/cure-acceleration-act",
          "isDynamic": false,
          "displayName": "Cure acceleration act",
          "children": {}
        },
        "health-savings-sharing": {
          "name": "health-savings-sharing",
          "path": "/docs/health-savings-sharing",
          "isDynamic": false,
          "displayName": "Health savings sharing",
          "children": {}
        },
        "...filename": {
          "name": "...filename",
          "path": "/docs/[...filename]",
          "isDynamic": true,
          "displayName": "[...filename]",
          "children": {}
        }
      }
    },
    "globalVariables": {
      "name": "globalVariables",
      "path": "/globalVariables",
      "isDynamic": false,
      "displayName": "Global Variables",
      "children": {
        "variableId": {
          "name": "variableId",
          "path": "/globalVariables/[variableId]",
          "isDynamic": true,
          "displayName": "[variable Id]",
          "children": {
            "charts": {
              "name": "charts",
              "path": "/globalVariables/[variableId]/charts",
              "isDynamic": false,
              "displayName": "Charts",
              "children": {}
            },
            "settings": {
              "name": "settings",
              "path": "/globalVariables/[variableId]/settings",
              "isDynamic": false,
              "displayName": "Settings",
              "children": {}
            }
          }
        }
      }
    },
    "import": {
      "name": "import",
      "path": "/import",
      "isDynamic": false,
      "displayName": "Import",
      "children": {}
    },
    "inbox": {
      "name": "inbox",
      "path": "/inbox",
      "isDynamic": false,
      "displayName": "Inbox",
      "children": {}
    },
    "measurements": {
      "name": "measurements",
      "path": "/measurements",
      "isDynamic": false,
      "displayName": "Measurements",
      "children": {
        "image2measurements": {
          "name": "image2measurements",
          "path": "/measurements/image2measurements",
          "isDynamic": false,
          "displayName": "Image2measurements",
          "children": {}
        },
        "text2measurements": {
          "name": "text2measurements",
          "path": "/measurements/text2measurements",
          "isDynamic": false,
          "displayName": "Text2measurements",
          "children": {}
        }
      }
    },
    "predictor-search": {
      "name": "predictor-search",
      "path": "/predictor-search",
      "isDynamic": false,
      "displayName": "Predictor search",
      "children": {}
    },
    "researcher": {
      "name": "researcher",
      "path": "/researcher",
      "isDynamic": false,
      "displayName": "Researcher",
      "children": {
        "enhance": {
          "name": "enhance",
          "path": "/researcher/enhance",
          "isDynamic": false,
          "displayName": "Enhance",
          "children": {}
        }
      }
    },
    "safe": {
      "name": "safe",
      "path": "/safe",
      "isDynamic": false,
      "displayName": "Safe",
      "children": {
        "redirect": {
          "name": "redirect",
          "path": "/safe/redirect",
          "isDynamic": false,
          "displayName": "Redirect",
          "children": {
            "path": {
              "name": "path",
              "path": "/safe/redirect/[path]",
              "isDynamic": true,
              "displayName": "[path]",
              "children": {}
            }
          }
        }
      }
    },
    "search": {
      "name": "search",
      "path": "/search",
      "isDynamic": false,
      "displayName": "Search",
      "children": {}
    },
    "study": {
      "name": "study",
      "path": "/study",
      "isDynamic": false,
      "displayName": "Study",
      "children": {
        "create": {
          "name": "create",
          "path": "/study/create",
          "isDynamic": false,
          "displayName": "Create",
          "children": {}
        },
        "studyId": {
          "name": "studyId",
          "path": "/study/[studyId]",
          "isDynamic": true,
          "displayName": "[study Id]",
          "children": {}
        }
      }
    },
    "treatments": {
      "name": "treatments",
      "path": "/treatments",
      "isDynamic": false,
      "displayName": "Treatments",
      "children": {
        "treatmentName": {
          "name": "treatmentName",
          "path": "/treatments/[treatmentName]",
          "isDynamic": true,
          "displayName": "[treatment Name]",
          "children": {
            "cba": {
              "name": "cba",
              "path": "/treatments/[treatmentName]/cba",
              "isDynamic": false,
              "displayName": "Cba",
              "children": {}
            }
          }
        }
      }
    },
    "trials": {
      "name": "trials",
      "path": "/trials",
      "isDynamic": false,
      "displayName": "Trials",
      "children": {
        "search": {
          "name": "search",
          "path": "/trials/search",
          "isDynamic": false,
          "displayName": "Search",
          "children": {}
        }
      }
    },
    "userVariables": {
      "name": "userVariables",
      "path": "/userVariables",
      "isDynamic": false,
      "displayName": "User Variables",
      "children": {
        "variableId": {
          "name": "variableId",
          "path": "/userVariables/[variableId]",
          "isDynamic": true,
          "displayName": "[variable Id]",
          "children": {
            "charts": {
              "name": "charts",
              "path": "/userVariables/[variableId]/charts",
              "isDynamic": false,
              "displayName": "Charts",
              "children": {}
            },
            "settings": {
              "name": "settings",
              "path": "/userVariables/[variableId]/settings",
              "isDynamic": false,
              "displayName": "Settings",
              "children": {}
            }
          }
        }
      }
    }
  }
} as const;

export type RouteNode = {
  name: string;
  path: string;
  isDynamic: boolean;
  children: { [key: string]: RouteNode };
};
