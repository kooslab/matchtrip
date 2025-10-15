import countryData from '$lib/constants/countryCodes.json';

export interface CountryCode {
	country: string;
	code: string;
	dialCode: string;
	flag: string;
}

// Combine all regions and convert to the expected format
const allCountries = [
	...countryData.asia,
	...countryData.americas,
	...countryData.europe
].map(country => ({
	country: country.name_ko,
	code: country.code,
	dialCode: country.phone,
	flag: country.flag
}));

// Sort by dial code as string (lexicographic order)
// This groups codes by their starting digits (e.g., +41, +420, +43 all together)
export const countryCodes: CountryCode[] = allCountries.sort((a, b) => {
	return a.dialCode.localeCompare(b.dialCode);
});

export function getCountryByDialCode(dialCode: string): CountryCode | undefined {
	return countryCodes.find((c) => c.dialCode === dialCode);
}

export function getCountryByCode(code: string): CountryCode | undefined {
	return countryCodes.find((c) => c.code === code);
}

// Export a version formatted for dropdown components
export const countryCodesForDropdown = countryCodes.map(country => ({
	code: country.dialCode,
	flag: country.flag,
	country: country.code,
	name: country.country
}));