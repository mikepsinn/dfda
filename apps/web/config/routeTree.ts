// Generated route tree - do not edit manually
export const routeTree = {
  "name": "root",
  "path": "/",
  "isDynamic": false,
  "children": {
    "(frontpage)": {
      "name": "(frontpage)",
      "path": "/(frontpage)",
      "isDynamic": false,
      "children": {
        "contact-us": {
          "name": "contact-us",
          "path": "/(frontpage)/contact-us",
          "isDynamic": false,
          "children": {}
        },
        "privacy": {
          "name": "privacy",
          "path": "/(frontpage)/privacy",
          "isDynamic": false,
          "children": {}
        }
      }
    },
    "articles": {
      "name": "articles",
      "path": "/articles",
      "isDynamic": false,
      "children": {
        "authors": {
          "name": "authors",
          "path": "/articles/authors",
          "isDynamic": false,
          "children": {}
        },
        "categories": {
          "name": "categories",
          "path": "/articles/categories",
          "isDynamic": false,
          "children": {}
        },
        "tags": {
          "name": "tags",
          "path": "/articles/tags",
          "isDynamic": false,
          "children": {}
        }
      }
    },
    "cba": {
      "name": "cba",
      "path": "/cba",
      "isDynamic": false,
      "children": {
        "muscle-mass": {
          "name": "muscle-mass",
          "path": "/cba/muscle-mass",
          "isDynamic": false,
          "children": {}
        }
      }
    },
    "cognition": {
      "name": "cognition",
      "path": "/cognition",
      "isDynamic": false,
      "children": {
        "reaction-test": {
          "name": "reaction-test",
          "path": "/cognition/reaction-test",
          "isDynamic": false,
          "children": {}
        }
      }
    },
    "conditions": {
      "name": "conditions",
      "path": "/conditions",
      "isDynamic": false,
      "children": {
        "conditionName": {
          "name": "conditionName",
          "path": "/conditions/[conditionName]",
          "isDynamic": true,
          "children": {
            "meta-analysis": {
              "name": "meta-analysis",
              "path": "/conditions/[conditionName]/meta-analysis",
              "isDynamic": false,
              "children": {}
            },
            "treatments": {
              "name": "treatments",
              "path": "/conditions/[conditionName]/treatments",
              "isDynamic": false,
              "children": {
                "ratings": {
                  "name": "ratings",
                  "path": "/conditions/[conditionName]/treatments/ratings",
                  "isDynamic": false,
                  "children": {}
                },
                "treatmentName": {
                  "name": "treatmentName",
                  "path": "/conditions/[conditionName]/treatments/[treatmentName]",
                  "isDynamic": true,
                  "children": {
                    "cost-benefit-analysis": {
                      "name": "cost-benefit-analysis",
                      "path": "/conditions/[conditionName]/treatments/[treatmentName]/cost-benefit-analysis",
                      "isDynamic": false,
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
    "cure-acceleration-act": {
      "name": "cure-acceleration-act",
      "path": "/cure-acceleration-act",
      "isDynamic": false,
      "children": {}
    },
    "docs": {
      "name": "docs",
      "path": "/docs",
      "isDynamic": false,
      "children": {
        "blueprint": {
          "name": "blueprint",
          "path": "/docs/blueprint",
          "isDynamic": false,
          "children": {}
        },
        "cure-acceleration-act": {
          "name": "cure-acceleration-act",
          "path": "/docs/cure-acceleration-act",
          "isDynamic": false,
          "children": {}
        },
        "health-savings-sharing": {
          "name": "health-savings-sharing",
          "path": "/docs/health-savings-sharing",
          "isDynamic": false,
          "children": {}
        },
        "...filename": {
          "name": "...filename",
          "path": "/docs/[...filename]",
          "isDynamic": true,
          "children": {}
        }
      }
    },
    "globalVariables": {
      "name": "globalVariables",
      "path": "/globalVariables",
      "isDynamic": false,
      "children": {
        "variableId": {
          "name": "variableId",
          "path": "/globalVariables/[variableId]",
          "isDynamic": true,
          "children": {
            "charts": {
              "name": "charts",
              "path": "/globalVariables/[variableId]/charts",
              "isDynamic": false,
              "children": {}
            },
            "settings": {
              "name": "settings",
              "path": "/globalVariables/[variableId]/settings",
              "isDynamic": false,
              "children": {}
            }
          }
        }
      }
    },
    "health-savings-sharing": {
      "name": "health-savings-sharing",
      "path": "/health-savings-sharing",
      "isDynamic": false,
      "children": {}
    },
    "import": {
      "name": "import",
      "path": "/import",
      "isDynamic": false,
      "children": {}
    },
    "inbox": {
      "name": "inbox",
      "path": "/inbox",
      "isDynamic": false,
      "children": {}
    },
    "measurements": {
      "name": "measurements",
      "path": "/measurements",
      "isDynamic": false,
      "children": {
        "image2measurements": {
          "name": "image2measurements",
          "path": "/measurements/image2measurements",
          "isDynamic": false,
          "children": {}
        },
        "text2measurements": {
          "name": "text2measurements",
          "path": "/measurements/text2measurements",
          "isDynamic": false,
          "children": {}
        }
      }
    },
    "predictor-search": {
      "name": "predictor-search",
      "path": "/predictor-search",
      "isDynamic": false,
      "children": {}
    },
    "researcher": {
      "name": "researcher",
      "path": "/researcher",
      "isDynamic": false,
      "children": {
        "enhance": {
          "name": "enhance",
          "path": "/researcher/enhance",
          "isDynamic": false,
          "children": {}
        }
      }
    },
    "safe": {
      "name": "safe",
      "path": "/safe",
      "isDynamic": false,
      "children": {
        "redirect": {
          "name": "redirect",
          "path": "/safe/redirect",
          "isDynamic": false,
          "children": {
            "path": {
              "name": "path",
              "path": "/safe/redirect/[path]",
              "isDynamic": true,
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
      "children": {}
    },
    "study": {
      "name": "study",
      "path": "/study",
      "isDynamic": false,
      "children": {
        "create": {
          "name": "create",
          "path": "/study/create",
          "isDynamic": false,
          "children": {}
        },
        "studyId": {
          "name": "studyId",
          "path": "/study/[studyId]",
          "isDynamic": true,
          "children": {}
        }
      }
    },
    "text2measurements": {
      "name": "text2measurements",
      "path": "/text2measurements",
      "isDynamic": false,
      "children": {}
    },
    "top-treatments": {
      "name": "top-treatments",
      "path": "/top-treatments",
      "isDynamic": false,
      "children": {}
    },
    "treatments": {
      "name": "treatments",
      "path": "/treatments",
      "isDynamic": false,
      "children": {
        "treatmentName": {
          "name": "treatmentName",
          "path": "/treatments/[treatmentName]",
          "isDynamic": true,
          "children": {
            "cba": {
              "name": "cba",
              "path": "/treatments/[treatmentName]/cba",
              "isDynamic": false,
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
      "children": {
        "search": {
          "name": "search",
          "path": "/trials/search",
          "isDynamic": false,
          "children": {}
        }
      }
    },
    "userVariables": {
      "name": "userVariables",
      "path": "/userVariables",
      "isDynamic": false,
      "children": {
        "variableId": {
          "name": "variableId",
          "path": "/userVariables/[variableId]",
          "isDynamic": true,
          "children": {
            "charts": {
              "name": "charts",
              "path": "/userVariables/[variableId]/charts",
              "isDynamic": false,
              "children": {}
            },
            "settings": {
              "name": "settings",
              "path": "/userVariables/[variableId]/settings",
              "isDynamic": false,
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
