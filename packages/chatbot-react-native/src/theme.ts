export type Theme = {
  background: string;
  foreground: string;
  border: string;
  primary: string;
  primaryForeground: string;
  mutedForeground: string;
  accent: string;
  messageIcon: string;
  destructive: string;
};

export const lightTheme: Theme = {
  background: '#ffffff',
  foreground: '#0a0a0b',
  border: '#e5e5e5',
  primary: '#1a1a1c',
  primaryForeground: '#fafafa',
  mutedForeground: '#737380',
  accent: '#f4f4f5',
  messageIcon: '#fafafa',
  destructive: '#ef4444',
};

export const darkTheme: Theme = {
  background: '#0a0a0b',
  foreground: '#fafafa',
  border: '#28282d',
  primary: '#fafafa',
  primaryForeground: '#1a1a1c',
  mutedForeground: '#a1a1aa',
  accent: '#28282d',
  messageIcon: '#1a1a1c',
  destructive: '#ef4444',
};

export const mergeTheme = (base: Theme, override?: Partial<Theme>): Theme => ({
  ...base,
  ...(override ?? {}),
});
