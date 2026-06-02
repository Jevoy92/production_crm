import type { PalLane } from "./ccStore";

export type ShortType =
  | "Curiosity Hook"
  | "Problem/Aha"
  | "Practical Takeaway"
  | "Myth Killer"
  | "Story Teaser";

export type CoreShort = {
  num: string;          // "1.1"
  core12: number;       // 1..12
  type: ShortType;
  lane: PalLane;
  durationSec: number;
  hook: string;         // headline / first line for title
  body: string;         // full script body with stage directions
  cta: string;          // CTA line
};

/**
 * 60 supporting shorts (5 per Core 12 episode).
 * Each is a standalone piece that opens a loop pointing back to the long-form.
 */
export const CORE_SHORTS: CoreShort[] = [
  // ---------- Core 12 #1: The Invisible Expert Problem ----------
  {
    num: "1.1", core12: 1, type: "Curiosity Hook", lane: "Reel", durationSec: 45,
    hook: "The best businesses I've ever walked into… nobody outside their zip code knows they exist.",
    body: "[HOOK — Direct to camera, slight lean in]\nYou know what's wild? The best businesses I've ever walked into… nobody outside their zip code knows they exist.\n\n[BEAT — slight pause, shake head]\nI'm talking about the dentist who changed my whole perspective on oral health. The mechanic who genuinely saved me thousands. The therapist who actually listens.\n\n[SHIFT — hands open, explaining]\nThey don't have a quality problem. They have a translation problem. They know exactly what they do — but their ideal customer has no idea they exist.",
    cta: "Full breakdown on YouTube — The Invisible Expert Problem.",
  },
  {
    num: "1.2", core12: 1, type: "Problem/Aha", lane: "Reel", durationSec: 35,
    hook: "You ever Google a business and think 'I genuinely cannot tell what you do'?",
    body: "[HOOK — Frustrated energy, walking toward camera]\nYou ever Google something, find a business, look at their website, and think… 'I genuinely cannot tell what you do'?\n\n[BEAT]\nThat's not a design problem. That's not a marketing problem. That's a communication gap. The owner knows exactly what they offer. But the way they're expressing it? It's like speaking French to someone who only speaks Spanish.",
    cta: "The Invisible Expert Problem — on the channel.",
  },
  {
    num: "1.3", core12: 1, type: "Myth Killer", lane: "Evergreen", durationSec: 40,
    hook: "'If you're good enough, people will find you.' That's the most dangerous lie in business.",
    body: "[HOOK — Finger up, correcting]\n'If you're good enough, people will find you.' Bro. That is the most dangerous lie in business.\n\n[BEAT — lean back, arms crossed]\nBeing excellent does not make you visible. Being excellent makes you excellent. Visibility is a completely different skill set. And most brilliant people never learn it because they assume the work speaks for itself.\n\n[SHIFT — softer]\nThe work whispers. You need something that translates it into a language your audience actually speaks.",
    cta: "Full breakdown — The Invisible Expert Problem on YouTube.",
  },
  {
    num: "1.4", core12: 1, type: "Practical Takeaway", lane: "Evergreen", durationSec: 50,
    hook: "Read the first sentence on your homepage out loud. If it's about you, you've already lost.",
    body: "[HOOK — Sitting, teaching energy]\nHere's a quick test. Go to your website right now and read the first sentence on your homepage out loud.\n\n[BEAT]\nIf that sentence is about you — 'We are a full-service blah blah blah' — you've already lost. Because your customer doesn't care about you yet. They care about their problem.\n\n[SHIFT — leaning in]\nThe first sentence should name their pain so precisely they think you read their journal. That's translation.",
    cta: "I go way deeper in the full video. Link's right there.",
  },
  {
    num: "1.5", core12: 1, type: "Story Teaser", lane: "Spotlight", durationSec: 50,
    hook: "Twelve years of mastery and the internet barely knows he exists.",
    body: "[HOOK — Reflective, storytelling]\nI walked into this barbershop in Renton a few months ago. Best cut I've had in years. The guy was incredible — knew exactly how to handle my hair, the vibe was right, music was good, conversation was real.\n\n[BEAT]\nI asked him, 'How long you been doing this?' He said, 'Twelve years.' Twelve years. And his Google reviews? Seven. Total.\n\n[SHIFT]\nTwelve years of mastery and the internet barely knows he exists. That's not a skill problem. That's a translation problem. And it's everywhere.",
    cta: "Full story on YouTube — The Invisible Expert Problem.",
  },

  // ---------- Core 12 #2: I Filmed the Same Business Two Ways ----------
  {
    num: "2.1", core12: 2, type: "Curiosity Hook", lane: "Reel", durationSec: 40,
    hook: "I filmed the exact same business twice. Same camera. Same day.",
    body: "[HOOK — Holding up two fingers]\nI filmed the exact same business twice. Same camera. Same lens. Same day. Same owner.\n\n[BEAT — slight smirk]\nOne version looks like every other business video on the internet. The other one? Made the owner's wife cry. In a good way.\n\n[SHIFT]\nThe difference wasn't the gear. It wasn't the lighting. It wasn't even the editing. It was the strategy behind what we chose to film and why.",
    cta: "Side-by-side in the full video.",
  },
  {
    num: "2.2", core12: 2, type: "Problem/Aha", lane: "Spotlight", durationSec: 35,
    hook: "Generic video makes great companies look average.",
    body: "[HOOK — Blunt energy]\nGeneric video makes great companies look average. I'm going to say that again.\n\n[BEAT — slower]\nGeneric. Video. Makes. Great. Companies. Look. Average.\n\n[SHIFT]\nIf your video could belong to any business in your industry — if you could swap the logo and nobody would notice — it's not working. It's wallpaper. And wallpaper doesn't convert.",
    cta: "Real side-by-side in the full video.",
  },
  {
    num: "2.3", core12: 2, type: "Myth Killer", lane: "Evergreen", durationSec: 40,
    hook: "'Just get something professional-looking and you'll be fine.' No. No you won't.",
    body: "[HOOK — Shaking head]\n'Just get something professional-looking and you'll be fine.' No. No you won't.\n\n[BEAT]\nProfessional-looking is the bare minimum. A well-lit, nicely edited video that says nothing specific about your business is just expensive wallpaper.\n\n[SHIFT — teaching]\nStrategy beats production value every single time. I'd rather watch a slightly rough video that makes me feel something than a cinematic masterpiece that tells me nothing.",
    cta: "Same business, two ways — full video on the channel.",
  },
  {
    num: "2.4", core12: 2, type: "Practical Takeaway", lane: "Evergreen", durationSec: 45,
    hook: "Before you film anything, ask: what does my customer believe right now that's wrong?",
    body: "[HOOK — Direct, teaching]\nBefore you film anything for your business, answer this one question: What does my customer believe right now that's wrong?\n\n[BEAT]\nNot 'what do I want to say about myself.' Not 'what services do I offer.' What does the person watching this currently believe that's preventing them from hiring me?\n\n[SHIFT]\nWhen you film to correct a false belief, you're not selling — you're translating. That's the difference between a video that converts and a video that just exists.",
    cta: "Real demo in the full video.",
  },
  {
    num: "2.5", core12: 2, type: "Story Teaser", lane: "Spotlight", durationSec: 50,
    hook: "'Tell me about the last customer who almost didn't hire you — and what changed their mind.'",
    body: "[HOOK — Setting the scene]\nSo I'm on set with this business owner — great guy, eight years in — and we film version one. Standard stuff. Nice B-roll, talking head, lists his services. Looks clean.\n\n[BEAT]\nThen I said, 'Okay, now forget all of that. Tell me about the last customer who almost didn't hire you — and what changed their mind.'\n\n[SHIFT — building]\nHis whole energy shifted. His posture changed. He told this story about a woman who was terrified to spend the money… and what happened after she did.",
    cta: "Both versions in the full video.",
  },

  // ---------- Core 12 #3: I Watched 100 Business Videos ----------
  {
    num: "3.1", core12: 3, type: "Curiosity Hook", lane: "Reel", durationSec: 35,
    hook: "I just watched 100 business videos back to back. My brain is cooked.",
    body: "[HOOK — Exhausted, rubbing eyes]\nI just watched 100 business videos back to back. A hundred. My brain is cooked.\n\n[BEAT — sitting up]\nBut here's what's wild — I can tell you the exact moment 90% of them lost me. And it's the same mistake. Every. Single. Time.",
    cta: "Full breakdown on the channel.",
  },
  {
    num: "3.2", core12: 3, type: "Problem/Aha", lane: "Evergreen", durationSec: 40,
    hook: "Three fastest ways to lose someone in a business video.",
    body: "[HOOK — Counting on fingers]\nThe three fastest ways to lose someone in a business video: One — start with your company name. Nobody cares yet. Two — list your services before you've earned attention. Three — use the word 'passionate' unironically.\n\n[BEAT — slight laugh]\nI'm not being mean. I watched a hundred. The pattern is brutal. The businesses that actually hold attention do something completely different in the first five seconds.",
    cta: "Full breakdown shows exactly what.",
  },
  {
    num: "3.3", core12: 3, type: "Practical Takeaway", lane: "Evergreen", durationSec: 45,
    hook: "The top 10% open with the customer's problem, not the company's story.",
    body: "[HOOK — Teaching, direct]\nThe single biggest pattern I noticed in the top 10% of business videos? They open with the customer's problem, not the company's story.\n\n[BEAT]\n'Have you ever hired someone and immediately regretted it?' That's a hook. 'Welcome to Smith & Associates, we've been serving the community since 2003' — that's a lullaby.\n\n[SHIFT]\nYour viewer gives you three seconds. Use them to prove you understand their world, not to introduce yours.",
    cta: "More patterns in the full breakdown.",
  },
  {
    num: "3.4", core12: 3, type: "Myth Killer", lane: "Reel", durationSec: 35,
    hook: "'People don't watch long business videos.' That's a lie.",
    body: "[HOOK — Blunt]\n'People don't watch long business videos.' That's a lie. People don't watch boring business videos. Massive difference.\n\n[BEAT]\nI found business videos with 500K+ views that are 8, 10, 12 minutes long. The difference isn't length — it's whether the first five seconds earned the next five seconds.",
    cta: "Top performers broken down in the full video.",
  },
  {
    num: "3.5", core12: 3, type: "Story Teaser", lane: "Spotlight", durationSec: 45,
    hook: "Video 47. 'I started this business the week my mom was diagnosed.'",
    body: "[HOOK — Reflective]\nVideo number 47. I almost turned it off. It started like every other one — logo, drone shot, 'we're a family-owned…'\n\n[BEAT]\nBut then at the 8-second mark, the owner said something that made me put my phone down. She said, 'I started this business the week my mom was diagnosed.'\n\n[SHIFT]\nAnd suddenly I wasn't watching a business video. I was watching a human being. That's the difference between content and connection.",
    cta: "Full story in the video.",
  },

  // ---------- Core 12 #4: The Camera Lie ----------
  {
    num: "4.1", core12: 4, type: "Myth Killer", lane: "Reel", durationSec: 40,
    hook: "'I'm just not a camera person.' Every time, it's a lie.",
    body: "[HOOK — Direct, challenging]\n'I'm just not a camera person.' I hear this every single week. And every single time, it's a lie.\n\n[BEAT]\nNot a lie you're telling on purpose. A lie you've been told. You're not 'not a camera person.' You've just never been in an environment where the camera felt safe.\n\n[SHIFT — softer]\nCamera-shy is actually context-shy. Change the context, change the confidence.",
    cta: "Full breakdown — The Camera Lie.",
  },
  {
    num: "4.2", core12: 4, type: "Problem/Aha", lane: "Spotlight", durationSec: 45,
    hook: "Camera-shy isn't a personality flaw — it's a nervous system response.",
    body: "[HOOK — Empathetic, knowing]\nYou know that feeling when someone puts a camera in your face and you forget how to be a human? Your arms feel weird. Your voice sounds fake. You can't remember a single interesting thing about yourself.\n\n[BEAT — slight laugh]\nThat's not a personality flaw. That's a nervous system response. Your brain is treating the camera like a predator because nobody created safety first.\n\n[SHIFT]\nThe camera doesn't create confidence. The environment does. The direction does. The relationship with the person behind the lens does.",
    cta: "Whole framework in the full video.",
  },
  {
    num: "4.3", core12: 4, type: "Practical Takeaway", lane: "Evergreen", durationSec: 45,
    hook: "If someone's nervous on camera, don't start with the real questions.",
    body: "[HOOK — Teaching]\nIf you're filming someone who's nervous on camera, here's the single most effective thing: Don't start with the real questions.\n\n[BEAT]\nStart with something dumb. 'What did you have for breakfast?' 'What's the last show you binged?' Let them hear their own voice natural. Let them laugh. Let them forget the red light is on.\n\n[SHIFT]\nBy the time you ask the real question, their nervous system has already decided this is a conversation, not a performance.",
    cta: "Deeper in The Camera Lie.",
  },
  {
    num: "4.4", core12: 4, type: "Curiosity Hook", lane: "Reel", durationSec: 30,
    hook: "The people who look 'natural' on camera? They were directed.",
    body: "[HOOK — Conspiratorial tone]\nI'm going to tell you something that might change how you think about every business video you've ever watched.\n\n[BEAT]\nThe people who look 'natural' on camera? They're not natural. They were directed. Someone created the conditions for them to relax. That confidence you're seeing? It was built. In real time. On set.",
    cta: "I show you exactly how in the full video.",
  },
  {
    num: "4.5", core12: 4, type: "Story Teaser", lane: "Spotlight", durationSec: 50,
    hook: "'I'm going to be terrible at this. I'm warning you now.'",
    body: "[HOOK — Storytelling energy]\nI had a client — won't say who — who literally said to me before the shoot, 'I'm going to be terrible at this. I'm warning you now.'\n\n[BEAT]\nFirst 20 minutes? Stiff. Robotic. Reading off the teleprompter like a hostage video. I could see it in their eyes — they wanted to quit.\n\n[SHIFT — building]\nSo I turned the camera off. We just talked for ten minutes. About their kids. About why they started the business. About the one client who made them cry.\n\n[BEAT]\nThen I turned the camera back on without telling them.",
    cta: "What happened next is in the full video.",
  },

  // ---------- Core 12 #5: Every Business Has a $1M Video ----------
  {
    num: "5.1", core12: 5, type: "Curiosity Hook", lane: "Reel", durationSec: 35,
    hook: "Every business has a million-dollar video inside it. It's probably not a Reel.",
    body: "[HOOK — Bold claim, direct eye contact]\nEvery single business has a million-dollar video inside it. And I promise you — it's not a Reel. It's not a TikTok. It's probably not even on social media.\n\n[BEAT]\nIt's the video that answers the question your sales team gets asked 200 times a year. The one that eliminates an entire job function. The one that closes deals while you sleep.",
    cta: "How to find yours — in the full video.",
  },
  {
    num: "5.2", core12: 5, type: "Problem/Aha", lane: "System", durationSec: 40,
    hook: "Explaining the same thing to every new customer is exhausting.",
    body: "[HOOK — Naming the pain]\nYou know what's exhausting? Explaining the same thing to every new customer. Every. Single. Time.\n\n[BEAT]\n'How does your process work?' 'What should I expect?' 'What do I need to prepare?' You've answered these a thousand times. And you'll answer them a thousand more — unless you film the answer once and let it work forever.\n\n[SHIFT]\nThat's not content marketing. That's operational infrastructure disguised as a video.",
    cta: "Full breakdown on the channel.",
  },
  {
    num: "5.3", core12: 5, type: "Practical Takeaway", lane: "System", durationSec: 45,
    hook: "Find your million-dollar video in 60 seconds.",
    body: "[HOOK — Teaching, hands moving]\nHere's how to find your million-dollar video in 60 seconds. Ready?\n\n[BEAT]\nOpen your email. Search for the last 20 messages where a customer or employee asked you a question. Write down the three questions that come up most often.\n\n[SHIFT]\nNow film yourself answering those three clearly, warmly, completely. Congrats — you just built a video that saves your team 200 hours a year and makes every new customer feel taken care of before they even meet you.",
    cta: "Way deeper framework in the full video.",
  },
  {
    num: "5.4", core12: 5, type: "Myth Killer", lane: "Evergreen", durationSec: 35,
    hook: "'Video is for marketing.' No. Video is for operations.",
    body: "[HOOK — Correcting]\n'Video is for marketing.' No. Video is for operations. Marketing is just one use case.\n\n[BEAT]\nThe most valuable video in your business might never go viral. It might never get a single like. But if it trains your new hires in half the time? If it answers customer questions at 2 AM? If it closes deals without a sales call?\n\n[SHIFT]\nThat's not content. That's infrastructure.",
    cta: "Full framework in the video.",
  },
  {
    num: "5.5", core12: 5, type: "Story Teaser", lane: "System", durationSec: 50,
    hook: "Four hours a week answering the same five onboarding questions.",
    body: "[HOOK — Setting the scene]\nI was talking to a business owner who told me he spends — and I'm not exaggerating — four hours a week answering the same onboarding questions from new clients. Four hours. Every week.\n\n[BEAT]\nThat's 200 hours a year. At his billing rate? Over $30,000 in lost revenue. Every year. Answering the same five questions.\n\n[SHIFT — leaning in]\nWe filmed those five answers in 45 minutes. Now every new client gets them automatically before their first meeting.",
    cta: "Full story — Every Business Has a $1 Million Video.",
  },

  // ---------- Core 12 #6: Film a Business Owner for 8 Hours ----------
  {
    num: "6.1", core12: 6, type: "Curiosity Hook", lane: "Reel", durationSec: 35,
    hook: "Around hour four of a shoot day, something I can't fully explain happens.",
    body: "[HOOK — Leaning in, like sharing a secret]\nSomething happens around hour four of a shoot day that I can't fully explain. The person in front of the camera… becomes a different version of themselves.\n\n[BEAT]\nNot a fake version. A truer version. The mask drops. The rehearsed answers stop. And suddenly you're capturing something real.",
    cta: "Full psychology of an 8-hour shoot in the video.",
  },
  {
    num: "6.2", core12: 6, type: "Problem/Aha", lane: "Spotlight", durationSec: 40,
    hook: "Most business videos feel fake because they ARE fake.",
    body: "[HOOK — Naming it]\nMost business videos feel fake because they are fake. Not intentionally — but when you give someone 15 minutes in front of a camera, you get their performance. Their 'camera voice.' Their rehearsed pitch.\n\n[BEAT]\nGive them 8 hours? You get past all of that. You get the real stories. The unscripted moments. The thing they say at 3 PM that they'd never say at 9 AM.\n\n[SHIFT]\nA shoot day isn't about footage. It's about extraction.",
    cta: "Full breakdown on the channel.",
  },
  {
    num: "6.3", core12: 6, type: "Practical Takeaway", lane: "System", durationSec: 45,
    hook: "Film more than you think you need. The gold is in hour four.",
    body: "[HOOK — Teaching]\nIf you're planning a video shoot for your business, here's a principle that will change everything: Film more than you think you need.\n\n[BEAT]\nNot because you need more footage — but because the best moments come after the person forgets they're being filmed. The gold is in hour three, hour four, hour five. Not in the first 20 minutes when everyone's stiff and performing.\n\n[SHIFT]\nPlan for endurance, not efficiency. The camera rewards patience.",
    cta: "Full shoot day framework in the video.",
  },
  {
    num: "6.4", core12: 6, type: "Story Teaser", lane: "Spotlight", durationSec: 50,
    hook: "Hour six. 'What would you tell yourself on day one?'",
    body: "[HOOK — Reflective, warm]\nHour six. We'd been filming all day. The business owner was tired — good tired. And I asked one more question. I said, 'What would you tell yourself on day one?'\n\n[BEAT]\nAnd this man — who'd been composed and professional all day — his voice cracked. He looked down. And he said something so honest, so raw, that the entire crew went silent.\n\n[SHIFT]\nThat 45-second answer became the centerpiece of his entire brand video. And it only happened because we gave it time.",
    cta: "Full story in the video.",
  },
  {
    num: "6.5", core12: 6, type: "Myth Killer", lane: "Evergreen", durationSec: 35,
    hook: "'A video shoot should be quick and efficient.' I disagree. Strongly.",
    body: "[HOOK — Correcting]\n'A video shoot should be quick and efficient.' I disagree. Strongly.\n\n[BEAT]\nQuick and efficient gets you surface-level content. It gets you the rehearsed version. The polished mask. The thing they think they should say.\n\n[SHIFT]\nDepth takes time. Authenticity takes patience. The best content I've ever captured came from the moments between the 'official' takes.",
    cta: "Why — in What Happens When You Film a Business Owner for 8 Hours.",
  },

  // ---------- Core 12 #7: Algorithm Doesn't Care About Your Brand ----------
  {
    num: "7.1", core12: 7, type: "Myth Killer", lane: "Reel", durationSec: 35,
    hook: "The algorithm does not care about your brand board.",
    body: "[HOOK — Blunt, slightly amused]\nThe algorithm does not care about your brand board. It does not care about your color palette. It does not care that you spent $5,000 on a brand identity package.\n\n[BEAT]\nIt cares about one thing: Did someone stop scrolling? That's it. Attention first. Brand second. Always.",
    cta: "What this means for your strategy — full video.",
  },
  {
    num: "7.2", core12: 7, type: "Problem/Aha", lane: "Reel", durationSec: 40,
    hook: "Pretty on-brand post gets 12 likes. Random BTS clip gets 10x the reach.",
    body: "[HOOK — Naming the frustration]\nYou ever post something beautiful — perfectly on-brand, gorgeous graphics, thoughtful caption — and it gets 12 likes? And then some random behind-the-scenes clip you almost didn't post gets 10x the reach?\n\n[BEAT]\nThat's not the algorithm being unfair. That's the algorithm telling you what humans actually respond to. And it's usually not polish. It's relevance.\n\n[SHIFT]\nPretty content that nobody watches is still a failure.",
    cta: "Full breakdown on the channel.",
  },
  {
    num: "7.3", core12: 7, type: "Practical Takeaway", lane: "Evergreen", durationSec: 45,
    hook: "Hook. Retention. Value. Brand. In that order.",
    body: "[HOOK — Teaching, direct]\nHere's the hierarchy that actually matters on social media. Ready?\n\n[BEAT — counting]\nFirst: Hook. Did you earn the first second? Second: Retention. Did they stay past three seconds? Third: Value. Did they get something — emotion, information, entertainment? Fourth — and only fourth — Brand. Did it feel like you?\n\n[SHIFT]\nMost businesses start at step four and wonder why nobody's watching. You have to earn brand recognition. You can't demand it.",
    cta: "Deep dive in the full video.",
  },
  {
    num: "7.4", core12: 7, type: "Curiosity Hook", lane: "Reel", durationSec: 30,
    hook: "What if the most 'on-brand' content strategy is actually hurting your reach?",
    body: "[HOOK — Provocative]\nWhat if I told you that the most 'on-brand' content strategy is actually hurting your reach?\n\n[BEAT]\nWhat if consistency — the thing every marketing guru preaches — is the exact reason your content feels invisible?",
    cta: "I explain why in the full video. It's a little spicy.",
  },
  {
    num: "7.5", core12: 7, type: "Story Teaser", lane: "Spotlight", durationSec: 45,
    hook: "Immaculate grid. Eleven likes per post. Then one raw video hit 47K.",
    body: "[HOOK — Setting the scene]\nI was working with a business owner who had the most beautiful Instagram grid I'd ever seen. Perfectly curated. Every post matched. Colors, fonts, spacing — immaculate.\n\n[BEAT]\nAverage likes per post? Eleven. Eleven likes on a grid that looked like it belonged in a design museum.\n\n[SHIFT]\nThen one day she posted a raw, unfiltered video of herself talking about a bad client experience. No graphics. No brand colors. Just her face and her frustration.\n\n[BEAT]\n47,000 views.",
    cta: "Full story in the video.",
  },

  // ---------- Core 12 #8: $450 Video Shoot ----------
  {
    num: "8.1", core12: 8, type: "Curiosity Hook", lane: "Reel", durationSec: 30,
    hook: "I charge $450 for a video shoot. Here's exactly what that looks like.",
    body: "[HOOK — Direct, transparent]\nI charge $450 for a video shoot. And I'm going to show you exactly what that looks like. Not the highlight reel. The actual process. Start to finish.\n\n[BEAT]\nBecause I think the reason most small businesses don't invest in video is they genuinely don't know what they're paying for.",
    cta: "Full behind-the-scenes on the channel.",
  },
  {
    num: "8.2", core12: 8, type: "Problem/Aha", lane: "Spotlight", durationSec: 40,
    hook: "You're not paying for footage. You're paying for clarity.",
    body: "[HOOK — Empathetic]\n'Professional video is too expensive for my business.' I hear this constantly. And I get it — because the industry has done a terrible job explaining what things actually cost and why.\n\n[BEAT]\nYou're not paying for minutes of footage. You're not paying for fancy equipment. You're paying for clarity. For someone to take the messy, complex thing you do and translate it into something your customer immediately understands.",
    cta: "What a $450 shoot looks like — full video.",
  },
  {
    num: "8.3", core12: 8, type: "Practical Takeaway", lane: "Evergreen", durationSec: 45,
    hook: "What to expect from a professional shoot at the $450–$600 level.",
    body: "[HOOK — Teaching]\nHere's what you should actually expect from a professional video shoot at the $450-$600 level.\n\n[BEAT — listing naturally]\nA strategy conversation before we ever touch a camera. A clear plan for what we're filming and why. Professional lighting, audio, and framing. Direction — meaning I'm not just pointing a camera at you, I'm guiding you through it. And a finished asset that actually serves a business purpose.\n\n[SHIFT]\nThat's not expensive. That's accessible.",
    cta: "Full walkthrough in the video.",
  },
  {
    num: "8.4", core12: 8, type: "Myth Killer", lane: "Reel", durationSec: 35,
    hook: "'You get what you pay for with video.' Sometimes. But also…",
    body: "[HOOK — Correcting]\n'You get what you pay for with video.' Sometimes. But also — a lot of people are paying $5,000 for something that could've been $500 with the right person.\n\n[BEAT]\nThe video production industry has a pricing transparency problem. And it keeps small businesses — the ones who need video the most — locked out.\n\n[SHIFT]\nI'm trying to change that.",
    cta: "What's possible at an accessible price — full video.",
  },
  {
    num: "8.5", core12: 8, type: "Story Teaser", lane: "Spotlight", durationSec: 45,
    hook: "Quoted $3K–$7K. We did her shoot for $450. She cried.",
    body: "[HOOK — Storytelling]\nA woman reached out to me last month. She runs a small therapy practice. She said, 'I've been quoted $3,000 to $7,000 for a simple website video. I can't afford that.'\n\n[BEAT]\nWe did her shoot for $450. Took about two hours. She cried afterward — not because it was emotional content, but because she finally felt like her business looked as good as it actually is.\n\n[SHIFT]\nThat's what this is about. Making professional video accessible to people who deserve it.",
    cta: "Full story + process in the video.",
  },

  // ---------- Core 12 #9: Why I Started a Video Company ----------
  {
    num: "9.1", core12: 9, type: "Story Teaser", lane: "Spotlight", durationSec: 50,
    hook: "I didn't start Palmer House because I love cameras.",
    body: "[HOOK — Reflective, Kingston energy]\nI didn't start Palmer House because I love cameras. I started it because I spent my whole life watching brilliant people go unnoticed.\n\n[BEAT]\nGrowing up in Kingston, I saw people with incredible talent — musicians, cooks, builders, artists — who never got the recognition they deserved. Not because they weren't good enough. But because nobody helped them communicate how good they were.\n\n[SHIFT]\nThe camera is just the tool. The real work is translation.",
    cta: "Full story — Why I Started a Video Company.",
  },
  {
    num: "9.2", core12: 9, type: "Curiosity Hook", lane: "Reel", durationSec: 35,
    hook: "I went from moving furniture to making films.",
    body: "[HOOK — Direct]\nI went from moving furniture to making films. And honestly? The connection between those two things is way more direct than you'd think.\n\n[BEAT]\nBoth are about entering someone's space with care. Both require trust before anything else. Both are physical, intimate, and deeply personal.",
    cta: "Whole journey in the full video.",
  },
  {
    num: "9.3", core12: 9, type: "Problem/Aha", lane: "Spotlight", durationSec: 40,
    hook: "Good people. Great businesses. Invisible online.",
    body: "[HOOK — Honest, vulnerable]\nI'm going to be real with you. I didn't start this company with a business plan and a five-year strategy. I started it because I kept seeing the same problem everywhere.\n\n[BEAT]\nGood people. Great businesses. Invisible online. And the gap between who they are and how they're perceived? It was painful to watch. I just thought… I can fix that. With a camera and the right questions.",
    cta: "Full story on the channel.",
  },
  {
    num: "9.4", core12: 9, type: "Practical Takeaway", lane: "Evergreen", durationSec: 40,
    hook: "The best video producers aren't the best filmmakers. They're the best listeners.",
    body: "[HOOK — Teaching through story]\nHere's something I learned that changed everything: The best video producers aren't the best filmmakers. They're the best listeners.\n\n[BEAT]\nThe story is already there. The business owner already has everything they need to say. They just need someone who knows how to pull it out, organize it, and present it in a way that lands.\n\n[SHIFT]\nThat's why I started this. Not to make pretty videos. To help people be understood.",
    cta: "Full video on the channel.",
  },
  {
    num: "9.5", core12: 9, type: "Myth Killer", lane: "Reel", durationSec: 30,
    hook: "I'm not a camera guy. I'm a communication guy.",
    body: "[HOOK — Correcting]\nPeople assume I started a video company because I'm a 'camera guy.' Nah.\n\n[BEAT]\nI started a video company because I'm a communication guy. The camera is just the medium. If I could translate people's expertise through interpretive dance and it worked? I'd be doing that instead.",
    cta: "Full story in the video.",
  },

  // ---------- Core 12 #10: Moving Furniture ----------
  {
    num: "10.1", core12: 10, type: "Story Teaser", lane: "Spotlight", durationSec: 50,
    hook: "You're not moving boxes. You're carrying someone's entire life through a doorway.",
    body: "[HOOK — Warm, reflective]\nI used to move furniture for a living. And I don't mean I worked for a moving company — I ran one. Me, a truck, and whoever I could convince to help that day.\n\n[BEAT]\nAnd here's what nobody tells you about moving: You're not moving boxes. You're carrying someone's entire life through a doorway. Their grandmother's china. Their kid's first drawings. The couch where they got proposed to.\n\n[SHIFT]\nThat job taught me more about trust, service, and business than any course I've ever taken.",
    cta: "Full story in the video.",
  },
  {
    num: "10.2", core12: 10, type: "Practical Takeaway", lane: "System", durationSec: 40,
    hook: "The first impression is physical.",
    body: "[HOOK — Teaching from experience]\nMoving furniture taught me a business principle I use every single day: The first impression is physical.\n\n[BEAT]\nBefore a customer trusts your expertise, they trust your presence. How you show up. How you handle their space. Whether you take your shoes off at the door. Whether you make eye contact.\n\n[SHIFT]\nIn video production, it's the same thing. Before a client trusts your creative vision, they trust how you make them feel in the room.",
    cta: "Full breakdown in the video.",
  },
  {
    num: "10.3", core12: 10, type: "Curiosity Hook", lane: "Reel", durationSec: 30,
    hook: "The best business lesson I ever learned came from carrying a piano up three flights.",
    body: "[HOOK — Unexpected connection]\nThe best business lesson I ever learned didn't come from a book, a podcast, or a mentor. It came from carrying a piano up three flights of stairs.\n\n[BEAT]\nAnd it has everything to do with why Palmer House exists today.",
    cta: "Full story — What Moving Furniture Taught Me About Business.",
  },
  {
    num: "10.4", core12: 10, type: "Problem/Aha", lane: "System", durationSec: 40,
    hook: "The service starts the moment you answer the phone.",
    body: "[HOOK — Naming it]\nYou know what most service businesses get wrong? They think the service starts when the work starts. It doesn't.\n\n[BEAT]\nThe service starts the moment you answer the phone. The moment you show up. The moment the customer decides whether they feel safe with you in their space.\n\n[SHIFT]\nMoving taught me that. Before I ever touched a piece of furniture, the customer was already deciding whether they trusted me. The work is secondary to the relationship.",
    cta: "Full video on the channel.",
  },
  {
    num: "10.5", core12: 10, type: "Myth Killer", lane: "Evergreen", durationSec: 35,
    hook: "'You need a business degree to run a business.' Come on now.",
    body: "[HOOK — Challenging]\n'You need a business degree to run a business.' Come on now.\n\n[BEAT]\nI learned more about operations, customer service, pricing, and trust from running a moving company with a rented truck than most people learn in four years of school.\n\n[SHIFT]\nThe classroom teaches theory. Service teaches survival. And survival teaches you what actually matters.",
    cta: "Whole journey in the full video.",
  },

  // ---------- Core 12 #11: Four Businesses ----------
  {
    num: "11.1", core12: 11, type: "Curiosity Hook", lane: "Reel", durationSec: 35,
    hook: "I run four businesses at the same time. Once you see the pattern, it makes sense.",
    body: "[HOOK — Acknowledging the absurdity]\nI run four businesses at the same time. And before you say 'that's insane' — yeah. I know. But here's the thing: they're not four random businesses. They're four expressions of the same idea.\n\n[BEAT]\nOnce you see the pattern, it makes perfect sense. And I think more entrepreneurs should think this way.",
    cta: "Whole ecosystem in the full video.",
  },
  {
    num: "11.2", core12: 11, type: "Practical Takeaway", lane: "System", durationSec: 45,
    hook: "Every business I run solves the same core problem through a different medium.",
    body: "[HOOK — Teaching]\nHere's how I think about running multiple ventures without losing my mind: Every business I run solves the same core problem through a different medium.\n\n[BEAT]\nPalmer House translates expertise through video. Jevoy Palmer translates it through strategy. YourBoyJevoy translates it through art. beSettld translates care through service.\n\n[SHIFT]\nSame root. Different branches. When you build from a unified thesis, multiple businesses stop competing for your attention and start feeding each other.",
    cta: "Full framework in the video.",
  },
  {
    num: "11.3", core12: 11, type: "Problem/Aha", lane: "System", durationSec: 40,
    hook: "'Pick one thing and focus.' What if your businesses aren't random?",
    body: "[HOOK — Naming the common struggle]\nEvery multi-passionate entrepreneur I know has the same problem: People keep telling them to 'pick one thing and focus.'\n\n[BEAT]\nAnd that advice makes sense — if your businesses are random. But what if they're not? What if they're all connected by a single thread? What if the 'scattered' feeling is actually a system that just hasn't been organized yet?",
    cta: "How I organized mine — full video.",
  },
  {
    num: "11.4", core12: 11, type: "Story Teaser", lane: "Spotlight", durationSec: 45,
    hook: "I drew a diagram. One page. And something clicked.",
    body: "[HOOK — Honest, vulnerable]\nThere was a point — maybe six months ago — where I genuinely thought I was doing too much. Four ventures. No traction on any of them. Everyone around me saying 'just pick one.'\n\n[BEAT]\nAnd then I sat down and drew a diagram. One page. And when I saw how everything connected — how each venture actually needed the others to work — something clicked.\n\n[SHIFT]\nI wasn't scattered. I was building an ecosystem. I just hadn't seen the architecture yet.",
    cta: "The diagram + full framework in the video.",
  },
  {
    num: "11.5", core12: 11, type: "Myth Killer", lane: "Evergreen", durationSec: 35,
    hook: "'Focus on one thing' can actually slow systems thinkers down.",
    body: "[HOOK — Challenging conventional wisdom]\n'Focus on one thing.' That's great advice — for some people. But for systems thinkers? For people who see connections between things? Forcing yourself into one lane can actually slow you down.\n\n[BEAT]\nThe key isn't fewer businesses. It's a clearer thesis. When the thesis is unified, multiple ventures become force multipliers, not distractions.",
    cta: "How — in Building Four Businesses at Once.",
  },

  // ---------- Core 12 #12: $120K Employee ----------
  {
    num: "12.1", core12: 12, type: "Curiosity Hook", lane: "Reel", durationSec: 30,
    hook: "A single video replaced a $120,000-a-year employee.",
    body: "[HOOK — Bold, direct]\nA single video replaced a $120,000-a-year employee. Not partially. Not 'helped reduce the workload.' Replaced.\n\n[BEAT]\nAnd it wasn't a marketing video. It wasn't a brand film. It was something way less glamorous — and way more powerful.",
    cta: "I tell you exactly what in the full video.",
  },
  {
    num: "12.2", core12: 12, type: "Problem/Aha", lane: "System", durationSec: 40,
    hook: "How many hours does your team spend repeating the same information?",
    body: "[HOOK — Naming the pain]\nHow many hours does your team spend training new hires? Answering the same questions? Walking people through the same process over and over?\n\n[BEAT]\nNow multiply that by every new employee, every new client, every new partner. That's not a training problem. That's a systems problem. And video is the cheapest, most scalable solution that exists.",
    cta: "How one company solved it — full video.",
  },
  {
    num: "12.3", core12: 12, type: "Practical Takeaway", lane: "System", durationSec: 45,
    hook: "Is there a person on your team whose primary job is repeating information?",
    body: "[HOOK — Teaching]\nIf you want to know whether video can replace a role in your business, ask yourself this: Is there a person on your team whose primary job is repeating information?\n\n[BEAT]\nNot creating new ideas. Not solving unique problems. But literally saying the same things to different people, over and over. Onboarding. Training. FAQ answering. Process explaining.\n\n[SHIFT]\nThat's not a person problem. That's a video problem. Film it once. Deploy it forever.",
    cta: "Full framework in the video.",
  },
  {
    num: "12.4", core12: 12, type: "Myth Killer", lane: "Evergreen", durationSec: 35,
    hook: "What if video is an operational investment, not a marketing expense?",
    body: "[HOOK — Reframing]\n'Video is a marketing expense.' That's how most businesses think about it. And that's why most businesses underinvest.\n\n[BEAT]\nWhat if video is actually an operational investment? What if the ROI isn't views and likes — it's hours saved, positions eliminated, and processes automated?\n\n[SHIFT]\nThe best video you'll ever make might never go viral. It might just save your company $120,000 a year.",
    cta: "Full story in the video.",
  },
  {
    num: "12.5", core12: 12, type: "Story Teaser", lane: "System", durationSec: 50,
    hook: "Three months of training. Replaced by a 12-video series.",
    body: "[HOOK — Setting the scene]\nA company reached out to me. They had a problem: every time they hired a new technician, it took three months and a dedicated trainer to get them up to speed. Three months. One full-time person doing nothing but training.\n\n[BEAT]\nWe filmed a 12-video training series. Took about two days. Clear, step-by-step, exactly how the senior techs do it.\n\n[SHIFT — the result]\nNew hire ramp-up time dropped to three weeks. And the trainer? Moved into a revenue-generating role.",
    cta: "Full case — The Video That Replaced a $120K Employee.",
  },
];

export function shortsForCore12(num: number): CoreShort[] {
  return CORE_SHORTS.filter((s) => s.core12 === num).sort((a, b) => a.num.localeCompare(b.num));
}

const TYPE_COLORS: Record<ShortType, string> = {
  "Curiosity Hook": "#a855f7",
  "Problem/Aha": "#f59e0b",
  "Practical Takeaway": "#10b981",
  "Myth Killer": "#ef4444",
  "Story Teaser": "#3b82f6",
};

export function colorForShortType(t: ShortType): string {
  return TYPE_COLORS[t];
}