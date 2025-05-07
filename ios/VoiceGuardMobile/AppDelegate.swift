import UIKit
import UserNotifications
import React
import React_RCTAppDelegate
import ReactAppDependencyProvider
import AVFoundation

@main
class AppDelegate: UIResponder, UIApplicationDelegate {  
  // Shared voicemail path from extension
  static var sharedVoicemailPath: String? = nil
  var window: UIWindow?

  var reactNativeDelegate: ReactNativeDelegate?
  var reactNativeFactory: RCTReactNativeFactory?

  func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
  ) -> Bool {
    // Check for shared voicemail from extension
    checkForSharedVoicemail()
    // Configure AVAudioSession for recording
    do {
      let audioSession = AVAudioSession.sharedInstance()
      
      // First deactivate the session
      try audioSession.setActive(false)
      
      // Set category with mode and options
      try audioSession.setCategory(.playAndRecord, 
                                 mode: .default,
                                 options: [.defaultToSpeaker, .allowBluetooth, .mixWithOthers])
      
      // Set preferred sample rate
      try audioSession.setPreferredSampleRate(44100.0)
      
      // Set I/O buffer duration for better performance
      try audioSession.setPreferredIOBufferDuration(0.005)
      
      // CRITICAL: Explicitly activate the audio session
      try audioSession.setActive(true, options: .notifyOthersOnDeactivation)
      
      // Log the current configuration for debugging
      print("✅ AVAudioSession successfully configured for recording")
      print("✅ Category: \(audioSession.category)")
      print("✅ Mode: \(audioSession.mode)")
      print("✅ Options: \(audioSession.categoryOptions)")
      print("✅ Sample Rate: \(audioSession.sampleRate)")
      print("✅ Input Available: \(audioSession.isInputAvailable)")
      print("✅ Is Active: \(audioSession.isOtherAudioPlaying == false)")
    } catch {
      print("❌ Failed to set AVAudioSession category: \(error)")
    }
    
    let delegate = ReactNativeDelegate()
    let factory = RCTReactNativeFactory(delegate: delegate)
    delegate.dependencyProvider = RCTAppDependencyProvider()

    reactNativeDelegate = delegate
    reactNativeFactory = factory

    window = UIWindow(frame: UIScreen.main.bounds)

    factory.startReactNative(
      withModuleName: "VoiceGuardMobile",
      in: window,
      launchOptions: launchOptions
    )

    return true
  }
  
  // Handle URL scheme for opening from Share Extension
  func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey : Any] = [:]) -> Bool {
    if url.scheme == "voiceguard" && url.host == "sharedVoicemail" {
      // Check for shared voicemail when app is opened via URL scheme
      checkForSharedVoicemail()
      return true
    }
    return false
  }
  
  // Check for shared voicemail from extension
  private func checkForSharedVoicemail() {
    // Access shared UserDefaults
    if let sharedDefaults = UserDefaults(suiteName: "group.org.reactjs.native.example.voiceguard") {
      // Check if we have a recently shared voicemail
      if let path = sharedDefaults.string(forKey: "LastSharedVoicemailPath"),
         let timestamp = sharedDefaults.object(forKey: "LastSharedVoicemailTimestamp") as? TimeInterval {
        
        // Only process if it was shared in the last 60 seconds
        let currentTime = Date().timeIntervalSince1970
        if currentTime - timestamp < 60 {
          // Store the path for React Native to access
          AppDelegate.sharedVoicemailPath = path
          
          // Clear the shared data to prevent reprocessing
          sharedDefaults.removeObject(forKey: "LastSharedVoicemailPath")
          sharedDefaults.removeObject(forKey: "LastSharedVoicemailTimestamp")
          sharedDefaults.synchronize()
          
          print("✅ Found shared voicemail at path: \(path)")
        }
      }
    }
  }
}

class ReactNativeDelegate: RCTDefaultReactNativeFactoryDelegate {
  override func sourceURL(for bridge: RCTBridge) -> URL? {
    self.bundleURL()
  }

  override func bundleURL() -> URL? {
#if DEBUG
    RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index")
#else
    Bundle.main.url(forResource: "main", withExtension: "jsbundle")
#endif
  }
}
