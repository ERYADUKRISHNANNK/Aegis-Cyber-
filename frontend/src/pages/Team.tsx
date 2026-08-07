import React from "react";
import { motion } from "framer-motion";
import {
  ArrowDown,
  Award,
  BrainCircuit,
  Code2,
  Database,
  Fingerprint,
  GraduationCap,
  Layers3,
  Network,
  ShieldCheck,
  Sparkles,
  UserRound,
  UsersRound,
  Zap
} from "lucide-react";

const teamMembers = [
  {
    name: "YADUKRISHNAN N K",
    role: "Team Leader & Full-Stack Lead",
    initials: "YN",
    icon: Code2,
    leader: true,
    description:
      "Leads the overall project development, system architecture, full-stack implementation, team coordination, integration, testing, and technical decision-making."
  },
  {
    name: "MOHAMED SHAHAL",
    role: "Backend & API Developer",
    initials: "MS",
    icon: Database,
    description:
      "Responsible for backend development, API implementation, database integration, server-side logic, authentication, and reliable communication between the application's components."
  },
  {
    name: "MOHAMMED NABEEL",
    role: "AI/ML & Data Engineer",
    initials: "MN",
    icon: BrainCircuit,
    description:
      "Works on data processing, AI/ML-related components, intelligent functionality, model integration, testing, and evaluation of data-driven features within the project."
  },
  {
    name: "MUHAMMED HAFIS",
    role: "UI/UX & Frontend Developer",
    initials: "MH",
    icon: Layers3,
    description:
      "Responsible for designing and implementing the user interface, responsive frontend components, usability, visual consistency, and overall user experience of the application."
  }
];

const technologyPillars = [
  { label: "Security analysis", detail: "Malware, PII, entropy & steganography checks", icon: ShieldCheck },
  { label: "Zero Trust gateway", detail: "Role, behavior and session-aware access controls", icon: Fingerprint },
  { label: "Secure file flow", detail: "AES-GCM encryption with RSA key wrapping", icon: Network },
  { label: "Integrity & audit", detail: "IPFS storage and EVM-backed file records", icon: Award }
];

const sectionTransition = {
  duration: 0.48,
  ease: [0.22, 1, 0.36, 1]
} as const;

const Team: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={sectionTransition}
      className="mx-auto max-w-7xl space-y-14 pb-8"
    >
      <section className="relative overflow-hidden rounded-[2rem] border border-cyber-violet/25 bg-[#080811]/85 px-6 py-8 shadow-[0_26px_100px_rgba(0,0,0,0.3)] sm:px-9 sm:py-10 lg:px-12 lg:py-12">
        <div className="pointer-events-none absolute -right-24 -top-28 h-72 w-72 rounded-full bg-cyber-violet/20 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-1/3 h-40 w-80 rounded-full bg-cyber-cyan/10 blur-3xl" />
        <div className="relative grid gap-8 lg:grid-cols-[1.3fr_0.7fr] lg:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-cyber-cyan/25 bg-cyber-cyan/10 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.26em] text-cyber-cyan">
              <Sparkles className="h-3.5 w-3.5" />
              Project profile
            </div>
            <h1 className="mt-5 text-3xl font-bold leading-tight text-white font-cyber sm:text-4xl lg:text-5xl">About Aegis Cyber</h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-[15px]">
              A unified security workspace for protected file sharing, intelligent risk analysis and verifiable digital trust.
            </p>
          </div>

          <nav aria-label="About page sections" className="flex flex-wrap gap-2 lg:justify-end">
            {[
              ["Project", "#about-project"],
              ["Team", "#meet-the-team"],
              ["Guide", "#project-guide"],
              ["Vision", "#our-vision"]
            ].map(([label, target]) => (
              <a
                key={label}
                href={target}
                className="rounded-full border border-slate-700/70 bg-[#05040d]/70 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-300 transition hover:border-cyber-cyan/50 hover:text-cyber-cyan"
              >
                {label}
              </a>
            ))}
          </nav>
        </div>
      </section>

      <section id="about-project" className="scroll-mt-6 space-y-6">
        <SectionIntro eyebrow="01 / The platform" title="About the Project" icon={ShieldCheck} />
        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <motion.article
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={sectionTransition}
            className="glass-panel rounded-[2rem] border border-slate-800/80 p-6 sm:p-8"
          >
            <p className="text-[15px] leading-8 text-slate-300 sm:text-base">
              Aegis Cyber is a secure decentralized file-sharing and cyber-defense platform that protects sensitive files and gives operators a single SOC workspace for security oversight. It addresses the risk that files in ordinary sharing workflows can be exposed, tampered with, or distributed without clear access control—an important concern for teams handling confidential data. The platform combines a React and TypeScript dashboard with an Express gateway, FastAPI security services, and IPFS and EVM integrations to analyze uploaded content for malware, PII, entropy, and steganography signals; encrypt files with AES-GCM and RSA key wrapping; apply Zero Trust access checks; and record integrity and permission data. By bringing scanning, encryption, audit visibility, and decentralized integrity records into one flow, Aegis Cyber helps teams share data more safely while retaining traceability. Its distinct value is the practical combination of SOC-focused defense and decentralized file governance in a single product experience.
            </p>
          </motion.article>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            {technologyPillars.map((pillar, index) => {
              const Icon = pillar.icon;
              return (
                <motion.div
                  key={pillar.label}
                  initial={{ opacity: 0, x: 14 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0.25 }}
                  transition={{ ...sectionTransition, delay: index * 0.07 }}
                  whileHover={{ y: -3 }}
                  className="group flex gap-4 rounded-3xl border border-slate-800/80 bg-[#080811]/75 p-4 transition-colors hover:border-cyber-cyan/35"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-cyber-cyan/20 bg-cyber-cyan/10 text-cyber-cyan transition group-hover:shadow-cyan">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-white">{pillar.label}</h3>
                    <p className="mt-1 text-xs leading-5 text-slate-400">{pillar.detail}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.72fr_1.28fr] lg:items-stretch">
        <div className="rounded-[2rem] border border-cyber-violet/25 bg-gradient-to-br from-cyber-violet/15 via-[#0b0915] to-[#080811] p-7 sm:p-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyber-violet/30 bg-cyber-violet/15 text-cyber-violet shadow-cyber">
            <Zap className="h-5 w-5" />
          </div>
          <p className="mt-6 text-[10px] font-bold uppercase tracking-[0.28em] text-cyber-cyan">02 / Purpose</p>
          <h2 className="mt-3 text-2xl font-bold text-white font-cyber">Why We Built It</h2>
        </div>
        <motion.article
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={sectionTransition}
          className="glass-panel rounded-[2rem] border border-slate-800/80 p-7 sm:p-8"
        >
          <p className="text-[15px] leading-8 text-slate-300 sm:text-base">
            We built Aegis Cyber around a practical need: file protection is most useful when the same workflow can help people identify risky content, protect the file, control access, and understand the decision afterward. The project brings these connected security concerns into one experience, making advanced concepts such as encryption, behavioral checks, audit trails, and decentralized integrity records easier to demonstrate and use together in a real-world file-sharing context.
          </p>
        </motion.article>
      </section>

      <section id="meet-the-team" className="scroll-mt-6 space-y-6">
        <SectionIntro eyebrow="03 / The people" title="Meet the Team" icon={UsersRound} />
        <p className="max-w-3xl text-sm leading-7 text-slate-400">
          A focused multidisciplinary team bringing application engineering, backend systems, intelligent data features, and product experience together.
        </p>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {teamMembers.map((member, index) => {
            const Icon = member.icon;
            return (
              <motion.article
                key={member.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{ ...sectionTransition, delay: index * 0.08 }}
                whileHover={{ y: -6 }}
                className={`group relative min-h-[320px] overflow-hidden rounded-[1.8rem] border p-6 transition-colors ${
                  member.leader
                    ? "border-cyber-cyan/45 bg-gradient-to-b from-cyber-cyan/10 via-[#090916] to-[#080811] shadow-[0_18px_60px_rgba(6,182,212,0.12)]"
                    : "border-slate-800/80 bg-[#080811]/80 hover:border-cyber-violet/45"
                }`}
              >
                <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-cyber-violet/15 blur-3xl transition group-hover:bg-cyber-cyan/15" />
                <div className="relative flex items-start justify-between gap-3">
                  <div className={`flex h-14 w-14 items-center justify-center rounded-2xl border text-sm font-bold font-cyber ${member.leader ? "border-cyber-cyan/35 bg-cyber-cyan/15 text-cyber-cyan" : "border-cyber-violet/30 bg-cyber-violet/15 text-cyber-violet"}`}>
                    {member.initials}
                  </div>
                  {member.leader ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-cyber-cyan/35 bg-cyber-cyan/15 px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.16em] text-cyber-cyan">
                      <Award className="h-3 w-3" /> Team Leader
                    </span>
                  ) : (
                    <Icon className="mt-1 h-5 w-5 text-slate-600 transition group-hover:text-cyber-violet" />
                  )}
                </div>

                <div className="relative mt-7">
                  <h3 className="text-base font-bold leading-6 text-white font-cyber">{member.name}</h3>
                  <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.15em] text-cyber-cyan">{member.role}</p>
                  <p className="mt-5 text-sm leading-6 text-slate-400">{member.description}</p>
                </div>
              </motion.article>
            );
          })}
        </div>
      </section>

      <section id="project-guide" className="scroll-mt-6 space-y-6">
        <SectionIntro eyebrow="04 / Academic mentorship" title="Under the Guidance of" icon={GraduationCap} />
        <motion.article
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={sectionTransition}
          whileHover={{ y: -4 }}
          className="relative overflow-hidden rounded-[2rem] border border-cyber-gold/35 bg-gradient-to-br from-cyber-gold/10 via-[#110d0b] to-[#080811] p-7 shadow-[0_24px_80px_rgba(245,158,11,0.1)] sm:p-9"
        >
          <div className="pointer-events-none absolute right-0 top-0 h-64 w-64 rounded-full bg-cyber-gold/15 blur-3xl" />
          <div className="relative grid gap-7 md:grid-cols-[auto_1fr] md:items-center">
            <div className="flex h-24 w-24 items-center justify-center rounded-[1.8rem] border border-cyber-gold/35 bg-cyber-gold/15 text-cyber-gold shadow-[0_0_35px_rgba(245,158,11,0.18)]">
              <GraduationCap className="h-10 w-10" />
            </div>
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-cyber-gold/35 bg-cyber-gold/10 px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.2em] text-cyber-gold">
                <Sparkles className="h-3.5 w-3.5" /> Faculty Mentor
              </span>
              <h3 className="mt-4 text-2xl font-bold text-white font-cyber sm:text-3xl">DR. SAJAY K R</h3>
              <p className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-cyber-gold">Project Guide / Faculty Mentor</p>
              <p className="mt-5 max-w-3xl text-[15px] leading-7 text-slate-300">
                Provides academic guidance, technical mentorship, project direction, and valuable feedback throughout the development and refinement of the project.
              </p>
            </div>
          </div>
        </motion.article>
      </section>

      <section id="our-vision" className="scroll-mt-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.985 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={sectionTransition}
          className="relative overflow-hidden rounded-[2rem] border border-cyber-pink/25 bg-[#080811]/85 px-7 py-11 text-center shadow-[0_20px_80px_rgba(0,0,0,0.25)] sm:px-12"
        >
          <div className="pointer-events-none absolute left-1/2 top-0 h-44 w-[36rem] -translate-x-1/2 rounded-full bg-cyber-pink/10 blur-3xl" />
          <div className="relative mx-auto max-w-3xl">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-cyber-pink/30 bg-cyber-pink/10 text-cyber-pink">
              <UserRound className="h-5 w-5" />
            </div>
            <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.28em] text-cyber-pink">05 / Looking forward</p>
            <h2 className="mt-3 text-2xl font-bold text-white font-cyber sm:text-3xl">Our Vision</h2>
            <p className="mt-5 text-[15px] leading-8 text-slate-300">
              Our vision is to make practical security technology easier to understand, integrate, and apply to meaningful real-world problems. Through innovation, collaboration, and thoughtful engineering, Aegis Cyber demonstrates how a multidisciplinary team can turn complex security concepts into a focused product experience that supports safer digital collaboration.
            </p>
            <a href="#about-project" className="mt-7 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-cyber-cyan transition hover:text-white">
              Back to project overview <ArrowDown className="h-4 w-4 rotate-180" />
            </a>
          </div>
        </motion.div>
      </section>
    </motion.div>
  );
};

const SectionIntro: React.FC<{
  eyebrow: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
}> = ({ eyebrow, title, icon: Icon }) => (
  <div className="flex items-end justify-between gap-4">
    <div>
      <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-slate-500">{eyebrow}</p>
      <h2 className="mt-2 text-2xl font-bold text-white font-cyber sm:text-3xl">{title}</h2>
    </div>
    <div className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-cyber-violet/25 bg-cyber-violet/10 text-cyber-violet sm:flex">
      <Icon className="h-5 w-5" />
    </div>
  </div>
);

export default Team;
