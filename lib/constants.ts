/** All 38 districts of Bihar (see lib/bihar.ts for localities). */
export const CITIES = [
  "Patna", "Araria", "Arwal", "Aurangabad", "Banka", "Begusarai", "Bhagalpur", "Bhojpur", "Buxar", "Darbhanga",
  "East Champaran", "Gaya", "Gopalganj", "Jamui", "Jehanabad", "Kaimur", "Katihar", "Khagaria", "Kishanganj",
  "Lakhisarai", "Madhepura", "Madhubani", "Munger", "Muzaffarpur", "Nalanda", "Nawada", "Purnia", "Rohtas",
  "Saharsa", "Samastipur", "Saran", "Sheikhpura", "Sheohar", "Sitamarhi", "Siwan", "Supaul", "Vaishali", "West Champaran",
];

export const SUBJECTS = [
  "Physics", "Chemistry", "Mathematics", "Biology", "Science", "English", "Hindi", "Social Science",
  "Accountancy", "Economics", "Business Studies", "Computer Science", "Reasoning", "General Studies",
];
export const COURSE_TYPES = ["Full course", "Subject-wise"];
export const DISTANCES = [1, 2, 3, 4, 5, 10];

export const PATNA_AREAS = [
  "Boring Road", "Kankarbagh", "Rajendra Nagar", "Bailey Road", "Patliputra Colony", "Ashok Rajpath",
  "Musallahpur Hat", "Saguna More", "Danapur", "Bhikhna Pahari", "Frazer Road", "Raja Bazar",
  "Anisabad", "Gandhi Maidan", "Exhibition Road", "Kidwaipuri", "Mahendru", "Phulwari Sharif",
  "Khajpura", "Rukanpura", "Shastri Nagar", "Boring Canal Road", "Kurji", "Digha", "Bypass",
];

export const CLASSES = ["Class 1-5", "Class 6-8", "Class 9-10", "Class 11", "Class 12", "Dropper", "Graduate"];

export const EXAMS = [
  "JEE Main", "JEE Advanced", "NEET", "Foundation", "Olympiad", "Board Exams", "CUET", "NDA",
  "CA Foundation", "BPSC", "UPSC", "SSC", "Banking", "Railway", "Defence", "Spoken English", "IELTS",
];

export const BOARDS = ["CBSE", "ICSE", "BSEB", "State Board"];

export const FACILITIES = [
  "AC Classrooms", "Smart Classes", "Library", "Doubt Clearing Sessions", "Weekly Tests",
  "Online Test Series", "Study Material", "Hostel Facility", "Transport", "CCTV", "Wi-Fi",
  "Biometric Attendance", "Parent-Teacher Meetings", "Girls Separate Batch", "Mentorship",
  "Scholarship Test", "Recorded Lectures", "Drinking Water", "Parking",
];

export const MODES = ["Offline", "Online", "Hybrid"] as const;

export const FEE_PRESETS = [
  { label: "Under ₹15k", min: 0, max: 15000 },
  { label: "₹15k – ₹30k", min: 15000, max: 30000 },
  { label: "₹30k – ₹60k", min: 30000, max: 60000 },
  { label: "₹60k – ₹1L", min: 60000, max: 100000 },
  { label: "Above ₹1L", min: 100000, max: 0 },
];

export const SORTS = [
  { value: "featured", label: "Recommended" },
  { value: "fee_asc", label: "Fee: Low to High" },
  { value: "fee_desc", label: "Fee: High to Low" },
  { value: "rating", label: "Top Rated" },
  { value: "popular", label: "Most Viewed" },
  { value: "newest", label: "Newest" },
  { value: "near", label: "Nearest to me" },
];

/** Columns visitors can see without signing in (matches the column grant for `anon`). */
export const PUBLIC_COLS =
  "id,slug,name,tagline,city,area,established_year,classes,exams,subjects,boards,mode,fee_min,fee_max,facilities,batch_size,gender,cover_image,photos,demo_count,faculty_count,status,is_verified,is_featured,is_sample,rating,review_count,created_at,lat,lng,course_types";

export const QUERY_STATUSES = ["new", "contacted", "visited", "admitted", "closed"] as const;

export const SUPPORT_PHONE = process.env.NEXT_PUBLIC_SUPPORT_PHONE || "7870730626";
export const SUPPORT_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "admin@nextute.com";
