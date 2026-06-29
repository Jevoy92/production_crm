import type { ResearchPack } from "@/lib/researchPacks";

export const pack: ResearchPack = {
  theme_no: "02",
  title: 'Research Pack — "Judged Before You Speak"',
  subtitle: "MYB · The Tenth of a Second",
  driveFolderUrl:
    "https://drive.google.com/drive/folders/1N6ORBjFojDRTXhli0sbfRwgtpIWedpzY",
  howToUse:
    "Each study gives four things — (1) the analogy to SAY (lead with this every time), (2) the on-screen CARD (names/years live here, never in your mouth), (3) a real LINK, (4) the VISUAL to grab. Drop screenshots/clips into the gallery as you collect them.",
  deliveryRule:
    'You never pronounce a researcher\'s name. In your mouth it\'s "researchers at Princeton," "a psychologist back in 1920," "a study out of Cornell." The full citation appears on screen as a card. Lead with the picture, then the finding.',
  studies: [
    {
      id: "tenth-of-a-second",
      number: 1,
      title: "You're read in a tenth of a second (the speed)",
      say: "Faster than a camera flash. Before you've even decided to smile, the read is already printed. A photo of a stranger flashes up for a tenth of a second — less than a blink — and the snap read people form in that flash basically matches what they'd say if you let them stare as long as they wanted.",
      card: 'Willis & Todorov, "First Impressions: Making Up Your Mind After a 100-ms Exposure to a Face," Psychological Science, 2006 (Princeton).',
      link: "https://journals.sagepub.com/doi/abs/10.1111/j.1467-9280.2006.01750.x",
      visual:
        "Neutral stranger's face with a 0.1-second stopwatch/flash overlay; camera-flash b-roll.",
    },
    {
      id: "hardens-it",
      number: 2,
      title: "More time doesn't fix it; it hardens it",
      say: "Give people longer to look and they don't get more accurate. They get more confident. It's the first guess you keep doubling down on. The read doesn't reopen; it sets, like concrete.",
      card: "Same study — Willis & Todorov, 2006: longer exposure raised confidence, not accuracy.",
      visual:
        "Wet cement → set cement; a confidence meter climbing while accuracy stays flat.",
    },
    {
      id: "thin-slices",
      number: 3,
      title: "It doesn't wait for your words (thin slices)",
      say: "Hit mute on your TV, freeze on a stranger for two seconds, and you could basically guess their Yelp rating. Researchers did exactly that with teachers — silent two-second clips, shown to people who'd never met them — and those two muted seconds predicted the teacher's actual end-of-term reviews.",
      card: 'Ambady & Rosenthal, "Half a Minute: Predicting Teacher Evaluations from Thin Slices of Nonverbal Behavior," JPSP, 1993.',
      link: "https://www.scienceopen.com/document?vid=112f87e3-c4b3-404a-9af2-f94999362e7b",
      visual: 'Teacher mid-gesture with "2 SEC · MUTE" overlay; TV mute icon.',
    },
    {
      id: "halo",
      number: 4,
      title: "One read photocopies onto everything (halo)",
      say: "One read doesn't stay in its lane — it photocopies. The scorecard looks like it's got twenty questions; really it's got one, and the other nineteen copy the answer. A hundred years ago an officer rating soldiers rated the good-looking ones as also smarter, braver, more loyal — like the handsome score leaked ink onto every other box.",
      card: 'Thorndike, "A Constant Error in Psychological Ratings" (the halo effect), Journal of Applied Psychology, 1920.',
      link: "https://web.mit.edu/curhan/www/docs/Articles/biases/4_J_Applied_Psychology_25_(Thorndike).pdf",
      visual:
        "A rating scorecard where one high mark bleeds down every row; ink-spreading b-roll.",
    },
    {
      id: "elections",
      number: 5,
      title: "A one-second face-read calls elections (the stakes)",
      say: "Mute the debate. Freeze on the two faces for one second. Ask a total stranger — even a kid — who looks more in charge? That one-second answer called about seven out of ten real Senate races. People weren't reading the platform. They were reading the face — judging the book dead by its cover, and the cover kept winning.",
      card: 'Todorov, Mandisodza, Goren & Hall, "Inferences of Competence from Faces Predict Election Outcomes," Science, 2005 (~68.8% of 2004 Senate races).',
      link: "https://www.science.org/doi/10.1126/science.1110589",
      links: [
        {
          label: "Science article",
          url: "https://www.science.org/doi/10.1126/science.1110589",
        },
        {
          label: "PDF (Amherst)",
          url: "https://www.amherst.edu/system/files/media/1083/todorov%20et%20al%20(2005).pdf",
        },
      ],
      visual:
        'The candidate face-pair figure; a "68.8%" stat card; a muted debate freeze-frame.',
    },
    {
      id: "liking-gap",
      number: 6,
      title: "When they actually checked, the reads were kind (the liking gap)",
      say: "Two people walk out of the same conversation holding two different reviews. You leave replaying the one awkward pause; they leave thinking, I liked that person. Researchers measured it over and over — quick chats, long talks, roommates over a whole semester — and people always lowballed how much the other person liked them. The read was warm. You just refused to believe it.",
      card: 'Boothby, Cooney, Sandstrom & Clark, "The Liking Gap in Conversations," Psychological Science, 2018.',
      links: [
        {
          label: "Author page",
          url: "https://guscooney.com/publication/the-liking-gap-in-conversations-do-people-like-us-more-than-we-think/",
        },
        { label: "PubMed", url: "https://pubmed.ncbi.nlm.nih.gov/30183512/" },
      ],
      visual:
        "The study's bar chart (your estimate vs their actual liking — the gap); two people leaving a table in opposite moods.",
    },
    {
      id: "spotlight",
      number: 7,
      title: "Half the room never looked up (the spotlight effect)",
      say: "You walk into the room sure the dumb shirt is a billboard everyone's reading. In the study they made students wear a deeply embarrassing Barry Manilow t-shirt and guess how many people noticed. The students guessed half the room. Reality? About a quarter. Everybody's starring in their own movie, worried about their own shirt.",
      card: 'Gilovich, Medvec & Savitsky, "The Spotlight Effect," JPSP, 2000 (guessed ~50%, actual ~25%).',
      link: "https://www.psychologyib.com/uploads/1/1/7/5/11758934/the_spotlight_effect_-_ib_psychology.pdf",
      visual:
        'A Barry Manilow t-shirt; a "guessed 50% / actual 25%" split-bar; a room of people all on their own phones.',
    },
    {
      id: "susan-boyle",
      number: 8,
      title: "Even the cruelest read reverses (Susan Boyle)",
      say: "A whole theater wrote her off in one second — you can watch the eye-rolls, they're on camera. Then she opens her mouth, and about eleven seconds into the song the entire room is on its feet. The fastest 'no' ever filmed, overturned by one true note.",
      card: 'Susan Boyle, "I Dreamed a Dream," Britain\'s Got Talent, 11 April 2009 (public footage).',
      link: "https://www.youtube.com/watch?v=yE1Lxw5ZyXk",
      visual:
        "Eye-roll/smirk reaction frames before she sings → the flip moment (judges' faces, crowd standing). Short clip under commentary/fair-use or link out.",
    },
  ],
  beats: [
    {
      id: "cold-open",
      title: "Cold open",
      description:
        "Hand on a door handle, muffled room on the other side, a held breath.",
    },
    {
      id: "last-stranger",
      title: "The last stranger you read",
      description:
        "Barista, a bad merge in traffic, a new face on a video call.",
    },
    {
      id: "rehearsed-disaster",
      title: "The double cost / rehearsed disaster",
      description:
        "2 a.m. ceiling, the scene replayed; then the real meeting lasting six flat minutes and going fine.",
    },
    {
      id: "closer-airport",
      title: "The closer (airport gate)",
      description:
        "An arrivals-gate reunion from a distance — a silhouette rounding the corner, recognition, someone moving fast toward them. The whole thesis in one image. Grab 2–3 real reunion clips.",
    },
  ],
  shotList: [
    { id: "flash", label: "0.1s flash / face stimuli" },
    { id: "cement", label: "Wet → set cement" },
    { id: "mute-teacher", label: '"2 SEC MUTE" teacher' },
    { id: "halo", label: "Halo scorecard / ink-bleed" },
    { id: "senate", label: "Senate face-pair + 68.8% card" },
    { id: "liking-gap", label: "Liking-gap bar chart" },
    { id: "manilow", label: "Manilow shirt + 50/25 bar" },
    { id: "boyle", label: "Susan Boyle eye-roll → flip" },
    { id: "door", label: "Door-handle cold open" },
    { id: "broll", label: "Barista / traffic / Zoom b-roll" },
    { id: "2am", label: "2 a.m. rehearsed-disaster" },
    { id: "airport", label: "Airport arrivals reunion ×3" },
  ],
};

export default pack;