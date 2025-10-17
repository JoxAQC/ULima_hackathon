export type MissionStep = {
  title: string;
  description: string;
};

export type Mission = {
  id: number;
  title: string;
  description: string;
  category: 'Financial' | 'Community' | 'Personal Growth';
  exp: number;
  credits: number;
  financialSavings: number;
  icon: string;
  steps: MissionStep[];
  userSegment: 'Adult' | 'Youth' | 'All';
};

export const missions: Mission[] = [
  {
    id: 1,
    title: 'Start a Savings Jar',
    description: 'A simple way to start saving money for your goals.',
    category: 'Financial',
    exp: 50,
    credits: 10,
    financialSavings: 5,
    icon: 'mission-financial',
    userSegment: 'Youth',
    steps: [
      { title: 'Find a Jar', description: 'Find a clean, empty jar or container. It can be glass or plastic.' },
      { title: 'Decorate It', description: 'Make it your own! Decorate your jar with markers, stickers, or paint.' },
      { title: 'Set a Goal', description: 'Decide what you\'re saving for. A new toy? A gift? Write it on a label.' },
      { title: 'Start Saving', description: 'Put your first coin or bill in the jar. Add to it whenever you can!' },
    ],
  },
  {
    id: 2,
    title: 'Create a Monthly Budget',
    description: 'Take control of your finances by planning your income and expenses.',
    category: 'Financial',
    exp: 100,
    credits: 25,
    financialSavings: 50,
    icon: 'mission-financial',
    userSegment: 'Adult',
    steps: [
      { title: 'List Income', description: 'List all your sources of income for the month.' },
      { title: 'Track Expenses', description: 'For one week, write down everything you spend money on.' },
      { title: 'Categorize Spending', description: 'Group your expenses into categories like "Food", "Transport", and "Entertainment".' },
      { title: 'Set Limits', description: 'Create a budget by setting spending limits for each category.' },
      { title: 'Review and Adjust', description: 'At the end of the month, review your budget and adjust for the next month.' },
    ],
  },
  {
    id: 3,
    title: 'Community Clean-Up',
    description: 'Organize or join a clean-up event in your local area.',
    category: 'Community',
    exp: 75,
    credits: 15,
    financialSavings: 0,
    icon: 'mission-community',
    userSegment: 'All',
    steps: [
      { title: 'Find a Location', description: 'Identify a park, beach, or neighborhood that needs cleaning.' },
      { title: 'Gather Supplies', description: 'Get gloves, trash bags, and any other necessary cleaning tools.' },
      { title: 'Invite Friends', description: 'Teamwork makes it fun! Invite friends or family to join you.' },
      { title: 'Clean Up Safely', description: 'Be mindful of safety. Dont touch sharp objects and wash your hands afterwards.' },
    ],
  },
    {
    id: 4,
    title: 'Learn a New Skill',
    description: 'Challenge yourself by learning something new this week.',
    category: 'Personal Growth',
    exp: 120,
    credits: 30,
    financialSavings: 0,
    icon: 'mission-growth',
    userSegment: 'All',
    steps: [
      { title: 'Choose a Skill', description: 'What do you want to learn? Cooking, coding, a new language?' },
      { title: 'Find Resources', description: 'Look for online tutorials, books, or classes.' },
      { title: 'Practice Daily', description: 'Spend at least 15-30 minutes every day practicing your new skill.' },
      { title: 'Share Your Progress', description: 'Show a friend or family member what you have learned.' },
    ],
  },
];

export type CommunityMember = {
  id: number;
  name: string;
  exp: number;
  avatar: string;
};

export const communityMembers: CommunityMember[] = [
  { id: 1, name: 'Alex', exp: 2450, avatar: 'avatar-1' },
  { id: 2, name: 'Bri', exp: 2100, avatar: 'avatar-2' },
  { id: 3, name: 'Casey', exp: 1850, avatar: 'avatar-3' },
  { id: 4, name: 'Dana', exp: 1500, avatar: 'avatar-4' },
];
