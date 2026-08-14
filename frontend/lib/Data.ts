export type Tutor = {
  id: string;
  name: string;
  university: string;
  initials: string;
  subjects: { name: string; grade: string }[];
  rate: number;
  rating: number;
  sessionsTaught: number;
};

export const tutors: Tutor[] = [
  {
    id: "t1",
    name: "Ayesha Raza",
    university: "NUST",
    initials: "AR",
    subjects: [
      { name: "A-Level Physics", grade: "A*" },
      { name: "A-Level Maths", grade: "A*" },
    ],
    rate: 1200,
    rating: 4.9,
    sessionsTaught: 214,
  },
  {
    id: "t2",
    name: "Hamza Iqbal",
    university: "FAST-NUCES",
    initials: "HI",
    subjects: [
      { name: "O-Level Computer Science", grade: "A*" },
      { name: "A-Level Chemistry", grade: "A" },
    ],
    rate: 950,
    rating: 4.8,
    sessionsTaught: 176,
  },
  {
    id: "t3",
    name: "Zara Malik",
    university: "LUMS",
    initials: "ZM",
    subjects: [
      { name: "A-Level Economics", grade: "A*" },
      { name: "O-Level Business", grade: "A*" },
    ],
    rate: 1400,
    rating: 5.0,
    sessionsTaught: 301,
  },
];

export const faqs = [
  {
    q: "How does the free demo actually work?",
    a: "Pick any tutor and book a 15-minute demo class at no cost. You get a feel for their teaching style, accent, and pace before a single rupee changes hands. If it's not a fit, book another tutor — demos are free every time.",
  },
  {
    q: "How are tutors verified on Parho?",
    a: "Every tutor submits their academic transcript, which we run through an automated verification check against issuing institutions. We also confirm identity and, where applicable, prior teaching background before a profile goes live.",
  },
  {
    q: "What happens if a tutor misses a class?",
    a: "Your payment for that hour was already held in escrow, not with the tutor. If a tutor no-shows without rescheduling, the full amount is refunded to your wallet automatically — no support ticket required.",
  },
  {
    q: "How do payments actually work in Pakistan?",
    a: "You top up your Parho wallet and pay per hour of class booked. Funds sit in escrow until the session is marked complete by both sides, then release to the tutor. Tutors withdraw instantly via JazzCash, EasyPaisa, or Raast.",
  },
];
