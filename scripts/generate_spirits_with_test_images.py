"""
NOTE: You must use the user's firebase auth token. You can get my user token with this command get the FB_API_KEY from the expo .env file:
$ curl 'https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key='$FB_API_KEY -H 'Content-Type: application/json'
 --data-binary '{"email":"blake@murky.blue","password":"123456","returnSecureToken":true}'
"""
import os
import base64
import requests
from typing import Dict
import json
from pathlib import Path
import cv2
import numpy as np
from PIL import Image
import requests
from io import BytesIO

MINI_RUN = True
TEST_NAME = "base_mini_run_20"
"""
TEST_NAME = "base_full_run_2": Uses 13 basic types, improved secondary type prompt, improved creature description prompt."
TEST_NAME = "base_mini_run_3": Update the descrription prompt.
TEST_NAME = "base_mini_run_4": Set 25 word limit. RESULT: didn't yield the most evocative line, still always structured the output in a particular way.
TEST_NAME = "base_mini_run_5": Incorporate new suggestions that limite adjective choice, enforce word economy. RESULT: Didn't help much.
TEST_NAME = "base_mini_run_6": Ask the model to write a paragraph then extract the best line.
TEST_NAME = "base_mini_run_7": Last 4o-mini run. Prompt is more explicit about the desired output format and about how to write the description and what the flavor text should look be.
TEST_NAME = "base_mini_run_9": Bring in the big guns, change the model for 4o. I played around in 4o-mini and it can't do this.
TEST_NAME = "base_mini_run_10": Revert back to old prompt. 4o isn't consistent with the paragraph/flavor text prompt.
TEST_NAME = "base_mini_run_11": Trying Claude's prompt. SUCCESS! This works really well.
TEST_NAME = "base_mini_run_12": Set a system message setting the model's role. RESULT: Wow that was much worse. I modified the user prompt to be too generic thinking that it was redundant but it decreased quality significantly.
TEST_NAME = "base_mini_run_13": Adding a comprehensive user message. RESULT: back to previous performance levels.
TEST_NAME = "base_mini_run_14": "gpt-4o-2024-08-06" run: Slightly modify the image gen prompt. Success. Great results.
TEST_NAME = "base_mini_run_15": Updating to latest 4o model "gpt-4o-2024-11-20". The generated images weren't as good.
TEST_NAME = "base_mini_run_16": Rerunning it with the latest 4o model "gpt-4o-2024-11-20" to see if random chance affected the results. RESULT: The results were better than the previous run, but still not as good as "gpt-4o-2024-08-06" it's hard to tell which is better for sure.
TEST_NAME = "base_mini_run_17": rerunning 11-20 model to see if random chance affected the results. They seemed to be the best so far.
TEST_NAME = "base_mini_run_18": rerunning 08-06 model to see if random chance affected the results. Seemed mid of the last few experiments. Seems like it's hard to tell and I haven't gotten a sufficiently good grader running yet.
TEST_NAME = "base_mini_run_19": Upgrading to flux 1.1 Pro. SUCCESS: It's beautiful.
TEST_NAME = "base_mini_run_20": 
"""

def encode_image_to_base64(image_path: str) -> str:
    with open(image_path, "rb") as image_file:
        encoded_string = base64.b64encode(image_file.read()).decode('utf-8')
        return f"data:image/jpg;base64,{encoded_string}"

def process_image(base64_image: str, backend_url: str, id_token: str) -> Dict:
    endpoint = f"{backend_url}/ProcessImage"
    headers = {
        'Content-Type': 'application/json',
        'Authorization': f'Bearer {id_token}'
    }
    payload = {
        'base64Image': base64_image
    }
    
    print(f"Calling endpoint: {endpoint}")
    response = requests.post(endpoint, json=payload, headers=headers)
    response.raise_for_status()
    
    return response.json()

def main():
    # Configuration
    backend_url = "http://192.168.0.154:8080"
    id_token = os.getenv("FIREBASE_ID_TOKEN")
    
    if not backend_url:
        raise ValueError("BACKEND_SERVER_URL environment variable is not set")
    if not id_token:
        raise ValueError("FIREBASE_ID_TOKEN environment variable is not set")
    
    # Directory containing images
    image_dir = Path("/home/megalodon/Pictures/" + ("SpiritSnapMiniRun" if MINI_RUN else "SpiritSnapCommonPhotos"))
    output_dir = image_dir / TEST_NAME
    output_dir.mkdir(exist_ok=True)
    
    # Process each image in directory
    
    # Create a list to store all processed images
    processed_images = []
    original_images = []
    
    for image_file in image_dir.glob("*.[jJ][pP][gG]"):
      print(f"\nProcessing {image_file.name}...")
      
      try:
        # Load and store original image
        original_img = Image.open(image_file)
        # Resize maintaining aspect ratio
        aspect = original_img.width / original_img.height
        if aspect > 1:
            new_width = 1024
            new_height = int(1024 / aspect)
        else:
            new_height = 1024
            new_width = int(1024 * aspect)
        original_img = original_img.resize((new_width, new_height))
        # Create a black background image
        bg_img = Image.new('RGB', (1024, 1024), (0, 0, 0))
        # Paste the resized image in the center
        offset_x = (1024 - new_width) // 2
        offset_y = (1024 - new_height) // 2
        bg_img.paste(original_img, (offset_x, offset_y))
        original_images.append(np.array(bg_img))
        
        # Encode image to base64
        base64_image = encode_image_to_base64(str(image_file))
        
        # Call backend server
        spirit_data = process_image(base64_image, backend_url, id_token)
        
        # Save results
        output_file = output_dir / f"{image_file.stem}_spirit.json"
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(spirit_data, f, indent=2)
        
        # Download and store the generated image
        generated_image_url = spirit_data.get('generatedImageDownloadUrl')
        if generated_image_url:
            response = requests.get(generated_image_url)
            img = Image.open(BytesIO(response.content))
            img_array = np.array(img)
            processed_images.append(img_array)
        
        print(f"Successfully processed {image_file.name}")
        print(f"Spirit name: {spirit_data.get('name')}")
        print(f"Spirit Doc ID: {spirit_data.get('id')}")
        print(f"Spirit description: {spirit_data.get('description')}")
        print(f"Spirit primaryType: {spirit_data.get('primaryType')}")
        print(f"Spirit secondaryType: {spirit_data.get('secondaryType')}")
        # print(f"Spirit originalImageDownloadUrl: {spirit_data.get('originalImageDownloadUrl')}")
        # print(f"Spirit generatedImageDownloadUrl: {spirit_data.get('generatedImageDownloadUrl')}")
        # print(f"Spirit agility: {spirit_data.get('agility')}")
        # print(f"Spirit arcana: {spirit_data.get('arcana')}")
        # print(f"Spirit aura: {spirit_data.get('aura')}")
        # print(f"Spirit charisma: {spirit_data.get('charisma')}")
        # print(f"Spirit endurance: {spirit_data.get('endurance')}")
        # print(f"Spirit height: {spirit_data.get('height')}")
        # print(f"Spirit weight: {spirit_data.get('weight')}")
        # print(f"Spirit intimidation: {spirit_data.get('intimidation')}")
        # print(f"Spirit luck: {spirit_data.get('luck')}")
        # print(f"Spirit hitPoints: {spirit_data.get('hitPoints')}")
        # print(f"Spirit strength: {spirit_data.get('strength')}")
        # print(f"Spirit toughness: {spirit_data.get('toughness')}")            
        print(f"Results saved to: {output_file}")
      except Exception as e:
        print(f"Error processing {image_file.name}: {str(e)}")
        continue

    # Create image matrix for generated images
    if processed_images:
      num_images = len(processed_images)
      grid_size = int(np.ceil(np.sqrt(num_images)))
      rows = grid_size
      cols = grid_size
      
      # Create blank matrix
      cell_height, cell_width = 1024, 1024
      matrix = np.zeros((cell_height * rows, cell_width * cols, 3), dtype=np.uint8)
      
      # Fill matrix with images
      for idx, img in enumerate(processed_images):
          i = idx // cols
          j = idx % cols
          matrix[i*cell_height:(i+1)*cell_height, j*cell_width:(j+1)*cell_width] = img
      
      # Save matrix
      matrix_output = output_dir / "generated_spirits_matrix.jpg"
      cv2.imwrite(str(matrix_output), cv2.cvtColor(matrix, cv2.COLOR_RGB2BGR))
      print(f"\nGenerated spirits matrix saved to: {matrix_output}")

    # Create image matrix for original images
    if original_images:
      num_images = len(original_images)
      grid_size = int(np.ceil(np.sqrt(num_images)))
      rows = grid_size
      cols = grid_size
      
      # Create blank matrix
      cell_height, cell_width = 1024, 1024
      matrix = np.zeros((cell_height * rows, cell_width * cols, 3), dtype=np.uint8)
      
      # Fill matrix with images
      for idx, img in enumerate(original_images):
          i = idx // cols
          j = idx % cols
          matrix[i*cell_height:(i+1)*cell_height, j*cell_width:(j+1)*cell_width] = img
      
      # Save matrix
      matrix_output = output_dir / "original_images_matrix.jpg"
      cv2.imwrite(str(matrix_output), cv2.cvtColor(matrix, cv2.COLOR_RGB2BGR))
      print(f"\nOriginal images matrix saved to: {matrix_output}")
if __name__ == "__main__":
    main()
