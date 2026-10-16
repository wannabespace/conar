import { ElectronSwitchRow } from '~/core/settings/electron-switch-row'

export const ConnectionLinksRow = () => (
  <ElectronSwitchRow
    id="connection-links-default"
    title="Open database links in Tamery"
    description="PostgreSQL, MySQL, MariaDB, SQL Server and ClickHouse links open the matching connection, or a new one filled in from the link."
    event="connection_links_default_toggled"
    get={() => window.electron?.connectionLinks.isDefault()}
    set={(enabled) => window.electron?.connectionLinks.setDefault(enabled)}
  />
)
