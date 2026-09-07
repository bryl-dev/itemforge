export const sampleSource = {
  title: 'CPSC 210 — Abstraction and Specification',
  courseCode: 'CPSC 210',
  content: [
    'An abstract data type (ADT) hides representation so clients depend only on a specification.',
    'A representation invariant (RI) is a condition that is true of every well-formed instance.',
    'An abstraction function (AF) maps a concrete representation to the abstract value it stands for.',
    'Testing against the specification, not the representation, keeps tests valid after a rewrite.',
  ].join(' '),
};

export const sampleChoices = [
  {
    label: 'A',
    content: 'A condition true of every well-formed instance of the representation',
    isCorrect: true,
    rationale: null as string | null,
    ordinal: 0,
  },
  {
    label: 'B',
    content: 'A mapping from concrete representation to abstract value',
    isCorrect: false,
    rationale: 'That is the abstraction function, not the RI.',
    ordinal: 1,
  },
  {
    label: 'C',
    content: 'A list of methods the client is allowed to call',
    isCorrect: false,
    rationale: 'That is the ADT interface, not the RI.',
    ordinal: 2,
  },
  {
    label: 'D',
    content: 'A proof that the implementation terminates',
    isCorrect: false,
    rationale: 'Termination is a separate liveness property.',
    ordinal: 3,
  },
];
