import { useState } from "react";
import api from "../api";
import toast from "react-hot-toast";

export default function UploadVideo() {
  const [file, setFile] = useState<File | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<boolean>(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;  // ✅ Ensure file exists before setting state
    setFile(selectedFile);
    setUploadSuccess(false);
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error("Please select a video file.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      await api.post("/videos/upload/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("✅ Video uploaded successfully!");
      setUploadSuccess(true);
      setFile(null);
    } catch (error) {
      toast.error("❌ Upload failed.");
      setUploadSuccess(false);
    }
  };

  return (
    <div className="pt-16">
      <h1 className="text-2xl font-bold mb-4">📤 Upload Video</h1>
      <p>Upload your video files for processing.</p>

      {!uploadSuccess ? (
        <div>
          <input
            type="file"
            accept="video/*"
            onChange={handleFileChange}
            className="border p-2 rounded"
          />
          <button
            onClick={handleUpload}
            className={`p-2 rounded ml-2 ${
              file ? "bg-blue-500 text-white" : "bg-gray-400 text-gray-700 cursor-not-allowed"
            }`}
            disabled={!file}
          >
            Upload
          </button>
        </div>
      ) : (
        <div className="mt-4 p-4 border rounded bg-green-100">
          <h2 className="text-green-700 font-bold">✅ Upload Successful!</h2>
          <p className="text-gray-700">Your video has been uploaded successfully.</p>

          <div className="mt-4 flex gap-4">
            <button
              onClick={() => setUploadSuccess(false)}
              className="bg-blue-500 hover:bg-blue-700 text-white px-4 py-2 rounded transition"
            >
              📤 Upload Another Video
            </button>
            <button
              onClick={() => window.location.href = "/dashboard"}
              className="bg-blue-500 hover:bg-blue-700 text-white px-4 py-2 rounded transition"
            >
              📊 Go to Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}