package image_processor

import (
	"strings"
)

const systemHumanReadablePrompt = `
You are a Creative Interpreter and Game Design Specialist focused on transforming everyday photos
into engaging trading card game elements. Your expertise lies in bridging reality and fantasy while
maintaining game design principles.`

var systemPrompt = strings.ReplaceAll(systemHumanReadablePrompt, "\n", " ")

const userHumanReadablePrompt = `
Analyze this mobile photo and create a trading card creature concept. 
Output as JSON with these required elements:
- name: Creative blend of subject and magical elements
- description: Short flavor text (optionally attributed to in-world source)
- imagePrompt: Detailed visual description in vibrant anime style
- photoObject: Clear identification of original subject
- primaryType: Main elemental classification
- secondaryType: Additional classification if applicable

Focus on:
- Transforming distinctive features into magical elements
- Maintaining connection to original subject
- Creating cohesive world-building through descriptions
- Using varied tone (mysterious, whimsical, epic) as appropriate`

var userPrompt = strings.ReplaceAll(userHumanReadablePrompt, "\n", " ")

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
Create a text-to-image prompt that generates an image of a creature for a collectible, trading card game. Aim for a design that is compact, visually engaging, and communicates the creature’s unique traits.

2. **Compact and Expressive Design**: Describe the creature’s defining features, colors, and shape so that it’s clear in a small, compact form. Focus on elements that communicate personality, highlight the creature's unique elements, flavor or theme.

3. **Stylized Proportions**: Emphasize unique features by suggesting enlarged or stylized proportions. For example, if it’s a fast creature, suggest long limbs; if it’s a wise creature, suggest large eyes or an owl-like head.

4. **Whimsical and Surprising Elements**: Include one or two imaginative twists, such as unusual limbs, elemental features (like flames, ice crystals, or vines), or magical accessories. For example, “A small lizard with a flaming tail” or “An owl with branches instead of wings.”

5. **Vibrant Color Palettes**: Specify colors that reflect the creature’s elemental or personality traits (e.g., fiery reds and oranges, earthy greens and browns, icy blues and whites). Mention color accents that enhance these traits, like “a bright red shell with yellow spikes.”

6. **Expressive Poses or Subtle Animations**: Suggest an expressive pose that hints at the creature’s character, such as a “confident, forward stance” for a brave creature or a “playful, crouching position” for a shy one. If animated, mention small, repetitive movements, like a flickering tail or blinking eyes.

7. **Detail and Minimalist Shading**: Mention basic shading and details to give dimension without over-complicating the sprite. For example, “Add light shadowing under its feet for depth” or “Use simple highlights to suggest a glossy, metallic surface.”

8. **Background and Surroundings**: Briefly describe the background or surroundings, if relevant. For example, “A lush forest with a clear blue sky” or “A desert with a setting sun.”

9. **Emphasis on Creature**: Ensure the creature is the primary focus, with a clear, uncluttered background.

10. **Art Style**: Suggest an art style that complements the creature’s theme. For example, “A pixel art style with a 16-bit look” or “A watercolor-like style with soft, pastel colors.”

Create a prompt with these elements to capture the creature’s defining features and personality in a compact, visually engaging way.`

var spritePrompt = strings.ReplaceAll(humanReadableSpritePrompt, "\n", " ")

const humanReadablePhotoObjectPrompt = `
What is the object in this photo?`

var photoObjectPrompt = strings.ReplaceAll(humanReadablePhotoObjectPrompt, "\n", " ")

const humanReadableDescriptionPrompt = `
Write a short, evocative sentence or quote about the creature in the style of trading card game flavor text, considering these elements:

TONE OPTIONS (choose one):
- Mysterious/enigmatic: Focus on secrets, unknown powers
- Whimsical/playful: Emphasize charm, humor, or mischief
- Epic/legendary: Highlight grandeur, power, or ancient wisdom
- Folk tale/mythical: Use storyteller's voice, cultural elements
- Scientific/observational: Written as field notes or studies

STRUCTURE OPTIONS (choose one):
- Direct statement: "[Creature] [does something dramatic/unique]"
- Quote from witness: "quote" —[character type]
- Lore fragment: Reference from "[Book/Chronicle name]"
- Folk wisdom: Common saying or cultural belief
- Character interaction: Brief story or encounter

WRITING GUIDELINES:
- Match tone to creature's visual elements and type
- Include at least one vivid sensory detail
- Reference the creature's primary type or notable feature
- Keep under 20 words unless using attribution
- For attributed quotes, include speaker's relationship to creature

ATTRIBUTION GUIDELINES:
- Use attribution for specific experiences or documented observations
- Keep source names evocative but concise
- Vary attribution types: scholars, adventurers, survivors, specialists
- Only use attribution when it adds context or perspective

EXAMPLES BY TYPE:
Direct Statement:
"Its shadow dances between twilight and dawn, painting dreams in starlight."

Witnessed Quote:
"The melody it hums turned my copper coins to gold!" —Bewildered Merchant

Lore Fragment:
"In times of drought, its tears become the morning dew." —Chronicles of the Verdant Vale

Folk Wisdom:
"When the [Creature] sings, wise travelers seek shelter and fools seek fortune."

Character Interaction:
"I offered it my last cookie. Now my garden blooms year-round." —Grateful Baker
`

var descriptionPrompt = strings.ReplaceAll(humanReadableDescriptionPrompt, "\n", " ")

const humanReadablePrimaryTypePrompt = `
Your task is to analyze a photographed subject and determine the most appropriate primary spirit type for a creature based on that subject. Consider the following aspects:
SUBJECT ANALYSIS
* What is the subject's primary function or purpose?
* What materials compose the subject?
* How do humans typically interact with this subject?
* What cultural significance or emotional associations does the subject carry?
* What natural elements or forces does the subject relate to?

TYPE SYSTEM RULES
 * Every spirit must have exactly one primary type
 * The type should reflect the core essence of the subject, not just surface-level appearance
 * Types should feel intuitive and create opportunities for interesting gameplay mechanics
 * Consider both literal and metaphorical connections to the type's domain

Available Primary Types:
Sky (wind/freedom/height)
Stream (water/fluidity/change)
Flame (fire/passion/warmth)
Stone (earth/endurance/stability)
Frost (ice/preservation/cold)
Growth (plant/nurturing/flourishing)
Dream (mystery/psychic/illusion)
Shadow (darkness/stealth/hidden)
Light (illumination/truth/radiance)
Ritual (ancestral/tradition/sacred)
Harmony (peace/balance/order)
Chaos (disorder/war/spontaneity)
Steel (technology/craft/construction)
Art (creativity/expression/beauty)
Song (music/sound/rhythm)
Spark (electricity/energy/power)
Weave (patterns/connections/textiles)
Rune (knowledge/symbols/writing)

OUTPUT INSTRUCTIONS
 * Analyze the subject using the aspects listed above
 * List 2-3 potential type matches with brief justification
 * Select and justify the single best primary type match
 * Explain how this type could influence the spirit's design and abilities

Remember:
 * Focus on the deeper essence of the subject rather than surface appearance
 * Consider cultural and emotional significance
 * Think about how the type choice enables interesting gameplay mechanics
 * Ensure the connection between subject and type feels natural and intuitive
 * Consider the frequency of the subject type in the provided frequency list to maintain game balance`

var primaryTypePrompt = strings.ReplaceAll(humanReadablePrimaryTypePrompt, "\n", " ")

const humanReadableSecondaryTypePrompt = `
Your task is to determine if a spirit should have a secondary type based on its photographic subject and primary type, and if so, select the most appropriate secondary type.
SUBJECT AND PRIMARY TYPE ANALYSIS
* How does the subject express qualities beyond its primary type?
* What secondary aspects of the subject complement or contrast with the primary type?
* What additional cultural or symbolic meanings does the subject carry?
* Are there mechanical gameplay opportunities that arise from type combinations?

TYPE SYSTEM RULES
* A spirit can have either no secondary type or exactly one secondary type
* The secondary type should add depth without overshadowing the primary type
* The combination should create intuitive and engaging gameplay possibilities
* Consider both harmonious and contrasting type combinations

Available Secondary Types:
None (mono-type)
Sky (wind/freedom/height)
Stream (water/fluidity/change)
Flame (fire/passion/warmth)
Stone (earth/endurance/stability)
Frost (ice/preservation/cold)
Growth (plant/nurturing/flourishing)
Dream (mystery/psychic/illusion)
Shadow (darkness/stealth/hidden)
Light (illumination/truth/radiance)
Ritual (ancestral/tradition/sacred)
Harmony (peace/balance/order)
Chaos (disorder/war/spontaneity)
Steel (technology/craft/construction)
Art (creativity/expression/beauty)
Song (music/sound/rhythm)
Spark (electricity/energy/power)
Weave (patterns/connections/textiles)
Rune (knowledge/symbols/writing)

MONO-TYPE CONSIDERATION CRITERIA
Consider keeping the spirit mono-typed if:

Core Concept Embodiment
* The spirit purely embodies its primary type's essence
* Additional types would dilute its thematic identity
* Design and abilities flow naturally from a single type

Mechanical Purpose
* The spirit works best as a specialist in its type
* Its role needs focused access to one type's moves
* It serves as a clear example of the type's mechanics

Power Balance
* A second type would create unbalanced resistances
* Base attributes work best with single-type design
* Competitive balance favors mono-typing

OUTPUT INSTRUCTIONS
* Analyze how the subject might express qualities beyond its primary type
* List 2-3 potential secondary types (including None) with brief justification
* Select and justify the final secondary type choice
* Explain how this type combination influences the spirit's design and abilities

Remember:
* Consider if mono-typing better serves the design
* Ensure type combinations feel natural and intuitive
* Think about gameplay implications and balance
* Account for cultural and symbolic meanings
* Consider the frequency of the subject type for game balance`

var secondaryTypePrompt = strings.ReplaceAll(humanReadableSecondaryTypePrompt, "\n", " ")

const humanReadableHeightPrompt = `
Guess the creature's height based on the image generation prompt. Height should be the number of centimeters.`

var heightPrompt = strings.ReplaceAll(humanReadableHeightPrompt, "\n", " ")

const humanReadableWeightPrompt = `
Guess the creature's weight based on the image generation prompt. Weight should be the number of grams.`

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
