// Gold-standard shorts approved by Jevoy (from "The Moment You Didn't Keep").
// These define the bar: staged, absurd-but-legible worlds with ONE actor (Jevoy),
// an escalating visual rule, a reveal the viewer discovers, and a business point
// that lands for owners — not an educational reel with better lighting.

export const GOLD_STANDARD_SHORTS = `
GOLD STANDARD A — "THE BUSINESS LOST-AND-FOUND"
Hook family: Absurd business-world encounter | Runtime 50-60s | Actor: Jevoy only
Props: lost-and-found counter; service bell; kiosk screen; filing drawers; hundreds of identical business cards; receipt printer
First-frame text: "My customers lost my business."
[JEVOY AT A WINDOW LABELED "CUSTOMER MEMORY — LOST & FOUND." HE RINGS THE BELL.]
"Hi. I think my customers lost my business."
[KIOSK BEEPS] KIOSK TEXT: DESCRIBE THE BUSINESS.
"It's the one that provides quality service you can trust."
[A DRAWER POPS OPEN, STUFFED WITH IDENTICAL CARDS.] "Right. Okay. We also care about our customers and go above and beyond."
[A SECOND, LARGER DRAWER OPENS.] "Locally owned?" [EVERY DRAWER OPENS AT ONCE.] "Okay, that somehow made it worse."
KIOSK TEXT: WHAT SHOULD A CUSTOMER REMEMBER YOU FOR? [HE OPENS HIS MOUTH, STOPS.] "That is the problem, isn't it?"
[TURNS TO CAMERA] "Business owners think customers are forgetting their posts. They're supposed to forget the posts. They're not supposed to forget what your name means when the problem shows up. But if every video says quality, trust, service, and excellence, their memory has nowhere to put you."
[A RECEIPT PRINTS.] INSERT — RECEIPT: ITEM STATUS: NOT LOST / NO DISTINCT MEMORY CREATED
"That is worse than lost. Lost means it was there." [LOOKS BACK AT THE WALL OF IDENTICAL CARDS.] "Give them something specific enough to keep."
END CARD: THE MOMENT YOU DIDN'T KEEP — Full investigation on the Palmer House channel.

GOLD STANDARD B — "THE DISAPPEARING BUSINESS"
Hook family: Visual magic | Runtime 45-55s | Actor: Jevoy only
Props: branded desk; logo; plant; practical set pieces that vanish on cut
First-frame text: "I can make a business disappear in five words."
"I can make this entire business disappear in five words. 'Quality service you can trust.'" [THE LOGO DISAPPEARS.]
"'We put customers first.'" [THE DESK DISAPPEARS.] "'We always go above and beyond.'" [THE BACKGROUND DISAPPEARS — JEVOY IN BLANK SPACE.]
"Nothing I said was bad. That is what makes it dangerous. Those words could belong to a plumber, an attorney, a dentist — or every company currently holding a stock-photo handshake. If I can replace your logo with your competitor's and the message still works, the content is not making you visible. It is helping you blend in."
[A CARD APPEARS IN HIS HAND.] "'When water reaches the basement floor at two in the morning, we answer.'" [THE SET REAPPEARS WITH ONE DISTINCT RED LIGHT.]
"Specificity gives the customer something to see. And something seen clearly has a chance of being remembered."
END CARD: THE MOMENT YOU DIDN'T KEEP — Palmer House Productions

GOLD STANDARD C — "THE BRAND LINEUP"
Hook family: Absurd identity test | Runtime 50-60s | Actor: Jevoy cloned into every position
Props: police-lineup wall; numbered placards; simple costume variations
First-frame text: "Your customer saw a business. Can they identify it?"
[FIVE JEVOYS IN A LINEUP.] OFFSCREEN: "Number one, step forward." JEVOY 1: "Quality service you can trust."
OFFSCREEN: "Number two." JEVOY 2: "Personalized solutions for every customer." OFFSCREEN: "Number three." JEVOY 3: "Committed to exceeding expectations."
OFFSCREEN: "Do you recognize the business you saw?" [BEAT. EVERY JEVOY QUIETLY POINTS AT HIMSELF.]
MAIN JEVOY TO CAMERA: "This is what most industries look like from the customer's side. Different logos. Different websites. The exact same description. If your customer cannot identify what only you would say, they did not see five businesses. They saw one business five times."
[JEVOY 5 STEPS FORWARD.] "When your child chips a tooth, call us before you leave the playground. We'll tell you exactly what to do." [A LIGHT ABOVE HIM TURNS GREEN.]
MAIN JEVOY: "There you are. Memory needs a distinguishing feature. Give yours one."
END CARD: THE MOMENT YOU DIDN'T KEEP — Full investigation on the Palmer House channel.
`.trim();

// Notes captured from Jevoy's rejections of weaker drafts.
export const GOLD_STANDARD_LESSONS = [
  "ONE actor only: Jevoy. Any other 'character' must be a machine, a kiosk screen, an offscreen voice Jevoy also plays, or a clone of Jevoy. Never cast a second person.",
  "Don't explain the thesis — stage a world where the thesis physically happens. The camera performs the idea; Jevoy reacts to it.",
  "Give the short ONE visual rule and escalate it 3 times (one drawer -> a bigger drawer -> every drawer). Never stack unrelated gags.",
  "Absurd, not chaotic. The viewer must be able to follow the situation in the first three seconds.",
  "Ambiguous poetry fails. Every short must land a point a business owner can act on today.",
  "The turn should be discovered (a printed receipt, a green light, a set reappearing), not delivered as a lecture.",
  "Earn one keeper line the whole short is built for — e.g. 'That is worse than lost. Lost means it was there.'",
  "Concrete specifics beat categories: chipped tooth on a playground, water on the basement floor at 2 a.m.",
  "No 'volume vs attention', no throwing content in the trash, no prop metaphor invented then forced to fit the thesis.",
  "Shootable solo in one location with locked-off cuts, simple graphics and sound design.",
].join("\n");
