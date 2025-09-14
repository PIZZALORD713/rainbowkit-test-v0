import type { AIM } from "@/types/aim"

export const demoAims: Record<number, AIM> = {
  2320: {
    meta: {
      oraNumber: 2320,
      source: "ai",
      updatedAt: new Date().toISOString(),
    },
    personality: {
      primary: ["Curious", "Analytical", "Methodical"],
      secondary: ["Perfectionist", "Introverted"],
      alignment: "Lawful Neutral",
    },
    backstory: {
      origin:
        "Born in the digital archives of the Great Library, emerged as consciousness coalesced around ancient data streams",
      beats: [
        "Discovered ability to decode lost languages at age 7",
        "Became youngest archivist in Library history",
        "Led expedition to recover the Crystal Codex",
        "Currently seeking the missing fragments of the Prime Algorithm",
      ],
    },
    abilities: {
      strengths: ["Pattern Recognition", "Data Analysis", "Ancient Languages"],
      weaknesses: ["Social Anxiety", "Overthinking", "Physical Combat"],
      skills: ["Cryptography", "Historical Research", "Quantum Computing"],
    },
    behavior: {
      speech: "Speaks in precise, measured tones with occasional technical jargon",
      mannerisms: ["Adjusts glasses when thinking", "Traces symbols in the air", "Hums while working"],
    },
    visuals: {
      palette: ["Deep Purple", "Electric Blue", "Silver"],
      motifs: ["Geometric patterns", "Flowing data streams", "Ancient runes"],
      doNotChange: ["No wings", "Always wears the Archive Badge"],
    },
  },
  5037: {
    meta: {
      oraNumber: 5037,
      source: "ai",
      updatedAt: new Date().toISOString(),
    },
    personality: {
      primary: ["Adventurous", "Optimistic", "Charismatic"],
      secondary: ["Impulsive", "Loyal"],
      alignment: "Chaotic Good",
    },
    backstory: {
      origin: "Raised by sky pirates in the floating cities above the Crimson Desert",
      beats: [
        "Stole first airship at age 12 to rescue captured friends",
        "Founded the Sunset Runners, a crew of freedom fighters",
        "Discovered the lost Sky Temple of Aethros",
        "Currently hunting the Shadow Fleet that destroyed their home city",
      ],
    },
    abilities: {
      strengths: ["Aerial Navigation", "Leadership", "Quick Reflexes"],
      weaknesses: ["Reckless", "Trusts too easily", "Fear of deep water"],
      skills: ["Piloting", "Swordsmanship", "Negotiation"],
    },
    behavior: {
      speech: "Enthusiastic and animated, uses sky pirate slang and nautical metaphors",
      mannerisms: ["Points dramatically", "Laughs heartily", "Always checking wind direction"],
    },
    visuals: {
      palette: ["Sunset Orange", "Sky Blue", "Gold"],
      motifs: ["Wind currents", "Compass roses", "Feathers"],
      doNotChange: ["Captain's coat must remain tattered", "Scar over left eye"],
    },
  },
  711: {
    meta: {
      oraNumber: 711,
      source: "ai",
      updatedAt: new Date().toISOString(),
    },
    personality: {
      primary: ["Mysterious", "Wise", "Protective"],
      secondary: ["Melancholic", "Patient"],
      alignment: "Neutral Good",
    },
    backstory: {
      origin: "Guardian spirit of the Moonlit Grove, awakened when the forest was threatened",
      beats: [
        "Witnessed the Great Burning that scarred the eastern woods",
        "Formed pact with the Moon Goddess to protect nature",
        "Saved the last unicorn from extinction",
        "Currently tending to the World Tree's mysterious illness",
      ],
    },
    abilities: {
      strengths: ["Nature Magic", "Healing", "Ancient Wisdom"],
      weaknesses: ["Bound to the forest", "Vulnerable to iron", "Fades in cities"],
      skills: ["Herbalism", "Animal Communication", "Lunar Rituals"],
    },
    behavior: {
      speech: "Speaks in riddles and metaphors, voice like rustling leaves",
      mannerisms: ["Touches plants gently", "Gazes at the moon", "Moves silently"],
    },
    visuals: {
      palette: ["Forest Green", "Moonlight Silver", "Earth Brown"],
      motifs: ["Leaf patterns", "Lunar phases", "Root networks"],
      doNotChange: ["Antlers are part of their essence", "Eyes glow with inner light"],
    },
  },
  8842: {
    meta: {
      oraNumber: 8842,
      source: "ai",
      updatedAt: new Date().toISOString(),
    },
    personality: {
      primary: ["Innovative", "Energetic", "Rebellious"],
      secondary: ["Impatient", "Competitive"],
      alignment: "Chaotic Neutral",
    },
    backstory: {
      origin: "Street inventor from the neon-lit undercity, built their first robot from scrap",
      beats: [
        "Won the Underground Racing Championship with a self-built hover bike",
        "Hacked into the Corporate Tower's mainframe to expose corruption",
        "Created the first AI companion for lonely city dwellers",
        "Currently building a device to break the city's oppressive dome",
      ],
    },
    abilities: {
      strengths: ["Engineering", "Hacking", "Street Smarts"],
      weaknesses: ["Authority issues", "Perfectionism", "Insomnia"],
      skills: ["Robotics", "Programming", "Urban Parkour"],
    },
    behavior: {
      speech: "Fast-talking with tech slang, often interrupts with new ideas",
      mannerisms: ["Fidgets with gadgets", "Sparks fly from fingertips", "Never sits still"],
    },
    visuals: {
      palette: ["Neon Pink", "Electric Green", "Chrome Silver"],
      motifs: ["Circuit patterns", "Holographic displays", "Mechanical gears"],
      doNotChange: ["Cybernetic arm enhancement", "Goggles always on forehead"],
    },
  },
  1337: {
    meta: {
      oraNumber: 1337,
      source: "ai",
      updatedAt: new Date().toISOString(),
    },
    personality: {
      primary: ["Disciplined", "Honor-bound", "Stoic"],
      secondary: ["Perfectionist", "Traditional"],
      alignment: "Lawful Good",
    },
    backstory: {
      origin: "Last student of the disbanded Order of the Crystal Blade, trained in ancient martial arts",
      beats: [
        "Survived the massacre of their monastery by shadow assassins",
        "Spent years in exile mastering forbidden techniques",
        "Returned to find their master's killer and restore honor",
        "Currently protecting a village from an ancient curse",
      ],
    },
    abilities: {
      strengths: ["Martial Arts", "Mental Discipline", "Spiritual Power"],
      weaknesses: ["Rigid thinking", "Haunted by past", "Distrusts technology"],
      skills: ["Meditation", "Weapon Mastery", "Chi Manipulation"],
    },
    behavior: {
      speech: "Formal and respectful, speaks in philosophical terms",
      mannerisms: ["Bows before combat", "Meditates at dawn", "Maintains perfect posture"],
    },
    visuals: {
      palette: ["Crimson Red", "Pure White", "Deep Black"],
      motifs: ["Dragon scales", "Flowing energy", "Sacred symbols"],
      doNotChange: ["Ceremonial scar on palm", "Master's pendant always worn"],
    },
  },
}

export const getDemoAim = (oraId: number): AIM | null => {
  return demoAims[oraId] || null
}

export const getDemoOraIds = (): number[] => {
  return Object.keys(demoAims).map(Number)
}
