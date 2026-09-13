/**
 * BAUST BloodLink Curated Avatar & Sticker Catalog
 *
 * Features:
 * - BAUST Student collection: Purple shirt / polo with green institutional ID card lanyard
 * - Diverse body color / skin tone shades (Fair, Medium, Warm, Deep)
 * - Male, Female with Hijab, Female non-Hijab
 * - Teacher & Faculty professional blazers and academic shades
 * - Campus Staff & Medical triage white coats
 * - Casual blood donor heroes & Emergency first responder vests
 */

// Helper to create safe SVG data URIs
function createSvgDataUri(svgContent) {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svgContent.trim())}`;
}

// ── 1. BAUST Students (Purple Polo & Green ID Card) ──────────────────────────
const studentMaleFair = createSvgDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
  <circle cx="60" cy="60" r="58" fill="#F3E8FF" stroke="#8B5CF6" stroke-width="3"/>
  <!-- Hair -->
  <path d="M36 46 C36 24 84 24 84 46 C84 32 72 26 60 26 C48 26 36 32 36 46 Z" fill="#2E1065"/>
  <!-- Head -->
  <circle cx="60" cy="50" r="22" fill="#FDDCB1"/>
  <!-- Hair front -->
  <path d="M38 42 C46 32 74 32 82 42 C78 35 68 31 60 31 C52 31 42 35 38 42 Z" fill="#2E1065"/>
  <!-- Face eyes & smile -->
  <circle cx="52" cy="48" r="2.5" fill="#1F2937"/>
  <circle cx="68" cy="48" r="2.5" fill="#1F2937"/>
  <path d="M54 58 Q60 64 66 58" stroke="#9A3412" stroke-width="2" fill="none" stroke-linecap="round"/>
  <!-- Purple Shirt -->
  <path d="M22 110 C22 84 40 76 60 76 C80 76 98 84 98 110 Z" fill="#6B21A8"/>
  <!-- Collar -->
  <polygon points="60,86 48,76 60,76" fill="#7E22CE"/>
  <polygon points="60,86 72,76 60,76" fill="#7E22CE"/>
  <!-- Green ID Card Lanyard -->
  <path d="M50 76 L56 100 L64 100 L70 76" stroke="#059669" stroke-width="3.5" fill="none" stroke-linecap="round"/>
  <!-- Green ID Badge -->
  <rect x="52" y="94" width="16" height="22" rx="2" fill="#10B981" stroke="#047857" stroke-width="1.5"/>
  <rect x="55" y="98" width="10" height="6" rx="1" fill="#FFFFFF"/>
  <line x1="55" y1="107" x2="65" y2="107" stroke="#064E3B" stroke-width="1.5"/>
  <line x1="55" y1="111" x2="62" y2="111" stroke="#064E3B" stroke-width="1.5"/>
</svg>
`);

const studentMaleMedium = createSvgDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
  <circle cx="60" cy="60" r="58" fill="#EDE9FE" stroke="#7C3AED" stroke-width="3"/>
  <path d="M36 46 C36 22 84 22 84 46 C84 30 72 24 60 24 C48 24 36 30 36 46 Z" fill="#111827"/>
  <circle cx="60" cy="50" r="22" fill="#D99B6A"/>
  <path d="M38 42 C48 30 72 30 82 42 C76 34 68 30 60 30 C52 30 44 34 38 42 Z" fill="#111827"/>
  <circle cx="52" cy="48" r="2.5" fill="#111827"/>
  <circle cx="68" cy="48" r="2.5" fill="#111827"/>
  <path d="M54 58 Q60 64 66 58" stroke="#78350F" stroke-width="2" fill="none" stroke-linecap="round"/>
  <path d="M22 110 C22 84 40 76 60 76 C80 76 98 84 98 110 Z" fill="#581C87"/>
  <polygon points="60,86 48,76 60,76" fill="#6B21A8"/>
  <polygon points="60,86 72,76 60,76" fill="#6B21A8"/>
  <path d="M50 76 L56 100 L64 100 L70 76" stroke="#10B981" stroke-width="3.5" fill="none" stroke-linecap="round"/>
  <rect x="52" y="94" width="16" height="22" rx="2" fill="#059669" stroke="#065F46" stroke-width="1.5"/>
  <rect x="55" y="98" width="10" height="6" rx="1" fill="#ECFDF5"/>
  <line x1="55" y1="107" x2="65" y2="107" stroke="#064E3B" stroke-width="1.5"/>
  <line x1="55" y1="111" x2="62" y2="111" stroke="#064E3B" stroke-width="1.5"/>
</svg>
`);

const studentFemaleHijabRose = createSvgDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
  <circle cx="60" cy="60" r="58" fill="#FCE7F3" stroke="#DB2777" stroke-width="3"/>
  <!-- Hijab Base -->
  <path d="M30 65 C30 25 90 25 90 65 C90 85 82 92 60 92 C38 92 30 85 30 65 Z" fill="#BE185D"/>
  <!-- Face Opening -->
  <ellipse cx="60" cy="52" rx="17" ry="20" fill="#FDDCB1"/>
  <!-- Hijab Drape Inner -->
  <path d="M43 45 C43 32 77 32 77 45 C77 36 69 33 60 33 C51 33 43 36 43 45 Z" fill="#9D174D"/>
  <circle cx="53" cy="50" r="2.2" fill="#1F2937"/>
  <circle cx="67" cy="50" r="2.2" fill="#1F2937"/>
  <path d="M55 58 Q60 63 65 58" stroke="#9A3412" stroke-width="1.8" fill="none" stroke-linecap="round"/>
  <!-- Purple Uniform Shirt -->
  <path d="M22 110 C22 84 40 78 60 78 C80 78 98 84 98 110 Z" fill="#6B21A8"/>
  <!-- Hijab Front Knot / Flow -->
  <path d="M52 70 C52 86 68 86 68 70 Z" fill="#9D174D"/>
  <!-- Green ID Card Lanyard -->
  <path d="M48 80 L56 100 L64 100 L72 80" stroke="#059669" stroke-width="3.5" fill="none" stroke-linecap="round"/>
  <!-- Green ID Card -->
  <rect x="52" y="94" width="16" height="22" rx="2" fill="#10B981" stroke="#047857" stroke-width="1.5"/>
  <rect x="55" y="98" width="10" height="6" rx="1" fill="#FFFFFF"/>
  <line x1="55" y1="107" x2="65" y2="107" stroke="#064E3B" stroke-width="1.5"/>
</svg>
`);

const studentFemaleHijabTeal = createSvgDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
  <circle cx="60" cy="60" r="58" fill="#CCFBF1" stroke="#0D9488" stroke-width="3"/>
  <path d="M30 65 C30 25 90 25 90 65 C90 85 82 92 60 92 C38 92 30 85 30 65 Z" fill="#0F766E"/>
  <ellipse cx="60" cy="52" rx="17" ry="20" fill="#C68652"/>
  <path d="M43 45 C43 32 77 32 77 45 C77 36 69 33 60 33 C51 33 43 36 43 45 Z" fill="#115E59"/>
  <circle cx="53" cy="50" r="2.2" fill="#111827"/>
  <circle cx="67" cy="50" r="2.2" fill="#111827"/>
  <path d="M55 58 Q60 63 65 58" stroke="#451A03" stroke-width="1.8" fill="none" stroke-linecap="round"/>
  <path d="M22 110 C22 84 40 78 60 78 C80 78 98 84 98 110 Z" fill="#581C87"/>
  <path d="M52 70 C52 86 68 86 68 70 Z" fill="#115E59"/>
  <path d="M48 80 L56 100 L64 100 L72 80" stroke="#10B981" stroke-width="3.5" fill="none" stroke-linecap="round"/>
  <rect x="52" y="94" width="16" height="22" rx="2" fill="#059669" stroke="#047857" stroke-width="1.5"/>
  <rect x="55" y="98" width="10" height="6" rx="1" fill="#FFFFFF"/>
</svg>
`);

const studentFemaleNonHijabFair = createSvgDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
  <circle cx="60" cy="60" r="58" fill="#FDF2F8" stroke="#EC4899" stroke-width="3"/>
  <!-- Hair back -->
  <path d="M30 50 C30 20 90 20 90 50 C90 75 80 80 80 90 C70 85 70 65 70 65 C60 65 60 85 50 85 C40 85 30 75 30 50 Z" fill="#451A03"/>
  <!-- Face -->
  <circle cx="60" cy="50" r="21" fill="#FEE0C2"/>
  <!-- Hair front bangs -->
  <path d="M38 42 C46 30 74 30 82 42 C74 35 66 33 60 33 C54 33 46 35 38 42 Z" fill="#451A03"/>
  <circle cx="53" cy="48" r="2.2" fill="#1F2937"/>
  <circle cx="67" cy="48" r="2.2" fill="#1F2937"/>
  <path d="M55 57 Q60 62 65 57" stroke="#9A3412" stroke-width="1.8" fill="none" stroke-linecap="round"/>
  <!-- Purple Uniform Shirt -->
  <path d="M22 110 C22 84 40 76 60 76 C80 76 98 84 98 110 Z" fill="#6B21A8"/>
  <polygon points="60,86 48,76 60,76" fill="#7E22CE"/>
  <polygon points="60,86 72,76 60,76" fill="#7E22CE"/>
  <path d="M50 76 L56 100 L64 100 L70 76" stroke="#059669" stroke-width="3.5" fill="none" stroke-linecap="round"/>
  <rect x="52" y="94" width="16" height="22" rx="2" fill="#10B981" stroke="#047857" stroke-width="1.5"/>
  <rect x="55" y="98" width="10" height="6" rx="1" fill="#FFFFFF"/>
</svg>
`);

// ── 2. Faculty & Teachers (Academic Blazer & Tie) ───────────────────────────
const teacherMaleProf = createSvgDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
  <circle cx="60" cy="60" r="58" fill="#F1F5F9" stroke="#475569" stroke-width="3"/>
  <!-- Hair with silver touches -->
  <path d="M38 44 C38 22 82 22 82 44 C82 30 72 25 60 25 C48 25 38 30 38 44 Z" fill="#334155"/>
  <circle cx="60" cy="48" r="20" fill="#FDDCB1"/>
  <!-- Glasses -->
  <rect x="44" y="44" width="13" height="9" rx="2" fill="none" stroke="#1E293B" stroke-width="2"/>
  <rect x="63" y="44" width="13" height="9" rx="2" fill="none" stroke="#1E293B" stroke-width="2"/>
  <line x1="57" y1="48" x2="63" y2="48" stroke="#1E293B" stroke-width="2"/>
  <circle cx="50.5" cy="48.5" r="1.8" fill="#1E293B"/>
  <circle cx="69.5" cy="48.5" r="1.8" fill="#1E293B"/>
  <path d="M54 58 Q60 62 66 58" stroke="#9A3412" stroke-width="1.8" fill="none" stroke-linecap="round"/>
  <!-- Formal Navy Blazer & Red Tie -->
  <path d="M20 110 C20 80 40 72 60 72 C80 72 100 80 100 110 Z" fill="#1E293B"/>
  <polygon points="60,110 50,72 70,72" fill="#FFFFFF"/>
  <polygon points="60,105 56,76 64,76" fill="#DC2626"/>
  <!-- Lapels -->
  <polygon points="40,74 54,98 54,74" fill="#0F172A"/>
  <polygon points="80,74 66,98 66,74" fill="#0F172A"/>
  <!-- Gold Teacher Pin -->
  <circle cx="44" cy="86" r="3" fill="#F59E0B"/>
</svg>
`);

const teacherFemaleProfHijab = createSvgDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
  <circle cx="60" cy="60" r="58" fill="#EFF6FF" stroke="#2563EB" stroke-width="3"/>
  <path d="M30 65 C30 25 90 25 90 65 C90 85 82 92 60 92 C38 92 30 85 30 65 Z" fill="#1E3A8A"/>
  <ellipse cx="60" cy="52" rx="17" ry="20" fill="#FDDCB1"/>
  <!-- Glasses -->
  <rect x="45" y="48" width="12" height="8" rx="2" fill="none" stroke="#B45309" stroke-width="1.8"/>
  <rect x="63" y="48" width="12" height="8" rx="2" fill="none" stroke="#B45309" stroke-width="1.8"/>
  <line x1="57" y1="52" x2="63" y2="52" stroke="#B45309" stroke-width="1.8"/>
  <circle cx="51" cy="52" r="1.8" fill="#1E293B"/>
  <circle cx="69" cy="52" r="1.8" fill="#1E293B"/>
  <path d="M55 60 Q60 64 65 60" stroke="#9A3412" stroke-width="1.6" fill="none" stroke-linecap="round"/>
  <!-- Executive Blazer -->
  <path d="M20 110 C20 80 40 74 60 74 C80 74 100 80 100 110 Z" fill="#0F172A"/>
  <polygon points="60,110 52,78 68,78" fill="#F8FAFC"/>
  <!-- Gold Academic Pin -->
  <circle cx="42" cy="88" r="3.5" fill="#F59E0B"/>
</svg>
`);

// ── 3. Campus Staff & Medical Desk ──────────────────────────────────────────
const staffMedicalDoctor = createSvgDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
  <circle cx="60" cy="60" r="58" fill="#ECFEFF" stroke="#06B6D4" stroke-width="3"/>
  <path d="M38 44 C38 24 82 24 82 44 C82 32 72 26 60 26 C48 26 38 32 38 44 Z" fill="#1E293B"/>
  <circle cx="60" cy="48" r="20" fill="#FCE7D0"/>
  <circle cx="53" cy="47" r="2.2" fill="#1E293B"/>
  <circle cx="67" cy="47" r="2.2" fill="#1E293B"/>
  <path d="M55 56 Q60 60 65 56" stroke="#9A3412" stroke-width="1.8" fill="none" stroke-linecap="round"/>
  <!-- Medical White Coat -->
  <path d="M20 110 C20 80 40 70 60 70 C80 70 100 80 100 110 Z" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="2"/>
  <polygon points="60,110 52,70 68,70" fill="#0284C7"/>
  <!-- Stethoscope -->
  <path d="M46 76 C46 95 74 95 74 76" stroke="#475569" stroke-width="3" fill="none" stroke-linecap="round"/>
  <circle cx="60" cy="98" r="4.5" fill="#0284C7" stroke="#FFFFFF" stroke-width="1.5"/>
  <!-- Red Cross Badge -->
  <rect x="76" y="82" width="12" height="12" rx="2" fill="#DC2626"/>
  <line x1="82" y1="84" x2="82" y2="92" stroke="#FFFFFF" stroke-width="2"/>
  <line x1="78" y1="88" x2="86" y2="88" stroke="#FFFFFF" stroke-width="2"/>
</svg>
`);

const staffOfficer = createSvgDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
  <circle cx="60" cy="60" r="58" fill="#F0FDF4" stroke="#16A34A" stroke-width="3"/>
  <path d="M38 44 C38 24 82 24 82 44 C82 32 72 26 60 26 C48 26 38 32 38 44 Z" fill="#0F172A"/>
  <circle cx="60" cy="48" r="20" fill="#D99B6A"/>
  <circle cx="53" cy="47" r="2.2" fill="#1E293B"/>
  <circle cx="67" cy="47" r="2.2" fill="#1E293B"/>
  <path d="M55 56 Q60 60 65 56" stroke="#451A03" stroke-width="1.8" fill="none" stroke-linecap="round"/>
  <!-- Khaki/Navy Security/Officer Uniform -->
  <path d="M20 110 C20 80 40 72 60 72 C80 72 100 80 100 110 Z" fill="#1E3A8A"/>
  <!-- Epaulets / Badges -->
  <rect x="30" y="76" width="14" height="6" rx="1" fill="#F59E0B"/>
  <rect x="76" y="76" width="14" height="6" rx="1" fill="#F59E0B"/>
  <!-- Staff Badge -->
  <rect x="68" y="88" width="18" height="12" rx="2" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1"/>
  <line x1="72" y1="92" x2="82" y2="92" stroke="#1E3A8A" stroke-width="2"/>
</svg>
`);

// ── 4. Casual Donors & First Responders ──────────────────────────────────────
const casualDonorMale = createSvgDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
  <circle cx="60" cy="60" r="58" fill="#FFF1F2" stroke="#E11D48" stroke-width="3"/>
  <!-- Cool Hair -->
  <path d="M36 44 C36 18 84 18 84 44 C84 28 72 22 60 22 C48 22 36 28 36 44 Z" fill="#18181B"/>
  <circle cx="60" cy="48" r="20" fill="#FDDCB1"/>
  <circle cx="53" cy="47" r="2.2" fill="#18181B"/>
  <circle cx="67" cy="47" r="2.2" fill="#18181B"/>
  <path d="M55 56 Q60 61 65 56" stroke="#9A3412" stroke-width="1.8" fill="none" stroke-linecap="round"/>
  <!-- Crimson BloodLink Donor T-shirt -->
  <path d="M22 110 C22 82 40 74 60 74 C80 74 98 82 98 110 Z" fill="#C30121"/>
  <!-- Blood Drop / Heart Emblem -->
  <path d="M60 84 C60 84 52 92 52 97 C52 101.4 55.6 105 60 105 C64.4 105 68 101.4 68 97 C68 92 60 84 60 84 Z" fill="#FFFFFF"/>
</svg>
`);

const casualDonorFemaleHijab = createSvgDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
  <circle cx="60" cy="60" r="58" fill="#FFF1F2" stroke="#E11D48" stroke-width="3"/>
  <!-- Hijab -->
  <path d="M30 65 C30 25 90 25 90 65 C90 85 82 92 60 92 C38 92 30 85 30 65 Z" fill="#9F1239"/>
  <ellipse cx="60" cy="52" rx="17" ry="20" fill="#FDDCB1"/>
  <circle cx="53" cy="50" r="2.2" fill="#18181B"/>
  <circle cx="67" cy="50" r="2.2" fill="#18181B"/>
  <path d="M55 58 Q60 63 65 58" stroke="#9A3412" stroke-width="1.8" fill="none" stroke-linecap="round"/>
  <!-- Crimson Donor Tee -->
  <path d="M22 110 C22 84 40 78 60 78 C80 78 98 84 98 110 Z" fill="#C30121"/>
  <!-- Heart Emblem -->
  <path d="M60 86 C60 86 54 92 54 96 C54 99.5 56.7 102 60 102 C63.3 102 66 99.5 66 96 C66 92 60 86 60 86 Z" fill="#FFFFFF"/>
</svg>
`);

const responderHero = createSvgDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
  <circle cx="60" cy="60" r="58" fill="#FEF2F2" stroke="#DC2626" stroke-width="3"/>
  <path d="M36 44 C36 20 84 20 84 44 C84 30 72 24 60 24 C48 24 36 30 36 44 Z" fill="#09090B"/>
  <circle cx="60" cy="48" r="20" fill="#E29D62"/>
  <circle cx="53" cy="47" r="2.2" fill="#09090B"/>
  <circle cx="67" cy="47" r="2.2" fill="#09090B"/>
  <path d="M55 56 Q60 60 65 56" stroke="#451A03" stroke-width="1.8" fill="none" stroke-linecap="round"/>
  <!-- High-Vis Volunteer Responder Vest -->
  <path d="M22 110 C22 80 40 72 60 72 C80 72 98 80 98 110 Z" fill="#EA580C"/>
  <!-- Silver Reflective Stripes -->
  <line x1="26" y1="92" x2="94" y2="92" stroke="#FFFFFF" stroke-width="4"/>
  <line x1="28" y1="102" x2="92" y2="102" stroke="#FFFFFF" stroke-width="4"/>
  <!-- SOS Badge -->
  <rect x="50" y="78" width="20" height="10" rx="2" fill="#DC2626"/>
  <text x="60" y="85.5" font-size="6.5" font-family="sans-serif" font-weight="bold" fill="#FFFFFF" text-anchor="middle">SOS</text>
</svg>
`);

export const AVATAR_CATEGORIES = [
  {
    id: 'students',
    name: 'BAUST Students',
    description: 'Official Purple Polo uniform & Green ID Card lanyard',
    avatars: [
      {
        id: 'student-m-fair',
        label: 'Male Student (Fair)',
        tags: ['Student', 'Male', 'Purple Polo', 'Green ID'],
        url: studentMaleFair,
      },
      {
        id: 'student-m-med',
        label: 'Male Student (Warm/Med)',
        tags: ['Student', 'Male', 'Purple Polo', 'Green ID'],
        url: studentMaleMedium,
      },
      {
        id: 'student-f-hijab-rose',
        label: 'Female Student (Hijab - Rose)',
        tags: ['Student', 'Female', 'Hijab', 'Purple Polo', 'Green ID'],
        url: studentFemaleHijabRose,
      },
      {
        id: 'student-f-hijab-teal',
        label: 'Female Student (Hijab - Teal)',
        tags: ['Student', 'Female', 'Hijab', 'Purple Polo', 'Green ID'],
        url: studentFemaleHijabTeal,
      },
      {
        id: 'student-f-fair',
        label: 'Female Student (Ponytail)',
        tags: ['Student', 'Female', 'Non-Hijab', 'Purple Polo', 'Green ID'],
        url: studentFemaleNonHijabFair,
      },
    ],
  },
  {
    id: 'faculty',
    name: 'Faculty & Teachers',
    description: 'Executive blazer & academic institutional shade',
    avatars: [
      {
        id: 'teacher-m-prof',
        label: 'Male Professor (Formal Blazer)',
        tags: ['Teacher', 'Faculty', 'Male', 'Formal'],
        url: teacherMaleProf,
      },
      {
        id: 'teacher-f-hijab',
        label: 'Female Professor (Hijab & Blazer)',
        tags: ['Teacher', 'Faculty', 'Female', 'Hijab', 'Executive'],
        url: teacherFemaleProfHijab,
      },
    ],
  },
  {
    id: 'staff',
    name: 'Staff & Medical Desk',
    description: 'Medical triage white coat and campus logistics',
    avatars: [
      {
        id: 'staff-medical',
        label: 'Medical Doctor / Clinic Officer',
        tags: ['Staff', 'Medical', 'White Coat'],
        url: staffMedicalDoctor,
      },
      {
        id: 'staff-officer',
        label: 'Security & Logistics Officer',
        tags: ['Staff', 'Logistics', 'Uniform'],
        url: staffOfficer,
      },
    ],
  },
  {
    id: 'donors',
    name: 'Donors & Emergency Responders',
    description: 'Vital Flow donor tee & rapid response volunteer vest',
    avatars: [
      {
        id: 'donor-m-casual',
        label: 'Male Donor (Crimson Tee)',
        tags: ['Donor', 'Casual', 'Male'],
        url: casualDonorMale,
      },
      {
        id: 'donor-f-hijab',
        label: 'Female Donor (Hijab & Crimson Tee)',
        tags: ['Donor', 'Casual', 'Female', 'Hijab'],
        url: casualDonorFemaleHijab,
      },
      {
        id: 'responder-sos',
        label: 'Emergency SOS Volunteer Responder',
        tags: ['Volunteer', 'First Responder', 'High-Vis'],
        url: responderHero,
      },
    ],
  },
];

// Flat list for quick lookups
export const ALL_AVATARS = AVATAR_CATEGORIES.flatMap((c) => c.avatars);
