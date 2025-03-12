const axios = require('axios');
const config = require('../config/config');

class JelasticService {
  constructor() {
    this.baseUrl = config.jelastic.apiUrl;
    this.token = config.jelastic.apiToken;
  }

  // Make authenticated API request to Jelastic
  async apiRequest(method, params = {}) {
    try {
      const url = `${this.baseUrl}/${method}`;
      
      // Add authentication token to every request
      const requestParams = {
        ...params,
        session: this.token
      };
      
      const response = await axios.post(url, requestParams);
      
      if (response.data.result !== 0) {
        throw new Error(`Jelastic API Error: ${response.data.error}`);
      }
      
      return response.data;
    } catch (error) {
      console.error(`Jelastic API Error: ${error.message}`);
      throw error;
    }
  }

  // Get environments for a user
  async getEnvironments(session) {
    return this.apiRequest('environment/control/rest/getenvs', { session });
  }

  // Create a new environment
  async createEnvironment(session, options) {
    const {
      envName,
      region,
      type,
      nodeGroups
    } = options;
    
    return this.apiRequest('environment/control/rest/createenv', {
      session,
      envName,
      region,
      settings: {
        nodeGroups
      }
    });
  }

  // Get environment information
  async getEnvironmentInfo(session, envName) {
    return this.apiRequest('environment/control/rest/getenvinfo', {
      session,
      envName
    });
  }

  // Start an environment
  async startEnvironment(session, envName) {
    return this.apiRequest('environment/control/rest/startenv', {
      session,
      envName
    });
  }

  // Stop an environment
  async stopEnvironment(session, envName) {
    return this.apiRequest('environment/control/rest/stopenv', {
      session,
      envName
    });
  }

  // Delete an environment
  async deleteEnvironment(session, envName) {
    return this.apiRequest('environment/control/rest/deleteenv', {
      session,
      envName
    });
  }

  // Add node to environment
  async addNode(session, envName, nodeType, cloudlets) {
    return this.apiRequest('environment/control/rest/addnode', {
      session,
      envName,
      nodeType,
      cloudlets
    });
  }

  // Remove node from environment
  async removeNode(session, envName, nodeId) {
    return this.apiRequest('environment/control/rest/removenode', {
      session,
      envName,
      nodeId
    });
  }

  // Get user's billing information
  async getBillingInfo(session) {
    return this.apiRequest('billing/account/rest/getaccount', { session });
  }

  // Create a backup of an environment
  async createBackup(session, envName, description = '') {
    return this.apiRequest('environment/control/rest/createbackup', {
      session,
      envName,
      description
    });
  }

  // Restore an environment from a backup
  async restoreBackup(session, envName, backupId) {
    return this.apiRequest('environment/control/rest/restorebackup', {
      session,
      envName,
      backupId
    });
  }

  // Deploy an application to an environment
  async deployApp(session, envName, nodeGroup, file, context = '') {
    return this.apiRequest('environment/deployment/rest/deploy', {
      session,
      envName,
      nodeGroup,
      file,
      context
    });
  }

  // Get deployment logs
  async getDeploymentLogs(session, envName, deploymentId) {
    return this.apiRequest('environment/deployment/rest/getdeploylogs', {
      session,
      envName,
      deploymentId
    });
  }
}

module.exports = new JelasticService();