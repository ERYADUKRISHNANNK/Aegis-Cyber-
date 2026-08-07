import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Mail, Phone, Activity, Star, Award, ShieldAlert } from 'lucide-react';

const teamMembers = [
  {
    id: 1,
    name: "Alex Vance",
    role: "Lead Incident Responder",
    clearance: "Level 5 - Top Secret",
    status: "Active",
    avatar: "A",
    skills: ["Malware Analysis", "Forensics", "Reverse Engineering"],
    contact: "alex.v@aegis.local"
  },
  {
    id: 2,
    name: "Sarah Chen",
    role: "Threat Intelligence Analyst",
    clearance: "Level 4 - Secret",
    status: "On Mission",
    avatar: "S",
    skills: ["OSINT", "Threat Hunting", "Dark Web Analysis"],
    contact: "s.chen@aegis.local"
  },
  {
    id: 3,
    name: "Marcus Thorne",
    role: "Blockchain Security Engineer",
    clearance: "Level 5 - Top Secret",
    status: "Active",
    avatar: "M",
    skills: ["Smart Contracts", "Cryptography", "DeFi Sec"],
    contact: "m.thorne@aegis.local"
  },
  {
    id: 4,
    name: "Elena Rostova",
    role: "AI/ML Systems Architect",
    clearance: "Level 4 - Secret",
    status: "Offline",
    avatar: "E",
    skills: ["Behavioral Analytics", "Model Security", "Python"],
    contact: "e.rostova@aegis.local"
  }
];

const Team: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-cyber text-white">Professional Team</h1>
          <p className="text-sm text-slate-400">Manage and monitor Aegis Nexus personnel and security clearances.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {teamMembers.map((member, idx) => (
          <motion.div
            key={member.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="group relative rounded-3xl bg-[#080811]/80 border border-slate-800/80 p-6 overflow-hidden hover:border-cyber-cyan/50 transition-all duration-300 shadow-[inset_0_0_20px_rgba(0,0,0,0.2)]"
          >
            <div className="absolute top-0 right-0 h-32 w-32 bg-cyber-violet/5 blur-[50px] pointer-events-none rounded-full" />
            
            <div className="flex justify-between items-start mb-6">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-cyber-violet/15 text-cyber-cyan text-2xl font-bold font-cyber border border-cyber-cyan/20">
                {member.avatar}
              </div>
              <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                member.status === 'Active' ? 'bg-cyber-neonGreen/10 text-cyber-neonGreen border border-cyber-neonGreen/20' : 
                member.status === 'On Mission' ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20' : 
                'bg-slate-500/10 text-slate-400 border border-slate-500/20'
              }`}>
                {member.status}
              </div>
            </div>

            <div className="space-y-1 mb-6">
              <h3 className="text-lg font-bold text-white font-cyber truncate">{member.name}</h3>
              <p className="text-xs text-cyber-cyan font-semibold uppercase tracking-wider">{member.role}</p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <ShieldCheck className="h-4 w-4 text-cyber-violet" />
                <span>{member.clearance}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <Mail className="h-4 w-4 text-slate-500" />
                <span>{member.contact}</span>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-slate-800/60">
              <p className="text-[10px] uppercase text-slate-500 tracking-wider mb-3">Specializations</p>
              <div className="flex flex-wrap gap-2">
                {member.skills.map(skill => (
                  <span key={skill} className="px-2 py-1 rounded-md bg-slate-900/80 border border-slate-800 text-[10px] text-slate-300">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default Team;
