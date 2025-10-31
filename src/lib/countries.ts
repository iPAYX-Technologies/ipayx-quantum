import countriesData from "@/data/countries.json";

export interface Country {
  code: string;
  name: string;
  flag: string;
  currency: string;
}

export const getAllCountries = (): Country[] => {
  return countriesData;
};

export const getCountryByCode = (code: string): Country | undefined => {
  return countriesData.find(c => c.code === code);
};

export const getCurrencyForCountry = (code: string): string | undefined => {
  return getCountryByCode(code)?.currency;
};
