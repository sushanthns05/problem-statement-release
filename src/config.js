/**
 * ====================================================================
 * EVENT CONFIGURATION (src/config.js)
 * ====================================================================
 * Event: Lakshya 2026 (24-Hour Hackathon)
 * Dates: 5th & 6th November 2026
 * Department: DEPARTMENT OF INFORMATION SCIENCE AND ENGINEERING
 * College: SJB Institute of Technology, Bengaluru
 * ====================================================================
 */

export const CONFIG = {
  // Hackathon Branding
  eventName: "Lakshya 2026",
  eventEdition: "Silver Jubilee Edition",
  dates: "5th & 6th November 2026",
  tagline: "24-Hour National Level Hackathon",
  subtitle: "24 Hours of Non-Stop Innovation, Coding & Problem Solving",

  // Institution & Department (as requested: only logos and department text at top)
  departmentName: "DEPARTMENT OF INFORMATION SCIENCE AND ENGINEERING",
  collegeName: "SJB Institute of Technology",
  location: "Bengaluru, Karnataka",

  // Official Institutional Logos
  logos: {
    silverJubilee: "/assets/sjbit-silver-jubilee-logo-clean.png",
    sjbitLogo: "/assets/sjbit-logo-clean.png",
    deptLogo: "/assets/ise-dept-logo-clean.png",
  },

  // Hackathon duration in hours
  durationHours: 24,

  // Milestones during the 24-Hour Hackathon
  milestones: [
    {
      hours: "00:00 - 04:00",
      title: "Kickoff & Architecture",
      desc: "Problem formulation, tech stack setup & wireframing",
      badge: "PHASE 1",
    },
    {
      hours: "04:00 - 12:00",
      title: "First Mentorship & Review",
      desc: "Core feature engineering, API integrations & mentor checkpoints",
      badge: "PHASE 2",
    },
    {
      hours: "12:00 - 20:00",
      title: "Midnight Sprint & Review 2",
      desc: "Deep implementation, debugging, test harness & mentor feedback",
      badge: "PHASE 3",
    },
    {
      hours: "20:00 - 24:00",
      title: "Code Freeze & Grand Jury Pitch",
      desc: "Deployment, final commit freeze, live demos & evaluation",
      badge: "FINALE",
    },
  ],
};
