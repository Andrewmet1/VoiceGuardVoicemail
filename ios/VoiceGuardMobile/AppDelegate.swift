import UIKit
import React
import React_RCTAppDelegate
import ReactAppDependencyProvider
import AVFoundation

@main
class AppDelegate: UIResponder, UIApplicationDelegate {
  var window: UIWindow?

  var reactNativeDelegate: ReactNativeDelegate?
  var reactNativeFactory: RCTReactNativeFactory?

  func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
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
