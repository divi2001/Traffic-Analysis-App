// src/pages/ExampleVideos.tsx
import React, { useState, useEffect, useRef } from 'react';
import api from '../api';
import toast from 'react-hot-toast';

interface Video {
  id: number;
  title: string;
  video_path: string;
  thumbnail_path: string;
  description: string;
  category?: string;
  views_count?: number;
  type?: 'video' | 'image';
}

const inferType = (path: string): 'video' | 'image' => {
  const extension = path.split('.').pop()?.toLowerCase();
  const videoExtensions = ['mp4', 'mov', 'avi', 'webm'];
  return extension && videoExtensions.includes(extension) ? 'video' : 'image';
};

const ExampleVideos = () => {
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [playbackSpeed, setPlaybackSpeed] = useState(0.5); // Default to 0.5x speed
  const videoRef = useRef<HTMLVideoElement>(null);
  

  useEffect(() => {
    async function fetchExampleVideos() {
      try {
        const response = await api.get('/example-videos/');
        const dataWithTypes = response.data.map((video: Video) => ({
          ...video,
          type: inferType(video.video_path),
        }));
        setVideos(dataWithTypes);
      } catch (error) {
        toast.error('Failed to load example videos');
        console.error('Error fetching videos:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchExampleVideos();
  }, []);

  // Set the playback rate when video is loaded
  useEffect(() => {
    if (videoRef.current && selectedVideo) {
      videoRef.current.playbackRate = playbackSpeed;
    }
  }, [selectedVideo, playbackSpeed]);

  const incrementViews = async (videoId: number) => {
    try {
      await api.post(`/example-videos/${videoId}/view/`);
      setVideos(prevVideos => 
        prevVideos.map(video => 
          video.id === videoId 
            ? { ...video, views_count: (video.views_count || 0) + 1 } 
            : video
        )
      );
    } catch (error) {
      console.error('Error incrementing view count:', error);
    }
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Example Outputs</h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {videos.map((video) => (
          <div 
            key={video.id}
            className="bg-white rounded-lg shadow-lg overflow-hidden cursor-pointer transform transition duration-200 hover:scale-105"
            onClick={() => {
              setSelectedVideo(video);
              incrementViews(video.id);
            }}
          >
            <div className="aspect-w-16 aspect-h-9 bg-gray-200">
              <img 
                src={video.thumbnail_path}
                alt={video.title}
                className="w-full h-48 object-cover"
              />
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-gray-800 mb-2">{video.title}</h3>
              <p className="text-sm text-gray-600">{video.description}</p>
              {video.views_count && (
                <p className="text-xs text-gray-500 mt-2">
                  {video.views_count} views
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {selectedVideo && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full">
            <div className="p-4 border-b">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold">{selectedVideo.title}</h3>
                <button 
                  onClick={() => setSelectedVideo(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <span className="sr-only">Close</span>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="aspect-w-16 aspect-h-9">
              {selectedVideo.type === 'video' ? (
                <video 
                  ref={videoRef}
                  controls 
                  className="w-full h-full"
                  autoPlay
                  onLoadedMetadata={() => {
                    if (videoRef.current) {
                      videoRef.current.playbackRate = playbackSpeed;
                    }
                  }}
                >
                  <source src={selectedVideo.video_path} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              ) : (
                <img 
                  src={selectedVideo.video_path}
                  alt={selectedVideo.title}
                  className="max-h-full max-w-full object-contain"
                />
              )}
            </div>

            {selectedVideo.type === 'video' && (
              <div className="p-4 border-t">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-700">Playback Speed:</span>
                  <div className="flex space-x-2">
                    {[0.25, 0.5, 0.75, 1.0].map(speed => (
                      <button
                        key={speed}
                        onClick={() => handleSpeedChange(speed)}
                        className={`px-2 py-1 text-xs rounded ${
                          playbackSpeed === speed 
                            ? 'bg-blue-500 text-white' 
                            : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                        }`}
                      >
                        {speed}x
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ExampleVideos;