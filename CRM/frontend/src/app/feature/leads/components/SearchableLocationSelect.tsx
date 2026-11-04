"use client"

import * as React from "react"
import { ChevronDown, Search, Check, X } from "lucide-react"

// All Major Countries (India default)
export const ALL_COUNTRIES: string[] = [
  "India",
  "Bangladesh",
  "United States",
  "United Kingdom",
  "United Arab Emirates",
  "Canada",
  "Australia",
  "Singapore",
  "Germany",
  "France",
  "Saudi Arabia",
  "Nepal",
  "Bhutan",
  "Sri Lanka",
  "Malaysia",
  "Qatar",
  "Oman",
  "Kuwait",
  "Japan",
  "China",
  "South Africa",
  "Italy",
  "Spain",
  "Netherlands",
  "Switzerland",
  "Sweden",
  "New Zealand",
  "Russia",
  "Brazil",
  "Indonesia",
  "Philippines",
  "Thailand",
  "Vietnam",
  "Egypt",
  "Nigeria",
  "Kenya",
  "Pakistan",
  "Afghanistan",
  "Argentina",
  "Mexico",
  "Turkey",
]

// All 28 States + 8 Union Territories of India
export const INDIAN_STATES: string[] = [
  "West Bengal",
  "Bihar",
  "Jharkhand",
  "Odisha",
  "Assam",
  "Maharashtra",
  "Delhi",
  "Uttar Pradesh",
  "Gujarat",
  "Karnataka",
  "Tamil Nadu",
  "Rajasthan",
  "Kerala",
  "Telangana",
  "Andhra Pradesh",
  "Punjab",
  "Haryana",
  "Madhya Pradesh",
  "Chhattisgarh",
  "Uttarakhand",
  "Himachal Pradesh",
  "Goa",
  "Tripura",
  "Meghalaya",
  "Manipur",
  "Nagaland",
  "Mizoram",
  "Arunachal Pradesh",
  "Sikkim",
  "Jammu and Kashmir",
  "Ladakh",
  "Chandigarh",
  "Puducherry",
  "Andaman and Nicobar Islands",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Lakshadweep",
]

// Exhaustive Districts by State for ALL 36 States and Union Territories of India
export const DISTRICTS_BY_STATE: Record<string, string[]> = {
  "West Bengal": [
    "Paschim Medinipur",
    "Purba Medinipur",
    "Jhargram",
    "Kolkata",
    "Howrah",
    "Hooghly",
    "North 24 Parganas",
    "South 24 Parganas",
    "Purba Bardhaman",
    "Paschim Bardhaman",
    "Bankura",
    "Purulia",
    "Birbhum",
    "Nadia",
    "Murshidabad",
    "Malda",
    "Uttar Dinajpur",
    "Dakshin Dinajpur",
    "Jalpaiguri",
    "Alipurduar",
    "Cooch Behar",
    "Darjeeling",
    "Kalimpong",
  ],
  "Bihar": [
    "Patna",
    "Gaya",
    "Bhagalpur",
    "Muzaffarpur",
    "Purnia",
    "Darbhanga",
    "Begusarai",
    "Samastipur",
    "Nalanda (Bihar Sharif)",
    "Vaishali (Hajipur)",
    "Munger",
    "Rohtas (Sasaram)",
    "Bhojpur (Arrah)",
    "Saran (Chhapra)",
    "Siwan",
    "Gopalganj",
    "East Champaran (Motihari)",
    "West Champaran (Bettiah)",
    "Sitamarhi",
    "Madhubani",
    "Katihar",
    "Saharsa",
    "Madhepura",
    "Supaul",
    "Kishanganj",
    "Araria",
    "Banka",
    "Jamui",
    "Nawada",
    "Aurangabad",
    "Jehanabad",
    "Arwal",
    "Kaimur (Bhabua)",
    "Buxar",
    "Khagaria",
    "Lakhisarai",
    "Sheikhpura",
    "Sheohar",
  ],
  "Jharkhand": [
    "Ranchi",
    "East Singhbhum (Jamshedpur)",
    "Dhanbad",
    "Bokaro",
    "Hazaribagh",
    "Deoghar",
    "Giridih",
    "Ramgarh",
    "West Singhbhum (Chaibasa)",
    "Seraikela Kharsawan",
    "Palamu (Medininagar)",
    "Garhwa",
    "Chatra",
    "Koderma",
    "Dumka",
    "Godda",
    "Sahebganj",
    "Pakur",
    "Jamtara",
    "Latehar",
    "Lohardaga",
    "Gumla",
    "Simdega",
    "Khunti",
  ],
  "Odisha": [
    "Khordha (Bhubaneswar)",
    "Cuttack",
    "Puri",
    "Balasore",
    "Mayurbhanj",
    "Ganjam",
    "Sambalpur",
    "Sundargarh (Rourkela)",
    "Bhadrak",
    "Jajpur",
    "Kendrapada",
    "Jagatsinghpur",
    "Angul",
    "Dhenkanal",
    "Balangir",
    "Bargarh",
    "Jharsuguda",
    "Deogarh",
    "Keonjhar",
    "Kalahandi",
    "Nuapada",
    "Koraput",
    "Nabarangpur",
    "Rayagada",
    "Malkangiri",
    "Kandhamal",
    "Boudh",
    "Subarnapur (Sonepur)",
    "Nayagarh",
    "Gajapati",
  ],
  "Assam": [
    "Kamrup Metropolitan (Guwahati)",
    "Kamrup",
    "Dibrugarh",
    "Silchar (Cachar)",
    "Jorhat",
    "Nagaon",
    "Tinsukia",
    "Tezpur (Sonitpur)",
    "Barpeta",
    "Bongaigaon",
    "Dhubri",
    "Golaghat",
    "Sivasagar",
    "Karimganj",
    "Hailakandi",
    "Goalpara",
    "Morigaon",
    "Nalbari",
    "Darrang (Mangaldai)",
    "Lakhimpur",
    "Dhemaji",
    "Baksa",
    "Chirang",
    "Kokrajhar",
    "Udalguri",
    "Karbi Anglong",
    "Dima Hasao",
  ],
  "Maharashtra": [
    "Mumbai City",
    "Mumbai Suburban",
    "Pune",
    "Thane",
    "Nagpur",
    "Nashik",
    "Aurangabad (Chhatrapati Sambhajinagar)",
    "Solapur",
    "Kolhapur",
    "Amravati",
    "Nanded",
    "Jalgaon",
    "Akola",
    "Latur",
    "Dhule",
    "Ahmednagar",
    "Chandrapur",
    "Parbhani",
    "Jalna",
    "Bhiwandi",
    "Raigad",
    "Satara",
    "Sangli",
    "Ratnagiri",
    "Sindhudurg",
    "Palghar",
    "Bhandara",
    "Gondia",
    "Wardha",
    "Yavatmal",
    "Buldhana",
    "Washim",
    "Hingoli",
    "Beed",
    "Osmanabad (Dharashiv)",
    "Gadchiroli",
  ],
  "Delhi": [
    "Central Delhi",
    "East Delhi",
    "New Delhi",
    "North Delhi",
    "North East Delhi",
    "North West Delhi",
    "Shahdara",
    "South Delhi",
    "South East Delhi",
    "South West Delhi",
    "West Delhi",
  ],
  "Uttar Pradesh": [
    "Lucknow",
    "Kanpur Nagar",
    "Varanasi",
    "Prayagraj (Allahabad)",
    "Agra",
    "Noida (Gautam Buddha Nagar)",
    "Ghaziabad",
    "Meerut",
    "Bareilly",
    "Aligarh",
    "Moradabad",
    "Saharanpur",
    "Gorakhpur",
    "Ayodhya (Faizabad)",
    "Firozabad",
    "Jhansi",
    "Muzaffarnagar",
    "Mathura",
    "Budaun",
    "Rampur",
    "Shahjahanpur",
    "Farrukhabad",
    "Mirzapur",
    "Sitapur",
    "Bulandshahr",
    "Hardoi",
    "Lakhimpur Kheri",
    "Rae Bareli",
    "Sultanpur",
    "Deoria",
    "Jaunpur",
    "Azamgarh",
    "Ballia",
    "Basti",
    "Gonda",
    "Barabanki",
    "Unnao",
    "Fatehpur",
    "Etawah",
    "Mainpuri",
  ],
  "Gujarat": [
    "Ahmedabad",
    "Surat",
    "Vadodara",
    "Rajkot",
    "Bhavnagar",
    "Jamnagar",
    "Junagadh",
    "Gandhinagar",
    "Anand",
    "Navsari",
    "Morbi",
    "Bharuch",
    "Valsad",
    "Porbandar",
    "Patan",
    "Mehsana",
    "Kheda",
    "Surendranagar",
    "Amreli",
    "Kachchh (Bhuj)",
  ],
  "Karnataka": [
    "Bengaluru Urban",
    "Bengaluru Rural",
    "Mysuru",
    "Hubballi-Dharwad",
    "Mangaluru (Dakshina Kannada)",
    "Belagavi",
    "Kalaburagi (Gulbarga)",
    "Davanagere",
    "Ballari",
    "Vijayapura (Bijapur)",
    "Shivamogga",
    "Tumakuru",
    "Raichur",
    "Bidar",
    "Hosapete",
    "Gadag",
    "Hassan",
    "Udupi",
    "Chikkamagaluru",
  ],
  "Tamil Nadu": [
    "Chennai",
    "Coimbatore",
    "Madurai",
    "Tiruchirappalli",
    "Salem",
    "Tirunelveli",
    "Tiruppur",
    "Vellore",
    "Erode",
    "Thoothukudi",
    "Dindigul",
    "Thanjavur",
    "Kanchipuram",
    "Chengalpattu",
    "Tiruvallur",
    "Cuddalore",
    "Karur",
    "Nagercoil (Kanyakumari)",
    "Hosur (Krishnagiri)",
  ],
  "Rajasthan": [
    "Jaipur",
    "Jodhpur",
    "Kota",
    "Bikaner",
    "Ajmer",
    "Udaipur",
    "Bhilwara",
    "Alwar",
    "Bharatpur",
    "Sikar",
    "Pali",
    "Sri Ganganagar",
    "Barmer",
    "Jhunjhunu",
    "Chittorgarh",
  ],
  "Punjab": [
    "Ludhiana",
    "Amritsar",
    "Jalandhar",
    "Patiala",
    "Bathinda",
    "Mohali (SAS Nagar)",
    "Hoshiarpur",
    "Pathankot",
    "Moga",
    "Firozpur",
  ],
  "Haryana": [
    "Gurugram (Gurgaon)",
    "Faridabad",
    "Panipat",
    "Ambala",
    "Yamunanagar",
    "Rohtak",
    "Hisar",
    "Karnal",
    "Sonipat",
    "Panchkula",
  ],
  "Madhya Pradesh": [
    "Indore",
    "Bhopal",
    "Jabalpur",
    "Gwalior",
    "Ujjain",
    "Sagar",
    "Dewas",
    "Satna",
    "Ratlam",
    "Rewa",
  ],
  "Kerala": [
    "Thiruvananthapuram",
    "Kochi (Ernakulam)",
    "Kozhikode",
    "Kollam",
    "Thrissur",
    "Kannur",
    "Alappuzha",
    "Kottayam",
    "Palakkad",
    "Malappuram",
  ],
  "Telangana": [
    "Hyderabad",
    "Warangal",
    "Nizamabad",
    "Karimnagar",
    "Ramagundam",
    "Khammam",
    "Mahabubnagar",
    "Nalgonda",
  ],
  "Andhra Pradesh": [
    "Visakhapatnam",
    "Vijayawada (NTR)",
    "Guntur",
    "Nellore",
    "Kurnool",
    "Tirupati",
    "Kakinada",
    "Rajahmundry",
    "Kadapa",
    "Anantapur",
  ],
  "Chhattisgarh": [
    "Raipur",
    "Bhilai (Durg)",
    "Bilaspur",
    "Korba",
    "Rajnandgaon",
    "Jagdalpur",
    "Ambikapur",
    "Raigarh",
  ],
  "Uttarakhand": [
    "Dehradun",
    "Haridwar",
    "Roorkee",
    "Haldwani (Nainital)",
    "Rudrapur (Udham Singh Nagar)",
    "Kashipur",
    "Rishikesh",
  ],
  "Himachal Pradesh": [
    "Shimla",
    "Dharamshala (Kangra)",
    "Mandi",
    "Solan",
    "Kullu",
    "Baddi",
    "Una",
  ],
  "Goa": [
    "North Goa (Panaji / Mapusa)",
    "South Goa (Margao / Vasco da Gama)",
  ],
  "Tripura": [
    "West Tripura (Agartala)",
    "Gomati (Udaipur)",
    "South Tripura",
    "North Tripura (Dharmanagar)",
    "Dhalai",
    "Unakoti",
    "Khowai",
    "Sipahijala",
  ],
  "Meghalaya": [
    "East Khasi Hills (Shillong)",
    "West Garo Hills (Tura)",
    "Ri Bhoi (Nongpoh)",
    "Jaintia Hills (Jowai)",
  ],
  "Manipur": [
    "Imphal West",
    "Imphal East",
    "Bishnupur",
    "Thoubal",
    "Churachandpur",
  ],
  "Nagaland": [
    "Kohima",
    "Dimapur",
    "Mokokchung",
    "Tuensang",
    "Wokha",
  ],
  "Mizoram": [
    "Aizawl",
    "Lunglei",
    "Champhai",
    "Kolasib",
  ],
  "Arunachal Pradesh": [
    "Papum Pare (Itanagar)",
    "Changlang",
    "West Kameng",
    "Pasighat (East Siang)",
    "Tawang",
  ],
  "Sikkim": [
    "Gangtok (East Sikkim)",
    "Namchi (South Sikkim)",
    "Gyalshing (West Sikkim)",
    "Mangan (North Sikkim)",
    "Pakyong",
    "Soreng",
  ],
  "Jammu and Kashmir": [
    "Srinagar",
    "Jammu",
    "Anantnag",
    "Baramulla",
    "Udhampur",
    "Kathua",
    "Sopore",
    "Pulwama",
  ],
  "Ladakh": [
    "Leh",
    "Kargil",
  ],
  "Chandigarh": [
    "Chandigarh",
  ],
  "Puducherry": [
    "Pondicherry",
    "Karaikal",
    "Mahe",
    "Yanam",
  ],
  "Andaman and Nicobar Islands": [
    "South Andaman (Port Blair)",
    "North and Middle Andaman",
    "Nicobar",
  ],
  "Dadra and Nagar Haveli and Daman and Diu": [
    "Daman",
    "Diu",
    "Dadra and Nagar Haveli (Silvassa)",
  ],
  "Lakshadweep": [
    "Kavaratti",
    "Agatti",
    "Amini",
    "Andrott",
  ],
}

// Complete Cities, Municipalities, Subdivisions & Towns for ALL West Bengal Districts and Major Hubs
export const CITIES_BY_DISTRICT: Record<string, string[]> = {
  // 1. Paschim Medinipur
  "Paschim Medinipur": [
    "Midnapore",
    "Kharagpur",
    "Balichak",
    "Debra",
    "Ghatal",
    "Belda",
    "Dantan",
    "Pingla",
    "Sabang",
    "Garhbeta",
    "Chandrakona",
    "Keshpur",
    "Mohanpur",
    "Narayangarh",
    "Daspur",
    "Salboni",
    "Goaltore",
    "Khirpai",
    "Ramjibanpur",
  ],
  // 2. Purba Medinipur
  "Purba Medinipur": [
    "Tamluk",
    "Haldia",
    "Contai (Kanthi)",
    "Digha",
    "Moyna",
    "Egra",
    "Mecheda",
    "Panskura",
    "Kolaghat",
    "Nandigram",
    "Mahisadal",
    "Sutahata",
    "Ramnagar",
    "Tajpur",
    "Mandarmoni",
    "Chandipur",
    "Khejuri",
    "Bhagabanpur",
    "Patashpur",
  ],
  // 3. Jhargram
  "Jhargram": [
    "Jhargram",
    "Gopiballavpur",
    "Belpahari",
    "Nayagram",
    "Binpur",
    "Sankrail",
    "Jamboni",
    "Silda",
  ],
  // 4. Kolkata
  "Kolkata": [
    "Kolkata",
    "Park Street",
    "Bhowanipore",
    "Alipore",
    "Salt Lake (Bidhannagar)",
    "New Town",
    "Rajarhat",
    "Dum Dum",
    "Behala",
    "Garia",
    "Jadavpur",
    "Tollygunge",
    "Shyambazar",
    "Burrabazar",
    "Sealdah",
    "Esplanade",
    "Kasba",
    "Ballygunge",
    "Lake Gardens",
    "Barisha",
    "Thakurpukur",
  ],
  // 5. Howrah
  "Howrah": [
    "Howrah",
    "Bally",
    "Uluberia",
    "Shibpur",
    "Domjur",
    "Amta",
    "Bagnan",
    "Sankrail",
    "Panchla",
    "Jagatballavpur",
    "Mahiari",
    "Andul",
  ],
  // 6. Hooghly
  "Hooghly": [
    "Chinsurah",
    "Chandannagar",
    "Serampore",
    "Bhadreswar",
    "Rishra",
    "Uttarpara",
    "Konnagar",
    "Dankuni",
    "Singur",
    "Tarakeswar",
    "Arambagh",
    "Bansberia",
    "Mogra",
    "Pandua",
    "Balagarh",
    "Haripal",
    "Dhaniakhali",
    "Khanakul",
    "Goghat",
    "Pursurah",
  ],
  // 7. North 24 Parganas
  "North 24 Parganas": [
    "Barasat",
    "Barrackpore",
    "Bidhannagar",
    "New Town",
    "Rajarhat",
    "Madhyamgram",
    "Habra",
    "Bangaon",
    "Basirhat",
    "Naihati",
    "Bhatpara",
    "Kanchrapara",
    "Halisahar",
    "Panihati",
    "Kamarhati",
    "Baranagar",
    "Dum Dum",
    "North Dumdum",
    "South Dumdum",
    "Deganga",
    "Baduria",
    "Taki",
    "Hasnabad",
    "Hingalganj",
    "Minakhan",
    "Sandeshkhali",
  ],
  // 8. South 24 Parganas
  "South 24 Parganas": [
    "Baruipur",
    "Sonarpur",
    "Diamond Harbour",
    "Canning",
    "Budge Budge",
    "Maheshtala",
    "Pujali",
    "Jayanagar-Majilpur",
    "Kakdwip",
    "Namkhana",
    "Bakkhali",
    "Gosaba",
    "Basanti",
    "Kultali",
    "Mandirbazar",
    "Magrahat",
    "Bhangar",
  ],
  // 9. Paschim Bardhaman
  "Paschim Bardhaman": [
    "Asansol",
    "Durgapur",
    "Raniganj",
    "Kulti",
    "Jamuria",
    "Andal",
    "Pandaveswar",
    "Barakar",
    "Chittaranjan",
    "Ukhra",
  ],
  // 10. Purba Bardhaman
  "Purba Bardhaman": [
    "Bardhaman (Burdwan)",
    "Kalna",
    "Katwa",
    "Memari",
    "Guskara",
    "Bhatar",
    "Monteswar",
    "Purbasthali",
    "Khandaghosh",
    "Raina",
    "Jamalpur",
  ],
  // 11. Bankura
  "Bankura": [
    "Bankura",
    "Bishnupur",
    "Khatra",
    "Sonamukhi",
    "Barjora",
    "Mejia",
    "Kotulpur",
    "Joypur",
    "Patrasayer",
    "Indas",
    "Onda",
    "Chhatna",
    "Taldangra",
    "Simlapal",
    "Ranibandh",
    "Raipur",
    "Mukutmanipur",
  ],
  // 12. Purulia
  "Purulia": [
    "Purulia",
    "Raghunathpur",
    "Jhalda",
    "Balarampur",
    "Manbazar",
    "Baghmundi",
    "Ayodhya Hills",
    "Kashipur",
    "Para",
    "Hura",
    "Puncha",
    "Bandwan",
    "Neturia",
    "Santaldih",
    "Adra",
  ],
  // 13. Birbhum
  "Birbhum": [
    "Suri",
    "Bolpur",
    "Santiniketan",
    "Rampurhat",
    "Sainthia",
    "Dubrajpur",
    "Ilambazar",
    "Nalhati",
    "Murarai",
    "Mayureswar",
    "Labpur",
    "Nanoor",
    "Tarapith",
    "Bakreshwar",
  ],
  // 14. Nadia
  "Nadia": [
    "Krishnanagar",
    "Kalyani",
    "Ranaghat",
    "Nabadwip",
    "Santipur",
    "Chakdaha",
    "Tehatta",
    "Karimpur",
    "Bethuadahari",
    "Nakashipara",
    "Chapra",
    "Hanskhali",
    "Haringhata",
    "Gayeshpur",
    "Taherpur",
  ],
  // 15. Murshidabad
  "Murshidabad": [
    "Berhampore",
    "Murshidabad",
    "Jiaganj",
    "Azimganj",
    "Jangipur",
    "Dhulian",
    "Kandi",
    "Domkal",
    "Beldanga",
    "Lalgola",
    "Raghunathganj",
    "Hariharpara",
    "Jalangi",
    "Raninagar",
    "Bhagabangola",
    "Suti",
    "Farakka",
  ],
  // 16. Malda
  "Malda": [
    "English Bazar (Malda)",
    "Old Malda",
    "Chanchal",
    "Samsi",
    "Gazole",
    "Harischandrapur",
    "Ratua",
    "Manikchak",
    "Kaliachak",
    "Baishnabnagar",
    "Habibpur",
    "Bamangola",
  ],
  // 17. Uttar Dinajpur
  "Uttar Dinajpur": [
    "Raiganj",
    "Kaliyaganj",
    "Islampur",
    "Dalkhola",
    "Hemtabad",
    "Itahar",
    "Karandighi",
    "Chopra",
    "Goalpokhar",
  ],
  // 18. Dakshin Dinajpur
  "Dakshin Dinajpur": [
    "Balurghat",
    "Gangarampur",
    "Buniadpur",
    "Tapan",
    "Kumarganj",
    "Hili",
    "Harirampur",
    "Kushmandi",
  ],
  // 19. Jalpaiguri
  "Jalpaiguri": [
    "Jalpaiguri",
    "Malbazar",
    "Dhupguri",
    "Mainaguri",
    "Rajganj",
    "Nagrakata",
    "Matiali",
    "Banarhat",
    "Chalsa",
    "Gorumara",
    "Lataguri",
  ],
  // 20. Alipurduar
  "Alipurduar": [
    "Alipurduar",
    "Falakata",
    "Jaigaon",
    "Birpara",
    "Madarihat",
    "Kalchini",
    "Kumargram",
    "Buxa",
    "Hasimara",
    "Shamuktala",
  ],
  // 21. Cooch Behar
  "Cooch Behar": [
    "Cooch Behar",
    "Dinhata",
    "Mathabhanga",
    "Tufanganj",
    "Mekhliganj",
    "Haldibari",
    "Sitalkuchi",
    "Sitai",
    "Baxirhat",
  ],
  // 22. Darjeeling
  "Darjeeling": [
    "Darjeeling",
    "Siliguri",
    "Kurseong",
    "Mirik",
    "Sukna",
    "Bijanbari",
    "Takdah",
    "Rongli",
    "Pedong",
    "Batasia",
    "Ghum",
  ],
  // 23. Kalimpong
  "Kalimpong": [
    "Kalimpong",
    "Gorubathan",
    "Lava",
    "Rishyap",
    "Lolegaon",
    "Pedong",
    "Algarah",
  ],

  // Other Major State Hubs
  "Patna": ["Patna", "Danapur", "Phulwari Sharif", "Fatwah", "Barh", "Mokama", "Bikram"],
  "Gaya": ["Gaya", "Bodh Gaya", "Sherghati", "Tekari"],
  "Ranchi": ["Ranchi", "Kanke", "Hatia", "Namkum", "Tatisilwai", "Bundu"],
  "East Singhbhum (Jamshedpur)": ["Jamshedpur", "Tatanagar", "Ghatshila", "Jugsalai", "Mango", "Potka"],
  "Dhanbad": ["Dhanbad", "Jharia", "Katras", "Sindri", "Chirkunda", "Nirsa"],
  "Bokaro": ["Bokaro Steel City", "Chas", "Bermo", "Phusro", "Gomia"],
  "Khordha (Bhubaneswar)": ["Bhubaneswar", "Khordha", "Jatni", "Banapur", "Balipatna"],
  "Cuttack": ["Cuttack", "Choudwar", "Banki", "Athagarh", "Salepur"],
  "Sundargarh (Rourkela)": ["Rourkela", "Sundargarh", "Rajgangpur", "Biramitrapur"],
  "Kamrup Metropolitan (Guwahati)": ["Guwahati", "Dispur", "North Guwahati", "Azara", "Chandrapur"],
  "Mumbai City": ["Mumbai", "South Mumbai", "Colaba", "Dadar", "Nariman Point", "Fort"],
  "Mumbai Suburban": ["Bandra", "Andheri", "Borivali", "Goregaon", "Juhu", "Kandivali", "Malad", "Kurla", "Ghatkopar", "Mulund"],
  "Pune": ["Pune", "Pimpri-Chinchwad", "Hinjawadi", "Kothrud", "Hadapsar", "Viman Nagar", "Shivajinagar", "Wakad", "Baner"],
  "Thane": ["Thane", "Kalyan", "Dombivli", "Navi Mumbai", "Mira-Bhayandar", "Ulhasnagar", "Badlapur"],
  "Nagpur": ["Nagpur", "Kamptee", "Hingna", "Katol", "Ramtek", "Umred"],
  "New Delhi": ["Connaught Place", "Chanakyapuri", "Lodhi Road", "Barakhamba", "India Gate"],
  "South Delhi": ["Saket", "Hauz Khas", "Greater Kailash", "Malviya Nagar", "Nehru Place", "Lajpat Nagar"],
  "Lucknow": ["Lucknow", "Hazratganj", "Gomti Nagar", "Alambagh", "Indira Nagar", "Charbagh"],
  "Kanpur Nagar": ["Kanpur", "Kalyanpur", "Civil Lines", "Govind Nagar", "Panki"],
  "Bengaluru Urban": ["Bengaluru", "Whitefield", "Koramangala", "Indiranagar", "Electronic City", "HSR Layout", "Jayanagar", "Marathahalli", "Yelahanka"],
  "Chennai": ["Chennai", "T. Nagar", "Adyar", "Velachery", "Anna Nagar", "Mylapore", "Guindy", "Tambaram"],
  "Hyderabad": ["Hyderabad", "Secunderabad", "Hitec City", "Gachibowli", "Madhapur", "Banjara Hills", "Jubilee Hills", "Kukatpally"],
  "Ahmedabad": ["Ahmedabad", "Navrangpura", "Maninagar", "Bodakdev", "Satellite", "Vastrapur", "SG Highway"],
}

// Helper to get exhaustive districts for any State
export function getDistrictsForState(stateName: string): string[] {
  const trimmed = (stateName || "").trim()
  if (!trimmed) return DISTRICTS_BY_STATE["West Bengal"]
  
  // Exact match
  if (DISTRICTS_BY_STATE[trimmed]) return DISTRICTS_BY_STATE[trimmed]

  // Case-insensitive match
  const key = Object.keys(DISTRICTS_BY_STATE).find(
    k => k.toLowerCase() === trimmed.toLowerCase()
  )
  if (key) return DISTRICTS_BY_STATE[key]

  return DISTRICTS_BY_STATE["West Bengal"]
}

// Helper to get exhaustive cities for any State and District
export function getCitiesForDistrict(stateName: string, districtName?: string): string[] {
  const dTrimmed = (districtName || "").trim()
  const sTrimmed = (stateName || "").trim()

  // 1. If district is provided and found in CITIES_BY_DISTRICT
  if (dTrimmed) {
    if (CITIES_BY_DISTRICT[dTrimmed]) return CITIES_BY_DISTRICT[dTrimmed]

    const dKey = Object.keys(CITIES_BY_DISTRICT).find(
      k => k.toLowerCase() === dTrimmed.toLowerCase()
    )
    if (dKey) return CITIES_BY_DISTRICT[dKey]
  }

  // 2. If state is West Bengal, combine all major cities of West Bengal
  if (sTrimmed.toLowerCase().includes("bengal") || !sTrimmed) {
    const wbCities: string[] = []
    DISTRICTS_BY_STATE["West Bengal"].forEach(d => {
      if (CITIES_BY_DISTRICT[d]) {
        wbCities.push(...CITIES_BY_DISTRICT[d])
      }
    })
    return Array.from(new Set(wbCities))
  }

  // 3. For any other state, check if there are district-level cities mapped
  const stateDists = getDistrictsForState(sTrimmed)
  const stateCities: string[] = []
  stateDists.forEach(d => {
    if (CITIES_BY_DISTRICT[d]) {
      stateCities.push(...CITIES_BY_DISTRICT[d])
    }
  })

  if (stateCities.length > 0) {
    return Array.from(new Set(stateCities))
  }

  // Fallback: return state districts themselves as city options
  return stateDists
}

interface SearchableSelectProps {
  label?: string
  value: string
  onChange: (val: string) => void
  options: string[]
  placeholder?: string
  searchPlaceholder?: string
  disabled?: boolean
  className?: string
}

export function SearchableSelect({
  label,
  value,
  onChange,
  options,
  placeholder = "Select...",
  searchPlaceholder = "Search...",
  disabled = false,
  className = "",
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")
  const dropdownRef = React.useRef<HTMLDivElement>(null)
  const searchInputRef = React.useRef<HTMLInputElement>(null)

  // Close on outside click
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
      setTimeout(() => searchInputRef.current?.focus(), 50)
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen])

  // Normalize options and ensure current value is present if set
  const allAvailableOptions = React.useMemo(() => {
    const list = Array.isArray(options) ? [...options] : []
    if (value && value.trim() && !list.some(o => o.toLowerCase().trim() === value.toLowerCase().trim())) {
      list.unshift(value.trim())
    }
    return Array.from(new Set(list))
  }, [options, value])

  const filteredOptions = React.useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return allAvailableOptions
    return allAvailableOptions.filter((opt) => opt.toLowerCase().includes(q))
  }, [allAvailableOptions, search])

  const isExactMatch = allAvailableOptions.some(
    (opt) => opt.toLowerCase().trim() === search.toLowerCase().trim()
  )

  const handleSelect = (val: string) => {
    onChange(val)
    setIsOpen(false)
    setSearch("")
  }

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (!disabled) {
            setIsOpen((prev) => !prev)
            setSearch("")
          }
        }}
        className={`w-full flex items-center justify-between px-3 py-2 text-xs text-left bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors ${
          disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-750"
        }`}
      >
        <span className={`truncate font-medium ${value ? "text-zinc-800 dark:text-zinc-200" : "text-zinc-400"}`}>
          {value || placeholder}
        </span>
        <ChevronDown size={14} className={`text-zinc-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full mt-1 w-full min-w-[220px] max-h-64 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-2xl z-[99999] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-100">
          {/* Search Box */}
          <div className="p-2 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-800/70 sticky top-0">
            <div className="relative flex items-center">
              <Search size={13} className="absolute left-2.5 text-zinc-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full pl-7 pr-7 py-1.5 text-xs bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>

          {/* Options List */}
          <div className="overflow-y-auto max-h-52 divide-y divide-zinc-50 dark:divide-zinc-800/50">
            {/* Custom value option if user typed something not strictly in the list */}
            {search.trim() && !isExactMatch && (
              <button
                type="button"
                onClick={() => handleSelect(search.trim())}
                className="w-full px-3 py-2 text-left text-xs text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/60 font-semibold flex items-center justify-between"
              >
                <span>+ Use &quot;{search.trim()}&quot;</span>
                <span className="text-[10px] text-blue-500 bg-blue-100 dark:bg-blue-900/60 px-1.5 py-0.5 rounded">Custom</span>
              </button>
            )}

            {filteredOptions.length === 0 && !search.trim() && (
              <div className="p-3 text-center text-xs text-zinc-400">No options found. Type custom name above.</div>
            )}

            {filteredOptions.map((opt) => {
              const isSelected = opt.toLowerCase().trim() === (value || "").toLowerCase().trim()
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => handleSelect(opt)}
                  className={`w-full px-3 py-2 text-left text-xs flex items-center justify-between transition-colors ${
                    isSelected
                      ? "bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 font-bold"
                      : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  }`}
                >
                  <span className="truncate">{opt}</span>
                  {isSelected && <Check size={13} className="text-blue-600 dark:text-blue-400 shrink-0 ml-1" />}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
