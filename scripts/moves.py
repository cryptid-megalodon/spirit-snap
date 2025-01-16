"""
Note: I discovered a prompt that dramatically improves the quality of the output.
Create a new chat in claude Spirit Snap project, then pass in the base lore and
ask it to exand and elaborate on it. Then ask it generate a list of moves.
Example: https://claude.ai/chat/dc4a0370-93cd-4d80-b6cf-c346498bbdfb
"""

import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore

SkyMoves = [
	"Solar Shroud",        # Increases evasion by using sun's glare
	"Sky Scout",           # Reveals hidden enemies
	"Celestial Message",   # Status effect transfer move
	"Wings of Liberation", # Breaks restrictions and traps
	"Sacred Updraft",      # Heavy damage to grounded foes
	"Sky Temple Dance",    # Ritual move for weather effects
	"Echo of First Winds", # Reference to creation lore
	"Freedom's Call",      # Removes status effects
	"Windborne Prayer",    # Healing move
	"Tempest Wing",        # Powerful attack
	"Storm Herald",        # Powerful attack
	"Heaven's Descent",    # Powerful attack
	"Tailwind",            # Speed boost
	"Headwind",            # Reduces enemy speed
	"Wind Wall",           # Defensive barrier
	"Sheltering Wings",    # Protective move
	"Aerial Slash",        # Basic attack
	"Sky Pierce",          # Basic attack
	"Feather Dart",        # Basic attack
	"Windswept Talon",     # Basic attack
	"Gust Strike",         # Basic attack
]
WaterMoves = [
	"Ripple Strike",
	"Aqua Pulse", 
	"Water Gun",
	"High Tide",
	"Mist Veil",
	"Cleansing River",    # removes status effects
	"Restorative Spring", # healing
	"Liquid Mirror",
	"Flow State",
	"Crashing Wave",
	"Tsunami",
	"Torrential Downpour",
	"Raging Rapids", 
	"Crushing Depth",
	"Undertow Grip",
	"Clouded Waters",
	"Whirlpool",
	"Sacred Spring",
	"Flood Plain",
	"Lure",
	"Flash Flood",
]
FlameMoves = [
	"Burning Heart",
	"Burn Out", 
	"Flamethrower",
	"Kindle Hope",
	"Flare",
	"Hearth",
	"Phoenix Pulse",
	"Dawn's First Light",
	"Melt",
	"Erupt",
	"Pyroclasm",
	"WildFire",
	"Flame Fang",
	"Blazing Claw",
	"Sun Burn",
	"Stoke",
	"Inferno",
	"Searing Arrow",
	"Fire Dance",
]
EarthMoves = [
	"Crystal Bulwark",
	"Geode Shell",
	"Mountain Stance", 
	"Shard Storm",
	"Tectonic Press",
	"Granite Spire",
	"Crystal Clear",
	"Fossilize",
	"Time-Worn Path",
	"Crystal Refraction",
	"Eternal Monument",
	"Earthquake",
	"Mudslide",
	"Gravel Blast",
	"Boulder Barrage",
	"Sinkhole",
	"Sandblast",
	"Mineral Missile",
	"Tunnel",
]
FrostMoves = [
	"Igloo",
	"Hibernate",
	"Hoarfrost Fex",
	"Brittle Cold",
	"Early Spring",
	"Icicle",
	"Frost Bite",
	"Absolute Zero",
	"Avalanche",
	"Winter Stillness",
	"Polar Vortex",
	"Glacier Crush",
	"Frozen Arsenel",
]
GrowthMoves = [
	"Seed Canon",
	"Leech",
	"Aggressive Growth",
	"Root",
	"Web Slinger",
	"Evergreen Oath",
	"Gaia's Embrace",
	"Web Spin",
	"Bloom Cascade",
	"Photosynthesis",
	"Pollination",
	"Growth Ring",
	"Primordial Sprout",
	"Vine Lash",
	"Ensnare",
]
DreamMoves = [
	"Riddle with Holes",
	"Dream Pierce",
	"Reality Warp",
	"Mirror Maze",
	"Sleep Walk",
	"Rough Night",
	"Amnesia",
	"Peaceful Sleep",
	"Pipe Dream",
	"Psyblade",
	"Dream Devour",
	"Dream of Victory",
	"Brainstorm",
]
ShadowMoves = [
	"Cloak",
	"Twilight Fade",
	"Dark Truth",
	"Forbidden Lore",
	"Paranoia Prank",
	"Seal",
	"Ancient Hex",
	"Obscure Intent",
	"Forget the Facts",
	"Cryptkeeper",
	"Fog",
	"Secrets Unveiled",
	"Eternal Night",
	"Void Emperor's Decree",
	"Lost Knowledge",
	"Cloaked Dagger",
	"Shadow Strike",
]
LightMoves = [
	"Flash Strike",
	"Focus",
	"Ultraviolet",
	"Prism Ray",
	"Aurora Bind",
	"Clarity",
	"Dawn's Relief",
	"Mirror",
	"Lighthouse",
	"Laser Beam",
	"Enlightened Strike",
	"Piercing Blow",
	"Judgement",
]
RitualMoves = [
	"Ancestral Strike",
	"Spirit Chime",
	"Sacred Seal",
	"Ceremonial Blade",
	"Banish",
	"Karmic Retribution",
	"Family Heirloom",
	"Circle of Protection",
	"Chant",
	"Sacred Bond",
	"Traditional Medicine",
	"Cleansing Ceremony",
	"Last Rites",
	"Sacred Ground",
	"Time-honored Technique",
]
HarmonyMoves = [
	"Set the Record Straight",
	"Restore Balance",
	"Peace and Calm",
	"Perfect Balance",
	"Symmetric Shield",
	"Meditation",
	"Calming Touch",
	"Balance Break",
	"Transcend",
	"Equal Exchange",
	"Twin Strike",
	"Yin-Yang Crush",
	"Tip the Scales",
]
ChaosMoves = [
	"Entropy Burst",      # Basic chaotic energy blast
	"Disorder Strike",    # Basic random damage attack
	"Warp Touch",        # Close-range distortion attack
	"Flux",              # Random stat boost effect
	"Butterfly Effect",   # Delayed attack that grows with random events
	"Paradigm Shift",    # Flips type advantages/disadvantages for one turn
	"Singularity",       # Creates a vortex of chaos effects
	"Spread Fear",       # Status effect move
	"Probability Storm", # Multi-hit random chance attacks
	"Chaos Ladder",      # Arcana power-up move
	"Rabid Bite",        # Direct damage attack with chaos flavor
]
# Used elaboreate technique from above.
SteelMoves = [
	"Hydraullic Press",
	"Piston Pumel",
	"Industrial Revolution",
	"Iron Bulwark",
	"Reinforced Plating",
	"Metabolic Membrane",
	"Blueprint Analysis",
	"Factory Reset",
	"Quality Control",
	"Maintenance Mode",
	"Manufacturing Chain",
	"Precision Tooling",
	"Sustainable Design",
	"Mass Production",
	"Factory Floor",
	"Industrial Complex",
	"Steel Mill",
]
# ArtMoves contains the list of art-themed moves and their concepts
ArtMoves = [
	"Color Splash",     # Quick attack that hits with a burst of pigment, may reduce accuracy
	"Quick Sketch",     # Fast priority move that always strikes first
	"Brush Stroke",     # Basic attack with chance to apply a status effect
	"Charcoal Smudge",  # Reduces opponent's accuracy by creating a cloud of charcoal
	"Line Study",       # Precision strike that increases user's accuracy
	"Paint Dab",        # Quick attack that may mark the target for bonus damage
	"Cubist Break",     # Breaks down target's defenses by fragmenting reality
	"Impressionist Burst", # Multiple hits that blend together for cumulative damage
	"Renaissance Revival", # Healing move that restores HP through classical beauty
	"Surreal Shift",    # Changes target's type temporarily through dream-like transformation
	"Picture Perfect",  # Copies target's last used move with enhanced power
	"Masterpiece Moment", # User's strongest move becomes more powerful next turn
	"Baroque Barrage",  # Ornate attack that hits multiple times with increasing power
	"Avant-garde Assault", # Unpredictable attack with random bonus effects
	"Studio Sanctuary", # Creates a protective field that boosts special defense
	"Divine Creation",  # Ultimate move requiring charge turn, massive damage
	"Color Theory",     # Raises special attack through color manipulation
	"Perspective Shift", # Increases evasion by altering spatial perception
	"Restoration",      # Healing move that repairs damage through artistic conservation
]

# Used elaborate technique from above
SongMoves = [
	"Sound Burst",     # Basic sound wave attack
	"Rhythm Strike",   # Basic attack with higher crit chance on-beat
	"Bass Drop",       # Heavy attack that can lower defense
	"Tempo Rush",      # Quick multi-hit attack
	"Harmonize",       # Raises team's attack by creating perfect harmony
	"Resonant Shield", # Defense boost using sound wave interference
	"Pitch Perfect",   # Raises accuracy by tuning frequencies
	"Amplify",        # Raises special attack by increasing volume
	"Discord",        # Causes confusion through chaotic frequencies
	"Crescendo",      # Gradually raises stats each turn
	"Diminuendo",     # Gradually lowers opponent's stats
	"Symphonic Blast", # Powerful special attack combining multiple frequencies
	"Power Chord",     # Strong attack with high critical hit rate
	"Sonic Boom",      # Piercing attack that ignores defense
	"Rhythm Cascade",  # Multiple hits that increase in power if timed right
	"Supersonic Strike", # High-power attack that may confuse
	"Resonance Break",  # Destroys barriers and defensive buffs
	"The Finale",      # Ultimate attack, stronger when user has low HP
	"Echo Location",    # Reveals invisible enemies using sound waves
	"Soothing Melody",  # Healing move using calming frequencies
	"Key Change",       # Changes user's secondary type temporarily
	"Beat Share",       # Spreads positive status effects to allies
	"First Movement",   # Sets up increased damage for next move
	"Listen Close",     # Makes target vulnerable to sound moves
	"Equalizer",        # Balances all stats on field
	"Echo Chamber",     # Creates lingering damage field of reverberating sound
]
# Used elaboreate technique from above.
SparkMoves = [
	"Static Pulse",      # Basic electric attack with chance to paralyze
	"Voltage Spike",     # Quick attack with high critical hit rate
	"Energy Siphon",     # Drains opponent's energy to heal self
	"Charge Field",      # Raises attack power of electric moves
	"Neural Link",       # Increases accuracy and evasion
	"Power Surge",       # Temporary attack boost with recoil
	"Lightning Strike",  # Strong electric attack with perfect accuracy
	"Gigawatt Burst",   # Powerful attack that requires charging
	"Plasma Storm",      # Area effect attack that hits all opponents
	"Digital Disruption",# Lowers opponent's accuracy and special defense
	"Breakthrough",     # Ignores defensive abilities and shields
	"Stroke of Genius", # Massive boost to special attack and speed
	"Foresight",        # Predicts and counters next opponent's move
	"Think Tank",       # Team boost to special attack and special defense
	"New Innovation",   # Damage increases with each consecutive use
	"Grid Overload",    # Massive damage but damages self
	"Technological Singularity", # Ultimate move that can only be used once
	"Recharge",         # Restores HP and energy
	"Signal Boost",     # Increases power of all electric moves for team
	"Cloud Backup",     # Prevents fainting once
	"Tech Support",     # Heals ally and provides defensive boost
]
# Used elaboreate technique from above.
WeaveMoves = [
	"Silk Screen",        # Raises evasion by creating a shimmering barrier of threads
	"Thread Needle",      # Precise piercing attack with high critical hit rate
	"Cut Short",         # Quick attack that has priority in battle
	"Tie Knot",         # Binds the target, dealing damage over time
	"Binding Thread",    # Prevents the target from switching out
	"Fractal Strike",    # Attack that hits multiple times, increasing in power each hit
	"Pattern Recognition", # Raises accuracy and enables prediction of enemy moves
	"Mending Weave",     # Healing move that repairs damage using magical threads
	"Bolster Thread Count", # Raises defense by adding layers of protective threads
	"Web of Fate",       # Powerful trapping move that deals damage over time
	"Weave Reality",     # Changes type effectiveness temporarily by altering reality's fabric
	"Tug Loose Ends",    # Deals random type damage by pulling on reality's loose threads
	"Grand Design",      # Power increases based on active status effects on the field
	"Thread Tangle",     # Lowers opponent's speed by entangling them
	"Unwind",           # Removes trapping effects from ally
	"Tear Threads",      # Removes beneficial status effects from the target
	"Knitted Sweater",   # Raises special defense of an ally
	"Decoy Dummy",       # Creates a decoy that takes hits for one turn
]
# Used elaboreate technique from above.
RuneMoves = [
	"Glyph Strike",      # Basic attack
	"Text Barrage",      # Multi-hit attack
	"Syntax Slash",      # Quick attack
	"Word Processor",    # Status move
	"Bookmark",          # Trap move
	"Throw the Book",    # Physical attack
	"Encrypt",          # Raises defense
	"Compress",         # Lowers defense, raises speed
	"Stack Overflow",    # Confusion effect
	"Clear Cache",      # Removes stat changes
	"Index Search",     # Reveals weakness
	"Grimoire Storm",   # Powerful multi-hit
	"Archive Purge",    # High damage move
	"Kernel Panic",     # High risk-reward move
	"Write Script",     # Status move
	"Transfer Knowledge", # Pass buffs to ally
	"Summoning Scroll",  # Physical damage
	"Arena Almanac",    # Field effect move
	"Server Crash",      # Causes confusion and lowers defense
	"Firewall",         # Protective move that blocks status effects
	"Binary Blast",     # 50/50 chance of either massive damage or failure
	"Debug",            # Removes all status conditions
]

def main():
  # Initialize Firebase Admin
  cred = credentials.Certificate('/home/megalodon/Projects/react_native_projects/spirit-snap/server/spirit-snap-gcp-key-secret.json')
  firebase_admin.initialize_app(cred)

  # Get Firestore client
  db = firestore.client()

  # Collection reference
  moves_collection = db.collection('moves')
  
  # Leaving this here in case I need it in the future, but from now on,
  # I should probably be retrieving the moves from the database.

  # # Upload Sky moves
  # for move in SkyMoves:
  #     doc_ref = moves_collection.document()
  #     doc_ref.set({
  #         'name': move,
  #         'type': 'Sky'
  #     })
  
  # # Upload Wave moves
  # for move in WaterMoves:
  #     doc_ref = moves_collection.document()
  #     doc_ref.set({
  #         'name': move,
  #         'type': 'Water'
  #     })
  
  # # Upload Flame moves
  # for move in FlameMoves:
  #     doc_ref = moves_collection.document()
  #     doc_ref.set({
  #         'name': move,
  #         'type': 'Flame'
  #     })
  # # Upload Stone moves
  # for move in EarthMoves:
  #     doc_ref = moves_collection.document()
  #     doc_ref.set({
  #         'name': move,
  #         'type': 'Earth'
  #     })
  # # Upload Frost moves
  # for move in FrostMoves:
  #     doc_ref = moves_collection.document()
  #     doc_ref.set({
  #         'name': move,
  #         'type': 'Frost'
  #     })
  # # Upload Growth moves
  # for move in GrowthMoves:
  #     doc_ref = moves_collection.document()
  #     doc_ref.set({
  #         'name': move,
  #         'type': 'Growth'
  #     })
  # # Upload Dream moves
  # for move in DreamMoves:
  #     doc_ref = moves_collection.document()
  #     doc_ref.set({
  #         'name': move,
  #         'type': 'Dream'
  #     })
  # # Upload Shadow moves
  # for move in ShadowMoves:
  #     doc_ref = moves_collection.document()
  #     doc_ref.set({
  #         'name': move,
  #         'type': 'Shadow'
  #     })
  # # Upload Light moves
  # for move in LightMoves:
  #     doc_ref = moves_collection.document()
  #     doc_ref.set({
  #         'name': move,
  #         'type': 'Light'
  #     })
  # # Upload Spirit moves
  # for move in SpiritMoves:
  #     doc_ref = moves_collection.document()
  #     doc_ref.set({
  #         'name': move,
  #         'type': 'Ritual'
  #     })
  # # Upload Harmony moves
  # for move in HarmonyMoves:
  #     doc_ref = moves_collection.document()
  #     doc_ref.set({
  #         'name': move,
  #         'type': 'Harmony'
  #     })
  # # Upload Chaos moves
  # for move in ChaosMoves:
  #     doc_ref = moves_collection.document()
  #     doc_ref.set({
  #         'name': move,
  #         'type': 'Chaos'
  #     })
  # # Upload Steel moves
  # for move in SteelMoves:
  #     doc_ref = moves_collection.document()
  #     doc_ref.set({
  #         'name': move,
  #         'type': 'Steel'
  #     })
  # # Upload Art moves
  # for move in ArtMoves:
  #     doc_ref = moves_collection.document()
  #     doc_ref.set({
  #         'name': move,
  #         'type': 'Art'
  #     })
  # # Upload Song moves
  # for move in SongMoves:
  #     doc_ref = moves_collection.document()
  #     doc_ref.set({
  #         'name': move,
  #         'type': 'Song'
  #     })
  # # Upload Spark moves
  # for move in SparkMoves:
  #     doc_ref = moves_collection.document()
  #     doc_ref.set({
  #         'name': move,
  #         'type': 'Spark'
  #     })
  # # Upload Thread moves
  # for move in ThreadMoves:
  #   doc_ref = moves_collection.document()
  #   doc_ref.set({
  #     'name': move,
  #     'type': 'Weave'
  #   })

  # # Upload Rune moves
  # for move in RuneMoves:
  #   doc_ref = moves_collection.document()
  #   doc_ref.set({
  #     'name': move,
  #     'type': 'Rune'
  #   })

if __name__ == '__main__':
    main()
