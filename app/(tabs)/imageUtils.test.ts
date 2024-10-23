// imageUtils.test.ts

import {
    getImageCaption,
    generateCartoonMonster,
    uploadImageToFirebase,
    writeDocumentToFirestore,
    processImage,
  } from './imageUtils';
  
  import axios from 'axios';
  import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
  import { addDoc, collection } from 'firebase/firestore';
  
  // Mock external modules
  jest.mock('axios');
  
  // Mock Firebase modules
  jest.mock('firebase/firestore');
  jest.mock('firebase/storage');
  
  // Mock firebaseConfig
  jest.mock('../../firebaseConfig', () => ({
    app: {},      // Mocked Firebase app
    db: {},       // Mocked Firestore database
    storage: {},  // Mocked Firebase storage
  }));
  
  describe('imageUtils', () => {
    const imageUtils = require('./imageUtils');
    afterEach(() => {
      jest.clearAllMocks();
    });
  
    test('getImageCaption returns caption on success', async () => {
      const mockCaption = 'A friendly cartoon monster';
      (axios.post as jest.Mock).mockResolvedValue({
        data: {
          choices: [
            {
              message: {
                content: mockCaption
              }
            }
          ]
        }
      });
  
      const result = await getImageCaption('base64ImageData');
      expect(result).toBe(mockCaption);
    });
  
    test('generateCartoonMonster returns image URI on success', async () => {
      const mockImageUri = 'data:image/png;base64,...';
      (axios.post as jest.Mock).mockResolvedValue({
        data: {
          output: [mockImageUri]
        }
      });
  
      const result = await generateCartoonMonster('prompt');
      expect(result).toBe(mockImageUri);
    });
  
    test('uploadImageToFirebase uploads image and returns download URL', async () => {
      const imageUri = 'file://image.jpg';
      const filename = 'test-image.jpg';
      const mockDownloadUrl = 'https://firebase.storage/downloadUrl';
  
      global.fetch = jest.fn(() =>
        Promise.resolve({
          blob: () => Promise.resolve('blobData'),
        })
      ) as jest.Mock;
  
      (ref as jest.Mock).mockReturnValue('storageRef');
      (uploadBytes as jest.Mock).mockResolvedValue(undefined);
      (getDownloadURL as jest.Mock).mockResolvedValue(mockDownloadUrl);
  
      const result = await uploadImageToFirebase(imageUri, filename);
      expect(result).toBe(mockDownloadUrl);
    });
  
    test('writeDocumentToFirestore writes data to Firestore', async () => {
      const collectionName = 'testCollection';
      const data = { key: 'value' };
  
      (addDoc as jest.Mock).mockResolvedValue({ id: 'docId' });
  
      await writeDocumentToFirestore(collectionName, data);
      expect(collection).toHaveBeenCalledWith(expect.anything(), collectionName);
      expect(addDoc).toHaveBeenCalledWith(expect.any(Object), data);
    });
  
    // Test processImage
    test('processImage calls all necessary services and processes the image correctly', async () => {
      const mockImage = {
        width: 800,
        height: 600,
        base64Image: 'data:image/jpeg;base64,...'
      };
  
      const mockCaption = 'A friendly cartoon monster';
      const mockGeneratedImageUri = 'data:image/png;base64,...';
      const mockOriginalDownloadUrl = 'https://firebase.storage/original.jpg';
      const mockGeneratedDownloadUrl = 'https://firebase.storage/generated.jpg';
  
      jest.spyOn(imageUtils, 'getImageCaption').mockResolvedValue(mockCaption);
      jest.spyOn(imageUtils, 'generateCartoonMonster').mockResolvedValue(mockGeneratedImageUri);
      jest.spyOn(imageUtils, 'uploadImageToFirebase')
        .mockResolvedValueOnce(mockOriginalDownloadUrl)
        .mockResolvedValueOnce(mockGeneratedDownloadUrl);
      jest.spyOn(imageUtils, 'writeDocumentToFirestore').mockResolvedValue(undefined);
  
      await processImage(mockImage);
  
      expect(getImageCaption).toHaveBeenCalledWith(mockImage.base64Image);
      expect(generateCartoonMonster).toHaveBeenCalledWith(mockCaption);
      expect(uploadImageToFirebase).toHaveBeenCalledWith(mockImage.base64Image, expect.stringContaining('original'));
      expect(uploadImageToFirebase).toHaveBeenCalledWith(mockGeneratedImageUri, expect.stringContaining('generated'));
      expect(writeDocumentToFirestore).toHaveBeenCalledWith('generatedImages', expect.objectContaining({
        caption: mockCaption,
        originalImageDownloadUrl: mockOriginalDownloadUrl,
        generatedImageDownloadUrl: mockGeneratedDownloadUrl,
      }));
    });
  
    test('processImage handles caption failure gracefully', async () => {
      const mockImage = {
        width: 800,
        height: 600,
        base64Image: 'data:image/jpeg;base64,...'
      };
  
      jest.spyOn(imageUtils, 'getImageCaption').mockResolvedValue(null);
  
      await processImage(mockImage);
  
      expect(getImageCaption).toHaveBeenCalledWith(mockImage.base64Image);
      expect(generateCartoonMonster).not.toHaveBeenCalled();
      expect(uploadImageToFirebase).not.toHaveBeenCalled();
      expect(writeDocumentToFirestore).not.toHaveBeenCalled();
    });
  
    test('processImage handles image generation failure gracefully', async () => {
      const mockImage = {
        width: 800,
        height: 600,
        base64Image: 'data:image/jpeg;base64,...'
      };
  
      const mockCaption = 'A friendly cartoon monster';
  
      jest.spyOn(imageUtils, 'getImageCaption').mockResolvedValue(mockCaption);
      jest.spyOn(imageUtils, 'generateCartoonMonster').mockResolvedValue(null);
  
      await processImage(mockImage);
  
      expect(getImageCaption).toHaveBeenCalledWith(mockImage.base64Image);
      expect(generateCartoonMonster).toHaveBeenCalledWith(mockCaption);
      expect(uploadImageToFirebase).not.toHaveBeenCalled();
      expect(writeDocumentToFirestore).not.toHaveBeenCalled();
    });
  });
  