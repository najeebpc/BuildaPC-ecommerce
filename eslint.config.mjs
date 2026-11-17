import js from "@eslint/js";
import globals from "globals";

export default [
  {
    ignores: ["node_modules/**", "coverage/**"]
  },
  js.configs.recommended,
  {
    files: [
      "server.js",
      "config/**/*.js",
      "controllers/**/*.js",
      "services/**/*.js",
      "middlewares/**/*.js",
      "helpers/**/*.js",
      "constants/**/*.js",
      "model/**/*.js",
      "routes/**/*.js"
    ],
    languageOptions: {
      globals: globals.node
    }
  },
  {
    files: ["public/**/*.js"],
    languageOptions: {
      globals: {
        ...globals.browser,
        showToastMessage:'readonly',
        Swal:'readonly',
        Chart:'readonly',
        Razorpay:'readonly',
        Cropper:'readonly',
        Quill:'readonly',
        $:'readonly'
    }
  }
}
];