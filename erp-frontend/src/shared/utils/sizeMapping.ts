/**
 * Mapping utility for converting semantic size values to Tailwind CSS classes
 * This allows settings to use user-friendly values like 'small', 'medium' instead of direct Tailwind classes
 */

export type SemanticSize = 'extra-small' | 'small' | 'medium' | 'large' | 'extra-large';

/**
 * Get all semantic size options for dropdowns
 */
export const SEMANTIC_SIZE_OPTIONS: Array<{ value: SemanticSize; label: string }> = [
  { value: 'extra-small', label: 'Extra Small' },
  { value: 'small', label: 'Small' },
  { value: 'medium', label: 'Medium' },
  { value: 'large', label: 'Large' },
  { value: 'extra-large', label: 'Extra Large' },
];

/**
 * Maps a base semantic padding size to Tailwind padding classes for each button size
 * The user selects ONE base size, and it maps to appropriate values for xs/sm/md/lg
 */
export const PADDING_SIZE_MAPPING: Record<SemanticSize, Record<'xs' | 'sm' | 'md' | 'lg', string>> = {
  'extra-small': {
    xs: 'px-0.5 py-0.5',
    sm: 'px-1 py-1',
    md: 'px-1 py-1',
    lg: 'px-1.5 py-1.5',
  },
  'small': {
    xs: 'px-1 py-1',
    sm: 'px-1.5 py-1.5',
    md: 'px-1.5 py-1.5',
    lg: 'px-2 py-2',
  },
  'medium': {
    xs: 'px-1 py-1',
    sm: 'px-1.5 py-1.5',
    md: 'px-2 py-2',
    lg: 'px-3 py-3',
  },
  'large': {
    xs: 'px-1.5 py-1.5',
    sm: 'px-2 py-2',
    md: 'px-3 py-3',
    lg: 'px-4 py-4',
  },
  'extra-large': {
    xs: 'px-2 py-2',
    sm: 'px-2.5 py-2.5',
    md: 'px-3 py-3',
    lg: 'px-5 py-5',
  },
};

/**
 * Maps a base semantic icon size to Tailwind icon size classes for each button size
 * The user selects ONE base size, and it maps to appropriate values for xs/sm/md/lg
 */
export const ICON_SIZE_MAPPING: Record<SemanticSize, Record<'xs' | 'sm' | 'md' | 'lg', string>> = {
  'extra-small': {
    xs: 'h-3 w-3',
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-4 w-4',
  },
  'small': {
    xs: 'h-3 w-3',
    sm: 'h-4 w-4',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  },
  'medium': {
    xs: 'h-3 w-3',
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  },
  'large': {
    xs: 'h-4 w-4',
    sm: 'h-5 w-5',
    md: 'h-6 w-6',
    lg: 'h-7 w-7',
  },
  'extra-large': {
    xs: 'h-4 w-4',
    sm: 'h-5 w-5',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  },
};

/**
 * Get padding class for a button size based on the selected base semantic size
 */
export const getPaddingClass = (baseSize: SemanticSize, buttonSize: 'xs' | 'sm' | 'md' | 'lg'): string => {
  // Handle legacy Tailwind class strings (backward compatibility)
  if (typeof baseSize === 'string' && (baseSize.includes('px-') || baseSize.includes('py-'))) {
    return baseSize;
  }
  
  // Handle legacy semantic size values from old format
  if (!(baseSize in PADDING_SIZE_MAPPING)) {
    return PADDING_SIZE_MAPPING.medium[buttonSize];
  }
  
  return PADDING_SIZE_MAPPING[baseSize][buttonSize];
};

/**
 * Get icon size class for a button size based on the selected base semantic size
 */
export const getIconSizeClass = (baseSize: SemanticSize, buttonSize: 'xs' | 'sm' | 'md' | 'lg'): string => {
  // Handle legacy Tailwind class strings (backward compatibility)
  if (typeof baseSize === 'string' && (baseSize.includes('h-') || baseSize.includes('w-'))) {
    return baseSize;
  }
  
  // Handle legacy semantic size values from old format
  if (!(baseSize in ICON_SIZE_MAPPING)) {
    return ICON_SIZE_MAPPING.medium[buttonSize];
  }
  
  return ICON_SIZE_MAPPING[baseSize][buttonSize];
};
