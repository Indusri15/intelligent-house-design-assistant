import React, { useState, useEffect } from 'react';
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
  Info,
  Server,
  Eye,
  Sliders,
  HelpCircle,
  ShieldAlert,
  Sparkles,
  FileText
} from 'lucide-react';

export const SiteAnalysisPage = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [segmentResult, setSegmentResult] = useState(null);
  const [activeTab, setActiveTab] = useState('boundary');
  const [boundaryViewMode, setBoundaryViewMode] = useState('side-by-side'); // 'side-by-side' | 'overlay' | 'wireframe' | 'original'
  const [segViewMode, setSegViewMode] = useState('side-by-side'); // 'side-by-side' | 'overlay' | 'mask' | 'original'
  const [error, setError] = useState(null);
  const [serviceStatus, setServiceStatus] = useState({ checked: false, online: false, message: 'Checking AI service...' });

  // Official CubiCasa5K 10-Class Taxonomy & Colors
  const cubicasaClasses = [
    { id: 0, name: 'Background', color: '#1e293b', border: '#334155', desc: 'Exterior / Empty' },
    { id: 1, name: 'Structural Wall', color: '#334155', border: '#475569', desc: 'Bearing & Partitions' },
    { id: 2, name: 'Living Room', color: '#3b82f6', border: '#60a5fa', desc: 'Drawing / Lounge' },
    { id: 3, name: 'Bedroom', color: '#8b5cf6', border: '#a78bfa', desc: 'Master / Guest' },
    { id: 4, name: 'Kitchen', color: '#f97316', border: '#fb923c', desc: 'Cooking Area' },
    { id: 5, name: 'Bathroom', color: '#06b6d4', border: '#22d3ee', desc: 'Bath / WC / Powder' },
    { id: 6, name: 'Balcony', color: '#10b981', border: '#34d399', desc: 'Deck / Verandah' },
    { id: 7, name: 'Corridor', color: '#eab308', border: '#facc15', desc: 'Foyer / Hallway' },
    { id: 8, name: 'Door', color: '#ef4444', border: '#f87171', desc: 'Single / Double Door' },
    { id: 9, name: 'Window', color: '#60a5fa', border: '#93c5fd', desc: 'Glazed Fenestration' },
  ];

  const checkService = async () => {
    try {
      setServiceStatus((prev) => ({ ...prev, message: 'Checking AI service...' }));
      const res = await directAiApi.checkHealth();
      if (res.data?.success || res.data?.status === 'ONLINE' || res.data?.data?.status === 'ONLINE') {
        setServiceStatus({
          checked: true,
          online: true,
          serviceUrl: res.data?.serviceUrl,
          message: 'FastAPI AI Microservice Connected'
        });
      } else {
        setServiceStatus({
          checked: true,
          online: false,
          message: res.data?.message || 'AI Microservice offline'
        });
      }
    } catch (err) {
      setServiceStatus({
        checked: true,
        online: false,
        message: err.response?.data?.message || 'Python AI Service not reachable'
      });
    }
  };

  // Check microservice health on mount
  useEffect(() => {
    checkService();
  }, []);

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
      setSegmentResult(null);
      setActiveTab('boundary');
      const formData = new FormData();
      formData.append('file', selectedFile);

      const res = await directAiApi.analyzeSiteImage(formData);
      if (res.data?.success) {
        setAnalysisResult(res.data.data);
      } else if (res.data?.data) {
        // Image processing completed with exploratory notes or diagnostic
        setAnalysisResult(res.data.data);
      } else {
        setError(res.data?.message || 'Site boundary analysis could not be completed');
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'AI Microservice error: Python FastAPI service is unreachable.';
      setError(errMsg);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSegmentFloorplan = async () => {
    if (!selectedFile) return;
    try {
      setAnalyzing(true);
      setError(null);
      setAnalysisResult(null);
      setActiveTab('segmentation');
      const formData = new FormData();
      formData.append('file', selectedFile);

      const res = await directAiApi.segmentFloorplan(formData);
      if (res.data?.success) {
        setSegmentResult(res.data.data);
      } else if (res.data?.data) {
        // Fallback / Demo Mode result returned from backend
        setSegmentResult(res.data.data);
      } else {
        setError(res.data?.message || 'Floorplan segmentation could not be completed');
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'AI Microservice error: Python FastAPI service is unreachable.';
      setError(errMsg);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
              OPENCV & CUBICASA5K PIPELINE
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-slate-500 font-semibold">Architectural Image Diagnostic Suite</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900">Computer Vision Site Survey & Floorplan Analyzer</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Evaluate plot survey geometry, perspective distortions, and CubiCasa5K architectural multi-class semantic segmentation.
          </p>
        </div>

        {/* Microservice Status Badge with Refresh Control */}
        <div className="flex items-center gap-2">
          {serviceStatus.checked && (
            <div
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
                serviceStatus.online
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                  : 'bg-amber-50 border-amber-300 text-amber-800'
              }`}
              title={serviceStatus.message}
            >
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  serviceStatus.online ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                }`}
              />
              <span className="text-[11px] font-bold">
                AI Service: {serviceStatus.online ? 'ONLINE' : 'STANDBY / OFFLINE'}
              </span>
              <button
                type="button"
                onClick={checkService}
                title="Refresh connection status"
                className="ml-1 p-0.5 text-slate-500 hover:text-slate-700 rounded"
              >
                <RefreshCw className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
          <div className="flex-1">
            <span className="font-semibold block">Service Communication Notice</span>
            <span>{error}</span>
          </div>
          <button
            onClick={activeTab === 'boundary' ? handleAnalyzeBoundary : handleSegmentFloorplan}
            className="px-3 py-1 bg-amber-600 text-white rounded-lg font-semibold hover:bg-amber-700 text-[11px] shrink-0"
          >
            Retry
          </button>
        </div>
      )}

      {/* Main Grid: Upload Viewport (Left) & CV Outputs (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Upload & Image Viewport Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Input Drawing / Photograph</h3>
            {previewUrl && (
              <span className="text-[11px] text-slate-400 font-medium">Ready for Computer Vision Analysis</span>
            )}
          </div>
          
          <div className="border-2 border-dashed border-slate-300 rounded-2xl p-6 text-center hover:border-blue-500 transition-colors bg-slate-50">
            {previewUrl ? (
              <div className="space-y-3">
                <img
                  src={previewUrl}
                  alt="Site Preview"
                  className="max-h-72 mx-auto rounded-xl shadow-xs border border-slate-200 object-contain"
                />
                <label className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white border border-slate-300 text-slate-700 text-xs font-semibold cursor-pointer hover:bg-slate-50 shadow-2xs">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Change Image</span>
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

          {/* Action Trigger Buttons with Clear Function Subtitles */}
          <div className="space-y-2.5">
            <button
              onClick={handleAnalyzeBoundary}
              disabled={!selectedFile || analyzing}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-white text-xs font-bold shadow-xs transition-all ${
                activeTab === 'boundary' && analysisResult ? 'bg-blue-700 ring-2 ring-blue-400' : 'bg-blue-600 hover:bg-blue-500'
              } disabled:opacity-50`}
            >
              <div className="flex items-center gap-2.5">
                <Maximize2 className="w-4 h-4 shrink-0" />
                <div className="text-left">
                  <div className="font-bold text-xs">Detect Plot Boundaries</div>
                  <div className="text-[10px] text-blue-100 font-normal">OpenCV Structural Contours & Edges</div>
                </div>
              </div>
              <span className="text-[10px] bg-blue-800/70 border border-blue-400/40 px-2 py-0.5 rounded font-semibold text-blue-100">
                OpenCV
              </span>
            </button>

            <button
              onClick={handleSegmentFloorplan}
              disabled={!selectedFile || analyzing}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-white text-xs font-bold shadow-xs transition-all ${
                activeTab === 'segmentation' && segmentResult ? 'bg-purple-700 ring-2 ring-purple-400' : 'bg-purple-600 hover:bg-purple-500'
              } disabled:opacity-50`}
            >
              <div className="flex items-center gap-2.5">
                <Cpu className="w-4 h-4 shrink-0" />
                <div className="text-left">
                  <div className="font-bold text-xs">CubiCasa5K Segmentation</div>
                  <div className="text-[10px] text-purple-100 font-normal">Demo Mode — OpenCV Analysis</div>
                </div>
              </div>
              <span className="text-[10px] bg-purple-800/70 border border-purple-400/40 px-2 py-0.5 rounded font-semibold text-purple-100">
                Demo Mode
              </span>
            </button>
            <p className="text-[10px] text-slate-400 italic px-1">
              * CubiCasa5K runs in Demo Mode using backend OpenCV feature filters while PyTorch weights are standby.
            </p>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl text-[11px] text-slate-500 space-y-1 border border-slate-200">
            <p className="font-semibold text-slate-700 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-blue-500" />
              Input Suitability Guidance:
            </p>
            <p>• <strong>Plot Boundary:</strong> Works best with top-down cadastral surveys or aerial maps. Perspective room photos yield exploratory edge extraction.</p>
            <p>• <strong>CubiCasa5K:</strong> Formulated for architectural floor plans. Operates in OpenCV demo mode if weights are standby.</p>
          </div>
        </div>

        {/* AI Inference Output Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900">Computer Vision Analysis Results</h3>
            <div className="flex gap-1 bg-slate-100 p-1 rounded-xl text-[11px] font-semibold">
              <button
                type="button"
                onClick={() => setActiveTab('boundary')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  activeTab === 'boundary' ? 'bg-white text-blue-700 shadow-xs font-bold' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Site Boundary / Image Analysis {analysisResult && '✓'}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('segmentation')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  activeTab === 'segmentation' ? 'bg-white text-purple-700 shadow-xs font-bold' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                CubiCasa5K (Demo Mode) {segmentResult && '✓'}
              </button>
            </div>
          </div>

          {analyzing ? (
            <div className="p-16 text-center text-slate-400 text-xs flex flex-col items-center gap-3">
              <RefreshCw className="w-7 h-7 animate-spin text-blue-600" />
              <span className="font-medium text-slate-600">
                {activeTab === 'boundary'
                  ? 'Running OpenCV edge extraction & structural contour solver...'
                  : 'Executing OpenCV architectural feature extraction in Demo Mode...'}
              </span>
              <span className="text-[11px] text-slate-400">Processing uploaded image pixels on FastAPI AI service</span>
            </div>
          ) : activeTab === 'boundary' && analysisResult ? (
            <div className="space-y-4 text-xs">
              
              {/* Case 1: Photographic Input (Interior or Construction Site) */}
              {!analysisResult.isSurveyPlan && analysisResult.isExploratoryPreview ? (
                <>
                  {/* Status Banner */}
                  <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-blue-50/60 rounded-xl border border-blue-200">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-blue-600" />
                      <div>
                        <span className="font-bold text-blue-900 text-xs">Exploratory Scene Contours Extracted</span>
                        <p className="text-[10px] text-blue-700">OpenCV bilateral filtering & Canny edge detection completed</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                        {analysisResult.dimensions?.width} × {analysisResult.dimensions?.height} px
                      </span>
                    </div>
                  </div>

                  {/* View Mode Toggle Controls */}
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Visualization Viewport
                    </span>
                    <div className="flex p-0.5 bg-slate-100 rounded-lg text-[10px] font-semibold">
                      <button
                        type="button"
                        onClick={() => setBoundaryViewMode('side-by-side')}
                        className={`px-2 py-1 rounded transition-all ${
                          boundaryViewMode === 'side-by-side' ? 'bg-white text-blue-700 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        Side-by-Side
                      </button>
                      <button
                        type="button"
                        onClick={() => setBoundaryViewMode('overlay')}
                        className={`px-2 py-1 rounded transition-all ${
                          boundaryViewMode === 'overlay' ? 'bg-white text-blue-700 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        Blended Overlay
                      </button>
                      <button
                        type="button"
                        onClick={() => setBoundaryViewMode('wireframe')}
                        className={`px-2 py-1 rounded transition-all ${
                          boundaryViewMode === 'wireframe' ? 'bg-white text-blue-700 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        CAD Edge Map
                      </button>
                      <button
                        type="button"
                        onClick={() => setBoundaryViewMode('original')}
                        className={`px-2 py-1 rounded transition-all ${
                          boundaryViewMode === 'original' ? 'bg-white text-blue-700 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        Original
                      </button>
                    </div>
                  </div>

                  {/* Image Viewports */}
                  {boundaryViewMode === 'side-by-side' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-slate-600">Original Photograph</span>
                          <span className="text-[9px] text-slate-400">Input</span>
                        </div>
                        <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-900 aspect-4/3 flex items-center justify-center p-1">
                          <img src={previewUrl} alt="Original Photograph" className="max-h-52 w-full h-full object-contain" />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-cyan-800">OpenCV Processed Result</span>
                          <span className="text-[9px] text-cyan-600 bg-cyan-50 px-1.5 py-0.2 rounded font-semibold">Cyan & Emerald Contours</span>
                        </div>
                        <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-900 aspect-4/3 flex items-center justify-center p-1">
                          {analysisResult.overlayImageBase64 ? (
                            <img
                              src={`data:image/jpeg;base64,${analysisResult.overlayImageBase64}`}
                              alt="OpenCV Edge Preview"
                              className="max-h-52 w-full h-full object-contain"
                            />
                          ) : (
                            <span className="text-slate-400 text-xs">Preview unavailable</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-900 aspect-4/3 max-h-72 mx-auto flex items-center justify-center p-1">
                      {boundaryViewMode === 'overlay' && analysisResult.overlayImageBase64 ? (
                        <img
                          src={`data:image/jpeg;base64,${analysisResult.overlayImageBase64}`}
                          alt="OpenCV Processed Overlay"
                          className="w-full h-full object-contain"
                        />
                      ) : boundaryViewMode === 'wireframe' && analysisResult.edgeMapBase64 ? (
                        <img
                          src={`data:image/png;base64,${analysisResult.edgeMapBase64}`}
                          alt="CAD Edge Wireframe"
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <img
                          src={previewUrl}
                          alt="Original Photograph"
                          className="w-full h-full object-contain"
                        />
                      )}
                    </div>
                  )}

                  {/* Quantitative Feature Breakdown Card */}
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-blue-600" />
                        Detected Visual Features & Metrics
                      </span>
                      <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        OpenCV Quantitative Output
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      {analysisResult.featureExplanation ||
                        `OpenCV bilateral filtering and Canny edge analysis identified ${analysisResult.structuralEdgesCount} major structural contours and ${analysisResult.totalContoursCount} feature lines (${analysisResult.edgeDensityPercent}% edge density), representing physical walls, openings, and ceiling junctions.`}
                    </p>

                    {/* Quantitative Metric Tiles */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                      <div className="p-2 bg-white rounded-xl border border-slate-200 shadow-2xs">
                        <span className="text-[10px] text-slate-400 block font-medium">Major Contours</span>
                        <span className="text-xs font-bold text-slate-800">{analysisResult.structuralEdgesCount ?? 0}</span>
                      </div>
                      <div className="p-2 bg-white rounded-xl border border-slate-200 shadow-2xs">
                        <span className="text-[10px] text-slate-400 block font-medium">Total Edges</span>
                        <span className="text-xs font-bold text-slate-800">{analysisResult.totalContoursCount ?? 0}</span>
                      </div>
                      <div className="p-2 bg-white rounded-xl border border-slate-200 shadow-2xs">
                        <span className="text-[10px] text-slate-400 block font-medium">Edge Density</span>
                        <span className="text-xs font-bold text-cyan-700">{analysisResult.edgeDensityPercent ?? 0}%</span>
                      </div>
                      <div className="p-2 bg-white rounded-xl border border-slate-200 shadow-2xs">
                        <span className="text-[10px] text-slate-400 block font-medium">Aspect Ratio</span>
                        <span className="text-xs font-bold text-slate-800">{analysisResult.aspectRatio} : 1</span>
                      </div>
                    </div>

                    {/* Detected Feature Badges */}
                    {analysisResult.detectedFeatures?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {analysisResult.detectedFeatures.map((feat, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-white text-slate-700 border border-slate-200"
                          >
                            ✓ {feat}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Clear Legal & Scale Limitation Notice */}
                  <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-300 text-[11px] text-amber-900 space-y-1.5">
                    <div className="flex items-center gap-1.5 font-bold text-amber-950">
                      <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>Exploratory Image Analysis — Not a Legal Plot Boundary</span>
                    </div>
                    <p className="text-amber-800 leading-relaxed">
                      The detected edges and contours represent physical room surfaces, structural beams, and openings in this perspective scene. An interior or construction photograph <strong>cannot establish the legal property boundaries, property setbacks, or land area</strong>.
                    </p>
                    <p className="text-amber-900 font-semibold pt-0.5">
                      💡 <strong>Recommendation:</strong> For verified legal boundary polygon detection, upload a 2D top-down cadastral survey drawing or registered plot plan blueprint.
                    </p>
                  </div>
                </>
              ) : analysisResult.isSurveyPlan ? (
                <>
                  {/* Case 2: 2D Site Plan / Cadastral Drawing */}
                  {analysisResult.boundaryDetected && analysisResult.detectedBoundaryPolygon?.length > 0 ? (
                    <>
                      <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-300 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                            <h4 className="font-bold text-emerald-900 text-xs">Plausible Outer Survey Boundary Detected</h4>
                          </div>
                          <span className="font-mono font-bold text-emerald-800 text-[11px]">
                            {Math.round(analysisResult.confidenceScore * 100)}% Confidence
                          </span>
                        </div>
                        <p className="text-[11px] text-emerald-800">
                          Identified a clean closed perimeter polygon with {analysisResult.detectedBoundaryPolygon.length} corner vertices from high-contrast drawing vectors.
                        </p>
                      </div>

                      <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-200 flex items-center justify-between">
                        <span className="font-bold text-blue-900 uppercase text-[10px]">Drawing Aspect Ratio</span>
                        <span className="font-mono font-bold text-blue-700">{analysisResult.aspectRatio} : 1.0</span>
                      </div>

                      {analysisResult.overlayImageBase64 && (
                        <div>
                          <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[10px] mb-2">Detected Boundary Polygon Overlay</h4>
                          <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-900 flex items-center justify-center p-1">
                            <img
                              src={`data:image/jpeg;base64,${analysisResult.overlayImageBase64}`}
                              alt="Detected Boundary Polygon"
                              className="max-h-60 mx-auto object-contain rounded"
                            />
                          </div>
                        </div>
                      )}

                      <div>
                        <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[10px] mb-1">Normalized Boundary Vertices (0..1)</h4>
                        <div className="p-2.5 bg-slate-900 text-emerald-400 font-mono text-[11px] rounded-xl overflow-x-auto">
                          {JSON.stringify(analysisResult.detectedBoundaryPolygon, null, 2)}
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1 italic">
                          * True land area (sq. metres / sq. ft) cannot be converted from pixel space without a calibrated on-plan scale bar.
                        </p>
                      </div>
                    </>
                  ) : (
                    /* Case 2b: 2D drawing but contour detection was unresolved */
                    <div className="p-4 bg-amber-50 rounded-2xl border border-amber-300 space-y-3">
                      <div className="flex items-start gap-2.5">
                        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-bold text-amber-900 text-xs">Boundary Contour Unresolved</h4>
                          <p className="text-[11px] text-amber-800 mt-1 leading-relaxed">
                            Could not extract a plausible closed outer boundary perimeter from this drawing. The outer contour was either open, fragmented, or did not match standard geometric plot perimeters.
                          </p>
                          <p className="text-[11px] text-amber-900 font-semibold mt-2">
                            💡 Tips: Ensure the drawing has dark, continuous outer boundary lines and good contrast against the background.
                          </p>
                        </div>
                      </div>

                      {analysisResult.overlayImageBase64 && (
                        <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-900 flex items-center justify-center p-1">
                          <img
                            src={`data:image/jpeg;base64,${analysisResult.overlayImageBase64}`}
                            alt="Analyzed Drawing"
                            className="max-h-52 mx-auto object-contain rounded"
                          />
                        </div>
                      )}

                      <div className="pt-1 flex gap-2">
                        <button
                          onClick={handleAnalyzeBoundary}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-600 text-white text-xs font-semibold hover:bg-amber-500 shadow-2xs"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>Retry Detection</span>
                        </button>
                        <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-amber-300 text-amber-900 text-xs font-semibold cursor-pointer hover:bg-amber-100/50 shadow-2xs">
                          <Upload className="w-3.5 h-3.5" />
                          <span>Upload Different Drawing</span>
                          <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                        </label>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                /* Case 3: Invalid image format */
                <div className="p-4 bg-rose-50 rounded-2xl border border-rose-300 space-y-2">
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-rose-900 text-xs">Image Analysis Failed</h4>
                      <p className="text-[11px] text-rose-800 mt-1">
                        The uploaded image could not be decoded. Please upload a valid JPG, PNG, or WEBP file.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Diagnostic Notes */}
              {analysisResult.notes?.length > 0 && (
                <div className="space-y-1 pt-1">
                  <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">Diagnostic Notes</h4>
                  <ul className="list-disc list-inside text-[11px] text-slate-600 space-y-0.5">
                    {analysisResult.notes.map((n, i) => (
                      <li key={i}>{n}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : activeTab === 'segmentation' && segmentResult ? (
            <div className="space-y-4 text-xs">
              
              {/* Check if CubiCasa5K operates in DEMO MODE (OpenCV Feature Extraction) */}
              {(segmentResult.isDemoMode || !segmentResult.isCheckpointTrained) ? (
                <div className="space-y-4">
                  
                  {/* Status Banner */}
                  <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-purple-50/70 rounded-xl border border-purple-200">
                    <div className="flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-purple-600" />
                      <div>
                        <span className="font-bold text-purple-900 text-xs">Demo Mode — OpenCV Architectural Analysis</span>
                        <p className="text-[10px] text-purple-700">Adaptive thresholding & morphological wall feature extraction</p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                      WEIGHTS STANDBY
                    </span>
                  </div>

                  {/* Honest Weights Disclaimer */}
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-slate-700 space-y-1.5">
                    <div className="flex items-center gap-1.5 font-bold text-slate-900 text-xs">
                      <Info className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span>Integrity & Architecture Status</span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      The local CubiCasa5K checkpoint (<code className="font-mono text-[10px] bg-slate-200 px-1 py-0.5 rounded">models/checkpoints/cubicasa_unet.pth</code>) is a {segmentResult.checkpointSizeBytes || 49}-byte placeholder file. Full UNet neural inference is not active to prevent fabricated predictions.
                    </p>
                    <p className="text-[11px] text-slate-700 font-medium">
                      ✓ The backend processed your actual uploaded image using OpenCV adaptive thresholding and morphological filters, extracting structural wall boundaries and partition envelopes.
                    </p>
                  </div>

                  {/* View Mode Switcher */}
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Visualization Viewport
                    </span>
                    <div className="flex p-0.5 bg-slate-100 rounded-lg text-[10px] font-semibold">
                      <button
                        type="button"
                        onClick={() => setSegViewMode('side-by-side')}
                        className={`px-2 py-1 rounded transition-all ${
                          segViewMode === 'side-by-side' ? 'bg-white text-purple-700 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        Side-by-Side
                      </button>
                      <button
                        type="button"
                        onClick={() => setSegViewMode('overlay')}
                        className={`px-2 py-1 rounded transition-all ${
                          segViewMode === 'overlay' ? 'bg-white text-purple-700 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        Semantic Overlay
                      </button>
                      <button
                        type="button"
                        onClick={() => setSegViewMode('mask')}
                        className={`px-2 py-1 rounded transition-all ${
                          segViewMode === 'mask' ? 'bg-white text-purple-700 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        Feature Mask
                      </button>
                      <button
                        type="button"
                        onClick={() => setSegViewMode('original')}
                        className={`px-2 py-1 rounded transition-all ${
                          segViewMode === 'original' ? 'bg-white text-purple-700 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        Original
                      </button>
                    </div>
                  </div>

                  {/* Image Viewports */}
                  {segViewMode === 'side-by-side' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-slate-600">Original Upload</span>
                          <span className="text-[9px] text-slate-400">Input</span>
                        </div>
                        <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-900 aspect-4/3 flex items-center justify-center p-1">
                          <img src={previewUrl} alt="Original Upload" className="max-h-52 w-full h-full object-contain" />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-purple-800">OpenCV Architectural Overlay</span>
                          <span className="text-[9px] text-purple-600 bg-purple-50 px-1.5 py-0.2 rounded font-semibold">Demo Mode</span>
                        </div>
                        <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-900 aspect-4/3 flex items-center justify-center p-1">
                          {segmentResult.overlayImageBase64 ? (
                            <img
                              src={`data:image/jpeg;base64,${segmentResult.overlayImageBase64}`}
                              alt="Semantic Overlay"
                              className="max-h-52 w-full h-full object-contain"
                            />
                          ) : (
                            <span className="text-slate-400 text-xs">Preview unavailable</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-900 aspect-4/3 max-h-72 mx-auto flex items-center justify-center p-1">
                      {segViewMode === 'overlay' && segmentResult.overlayImageBase64 ? (
                        <img
                          src={`data:image/jpeg;base64,${segmentResult.overlayImageBase64}`}
                          alt="Semantic Overlay"
                          className="w-full h-full object-contain"
                        />
                      ) : segViewMode === 'mask' && segmentResult.segmentationMaskBase64 ? (
                        <img
                          src={`data:image/png;base64,${segmentResult.segmentationMaskBase64}`}
                          alt="Segmentation Mask"
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <img
                          src={previewUrl}
                          alt="Original Upload"
                          className="w-full h-full object-contain"
                        />
                      )}
                    </div>
                  )}

                  {/* Quantitative Feature Metrics & Citation */}
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-purple-600" />
                        Extracted Architectural Features & Benchmark
                      </span>
                      <span className="text-[10px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                        OpenCV Demo Analysis
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      {segmentResult.featureExplanation ||
                        `OpenCV adaptive thresholding and morphological filtering extracted structural wall contours (${segmentResult.wallCoveragePercentage}% coverage) and architectural partition envelopes.`}
                    </p>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                      <div className="p-2 bg-white rounded-xl border border-slate-200 shadow-2xs">
                        <span className="text-[10px] text-slate-400 block font-medium">Wall Coverage</span>
                        <span className="text-xs font-bold text-purple-800">{segmentResult.wallCoveragePercentage ?? 0}%</span>
                      </div>
                      <div className="p-2 bg-white rounded-xl border border-slate-200 shadow-2xs">
                        <span className="text-[10px] text-slate-400 block font-medium">Model Inference</span>
                        <span className="text-xs font-bold text-amber-700">Metric unavailable</span>
                      </div>
                      <div className="p-2 bg-white rounded-xl border border-slate-200 shadow-2xs">
                        <span className="text-[10px] text-slate-400 block font-medium">Published Benchmark</span>
                        <span className="text-xs font-bold text-slate-700">~65% mIoU</span>
                      </div>
                      <div className="p-2 bg-white rounded-xl border border-slate-200 shadow-2xs">
                        <span className="text-[10px] text-slate-400 block font-medium">Processing Method</span>
                        <span className="text-xs font-bold text-slate-800">OpenCV Fallback</span>
                      </div>
                    </div>

                    <p className="text-[10px] text-slate-500 italic pt-1">
                      * <strong>Published Reference:</strong> Kalervo et al. (ICIPR 2019) reported ~65% mIoU on the CubiCasa5K benchmark dataset. Metric is unavailable for the unweighted local placeholder.
                    </p>
                  </div>

                  {/* 10-Class Documented Color Legend */}
                  <div className="p-3.5 bg-white rounded-xl space-y-2 border border-slate-200">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800 text-[11px]">
                        Official CubiCasa5K 10-Class Architectural Legend
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        Standard Taxonomy
                      </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 text-[10px]">
                      {cubicasaClasses.map((cls) => (
                        <div
                          key={cls.id}
                          className="flex items-center gap-1.5 p-1.5 rounded-lg bg-slate-50 border border-slate-200/80 shadow-2xs"
                        >
                          <span
                            className="w-3.5 h-3.5 rounded shrink-0 shadow-2xs"
                            style={{ backgroundColor: cls.color, border: `1px solid ${cls.border}` }}
                          />
                          <span className="font-semibold text-slate-700 truncate" title={cls.desc}>
                            {cls.name}
                          </span>
                        </div>
                      ))}
                    </div>
                    <p className="text-[10px] text-slate-400 italic pt-1">
                      * Full 10-class multi-room semantic classification requires downloading the trained ~210MB PyTorch UNet weights.
                    </p>
                  </div>

                </div>
              ) : (
                /* Genuine weights loaded: show real segmentation results */
                <>
                  <div className="p-4 bg-purple-50/70 rounded-2xl border border-purple-200 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-purple-200/60 pb-2">
                      <div>
                        <span className="font-bold text-purple-900 uppercase text-[10px] block">Semantic Model</span>
                        <p className="font-bold text-purple-950 text-xs mt-0.5">{segmentResult.modelName}</p>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-emerald-800 uppercase text-[10px] block">Checkpoint Status</span>
                        <p className="font-mono font-bold text-emerald-700 text-xs mt-0.5">Trained PyTorch Model Active</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">
                        Segmentation Visualization
                      </h4>

                      <div className="flex p-0.5 bg-slate-100 rounded-lg text-[10px] font-semibold">
                        <button
                          type="button"
                          onClick={() => setSegViewMode('overlay')}
                          className={`px-2 py-0.5 rounded transition-all ${
                            segViewMode === 'overlay' ? 'bg-white text-purple-700 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-800'
                          }`}
                        >
                          Blended Overlay
                        </button>
                        <button
                          type="button"
                          onClick={() => setSegViewMode('mask')}
                          className={`px-2 py-0.5 rounded transition-all ${
                            segViewMode === 'mask' ? 'bg-white text-purple-700 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-800'
                          }`}
                        >
                          Mask Only
                        </button>
                        <button
                          type="button"
                          onClick={() => setSegViewMode('original')}
                          className={`px-2 py-0.5 rounded transition-all ${
                            segViewMode === 'original' ? 'bg-white text-purple-700 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-800'
                          }`}
                        >
                          Original
                        </button>
                      </div>
                    </div>

                    <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-900 aspect-square max-h-64 mx-auto flex items-center justify-center">
                      {segViewMode === 'overlay' && segmentResult.overlayImageBase64 ? (
                        <img
                          src={`data:image/jpeg;base64,${segmentResult.overlayImageBase64}`}
                          alt="Segmentation Overlay"
                          className="w-full h-full object-contain"
                        />
                      ) : segViewMode === 'mask' && segmentResult.segmentationMaskBase64 ? (
                        <img
                          src={`data:image/png;base64,${segmentResult.segmentationMaskBase64}`}
                          alt="Segmentation Mask"
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <img
                          src={previewUrl}
                          alt="Original Input"
                          className="w-full h-full object-contain"
                        />
                      )}
                    </div>
                  </div>

                  {/* 10-Class Documented Color Legend */}
                  <div className="p-3 bg-slate-50 rounded-xl space-y-2.5 border border-slate-200">
                    <span className="font-bold text-slate-800 text-[11px] block">
                      Official CubiCasa5K 10-Class Architectural Legend
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 text-[10px]">
                      {cubicasaClasses.map((cls) => (
                        <div
                          key={cls.id}
                          className="flex items-center gap-1.5 p-1.5 rounded-lg bg-white border border-slate-200/80 shadow-2xs"
                        >
                          <span
                            className="w-3.5 h-3.5 rounded shrink-0 shadow-2xs"
                            style={{ backgroundColor: cls.color, border: `1px solid ${cls.border}` }}
                          />
                          <span className="font-semibold text-slate-700 truncate" title={cls.desc}>
                            {cls.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

            </div>
          ) : (
            <div className="p-16 text-center text-slate-400 text-xs">
              Upload an image on the left and select <strong>"Detect Plot Boundaries"</strong> or <strong>"CubiCasa5K Segmentation"</strong> to inspect computer vision outputs.
            </div>
          )}

        </div>

      </div>

    </div>
  );
};

export default SiteAnalysisPage;
