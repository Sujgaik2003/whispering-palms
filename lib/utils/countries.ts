// List of countries for dropdown
export const COUNTRIES = [
  'Afghanistan', 'Albania', 'Algeria', 'Argentina', 'Australia', 'Austria',
  'Bangladesh', 'Belgium', 'Brazil', 'Bulgaria',
  'Canada', 'China', 'Colombia', 'Croatia', 'Czech Republic',
  'Denmark',
  'Egypt', 'Ethiopia',
  'Finland', 'France',
  'Germany', 'Ghana', 'Greece',
  'Hong Kong', 'Hungary',
  'Iceland', 'India', 'Indonesia', 'Iran', 'Iraq', 'Ireland', 'Israel', 'Italy',
  'Japan', 'Jordan',
  'Kenya', 'Kuwait',
  'Lebanon',
  'Malaysia', 'Mexico', 'Morocco',
  'Nepal', 'Netherlands', 'New Zealand', 'Nigeria', 'Norway',
  'Oman',
  'Pakistan', 'Philippines', 'Poland', 'Portugal',
  'Qatar',
  'Romania', 'Russia',
  'Saudi Arabia', 'Singapore', 'South Africa', 'South Korea', 'Spain', 'Sri Lanka', 'Sweden', 'Switzerland',
  'Taiwan', 'Thailand', 'Turkey',
  'UAE', 'UK', 'Ukraine', 'USA',
  'Vietnam',
  'Yemen',
].sort()

export function filterCountries(searchTerm: string): string[] {
  if (!searchTerm) return COUNTRIES
  const term = searchTerm.toLowerCase()
  return COUNTRIES.filter(country => 
    country.toLowerCase().includes(term)
  )
}
