// Copy for the first-run tour: the welcome cards, then one tip per feature,
// shown the first time its screen opens.

export const WELCOME = [
  {
    key: 'log',
    icon: 'add',
    color: 'ivory',
    title: 'Log in seconds',
    text: 'The + button logs food, water, weight or a workout from anywhere. Indian food, measured the Indian way: katori, roti, glass.',
  },
  {
    key: 'streak',
    icon: 'flame',
    color: 'kcal',
    title: 'Keep the streak alive',
    text: "Log something every day. Miss one day and your streak freezes; do extra push-ups or pull-ups to thaw it. Miss two and it's gone.",
  },
  {
    key: 'evolve',
    icon: 'crest',
    color: 'brass',
    title: 'Evolve',
    text: 'Everything you do earns EP. Earn enough and you evolve: seven stages from Spark to Legend, each with its own crest.',
  },
  {
    key: 'missions',
    icon: 'flag',
    color: 'violet',
    title: 'Daily missions',
    text: 'A few small goals every day: protein, water, a workout. Finish them for bonus EP.',
  },
];

export const TIPS = {
  'quick-log':   { title: 'Log anything', text: 'Tap + for food, water, weight or a workout. It works from every tab.' },
  'stage-card':  { title: 'Your stage', text: 'EP fills this bar. Fill it to evolve to the next stage. Your streak lives here too.' },
  'missions':    { title: 'Daily missions', text: 'Small goals that reset every morning. Each one done is bonus EP.' },
  'food-search': { title: 'Search Indian food', text: 'Dal, roti, paneer… Pick the form you eat: low-fat or regular paneer, toned or full-cream milk.' },
  'my-foods':    { title: 'Your own foods', text: "Brand not listed? Copy the label once (Milky Mist paneer, your oats) and it's saved here for good." },
  'generate':    { title: 'Workouts made for you', text: 'Pick your time and focus and get a plan, then log each set live with a rest timer.' },
  'weigh-in':    { title: 'Track your weight', text: 'Weigh in at the same time each morning, before breakfast. The trend smooths out the daily ups and downs.' },
};
