/** @type {import('tailwindcss').Config} */
import animate from "tailwindcss-animate";

export default {
  darkMode: ["class"],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'project-black':        '#1A1A1A',
        'project-white':        '#F8F8F6',
        'project-grey':         '#6B6B6B',
        'project-grey-light':   '#E5E5E2',
        'project-grey-muted':   '#A0A09E',
        'project-hover':        '#F2F2EF',
        'project-accent':       '#C9722A',
        'project-red':          '#B83A2E',
        'project-red-light':    '#F5D8D5',
        'project-yellow':       '#E0B23A',
        'project-yellow-light': '#F9EDCC',
        'project-blue':         '#2A5A8C',
        'project-blue-light':   '#D4E3F0',
      },
      borderRadius: {
        none: '0px',
        sm:   '2px',
        md:   '4px',
        lg:   '8px',
      },
      fontSize: {
        xs:   '0.75rem',
        sm:   '0.875rem',
        base: '1rem',
        lg:   '1.125rem',
        xl:   '1.25rem',
      },
      lineHeight: {
        tight:  '1.0',
        normal: '1.2',
        loose:  '1.5',
      },
      fontFamily: {
        garamond: ['"EB Garamond"', 'serif'],
        roman:    ['"Times New Roman"', 'serif'],
      },
      opacity: {
        disabled: '0.4',
        muted:    '0.6',
      },
      width: {
        'sidebar': '13rem',
      },
      maxWidth: {
        'modal-sm': '24rem',
        'modal-md': '28rem',
        'modal-lg': '32rem',
      },
      maxHeight: {
        modal: '90vh',
      },
      zIndex: {
        pin:      '1',
        dropdown: '10',
        modal:    '50',
        toast:    '60',
      },
      keyframes: {
        'cursor-blink': {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0' },
        },
        'cursor-smear': {
          '0%':   { opacity: '1' },
          '100%': { opacity: '0' },
        },
      },
      animation: {
        'cursor-blink': 'cursor-blink 1s step-end infinite',
        'cursor-smear': 'cursor-smear 0.2s ease-out forwards',
      },
    },
  },
  plugins: [animate],
};
