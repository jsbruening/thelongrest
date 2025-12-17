import type { Config } from "tailwindcss";
import daisyui from "daisyui";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [daisyui],
  daisyui: {
    themes: [
      {
        light: {
          primary: "#0F172A", // Navy 900
          secondary: "#38BDF8", // Electric Blue
          accent: "#38BDF8",
          neutral: "#94A3B8",
          "base-100": "#F8FAFC", // Off-White
          "base-200": "#FFFFFF",
          "base-300": "#E2E8F0",
          "base-content": "#0F172A", // Navy 900 for text
          info: "#38BDF8",
          success: "#10B981",
          warning: "#F59E0B",
          error: "#EF4444",
        },
      },
    ],
    darkTheme: false,
    base: true,
    styled: true,
    utils: true,
  },
};

export default config;
