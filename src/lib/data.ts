export type Design = {
  id: string
  name: string
  template: string
  createdAt: string
  status: "Complete" | "In progress"
}

export type User = {
  id: string
  name: string
  email: string
  institution: string
  joinedAt: string
  status: "Active" | "Pending"
  designs: Design[]
}

export type Complaint = {
  id: string
  name: string
  email: string
  topic: string
  message: string
  createdAt: string
  status: "Open" | "Replied" | "Resolved"
  reply?: string
}

export type TemplateField = {
  key: string
  label: string
  placeholder: string
  type: "text" | "textarea" | "email" | "number" | "date"
  required: boolean
}

export type Template = {
  id: string
  name: string
  category: string
  price: number
  image: string
  visible: boolean
  fields: TemplateField[]
}

export const users: User[] = [
  {
    id: "GG-2048",
    name: "Adaeze Mensah",
    email: "adaeze.mensah@gmail.com",
    institution: "University of Lagos",
    joinedAt: "Oct 18, 2026",
    status: "Active",
    designs: [
      {
        id: "D-8031",
        name: "The Convocation Story",
        template: "The Convocation Portrait",
        createdAt: "Oct 21, 2026",
        status: "Complete",
      },
      {
        id: "D-8027",
        name: "A Day to Remember",
        template: "Keepsake cover",
        createdAt: "Oct 19, 2026",
        status: "In progress",
      },
    ],
  },
  {
    id: "GG-2047",
    name: "Chinedu Okafor",
    email: "chinedu.o@gmail.com",
    institution: "University of Ibadan",
    joinedAt: "Oct 17, 2026",
    status: "Active",
    designs: [
      {
        id: "D-8022",
        name: "The Graduate Announcement",
        template: "Social media",
        createdAt: "Oct 20, 2026",
        status: "Complete",
      },
    ],
  },
  {
    id: "GG-2046",
    name: "Mariam Bello",
    email: "mariam.bello@outlook.com",
    institution: "Ahmadu Bello University",
    joinedAt: "Oct 17, 2026",
    status: "Active",
    designs: [],
  },
  {
    id: "GG-2045",
    name: "Tomiwa Adeyemi",
    email: "tomiwa.a@gmail.com",
    institution: "Covenant University",
    joinedAt: "Oct 16, 2026",
    status: "Pending",
    designs: [
      {
        id: "D-8011",
        name: "The Graduate Keepsake",
        template: "Jotter cover",
        createdAt: "Oct 18, 2026",
        status: "In progress",
      },
    ],
  },
  {
    id: "GG-2044",
    name: "Zara Ibrahim",
    email: "zara.i@gmail.com",
    institution: "University of Abuja",
    joinedAt: "Oct 15, 2026",
    status: "Active",
    designs: [
      {
        id: "D-8009",
        name: "The Milestone Announcement",
        template: "Social media",
        createdAt: "Oct 17, 2026",
        status: "Complete",
      },
    ],
  },
  {
    id: "GG-2043",
    name: "Femi Akinola",
    email: "femi.akinola@gmail.com",
    institution: "Lagos State University",
    joinedAt: "Oct 14, 2026",
    status: "Active",
    designs: [],
  },
]

export const complaints: Complaint[] = [
  {
    id: "SUP-184",
    name: "Nneka Eze",
    email: "nneka.eze@gmail.com",
    topic: "Payment & billing",
    message:
      "I paid for the premium design but the download is still locked. The payment went through this morning.",
    createdAt: "12 min ago",
    status: "Open",
  },
  {
    id: "SUP-183",
    name: "Tunde Balogun",
    email: "tunde.b@gmail.com",
    topic: "Design export",
    message:
      "My final image looks blurry when I download it. Is there a higher resolution option?",
    createdAt: "48 min ago",
    status: "Open",
  },
  {
    id: "SUP-182",
    name: "Amaka Nwosu",
    email: "amaka.n@gmail.com",
    topic: "Account access",
    message:
      "I can’t verify my email. I have requested another link twice but nothing came through.",
    createdAt: "2 hours ago",
    status: "Replied",
  },
  {
    id: "SUP-181",
    name: "Bola Ajayi",
    email: "bola.a@gmail.com",
    topic: "Template request",
    message: "Could you add a design for nursing school graduation?",
    createdAt: "Yesterday",
    status: "Resolved",
    reply:
      "Thanks for the suggestion. We’ve added this to the next template review.",
  },
]

export const templates: Template[] = [
  {
    id: "convocation-portrait",
    name: "The Convocation Portrait",
    category: "Social media",
    price: 1000,
    image: "/templates/convocation-portrait.jpeg",
    visible: true,
    fields: [
      {
        key: "name",
        label: "Name as it should appear",
        placeholder: "e.g. Adaeze Mensah",
        type: "text",
        required: true,
      },
      {
        key: "institution",
        label: "University or institution",
        placeholder: "e.g. University of Lagos",
        type: "text",
        required: true,
      },
      {
        key: "degree",
        label: "Degree or course",
        placeholder: "e.g. B.Sc. Computer Science",
        type: "text",
        required: true,
      },
      {
        key: "year",
        label: "Graduation year",
        placeholder: "2026",
        type: "number",
        required: true,
      },
    ],
  },
  {
    id: "graduate-keepsake",
    name: "The Graduate Keepsake",
    category: "Jotters",
    price: 1500,
    image: "/templates/graduate-keepsake.jpeg",
    visible: true,
    fields: [
      {
        key: "name",
        label: "Name",
        placeholder: "Your full name",
        type: "text",
        required: true,
      },
      {
        key: "quote",
        label: "A short quote or dedication",
        placeholder: "The best is yet to come",
        type: "textarea",
        required: false,
      },
    ],
  },
  {
    id: "milestone-announcement",
    name: "The Milestone Announcement",
    category: "Social media",
    price: 1000,
    image: "/templates/milestone-announcement.jpeg",
    visible: false,
    fields: [
      {
        key: "name",
        label: "Name",
        placeholder: "Your full name",
        type: "text",
        required: true,
      },
      {
        key: "socialHandle",
        label: "Social handle",
        placeholder: "@yourname",
        type: "text",
        required: false,
      },
    ],
  },
]

export const dashboardMetrics = {
  totalUsers: "2,846",
  usersChange: "+12.8%",
  revenue: "₦4,285,000",
  revenueChange: "+18.2%",
  designs: "8,492",
  designsChange: "+9.4%",
  openSupport: "12",
}
