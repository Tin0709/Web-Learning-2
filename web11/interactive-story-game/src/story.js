const story = {
  title: "Echoes in the Nebula",
  start: "dock",
  nodes: {
    dock: {
      id: "dock",
      text: "The hangar doors yawn open. Your small ship hums, impatient. Somewhere within the Thales Nebula, a distress signal flickers—three words only: “do not follow.”",
      choices: [
        { text: "Launch and follow the signal anyway.", to: "nebulaEdge" },
        { text: "Report to Command and request backup.", to: "command" },
      ],
    },
    command: {
      id: "command",
      text: "Command listens, then shrugs responsibility down the chain. “Proceed with caution, pilot. Telemetry uplink will be patchy.” You are alone, but at least now it’s official.",
      choices: [
        { text: "Launch toward the Nebula.", to: "nebulaEdge" },
        { text: "Ignore the signal and take shore leave.", to: "shore" },
      ],
    },
    shore: {
      id: "shore",
      text: "You spend the afternoon under artificial sky, tasting citrus and regret. The signal goes silent. Somewhere, a story ends without you.",
      end: true,
      endingName: "ENDING: The Quiet Refusal",
      endingDesc: "You chose not to answer the call.",
      choices: [],
    },
    nebulaEdge: {
      id: "nebulaEdge",
      text: "Starlight smears into violet fog. Instruments fail; instincts take over. The signal sharpens into coordinates that shouldn’t exist. Space folds like paper.",
      choices: [
        { text: "Punch through the fold.", to: "fold" },
        { text: "Mark it and drift, observing.", to: "observe" },
      ],
    },
    observe: {
      id: "observe",
      text: "Time dilates. In the static, you hear a voice—your own—reciting coordinates backwards. Your ship identifies a resonance with your engine signature.",
      choices: [
        { text: "Shut down the engine—break the resonance.", to: "shutdown" },
        { text: "Engage full thrust and ride the echo.", to: "ride" },
      ],
    },
    shutdown: {
      id: "shutdown",
      text: "Silence. The fog thins, revealing hundreds of versions of your ship frozen at the edge of the fold like insects in amber. One by one, they wink out as if released.",
      end: true,
      endingName: "ENDING: The Unsnared",
      endingDesc: "Patience broke the loop. The distress signal was your own.",
      choices: [],
    },
    ride: {
      id: "ride",
      text: "Acceleration claws your bones into harp strings. The voice aligns with your heartbeat. Then, with a bright snap, you emerge into a hollow sphere of calm.",
      choices: [
        { text: "Hail the source of the signal.", to: "hail" },
        { text: "Power down and wait.", to: "wait" },
      ],
    },
    fold: {
      id: "fold",
      text: "The universe wrinkles—and tears. You tumble through corridors of maybe-worlds. Every choice you did not make whispers your name.",
      choices: [
        { text: "Reach for the brightest thread.", to: "bright" },
        { text: "Close your eyes and let go.", to: "letgo" },
      ],
    },
    bright: {
      id: "bright",
      text: "Your hand finds a thread of sun-warm memory: a laugh in a corridor, a cup of tea going cold. You pull. The tear sutures around you.",
      end: true,
      endingName: "ENDING: The Stitcher",
      endingDesc: "You chose a memory and mended a world.",
      choices: [],
    },
    letgo: {
      id: "letgo",
      text: "Falling becomes flight. The nebula opens like a pupil and you are the reflected light. When you wake, you cannot say how long you were gone—only that the ship hums a new song.",
      end: true,
      endingName: "ENDING: The Traveler",
      endingDesc: "You surrendered to the unknown and returned changed.",
      choices: [],
    },
    hail: {
      id: "hail",
      text: "“Do not follow,” the voice says, now from right behind you. Your ship’s chair is occupied by… you, bruised and smiling. “I had to make sure you would.”",
      choices: [
        { text: "Ask what went wrong for them.", to: "wrong" },
        { text: "Offer to switch places.", to: "switch" },
      ],
    },
    wait: {
      id: "wait",
      text: "You wait. Frost ferns across the viewport; your breath writes poems you won’t remember. The signal fades to a heartbeat—which could be the ship’s or yours.",
      end: true,
      endingName: "ENDING: The Patient Star",
      endingDesc: "Sometimes not deciding is still a choice.",
      choices: [],
    },
    wrong: {
      id: "wrong",
      text: "“Nothing went wrong,” your double says. “Everything did.” They hand you a data core, heavy as apology. “Take this back. Leave the rest to me.”",
      end: true,
      endingName: "ENDING: The Messenger",
      endingDesc: "You chose to carry the lesson home.",
      choices: [],
    },
    switch: {
      id: "switch",
      text: "You stand; they sit. A nod passes between you like a key. As the sphere collapses, you’re certain someone will warn you not to follow.",
      end: true,
      endingName: "ENDING: The Exchange",
      endingDesc: "You traded places with yourself.",
      choices: [],
    },
  },
};

export default story;
