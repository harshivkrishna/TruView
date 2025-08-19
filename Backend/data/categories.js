const categories = [
  {
    id: 1,
    name: "Animals & Pets",
    slug: "animals-pets",
    subcategories: [
      "Animal Health",
      "Animal Parks & Zoo",
      "Cats & Dogs",
      "Horses & Riding",
      "Pet Services",
      "Pet Stores"
    ]
  },
  {
    id: 2,
    name: "Beauty & Well-being",
    slug: "beauty-wellbeing",
    subcategories: [
      "Cosmetics & Makeup",
      "Hair Care & Styling",
      "Personal Care",
      "Salons & Clinics",
      "Tattoos & Piercings",
      "Wellness & Spa",
      "Yoga & Meditation"
    ]
  },
  {
    id: 3,
    name: "Business Services",
    slug: "business-services",
    subcategories: [
      "Administration & Services",
      "Associations & Centers",
      "HR & Recruiting",
      "Import & Export",
      "IT & Communication",
      "Office Space & Supplies",
      "Print & Graphic Design",
      "Research & Development",
      "Sales & Marketing",
      "Shipping & Logistics",
      "Wholesale"
    ]
  },
  {
    id: 4,
    name: "Construction & Manufacturing",
    slug: "construction-manufacturing",
    subcategories: [
      "Architects & Engineers",
      "Building Materials",
      "Chemicals & Plastic",
      "Construction Services",
      "Contractors & Consultants",
      "Factory Equipment",
      "Garden & Landscaping",
      "Industrial Supplies",
      "Manufacturing",
      "Production Services",
      "Tools & Equipment"
    ]
  },
  {
    id: 5,
    name: "Education & Training",
    slug: "education-training",
    subcategories: [
      "Colleges & Universities",
      "Courses & Classes",
      "Education Services",
      "Language Learning",
      "Music & Theater Classes",
      "School & High School",
      "Specials Schools",
      "Vocational Training"
    ]
  },
  {
    id: 6,
    name: "Electronics & Technology",
    slug: "electronics-technology",
    subcategories: [
      "Appliances & Electronics",
      "Audio & Visual",
      "Computers & Phones",
      "Internet & Software",
      "Repair & Services"
    ]
  },
  {
    id: 7,
    name: "Events & Entertainment",
    slug: "events-entertainment",
    subcategories: [
      "Adult Entertainment",
      "Children's Entertainment",
      "Clubbing & Nightlife",
      "Events & Venues",
      "Gambling",
      "Gaming",
      "Museums & Exhibits",
      "Music & Movies",
      "Theater & Opera",
      "Wedding & Party"
    ]
  },
  {
    id: 8,
    name: "Food, Beverages & Tobacco",
    slug: "food-beverages-tobacco",
    subcategories: [
      "Agriculture & Produce",
      "Asian Grocery Stores",
      "Bakery & Pastry",
      "Beer & Wine",
      "Beverages & Liquor",
      "Candy & Chocolate",
      "Coffee & Tea",
      "Food Production",
      "Fruits & Vegetables",
      "Grocery Stores & Markets",
      "Lunch & Catering",
      "Meat, Seafood & Eggs",
      "Smoking & Tobacco"
    ]
  },
  {
    id: 9,
    name: "Health & Medical",
    slug: "health-medical",
    subcategories: [
      "Clinics",
      "Dental Services",
      "Diagnostics & Testing",
      "Doctors & Surgeons",
      "Health Equipment",
      "Hospital & Emergency",
      "Medical Specialists",
      "Mental Health",
      "Pharmacy & Medicine",
      "Physical Aids",
      "Pregnancy & Children",
      "Therapy & Senior Health",
      "Vision & Hearing"
    ]
  },
  {
    id: 10,
    name: "Hobbies & Crafts",
    slug: "hobbies-crafts",
    subcategories: [
      "Art & Handicraft",
      "Astrology & Numerology",
      "Fishing & Hunting",
      "Hobbies",
      "Metal, Stone & Glass Work",
      "Music & Instruments",
      "Needlework & Knitting",
      "Outdoor Activities",
      "Painting & Paper"
    ]
  },
  {
    id: 11,
    name: "Home & Garden",
    slug: "home-garden",
    subcategories: [
      "Bathroom & Kitchen",
      "Cultural Goods",
      "Decoration & Interior",
      "Energy & Heating",
      "Fabric & Stationery",
      "Furniture Stores",
      "Garden & Pond",
      "Home & Garden Services",
      "Home Goods Stores",
      "Home Improvements"
    ]
  },
  {
    id: 12,
    name: "Home Services",
    slug: "home-services",
    subcategories: [
      "Cleaning Service Providers",
      "Craftsman",
      "House Services",
      "House Sitting & Security",
      "Moving & Storage",
      "Plumbing & Sanitation",
      "Repair Service Providers"
    ]
  },
  {
    id: 13,
    name: "Legal Services & Government",
    slug: "legal-services-government",
    subcategories: [
      "Customs & Toll",
      "Government Department",
      "Law Enforcement",
      "Lawyers & Attorneys",
      "Legal Service Providers",
      "Libraries & Archives",
      "Municipal Department",
      "Registration Services"
    ]
  },
  {
    id: 14,
    name: "Media & Publishing",
    slug: "media-publishing",
    subcategories: [
      "Books & Magazines",
      "Media & Information",
      "Photography",
      "Video & Sound"
    ]
  },
  {
    id: 15,
    name: "Money & Insurance",
    slug: "money-insurance",
    subcategories: [
      "Accounting & Tax",
      "Banking & Money",
      "Credit & Debt Services",
      "Insurance",
      "Investments & Wealth",
      "Real Estate"
    ]
  },
  {
    id: 16,
    name: "Public & Local Services",
    slug: "public-local-services",
    subcategories: [
      "Employment & Career",
      "Funeral & Memorial",
      "Housing Associations",
      "Kids & Family",
      "Military & Veteran",
      "Nature & Environment",
      "Professional Organizations",
      "Public Services & Welfare",
      "Religious Institutions",
      "Shelters & Homes",
      "Waste Management"
    ]
  },
  {
    id: 17,
    name: "Restaurants & Bars",
    slug: "restaurants-bars",
    subcategories: [
      "African & Pacific Cuisine",
      "Bars & Cafes",
      "Chinese & Korean Cuisine",
      "European Cuisine",
      "General Restaurants",
      "Japanese Cuisine",
      "Mediterranean Cuisine",
      "Middle Eastern Cuisine",
      "North & South American Cuisine",
      "Southeast Asian Cuisine",
      "Takeaway",
      "Vegetarian & Diet"
    ]
  },
  {
    id: 18,
    name: "Shopping & Fashion",
    slug: "shopping-fashion",
    subcategories: [
      "Accessories",
      "Clothing & Underwear",
      "Clothing Rental & Repair",
      "Costume & Wedding",
      "Jewelry & Watches",
      "Malls & Marketplaces"
    ]
  },
  {
    id: 19,
    name: "Sports",
    slug: "sports",
    subcategories: [
      "Ball Games",
      "Bat-and-ball Games",
      "Bowls & Lawn Sports",
      "Dancing & Gymnastics",
      "Equipment & Associations",
      "Extreme Sports",
      "Fitness & Weight Lifting",
      "Golf & Ultimate",
      "Hockey & Ice Skating",
      "Martial arts & Wrestling",
      "Outdoor & Winter Sports",
      "Shooting & Target Sports",
      "Swimming & Water Sports",
      "Tennis & Racquet Sports"
    ]
  },
  {
    id: 20,
    name: "Travel & Vacation",
    slug: "travel-vacation",
    subcategories: [
      "Accommodation & Lodging",
      "Activities & Tours",
      "Airlines & Air Travel",
      "Hotels",
      "Travel Agencies"
    ]
  },
  {
    id: 21,
    name: "Utilities",
    slug: "utilities",
    subcategories: [
      "Energy & Power",
      "Oil & Fuel",
      "Water Utilities"
    ]
  },
  {
    id: 22,
    name: "Vehicles & Transportation",
    slug: "vehicles-transportation",
    subcategories: [
      "Air & Water Transport",
      "Airports & Parking",
      "Auto Parts & Wheels",
      "Bicycles",
      "Cars & Trucks",
      "Motorcycle & Powersports",
      "Other Vehicles & Trailers",
      "Taxis & Public Transport",
      "Vehicle Rental",
      "Vehicle Repair & Fuel"
    ]
  }
];

module.exports = categories; 