/**
 * Real case-study copy for the five projects.
 *
 * Shape mirrors the `project` schema: meta fields plus exactly five sections
 * (About, Process, Challenges, Craft, Results), each with a heading, a body
 * paragraph and a shorter note. Media is attached separately once the real
 * shots exist — seeding leaves `media` empty and the section renders text-only.
 *
 * Consumed by `scripts/seed-cases.ts`.
 */

export interface CaseSectionSeed {
  kicker: string;
  heading: string;
  body: string;
  note: string;
}

export interface CaseSeed {
  slug: string;
  title: string;
  kicker: string;
  year: string;
  role: string;
  discipline: string;
  order: number;
  comingSoon: boolean;
  homeCardLabel: string;
  workCardSubtitle: string;
  homeAspect: "4 / 3" | "3 / 4";
  sections: CaseSectionSeed[];
}

export const cases: CaseSeed[] = [
  {
    slug: "orbit",
    title: "ORBIT",
    kicker: "Featured · 01",
    year: "2026",
    role: "Product & Interaction Design",
    discipline: "Product Design · Local-first AI",
    order: 0,
    comingSoon: false,
    homeCardLabel: "Orbit · Product Design",
    workCardSubtitle: "Product Design, Local-first AI",
    homeAspect: "4 / 3",
    sections: [
      {
        kicker: "About",
        heading: "The file you know you have",
        body: "A developer I interviewed searched for ChromaDB, then vector database, then architecture decision. The file was called ADR-004 and Spotlight cannot read inside a plain text file, so nothing came back. They had written it themselves, three weeks earlier. Orbit is the answer to that half hour: you describe what you are looking for, and it reads what is inside the file instead of matching the name. Nothing gets renamed, nothing gets moved, nothing leaves the machine.",
        note: "Self-directed, January to May, built at home. React and Three.js in front, FastAPI, ChromaDB and Ollama behind, plus a React Native companion.",
      },
      {
        kicker: "Process",
        heading: "Ten laptops, opened on the table",
        body: "A fourteen-question survey went out online and reached thirty working professionals across design, code, music, video and data. Ten talked to me afterwards, in person or over a call, with their real file systems open on screen, and I coded the transcripts thematically. Everyone described a system, then described the week it collapsed. A filmmaker keeps folders per project and finds things by sorting on date modified and hoping. Six raised privacy before I asked, each naming something specific: NDA-bound code, unreleased music, footage of people who never consented.",
        note: "87% regularly lose files they know they have; 80% have rebuilt one rather than keep hunting. The finding that redirected the project was the smallest one: nobody asked for better organising. They asked to find the thing.",
      },
      {
        kicker: "Challenges",
        heading: "The chat window had to go",
        body: "I designed a conversational assistant first, because in 2026 that is the obvious shape. One participant dismantled it in a sentence: they did not want a conversation, they wanted to type something and see their file. Retrieval is a utility, so the assistant became an overlay with one input. The first build then failed in ways that were entirely mine. The shortcut collided with Spotlight. Indexing ran silently, so people assumed it had stalled. Clicking outside the overlay threw away the results.",
        note: "One tester called that last behaviour the most frustrating interaction they had met in any app in recent memory. Retrieval completed at 80%, creating a Space at 70%, and every fix in v1.0 traces to a session rather than to my taste.",
      },
      {
        kicker: "Craft",
        heading: "State you feel before you read it",
        body: "The interface is deliberately cold: black panels, one orange reserved for anything actionable, mono type for paths, timestamps and scores. Orbit does not greet you or perform enthusiasm, because it should read as a good tool rather than a friendly companion. That left the problem of showing what the system was doing without a status bar. It ended up in one object. The orb breathes when idle, tightens as you type, pulses while it works, then slides left as results take the right of the screen.",
        note: "Retrieval stays under 500ms on a consumer laptop with CPU-only inference, where embedding eats about 70% of the budget. A packet capture across a full session recorded zero outbound calls, which is the only privacy claim worth making.",
      },
      {
        kicker: "Results",
        heading: "3.32 to 4.11 in ten days",
        body: "The same ten people ran the same three tasks on v1.0. Retrieval went to 100%, Spaces to 90%, and mean satisfaction from 3.32 to 4.11 out of five. Seven said they would put Orbit into their working week as it stood. The three who hesitated wanted the same missing thing: audio, video and image indexing, which the vector store already supports and the ingestion pipeline does not yet reach. That is the honest edge of the build.",
        note: "One developer found four files in the first ten minutes that they had been chasing on and off for a week. I went in expecting people to want better organising tools, and spent four months building the opposite.",
      },
    ],
  },
  {
    slug: "queue",
    title: "QUEUE",
    kicker: "Featured · 02",
    year: "2025",
    role: "UX Research & Multimodal Design",
    discipline: "Multimodal · AI & AR",
    order: 1,
    comingSoon: false,
    homeCardLabel: "Queue · Multimodal Design",
    workCardSubtitle: "UX Research, AI & AR",
    homeAspect: "3 / 4",
    sections: [
      {
        kicker: "About",
        heading: "The decision happens in the wait",
        body: "Two things go wrong in a salon and they are the same thing. Clients decide on a haircut from a photograph of somebody else's head, and they do it in the chair while the shop backs up behind them. Queue is a kiosk that moves the decision into the waiting time: it maps your face, renders styles onto you live, answers questions out loud, and hands a chosen look to your stylist before you sit down.",
        note: "Six weeks, built with Armaan Hawes. Camera, touch and voice, each carrying the part of the job it is actually good at.",
      },
      {
        kicker: "Process",
        heading: "Five interviews, one honest survey",
        body: "Five conversations gave us the failure in people's own words. A software engineer described leaving with blunt bangs that clashed with their face shape and called it a disaster. A stylist described the same gap from the other side of the chair: clients arrive with expectations built from pictures, and somebody has to bridge fantasy and reality before any cutting starts. A short survey shared online put numbers behind them. Seventy-eight percent could not judge what suited their face shape; sixty percent could not picture the outcome at all.",
        note: "Two-thirds called themselves only somewhat comfortable with AR, which we read as a warning rather than an endorsement. The interest was in seeing themselves, not in operating something novel.",
      },
      {
        kicker: "Challenges",
        heading: "Throwing away the app",
        body: "We designed this for a phone first, and user and faculty feedback took it apart. A phone screen is the wrong size for judging a haircut, and an app asks for a download at the exact moment someone is walking through a door. One interviewee had already told us they did not trust technology much and asked whether an app would be usable by someone who is not tech-savvy. We were quietly excluding the person who needed the visualisation most. The deeper problem was timing: an app used at home does nothing for the queue.",
        note: "Moving to a kiosk answered the business objection too. Shorter consultations, more appointments in a day, and a natural place to recommend the products that go with the look.",
      },
      {
        kicker: "Craft",
        heading: "Three inputs, three jobs",
        body: "The camera measures. A head scan returns structure, proportion, texture and skin condition as an overview rather than a verdict, because a system that tells someone their face is the wrong shape has failed at its only real task. Touch browses: style filmstrips, a colour row from blonde to blue-black, and a compare view holding two options side by side. Voice asks, and it is the entry point for anyone who would never have found a filter menu.",
        note: "Coral against white and black, Inter and Poppins, and screens sized for reading texture and length at arm's length rather than thumb distance.",
      },
      {
        kicker: "Results",
        heading: "What the waiting area is for",
        body: "The kiosk changes the shape of the visit. Time that produced nothing now produces a decision, and the stylist meets a client who has already narrowed the field instead of one holding a photograph and a hope. Both people end up looking at the same image, which is where real expertise finally has room to work rather than being spent on translation.",
        note: "What it does not have yet is a usability round, and I would rather say that than dress the pivot up as validation. Next: bring makeup, nails and skin to the level of hair, test the compare and voice flows properly, and write the privacy handling that face scanning in a commercial space owes its users.",
      },
    ],
  },
  {
    slug: "memory-bank",
    title: "MEMORY BANK",
    kicker: "Featured · 03",
    year: "2025",
    role: "UX Research & Product Design",
    discipline: "Product Design · Spatial",
    order: 2,
    comingSoon: false,
    homeCardLabel: "Memory Bank · Product Design",
    workCardSubtitle: "UX Research, Product Design",
    homeAspect: "3 / 4",
    sections: [
      {
        kicker: "About",
        heading: "A gallery forgets the feeling",
        body: "A photo library can tell you where you stood and when. It cannot tell you what the day felt like. Memory Bank ties a photo to the place it was taken, along with the note and the mood you attached to it, then hands the whole thing back when you walk past that spot again. It is private by default, and the map is the home screen rather than a filter buried in settings.",
        note: "Around 70% of digital photos are never opened again after the first week. In India, 82% of smartphone users store photos digitally and 27% revisit them in a given month.",
      },
      {
        kicker: "Process",
        heading: "Twelve surveys, five long conversations",
        body: "A survey went round twelve students online, and I sat down with whoever was willing to talk, one or two at a time, across five themes: how they capture, how they share, what places do to memory, what privacy means, and what they expect from a tool like this. Eight of the twelve did not organise photos at all. Ten were interested in revisiting memories through AR, and every interview attached the same condition to it: the moment it gets complicated, they are gone. One put it plainly, that AR is cool until it is too complicated, and then they get bored.",
        note: "A participant described passing their college café and having the memories simply arrive. Nobody described that happening while scrolling, and the gap between those two sentences became the product.",
      },
      {
        kicker: "Challenges",
        heading: "Cutting my favourite feature",
        body: "Then vs Now overlaid an old photo on the live camera with an opacity slider, and it was the most technically interesting thing in the build. Four of the five testers could not make sense of it. They fought the alignment, misread the slider, and could not say what it was for. Several also failed to find the visibility control, because they expected privacy to sit inside editing rather than down a separate settings path. The least confident tester said they got lost, and asked me to make it simpler.",
        note: "I removed the overlay entirely. Keeping it would have cost every user a little clarity to serve almost none of them, which is a bad trade however good the demo looks.",
      },
      {
        kicker: "Craft",
        heading: "Two screens became one",
        body: "Editing and note-taking had been separate actions, and every participant paid for that split on every pass. Merging them took a whole node out of the information architecture and gave visibility a home where people were already looking for it. The emotion chips each took their own colour after a user asked for it directly, so happy reads yellow and peaceful reads blue at a glance. A form field turned into something that looks like a feeling.",
        note: "Inter throughout, a 14 to 16px floor for body text, and a spatial capture that works on a normal phone camera rather than demanding a depth sensor.",
      },
      {
        kicker: "Results",
        heading: "Four minutes, or nine",
        body: "The spread in the test told me more than the average did. Confident users finished the tasks in four to five minutes and only stumbled on the advanced features; the least confident took nine and struggled throughout. Four of the five said they would use the app and the fifth said maybe, which is the honest result and the one that set the direction: the work left is not more features, it is fewer.",
        note: "The simplified build is the one that went to jury after the break. The strongest thing in it was never the spatial capture. It was a text field and a coloured tag under a photo, at the place where the photo happened.",
      },
    ],
  },
  {
    slug: "guitar-flow",
    title: "GUITAR FLOW",
    kicker: "Featured · 04",
    year: "2025",
    role: "Immersive Design & Unity Prototyping",
    discipline: "Mixed Reality · Interaction",
    order: 3,
    comingSoon: false,
    homeCardLabel: "Guitar Flow · Mixed Reality",
    workCardSubtitle: "Immersive Design, Unity",
    homeAspect: "4 / 3",
    sections: [
      {
        kicker: "About",
        heading: "Put the lesson on the instrument",
        body: "Almost everyone learning guitar alone is doing the same thing: watching a video of someone else's hands and trying to mirror it onto their own neck. Guitar Flow removes the translation step. Six string lines register against the real instrument, the string you need next lights up, and chord shapes appear as finger positions rather than diagrams. Strumming is tracked as motion, so timing becomes something the system can tell you about.",
        note: "Eight weeks, solo, from research to a build people could put on and play. Unity 6 for the MR scene, Blender for geometry, Figma for the interface.",
      },
      {
        kicker: "Process",
        heading: "Six learners and four papers",
        body: "Five of the six students I talked to learned mainly from YouTube. Four had tried a learning app and dropped it within a week, citing slow progress and nothing personal in the feedback. Three used tab notation and described the same difficulty translating from a screen to the strings. Then the literature said the same thing back to me from a decade of studies: system after system improved immersion and shipped without the one thing a learner alone in a room actually needs, which is being told they are wrong.",
        note: "One study scored 82 on the System Usability Scale and had most participants playing basic chords within an hour, then listed real-time auditory feedback as its main omission.",
      },
      {
        kicker: "Challenges",
        heading: "The headset gets in the way",
        body: "A HoloLens case study found no learning advantage over traditional teaching at all, with participants struggling past ten minutes of wear. In another, fret highlighting shown on a screen beat the head-mounted version, because a narrow field of view and visual clutter buried the one thing the learner needed to see. My own testing repeated it: the menu blended into the room behind it, and hand tracking held for open chords but lost the little finger on barre chords, which is exactly where a beginner needs correcting.",
        note: "Both testers asked for the same thing unprompted: tempo that slows itself when you struggle, instead of leaving you behind and calling it practice.",
      },
      {
        kicker: "Craft",
        heading: "Legible at arm's length",
        body: "Most of the work went into reading distance. Type that is comfortable on a desk disappears against a lit room, and depth lies on a flat monitor, so the overlay was tuned in the headset rather than in Figma. The active string ended up cyan against white because it survives a bright room and a dark one without ever reading as decoration. Everything that is not the next note sits one layer back.",
        note: "Menus, songs and lessons stay out of the way: a swipe in the air moves between them, a pinch pulls a chord closer when you want to inspect it.",
      },
      {
        kicker: "Results",
        heading: "The copying problem, closed",
        body: "Three players used the build. What landed was the part I was least sure of: overlays for chords read immediately, and real-time tabs during riffs gave one player the timing feedback they had never had while practising alone. The question changed shape too. Instead of asking how a chord is supposed to look, they started asking whether they were holding it right, which is the question the system can actually answer.",
        note: "Testing wrote the roadmap in order: panels that follow the player rather than the wall, finger-level correction, adaptive tempo, and a freestyle mode, since the players who liked it most both asked to stop being taught and start playing. The build was revised again over the break before it was shown.",
      },
    ],
  },
  {
    slug: "navaid",
    title: "NAVAID",
    kicker: "Featured · 05",
    year: "2024",
    role: "Product & Interface Design",
    discipline: "Assistive Tech · Hardware",
    order: 4,
    comingSoon: false,
    homeCardLabel: "Navaid · Assistive Tech",
    workCardSubtitle: "Product Design, Hardware",
    homeAspect: "4 / 3",
    sections: [
      {
        kicker: "About",
        heading: "Keep the chair, add the driving",
        body: "Autonomous wheelchairs exist. They cost more than most people can spend and they arrive as an entire new chair, which means giving up the one already fitted to your body. Navaid is the other route: a sensor and screen module that mounts to the chair someone already owns, drives it to a destination they picked, and lets a family member see where it went.",
        note: "India's 2011 census counted 26.8 million disabled people, 5.4 million of them with mobility-related disabilities. Most of those chairs are manual, and the cost of a manual chair is paid by the shoulders.",
      },
      {
        kicker: "Process",
        body: "A friend put me in touch with an artist who uses a manual chair daily, and we talked it through over a video call. What they described was never distance. It was cost. Ramps that satisfy a code somewhere still strain arms and shoulders several times a day, and a full day of propelling cuts short whatever was planned next. They own a modified car and still cannot stow the chair in a tight space without help. Galleries that call themselves accessible turn out to have doors with no opener and aisles too narrow to turn in.",
        heading: "One long interview, then the literature",
        note: "One conversation is one conversation, so the literature had to carry the rest: where autonomy genuinely helps is severe impairment, ageing users, cognitive load, and long unpredictable spaces like hospitals and airports.",
      },
      {
        kicker: "Challenges",
        heading: "Assistance without surveillance",
        body: "The caregiver app is the part that could go wrong quietly. Location sharing between a disabled adult and their family is support in one direction and monitoring in the other, so pairing is explicit and the app carries nothing beyond position and status. The system also does not pretend to replace a caregiver. Medication and routine checks stay human work. What autonomy removes is needing another person present for every trip down the street.",
        note: "That framing is also what makes it defensible financially: fewer hours of paid assistance over years, without asking anyone to give up the help they actually need.",
      },
      {
        kicker: "Craft",
        heading: "Built in MDF before pixels",
        body: "A screen you look at for hours is an ergonomics problem before it is an interface problem, so the module was built full size in MDF first, as a standalone model rather than mounted to a chair. The display landed at 195 by 135 millimetres on a stand that angles toward the user's head rather than sitting flat. On screen, sensor readings draw the surroundings on the left so you can see whether the system noticed the truck, and saved destinations sit on the right, changing between indoor and outdoor sets.",
        note: "Emergency Stop never leaves the screen. Everything else can be moved, resized or dropped, because a fixed layout assumes one kind of hand and one kind of reach.",
      },
      {
        kicker: "Results",
        heading: "Where the real limit sits",
        body: "The project ended with a physical model at real dimensions, a screen design tested against how a person actually sits, and an app that stays on the right side of the line between support and monitoring. It reframed the brief from building a better wheelchair to removing the reasons people cannot use the good ones.",
        note: "The engineering ceiling in assistive design is high and rising. The real limits are cost, the fear of giving up a chair that already fits, and interfaces built for a body that is not the one using them.",
      },
    ],
  },
];
