import { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, getFirestore } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, getStorage } from 'firebase/storage';
import { app } from '../firebase/config';

// Initialize services directly in the component for testing
const db = getFirestore(app);
const storage = getStorage(app);

export default function FirebaseTest() {
  const [message, setMessage] = useState('Testing Firebase connection...');
  const [testData, setTestData] = useState<any[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState('');

  // Test Firestore connection
  const testFirestore = async () => {
    try {
      console.log('Testing Firestore connection...');
      
      // Test writing
      const docRef = await addDoc(collection(db, 'test'), {
        message: 'Hello, Firebase!',
        timestamp: new Date().toISOString()
      });
      console.log('Document written with ID: ', docRef.id);
      setMessage(`Document written with ID: ${docRef.id}`);
      
      // Test reading
      const querySnapshot = await getDocs(collection(db, 'test'));
      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      console.log('Retrieved documents:', data);
      setTestData(data);
      
      // Test connection to Firestore
      await getDocs(collection(db, 'test'));
      console.log('Firestore connection successful!');
    } catch (error: unknown) {
      console.error('Firestore error:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      setMessage(`Firestore error: ${errorMessage}`);
    }
  };

  // Test Storage connection
  const testStorage = async () => {
    if (!file) return;
    
    try {
      console.log('Testing Storage upload...');
      const storageRef = ref(storage, `test/${Date.now()}_${file.name}`);
      
      console.log('Uploading file...');
      const uploadResult = await uploadBytes(storageRef, file);
      console.log('Upload result:', uploadResult);
      
      console.log('Getting download URL...');
      const url = await getDownloadURL(storageRef);
      console.log('Download URL:', url);
      
      setImageUrl(url);
      setMessage('File uploaded successfully!');
    } catch (error: unknown) {
      console.error('Storage error:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      setMessage(`Storage error: ${errorMessage}`);
    }
  };

  useEffect(() => {
    testFirestore();
  }, []);

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Firebase Connection Test</h2>
      
      <div className="mb-6 p-4 bg-blue-100 rounded">
        <p className="font-semibold">Status: {message}</p>
      </div>

      <div className="mb-6">
        <h3 className="text-xl font-semibold mb-2">Firestore Test Data:</h3>
        <pre className="bg-gray-100 p-3 rounded overflow-auto">
          {JSON.stringify(testData, null, 2)}
        </pre>
      </div>

      <div className="border-t pt-4">
        <h3 className="text-xl font-semibold mb-3">Storage Test:</h3>
        <div className="flex flex-col space-y-4">
          <input
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-md file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100"
          />
          <button
            onClick={testStorage}
            disabled={!file}
            className={`px-4 py-2 rounded text-white font-medium ${
              file ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-400 cursor-not-allowed'
            }`}
          >
            Upload Test File
          </button>
          {imageUrl && (
            <div className="mt-4">
              <p className="font-medium mb-2">Uploaded Image:</p>
              <img 
                src={imageUrl} 
                alt="Uploaded preview" 
                className="max-w-xs border rounded"
              />
              <p className="text-sm text-gray-600 mt-2 break-all">{imageUrl}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
