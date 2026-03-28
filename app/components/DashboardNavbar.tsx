import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Bell, ChevronDown, User, Settings, FileText, LogOut } from "lucide-react";
import { useNavigate } from "react-router";
// @ts-ignore: allow importing image asset without a module declaration
import logo from "../../assets/finallogoace.png";
interface DashboardNavbarProps {
  userName?: string;
  userInitials?: string;
  activeTab?: string;
}

export function DashboardNavbar({
  userName = "Lorenna",
  userInitials = "LK",
  activeTab = "Dashboard"
}: DashboardNavbarProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
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
    { label: "Flashcards", path: "/flashcards" },
  ];

  return (
    <nav className="relative z-50 backdrop-blur-xl bg-white/60 border-b border-white/40 shadow-sm">
      <div className="max-w-7xl mx-auto px-8 py-4">
        <div className="flex items-center justify-between">
          {/* Left Side - Logo */}
          <div className="flex items-center">
            <img src={logo} alt="ACE.AI logo" className="h-8 w-auto" />
          </div>

          {/* Center - Navigation Links */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <motion.button
                key={item.label}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate(item.path)}
                className={`px-5 py-2.5 rounded-xl font-medium transition-all ${
                  activeTab === item.label
                    ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md"
                    : "text-gray-700 hover:bg-white/50 hover:text-gray-900"
                }`}
              >
                {item.label}
              </motion.button>
            ))}
          </div>

          {/* Right Side - Notifications & Profile */}
          <div className="flex items-center gap-4">
            {/* Notification Bell */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="relative p-2.5 rounded-xl hover:bg-white/50 transition-all"
            >
              <Bell className="w-5 h-5 text-gray-700" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
            </motion.button>

            {/* User Profile Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-3 pl-2 pr-4 py-2 rounded-xl hover:bg-white/50 transition-all"
              >
                {/* Avatar */}
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold text-sm shadow-sm">
                  {userInitials}
                </div>

                {/* Name */}
                <span className="hidden sm:block font-medium text-gray-900">{userName}</span>

                {/* Dropdown Icon */}
                <motion.div
                  animate={{ rotate: isDropdownOpen ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown className="w-4 h-4 text-gray-600" />
                </motion.div>
              </motion.button>

              {/* Dropdown Menu */}
              <AnimatePresence>
                {isDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 mt-2 w-56 backdrop-blur-xl bg-white/80 border border-white/60 rounded-2xl shadow-lg overflow-hidden"
                  >
                    <div className="py-2">
                      {/* View Profile */}
                      <button
                        onClick={() => {
                          setIsDropdownOpen(false);
                          navigate("/profile");
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-blue-50/50 transition-all"
                      >
                        <User className="w-4 h-4" />
                        <span className="font-medium">View Profile</span>
                      </button>

                      {/* Settings */}
                      <button
                        onClick={() => {
                          setIsDropdownOpen(false);
                          navigate("/settings");
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-blue-50/50 transition-all"
                      >
                        <Settings className="w-4 h-4" />
                        <span className="font-medium">Settings</span>
                      </button>

                      {/* Past Interviews */}
                      <button
                        onClick={() => {
                          setIsDropdownOpen(false);
                          navigate("/analytics");
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-blue-50/50 transition-all"
                      >
                        <FileText className="w-4 h-4" />
                        <span className="font-medium">Past Interviews</span>
                      </button>

                      {/* Divider */}
                      <div className="my-2 border-t border-gray-200/50" />

                      {/* Sign Out */}
                      <button
                        onClick={() => {
                          setIsDropdownOpen(false);
                          navigate("/");
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50/50 transition-all"
                      >
                        <LogOut className="w-4 h-4" />
                        <span className="font-medium">Sign Out</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
