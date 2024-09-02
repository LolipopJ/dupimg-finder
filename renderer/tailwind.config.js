module.exports = {
  content: [
    "./renderer/pages/**/*.{js,ts,jsx,tsx}",
    "./renderer/components/**/*.{js,ts,jsx,tsx}",
  ],
  safelist: [
    // #region Resolve react-transition-group styles
    {
      pattern: /^.+-enter(-active|-done)?$/,
    },
    {
      pattern: /^.+-appear(-active|-done)?$/,
    },
    {
      pattern: /^.+-exit(-active|-done)?$/,
    },
    // #endregion
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
