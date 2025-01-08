// Generated route tree - do not edit manually
// Regenerate with: pnpm generate-routes
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
          "children": {},
          "emoji": "✉️",
          "description": "📞 Get in touch with us through the contact form",
          "displayName": "Contact Us"
        },
        "privacy": {
          "name": "privacy",
          "path": "/(frontpage)/privacy",
          "isDynamic": false,
          "children": {},
          "emoji": "🔒",
          "description": "🛡️ Read our privacy policy and data handling practices",
          "displayName": "Privacy Policy"
        }
      },
      "emoji": "📰",
      "description": "📄 View the front page with featured content and updates",
      "displayName": "Front Page"
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
          "children": {},
          "emoji": "✍️",
          "description": "👥 Explore articles by different authors",
          "displayName": "Authors"
        },
        "categories": {
          "name": "categories",
          "path": "/articles/categories",
          "isDynamic": false,
          "children": {},
          "emoji": "📂",
          "description": "📁 View articles organized by categories",
          "displayName": "Categories"
        },
        "tags": {
          "name": "tags",
          "path": "/articles/tags",
          "isDynamic": false,
          "children": {},
          "emoji": "🏷️",
          "description": "🏷️ Discover articles by tags and keywords",
          "displayName": "Tags"
        }
      },
      "emoji": "📝",
      "description": "📚 Browse a collection of articles on various topics",
      "displayName": "Articles"
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
          "children": {},
          "emoji": "💪",
          "description": "📉 Analyze cost-benefit data related to muscle mass",
          "displayName": "Muscle Mass CBA"
        }
      },
      "emoji": "📊",
      "description": "📈 Access cost-benefit analysis resources",
      "displayName": "Cost-Benefit Analysis"
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
          "children": {},
          "emoji": "⚡",
          "description": "⏱️ Take a test to measure your reaction time",
          "displayName": "Reaction Test"
        }
      },
      "emoji": "🧠",
      "description": "🧠 Explore cognitive science resources and information",
      "displayName": "Cognition"
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
            "mega-study": {
              "name": "mega-study",
              "path": "/conditions/[conditionName]/mega-study",
              "isDynamic": false,
              "children": {},
              "emoji": "📊",
              "description": "📚 Access comprehensive studies related to the condition",
              "displayName": "Mega Study"
            },
            "meta-analysis": {
              "name": "meta-analysis",
              "path": "/conditions/[conditionName]/meta-analysis",
              "isDynamic": false,
              "children": {},
              "emoji": "📈",
              "description": "📉 Review meta-analyses for the specified condition",
              "displayName": "Meta Analysis"
            },
            "treatment-reviews": {
              "name": "treatment-reviews",
              "path": "/conditions/[conditionName]/treatment-reviews",
              "isDynamic": false,
              "children": {},
              "emoji": "📝",
              "description": "🩺 Read reviews of treatments for the condition",
              "displayName": "Treatment Reviews"
            },
            "treatments": {
              "name": "treatments",
              "path": "/conditions/[conditionName]/treatments",
              "isDynamic": false,
              "children": {
                "treatmentName": {
                  "name": "treatmentName",
                  "path": "/conditions/[conditionName]/treatments/[treatmentName]",
                  "isDynamic": true,
                  "children": {
                    "cost-benefit-analysis": {
                      "name": "cost-benefit-analysis",
                      "path": "/conditions/[conditionName]/treatments/[treatmentName]/cost-benefit-analysis",
                      "isDynamic": false,
                      "children": {},
                      "emoji": "📊",
                      "description": "📈 Analyze the cost-benefit of a specific treatment",
                      "displayName": "Treatment CBA"
                    }
                  },
                  "emoji": "💉",
                  "description": "💉 View detailed information about a specific treatment",
                  "displayName": "Treatment Details"
                }
              },
              "emoji": "💊",
              "description": "💊 Explore available treatments for the condition",
              "displayName": "Treatments"
            }
          },
          "emoji": "🩹",
          "description": "🔍 View detailed information about a specific condition",
          "displayName": "Condition Details"
        }
      },
      "emoji": "⚕️",
      "description": "🩺 Browse various medical conditions and their details",
      "displayName": "Conditions"
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
          "children": {},
          "emoji": "📋",
          "description": "📑 View the blueprint for the application",
          "displayName": "Blueprint"
        },
        "cure-acceleration-act": {
          "name": "cure-acceleration-act",
          "path": "/docs/cure-acceleration-act",
          "isDynamic": false,
          "children": {},
          "emoji": "📜",
          "description": "📜 Read about the Cure Acceleration Act",
          "displayName": "Cure Acceleration Act"
        },
        "health-savings-sharing": {
          "name": "health-savings-sharing",
          "path": "/docs/health-savings-sharing",
          "isDynamic": false,
          "children": {},
          "emoji": "💰",
          "description": "💵 Learn about health savings and sharing options",
          "displayName": "Health Savings Sharing"
        },
        "...filename": {
          "name": "...filename",
          "path": "/docs/[...filename]",
          "isDynamic": true,
          "children": {},
          "emoji": "📄",
          "description": "📄 Access specific documentation files",
          "displayName": "Documentation File"
        }
      },
      "emoji": "📚",
      "description": "📖 Access documentation and resources",
      "displayName": "Documentation"
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
              "children": {},
              "emoji": "📊",
              "description": "📈 View charts related to the global variable",
              "displayName": "Variable Charts"
            },
            "settings": {
              "name": "settings",
              "path": "/globalVariables/[variableId]/settings",
              "isDynamic": false,
              "children": {},
              "emoji": "⚙️",
              "description": "⚙️ Configure settings for the global variable",
              "displayName": "Variable Settings"
            }
          },
          "emoji": "🔍",
          "description": "🔍 View details for a specific global variable",
          "displayName": "Global Variable Details"
        }
      },
      "emoji": "🌍",
      "description": "🌐 View and manage global variables used in the application",
      "displayName": "Global Variables"
    },
    "import": {
      "name": "import",
      "path": "/import",
      "isDynamic": false,
      "children": {},
      "emoji": "⬆️",
      "description": "📤 Import data into the application",
      "displayName": "Import Data"
    },
    "inbox": {
      "name": "inbox",
      "path": "/inbox",
      "isDynamic": false,
      "children": {},
      "emoji": "📥",
      "description": "📬 Check your inbox for messages and notifications",
      "displayName": "Inbox"
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
          "children": {},
          "emoji": "🖼️",
          "description": "📷 Convert images into measurable data",
          "displayName": "Image to Measurements"
        },
        "text2measurements": {
          "name": "text2measurements",
          "path": "/measurements/text2measurements",
          "isDynamic": false,
          "children": {},
          "emoji": "📝",
          "description": "📄 Convert text into measurable data",
          "displayName": "Text to Measurements"
        }
      },
      "emoji": "📏",
      "description": "📐 View and manage various measurements",
      "displayName": "Measurements"
    },
    "predictor-search": {
      "name": "predictor-search",
      "path": "/predictor-search",
      "isDynamic": false,
      "children": {},
      "emoji": "🔍",
      "description": "🔎 Search for predictors and related data",
      "displayName": "Predictor Search"
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
          "children": {},
          "emoji": "✨",
          "description": "🌟 Enhance your research with additional tools",
          "displayName": "Enhance Research"
        }
      },
      "emoji": "🔬",
      "description": "🔍 Access resources for researchers",
      "displayName": "Researcher"
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
              "children": {},
              "emoji": "🔗",
              "description": "🔗 Redirect to a specific path securely",
              "displayName": "Secure Redirect"
            }
          },
          "emoji": "➡️",
          "description": "🔄 Redirect to a specified safe location",
          "displayName": "Redirect"
        }
      },
      "emoji": "🔒",
      "description": "🔐 Access secure areas of the application",
      "displayName": "Safe Area"
    },
    "search": {
      "name": "search",
      "path": "/search",
      "isDynamic": false,
      "children": {},
      "emoji": "🔍",
      "description": "🔎 Search the application for content and resources",
      "displayName": "Search"
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
          "children": {},
          "emoji": "➕",
          "description": "➕ Create a new study",
          "displayName": "Create Study"
        },
        "studyId": {
          "name": "studyId",
          "path": "/study/[studyId]",
          "isDynamic": true,
          "children": {},
          "emoji": "📄",
          "description": "📄 View details for a specific study",
          "displayName": "Study Details"
        }
      },
      "emoji": "📖",
      "description": "📚 Access study resources and information",
      "displayName": "Study"
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
              "children": {},
              "emoji": "📊",
              "description": "📈 Analyze the cost-benefit of a specific treatment",
              "displayName": "Treatment CBA"
            }
          },
          "emoji": "💉",
          "description": "💉 View details for a specific treatment",
          "displayName": "Treatment Details"
        }
      },
      "emoji": "💊",
      "description": "💊 Browse available treatments",
      "displayName": "Treatments"
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
          "children": {},
          "emoji": "🔍",
          "description": "🔎 Search for clinical trials",
          "displayName": "Trial Search"
        }
      },
      "emoji": "⚖️",
      "description": "⚖️ Explore clinical trials and their details",
      "displayName": "Trials"
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
              "children": {},
              "emoji": "📊",
              "description": "📈 View charts related to the user variable",
              "displayName": "User Variable Charts"
            },
            "settings": {
              "name": "settings",
              "path": "/userVariables/[variableId]/settings",
              "isDynamic": false,
              "children": {},
              "emoji": "⚙️",
              "description": "⚙️ Configure settings for the user variable",
              "displayName": "User Variable Settings"
            }
          },
          "emoji": "🔍",
          "description": "🔍 View details for a specific user variable",
          "displayName": "User Variable Details"
        }
      },
      "emoji": "👤",
      "description": "👥 View and manage user-specific variables",
      "displayName": "User Variables"
    }
  },
  "emoji": "🏠",
  "description": "🌐 Access the main landing page of the application",
  "displayName": "Home"
} as const;

export type RouteNode = {
  name: string;
  path: string;
  isDynamic: boolean;
  emoji?: string;
  description?: string;
  displayName?: string;
  children: { [key: string]: RouteNode };
};
