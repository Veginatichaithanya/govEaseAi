import React from 'react';
import GovernmentDashboard from '../../components/government/GovernmentDashboard';
import { ROLE_SERVICE_IDS } from '../../mock/governmentAuth';

/**
 * Environment Officer Dashboard
 * Sees: Pollution Certificate
 * Route: /government/environment-dashboard
 */
const EnvironmentDashboardPage: React.FC = () => (
  <GovernmentDashboard
    title="Environment Officer Dashboard"
    serviceIds={ROLE_SERVICE_IDS['ENVIRONMENT_OFFICER']}
  />
);

export default EnvironmentDashboardPage;
