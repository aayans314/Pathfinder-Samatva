/**
 * Demo data for the Like-Minded Groups page (hackathon / empty-network UX).
 */
export interface LikeMindedGroupDummy {
  id: string;
  topic: string;
  description: string;
  memberCount: number;
  memberNames: string[];
  tag: string;
}

export const LIKE_MINDED_GROUPS_DUMMY: LikeMindedGroupDummy[] = [
  {
    id: "g1",
    topic: "Secure H-1B Sponsorship",
    description:
      "Weekly check-ins on sponsors, lottery prep, and offer negotiation with others on the same timeline.",
    memberCount: 8,
    memberNames: ["Aayan Shah", "Shreejay Subedi", "Abhishek Rana", "Priya M."],
    tag: "Goal Circle",
  },
  {
    id: "g2",
    topic: "Build Professional Network in Tech",
    description:
      "Share intros, conference plans, and coffee-chat scripts. Light accountability on outreach goals.",
    memberCount: 12,
    memberNames: ["Abiral Rijal", "Nisha Gurung", "Elena Park", "Marcus T."],
    tag: "Networking",
  },
  {
    id: "g3",
    topic: "Publish ML Research Paper",
    description:
      "For grad students targeting venues like NeurIPS / ICML — reviews, deadlines, and writing sprints.",
    memberCount: 5,
    memberNames: ["Abiral Rijal", "Nisha Gurung", "Dr. Kim L."],
    tag: "Research",
  },
  {
    id: "g4",
    topic: "Land SWE Internship at Top Tech",
    description:
      "LeetCode streaks, mock interviews, and referral swaps. New grads and career switchers welcome.",
    memberCount: 15,
    memberNames: ["Pratik KC", "Aayan Shah", "Jordan W.", "Samira A.", "Chris P."],
    tag: "Internships",
  },
  {
    id: "g5",
    topic: "Run a Half Marathon",
    description:
      "Training blocks, injury prevention, and race-day tips — keep each other moving.",
    memberCount: 6,
    memberNames: ["Shreejay Subedi", "Elena Park", "Alex R."],
    tag: "Fitness",
  },
  {
    id: "g6",
    topic: "Startup MVP & Side Projects",
    description:
      "Ship small, get feedback, and share stack choices. Good for indie hackers and PMs building nights/weekends.",
    memberCount: 9,
    memberNames: ["Elena Park", "Pratik KC", "Riley N.", "Taylor S."],
    tag: "Career",
  },
];
