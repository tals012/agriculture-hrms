/**
 * Map country code to ISO3 code
 * This is used to convert numeric country codes to 3-letter ISO codes
 */
export const countryCodeToIso3 = (code) => {
  if (!code) return 'USA';
  
  // Map with numeric country codes to ISO3
  const codeMap = {
    // Asia
    '356': 'IND', // India
    '376': 'ISR', // Israel
    '400': 'JOR', // Jordan
    '496': 'MNG', // Mongolia
    '702': 'SGP', // Singapore
    '704': 'VNM', // Vietnam
    '764': 'THA', // Thailand
    '156': 'CHN', // China
    '643': 'RUS', // Russia
    '392': 'JPN', // Japan
    '410': 'KOR', // South Korea
    '360': 'IDN', // Indonesia
    '634': 'QAT', // Qatar
    '682': 'SAU', // Saudi Arabia
    '784': 'ARE', // UAE
    '586': 'PAK', // Pakistan
    '144': 'LKA', // Sri Lanka
    '50': 'BGD',  // Bangladesh

    // Europe
    '40': 'AUT',  // Austria
    '56': 'BEL',  // Belgium
    '100': 'BGR', // Bulgaria
    '191': 'HRV', // Croatia
    '196': 'CYP', // Cyprus
    '203': 'CZE', // Czech Republic
    '208': 'DNK', // Denmark
    '233': 'EST', // Estonia
    '246': 'FIN', // Finland
    '250': 'FRA', // France
    '276': 'DEU', // Germany
    '300': 'GRC', // Greece
    '348': 'HUN', // Hungary
    '372': 'IRL', // Ireland
    '380': 'ITA', // Italy
    '428': 'LVA', // Latvia
    '440': 'LTU', // Lithuania
    '442': 'LUX', // Luxembourg
    '470': 'MLT', // Malta
    '498': 'MDA', // Moldova
    '528': 'NLD', // Netherlands
    '616': 'POL', // Poland
    '620': 'PRT', // Portugal
    '642': 'ROU', // Romania
    '703': 'SVK', // Slovakia
    '705': 'SVN', // Slovenia
    '724': 'ESP', // Spain
    '752': 'SWE', // Sweden
    '826': 'GBR', // United Kingdom

    // Americas
    '840': 'USA', // United States
    '124': 'CAN', // Canada
    '484': 'MEX', // Mexico
    '32': 'ARG',  // Argentina
    '76': 'BRA',  // Brazil
    '152': 'CHL', // Chile
    '170': 'COL', // Colombia
    '604': 'PER', // Peru
    '858': 'URY', // Uruguay
    '862': 'VEN', // Venezuela

    // Africa
    '818': 'EGY', // Egypt
    '504': 'MAR', // Morocco
    '710': 'ZAF', // South Africa
    '788': 'TUN', // Tunisia
    '404': 'KEN', // Kenya
    '566': 'NGA', // Nigeria
    '231': 'ETH', // Ethiopia
    '288': 'GHA', // Ghana
    '834': 'TZA', // Tanzania
  };

  const iso3 = codeMap[code];
  return iso3 || 'USA'; // Default to USA if not found
}; 