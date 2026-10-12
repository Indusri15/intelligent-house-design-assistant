import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { projectApi } from '../services/api';
import { useProject } from '../context/ProjectContext';
import { useAuth } from '../context/AuthContext';
import { 
  Building2, 
  MapPin, 
  Maximize2, 
  BedDouble, 
  Sparkles, 
  Compass, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft,
  AlertTriangle,
  Layers,
  Lock,
  Mail,
  X,
  RotateCcw,
  ShieldCheck,
  Check,
  Info
} from 'lucide-react';

const ARCHPLAN_WIZARD_DRAFT = 'archplan_wizard_draft';

const DEFAULT_FORM_DATA = {
  // Step 1: Details
  name: 'My Dream Villa',
  location: 'Warangal, Telangana',
  pincode: '506001',
  budget: 3500000,
  description: 'Modern family residence designed for thermal comfort, natural lighting, and Vastu harmony.',

  // Step 2: Plot
  plot: {
    length: 50,
    width: 30,
    shape: 'RECTANGULAR',
    facingDirection: 'East',
    roadAccess: 'Front 30ft Municipal Road',
    setbacks: { front: 5, rear: 3, left: 3, right: 3 }
  },

  // Step 3: Accommodation
  accommodation: {
    floors: 2,
    bedrooms: 3,
    bathrooms: 2,
    livingRoom: true,
    diningRoom: true,
    kitchen: true,
    poojaRoom: true,
    utilityArea: true,
    parking: true,
    balcony: true,
    staircase: true,
    studyRoom: false,
    otherRequirements: '',
    familyMembers: 4
  },

  // Step 4: Preferences
  preferences: {
    style: 'Contemporary',
    flooring: 'Glazed Vitrified 4x2 Tiles',
    kitchen: 'Modular with Granite Counter',
    interiorColours: 'Warm Neutrals & Charcoal Accents',
    furnitureStyle: 'Clean Minimalist Contemporary',
    lighting: 'Recessed Warm LED with False Ceiling',
    ventilation: 'Cross-Ventilation Focused',
    energyEfficiency: 'Solar Ready with Thermal Glazing'
  },

  // Step 5: Vastu Preferences
  vastuPreferences: {
    enabled: true,
    entranceZone: 'NE',
    kitchenOrientation: 'SE',
    masterBedroomOrientation: 'SW',
    poojaOrientation: 'NE',
    staircasePlacement: 'S'
  },

  // Selected Default Package
  selectedPackage: 'MEDIUM'
};

export const NewProjectWizardPage = () => {
  const navigate = useNavigate();
  const { fetchProjects, setCurrentProject } = useProject();
  const { user, login } = useAuth();

  // Wizard Draft State Restoration
  const [formData, setFormData] = useState(() => {
    try {
      const saved = sessionStorage.getItem(ARCHPLAN_WIZARD_DRAFT);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.formData) return parsed.formData;
      }
    } catch (e) {
      console.warn('Failed to parse wizard draft:', e);
    }
    return DEFAULT_FORM_DATA;
  });

  const [currentStep, setCurrentStep] = useState(() => {
    try {
      const saved = sessionStorage.getItem(ARCHPLAN_WIZARD_DRAFT);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.currentStep && parsed.currentStep >= 1 && parsed.currentStep <= 6) {
          return parsed.currentStep;
        }
      }
    } catch (e) {
      console.warn('Failed to parse wizard draft step:', e);
    }
    return 1;
  });

  const [hasRestoredDraft, setHasRestoredDraft] = useState(() => {
    return typeof window !== 'undefined' && Boolean(sessionStorage.getItem(ARCHPLAN_WIZARD_DRAFT));
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // In-place Re-authentication State
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [reauthEmail, setReauthEmail] = useState(user?.email || '');
  const [reauthPassword, setReauthPassword] = useState('');
  const [reauthLoading, setReauthLoading] = useState(false);
  const [reauthError, setReauthError] = useState(null);

  // Sync draft to sessionStorage continuously
  useEffect(() => {
    try {
      sessionStorage.setItem(ARCHPLAN_WIZARD_DRAFT, JSON.stringify({ formData, currentStep }));
    } catch (e) {
      console.warn('Failed to persist wizard draft to sessionStorage:', e);
    }
  }, [formData, currentStep]);

  // Keep reauth email synced with logged in user if available
  useEffect(() => {
    if (user?.email && !reauthEmail) {
      setReauthEmail(user.email);
    }
  }, [user, reauthEmail]);

  // Listen for global auth expiration events dispatched by api interceptor
  useEffect(() => {
    const handleAuthExpired = (e) => {
      setAuthModalOpen(true);
      setError(e.detail?.message || 'Not authorized, token failed or expired');
    };
    window.addEventListener('archplan:auth_expired', handleAuthExpired);
    return () => window.removeEventListener('archplan:auth_expired', handleAuthExpired);
  }, []);

  const resetToDefaults = () => {
    sessionStorage.removeItem(ARCHPLAN_WIZARD_DRAFT);
    setFormData(DEFAULT_FORM_DATA);
    setCurrentStep(1);
    setHasRestoredDraft(false);
    setError(null);
  };

  const plotArea = (Number(formData.plot.length) || 0) * (Number(formData.plot.width) || 0);
  const buildableW = Math.max(10, (Number(formData.plot.width) || 0) - (Number(formData.plot.setbacks.left) || 3) - (Number(formData.plot.setbacks.right) || 3));
  const buildableL = Math.max(10, (Number(formData.plot.length) || 0) - (Number(formData.plot.setbacks.front) || 5) - (Number(formData.plot.setbacks.rear) || 3));
  const buildableAreaPerFloor = Math.round(buildableW * buildableL);
  const totalEstimatedBuiltUp = buildableAreaPerFloor * (Number(formData.accommodation.floors) || 1);

  const updateField = (section, field, value) => {
    if (section) {
      setFormData(prev => ({
        ...prev,
        [section]: {
          ...prev[section],
          [field]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const updateSetback = (field, value) => {
    setFormData(prev => ({
      ...prev,
      plot: {
        ...prev.plot,
        setbacks: {
          ...prev.plot.setbacks,
          [field]: Number(value)
        }
      }
    }));
  };

  const handleNext = () => {
    setError(null);
    if (currentStep === 1) {
      if (!formData.name.trim() || !formData.location.trim() || !formData.budget) {
        setError('Please fill in all required project detail fields.');
        return;
      }
    } else if (currentStep === 2) {
      if (formData.plot.length < 15 || formData.plot.width < 12) {
        setError('Plot dimensions must be at least 15 ft length and 12 ft width.');
        return;
      }
    }
    setCurrentStep(prev => Math.min(prev + 1, 6));
  };

  const handleBack = () => {
    setError(null);
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (overrideToken) => {
    try {
      setLoading(true);
      setError(null);

      // Verify token exists in localStorage or override
      const activeToken = overrideToken || localStorage.getItem('token');
      if (!activeToken || activeToken === 'null' || activeToken === 'undefined' || activeToken.trim() === '') {
        setAuthModalOpen(true);
        setError('Not authorized, token failed or expired');
        setLoading(false);
        return;
      }

      const res = await projectApi.create({
        ...formData,
        plot: {
          ...formData.plot,
          area: plotArea
        }
      });

      if (res.data.success) {
        sessionStorage.removeItem(ARCHPLAN_WIZARD_DRAFT);
        await fetchProjects();
        setCurrentProject(res.data.project);
        navigate(`/project/${res.data.project._id || res.data.project.id}`);
      }
    } catch (err) {
      const isAuthErr = err.response?.status === 401 || 
                        err.response?.data?.code === 'TOKEN_EXPIRED' || 
                        err.response?.data?.code === 'TOKEN_INVALID' ||
                        err.response?.data?.code === 'NO_TOKEN' ||
                        err.response?.data?.message?.includes('Not authorized') ||
                        err.response?.data?.message?.includes('token');
      if (isAuthErr) {
        setAuthModalOpen(true);
        setError(err.response?.data?.message || 'Not authorized, token failed or expired');
      } else {
        setError(err.response?.data?.message || 'Failed to create project. Please verify server connection.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReauthSubmit = async (e) => {
    e.preventDefault();
    setReauthLoading(true);
    setReauthError(null);
    try {
      const loginRes = await login(reauthEmail, reauthPassword);
      if (loginRes?.token) {
        setAuthModalOpen(false);
        setReauthPassword('');
        // Automatically proceed with project creation and generation
        await handleSubmit(loginRes.token);
      }
    } catch (err) {
      setReauthError(err.response?.data?.message || 'Authentication failed. Please verify your credentials.');
    } finally {
      setReauthLoading(false);
    }
  };

  const steps = [
    { num: 1, title: 'Project Details', icon: Building2 },
    { num: 2, title: 'Plot Dimensions', icon: Maximize2 },
    { num: 3, title: 'Accommodation', icon: BedDouble },
    { num: 4, title: 'Design Styles', icon: Sparkles },
    { num: 5, title: 'Vastu Setup', icon: Compass },
    { num: 6, title: 'Review & Generate', icon: CheckCircle2 },
  ];

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6">
      
      {/* Wizard Step Progress Tracker */}
      <div className="mb-8">
        <div className="flex items-center justify-between relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-slate-200 w-full z-0"></div>
          <div 
            className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-blue-600 transition-all duration-300 z-0"
            style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
          ></div>

          {steps.map((s) => {
            const Icon = s.icon;
            const isPassed = currentStep > s.num;
            const isCurrent = currentStep === s.num;
            return (
              <div key={s.num} className="relative z-10 flex flex-col items-center">
                <button
                  onClick={() => s.num < currentStep && setCurrentStep(s.num)}
                  disabled={s.num > currentStep}
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                    isPassed
                      ? 'bg-blue-600 text-white'
                      : isCurrent
                      ? 'bg-slate-900 text-white ring-4 ring-blue-100 shadow-md'
                      : 'bg-white text-slate-400 border-2 border-slate-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </button>
                <span className={`text-[11px] font-semibold mt-2 hidden sm:block ${
                  isCurrent ? 'text-slate-900' : 'text-slate-400'
                }`}>
                  {s.title}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Draft Restored Banner */}
      {hasRestoredDraft && (
        <div className="mb-4 p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Info className="w-4 h-4 shrink-0 text-blue-600" />
            <span>
              Restored your saved project draft from session storage. You can continue customizing or start generation.
            </span>
          </div>
          <button
            type="button"
            onClick={resetToDefaults}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-blue-200 text-blue-700 hover:bg-blue-100 font-semibold text-[11px] shrink-0 transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset to Defaults</span>
          </button>
        </div>
      )}

      {/* Error Notice */}
      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 shrink-0 text-red-500 mt-0.5" />
            <div>
              <p className="font-bold text-red-900">
                {error.includes('token') || error.includes('authorized') ? 'Session Authentication Required' : 'Action Failed'}
              </p>
              <p className="mt-0.5">{error}</p>
              {(error.includes('token') || error.includes('authorized')) && (
                <p className="text-[11px] text-red-600 font-medium mt-1">
                  Your project requirements are safely preserved in draft memory. Sign in to resume and proceed directly with blueprint generation.
                </p>
              )}
            </div>
          </div>
          {(error.includes('token') || error.includes('authorized')) && (
            <button
              type="button"
              onClick={() => setAuthModalOpen(true)}
              className="px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-xs shrink-0 shadow-sm transition-colors"
            >
              Sign In to Resume
            </button>
          )}
        </div>
      )}

      {/* Form Container Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
        
        {/* STEP 1: Details */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Step 1: Project Details & Location</h2>
              <p className="text-xs text-slate-500">Provide basic project identification, target budget, and geographic location.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">House Project Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => updateField(null, 'name', e.target.value)}
                  placeholder="e.g. Dream Haven Villa"
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Target Construction Budget (INR) *</label>
                <input
                  type="number"
                  value={formData.budget}
                  onChange={(e) => updateField(null, 'budget', Number(e.target.value))}
                  placeholder="e.g. 3500000"
                  step="50000"
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <p className="text-[11px] text-blue-600 mt-1 font-semibold">₹ {Number(formData.budget).toLocaleString('en-IN')}</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Construction Location *</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => updateField(null, 'location', e.target.value)}
                  placeholder="e.g. Hanamkonda, Warangal"
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">PIN Code *</label>
                <input
                  type="text"
                  value={formData.pincode}
                  onChange={(e) => updateField(null, 'pincode', e.target.value)}
                  placeholder="e.g. 506001"
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Project Description & Family Goals</label>
                <textarea
                  rows="3"
                  value={formData.description}
                  onChange={(e) => updateField(null, 'description', e.target.value)}
                  placeholder="Tell us any specific requirements (e.g. dedicated prayer room, open kitchen, garden space)..."
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Plot */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Step 2: Plot Information & Setbacks</h2>
              <p className="text-xs text-slate-500">Enter physical site measurements in feet. The engine automatically calculates buildable area.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Plot Length (feet) *</label>
                <input
                  type="number"
                  value={formData.plot.length}
                  onChange={(e) => updateField('plot', 'length', Number(e.target.value))}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Plot Width (feet) *</label>
                <input
                  type="number"
                  value={formData.plot.width}
                  onChange={(e) => updateField('plot', 'width', Number(e.target.value))}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Facing Direction *</label>
                <select
                  value={formData.plot.facingDirection}
                  onChange={(e) => updateField('plot', 'facingDirection', e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="East">East Facing (Optimal Solar Morning)</option>
                  <option value="North">North Facing (Kubera Wealth Zone)</option>
                  <option value="West">West Facing (Varuna Air Zone)</option>
                  <option value="South">South Facing (Yama Stability)</option>
                </select>
              </div>
            </div>

            {/* Calculated Metrics Card */}
            <div className="p-4 bg-blue-50/60 rounded-xl border border-blue-200/80 flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="text-[11px] font-bold uppercase text-blue-700">Calculated Gross Plot Area</span>
                <p className="text-xl font-extrabold text-blue-900">{plotArea} sq.ft <span className="text-xs font-normal text-blue-700">({(plotArea / 9).toFixed(1)} sq. yards)</span></p>
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase text-slate-600">Buildable Footprint</span>
                <p className="text-base font-bold text-slate-800">{buildableW}' x {buildableL}' ({buildableAreaPerFloor} sq.ft/floor)</p>
              </div>
            </div>

            {/* Setbacks Form */}
            <div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">Mandatory Setback Clearances (Feet)</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-[11px] text-slate-600 mb-1">Front (Road):</label>
                  <input
                    type="number"
                    value={formData.plot.setbacks.front}
                    onChange={(e) => updateSetback('front', e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-600 mb-1">Rear:</label>
                  <input
                    type="number"
                    value={formData.plot.setbacks.rear}
                    onChange={(e) => updateSetback('rear', e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-600 mb-1">Left Side:</label>
                  <input
                    type="number"
                    value={formData.plot.setbacks.left}
                    onChange={(e) => updateSetback('left', e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-600 mb-1">Right Side:</label>
                  <input
                    type="number"
                    value={formData.plot.setbacks.right}
                    onChange={(e) => updateSetback('right', e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Accommodation */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Step 3: Required Accommodation</h2>
              <p className="text-xs text-slate-500">Configure room counts, floor levels, and family living requirements.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Number of Floors</label>
                <select
                  value={formData.accommodation.floors}
                  onChange={(e) => updateField('accommodation', 'floors', Number(e.target.value))}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500"
                >
                  <option value={1}>Ground Floor Only (G)</option>
                  <option value={2}>Ground + 1 Floor (G+1 Duplex)</option>
                  <option value={3}>Ground + 2 Floors (G+2 Triplex)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Bedrooms</label>
                <input
                  type="number"
                  min="1"
                  max="6"
                  value={formData.accommodation.bedrooms}
                  onChange={(e) => updateField('accommodation', 'bedrooms', Number(e.target.value))}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Bathrooms</label>
                <input
                  type="number"
                  min="1"
                  max="6"
                  value={formData.accommodation.bathrooms}
                  onChange={(e) => updateField('accommodation', 'bathrooms', Number(e.target.value))}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300"
                />
              </div>
            </div>

            {/* Checkboxes for standard amenities */}
            <div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">Living Spaces & Rooms</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { key: 'livingRoom', label: 'Living Room' },
                  { key: 'diningRoom', label: 'Dining Area' },
                  { key: 'kitchen', label: 'Kitchen' },
                  { key: 'poojaRoom', label: 'Pooja Mandir' },
                  { key: 'parking', label: 'Covered Car Parking' },
                  { key: 'balcony', label: 'Balcony / Terrace' },
                  { key: 'staircase', label: 'Internal Staircase' },
                  { key: 'utilityArea', label: 'Utility / Wash' },
                  { key: 'studyRoom', label: 'Study / Work Office' },
                ].map((item) => (
                  <label
                    key={item.key}
                    className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-all text-xs font-medium ${
                      formData.accommodation[item.key]
                        ? 'bg-blue-50/60 border-blue-500 text-blue-900'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={formData.accommodation[item.key]}
                      onChange={(e) => updateField('accommodation', item.key, e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span>{item.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: Preferences */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Step 4: Architectural & Interior Style</h2>
              <p className="text-xs text-slate-500">Pick preferred aesthetics, finishes, and interior styling options.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Architectural Elevation Style</label>
                <select
                  value={formData.preferences.style}
                  onChange={(e) => updateField('preferences', 'style', e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Contemporary">Contemporary Architectural</option>
                  <option value="Modern Minimalist">Modern Minimalist</option>
                  <option value="Traditional Indian">Traditional Indian (Courtyard/Verandah)</option>
                  <option value="Modern Luxury">Modern Luxury</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Flooring Preference</label>
                <select
                  value={formData.preferences.flooring}
                  onChange={(e) => updateField('preferences', 'flooring', e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Glazed Vitrified 4x2 Tiles">4x2 ft Glazed Vitrified Tiles (GVT)</option>
                  <option value="Standard Vitrified 2x2 Tiles">2x2 ft Vitrified Standard Tiles</option>
                  <option value="Italian Marble / Large Slab">Italian Marble / Large Slab Porcelain</option>
                  <option value="Granite & Wooden Planks">Polished Granite & Wooden Texture Planks</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Kitchen Style</label>
                <select
                  value={formData.preferences.kitchen}
                  onChange={(e) => updateField('preferences', 'kitchen', e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Modular with Granite Counter">Acrylic Modular with Granite Countertop</option>
                  <option value="Laminated Semi-Modular">Laminated Semi-Modular Kitchen</option>
                  <option value="PU Finish Quartz Island">PU Finish Modular with Quartz Island</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Interior Color Palette</label>
                <select
                  value={formData.preferences.interiorColours}
                  onChange={(e) => updateField('preferences', 'interiorColours', e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Warm Neutrals & Charcoal Accents">Warm Neutrals & Charcoal Accents</option>
                  <option value="Crisp White & Minimal Grey">Crisp White & Minimal Grey</option>
                  <option value="Earth Terracotta & Teak Woods">Earth Terracotta & Teak Woods</option>
                  <option value="Royal Ivory & Gold Highlights">Royal Ivory & Gold Highlights</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* STEP 5: Vastu */}
        {currentStep === 5 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Step 5: Vastu Shastra Preferences</h2>
              <p className="text-xs text-slate-500">Configure directional orientations according to traditional Vastu guidelines.</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.vastuPreferences.enabled}
                  onChange={(e) => updateField('vastuPreferences', 'enabled', e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <span className="text-xs font-bold text-slate-900">Enable Active Vastu Shastra Optimization</span>
                  <p className="text-[11px] text-slate-500">The geometric generator will automatically prioritize canonical directional placements.</p>
                </div>
              </label>
            </div>

            {formData.vastuPreferences.enabled && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Preferred Entrance Zone</label>
                  <select
                    value={formData.vastuPreferences.entranceZone}
                    onChange={(e) => updateField('vastuPreferences', 'entranceZone', e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300"
                  >
                    <option value="NE">North-East (Ishanya - Highly Recommended)</option>
                    <option value="E">East (Indra Pada)</option>
                    <option value="N">North (Kubera Pada)</option>
                    <option value="W">West (Pushpadanta)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Kitchen Orientation</label>
                  <select
                    value={formData.vastuPreferences.kitchenOrientation}
                    onChange={(e) => updateField('vastuPreferences', 'kitchenOrientation', e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300"
                  >
                    <option value="SE">South-East (Agneya - Optimal Fire Zone)</option>
                    <option value="NW">North-West (Vayu - Secondary Alternative)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Master Bedroom Orientation</label>
                  <select
                    value={formData.vastuPreferences.masterBedroomOrientation}
                    onChange={(e) => updateField('vastuPreferences', 'masterBedroomOrientation', e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300"
                  >
                    <option value="SW">South-West (Niruthi - Optimal Earth Stability)</option>
                    <option value="S">South</option>
                    <option value="W">West</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Pooja Room Orientation</label>
                  <select
                    value={formData.vastuPreferences.poojaOrientation}
                    onChange={(e) => updateField('vastuPreferences', 'poojaOrientation', e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300"
                  >
                    <option value="NE">North-East (Ishanya - Purest Spiritual Zone)</option>
                    <option value="E">East</option>
                    <option value="N">North</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 6: Review & Generate */}
        {currentStep === 6 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Step 6: Review & Start Generation Workflow</h2>
              <p className="text-xs text-slate-500">Confirm project parameters. The system will compile geometric layouts, Vastu reports, BOQ, and timelines.</p>
            </div>

            {/* Comprehensive Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Site & Dimensions Card */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                <h4 className="font-bold text-slate-900 border-b border-slate-200 pb-1.5 flex items-center justify-between">
                  <span>Site & Plot Dimensions</span>
                  <span className="text-[11px] font-normal text-slate-500">{formData.accommodation.floors} Floors</span>
                </h4>
                <p><span className="text-slate-500">Project:</span> <strong>{formData.name}</strong></p>
                <p><span className="text-slate-500">Location:</span> {formData.location} ({formData.pincode})</p>
                <p><span className="text-slate-500">Plot:</span> {formData.plot.width}' x {formData.plot.length}' (<strong>{plotArea} sq.ft</strong>, {formData.plot.shape})</p>
                <p><span className="text-slate-500">Facing:</span> <strong>{formData.plot.facingDirection}</strong> | Access: {formData.plot.roadAccess}</p>
                <p><span className="text-slate-500">Setbacks:</span> F: {formData.plot.setbacks?.front}' | R: {formData.plot.setbacks?.rear}' | L: {formData.plot.setbacks?.left}' | R: {formData.plot.setbacks?.right}'</p>
                <p><span className="text-slate-500">Total Built-Up:</span> ~<strong>{totalEstimatedBuiltUp} sq.ft</strong> (~{buildableAreaPerFloor} sq.ft / floor)</p>
              </div>

              {/* Accommodation & Selected Amenities Card */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                <h4 className="font-bold text-slate-900 border-b border-slate-200 pb-1.5 flex items-center justify-between">
                  <span>Accommodation & Amenities</span>
                  <span className="text-[11px] font-semibold text-blue-600">{formData.accommodation.bedrooms} Beds, {formData.accommodation.bathrooms} Baths</span>
                </h4>
                <p><span className="text-slate-500">Family Size:</span> {formData.accommodation.familyMembers} Persons</p>
                <div>
                  <span className="text-slate-500 block mb-1">Selected Rooms & Amenities:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {formData.accommodation.livingRoom && <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 text-[10px] font-semibold">Living Room</span>}
                    {formData.accommodation.diningRoom && <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 text-[10px] font-semibold">Dining Room</span>}
                    {formData.accommodation.kitchen && <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 text-[10px] font-semibold">Modular Kitchen</span>}
                    {formData.accommodation.poojaRoom && <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-semibold">Pooja Room</span>}
                    {formData.accommodation.utilityArea && <span className="px-2 py-0.5 rounded-md bg-slate-200 text-slate-800 text-[10px] font-semibold">Utility / Wash</span>}
                    {formData.accommodation.parking && <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-semibold">Car Parking</span>}
                    {formData.accommodation.balcony && <span className="px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800 text-[10px] font-semibold">Balcony</span>}
                    {formData.accommodation.staircase && <span className="px-2 py-0.5 rounded-md bg-slate-200 text-slate-800 text-[10px] font-semibold">Staircase</span>}
                    {formData.accommodation.studyRoom && <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 text-[10px] font-semibold">Study / Office</span>}
                  </div>
                </div>
                {formData.accommodation.otherRequirements && (
                  <p className="text-[11px] text-slate-600 italic">"{formData.accommodation.otherRequirements}"</p>
                )}
              </div>

              {/* Design Styles & Finishes Card */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                <h4 className="font-bold text-slate-900 border-b border-slate-200 pb-1.5">Design & Finishes</h4>
                <p><span className="text-slate-500">Style:</span> <strong>{formData.preferences.style}</strong></p>
                <p><span className="text-slate-500">Flooring:</span> {formData.preferences.flooring}</p>
                <p><span className="text-slate-500">Kitchen:</span> {formData.preferences.kitchen}</p>
                <p><span className="text-slate-500">Palette:</span> {formData.preferences.interiorColours}</p>
                <p><span className="text-slate-500">Lighting & Ventilation:</span> {formData.preferences.lighting} | {formData.preferences.ventilation}</p>
              </div>

              {/* Vastu & Budget Card */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                <h4 className="font-bold text-slate-900 border-b border-slate-200 pb-1.5 flex items-center justify-between">
                  <span>Vastu & Budget Target</span>
                  <span className="text-[11px] font-bold text-blue-600">{formData.selectedPackage} Tier</span>
                </h4>
                <p><span className="text-slate-500">Budget Target:</span> <strong className="text-blue-700 font-bold">₹ {Number(formData.budget).toLocaleString('en-IN')}</strong></p>
                <p><span className="text-slate-500">Vastu Shastra:</span> {formData.vastuPreferences.enabled ? (
                  <strong className="text-emerald-700">Active (Entrance: {formData.vastuPreferences.entranceZone}, Kitchen: {formData.vastuPreferences.kitchenOrientation}, Master: {formData.vastuPreferences.masterBedroomOrientation})</strong>
                ) : (
                  <span className="text-slate-400">Disabled</span>
                )}</p>
                <p><span className="text-slate-500">Pooja Placement:</span> {formData.vastuPreferences.poojaOrientation || 'NE'} | Staircase: {formData.vastuPreferences.staircasePlacement || 'S'}</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>All parameters validated! Ready to generate geometric architectural blueprints and financial BOQ.</span>
            </div>
          </div>
        )}

        {/* Wizard Control Buttons */}
        <div className="mt-8 pt-6 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={handleBack}
            disabled={currentStep === 1}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>

          {currentStep < 6 ? (
            <button
              type="button"
              onClick={handleNext}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-sm transition-colors"
            >
              <span>Continue</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => handleSubmit()}
              disabled={loading}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white shadow-md shadow-blue-500/20 transition-all"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Generating Architectural Plans...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Floor Plans & BOQ</span>
                </>
              )}
            </button>
          )}
        </div>

      </div>

      {/* Session Expired / Re-authentication In-Place Modal */}
      {authModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Session Authentication Required</h3>
                  <p className="text-[11px] text-slate-500">Your wizard project requirements are safely saved</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setAuthModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleReauthSubmit} className="p-6 space-y-4">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-800 text-xs">
                <p className="font-semibold">All entered parameters are preserved!</p>
                <p className="text-[11px] text-blue-600 mt-0.5">
                  Sign in to authenticate. Blueprint and BOQ generation will resume automatically upon login.
                </p>
              </div>

              {reauthError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
                  <span>{reauthError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Account Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={reauthEmail}
                    onChange={(e) => setReauthEmail(e.target.value)}
                    placeholder="name@domain.com"
                    className="w-full text-xs pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={reauthPassword}
                    onChange={(e) => setReauthPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full text-xs pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <button
                  type="submit"
                  disabled={reauthLoading}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold shadow-sm transition-colors"
                >
                  {reauthLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Verifying & Generating Plans...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Sign In & Generate Blueprints</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => navigate('/login', { state: { from: '/wizard', reason: 'session_expired' } })}
                  className="w-full text-center py-2 text-xs text-slate-500 hover:text-slate-800 font-medium transition-colors"
                >
                  Or open full Login Page (Draft remains preserved)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default NewProjectWizardPage;
