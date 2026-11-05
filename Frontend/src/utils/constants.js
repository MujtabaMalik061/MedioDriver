import SiteLogo from "../assets/images/SiteLogo.png";
import PlaceHolder from "../assets/images/PlaceHolder.webp";
import NotFound from "../assets/images/NotFound.png";

export const IMAGES = {
  SiteLogo,
  PlaceHolder,
  NotFound,
};

export const SideBarMenu = [
  {
    name: "Dashboard",
    icon: "LayoutDashboard",
    route: "/dashboard",
    activeAt: "/dashboard",
  },
  {
    name: "Upload Media",
    icon: "Upload",
    route: "/upload-media",
    activeAt: "/upload-media",
  },
  {
    name: "Media Records",
    icon: "FileText",
    route: "/media-records",
    activeAt: "/media-records",
  },
  {
    name: "Payments",
    icon: "BadgePoundSterling",
    route: "/payments",
    activeAt: "/payments",
    startsWith: ["/payment-success"],
  },
  {
    name: "API Section",
    icon: "Key",
    route: "/api-section",
    activeAt: "/api-section",
  },
  {
    name: "Settings",
    icon: "Settings",
    route: "/settings",
    activeAt: "/settings",
  },
];

export const limit = 20;