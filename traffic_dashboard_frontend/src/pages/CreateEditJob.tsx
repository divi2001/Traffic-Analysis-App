// src/pages/CreateEditJob.tsx
import React, { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { Upload, MapPin, Send, Trash2, ArrowLeft } from 'lucide-react';
import { GoogleMap, LoadScriptNext as LoadScript, Marker } from '@react-google-maps/api';
import toast from "react-hot-toast";
import api from "../api";
import { useNavigate, useParams, Link } from "react-router-dom";

interface FormData {
  jobNumber: string;
  latitude: string;
  longitude: string;
  additionalNotes: string;
  surveyHours: string;
  videoFiles: File[];
  surveyTypes: string[];
}

interface JobDetails {
  id: number;
  job_number: string;
  name: string;
  latitude: string;
  longitude: string;
  additional_notes: string;
  survey_hours: string;
  survey_types: string[];
  videos: { id: number; filename: string }[];
  status: string;
  created_at: string;
  completed_at: string | null;
}

const CreateEditJob = () => {
  const navigate = useNavigate();
  const { jobId } = useParams();
  const [isViewMode, setIsViewMode] = useState(false);
  const [jobDetails, setJobDetails] = useState<JobDetails | null>(null);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState<FormData>({
    jobNumber: '',
    latitude: '33.749',
    longitude: '-84.388',
    additionalNotes: '',
    surveyHours: '',
    videoFiles: [],
    surveyTypes: []
  });

  const [mapCenter, setMapCenter] = useState({
    lat: 33.749,
    lng: -84.388
  });

  const [savedLocation, setSavedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isEditingLocation, setIsEditingLocation] = useState(false);

  const mapContainerStyle = {
    width: '100%',
    height: '100%'
  };

  useEffect(() => {
    if (jobId) {
      if (window.location.pathname.includes('view-job')) {
        setIsViewMode(true);
      }
      
      const fetchJobDetails = async () => {
        setLoading(true);
        try {
          const response = await api.get(`/jobs/${jobId}/`);
          const job = response.data;
          setJobDetails(job);
          
          setFormData({
            jobNumber: job.job_number || job.name || '',
            latitude: job.latitude || '33.749',
            longitude: job.longitude || '-84.388',
            additionalNotes: job.additional_notes || '',
            surveyHours: job.survey_hours || '',
            videoFiles: [],
            surveyTypes: job.survey_types || []
          });
          
          if (job.latitude && job.longitude) {
            const lat = parseFloat(job.latitude);
            const lng = parseFloat(job.longitude);
            if (!isNaN(lat) && !isNaN(lng)) {
              setMapCenter({ lat, lng });
              setSavedLocation({ lat, lng });
            }
          }
        } catch (error) {
          console.error("Error fetching job details:", error);
          toast.error("Failed to load job details");
        } finally {
          setLoading(false);
        }
      };
      
      fetchJobDetails();
    }
  }, [jobId]);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (isViewMode) return;
    
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));

    if (name === 'latitude' || name === 'longitude') {
      const newLat = name === 'latitude' ? parseFloat(value) : parseFloat(formData.latitude);
      const newLng = name === 'longitude' ? parseFloat(value) : parseFloat(formData.longitude);
      
      if (!isNaN(newLat) && !isNaN(newLng)) {
        setMapCenter({ lat: newLat, lng: newLng });
      }
    }
  };

  const handleSurveyTypeChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (isViewMode) return;
    
    const { value, checked } = e.target;
    
    setFormData(prevState => {
      if (checked) {
        return {
          ...prevState,
          surveyTypes: [...prevState.surveyTypes, value]
        };
      } else {
        return {
          ...prevState,
          surveyTypes: prevState.surveyTypes.filter(type => type !== value)
        };
      }
    });
  };

  const handleMapClick = (e: google.maps.MapMouseEvent) => {
    if (isViewMode) return;
    
    if (e.latLng && isEditingLocation) {
      const newLat = e.latLng.lat();
      const newLng = e.latLng.lng();
      
      setMapCenter({ lat: newLat, lng: newLng });
      setFormData(prevState => ({
        ...prevState,
        latitude: newLat.toString(),
        longitude: newLng.toString()
      }));
    }
  };

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    if (isViewMode) return;
    
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setFormData(prevState => ({
        ...prevState,
        videoFiles: [...prevState.videoFiles, ...newFiles]
      }));
    }
  };

  const handleRemoveFile = (index: number) => {
    if (isViewMode) return;
    
    setFormData(prevState => ({
      ...prevState,
      videoFiles: prevState.videoFiles.filter((_, i) => i !== index)
    }));
  };

  const handleSaveLocation = () => {
    if (isViewMode) return;
    
    setSavedLocation(mapCenter);
    setIsEditingLocation(false);
    toast.success('Location saved successfully!');
  };

  const handleChangeLocation = () => {
    if (isViewMode) return;
    
    setIsEditingLocation(true);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (isViewMode) return;
    
    const toastId = toast.loading('Creating job and starting analysis...');
    
    try {
      const jobResponse = await api.post('/jobs/create/', {
        name: formData.jobNumber,
        job_number: formData.jobNumber,
        latitude: formData.latitude,
        longitude: formData.longitude,
        additional_notes: formData.additionalNotes,
        survey_hours: formData.surveyHours,
        survey_types: formData.surveyTypes
      });

      const jobId = jobResponse.data.id;

      if (formData.videoFiles.length > 0) {
        toast.loading('Uploading video files...', { id: toastId });
        const formDataVideos = new FormData();
        formData.videoFiles.forEach(file => {
          formDataVideos.append('files', file);
        });

        await api.post(`/jobs/${jobId}/upload-videos/`, formDataVideos, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
      }

      toast.success('Job created and analysis started! Redirecting to dashboard...', { 
        id: toastId,
        duration: 3000
      });
      
      setFormData({
        jobNumber: '',
        latitude: '',
        longitude: '',
        additionalNotes: '',
        surveyHours: '',
        videoFiles: [],
        surveyTypes: []
      });
      
      setTimeout(() => {
        navigate('/dashboard', {
          state: { scrollToJob: jobId }
        });
      }, 1000);
      
    } catch (error: any) {
      if (error.response?.data?.detail) {
        toast.error(`Failed to create job: ${error.response.data.detail}`, { id: toastId });
      } else {
        toast.error('Failed to create job. Please try again.', { id: toastId });
      }
      console.error('Job creation error:', error);
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center mb-8">
          {isViewMode && (
            <Link to="/dashboard" className="mr-4 p-2 rounded-full hover:bg-gray-200 transition-colors">
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </Link>
          )}
          <h1 className="text-2xl font-semibold text-gray-800">
            {isViewMode ? `Job Details: ${formData.jobNumber}` : 'Create New Job'}
          </h1>
        </div>
        
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="relative">
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    Job Number / Name
                  </label>
                  <input
                    type="text"
                    name="jobNumber"
                    value={formData.jobNumber}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 border border-gray-200 rounded-lg ${!isViewMode ? "focus:ring-2 focus:ring-blue-500 focus:border-transparent" : "bg-gray-50"} transition-all duration-200`}
                    placeholder="Enter job number or name"
                    disabled={isViewMode}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="relative">
                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                      Latitude
                    </label>
                    <input
                      type="text"
                      name="latitude"
                      value={formData.latitude}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2 border border-gray-200 rounded-lg ${!isViewMode ? "focus:ring-2 focus:ring-blue-500 focus:border-transparent" : "bg-gray-50"} transition-all duration-200`}
                      placeholder="Enter latitude"
                      disabled={isViewMode}
                    />
                  </div>
                  <div className="relative">
                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                      Longitude
                    </label>
                    <input
                      type="text"
                      name="longitude"
                      value={formData.longitude}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2 border border-gray-200 rounded-lg ${!isViewMode ? "focus:ring-2 focus:ring-blue-500 focus:border-transparent" : "bg-gray-50"} transition-all duration-200`}
                      placeholder="Enter longitude"
                      disabled={isViewMode}
                    />
                  </div>
                </div>

                <div className="relative">
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    Additional Notes
                  </label>
                  <textarea
                    name="additionalNotes"
                    value={formData.additionalNotes}
                    onChange={handleInputChange}
                    rows={4}
                    className={`w-full px-4 py-2 border border-gray-200 rounded-lg ${!isViewMode ? "focus:ring-2 focus:ring-blue-500 focus:border-transparent" : "bg-gray-50"} transition-all duration-200`}
                    placeholder="Enter any additional notes"
                    disabled={isViewMode}
                  />
                </div>

                <div className="relative">
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    Survey Type (Select all that apply)
                  </label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {['TMC', 'PED/CYCLING', 'NEAR MISS', 'QUEUE', 'SPEED'].map((type) => (
                      <div key={type} className="flex items-center">
                        <input
                          type="checkbox"
                          id={`survey-${type}`}
                          value={type}
                          checked={formData.surveyTypes.includes(type)}
                          onChange={handleSurveyTypeChange}
                          disabled={isViewMode}
                          className={`h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded ${
                            isViewMode ? 'bg-gray-100' : ''
                          }`}
                        />
                        <label htmlFor={`survey-${type}`} className="ml-2 text-sm text-gray-700">
                          {type}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="relative">
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    Survey Hours
                  </label>
                  <input
                    type="text"
                    name="surveyHours"
                    value={formData.surveyHours}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 border border-gray-200 rounded-lg ${!isViewMode ? "focus:ring-2 focus:ring-blue-500 focus:border-transparent" : "bg-gray-50"} transition-all duration-200`}
                    placeholder="Enter survey hours (e.g., 9:00 AM - 5:00 PM)"
                    disabled={isViewMode}
                  />
                </div>

                {isViewMode && jobDetails && jobDetails.videos && jobDetails.videos.length > 0 ? (
                  <div className="relative">
                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                      Videos
                    </label>
                    <div className="border border-gray-200 rounded-lg p-4 max-h-48 overflow-y-auto">
                      <ul className="space-y-2">
                        {jobDetails.videos.map((video, index) => (
                          <li key={index} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-medium text-gray-700 truncate max-w-xs">
                                {video.filename}
                              </span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ) : !isViewMode && (
                  <>
                    <div className="relative">
                      <label className="text-sm font-medium text-gray-700 mb-1 block">
                        Files that have been added
                      </label>
                      <div className="border border-gray-200 rounded-lg p-4 max-h-48 overflow-y-auto">
                        {formData.videoFiles.length === 0 ? (
                          <p className="text-sm text-gray-500 text-center py-4">No files uploaded yet</p>
                        ) : (
                          <ul className="space-y-2">
                            {formData.videoFiles.map((file, index) => (
                              <li key={index} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                                <div className="flex items-center space-x-2">
                                  <span className="text-sm font-medium text-gray-700 truncate max-w-xs">
                                    {file.name}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {(file.size / (1024 * 1024)).toFixed(2)} MB
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveFile(index)}
                                  className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>

                    <div className="relative">
                      <div
                        onClick={() => document.getElementById('fileUpload')?.click()}
                        className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 transition-colors duration-200"
                      >
                        <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                        <p className="text-sm font-medium text-gray-700">Upload Video File</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formData.videoFiles.length > 0 
                            ? `${formData.videoFiles.length} file(s) selected` 
                            : 'Click to browse or drag and drop'}
                        </p>
                      </div>
                      <input
                        id="fileUpload"
                        type="file"
                        accept="video/*"
                        onChange={handleFileUpload}
                        className="hidden"
                        multiple
                      />
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="flex-1 flex flex-col h-full">
              <div className="flex-1 rounded-lg overflow-hidden shadow-md">
                <LoadScript
                  googleMapsApiKey="AIzaSyAev9Ol8x89pU3U89tTeODOv5Uhhu9uBAA"
                  loadingElement={<div className="flex items-center justify-center h-full">Loading Map...</div>}
                >
                  <GoogleMap
                    mapContainerStyle={{ width: "100%", height: "100%" }}
                    center={mapCenter}
                    zoom={13}
                    onClick={isViewMode ? undefined : handleMapClick}
                    options={{ draggableCursor: isViewMode ? 'default' : 'pointer' }}
                  >
                    <Marker position={mapCenter} />
                    {savedLocation && !isEditingLocation && (
                      <Marker 
                        position={savedLocation} 
                        icon={{
                          path: google.maps.SymbolPath.CIRCLE,
                          scale: 7,
                          fillColor: "#4285F4",
                          fillOpacity: 1,
                          strokeWeight: 2,
                          strokeColor: "white"
                        }}
                      />
                    )}
                  </GoogleMap>
                </LoadScript>
              </div>

              {!isViewMode && (
                <div className="flex space-x-4 mt-4">
                  <button
                    type="button"
                    onClick={handleChangeLocation}
                    className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors duration-200 flex items-center justify-center space-x-2 font-medium"
                  >
                    <MapPin className="w-4 h-4" />
                    <span>Change Location</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveLocation}
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center space-x-2 font-medium"
                  >
                    <MapPin className="w-4 h-4" />
                    <span>Save Location</span>
                  </button>
                </div>
              )}

              <div className="mt-2 text-sm text-gray-600 text-center">
                {isViewMode && mapCenter 
                  ? `Location: ${mapCenter.lat.toFixed(6)}, ${mapCenter.lng.toFixed(6)}`
                  : isEditingLocation 
                    ? 'Click on the map to select a new location.' 
                    : savedLocation 
                      ? `Location saved at: ${savedLocation.lat.toFixed(6)}, ${savedLocation.lng.toFixed(6)}`
                      : 'No location saved yet.'}
              </div>

              {!isViewMode && (
                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center space-x-2 font-medium mt-6"
                >
                  <Send className="w-5 h-5" />
                  <span>Submit Job for Analysis</span>
                </button>
              )}
              
              {isViewMode && jobDetails && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Job Status</h3>
                  <div className="flex flex-col space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Status:</span>
                      <span className={`text-sm font-medium ${
                        jobDetails.status === 'ANALYZING' ? 'text-amber-600' : 
                        jobDetails.status === 'COMPLETED' ? 'text-green-600' : 'text-gray-800'
                      }`}>
                        {jobDetails.status}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Created:</span>
                      <span className="text-sm text-gray-800">
                        {new Date(jobDetails.created_at).toLocaleString()}
                      </span>
                    </div>
                    {jobDetails.completed_at && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Completed:</span>
                        <span className="text-sm text-gray-800">
                          {new Date(jobDetails.completed_at).toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateEditJob;