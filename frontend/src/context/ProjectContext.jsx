import React, { createContext, useContext, useState, useEffect } from 'react';
import { projectApi } from '../services/api';
import { useAuth } from './AuthContext';

const ProjectContext = createContext(null);

export const ProjectProvider = ({ children }) => {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [currentProject, setCurrentProject] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchProjects = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const res = await projectApi.getAll();
      if (res.data.success) {
        setProjects(res.data.projects);
        if (res.data.projects.length > 0 && !currentProject) {
          // Select most recent by default
          setCurrentProject(res.data.projects[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load projects:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchProjects();
    } else {
      setProjects([]);
      setCurrentProject(null);
    }
  }, [user]);

  const selectProjectById = async (id) => {
    try {
      setLoading(true);
      const res = await projectApi.getById(id);
      if (res.data.success) {
        setCurrentProject(res.data.project);
      }
    } catch (err) {
      console.error('Failed to select project:', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProjectContext.Provider value={{
      projects,
      currentProject,
      setCurrentProject,
      fetchProjects,
      selectProjectById,
      loading
    }}>
      {children}
    </ProjectContext.Provider>
  );
};

export const useProject = () => useContext(ProjectContext);
