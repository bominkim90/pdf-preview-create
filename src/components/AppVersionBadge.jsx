import { APP_VERSION_LABEL } from '../constants/appMeta';
import './AppVersionBadge.css';

export default function AppVersionBadge() {
  return (
    <span className="app-version-badge" title={`버전 ${APP_VERSION_LABEL}`}>
      v{APP_VERSION_LABEL}
    </span>
  );
}
