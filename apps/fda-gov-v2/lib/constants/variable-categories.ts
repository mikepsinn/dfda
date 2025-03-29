import type { Database } from '@/lib/database.types'

type VariableCategory = Database['public']['Tables']['variable_categories']['Row']

export const VARIABLE_CATEGORIES = {
  HEALTH_AND_PHYSIOLOGY: 'health-and-physiology',
  INTAKE_AND_INTERVENTIONS: 'intake-and-interventions',
  ACTIVITY_AND_BEHAVIOR: 'activity-and-behavior',
  MENTAL_AND_EMOTIONAL_STATE: 'mental-and-emotional-state',
  COGNITIVE_PERFORMANCE: 'cognitive-performance',
  MEDIA_AND_CONTENT_ENGAGEMENT: 'media-and-content-engagement',
  SOCIAL_AND_INTERPERSONAL: 'social-and-interpersonal',
  ENVIRONMENT_AND_CONTEXT: 'environment-and-context',
  PRODUCTIVITY_AND_LEARNING: 'productivity-and-learning'
} as const

export const VARIABLE_CATEGORIES_DATA: Record<string, VariableCategory> = {
  [VARIABLE_CATEGORIES.HEALTH_AND_PHYSIOLOGY]: {
    id: VARIABLE_CATEGORIES.HEALTH_AND_PHYSIOLOGY,
    name: 'Health and Physiology',
    short_description: 'Health states and metrics',
    long_description: 'All physical and mental health states and measurements, including symptoms like fatigue, conditions like diabetes, vital signs like heart rate, and biomarkers like blood glucose. Also known as wellness or fitness.',
    emoji: '🩺',
    display_order: 1,
    created_at: null,
    updated_at: null,
    image_url: null
  },
  [VARIABLE_CATEGORIES.INTAKE_AND_INTERVENTIONS]: {
    id: VARIABLE_CATEGORIES.INTAKE_AND_INTERVENTIONS,
    name: 'Intake and Interventions',
    short_description: 'Substances and actions for health',
    long_description: 'Everything ingested or applied to influence health, such as food (e.g., calories), drinks (e.g., water), supplements (e.g., vitamin D), medications (e.g., aspirin), and procedures (e.g., surgery). Also known as diet or treatment.',
    emoji: '🍎',
    display_order: 2,
    created_at: null,
    updated_at: null,
    image_url: null
  },
  [VARIABLE_CATEGORIES.ACTIVITY_AND_BEHAVIOR]: {
    id: VARIABLE_CATEGORIES.ACTIVITY_AND_BEHAVIOR,
    name: 'Activity and Behavior',
    short_description: 'Actions and habits',
    long_description: 'All actions, movements, and habits performed, including exercise (e.g., steps, sports like tennis), routines (e.g., brushing teeth), and leisure (e.g., painting). Also known as lifestyle or daily activities.',
    emoji: '🏃',
    display_order: 3,
    created_at: null,
    updated_at: null,
    image_url: null
  },
  [VARIABLE_CATEGORIES.MENTAL_AND_EMOTIONAL_STATE]: {
    id: VARIABLE_CATEGORIES.MENTAL_AND_EMOTIONAL_STATE,
    name: 'Mental and Emotional State',
    short_description: 'Feelings and emotions',
    long_description: 'Subjective mental experiences and emotional well-being, such as mood ratings, stress levels, or self-reported energy. Also known as mood or emotional health.',
    emoji: '😊',
    display_order: 4,
    created_at: null,
    updated_at: null,
    image_url: null
  },
  [VARIABLE_CATEGORIES.COGNITIVE_PERFORMANCE]: {
    id: VARIABLE_CATEGORIES.COGNITIVE_PERFORMANCE,
    name: 'Cognitive Performance',
    short_description: 'Mental abilities',
    long_description: 'Objective mental abilities and brain function, including memory test scores, reaction times, or IQ scores. Also known as brain performance or cognition.',
    emoji: '🧠',
    display_order: 5,
    created_at: null,
    updated_at: null,
    image_url: null
  },
  [VARIABLE_CATEGORIES.MEDIA_AND_CONTENT_ENGAGEMENT]: {
    id: VARIABLE_CATEGORIES.MEDIA_AND_CONTENT_ENGAGEMENT,
    name: 'Media and Content Engagement',
    short_description: 'Content interaction',
    long_description: 'Interaction with informational or entertainment content, such as books read, songs listened to, or shows watched. Also known as media use or consumption.',
    emoji: '📺',
    display_order: 6,
    created_at: null,
    updated_at: null,
    image_url: null
  },
  [VARIABLE_CATEGORIES.SOCIAL_AND_INTERPERSONAL]: {
    id: VARIABLE_CATEGORIES.SOCIAL_AND_INTERPERSONAL,
    name: 'Social and Interpersonal',
    short_description: 'Relationships and interactions',
    long_description: 'Interactions and relationships with others, including number of conversations, time with friends, or social media chats. Also known as social life or connections.',
    emoji: '👥',
    display_order: 7,
    created_at: null,
    updated_at: null,
    image_url: null
  },
  [VARIABLE_CATEGORIES.ENVIRONMENT_AND_CONTEXT]: {
    id: VARIABLE_CATEGORIES.ENVIRONMENT_AND_CONTEXT,
    name: 'Environment and Context',
    short_description: 'External and background factors',
    long_description: 'External factors and personal background data, such as air quality, noise levels, age, gender, genetics, or income. Also known as context or surroundings.',
    emoji: '🌍',
    display_order: 8,
    created_at: null,
    updated_at: null,
    image_url: null
  },
  [VARIABLE_CATEGORIES.PRODUCTIVITY_AND_LEARNING]: {
    id: VARIABLE_CATEGORIES.PRODUCTIVITY_AND_LEARNING,
    name: 'Productivity and Learning',
    short_description: 'Work and education',
    long_description: 'Work, education, and goal-oriented efforts, including hours worked, tasks completed, courses finished, or test scores. Also known as productivity or study.',
    emoji: '📚',
    display_order: 9,
    created_at: null,
    updated_at: null,
    image_url: null
  }
} 