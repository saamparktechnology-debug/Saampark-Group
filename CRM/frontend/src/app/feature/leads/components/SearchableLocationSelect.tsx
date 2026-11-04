"use client"

import * as React from "react"
import { ChevronDown, Search, Check, X } from "lucide-react"

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

export const INDIAN_STATES: string[] = [
  "West Bengal",
  "Maharashtra",
  "Delhi",
  "Karnataka",
  "Tamil Nadu",
  "Uttar Pradesh",
  "Gujarat",
  "Rajasthan",
  "Kerala",
  "Telangana",
  "Andhra Pradesh",
  "Bihar",
  "Odisha",
  "Punjab",
  "Haryana",
  "Madhya Pradesh",
  "Assam",
  "Jharkhand",
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

export const DISTRICTS_BY_STATE: Record<string, string[]> = {
  "West Bengal": [
    "Paschim Medinipur",
    "Purba Medinipur",
    "Kolkata",
    "Howrah",
    "Hooghly",
    "North 24 Parganas",
    "South 24 Parganas",
    "Jhargram",
    "Bankura",
    "Purulia",
    "Purba Bardhaman",
    "Paschim Bardhaman",
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
  "Maharashtra": [
    "Mumbai City",
    "Mumbai Suburban",
    "Pune",
    "Thane",
    "Nagpur",
    "Nashik",
    "Aurangabad",
    "Solapur",
    "Kolhapur",
  ],
  "Delhi": [
    "Central Delhi",
    "East Delhi",
    "New Delhi",
    "North Delhi",
    "North East Delhi",
    "North West Delhi",
    "South Delhi",
    "South East Delhi",
    "South West Delhi",
    "West Delhi",
  ],
  "Karnataka": [
    "Bengaluru Urban",
    "Bengaluru Rural",
    "Mysuru",
    "Mangaluru",
    "Belagavi",
    "Hubballi-Dharwad",
  ],
  "Bihar": [
    "Patna",
    "Gaya",
    "Bhagalpur",
    "Muzaffarpur",
    "Purnia",
    "Darbhanga",
  ],
  "Odisha": [
    "Khordha (Bhubaneswar)",
    "Cuttack",
    "Puri",
    "Balasore",
    "Mayurbhanj",
    "Ganjam",
    "Sambalpur",
    "Rourkela",
  ],
}

export const CITIES_BY_DISTRICT: Record<string, string[]> = {
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
  ],
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
    "Mahisadal",
    "Nandigram",
    "Tajpur",
    "Mandarmoni",
  ],
  "Jhargram": [
    "Jhargram",
    "Gopiballavpur",
    "Belpahari",
    "Nayagram",
  ],
  "Kolkata": [
    "Kolkata",
    "Bhowanipore",
    "Park Street",
    "Alipore",
    "Salt Lake (Bidhannagar)",
    "New Town",
    "Dum Dum",
    "Behala",
    "Garia",
    "Tollygunge",
    "Shyambazar",
  ],
  "Howrah": [
    "Howrah",
    "Bally",
    "Uluberia",
    "Shibpur",
    "Domjur",
    "Amta",
  ],
  "Hooghly": [
    "Chinsurah",
    "Chandannagar",
    "Serampore",
    "Bhadreswar",
    "Rishra",
    "Uttarpara",
    "Arambagh",
    "Tarakeswar",
  ],
  "North 24 Parganas": [
    "Barasat",
    "Barrackpore",
    "Bangaon",
    "Basirhat",
    "Habra",
    "Naihati",
    "Madhyamgram",
  ],
  "South 24 Parganas": [
    "Baruipur",
    "Diamond Harbour",
    "Canning",
    "Sonarpur",
    "Budge Budge",
  ],
  "Paschim Bardhaman": [
    "Asansol",
    "Durgapur",
    "Raniganj",
    "Kulti",
  ],
  "Purba Bardhaman": [
    "Bardhaman (Burdwan)",
    "Kalna",
    "Katwa",
  ],
  "Bankura": [
    "Bankura",
    "Bishnupur",
    "Khatra",
  ],
  "Purulia": [
    "Purulia",
    "Raghunathpur",
    "Jhalda",
  ],
  "Nadia": [
    "Krishnanagar",
    "Kalyani",
    "Ranaghat",
    "Nabadwip",
    "Santipur",
  ],
  "Murshidabad": [
    "Berhampore",
    "Murshidabad",
    "Jangipur",
    "Lalgola",
  ],
  "Malda": [
    "English Bazar (Malda)",
    "Old Malda",
    "Chanchal",
  ],
  "Darjeeling": [
    "Darjeeling",
    "Siliguri",
    "Kurseong",
    "Mirik",
  ],
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

  const filteredOptions = React.useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return options
    return options.filter((opt) => opt.toLowerCase().includes(q))
  }, [options, search])

  const isExactMatch = options.some(
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
        <div className="absolute left-0 top-full mt-1 w-full min-w-[200px] max-h-60 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-xl z-[99999] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-100">
          {/* Search Box */}
          <div className="p-2 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-800/60 sticky top-0">
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
          <div className="overflow-y-auto max-h-48 divide-y divide-zinc-50 dark:divide-zinc-800/50">
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
              <div className="p-3 text-center text-xs text-zinc-400">No options available</div>
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
