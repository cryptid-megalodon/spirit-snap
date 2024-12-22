package image_processor

import "strings"

const humanReadablePrompt = `
Imagine a new creature based on the subject of this image. Create a
cohesive name, description and a prompt for an image generation model
that will generate an image for the creature. Imagine creative traits and features
about the monster that highlight or modify the subject's appearance in the prompt.
The image should have a vibrant anime art style.`

var prompt = strings.ReplaceAll(humanReadablePrompt, "\n", " ")

const humanReadableCreatureNamePrompt = `
Create a name for a creature in a game, following these guidelines:

1. **Portmanteau and Fusion Words**: Combine two or more words related to the creature’s abilities, appearance, or type. For example, a plant-reptile creature could be named "Floragon" (flora + dragon) or "Leafor" (leaf + roar).

2. **Sound Mimicry**: Use sounds that resemble or evoke the creature’s characteristics. For a quick, agile creature, consider a name with snappy or sharp sounds like "Zapet" or "Flink."

3. **Descriptive Elements**: Include words or syllables that hint at the creature’s elemental type, habitat, or behavior. For a fire-breathing canine, a name like "Blazehound" or "Inferfang" could convey its fiery, fierce nature.

4. **Phonetic Appeal**: Make the name catchy, short, and easy to say. Simple, memorable names like "Mondo" or "Peblar" are easy to remember and give the creature a unique identity.

5. **Playful Alliteration and Rhyming**: Consider names that rhyme or use repetition to add charm, like "Scorpy Pounce" for a scorpion-like creature, or "Fluffyflame" for a gentle fire creature.

6. **Cultural and Linguistic References**: Draw inspiration from mythological, linguistic, or cultural references that match the creature's background or lore. For example, "Drakonis" might be a name for a dragon-inspired creature, borrowing from ancient mythology.

### Examples:
- For a water-dwelling snake, you could create names like "Aquasnake," "Hydravine," or "Ripcoil."
- For an icy bird, names could include "Frostfeather," "Glaciawl," or "Snowflap."
- For a creature with electricity-based powers, try names like "Boltstrike," "Zapico," or "Electross."

Use these ideas to create a name that feels both imaginative and descriptive, helping players instantly connect with the creature’s nature and abilities.`

var creatureNamePrompt = strings.ReplaceAll(humanReadableCreatureNamePrompt, "\n", " ")

const humanReadableSpritePrompt = `
Create a text-to-image prompt for a creature sprite in a game, incorporating the following guidelines to capture an imaginative, pixel-art style. Aim for a design that is compact, visually engaging, and communicates the creature’s unique traits.

1. **Compact and Expressive Design**: Describe the creature’s defining features, colors, and shape so that it’s clear in a small, pixelated form. Focus on elements that communicate personality, such as a happy expression, a fierce stance, or a mischievous glint in the eyes.

2. **Stylized Proportions**: Emphasize unique features by suggesting enlarged or stylized proportions. For example, if it’s a fast creature, suggest long limbs; if it’s a wise creature, suggest large eyes or an owl-like head.

3. **Whimsical and Surprising Elements**: Include one or two imaginative twists, such as unusual limbs, elemental features (like flames, ice crystals, or vines), or magical accessories. For example, “A small lizard with a flaming tail” or “An owl with branches instead of wings.”

4. **Vibrant Color Palettes**: Specify colors that reflect the creature’s elemental or personality traits (e.g., fiery reds and oranges, earthy greens and browns, icy blues and whites). Mention color accents that enhance these traits, like “a bright red shell with yellow spikes.”

5. **Expressive Poses or Subtle Animations**: Suggest an expressive pose that hints at the creature’s character, such as a “confident, forward stance” for a brave creature or a “playful, crouching position” for a shy one. If animated, mention small, repetitive movements, like a flickering tail or blinking eyes.

6. **Detail and Minimalist Shading**: Mention basic shading and details to give dimension without over-complicating the sprite. For example, “Add light shadowing under its feet for depth” or “Use simple highlights to suggest a glossy, metallic surface.”

### Example Prompts:
- "A small, chubby dragon with a rounded snout, large, friendly eyes, and tiny wings. It has green scales with light yellow highlights and a curled tail. In a playful, seated pose, looking up with curiosity."
- "A fierce, fox-like creature with sharp red fur, blue lightning bolt markings, and narrowed yellow eyes. The sprite is small but includes a dynamic, lunging pose to show its speed."
- "A plant-inspired creature, resembling a turtle with leaves growing from its back. It has a gentle expression, with vibrant green shell and earthy brown legs. The sprite is facing forward with a peaceful pose."

Create a prompt with these elements to capture the creature’s defining features and overall personality while keeping the design simple, expressive, and suitable for a pixel-art sprite.`

var spritePrompt = strings.ReplaceAll(humanReadableSpritePrompt, "\n", " ")

const humanReadablePhotoObjectPrompt = `
What is the object in this photo?`

var photoObjectPrompt = strings.ReplaceAll(humanReadablePhotoObjectPrompt, "\n", " ")

const humanReadableDescriptionPrompt = `
Create a new entry for this creature in the monster encyclopedia, the intent should
be to give readers a meaningful glimpse into the creature’s life cycle,
behaviors, or unique attributes in a way that feels both credible and
enchanting. Each entry should provide a standalone insight, highlighting
either an aspect of the creature’s appearance, abilities, or behavior. When
creating entries for new creatures, authors might aim to blend the familiar
and the fantastical, grounding each creature in an observable, relatable
behavior that invites players to imagine the creature’s life in its world
while hinting at its powers or evolutionary potential.`

var descriptionPrompt = strings.ReplaceAll(humanReadableDescriptionPrompt, "\n", " ")

const humanReadablePrimaryTypePrompt = `
Select the creature type that best represents the creature's style and captures
its natural elemental affinities.`

var primaryTypePrompt = strings.ReplaceAll(humanReadablePrimaryTypePrompt, "\n", " ")

const humanReadableSecondaryTypePrompt = `
If the creature has a compelling secondary type that adds more character, pick
a secondary type. Otherwise pick "None". A single type can be more compelling
if it's a strong fit for the creature's lore or background.`

var secondaryTypePrompt = strings.ReplaceAll(humanReadableSecondaryTypePrompt, "\n", " ")

const humanReadableHeightPrompt = `
Calculate the creature's height based on its physical description and lore. Height should be the number of centimeters.`

var heightPrompt = strings.ReplaceAll(humanReadableHeightPrompt, "\n", " ")

const humanReadableWeightPrompt = `
Calculate the creature's weight based on its physical description and lore. Weight should be the number of kilograms.`

var weightPrompt = strings.ReplaceAll(humanReadableWeightPrompt, "\n", " ")

const humanReadableStrengthPrompt = `
Calculate the creature's Strength based on its physical description, lore, and capabilities. Strength determines physical attack power and how much damage it can deal in physical moves.`

var strengthPrompt = strings.ReplaceAll(humanReadableStrengthPrompt, "\n", " ")

const humanReadableToughnessPrompt = `
Calculate the creature's Toughness based on its physical resilience, build, and lore. Toughness reduces the damage taken from physical attacks.`

var toughnessPrompt = strings.ReplaceAll(humanReadableToughnessPrompt, "\n", " ")

const humanReadableAgilityPrompt = `
Calculate the creature's Agility based on its speed, grace, and lore. Agility determines turn order in battles and increases the chance to dodge incoming attacks.`

var agilityPrompt = strings.ReplaceAll(humanReadableAgilityPrompt, "\n", " ")

const humanReadableArcanaPrompt = `
Calculate the creature's Arcana based on its mental or supernatural abilities, description, and lore. Arcana governs special attack power for mental or energy-based moves.`

var arcanaPrompt = strings.ReplaceAll(humanReadableArcanaPrompt, "\n", " ")

const humanReadableAuraPrompt = `
Calculate the creature's Aura based on its magical or supernatural resistance, description, and lore. Aura represents special defense, reducing the impact of mental or energy-based attacks.`

var auraPrompt = strings.ReplaceAll(humanReadableAuraPrompt, "\n", " ")

const humanReadableCharismaPrompt = `
Calculate the creature's Charisma based on its charm, persuasive nature, and lore. Charisma influences interactions, charm-based moves, and the ability to gain favor or allies.`

var charismaPrompt = strings.ReplaceAll(humanReadableCharismaPrompt, "\n", " ")

const humanReadableIntimidationPrompt = `
Calculate the creature's Intimidation based on its fearsome traits, imposing presence, and lore. Intimidation impacts an opponent's morale, increasing the likelihood of errors or lowering their stats temporarily.`

var intimidationPrompt = strings.ReplaceAll(humanReadableIntimidationPrompt, "\n", " ")

const humanReadableEndurancePrompt = `
Calculate the creature's Endurance based on its size, stamina, and lore. Endurance governs the monster's energy and how many attacks it can perform before needing to rest.`

var endurancePrompt = strings.ReplaceAll(humanReadableEndurancePrompt, "\n", " ")

const humanReadableLuckPrompt = `
Calculate the creature's Luck based on its lore and any traits that suggest unpredictability or fortune. Luck affects critical hits, dodges, and random outcomes during battles or events.`

var luckPrompt = strings.ReplaceAll(humanReadableLuckPrompt, "\n", " ")

const humanReadableHitPointsPrompt = `
Calculate the creature's Hit Points based on its size, build, and lore. Hit Points represent the number of hits the creature can take before being defeated.`

var hitPointsPrompt = strings.ReplaceAll(humanReadableHitPointsPrompt, "\n", " ")
