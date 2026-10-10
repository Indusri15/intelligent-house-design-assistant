import React, { useState } from 'react';
import { directAiApi } from '../services/api';
import {
  Camera,
  Upload,
  Layers,
  AlertTriangle,
  CheckCircle2,
  Maximize2,
  RefreshCw,
  Cpu,
  Info
} from 'lucide-react';

export const SiteAnalysisPage = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [segmentResult, setSegmentResult] = useState(null);
  const [activeTab, setActiveTab] = useState('boundary');
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setAnalysisResult(null);
      setSegmentResult(null);
      setError(null);
    }
  };

  const handleAnalyzeBoundary = async () => {
    if (!selectedFile) return;
    try {
      setAnalyzing(true);
      setError(null);
      const formData = new FormData();
      formData.append('file', selectedFile);

      const res = await directAiApi.analyzeSiteImage(formData);
      if (res.data.success) {
        setAnalysisResult(res.data.data);
      }
    } catch (err) {
      setError('AI Microservice error: Please ensure the Python FastAPI service is running on port 8000.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSegmentFloorplan = async () => {
    if (!selectedFile) return;
    try {
      setAnalyzing(true);
      setError(null);
      const formData = new FormData();
      formData.append('file', selectedFile);

      const res = await directAiApi.segmentFloorplan(formData);
      if (res.data.success) {
        setSegmentResult(res.data.data);
      }
    } catch (err) {
      setError('AI Microservice error: Please ensure the Python FastAPI service is running on port 8000.');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
              PYTHON FASTAPI & OPENCV PIPELINE
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-slate-500 font-semibold">CubiCasa5K Standard</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900">Computer Vision Site Survey & Floorplan Analyzer</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Upload site photographs or architectural drawings for automated boundary detection, perspective distortion checks, and neural room segmentation.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Upload & Image Viewport Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Input Drawing / Photograph</h3>
          
          <div className="border-2 border-dashed border-slate-300 rounded-2xl p-6 text-center hover:border-blue-500 transition-colors bg-slate-50">
            {previewUrl ? (
              <div className="space-y-3">
                <img
                  src={previewUrl}
                  alt="Site Preview"
                  className="max-h-72 mx-auto rounded-xl shadow-sm border border-slate-200 object-contain"
                />
                <label className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white border border-slate-300 text-slate-700 text-xs font-semibold cursor-pointer hover:bg-slate-50">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Change Drawing</span>
                  <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                </label>
              </div>
            ) : (
              <label className="cursor-pointer block space-y-2">
                <Camera className="w-10 h-10 text-slate-400 mx-auto" />
                <span className="text-xs font-bold text-slate-800 block">Click to upload site photo or blueprint</span>
                <span className="text-[11px] text-slate-500 block">PNG, JPG, WEBP formats up to 10MB</span>
                <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
              </label>
            )}
          </div>

          {/* Action Trigger Buttons */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleAnalyzeBoundary}
              disabled={!selectedFile || analyzing}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold shadow-sm transition-colors"
            >
              <Maximize2 className="w-4 h-4" />
              <span>Detect Plot Boundaries</span>
            </button>

            <button
              onClick={handleSegmentFloorplan}
              disabled={!selectedFile || analyzing}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-bold shadow-sm transition-colors"
            >
              <Cpu className="w-4 h-4" />
              <span>CubiCasa5K Segmentation</span>
            </button>
          </div>
        </div>

        {/* AI Inference Output Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Computer Vision Analysis Results</h3>

          {analyzing ? (
            <div className="p-12 text-center text-slate-400 text-xs flex flex-col items-center gap-3">
              <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
              <span>Running OpenCV edge detection and neural network inference...</span>
            </div>
          ) : analysisResult ? (
            <div className="space-y-4 text-xs">
              <div className="p-4 bg-blue-50/70 rounded-xl border border-blue-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-blue-900 uppercase text-[10px]">Aspect Ratio</span>
                  <span className="font-mono font-bold text-blue-700">{analysisResult.aspectRatio} : 1.0</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-blue-900 uppercase text-[10px]">Detection Confidence</span>
                  <span className="font-mono font-bold text-emerald-700">{Math.round(analysisResult.confidenceScore * 100)}%</span>
                </div>
              </div>

              {analysisResult.perspectiveWarning && (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-800 text-[11px] flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>{analysisResult.perspectiveWarning}</span>
                </div>
              )}

              <div>
                <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[10px] mb-2">Detected Boundary Polygon Vertices (Normalized 0..1)</h4>
                <div className="p-3 bg-slate-900 text-emerald-400 font-mono text-[11px] rounded-xl overflow-x-auto">
                  {JSON.stringify(analysisResult.detectedBoundaryPolygon, null, 2)}
                </div>
              </div>

              <div className="space-y-1">
                <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">Processing Notes</h4>
                <ul className="list-disc list-inside text-[11px] text-slate-600 space-y-0.5">
                  {analysisResult.notes.map((n, i) => (
                    <li key={i}>{n}</li>
                  ))}
                </ul>
              </div>
            </div>
          ) : segmentResult ? (
            <div className="space-y-4 text-xs">
              <div className="p-4 bg-purple-50/70 rounded-xl border border-purple-200 flex items-center justify-between">
                <div>
                  <span className="font-bold text-purple-900 uppercase text-[10px]">Semantic Model</span>
                  <p className="font-bold text-purple-950 mt-0.5">{segmentResult.modelName}</p>
                </div>
                <div className="text-right">
                  <span className="font-bold text-purple-900 uppercase text-[10px]">Mean IoU</span>
                  <p className="font-mono font-bold text-emerald-600 mt-0.5">{Math.round(segmentResult.meanIoU * 100)}%</p>
                </div>
              </div>

              {segmentResult.segmentationMaskBase64 && (
                <div>
                  <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[10px] mb-2">Colorized 10-Class Segmentation Mask</h4>
                  <img
                    src={`data:image/png;base64,${segmentResult.segmentationMaskBase64}`}
                    alt="Segmentation Mask"
                    className="max-h-64 mx-auto rounded-xl shadow-sm border border-slate-200"
                  />
                </div>
              )}

              <div className="p-3 bg-slate-50 rounded-xl text-[11px] text-slate-600">
                <span>Classes Detected: <strong>{segmentResult.classesDetected.join(', ')}</strong></span>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-slate-400 text-xs">
              Upload an image on the left and click "Detect Plot Boundaries" or "CubiCasa5K Segmentation" to inspect results.
            </div>
          )}

        </div>

      </div>

    </div>
  );
};

export default SiteAnalysisPage;
