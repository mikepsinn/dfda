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
          "description": "📞 Get in touch with us for inquiries or support",
          "displayName": "Contact Us"
        },
        "help": {
          "name": "help",
          "path": "/(frontpage)/help",
          "isDynamic": false,
          "children": {},
          "emoji": "❓",
          "description": "🆘 Find assistance and answers to common questions",
          "displayName": "Help"
        },
        "privacy": {
          "name": "privacy",
          "path": "/(frontpage)/privacy",
          "isDynamic": false,
          "children": {},
          "emoji": "🔒",
          "description": "🔏 Review our privacy policy and data handling practices",
          "displayName": "Privacy Policy"
        }
      },
      "emoji": "📰",
      "description": "📄 Explore the main content and features of the application",
      "displayName": "Frontpage"
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
          "description": "👥 Discover the authors behind our articles",
          "displayName": "Authors"
        },
        "categories": {
          "name": "categories",
          "path": "/articles/categories",
          "isDynamic": false,
          "children": {},
          "emoji": "📂",
          "description": "📁 Explore articles by different categories",
          "displayName": "Categories"
        },
        "tags": {
          "name": "tags",
          "path": "/articles/tags",
          "isDynamic": false,
          "children": {},
          "emoji": "🏷️",
          "description": "🏷️ Find articles using various tags and keywords",
          "displayName": "Tags"
        }
      },
      "emoji": "📝",
      "description": "📚 Browse through a collection of articles and publications",
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
          "description": "⏱️ Test your reaction time with our interactive tool",
          "displayName": "Reaction Test"
        }
      },
      "emoji": "🧠",
      "description": "🧠 Explore cognitive science resources and studies",
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
              "description": "📊 Access comprehensive studies on the specified condition",
              "displayName": "Mega Study"
            },
            "meta-analysis": {
              "name": "meta-analysis",
              "path": "/conditions/[conditionName]/meta-analysis",
              "isDynamic": false,
              "children": {},
              "emoji": "📈",
              "description": "📈 Review meta-analyses related to the specified condition",
              "displayName": "Meta Analysis"
            },
            "treatment-reviews": {
              "name": "treatment-reviews",
              "path": "/conditions/[conditionName]/treatment-reviews",
              "isDynamic": false,
              "children": {},
              "emoji": "📝",
              "description": "📝 Read reviews of treatments for the specified condition",
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
                      "description": "📊 Analyze the cost-benefit of a specific treatment",
                      "displayName": "Treatment CBA"
                    }
                  },
                  "emoji": "💉",
                  "description": "💉 Get detailed information about a specific treatment",
                  "displayName": "Treatment Details"
                }
              },
              "emoji": "💊",
              "description": "💊 Explore available treatments for the specified condition",
              "displayName": "Treatments"
            }
          },
          "emoji": "🩹",
          "description": "📖 View detailed information about a specific health condition",
          "displayName": "Condition Details"
        }
      },
      "emoji": "⚕️",
      "description": "🩺 Browse various health conditions and related information",
      "displayName": "Conditions"
    },
    "dashboard": {
      "name": "dashboard",
      "path": "/dashboard",
      "isDynamic": false,
      "children": {},
      "emoji": "📊",
      "description": "📊 View your personal dashboard with key metrics and recent activity",
      "displayName": "Dashboard"
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
          "emoji": "🗺️",
          "description": "🗺️ Review the application blueprint and architecture",
          "displayName": "Blueprint"
        },
        "disease-eradication-act": {
          "name": "disease-eradication-act",
          "path": "/docs/disease-eradication-act",
          "isDynamic": false,
          "children": {},
          "emoji": "📜",
          "description": "📜 Learn about the Disease Eradication Act and its implications",
          "displayName": "Disease Eradication Act"
        },
        "health-savings-sharing": {
          "name": "health-savings-sharing",
          "path": "/docs/health-savings-sharing",
          "isDynamic": false,
          "children": {},
          "emoji": "💰",
          "description": "💰 Understand health savings and sharing options",
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
      "description": "📖 Access documentation and resources for the application",
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
              "description": "📊 Visualize data related to a specific global variable",
              "displayName": "Variable Charts"
            },
            "settings": {
              "name": "settings",
              "path": "/globalVariables/[variableId]/settings",
              "isDynamic": false,
              "children": {},
              "emoji": "⚙️",
              "description": "⚙️ Configure settings for a specific global variable",
              "displayName": "Variable Settings"
            }
          },
          "emoji": "🔍",
          "description": "🔍 View details for a specific global variable",
          "displayName": "Global Variable Details"
        }
      },
      "emoji": "🌍",
      "description": "🌐 Manage global variables used throughout the application",
      "displayName": "Global Variables"
    },
    "import": {
      "name": "import",
      "path": "/import",
      "isDynamic": false,
      "children": {},
      "emoji": "⬆️",
      "description": "⬆️ Import data into the application",
      "displayName": "Import Data"
    },
    "inbox": {
      "name": "inbox",
      "path": "/inbox",
      "isDynamic": false,
      "children": {},
      "emoji": "📥",
      "description": "📬 Check your messages and notifications",
      "displayName": "Inbox"
    },
    "measurements": {
      "name": "measurements",
      "path": "/measurements",
      "isDynamic": false,
      "children": {
        "add": {
          "name": "add",
          "path": "/measurements/add",
          "isDynamic": false,
          "children": {},
          "emoji": "➕",
          "description": "➕ Add new measurements to your profile",
          "displayName": "Add Measurement"
        },
        "image2measurements": {
          "name": "image2measurements",
          "path": "/measurements/image2measurements",
          "isDynamic": false,
          "children": {},
          "emoji": "🖼️",
          "description": "🖼️ Convert images into measurable data",
          "displayName": "Image to Measurements"
        },
        "text2measurements": {
          "name": "text2measurements",
          "path": "/measurements/text2measurements",
          "isDynamic": false,
          "children": {},
          "emoji": "📝",
          "description": "📝 Convert text into measurable data",
          "displayName": "Text to Measurements"
        }
      },
      "emoji": "📏",
      "description": "📏 View and manage your measurements",
      "displayName": "Measurements"
    },
    "predictor-search": {
      "name": "predictor-search",
      "path": "/predictor-search",
      "isDynamic": false,
      "children": {},
      "emoji": "🔍",
      "description": "🔍 Search for predictors in the application",
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
          "description": "✨ Enhance your research capabilities with our tools",
          "displayName": "Enhance Research"
        }
      },
      "emoji": "🔬",
      "description": "🔬 Access researcher tools and resources",
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
              "displayName": "Safe Redirect"
            }
          },
          "emoji": "➡️",
          "description": "➡️ Redirect to a specified safe location",
          "displayName": "Redirect"
        }
      },
      "emoji": "🔒",
      "description": "🔒 Access secure areas of the application",
      "displayName": "Safe Area"
    },
    "search": {
      "name": "search",
      "path": "/search",
      "isDynamic": false,
      "children": {},
      "emoji": "🔍",
      "description": "🔍 Search for content within the application",
      "displayName": "Search"
    },
    "settings": {
      "name": "settings",
      "path": "/settings",
      "isDynamic": false,
      "children": {
        "accounts": {
          "name": "accounts",
          "path": "/settings/accounts",
          "isDynamic": false,
          "children": {},
          "emoji": "👤",
          "description": "👥 Manage your account settings and preferences",
          "displayName": "Account Settings"
        },
        "newsletter": {
          "name": "newsletter",
          "path": "/settings/newsletter",
          "isDynamic": false,
          "children": {},
          "emoji": "📰",
          "description": "📰 Subscribe or manage your newsletter preferences",
          "displayName": "Newsletter Settings"
        }
      },
      "emoji": "⚙️",
      "description": "⚙️ Configure your account and application preferences",
      "displayName": "Settings"
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
          "description": "➕ Create a new study in the application",
          "displayName": "Create Study"
        },
        "studyId": {
          "name": "studyId",
          "path": "/study/[studyId]",
          "isDynamic": true,
          "children": {},
          "emoji": "📄",
          "description": "📄 View details of a specific study",
          "displayName": "Study Details"
        }
      },
      "emoji": "📖",
      "description": "📖 Explore various studies and research topics",
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
              "description": "📊 Analyze the cost-benefit of a specific treatment",
              "displayName": "Treatment CBA"
            },
            "mega-study": {
              "name": "mega-study",
              "path": "/treatments/[treatmentName]/mega-study",
              "isDynamic": false,
              "children": {},
              "emoji": "📊",
              "description": "📊 Access comprehensive studies on the specified treatment",
              "displayName": "Treatment Mega Study"
            },
            "meta-analysis": {
              "name": "meta-analysis",
              "path": "/treatments/[treatmentName]/meta-analysis",
              "isDynamic": false,
              "children": {},
              "emoji": "📈",
              "description": "📈 Review meta-analyses related to the specified treatment",
              "displayName": "Treatment Meta Analysis"
            },
            "trials": {
              "name": "trials",
              "path": "/treatments/[treatmentName]/trials",
              "isDynamic": false,
              "children": {},
              "emoji": "🧪",
              "description": "🧪 Explore clinical trials related to the specified treatment",
              "displayName": "Treatment Trials"
            }
          },
          "emoji": "💉",
          "description": "💉 Get detailed information about a specific treatment",
          "displayName": "Treatment Details"
        }
      },
      "emoji": "💊",
      "description": "💊 Browse available treatments and therapies",
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
          "description": "🔍 Search for specific clinical trials",
          "displayName": "Trial Search"
        }
      },
      "emoji": "🔬",
      "description": "🔬 Browse through various clinical trials",
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
              "description": "📊 Visualize data related to a specific user variable",
              "displayName": "User Variable Charts"
            },
            "settings": {
              "name": "settings",
              "path": "/userVariables/[variableId]/settings",
              "isDynamic": false,
              "children": {},
              "emoji": "⚙️",
              "description": "⚙️ Configure settings for a specific user variable",
              "displayName": "User Variable Settings"
            }
          },
          "emoji": "🔍",
          "description": "🔍 View details for a specific user variable",
          "displayName": "User Variable Details"
        }
      },
      "emoji": "👤",
      "description": "👤 Manage user-specific variables in the application",
      "displayName": "User Variables"
    }
  },
  "emoji": "🏠",
  "description": "🌐 Welcome to the homepage of the application",
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
