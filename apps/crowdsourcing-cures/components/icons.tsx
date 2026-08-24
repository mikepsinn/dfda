import {
  Activity,
  AlertTriangle,
  ArrowUpDown,
  Banknote,
  BarChart3,
  Bell,
  Book,
  BookOpen,
  Bot,
  Calendar,
  Camera,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Clipboard,
  Cross,
  Edit,
  Eye,
  EyeOff,
  FileQuestion,
  Flame,
  Github,
  GraduationCap,
  HandMetal,
  History,
  Home,
  Lightbulb,
  Loader,
  LogOut,
  LayoutDashboard,
  MessageSquare,
  Moon,
  MoreHorizontal,
  PieChart,
  Pencil,
  Plus,
  ScrollText,
  Settings,
  Shield,
  Skull,
  Star,
  Sun,
  Trash2,
  Trophy,
  User,
  Vote,
  Wand2,
  X,
  BriefcaseMedical,
} from "lucide-react"

export type IconKeys = keyof typeof icons

type IconsType = {
  [key in IconKeys]: React.ElementType
}

const icons = {
  // Providers
  google: () => (
    <svg viewBox="0 0 48 48" className="h-5 w-5">
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
      <path fill="none" d="M0 0h48v48H0z" />
    </svg>
  ),
  github: Github,
  bug: Wand2,

  // Dashboard Icons
  dashboard: LayoutDashboard,
  activity: Activity,
  measurement: Pencil,
  settings: Settings,
  camera: Camera,
  write: MessageSquare,
  wishingWell: Activity,
  bomb: Flame,
  skull: Skull,
  vote: Vote,
  health: BriefcaseMedical,
  peace: HandMetal,
  results: BarChart3,
  disease: Cross,
  home: Home,
  frown: AlertTriangle,
  pieChart: PieChart,
  docs: Book,
  robot: Bot,
  scroll: ScrollText,
  safe: Home,

  clipboard: Clipboard,

  // Mode Toggle
  moon: Moon,
  sun: Sun,

  // Navigation
  back: ChevronLeft,
  next: ChevronRight,
  up: ChevronUp,
  down: ChevronDown,
  close: X,

  // Common
  trash: Trash2,
  spinner: Loader,
  userAlt: User,
  ellipsis: MoreHorizontal,
  warning: AlertTriangle,
  add: Plus,
  reminder: Bell,
  history: History,
  charts: BarChart3,
  signout: LogOut,
  calendar: Calendar,
  sort: ArrowUpDown,
  fire: Flame,
  statsBar: BarChart3,
  mixer: Settings,
  check: Check,
  star: Star,
  ranking: Trophy,
  question: FileQuestion,
  volunteer: HandMetal,
  lightbulb: Lightbulb,
  edit: Edit,
  eye: Eye,
  eyeOff: EyeOff,
  book: BookOpen,
  pencil: Pencil,
  chevronLeft: ChevronLeft,
  shield: Shield,
  wiki: BookOpen,
  studies: GraduationCap,
  petition: ScrollText,
  savings: Banknote,
  treatment: BriefcaseMedical,
  condition: BriefcaseMedical,
  medical: BriefcaseMedical,
  trials: BriefcaseMedical,
}

export const Icons: IconsType = icons