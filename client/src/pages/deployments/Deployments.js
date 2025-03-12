import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDeployments } from '../../context/DeploymentContext';
import { toast } from 'react-toastify';

const StatusBadge = ({ status }) => {
  const colors = {
    running: 'bg-green-100 text-green-800',
    stopped: 'bg-gray-100 text-gray-800',
    creating: 'bg-blue-100 text-blue-800',
    failed: 'bg-red-100 text-red-800',
    suspended: 'bg-yellow-100 text-yellow-800',
    updating: 'bg-purple-100 text-purple-800'
  };

  return (
    <span className={`px-2 py-1 rounded-full text-sm font-medium ${colors[status] || colors.stopped}`}>
      {status}
    </span>
  );
};

const Deployments = () => {
  const {
    deployments,
    loading,
    error,
    getDeployments,
    startDeployment,
    stopDeployment,
    deleteDeployment
  } = useDeployments();

  useEffect(() => {
    getDeployments();
  }, []);

  const handleStart = async (id) => {
    try {
      await startDeployment(id);
      toast.success('Deployment started successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to start deployment');
    }
  };

  const handleStop = async (id) => {
    try {
      await stopDeployment(id);
      toast.success('Deployment stopped successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to stop deployment');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this deployment?')) {
      try {
        await deleteDeployment(id);
        toast.success('Deployment deleted successfully');
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to delete deployment');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Loading deployments...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600 p-4">
        {error}
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Deployments</h1>
        <Link
          to="/deployments/create"
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          Create Deployment
        </Link>
      </div>

      {deployments.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-600 mb-4">No deployments found</p>
          <Link
            to="/deployments/create"
            className="text-blue-600 hover:text-blue-800"
          >
            Create your first deployment
          </Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {deployments.map((deployment) => (
            <div
              key={deployment._id}
              className="bg-white rounded-lg shadow-md overflow-hidden"
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-xl font-semibold">{deployment.name}</h2>
                  <StatusBadge status={deployment.status} />
                </div>
                <p className="text-gray-600 mb-4">{deployment.description}</p>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Type:</span>
                    <span className="font-medium">{deployment.type}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Region:</span>
                    <span className="font-medium">{deployment.jelasticRegion}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Resources:</span>
                    <span className="font-medium">
                      {deployment.resources.cloudlets} cloudlets,{' '}
                      {deployment.resources.storage}GB storage
                    </span>
                  </div>
                </div>
              </div>
              <div className="px-6 py-4 bg-gray-50 border-t flex justify-between items-center">
                <Link
                  to={`/deployments/${deployment._id}`}
                  className="text-blue-600 hover:text-blue-800"
                >
                  View Details
                </Link>
                <div className="space-x-2">
                  {deployment.status === 'stopped' && (
                    <button
                      onClick={() => handleStart(deployment._id)}
                      className="bg-green-600 text-white px-3 py-1 rounded-md hover:bg-green-700 text-sm"
                    >
                      Start
                    </button>
                  )}
                  {deployment.status === 'running' && (
                    <button
                      onClick={() => handleStop(deployment._id)}
                      className="bg-yellow-600 text-white px-3 py-1 rounded-md hover:bg-yellow-700 text-sm"
                    >
                      Stop
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(deployment._id)}
                    className="bg-red-600 text-white px-3 py-1 rounded-md hover:bg-red-700 text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Deployments;