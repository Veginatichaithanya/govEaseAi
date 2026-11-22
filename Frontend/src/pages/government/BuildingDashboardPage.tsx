import React from 'react';
import GovernmentDashboard from '../../components/government/GovernmentDashboard';
import { ROLE_SERVICE_IDS } from '../../mock/governmentAuth';

/**
 * Building Officer Dashboard
 * Sees: Building Permission
 * Route: /government/building-dashboard
 */
const BuildingDashboardPage: React.FC = () => (
  <GovernmentDashboard
    title="Building Officer Dashboard"
    serviceIds={ROLE_SERVICE_IDS['BUILDING_OFFICER']}
  />
);

export default BuildingDashboardPage;
