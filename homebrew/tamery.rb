cask "tamery" do
  arch arm: "arm64", intel: "x64"

  version "0.32.0"
  sha256 arm:   "0d4d7b29ab2ed645879dd16f88eacd5028cda701f6a5141ee00c0af4711d9cb8",
         intel: "8463d86aa37f3d3b254b714816152347cf238f885a95c1f4d438cf6b31945184"

  url "https://download.tamery.app/versions/#{version}/mac/dmg/#{arch}"
  name "Tamery"
  desc "AI-powered database client for Postgres, MySQL, MSSQL and ClickHouse"
  homepage "https://tamery.app/"

  livecheck do
    url "https://download.todesktop.com/25112796k32u7/latest-mac.yml"
    strategy :electron_builder
  end

  auto_updates true
  depends_on macos: :monterey

  app "Tamery.app"

  zap trash: [
    "~/Library/Application Support/Tamery",
    "~/Library/Caches/@tamerydesktop-updater",
    "~/Library/HTTPStorages/com.wannabespace.conar",
    "~/Library/Preferences/com.wannabespace.conar.plist",
    "~/Library/Saved Application State/com.wannabespace.conar.savedState",
  ]
end
