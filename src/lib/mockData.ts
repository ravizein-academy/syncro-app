import { Task, User, Team, Space, InboxNotification, ChannelMessage } from '../types';

export const INITIAL_USERS: User[] = [
  {
    id: 'user_1',
    name: 'Ravi Zein',
    email: 'ravizein@itsecacademy.com',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
    role: 'Admin',
    team: 'Product & Architecture',
    weeklyCapacityHours: 40,
  }
];

export const INITIAL_SPACES: Space[] = [
  {
    id: 'space_all',
    name: 'Semua Ruang Kerja',
    color: '#ee3425',
    icon: 'Layers'
  },
  {
    id: 'space_pwa',
    name: 'Syncro Core Development',
    color: '#ee3425',
    icon: 'Terminal'
  },
  {
    id: 'space_soc',
    name: 'ITSEC Academy SOC Lab',
    color: '#dc2626',
    icon: 'ShieldCheck'
  },
  {
    id: 'space_sop',
    name: 'SOP & Infrastructure',
    color: '#10b981',
    icon: 'BookOpen'
  }
];

export const INITIAL_TEAMS: Team[] = [
  {
    id: 'team_core',
    name: 'Core Engineering',
    division: 'Technology',
    leaderId: 'user_1'
  },
  {
    id: 'team_soc',
    name: 'Security Operation Center',
    division: 'Cyber Security',
    leaderId: 'user_1'
  },
  {
    id: 'team_academic',
    name: 'Academy Instructors',
    division: 'Education',
    leaderId: 'user_1'
  }
];

const todayStr = new Date().toISOString().substring(0, 10);

export const INITIAL_TASKS: Task[] = [
  {
    id: 'task-101',
    title: 'Deploy Google Apps Script REST API',
    description: 'Setup spreadsheet database dengan endpoint doGet dan doPost untuk sinkronisasi tanpa server.',
    status: 'done',
    priority: 'urgent',
    dueDate: todayStr,
    scheduledTime: '08:30',
    durationMinutes: 60,
    assignedTo: 'user_1',
    spaceId: 'space_pwa',
    tags: ['Backend', 'Google API'],
    subtasks: [
      { id: 'st-1', title: 'Buat sheet schema di Google Drive', completed: true },
      { id: 'st-2', title: 'Uji CORS dan respons doGet', completed: true },
      { id: 'st-3', title: 'Integrasikan LockService', completed: true }
    ],
    attachments: [
      {
        id: 'att-1',
        name: 'Syncro Database Sheet (Google Sheets)',
        url: 'https://docs.google.com/spreadsheets/d/1dQnUXsAVCEgYP6H04v1iC5ZyKtJsgUY944kw1KxEQ24/edit',
        type: 'gsheet',
        size: '12 KB',
        uploadedAt: 'Hari ini, 09:00'
      },
      {
        id: 'att-2',
        name: 'Deployment Apps Script Web App',
        url: 'https://script.google.com/macros/s/AKfycbx.../exec',
        type: 'link',
        uploadedAt: 'Hari ini, 09:15'
      }
    ],
    comments: [
      {
        id: 'cmt-1',
        userId: 'user_1',
        userName: 'Ravi Zein',
        userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
        content: 'Deployment Google Apps Script selesai. Database Google Sheets sudah siap melayani request API.',
        createdAt: '09:20'
      }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'task-102',
    title: 'Desain Kanban & Time Blocking Planner',
    description: 'Buat interaksi drag & drop tugas dari unscheduled list ke kalender grid harian & mingguan.',
    status: 'in_progress',
    priority: 'urgent',
    dueDate: todayStr,
    scheduledTime: '10:00',
    durationMinutes: 90,
    assignedTo: 'user_1',
    spaceId: 'space_pwa',
    tags: ['Frontend', 'ClickUp'],
    subtasks: [
      { id: 'st-4', title: 'Integrasi Zustand state store', completed: true },
      { id: 'st-5', title: 'Implementasi calendar time grid', completed: true },
      { id: 'st-6', title: 'Fitur Komentar & Lampiran Berkas Google', completed: true }
    ],
    attachments: [
      {
        id: 'att-3',
        name: 'ClickUp UI Design Reference (Figma/Drive)',
        url: 'https://drive.google.com/drive/folders/Syncro',
        type: 'gdrive',
        uploadedAt: 'Hari ini, 10:10'
      }
    ],
    comments: [
      {
        id: 'cmt-3',
        userId: 'user_1',
        userName: 'Ravi Zein',
        userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
        content: 'Tampilan tema ClickUp putih dan merah #ee3425 terlihat sangat bersih dan rapi!',
        createdAt: '10:45'
      }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'task-103',
    title: 'Audit DNS Block List SOC Assessment',
    description: 'Tinjau daftar domain berbahaya dan terapkan aturan filtering di firewall perimeter ITSEC Academy.',
    status: 'in_progress',
    priority: 'high',
    dueDate: todayStr,
    scheduledTime: '13:30',
    durationMinutes: 120,
    assignedTo: 'user_1',
    spaceId: 'space_soc',
    tags: ['Security', 'SOC'],
    subtasks: [
      { id: 'st-7', title: 'Ekstrak log DNS 24 jam terakhir', completed: true },
      { id: 'st-8', title: 'Validasi false positive pada whitelist', completed: false }
    ],
    attachments: [
      {
        id: 'att-4',
        name: 'CONFIDENTIAL | SOC Assessment DNS Block List.gsheet',
        url: 'https://docs.google.com/spreadsheets/d/1SOC_DNS_Block_List/edit',
        type: 'gsheet',
        size: '180 KB',
        uploadedAt: 'Hari ini, 11:00'
      }
    ],
    comments: [
      {
        id: 'cmt-4',
        userId: 'user_1',
        userName: 'Ravi Zein',
        userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
        content: 'Sudah memverifikasi 35 domain phishing baru dan memperbarui rules firewall perimeter.',
        createdAt: '11:15'
      }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'task-104',
    title: 'SOP Konfigurasi Mac Mini Student Lab',
    description: 'Dokumentasikan standarisasi blueprint macOS, port LAN student, dan sertifikat VPN lab.',
    status: 'todo',
    priority: 'medium',
    dueDate: todayStr,
    scheduledTime: undefined,
    durationMinutes: 90,
    assignedTo: 'user_1',
    spaceId: 'space_sop',
    tags: ['Documentation', 'Infrastructure'],
    subtasks: [
      { id: 'st-9', title: 'Dokumentasi port LAN mapping', completed: true },
      { id: 'st-10', title: 'Review SOP bersama lead trainer', completed: false }
    ],
    attachments: [
      {
        id: 'att-5',
        name: 'SOP BLUEPRINT MAC MINI STUDENT.gdoc',
        url: 'https://docs.google.com/document/d/1SOP_Blueprint_Doc/edit',
        type: 'gdoc',
        size: '45 KB',
        uploadedAt: 'Hari ini, 08:00'
      }
    ],
    comments: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'task-105',
    title: 'Integrasi Gemini AI Standup & Summarizer',
    description: 'Buat prompt generator untuk merangkum progress harian tim ke dalam format bullet point meeting.',
    status: 'todo',
    priority: 'high',
    dueDate: todayStr,
    scheduledTime: undefined,
    durationMinutes: 45,
    assignedTo: 'user_1',
    spaceId: 'space_pwa',
    tags: ['AI', 'Gemini'],
    subtasks: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'task-106',
    title: 'Review UI/UX Dark Mode & Mobile PWA',
    description: 'Pastikan kontras warna, safe area navigation bar pada mobile, dan install prompt berfungsi lancar.',
    status: 'review',
    priority: 'medium',
    dueDate: todayStr,
    scheduledTime: '16:00',
    durationMinutes: 60,
    assignedTo: 'user_1',
    spaceId: 'space_pwa',
    tags: ['Design', 'PWA'],
    subtasks: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export const INITIAL_NOTIFICATIONS: InboxNotification[] = [
  {
    id: 'notif-1',
    title: 'Tugas Baru Diberikan',
    message: 'Anda ditugaskan pada "Desain Kanban & Time Blocking Planner"',
    type: 'assignment',
    read: false,
    timestamp: '10 menit yang lalu',
    taskId: 'task-102'
  },
  {
    id: 'notif-2',
    title: 'Pengingat Deadline',
    message: 'Audit DNS Block List SOC Assessment jatuh tempo hari ini.',
    type: 'due',
    read: false,
    timestamp: '1 jam yang lalu',
    taskId: 'task-103'
  },
  {
    id: 'notif-3',
    title: 'Sistem Sinkronisasi',
    message: 'Database Google Sheets tersinkronisasi tanpa error.',
    type: 'system',
    read: true,
    timestamp: '2 jam yang lalu'
  }
];

export const INITIAL_MESSAGES: ChannelMessage[] = [
  {
    id: 'msg-1',
    channelId: 'general',
    senderId: 'user_1',
    content: 'Selamat pagi! PWA Syncro versi 1.0 sudah siap digunakan untuk kolaborasi tim.',
    timestamp: '09:00'
  }
];
