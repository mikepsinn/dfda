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
          "emoji": "📧",
          "description": "📧 Contact the support team",
          "displayName": "Contact Us"
        },
        "help": {
          "name": "help",
          "path": "/(frontpage)/help",
          "isDynamic": false,
          "children": {},
          "emoji": "❓",
          "description": "❓ Access help and frequently asked questions",
          "displayName": "Help"
        },
        "privacy": {
          "name": "privacy",
          "path": "/(frontpage)/privacy",
          "isDynamic": false,
          "children": {},
          "emoji": "📜",
          "description": "📜 View the application's privacy policy",
          "displayName": "Privacy"
        }
      },
      "emoji": "🏠",
      "description": "🏠 The application's home page",
      "displayName": "Home"
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
          "description": "✍️ Explore articles by author",
          "displayName": "Article Authors"
        },
        "categories": {
          "name": "categories",
          "path": "/articles/categories",
          "isDynamic": false,
          "children": {},
          "emoji": "🏷️",
          "description": "🏷️ Browse articles by category",
          "displayName": "Article Categories"
        },
        "tags": {
          "name": "tags",
          "path": "/articles/tags",
          "isDynamic": false,
          "children": {},
          "emoji": "🔖",
          "description": "🔖 Browse articles by tag",
          "displayName": "Article Tags"
        }
      },
      "emoji": "📰",
      "description": "📰 Browse articles and publications",
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
          "description": "💪 View cost-benefit analysis related to muscle mass",
          "displayName": "Muscle Mass Cba"
        }
      },
      "emoji": "⚖️",
      "description": "⚖️ Access the Cost-Benefit Analysis section",
      "displayName": "Cba"
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
          "emoji": "⏱️",
          "description": "⏱️ Take a reaction test",
          "displayName": "Reaction Test"
        }
      },
      "emoji": "🧠",
      "description": "🧠 Access cognition-related tests and information",
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
              "emoji": "🔬",
              "description": "🔬 View mega-study data for a specific condition",
              "displayName": "Condition Mega-Study"
            },
            "meta-analysis": {
              "name": "meta-analysis",
              "path": "/conditions/[conditionName]/meta-analysis",
              "isDynamic": false,
              "children": {},
              "emoji": "📊",
              "description": "📊 View meta-analysis data for a specific condition",
              "displayName": "Condition Meta-Analysis"
            },
            "treatment-reviews": {
              "name": "treatment-reviews",
              "path": "/conditions/[conditionName]/treatment-reviews",
              "isDynamic": false,
              "children": {},
              "emoji": "📝",
              "description": "📝 View treatment reviews for a specific condition",
              "displayName": "Condition Treatment Reviews"
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
                      "emoji": "⚖️",
                      "description": "⚖️ View the cost-benefit analysis for a specific treatment",
                      "displayName": "Treatment Cba"
                    }
                  },
                  "emoji": "ℹ️",
                  "description": "ℹ️ View details for a specific treatment",
                  "displayName": "Treatment Details"
                }
              },
              "emoji": "💊",
              "description": "💊 Browse treatments for a specific condition",
              "displayName": "Condition Treatments"
            }
          },
          "emoji": "ℹ️",
          "description": "ℹ️ View information about a specific medical condition",
          "displayName": "Condition Details"
        }
      },
      "emoji": "🩺",
      "description": "🩺 Browse medical conditions",
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
          "emoji": "📐",
          "description": "📐 View the application's blueprint",
          "displayName": "Blueprint"
        },
        "disease-eradication-act": {
          "name": "disease-eradication-act",
          "path": "/docs/disease-eradication-act",
          "isDynamic": false,
          "children": {},
          "emoji": "📜",
          "description": "📜 View the Disease Eradication Act documentation",
          "displayName": "Disease Eradication Act"
        },
        "health-savings-sharing": {
          "name": "health-savings-sharing",
          "path": "/docs/health-savings-sharing",
          "isDynamic": false,
          "children": {},
          "emoji": "🤝",
          "description": "🤝 View the Health Savings Sharing documentation",
          "displayName": "Health Savings Sharing"
        },
        "...filename": {
          "name": "...filename",
          "path": "/docs/[...filename]",
          "isDynamic": true,
          "children": {},
          "emoji": "📁",
          "description": "📁 Access documentation files",
          "displayName": "Docs File"
        }
      },
      "emoji": "📄",
      "description": "📄 Access documentation and guides",
      "displayName": "Docs"
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
              "emoji": "📈",
              "description": "📈 View charts for a specific global variable",
              "displayName": "Global Variable Charts"
            },
            "settings": {
              "name": "settings",
              "path": "/globalVariables/[variableId]/settings",
              "isDynamic": false,
              "children": {},
              "emoji": "⚙️",
              "description": "⚙️ Configure settings for a specific global variable",
              "displayName": "Global Variable Settings"
            }
          },
          "emoji": "ℹ️",
          "description": "ℹ️ View details for a specific global variable",
          "displayName": "Global Variable Details"
        }
      },
      "emoji": "🌐",
      "description": "🌐 Manage global variables",
      "displayName": "Global Variables"
    },
    "import": {
      "name": "import",
      "path": "/import",
      "isDynamic": false,
      "children": {},
      "emoji": "📤",
      "description": "📤 Import data",
      "displayName": "Import"
    },
    "inbox": {
      "name": "inbox",
      "path": "/inbox",
      "isDynamic": false,
      "children": {},
      "emoji": "✉️",
      "description": "✉️ View your inbox",
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
          "description": "➕ Add a new measurement",
          "displayName": "Add Measurement"
        },
        "image2measurements": {
          "name": "image2measurements",
          "path": "/measurements/image2measurements",
          "isDynamic": false,
          "children": {},
          "emoji": "🖼️",
          "description": "🖼️ Convert images to measurements",
          "displayName": "Image To Measurements"
        },
        "text2measurements": {
          "name": "text2measurements",
          "path": "/measurements/text2measurements",
          "isDynamic": false,
          "children": {},
          "emoji": "📝",
          "description": "📝 Convert text to measurements",
          "displayName": "Text To Measurements"
        }
      },
      "emoji": "📏",
      "description": "📏 Manage measurements",
      "displayName": "Measurements"
    },
    "predictor-search": {
      "name": "predictor-search",
      "path": "/predictor-search",
      "isDynamic": false,
      "children": {},
      "emoji": "🔍",
      "description": "🔍 Search for predictors",
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
          "description": "✨ Enhance data or analysis",
          "displayName": "Researcher Enhance"
        }
      },
      "emoji": "🧑‍🔬",
      "description": "🧑‍🔬 Access researcher-related tools and information",
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
              "description": "🔗 Redirect to a specific path",
              "displayName": "Safe Redirect Path"
            }
          },
          "emoji": "➡️",
          "description": "➡️ Redirect to a different page",
          "displayName": "Safe Redirect"
        }
      },
      "emoji": "✅",
      "description": "✅ Access the safe section",
      "displayName": "Safe"
    },
    "search": {
      "name": "search",
      "path": "/search",
      "isDynamic": false,
      "children": {},
      "emoji": "🔍",
      "description": "🔍 Search the application",
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
          "description": "👤 Manage your account settings",
          "displayName": "Account Settings"
        },
        "newsletter": {
          "name": "newsletter",
          "path": "/settings/newsletter",
          "isDynamic": false,
          "children": {},
          "emoji": "📰",
          "description": "📰 Subscribe to or manage your newsletter preferences",
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
          "description": "➕ Create a new study",
          "displayName": "Create Study"
        },
        "studyId": {
          "name": "studyId",
          "path": "/study/[studyId]",
          "isDynamic": true,
          "children": {},
          "emoji": "ℹ️",
          "description": "ℹ️ View details for a specific study",
          "displayName": "Study Details"
        }
      },
      "emoji": "🔬",
      "description": "🔬 Access study-related information",
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
              "emoji": "⚖️",
              "description": "⚖️ View the cost-benefit analysis for a specific treatment",
              "displayName": "Treatment Cba"
            },
            "mega-study": {
              "name": "mega-study",
              "path": "/treatments/[treatmentName]/mega-study",
              "isDynamic": false,
              "children": {},
              "emoji": "🔬",
              "description": "🔬 View mega-study data for a specific treatment",
              "displayName": "Treatment Mega-Study"
            },
            "meta-analysis": {
              "name": "meta-analysis",
              "path": "/treatments/[treatmentName]/meta-analysis",
              "isDynamic": false,
              "children": {},
              "emoji": "📊",
              "description": "📊 View meta-analysis data for a specific treatment",
              "displayName": "Treatment Meta-Analysis"
            },
            "ratings": {
              "name": "ratings",
              "path": "/treatments/[treatmentName]/ratings",
              "isDynamic": false,
              "children": {},
              "emoji": "⭐",
              "description": "⭐ View ratings for a specific treatment",
              "displayName": "Treatment Ratings"
            },
            "trials": {
              "name": "trials",
              "path": "/treatments/[treatmentName]/trials",
              "isDynamic": false,
              "children": {},
              "emoji": "🧪",
              "description": "🧪 View clinical trials for a specific treatment",
              "displayName": "Treatment Trials"
            }
          },
          "emoji": "ℹ️",
          "description": "ℹ️ View details for a specific treatment",
          "displayName": "Treatment Details"
        }
      },
      "emoji": "💊",
      "description": "💊 Browse treatments",
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
          "description": "🔍 Search for clinical trials",
          "displayName": "Trial Search"
        }
      },
      "emoji": "🧪",
      "description": "🧪 Browse clinical trials",
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
              "emoji": "📈",
              "description": "📈 View charts for a specific user variable",
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
          "emoji": "ℹ️",
          "description": "ℹ️ View details for a specific user variable",
          "displayName": "User Variable Details"
        }
      },
      "emoji": "👤",
      "description": "👤 Manage user variables",
      "displayName": "User Variables"
    }
  },
  "emoji": "🏠",
  "description": "🏠 Navigate to the application's homepage",
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
