// usage: swift winshot.swift <pid>
// Prints the process's on-screen windows as "<id> <layer> <width> <height> <title>"; pass an id to `screencapture -x -o -l <id> out.png`.
import CoreGraphics
import Foundation

let pid = Int32(CommandLine.arguments[1])!
let windows = CGWindowListCopyWindowInfo([.optionOnScreenOnly], kCGNullWindowID) as! [[String: Any]]
for window in windows where (window[kCGWindowOwnerPID as String] as? Int32) == pid {
  let bounds = window[kCGWindowBounds as String] as! [String: Any]
  print(window[kCGWindowNumber as String]!, window[kCGWindowLayer as String]!, bounds["Width"]!, bounds["Height"]!, window[kCGWindowName as String] ?? "")
}
