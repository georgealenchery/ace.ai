import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { Code, Database, Brain, Shield, Smartphone, Globe, Cloud, Cpu } from "lucide-react";

const roles = [
  {
    id: "frontend",
    title: "Frontend Engineer",
    description: "Build beautiful, responsive user interfaces with React, Vue, or Angular",
    icon: Globe,
  },
  {
    id: "backend",
    title: "Backend Engineer",
    description: "Design scalable server architectures and APIs with Node.js, Python, or Java",
    icon: Database,
  },
  {
    id: "fullstack",
    title: "Full-Stack Engineer",
    description: "Master both frontend and backend development across the entire stack",
    icon: Code,
  },
  {
    id: "ml",
    title: "Machine Learning Engineer",
    description: "Build intelligent systems with deep learning, NLP, and computer vision",
    icon: Brain,
  },
  {
    id: "mobile",
    title: "Mobile Developer",
    description: "Create native iOS and Android apps or cross-platform solutions",
    icon: Smartphone,
  },
  {
    id: "devops",
    title: "DevOps Engineer",
    description: "Streamline deployment pipelines, CI/CD, and cloud infrastructure",
    icon: Cloud,
  },
  {
    id: "security",
    title: "Cybersecurity Engineer",
    description: "Protect systems from threats with penetration testing and security protocols",
    icon: Shield,
  },
  {
    id: "systems",
    title: "Systems Engineer",
    description: "Optimize low-level performance with C++, Rust, and distributed systems",
    icon: Cpu,
  },
];

export function RoleSelection() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100 py-12 px-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Explore Software Engineering Roles
          </h1>
          <p className="text-xl text-gray-600">
            Choose a role to start your interview preparation
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6">
          {roles.map((role, index) => {
            const Icon = role.icon;
            return (
              <motion.div
                key={role.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ y: -8, scale: 1.02 }}
                onClick={() => navigate(`/setup?role=${role.id}`)}
                className="backdrop-blur-lg bg-white/40 rounded-2xl p-6 border border-white/50 shadow-lg hover:shadow-2xl transition-all cursor-pointer group"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl group-hover:scale-110 transition-transform">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {role.title}
                    </h3>
                    <p className="text-gray-600">
                      {role.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
