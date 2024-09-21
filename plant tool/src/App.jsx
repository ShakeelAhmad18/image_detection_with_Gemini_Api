import { useState } from 'react';
import axios from 'axios';

function App() {
  const [image, setImage] = useState(null); // State for selected image
  const [preview, setPreview] = useState(null); // State for image preview
  const [loading, setLoading] = useState(false); // State for loading indicator
  const [result, setResult] = useState(null); // State for result after analysis
  const [analysisImage,setanalysisImage]=useState('')
  const [analysisResult,setAnalysisResult]=useState('')

  // Handle image upload and preview
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      setImage(file);
      setPreview(URL.createObjectURL(file)); // Corrected file reference
    } else {
      alert('Please upload a valid image file.');
      setImage(null);
      setPreview(null);
    }
  };

  // Handle form submission (image analysis)
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!image) {
      alert('Please upload an image first.');
      return;
    }

    setLoading(true);
    setResult(null);

    const formData = new FormData();
    formData.append('image', image);

    try {
      // You would send this to your backend for processing (e.g., /analyze endpoint)
      const response = await axios.post(
        'http://localhost:8000/analyze',
        formData,
        { withCredentials: true }
      );
      
       setAnalysisResult(response.data.result);
       setanalysisImage(response.data.image);
       

      setResult(response.data.result); // Axios automatically parses JSON response
      setLoading(false);
    } catch (error) {
      console.error('Error analyzing image:', error);
      setLoading(false);
    }
  };


  //download the pdf
  const handleDownLoad=async ()=>{

    const formData={
      image:analysisImage,
      result:analysisResult
    }

    console.log(formData)

    const res=await axios.post('http://localhost:8000/download',formData,{withCredentials:true})

    if(res.data.ok){
      const bolb=await res.bolb();
      const url=window.URL.createObjectURL(bolb)
      const a=document.createElement('a')
      a.href=url;
      a.download='Plant_analysis_report.pdf'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)

    }else{
      alert("Error:" + res.statusText)
    }
  }

  return (
    <div className="container">
      <h1>
        <i className="fas fa-leaf"></i> PlantScan: Advanced Plant Analysis Tool
      </h1>
      <p className="description">
        Upload an image of a plant to receive a detailed analysis of its species, health, and care recommendations.
      </p>

      <h2>How to Use</h2>
      <div className="cards">
        <div className="card">
          <i className="fas fa-upload card-icon"></i>
          <h3>Upload</h3>
          <p>Select or drag & drop a plant image</p>
        </div>
        <div className="card">
          <i className="fas fa-search card-icon"></i>
          <h3>Analyze</h3>
          <p>Click <strong>&apos;Analyze Plant&apos;</strong> to process the image</p>
        </div>
        <div className="card">
          <i className="fas fa-file-pdf card-icon"></i>
          <h3>Download</h3>
          <p>Get your detailed PDF report</p>
        </div>
      </div>

      <form id="uploadForm" onSubmit={handleFormSubmit}>
        <div className="upload-area" id="dropArea">
          <i className="fas fa-cloud-upload-alt upload-icon"></i>
          <p className="upload-text">Drag & Drop or Click to Upload Plant Image</p>
          <input
            type="file"
            name="image"
            required
            onChange={handleImageUpload}
          />
          {preview && <img id="imagePreview" src={preview} alt="Image preview" />}
        </div>
        <button type="submit" disabled={loading}>
          <i className="fas fa-search"></i> {loading ? 'Analyzing...' : 'Analyze Plant'}
        </button>
      </form>

      {loading && (
        <div id="loading">
          <i className="fas fa-spinner fa-spin"></i> Analyzing plant image...
        </div>
      )}

      {result && (
        <div id="result">
          <h3>Analysis Result</h3>
          <p>{result}</p>
          <button id="downloadButton" onClick={handleDownLoad}>
            <i className="fas fa-file-pdf"></i> Download PDF Report
          </button>
        </div>
      )}

      <h2>Features</h2>
      <div className="features">
        <div className="feature">
          <i className="fas fa-seedling feature-icon"></i>
          <span>Accurate plant species identification</span>
        </div>
        <div className="feature">
          <i className="fas fa-heartbeat feature-icon"></i>
          <span>Detailed plant health assessment</span>
        </div>
        <div className="feature">
          <i className="fas fa-list-ul feature-icon"></i>
          <span>Customized care recommendations</span>
        </div>
        <div className="feature">
          <i className="fas fa-history feature-icon"></i>
          <span>Fast processing and instant results</span>
        </div>
      </div>
    </div>
  );
}

export default App;
