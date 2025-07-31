import { withRouter } from 'react-router-dom';
import SyncManagementTablePage from './SyncManagementTablePage';

// TableIndexPage handles its own state management, so we don't need Redux
export default withRouter(SyncManagementTablePage);