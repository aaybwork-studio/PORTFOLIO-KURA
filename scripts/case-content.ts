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
        heading: "Find it, don't file it",
        body: "Thirty people told me the same thing in different words. They know the file exists, they made it last Tuesday, and they cannot remember what they called it. Orbit is a retrieval layer for the files you already have: you describe what you are looking for in plain language, and it reads what is inside the file instead of matching the name. Nothing is renamed, nothing is moved, and nothing leaves the machine to make it work.",
        note: "Graduation project, four months, solo. React and Three.js on the front, FastAPI, ChromaDB and Ollama behind it, plus a React Native companion.",
      },
      {
        kicker: "Process",
        heading: "Thirty surveys, ten open laptops",
        body: "A fourteen-question survey reached thirty working professionals across design, code, music, video and data. Ten of them sat with me afterwards with their real file systems open on screen, and I coded the transcripts thematically. Eight themes came out. Everyone had a system and everyone described the moment it broke. Six raised privacy without being asked, each naming something specific: NDA-bound code, unreleased music, footage of people who never consented, research transcripts.",
        note: "87% regularly lose files they know they have. 80% have rebuilt one from scratch rather than keep hunting. The finding that changed the project was the smallest: people did not want to organise better, they wanted to find the thing.",
      },
      {
        kicker: "Challenges",
        heading: "Killing the chat window",
        body: "The obvious build was a conversational assistant, and testing took it apart. One participant said he did not want a conversation, he wanted to type something and see his file. That became a rule the product never broke. The first working build then failed in ways that were entirely mine: the shortcut collided with Spotlight, indexing ran with no visible progress so people assumed it had stalled, and clicking outside the overlay threw the results away.",
        note: "Task completion sat at 80% on retrieval and 70% on creating a Space. Every fix in version 1.0 traces back to one of those sessions rather than to my own taste.",
      },
      {
        kicker: "Craft",
        heading: "State you feel instead of read",
        body: "The interface is deliberately cold. Black panels, one orange reserved for anything actionable, and mono type for paths, timestamps and scores. Orbit never greets you and never performs enthusiasm, because it should read as a good tool rather than a friendly companion. System state lives in a single object: the orb breathes when idle, tightens as you type, pulses while it works, then slides left as the results take the right of the screen.",
        note: "Retrieval stays under 500ms on a consumer laptop with CPU-only inference. A packet capture through a full session recorded zero outbound calls, which is the only proof of privacy worth offering.",
      },
      {
        kicker: "Results",
        heading: "3.32 to 4.11",
        body: "Ten days after the first round, the same ten participants ran the same tasks on version 1.0. Retrieval hit 100%, Spaces reached 90%, and mean satisfaction moved from 3.32 to 4.11 out of five. Seven said they would put Orbit into their working week as it stood. The three who hesitated all wanted the same missing piece: audio, video and image indexing, which the vector store already supports and the ingestion pipeline does not yet reach.",
        note: "One developer found four files in his first ten minutes that he had been chasing on and off for a week. I went in expecting people to ask for better organising tools. They asked for the opposite.",
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
        body: "The interviews gave us the failure in people's own words. A software engineer described leaving with blunt bangs that fought her face shape. A stylist described the same gap from her side of the chair: clients arrive with expectations built from pictures, and somebody has to walk them back before any cutting starts. The survey put numbers on it. Seventy-eight percent could not judge what suited their face shape, sixty percent could not picture the outcome at all.",
        note: "Two-thirds called themselves only somewhat comfortable with AR, which we read as a warning rather than an endorsement. The interest was in seeing themselves, not in operating something novel.",
      },
      {
        kicker: "Challenges",
        heading: "Throwing away the app",
        body: "We spent three weeks designing this for a phone before user and faculty feedback took it apart. A phone screen is the wrong size for judging a haircut, and an app asks for a download at the exact moment someone is walking through a door. One interviewee had already told us he did not trust technology much, which meant the design was quietly excluding the person who needed it most. The deeper problem was timing: an app used at home does nothing for the queue.",
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
        body: "I surveyed twelve students and interviewed across five themes: how they capture, how they share, what places do to memory, what privacy means to them, and what they expect from a tool like this. Eight of the twelve did not organise photos at all. Ten were interested in an AR way of revisiting them, with one firm condition attached in every interview: the moment it gets complicated, they are gone.",
        note: "A participant described walking past his college café and having the memories simply arrive. Nobody described that happening while scrolling, and that gap became the product.",
      },
      {
        kicker: "Challenges",
        heading: "Cutting my favourite feature",
        body: "Then vs Now overlaid an old photo on the live camera with an opacity slider, and it was the most technically interesting thing in the build. Four of five participants could not make sense of it. They fought the alignment, misread the slider, and could not say what it was for. Several also failed to find the visibility control, because they expected privacy to live inside editing rather than down a separate settings path.",
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
        heading: "Capture in under a minute",
        body: "The rebuilt flow does one thing well. Capture takes under a minute, revisiting takes a single tap from a notification, and nothing leaves the phone unless you deliberately widen it. Every participant said they would use it, including the one who had struggled through the first round, once he saw the simplified pass.",
        note: "The strongest thing in the prototype was never the spatial capture. It was a text field and a coloured tag sitting under a photo, at the place where the photo happened.",
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
        body: "Five of six students I interviewed learned mainly from YouTube. Four had tried a learning app and dropped it within days, citing slow progress and nothing personal in the feedback. Three used tab notation and described the same difficulty getting from a screen to the strings. The literature had been circling the same missing piece for a decade: system after system improved immersion and shipped without the ability to tell a learner they were wrong.",
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
        body: "Guidance placed on the instrument does what video cannot. Beginners stopped asking how a shape looks and started asking whether they were holding it right, which is a much more useful question and one the system can actually answer. Real-time tabs during riffs gave one player the timing feedback he had never had while practising alone.",
        note: "Testing also wrote the roadmap in order: panels that follow the player rather than the wall, finger-level correction, adaptive tempo, and a freestyle mode, because the two who liked it most both asked to stop being taught and start playing.",
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
        heading: "One long interview, then the literature",
        body: "I interviewed an artist who uses a manual chair daily, and what he described was not distance, it was cost. Ramps that satisfy a code somewhere still strain arms and shoulders several times a day. A full day of propelling cuts short whatever was planned next. He owns a modified car and still cannot stow the chair in a tight space alone. Galleries that call themselves accessible turn out to have doors with no opener and aisles too narrow to turn in.",
        note: "The research then filled in where autonomy genuinely helps: severe impairment, ageing users, cognitive load, and long unpredictable spaces like hospitals and airports.",
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
        body: "A screen you look at for hours is an ergonomics problem before it is an interface problem, so the module was built full size in MDF first. The display landed at 195 by 135 millimetres on a stand that angles toward the user's head rather than sitting flat. On screen, sensor readings draw the surroundings on the left so you can see whether the system noticed the truck, and saved destinations sit on the right, changing between indoor and outdoor sets.",
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
