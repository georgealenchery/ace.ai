import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Bell, ChevronDown, User, Settings, FileText, LogOut } from "lucide-react";
import { useNavigate } from "react-router";
import logo from "../assets/finallogoace.png";

interface DashboardNavbarProps {
  userName?: string;
  userInitials?: string;
  activeTab?: string;
}

export function DashboardNavbar({
  userName = "Lorenna",
  userInitials = "LK",
  activeTab = "Dashboard",
}: DashboardNavbarProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

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
    { label: "Analytics", path: "/analytics" },
  ];

  return (
    <nav className="relative z-50 border-b border-white/40 bg-white/60 shadow-sm backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center px-6 py-3 md:px-8">
        {/* Left: Logo */}
        <div className="flex shrink-0 items-center">
          <img
            src={logo}
            alt="ACE.AI logo"
            className="w-[80px] md:w-[90px] h-auto object-contain"
            style={{ transform: "scale(2.35)", transformOrigin: "left center" }}
          />
        </div>

        {/* Right side wrapper */}
        <div className="ml-auto flex items-center gap-4 md:gap-6">
          {/* Nav links */}
          <div className="hidden md:flex items-center gap-2">
            {navItems.map((item) => (
              <motion.button
                key={item.label}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate(item.path)}
                className={`rounded-xl px-4 py-2.5 font-medium transition-all ${
                  activeTab === item.label
                    ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md"
                    : "text-gray-700 hover:bg-white/50 hover:text-gray-900"
                }`}
              >
                {item.label}
              </motion.button>
            ))}
          </div>

          {/* Notification bell */}
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.94 }}
            className="relative rounded-xl p-2.5 transition-all hover:bg-white/50"
          >
            <Bell className="h-5 w-5 text-gray-700" />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full border-2 border-white bg-red-500" />
          </motion.button>

          {/* Profile dropdown */}
          <div className="relative" ref={dropdownRef}>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-3 rounded-xl py-2 pl-2 pr-3 transition-all hover:bg-white/50 md:pr-4"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-purple-500 text-sm font-semibold text-white shadow-sm">
                {userInitials}
              </div>

              <span className="hidden font-medium text-gray-900 sm:block">
                {userName}
              </span>

              <motion.div
                animate={{ rotate: isDropdownOpen ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown className="h-4 w-4 text-gray-600" />
              </motion.div>
            </motion.button>

            <AnimatePresence>
              {isDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 mt-2 w-56 overflow-hidden rounded-2xl border border-white/60 bg-white/80 shadow-lg backdrop-blur-xl"
                >
                  <div className="py-2">
                    <button
                      onClick={() => {
                        setIsDropdownOpen(false);
                        navigate("/profile");
                      }}
                      className="flex w-full items-center gap-3 px-4 py-3 text-gray-700 transition-all hover:bg-blue-50/50"
                    >
                      <User className="h-4 w-4" />
                      <span className="font-medium">View Profile</span>
                    </button>

                    <button
                      onClick={() => {
                        setIsDropdownOpen(false);
                        navigate("/settings");
                      }}
                      className="flex w-full items-center gap-3 px-4 py-3 text-gray-700 transition-all hover:bg-blue-50/50"
                    >
                      <Settings className="h-4 w-4" />
                      <span className="font-medium">Settings</span>
                    </button>

                    <button
                      onClick={() => {
                        setIsDropdownOpen(false);
                        navigate("/analytics");
                      }}
                      className="flex w-full items-center gap-3 px-4 py-3 text-gray-700 transition-all hover:bg-blue-50/50"
                    >
                      <FileText className="h-4 w-4" />
                      <span className="font-medium">Past Interviews</span>
                    </button>

                    <div className="my-2 border-t border-gray-200/50" />

                    <button
                      onClick={() => {
                        setIsDropdownOpen(false);
                        navigate("/");
                      }}
                      className="flex w-full items-center gap-3 px-4 py-3 text-red-600 transition-all hover:bg-red-50/50"
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
    </nav>
  );
}

