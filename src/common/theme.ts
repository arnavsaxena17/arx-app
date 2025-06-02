export const Theme = {
    colors: {
      primary: '#4285F4',
      secondary: '#34A853',
      background: '#FFFFFF',
      text: '#202124',
      lightGray: '#E8EAED',
      error: '#EA4335',
      success: '#34A853'
    },
    spacing: {
      xs: '4px',
      sm: '8px',
      md: '16px',
      lg: '24px',
      xl: '32px',
      xxl: '48px'
    },
    typography: {
      fontFamily: '"Roboto", sans-serif',
      heading: {
        fontSize: '24px',
        lineHeight: '32px',
        fontWeight: 500
      },
      body: {
        fontSize: '16px',
        lineHeight: '24px',
        fontWeight: 400
      },
      small: {
        fontSize: '14px',
        lineHeight: '20px',
        fontWeight: 400
      }
    },
    borderRadius: {
      sm: '4px',
      md: '8px',
      lg: '16px'
    },
    shadows: {
      sm: '0 1px 2px rgba(0, 0, 0, 0.1)',
      md: '0 2px 4px rgba(0, 0, 0, 0.1)',
      lg: '0 4px 8px rgba(0, 0, 0, 0.1)'
    }
  };
  
  export type ThemeType = typeof Theme;
  
  // Media query helper
  export const mq = {
    small: `@media (min-width: 576px)`,
    medium: `@media (min-width: 768px)`,
    large: `@media (min-width: 992px)`,
    xlarge: `@media (min-width: 1200px)`
  };