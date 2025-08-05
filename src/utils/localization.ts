import { MenuItem } from '@/types';
import { Language } from '@/contexts/LanguageContext';

export const getLocalizedValue = (
  item: MenuItem,
  field: 'name' | 'description' | 'category',
  language: Language
): string => {
  const fieldEn = `${field}_en` as keyof MenuItem;
  const fieldTh = `${field}_th` as keyof MenuItem;
  const fallbackField = field as keyof MenuItem;
  
  if (language === 'en') {
    return (item[fieldEn] as string) || (item[fallbackField] as string) || '';
  } else {
    return (item[fieldTh] as string) || (item[fallbackField] as string) || '';
  }
};

export const getMenuItemName = (item: MenuItem, language: Language): string => {
  return getLocalizedValue(item, 'name', language);
};

export const getMenuItemDescription = (item: MenuItem, language: Language): string => {
  return getLocalizedValue(item, 'description', language);
};

export const getMenuItemCategory = (item: MenuItem, language: Language): string => {
  return getLocalizedValue(item, 'category', language);
};