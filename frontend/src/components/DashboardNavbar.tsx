import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Bell, ChevronDown, FileText, LogOut, Menu, X } from "lucide-react";
import { useNavigate } from "react-router";
import logo from "../assets/finallogoace.png";
import { getUser, logout } from "../services/auth";

interface DashboardNavbarProps {
  userName?: string;
  userInitials?: string;
  activeTab?: string;
  variant?: "light" | "dark";
  compact?: boolean;
}

export function DashboardNavbar({
  userName,
  userInitials,
  activeTab = "Dashboard",
  variant = "light",
  compact = false,
}: DashboardNavbarProps) {
  const authUser = getUser();
  const resolvedName = userName ?? authUser?.name ?? authUser?.email?.split("@")[0] ?? "User";
  const resolvedInitials = userInitials ?? resolvedName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const dark = variant === "dark";

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const navItems = [
    { label: "Dashboard", path: "/" },
    { label: "Practice Interviews", path: "/roles" },
    { label: "Interviews", path: "/interviews" },
    { label: "Analytics", path: "/analytics" },
  ];

  // Theme-dependent class fragments
  const navBg        = dark ? "bg-white/5 border-white/10"   : "bg-white/60 border-white/40";
  const inactiveBtn  = dark ? "text-gray-300 hover:bg-white/10 hover:text-white"
                            : "text-gray-700 hover:bg-white/50 hover:text-gray-900";
  const iconColor    = dark ? "text-gray-300" : "text-gray-700";
  const iconHover    = dark ? "hover:bg-white/10" : "hover:bg-white/50";
  const profileName  = dark ? "text-white"     : "text-gray-900";
  const chevronColor = dark ? "text-gray-400"  : "text-gray-600";
  const dropdownBg   = dark ? "bg-gray-800/90 border-white/10 backdrop-blur-xl"
                            : "bg-white/80 border-white/60 backdrop-blur-xl";
  const dropdownItem = dark ? "text-gray-300 hover:bg-white/10" : "text-gray-700 hover:bg-blue-50/50";
  const dividerColor = dark ? "border-white/10" : "border-gray-200/50";
  const mobileBorder = dark ? "border-white/10" : "border-white/30";
  const mobileInactive = dark ? "text-gray-300 hover:bg-white/10 hover:text-white"
                               : "text-gray-700 hover:bg-white/50 hover:text-gray-900";

  const py    = compact ? "py-2"   : "py-3";
  const btnPy = compact ? "py-1.5" : "py-2.5";

  return (
    <nav className={`relative z-50 border-b shadow-sm backdrop-blur-xl ${navBg}`}>
      <div className={`mx-auto flex max-w-7xl items-center px-6 ${py} md:px-8`}>
        {/* Logo */}
        <div className="flex shrink-0 items-center">
          <img
            src={logo}
            alt="ACE.AI logo"
            className="h-auto w-[80px] object-contain"
            style={{ transform: "scale(1.5)", transformOrigin: "left center" }}
          />
        </div>

        {/* Right side */}
        <div className="ml-auto flex items-center gap-4 lg:gap-6">
          {/* Nav links */}
          <div className="hidden lg:flex items-center gap-2">
            {navItems.map((item) => (
              <motion.button
                key={item.label}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate(item.path)}
                className={`rounded-xl px-4 ${btnPy} font-medium transition-all ${
                  activeTab === item.label
                    ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md"
                    : inactiveBtn
                }`}
              >
                {item.label}
              </motion.button>
            ))}
          </div>

          {/* Hamburger */}
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.94 }}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className={`rounded-xl p-2.5 transition-all ${iconHover} lg:hidden`}
          >
            {isMobileMenuOpen ? (
              <X className={`h-5 w-5 ${iconColor}`} />
            ) : (
              <Menu className={`h-5 w-5 ${iconColor}`} />
            )}
          </motion.button>

          {/* Bell */}
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.94 }}
            className={`relative rounded-xl p-2.5 transition-all ${iconHover}`}
          >
            <Bell className={`h-5 w-5 ${iconColor}`} />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full border-2 border-white bg-red-500" />
          </motion.button>

          {/* Profile dropdown */}
          <div className="relative" ref={dropdownRef}>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className={`flex items-center gap-3 rounded-xl ${py === "py-2" ? "py-1.5" : "py-2"} pl-2 pr-3 transition-all ${iconHover} lg:pr-4`}
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-purple-500 text-sm font-semibold text-white shadow-sm">
                {resolvedInitials}
              </div>
              <span className={`hidden font-medium sm:block ${profileName}`}>
                {resolvedName}
              </span>
              <motion.div
                animate={{ rotate: isDropdownOpen ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown className={`h-4 w-4 ${chevronColor}`} />
              </motion.div>
            </motion.button>

            <AnimatePresence>
              {isDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className={`absolute right-0 mt-2 w-56 overflow-hidden rounded-2xl border shadow-lg ${dropdownBg}`}
                >
                  <div className="py-2">
                    <button
                      onClick={() => { setIsDropdownOpen(false); navigate("/interviews"); }}
                      className={`flex w-full items-center gap-3 px-4 py-3 transition-all ${dropdownItem}`}
                    >
                      <FileText className="h-4 w-4" />
                      <span className="font-medium">Past Interviews</span>
                    </button>
                    <div className={`my-2 border-t ${dividerColor}`} />
                    <button
                      onClick={() => { setIsDropdownOpen(false); logout(); }}
                      className="flex w-full items-center gap-3 px-4 py-3 text-red-500 transition-all hover:bg-red-500/10"
                    >
                      <LogOut className="h-4 w-4" />
                      <span className="font-medium">Sign Out</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className={`overflow-hidden border-t lg:hidden ${mobileBorder}`}
          >
            <div className="flex flex-col gap-1 px-6 py-3">
              {navItems.map((item) => (
                <motion.button
                  key={item.label}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => { navigate(item.path); setIsMobileMenuOpen(false); }}
                  className={`rounded-xl px-4 py-2.5 text-left font-medium transition-all ${
                    activeTab === item.label
                      ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md"
                      : mobileInactive
                  }`}
                >
                  {item.label}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
