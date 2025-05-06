import Foundation
import AVFoundation
import React

@objc(RNAudioSession)
class RNAudioSession: NSObject, RCTBridgeModule {
  
  static func moduleName() -> String! {
    return "RNAudioSession"
  }
  
  static func requiresMainQueueSetup() -> Bool {
    return true
  }
  
  @objc
  func getSessionState(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    do {
      let audioSession = AVAudioSession.sharedInstance()
      
      // Create a dictionary with the current audio session state
      let sessionState: [String: Any] = [
        "isActive": audioSession.isOtherAudioPlaying == false,
        "category": audioSession.category.rawValue,
        "mode": audioSession.mode.rawValue,
        "sampleRate": audioSession.sampleRate,
        "inputAvailable": audioSession.isInputAvailable,
        "outputVolume": audioSession.outputVolume,
        "inputGain": audioSession.inputGain,
        "options": audioSession.categoryOptions.rawValue
      ]
      
      resolve(sessionState)
    } catch {
      reject("ERROR_AUDIO_SESSION", "Failed to get audio session state", error)
    }
  }
  
  @objc
  func configureSession(_ options: [String: Any], resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
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
      
      // Activate the audio session - THIS IS CRITICAL
      try audioSession.setActive(true)
      
      // Return success with current state
      let sessionState: [String: Any] = [
        "isActive": audioSession.isOtherAudioPlaying == false,
        "category": audioSession.category.rawValue,
        "mode": audioSession.mode.rawValue,
        "sampleRate": audioSession.sampleRate,
        "inputAvailable": audioSession.isInputAvailable
      ]
      
      resolve(sessionState)
    } catch {
      reject("ERROR_AUDIO_SESSION", "Failed to configure audio session", error)
    }
  }
}
