"""
Script to grade spirits. This script uses Anthropic's Claude AI to evaluate spirits.
Point it at a directory of spirit docs from Firebase and it will create a score report.
Use it in conjunction with scripts/generate_spirits_with_test_images.py to generate spirits
from images with the generate_spirits_with_test_images.py script to itrate on promptings ideas.

Usage:
    python scripts/grade_spirits.py <spirit_directory>

Set the following environment variables:
- ANTHROPIC_API_KEY: API key for Anthropic. Check here:  https://console.anthropic.com/account/keys
"""

import base64
import io
import traceback
import httpx
import json
import os
import sys
from typing import Dict, List, Optional
import anthropic
import asyncio
from datetime import datetime
from PIL import Image

class Move:
    def __init__(self, data: Dict):
        self.name = data.get('name', '')
        self.description = data.get('description', '')
        self.type = data.get('type', '')

class Spirit:
    def __init__(self, data: Dict):
        self.id = data.get('id', '')
        self.name = data.get('name', '')
        self.description = data.get('description', '')
        self.primary_type = data.get('primaryType', '')
        self.secondary_type = data.get('secondaryType', '')
        self.original_image_url = data.get('originalImageDownloadUrl', '')
        self.generated_image_url = data.get('generatedImageDownloadUrl', '')
        
        # Stats
        self.agility = data.get('agility', 0)
        self.arcana = data.get('arcana', 0)
        self.aura = data.get('aura', 0)
        self.charisma = data.get('charisma', 0)
        self.endurance = data.get('endurance', 0)
        self.height = data.get('height', 0)
        self.weight = data.get('weight', 0)
        self.intimidation = data.get('intimidation', 0)
        self.luck = data.get('luck', 0)
        self.strength = data.get('strength', 0)
        self.toughness = data.get('toughness', 0)
        self.hit_points = data.get('hitPoints', 0)

async def grade_spirit_with_claude(client: anthropic.AsyncClient, spirit: Spirit) -> tuple[int, str]:
    """
    Grade a spirit using the Claude API and return a score and explanation.
    
    Returns:
        tuple: (score, explanation) where score is 1-10
    """

    grade_spirit_prompt = f"""
    Please evaluate this creature in my game and provide a comprehensive analysis in JSON format.

    Spirit Details:
    Name: {spirit.name}
    Flavor Text: {spirit.description}
    Primary Type: {spirit.primary_type}
    Secondary Type: {spirit.secondary_type}
    Height: {spirit.height}
    Weight: {spirit.weight}

    A photo of the source object that inspired this spirit will be provided in the next message.

    Please evaluate based on the following criteria, with careful attention to how the elements work together:

    Evaluation Areas (in order of importance):
    1. Photo-to-creature transformation
    2. Base elements (name, flavor text, types)
    3. Design and gameplay integration
    4. Overall synergy between elements

    Required JSON Format:
    {{
      "creature_id": "{spirit.name}",
      "photo_to_creature_evaluation": {{
        "transformation_creativity": {{
          "score": 0-10,
          "strengths": [],
          "weaknesses": [],
          "key_features_used": []
        }},
        "physical_adaptation": {{
          "score": 0-10,
          "strengths": [],
          "weaknesses": []
        }},
        "functional_translation": {{
          "score": 0-10,
          "strengths": [],
          "weaknesses": []
        }}
      }},
      "base_evaluation": {{
        "name": {{
          "score": 0-10,
          "strengths": [],
          "weaknesses": [],
          "suggested_improvements": []
        }},
        "flavor_text": {{
          "score": 0-10,
          "strengths": [],
          "weaknesses": [],
          "suggested_improvements": []
        }},
        "types": {{
          "score": 0-10,
          "strengths": [],
          "weaknesses": [],
          "suggested_improvements": []
        }},
        "physical_stats": {{
          "height_weight_appropriateness": 0-10,
          "notes": ""
        }}
      }},
      "image_quality_evaluation": {{
        "score": 0-10,
        "standout_qualities": [],
        "key_improvement_areas": [],
        "design_iteration_suggestions": []
      }}
      "overall_grade": 0-10,
      "standout_qualities": [],
      "key_improvement_areas": [],
      "design_iteration_suggestions": []
    }}
    """

    system_prompt = """
    You are an expert game design consultant specializing in creature design for trading card games. Your task is to evaluate spirits/creatures that are generated from photos of everyday objects, providing constructive analysis to improve their design.

    Evaluation Process (in order):

    1. Photo-to-Creature Transformation (40% of overall grade)
    Example: A vintage camera becoming a mechanical owl that captures memories
    - Innovation in using distinct features
    - Logical but unexpected interpretations
    - Physical feature adaptation
    - Functional/purpose translation
    - Photo background is logical and relevant to the creature
    - The creature must undergo at least one of the following transformations:
      - Physical form change (e.g., animal, plant, object)
      - Physical feature adaptation (e.g., wings, eyes, mouth)
      - Functional/purpose translation (e.g., capturing, storing, manipulating)
    - Things that should be penalized:
      - Creatures that undergo no or little change from the source photo.
      - Images with no background or irrelevant background.
      - Images with obviouse generation artifacts, such as blurry, distorted, or pixelated areas or logical inconsistencies.

    2. Base Elements (30% of overall grade)
    Example: "Shutterbeak" as a name for the camera-owl, with flavor text about collecting precious moments
    - Name: Memorable, relevant, clever wordplay
    - Flavor Text: Evocative, quotable MTG-style text
    - Types: Aligned with concept and mechanics
    - Physical Stats: Appropriate height/weight for concept
    - Things that should be penalized:
      - Names that are too obvious or generic
      - Flavor text that is too vague or unrelated to the concept
      - Types that do not align with the concept or mechanics
      - Physical stats that are too extreme or unrealistic

    3. Generated Image Quality (30% of overall grade)
    Instructions: please focus on the quality of the generated image for this section.
    - Images should be clear, high-quality, and relevant to the concept.
    - Images should be interesting and engaging.
    - Images should feel like a natural fit for a sci-fi or fantasy universe.
    - Images should be relevant to the creature concept and not just a random image.
    - Things that should be penalized:
      - Anatomical errors: Extra/missing/malformed limbs, incorrect number of fingers/eyes/facial features
      - Pattern duplications: Unnatural repetitions of textures, objects, or elements
      - Textural inconsistencies: Blurred regions, unnatural smudging, or abrupt texture changes
      - Geometric distortions: Warped perspective, impossible angles, or broken symmetry
      - Text deformities: Garbled, unreadable, or nonsensical text elements
      - Color/lighting breaks: Unnatural color transitions, inconsistent shadows/highlights
      - Edge artifacts: Hard seams, pixelation, or unnatural boundaries between elements

    Scoring Guidelines:

    9-10: Exceptional
    - Masterful transformation with unique interpretation
    - Elements perfectly reinforce each other
    - Creates exciting new possibilities
    - Memorable and distinctive

    7-8: Strong
    - Creative use of source material
    - Elements work together well
    - Clear gameplay identity
    - Stands out positively

    5-6: Solid
    - Basic but logical transformation
    - Elements function independently
    - Standard gameplay applications
    - Room for improvement

    3-4: Needs Work
    - Weak connection to source
    - Elements don't support each other
    - Unclear gameplay purpose
    - Missing opportunities

    1-2: Poor
    - Minimal transformation
    - Clashing or inappropriate elements
    - Lack of coherent design
    - Requires major revision

    Focus your evaluation on:
    1. How well the physical object inspired the creature
    2. Whether all elements support a unified design
    3. Potential for engaging gameplay
    4. Opportunities for improvement

    Provide specific, actionable feedback that could improve the design in its next iteration.
    """

    # Get original images and resize to ~1MP (1000x1000)
    def resize_to_1mp(image_bytes, format):
        img = Image.open(io.BytesIO(image_bytes))
        aspect = img.width / img.height
        if aspect > 1:
            new_width = 1000
            new_height = int(1000 / aspect)
        else:
            new_height = 1000
            new_width = int(1000 * aspect)
        img = img.resize((new_width, new_height), Image.Resampling.LANCZOS)
        buffer = io.BytesIO()
        img.save(buffer, format=format, quality=85)
        return base64.standard_b64encode(buffer.getvalue()).decode("utf-8")
        
    original_image = resize_to_1mp(httpx.get(spirit.original_image_url).content, format="JPEG")
    generated_image = base64.standard_b64encode(httpx.get(spirit.generated_image_url).content).decode("utf-8")

    try:
      message = await client.messages.create(
        model="claude-3-5-sonnet-latest",
        max_tokens=1500,
        system=system_prompt,
        messages=[
          {
            "role": "user",
            "content": [
              {
                  "type": "text",
                  "text": grade_spirit_prompt,
              },
              {
                  "type": "text",
                  "text": "User Provided Image:"
              },
              {
                  "type": "image",
                  "source": {
                    "type": "base64",
                    "media_type": "image/jpeg",
                    "data": original_image
                  }
              },
              {
                  "type": "text",
                  "text": "Generated Image of Spirit:"
              },
              {
                  "type": "image",
                  "source": {
                    "type": "base64",
                    "media_type": "image/webp",
                    "data": generated_image,
                  }
              }
            ]
          }
        ]
      )
        
      response = message.content[0].text
          
      # Parse the response to extract score and explanation
      score_response_json = json.loads(response)
      return score_response_json
        
    except Exception as e:
        return 1, f"Error during evaluation: {type(e)}"

async def process_directory(api_key: str, directory_path: str, output_file: str):
    """
    Process all JSON files in a directory and write grades to an output file.
    """
    if not api_key:
        raise ValueError("ANTHROPIC_API_KEY environment variable is not set")
        
    client = anthropic.AsyncClient(api_key=api_key)
    
    scores = {
        "transformation_creativity": [],
        "physical_adaptation": [],
        "functional_translation": [],
        "name": [],
        "flavor_text": [],
        "types": [],
        "height_weight_appropriateness": [],
        "image_quality": [],
        "overall_grade": []
    }
    
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write("Spirit Evaluation Report\n")
        f.write(f"Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        f.write("=================\n\n")
        
        for filename in os.listdir(directory_path):
            if not filename.endswith('.json'):
                continue
                
            try:
                with open(os.path.join(directory_path, filename), 'r', encoding='utf-8') as json_file:
                    data = json.load(json_file)
                    spirit = Spirit(data)
                    score_response_json = await grade_spirit_with_claude(client, spirit)
                    
                    # Collect scores
                    scores["transformation_creativity"].append(score_response_json["photo_to_creature_evaluation"]["transformation_creativity"]["score"])
                    scores["physical_adaptation"].append(score_response_json["photo_to_creature_evaluation"]["physical_adaptation"]["score"])
                    scores["functional_translation"].append(score_response_json["photo_to_creature_evaluation"]["functional_translation"]["score"])
                    scores["name"].append(score_response_json["base_evaluation"]["name"]["score"])
                    scores["flavor_text"].append(score_response_json["base_evaluation"]["flavor_text"]["score"])
                    scores["types"].append(score_response_json["base_evaluation"]["types"]["score"])
                    scores["height_weight_appropriateness"].append(score_response_json["base_evaluation"]["physical_stats"]["height_weight_appropriateness"])
                    scores["image_quality"].append(score_response_json["image_quality_evaluation"]["score"])
                    scores["overall_grade"].append(score_response_json["overall_grade"])
                    
                    f.write(f"File: {filename}\n")
                    f.write(f"Spirit: {spirit.name or 'Unnamed'}\n")
                    f.write(f"Evaluation:\n{json.dumps(score_response_json, indent=2)}\n")
                    f.write("-" * 50 + "\n\n")
                    
            except Exception as e:
                f.write(f"Error processing {filename}: {type(e).__name__}: {str(e)}\n")
        
        # Write averages at the end
        f.write("\nAVERAGE SCORES ACROSS ALL SPIRITS\n")
        f.write("================================\n")
        print(f"\nResults for directory: {directory_path}")
        print("AVERAGE SCORES ACROSS ALL SPIRITS")
        print("================================")
        for category, score_list in scores.items():
            if score_list:  # Only calculate average if we have scores
                avg = sum(score_list) / len(score_list)
                f.write(f"{category}: {avg:.2f}\n")
                print(f"{category}: {avg:.2f}")

async def main():
    
    if len(sys.argv) != 2:
        print("Usage: python asset_grader.py <directory_path>")
        sys.exit(1)
    
    api_key = os.environ.get('ANTHROPIC_API_KEY')
    directory_path = sys.argv[1]
    last_dir = directory_path.split('/')[-1]
    output_file = "scores/grade_" + last_dir + "_" + datetime.now().strftime("%Y%m%d_%H%M%S") + ".txt"
    
    if not os.path.isdir(directory_path):
        print(f"Error: {directory_path} is not a valid directory")
        sys.exit(1)
    
    await process_directory(api_key, directory_path, output_file)
    print(f"Evaluation complete. Results written to {output_file}")

if __name__ == "__main__":
    asyncio.run(main())