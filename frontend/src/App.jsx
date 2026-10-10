import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProjectProvider } from './context/ProjectContext';

import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import ProtectedRoute from './components/ProtectedRoute';
import ChatbotModal from './components/ChatbotModal';

import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import NewProjectWizardPage from './pages/NewProjectWizardPage';
import ProjectOverviewPage from './pages/ProjectOverviewPage';
import FloorPlanStudioPage from './pages/FloorPlanStudioPage';
import DesignStudioPage from './pages/DesignStudioPage';
import InteriorDesignStudioPage from './pages/InteriorDesignStudioPage';
import ExteriorDesignStudioPage from './pages/ExteriorDesignStudioPage';
import VastuAnalysisPage from './pages/VastuAnalysisPage';
import CostEstimationPage from './pages/CostEstimationPage';
import PackageComparisonPage from './pages/PackageComparisonPage';
import ProgressTrackerPage from './pages/ProgressTrackerPage';
import ExpenseTrackerPage from './pages/ExpenseTrackerPage';
import SiteAnalysisPage from './pages/SiteAnalysisPage';
import ReportsPage from './pages/ReportsPage';
import AdminDashboardPage from './pages/AdminDashboardPage';

const AppLayout = ({ children, onOpenChat }) => {
  const location = useLocation();
  const isProjectWorkspace = location.pathname.startsWith('/project/');

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar onOpenChat={onOpenChat} />
      
      <div className="flex-1 flex overflow-hidden">
        {isProjectWorkspace && <Sidebar />}
        <main className={`flex-1 overflow-y-auto ${isProjectWorkspace ? 'p-6 lg:p-8' : ''}`}>
          {children}
        </main>
      </div>
    </div>
  );
};

export const App = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <AuthProvider>
      <ProjectProvider>
        <BrowserRouter>
          <AppLayout onOpenChat={() => setIsChatOpen(true)}>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              {/* Protected User Routes */}
              <Route element={<ProtectedRoute />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/wizard" element={<NewProjectWizardPage />} />
                
                {/* Project Workspace Routes */}
                <Route path="/project/:id" element={<ProjectOverviewPage />} />
                <Route path="/project/:id/floor-plan" element={<FloorPlanStudioPage />} />
                <Route path="/project/:id/interior" element={<InteriorDesignStudioPage />} />
                <Route path="/project/:id/interior-design" element={<InteriorDesignStudioPage />} />
                <Route path="/project/:id/exterior" element={<ExteriorDesignStudioPage />} />
                <Route path="/project/:id/exterior-design" element={<ExteriorDesignStudioPage />} />
                <Route path="/project/:id/design" element={<DesignStudioPage />} />
                <Route path="/project/:id/vastu" element={<VastuAnalysisPage />} />
                <Route path="/project/:id/boq" element={<CostEstimationPage />} />
                <Route path="/project/:id/packages" element={<PackageComparisonPage />} />
                <Route path="/project/:id/progress" element={<ProgressTrackerPage />} />
                <Route path="/project/:id/expenses" element={<ExpenseTrackerPage />} />
                <Route path="/project/:id/site-analysis" element={<SiteAnalysisPage />} />
                <Route path="/project/:id/reports" element={<ReportsPage />} />
              </Route>

              {/* Protected Admin Routes */}
              <Route element={<ProtectedRoute adminOnly={true} />}>
                <Route path="/admin" element={<AdminDashboardPage />} />
              </Route>

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AppLayout>

          {/* Context-Aware Floating Chatbot Assistant */}
          <ChatbotModal isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
        </BrowserRouter>
      </ProjectProvider>
    </AuthProvider>
  );
};

export default App;
