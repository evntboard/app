import {
  AlertTriangle,
  ArrowDownUp, ArrowDownWideNarrow,
  ArrowRight, ArrowUpNarrowWide,
  Braces, Building,
  Cable,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight, ChevronsUpDown,
  Clock,
  Code,
  Command,
  Copy,
  CreditCard,
  Database,
  Expand,
  ExternalLink,
  Eye,
  EyeOff,
  File,
  FileDown,
  FilePlus,
  FileText,
  FileUp,
  Folder,
  FolderOpen,
  HardDrive,
  HelpCircle,
  Image,
  Key,
  Laptop,
  Loader2, LogIn,
  LucideIcon,
  LucideProps,
  Moon,
  MoreVertical,
  Package, Pencil,
  Pizza,
  Plus,
  Power,
  PowerOff,
  Puzzle,
  Radio, RefreshCw,
  Save,
  ScrollText,
  Search,
  Settings,
  SunMedium,
  Trash,
  Twitter,
  Unplug,
  User,
  X,
  XCircle,
  Zap,
  Clipboard, Users, Crown, Loader, Bell, MoreHorizontal, Ruler,
} from 'lucide-react'

export type Icon = LucideIcon

export const Icons = {
  Building,
  ChevronsUpDown,
  Check,
  close: X,
  spinner: Loader2,
  chevronLeft: ChevronLeft,
  chevronRight: ChevronRight,
  trash: Trash,
  home: FileText,
  page: File,
  media: Image,
  settings: Settings,
  billing: CreditCard,
  ellipsis: MoreVertical,
  add: Plus,
  warning: AlertTriangle,
  user: User,
  arrowRight: ArrowRight,
  help: HelpCircle,
  pizza: Pizza,
  sun: SunMedium,
  moon: Moon,
  laptop: Laptop,
  more: MoreHorizontal,
  check: Check,
  export: FileUp,
  import: FileDown,
  move: ArrowDownUp,
  create: Plus,
  createScript: FilePlus,
  duplicate: Copy,
  enable: Power,
  disable: PowerOff,
  delete: Trash,
  trigger: Zap,
  triggerCondition: Ruler,
  shared: Code,
  folder: Folder,
  folderOpen: FolderOpen,
  down: ChevronDown,
  right: ChevronRight,
  search: Search,
  script: ScrollText,
  payload: Package,
  module: Puzzle,
  event: Braces,
  realtime: Radio,
  storage: Database,
  save: Save,
  session: Cable,
  error: XCircle,
  process: Settings,
  log: ScrollText,
  external: ExternalLink,
  show: Eye,
  hide: EyeOff,
  storageTemp: Clock,
  storagePersist: HardDrive,
  token: Key,
  zoom: Expand,
  sortDown: ArrowDownWideNarrow,
  sortUp: ArrowUpNarrowWide,
  edit: Pencil,
  signin: LogIn,
  disconnect: Unplug,
  refresh: RefreshCw,
  copy: Clipboard,
  members: Users,
  creator: Crown,
  loader: Loader,
  reaction: Bell,
  back: ChevronLeft,
  view: Eye,
  logo: ({ ...props }: LucideProps) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      version="1.1"
      viewBox="0.00 0.00 256.00 256.00"
      {...props}
    >
      <rect fill="#922a8e" x="-14.73" y="-14.69" transform="translate(175.74,63.37) rotate(0.1)" width="29.46"
            height="29.38" rx="0.42" />
      <rect fill="#922a8e" x="217.01" y="179.24" width="31.98" height="26.82" rx="0.55" />
      <path fill="#922a8e"
            d="M 23.52 139.77 L 4.14 118.66 A 0.56 0.56 0.0 0 1 4.16 117.88 L 73.43 48.85  A 0.56 0.56 0.0 0 1 73.82 48.69  L 139.22 48.70 A 0.56 0.56 0.0 0 1 139.78 49.26 L 139.76 77.50  A 0.56 0.56 0.0 0 1 139.20 78.06 L 87.49 78.06 A 0.56 0.56 0.0 0 0 87.10 78.22 L 24.32 139.79 A 0.56 0.56 0.0 0 1 23.52 139.77 Z" />
      <path fill="#922a8e"
            d="M 85.46 163.76  L 104.79 179.11 A 0.59 0.59 0.0 0 0 105.16 179.24 L 208.31 179.25 A 0.59 0.59 0.0 0 1 208.90 179.84 L 208.91 205.47 A 0.59 0.59 0.0 0 1 208.32 206.06 L 90.64 206.06 A 0.59 0.59 0.0 0 1 90.21 205.87 L 45.86 158.66  A 0.59 0.59 0.0 0 1 45.87 157.84 L 90.88 112.85 A 0.59 0.59 0.0 0 1 91.29 112.68 L 189.90 112.70  A 0.59 0.59 0.0 0 1 190.49 113.29 L 190.45 146.90 A 0.59 0.59 0.0 0 1 189.86 147.49  L 104.51 147.50  A 0.59 0.59 0.0 0 0 104.14 147.63  L 85.46 162.84 A 0.59 0.59 0.0 0 0 85.46 163.76  Z" />
      <rect fill="#922a8e" x="217.01" y="179.24" width="31.98" height="26.82" rx="0.55" />
    </svg>
  ),
  discord: ({ ...props }: LucideProps) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 127.14 96.36" {...props}>
      <path fill="currentColor"
            d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z" />
    </svg>
  ),
  twitch: ({ ...props }: LucideProps) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" {...props}>
      <path
        d="M2.149 0l-1.612 4.119v16.836h5.731v3.045h3.224l3.045-3.045h4.657l6.269-6.269v-14.686h-21.314zm19.164 13.612l-3.582 3.582h-5.731l-3.045 3.045v-3.045h-4.836v-15.045h17.194v11.463zm-3.582-7.343v6.262h-2.149v-6.262h2.149zm-5.731 0v6.262h-2.149v-6.262h2.149z"
        fillRule="evenodd" clipRule="evenodd" fill="currentColor" />
    </svg>
  ),
  github: ({ ...props }: LucideProps) => (
    <svg
      aria-hidden="true"
      focusable="false"
      data-prefix="fab"
      data-icon="github"
      role="img"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 496 512"
      {...props}
    >
      <path
        fill="currentColor"
        d="M165.9 397.4c0 2-2.3 3.6-5.2 3.6-3.3 .3-5.6-1.3-5.6-3.6 0-2 2.3-3.6 5.2-3.6 3-.3 5.6 1.3 5.6 3.6zm-31.1-4.5c-.7 2 1.3 4.3 4.3 4.9 2.6 1 5.6 0 6.2-2s-1.3-4.3-4.3-5.2c-2.6-.7-5.5 .3-6.2 2.3zm44.2-1.7c-2.9 .7-4.9 2.6-4.6 4.9 .3 2 2.9 3.3 5.9 2.6 2.9-.7 4.9-2.6 4.6-4.6-.3-1.9-3-3.2-5.9-2.9zM244.8 8C106.1 8 0 113.3 0 252c0 110.9 69.8 205.8 169.5 239.2 12.8 2.3 17.3-5.6 17.3-12.1 0-6.2-.3-40.4-.3-61.4 0 0-70 15-84.7-29.8 0 0-11.4-29.1-27.8-36.6 0 0-22.9-15.7 1.6-15.4 0 0 24.9 2 38.6 25.8 21.9 38.6 58.6 27.5 72.9 20.9 2.3-16 8.8-27.1 16-33.7-55.9-6.2-112.3-14.3-112.3-110.5 0-27.5 7.6-41.3 23.6-58.9-2.6-6.5-11.1-33.3 2.6-67.9 20.9-6.5 69 27 69 27 20-5.6 41.5-8.5 62.8-8.5s42.8 2.9 62.8 8.5c0 0 48.1-33.6 69-27 13.7 34.7 5.2 61.4 2.6 67.9 16 17.7 25.8 31.5 25.8 58.9 0 96.5-58.9 104.2-114.8 110.5 9.2 7.9 17 22.9 17 46.4 0 33.7-.3 75.4-.3 83.6 0 6.5 4.6 14.4 17.3 12.1C428.2 457.8 496 362.9 496 252 496 113.3 383.5 8 244.8 8zM97.2 352.9c-1.3 1-1 3.3 .7 5.2 1.6 1.6 3.9 2.3 5.2 1 1.3-1 1-3.3-.7-5.2-1.6-1.6-3.9-2.3-5.2-1zm-10.8-8.1c-.7 1.3 .3 2.9 2.3 3.9 1.6 1 3.6 .7 4.3-.7 .7-1.3-.3-2.9-2.3-3.9-2-.6-3.6-.3-4.3 .7zm32.4 35.6c-1.6 1.3-1 4.3 1.3 6.2 2.3 2.3 5.2 2.6 6.5 1 1.3-1.3 .7-4.3-1.3-6.2-2.2-2.3-5.2-2.6-6.5-1zm-11.4-14.7c-1.6 1-1.6 3.6 0 5.9 1.6 2.3 4.3 3.3 5.6 2.3 1.6-1.3 1.6-3.9 0-6.2-1.4-2.3-4-3.3-5.6-2z"
      ></path>
    </svg>
  ),
  twitter: ({ ...props }: LucideProps) => (
    <svg viewBox="0 0 300 271" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        d="m236 0h46l-101 115 118 156h-92.6l-72.5-94.8-83 94.8h-46l107-123-113-148h94.9l65.5 86.6zm-16.1 244h25.5l-165-218h-27.4z"
        fill="currentColor"
      />
    </svg>
  ),
}