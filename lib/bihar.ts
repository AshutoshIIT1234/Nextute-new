import { PATNA_AREAS } from "./constants";

/** All 38 districts of Bihar → district HQ + main localities / towns. Edit freely; institutes can also type any area. */
export const BIHAR: { district: string; hq: string; areas: string[] }[] = [
  { district: "Patna", hq: "Patna", areas: PATNA_AREAS },
  { district: "Araria", hq: "Araria", areas: ["Araria Town", "Forbesganj", "Jogbani", "Narpatganj", "Raniganj"] },
  { district: "Arwal", hq: "Arwal", areas: ["Arwal Town", "Kurtha", "Karpi", "Sonbhadra"] },
  { district: "Aurangabad", hq: "Aurangabad", areas: ["Aurangabad Town", "Daudnagar", "Obra", "Rafiganj", "Nabinagar"] },
  { district: "Banka", hq: "Banka", areas: ["Banka Town", "Amarpur", "Katoria", "Bounsi"] },
  { district: "Begusarai", hq: "Begusarai", areas: ["Begusarai Town", "Barauni", "Teghra", "Bakhri", "Ballia", "Bachhwara"] },
  { district: "Bhagalpur", hq: "Bhagalpur", areas: ["Tilkamanjhi", "Adampur", "Khalifabagh", "Nathnagar", "Barari", "Mirjanhat", "Sabour", "Kahalgaon", "Naugachhia"] },
  { district: "Bhojpur", hq: "Ara", areas: ["Ara Town", "Nawada (Ara)", "Jagdishpur", "Piro", "Koilwar", "Bihiya"] },
  { district: "Buxar", hq: "Buxar", areas: ["Buxar Town", "Dumraon", "Brahmpur", "Itarhi"] },
  { district: "Darbhanga", hq: "Darbhanga", areas: ["Laheriasarai", "Donar", "Benta", "Allalpatti", "Bela", "Kadirabad", "Lalbagh", "Benipur"] },
  { district: "East Champaran", hq: "Motihari", areas: ["Motihari Town", "Raxaul", "Chakia", "Areraj", "Pakridayal", "Dhaka"] },
  { district: "Gaya", hq: "Gaya", areas: ["Civil Lines", "A.P. Colony", "Swarajpuri Road", "Chandauti", "Bodh Gaya", "Manpur", "Sherghati", "Tekari"] },
  { district: "Gopalganj", hq: "Gopalganj", areas: ["Gopalganj Town", "Hathua", "Mirganj", "Barauli"] },
  { district: "Jamui", hq: "Jamui", areas: ["Jamui Town", "Jhajha", "Sikandra", "Chakai"] },
  { district: "Jehanabad", hq: "Jehanabad", areas: ["Jehanabad Town", "Makhdumpur", "Ghoshi", "Kako"] },
  { district: "Kaimur", hq: "Bhabua", areas: ["Bhabua Town", "Mohania", "Ramgarh", "Kudra", "Chainpur"] },
  { district: "Katihar", hq: "Katihar", areas: ["Katihar Town", "Barsoi", "Manihari", "Kursela", "Azamnagar"] },
  { district: "Khagaria", hq: "Khagaria", areas: ["Khagaria Town", "Gogri", "Parbatta", "Mansi"] },
  { district: "Kishanganj", hq: "Kishanganj", areas: ["Kishanganj Town", "Bahadurganj", "Thakurganj", "Kochadhaman"] },
  { district: "Lakhisarai", hq: "Lakhisarai", areas: ["Lakhisarai Town", "Barahiya", "Surajgarha", "Chanan"] },
  { district: "Madhepura", hq: "Madhepura", areas: ["Madhepura Town", "Udakishunganj", "Murliganj", "Singheshwar"] },
  { district: "Madhubani", hq: "Madhubani", areas: ["Madhubani Town", "Jhanjharpur", "Benipatti", "Jaynagar", "Phulparas"] },
  { district: "Munger", hq: "Munger", areas: ["Munger Town", "Jamalpur", "Tarapur", "Kharagpur"] },
  { district: "Muzaffarpur", hq: "Muzaffarpur", areas: ["Brahmpura", "Juran Chhapra", "Mithanpura", "Kalyani Chowk", "Aghoria Bazar", "Bairia", "Motijheel", "Saraiyaganj", "Kanti"] },
  { district: "Nalanda", hq: "Bihar Sharif", areas: ["Bihar Sharif", "Rajgir", "Hilsa", "Islampur", "Harnaut"] },
  { district: "Nawada", hq: "Nawada", areas: ["Nawada Town", "Rajauli", "Warisaliganj", "Hisua"] },
  { district: "Purnia", hq: "Purnia", areas: ["Line Bazar", "Madhubani (Purnia)", "Gulabbagh", "Bhatta Bazar", "Kasba", "Banmankhi", "Dhamdaha"] },
  { district: "Rohtas", hq: "Sasaram", areas: ["Sasaram Town", "Dehri-on-Sone", "Bikramganj", "Nokha", "Dinara"] },
  { district: "Saharsa", hq: "Saharsa", areas: ["Saharsa Town", "Simri Bakhtiyarpur", "Mahishi", "Sonbarsa"] },
  { district: "Samastipur", hq: "Samastipur", areas: ["Samastipur Town", "Dalsinghsarai", "Rosera", "Patori", "Pusa"] },
  { district: "Saran", hq: "Chapra", areas: ["Chapra Town", "Sonepur", "Marhaura", "Revelganj", "Ekma"] },
  { district: "Sheikhpura", hq: "Sheikhpura", areas: ["Sheikhpura Town", "Barbigha", "Ariari"] },
  { district: "Sheohar", hq: "Sheohar", areas: ["Sheohar Town", "Piprahi", "Tariyani"] },
  { district: "Sitamarhi", hq: "Sitamarhi", areas: ["Sitamarhi Town", "Dumra", "Pupri", "Belsand", "Bairgania"] },
  { district: "Siwan", hq: "Siwan", areas: ["Siwan Town", "Maharajganj", "Mairwa", "Barharia", "Guthani"] },
  { district: "Supaul", hq: "Supaul", areas: ["Supaul Town", "Birpur", "Triveniganj", "Nirmali"] },
  { district: "Vaishali", hq: "Hajipur", areas: ["Hajipur", "Mahua", "Lalganj", "Bidupur", "Mahnar"] },
  { district: "West Champaran", hq: "Bettiah", areas: ["Bettiah Town", "Bagaha", "Narkatiaganj", "Ramnagar", "Chanpatia"] },
];

export const DISTRICTS = BIHAR.map((d) => d.district);
export function districtLabel(d: string) {
  const r = BIHAR.find((x) => x.district === d);
  return r && r.hq !== r.district ? `${r.district} (${r.hq})` : d;
}
export function areasFor(district?: string | null): string[] {
  if (!district) return PATNA_AREAS;
  return BIHAR.find((d) => d.district === district)?.areas ?? [];
}
