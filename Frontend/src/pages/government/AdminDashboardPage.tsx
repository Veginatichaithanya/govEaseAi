import React from 'react';
import GovernmentDashboard from '../../components/government/GovernmentDashboard';
import { ROLE_SERVICE_IDS } from '../../mock/governmentAuth';

/**
 * Super Admin Dashboard — sees ALL applications across ALL departments.
 * Route: /government/admin-dashboard
 */
const AdminDashboardPage: React.FC = () => (
  <GovernmentDashboard
    title="Super Admin Dashboard"
    serviceIds={ROLE_SERVICE_IDS['SUPER_ADMIN']}
  />
);

export default AdminDashboardPage;
