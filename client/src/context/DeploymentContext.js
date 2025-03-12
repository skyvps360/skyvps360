import React, { createContext, useState, useContext } from 'react';
import api from '../services/api';

const DeploymentContext = createContext(null);

export const DeploymentProvider = ({ children }) => {
  const [deployments, setDeployments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Get all deployments
  const getDeployments = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/deployments');
      setDeployments(data.data);
      return data.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch deployments');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Get single deployment
  const getDeployment = async (id) => {
    try {
      const { data } = await api.get(`/deployments/${id}`);
      return data.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch deployment');
      throw err;
    }
  };

  // Create deployment
  const createDeployment = async (deploymentData) => {
    try {
      const { data } = await api.post('/deployments', deploymentData);
      setDeployments([...deployments, data.data]);
      return data.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create deployment');
      throw err;
    }
  };

  // Update deployment
  const updateDeployment = async (id, deploymentData) => {
    try {
      const { data } = await api.put(`/deployments/${id}`, deploymentData);
      setDeployments(
        deployments.map((deployment) =>
          deployment._id === id ? data.data : deployment
        )
      );
      return data.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update deployment');
      throw err;
    }
  };

  // Delete deployment
  const deleteDeployment = async (id) => {
    try {
      await api.delete(`/deployments/${id}`);
      setDeployments(deployments.filter((deployment) => deployment._id !== id));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete deployment');
      throw err;
    }
  };

  // Start deployment
  const startDeployment = async (id) => {
    try {
      const { data } = await api.post(`/deployments/${id}/start`);
      setDeployments(
        deployments.map((deployment) =>
          deployment._id === id ? data.data : deployment
        )
      );
      return data.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to start deployment');
      throw err;
    }
  };

  // Stop deployment
  const stopDeployment = async (id) => {
    try {
      const { data } = await api.post(`/deployments/${id}/stop`);
      setDeployments(
        deployments.map((deployment) =>
          deployment._id === id ? data.data : deployment
        )
      );
      return data.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to stop deployment');
      throw err;
    }
  };

  // Create backup
  const createBackup = async (id, description) => {
    try {
      const { data } = await api.post(`/deployments/${id}/backup`, { description });
      return data.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create backup');
      throw err;
    }
  };

  // Restore backup
  const restoreBackup = async (id, backupId) => {
    try {
      const { data } = await api.post(`/deployments/${id}/restore/${backupId}`);
      return data.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to restore backup');
      throw err;
    }
  };

  // Get deployment logs
  const getDeploymentLogs = async (id) => {
    try {
      const { data } = await api.get(`/deployments/${id}/logs`);
      return data.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch deployment logs');
      throw err;
    }
  };

  const clearError = () => setError(null);

  return (
    <DeploymentContext.Provider
      value={{
        deployments,
        loading,
        error,
        getDeployments,
        getDeployment,
        createDeployment,
        updateDeployment,
        deleteDeployment,
        startDeployment,
        stopDeployment,
        createBackup,
        restoreBackup,
        getDeploymentLogs,
        clearError
      }}
    >
      {children}
    </DeploymentContext.Provider>
  );
};

export const useDeployments = () => {
  const context = useContext(DeploymentContext);
  if (!context) {
    throw new Error('useDeployments must be used within a DeploymentProvider');
  }
  return context;
};