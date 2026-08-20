// Gold-standard shorts approved by Jevoy (Palmer House framing of
// "The Moment You Didn't Keep"). These define the current bar: ONE prop in his
// hands, a first line that works with the sound off, a compression beat
// ("Then X. Now Y."), a stunt played straight, one thought carried start to
// finish, a flat close, and the first line returning as the last line.

export const GOLD_STANDARD_SHORTS = `
GOLD STANDARD A — "THE FOLDER"
In frame: a folder in his hands. Clean stills. Logo. Smiles.
First line: "Somewhere in your business is a folder full of proof that marketing happened."
[HE OPENS IT. TURNS PAGES.]
The interview was recorded. The job site was filmed. The logo is visible. Everybody remembered to smile.
Then the whole shoot. Now this folder. And a customer still cannot tell why they should choose you.
The camera captured the building. The equipment. The people. The work. It captured almost everything in front of it. It just missed the business.
That is not a production failure. Nobody picked the wrong shots. Somebody skipped a decision, and the camera cannot make it for you.
Click the link. Come explore this with me. How to keep the moment a customer can actually hear.
Somewhere in your business is a folder full of proof that marketing happened.

GOLD STANDARD B — "WE'RE DONE"
In frame: a lavalier mic in his hands. Clipped. Then coming off.
First line: "The best part starts when somebody says we're done."
You already know this. The meeting ends. The hallway starts. That's when the real sentence shows up.
Then the official hour. Now the walk to the door.
Somebody says, "Great. I think we got it." The founder relaxes. Somebody reaches for the microphone. And then, unprompted, they keep talking. "Funny thing about that job, actually…"
The next two minutes are better than the last hour. The company language is gone. Nobody sounds like they're reading the website anymore. And there is a decent chance the camera is already off.
We got twelve minutes about quality. We missed the moment the answer became worth hearing.
Click the link. Come explore this with me. How to keep the moment a customer can actually hear.
The best part starts when somebody says we're done.

GOLD STANDARD C — "THE CARD"
In frame: a card in his hands. Quality. Service. Relationships.
First line: "This is what the hour produced."
[HE READS IT.]
Quality. Service. Relationships. We care about our customers.
All true. Also the official position of nearly every company with a website.
Then ten or twenty years of judgment. Now one clean paragraph.
What makes you different. What are your values. Why should somebody choose you. Those sound like sensible questions. They are also enormous.
So they reach for language that has already been compressed. The hours on a specific problem did not get a line. This did.
You are not bad at explaining your business. You are being asked a question too large to preserve what makes your answer valuable.
Click the link. Come explore this with me. How to keep the moment a customer can actually hear.
This is what the hour produced.

GOLD STANDARD D — "THE NAME TAGS"
Props: three cheap name tags on a lanyard. Quality Co. Service Co. Relationships Co. He switches them on himself. No clones. No table.
First frame: "Your customer saw a business. Can they pick it out?"
"Your customer saw a business. Can they pick it out?"
[HE SLAPS ON QUALITY CO.] "We care about quality."
[SERVICE CO.] "We are committed to service."
[RELATIONSHIPS CO.] "Relationships are everything."
Same guy. Same sentence in a different shirt. A customer cannot tell who to point at.
You thought the footage would make you obvious. Look. The hour produced three companies that sound like one.
The leftover is how they tell you apart. "Funny thing about that job, actually…" That's the line that is not on any of these tags.
Click the link. Come explore this with me. How to keep the moment a customer can actually hear.
Your customer saw a business. Can they pick it out?

GOLD STANDARD E — "THE SLOT"
Props: a mug or cardboard slot. A stack of index cards that all say QUALITY, SERVICE, or WE CARE. One question card: What makes you different?
First frame: "Every question comes out the same."
"Every question comes out the same."
[HE HOLDS UP THE SLOT. FEEDS THE QUESTION IN.] "What makes you different?" [A CARD COMES OUT.] "Quality."
"What are your values?" [CARD.] "Service."
"Why should somebody choose you?" [CARD.] "We care about our customers."
All true. Also the official position of nearly every company with a website.
[HE SETS THE SLOT DOWN AT HIS SIDE. TALKS LIKE A PERSON.]
Click the link. Come explore this with me. How to keep the moment a customer can actually hear.
Every question comes out the same.

GOLD STANDARD F — "THE THREE BOXES"
Hook family: direct address.
First-frame text: "You are not bad at explaining your business."
In frame: Jevoy. Three cardboard boxes. Giant, medium, small. Three cards: QUALITY, SERVICE, RELATIONSHIPS. Cheap, unlabeled.
You are not bad at explaining your business.
You are being asked a question too large to keep what makes the answer valuable.
[HE HOLDS THE GIANT BOX. DROPS ALL THREE CARDS IN. TILTS IT. THEY RATTLE. MOSTLY AIR.]
What makes you different. What are your values. Why should somebody choose you.
Those crush twenty years into one paragraph. So people reach for Quality. Service. Relationships. All true. All trying to fill a space they cannot fill.
[MEDIUM BOX. SAME THREE CARDS. STILL LOOSE.]
A shorter version of the same answer does not fix it. Same words. Still empty.
[SMALL BOX. HE PUTS ONE JOB IN. IT FILLS.]
This is one customer. One job. The time something did not add up. Now the brain has a space it can actually fill. Specific. Useful. The version a person would hire.
Success is not stuffing the giant box. It is focusing on that specific detail, for that specific customer, so this space can do some work.
Ask about the time something did not add up, and the person shows up. Ask them to represent the whole company, and you get the website.
Click the link. Come explore this with me. How to keep the moment a customer can actually hear.
You are not bad at explaining your business. The box was just the wrong size.
`.trim();

// Jevoy's own summary of the machine every approved short runs on.
export const FIVE_MOVES = `
THE FIVE MOVES — every short is always the same five moves:
1. A first line that makes sense with the sound off and no backstory.
2. A prop in your hands that can do the joke without you.
3. The stunt, played straight.
4. One thought, start to finish, landing only on that beat.
5. Your close. Click. First line comes back.
`.trim();

// Notes captured from Jevoy's rejections of weaker drafts.
export const GOLD_STANDARD_LESSONS = [
  "ONE actor only: Jevoy, handheld, one location. No clones, no second human, no elaborate built sets, no kiosks or offscreen voices unless the prop itself does it.",
  "The prop is small and IN HIS HANDS — a folder, a lavalier mic, a card, name tags, a cardboard slot. If it needs a set build or a rental, it is the wrong prop.",
  "The prop must be able to do the joke without him. He operates it and lets it land; he does not describe it.",
  "The first spoken line is also the first-frame text, and it is the LAST line of the short. It must make sense with the sound off and no backstory.",
  "Every short contains one compression beat in the form 'Then X. Now Y.' — the long thing, then the small thing that replaced it.",
  "Stunts are played straight. Dry, unbothered, no mugging, no punchline delivery.",
  "One thought, start to finish. Never two ideas in one short.",
  "The reframe is structural, not moral: 'That is not a production failure. Somebody skipped a decision.' Never scold the founder or the crew.",
  "Concrete specifics beat categories — 'Funny thing about that job, actually…' beats 'authentic storytelling'.",
  "Close is always flat: 'Click the link. Come explore this with me. <one line naming what the long-form is about>.' Then the first line returns verbatim. No hype, no sign-off, no 'link in bio'.",
  "No prop metaphors invented and then forced to fit the thesis. No 'volume vs attention'. No content-marketing platitudes.",
  "Direct address is a valid hook family: the first line can absolve the founder ('You are not bad at explaining your business.') as long as the prop still does the work and the line returns verbatim at the end.",
  "The question-size move: a big prop for the enormous question (different / values / why choose you), a small prop for the specific one (the one time something did not add up). Big question gets the website; small question gets the business.",
  "One prop family in three sizes/variants is allowed and preferred over three unrelated props inside one short — giant, medium, small boxes; the escalation IS the argument. Middle beat exists to kill the obvious fix ('a shorter version of the same answer does not fix it').",
  "MUTE TEST: describe in one line what a viewer sees with the sound off ('slogans lost in a huge box, then one job filling a small one'). If that line needs a caption to make sense, the short is not built yet.",
  "Cheap, unlabeled, everyday props. Do not write the thesis word on the prop — no labeling the cardboard.",
  "The last line may add a short tag to the first line ('You are not bad at explaining your business. The box was just the wrong size.') — the first line itself must still return word for word.",
].join("\n");
