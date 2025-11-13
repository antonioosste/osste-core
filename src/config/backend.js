let BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const hostname = window.location.hostname;

if (hostname.includes("preview--")) {
  BACKEND_URL = "https://api-preprod.osste.com";
} else {
  BACKEND_URL = "https://osste-backend-git-main-antha-osstes-projects.vercel.app";
}

export { BACKEND_URL };
