import UIKit
import Social
import MobileCoreServices
import UniformTypeIdentifiers

class ShareViewController: UIViewController {
    
    override func viewDidLoad() {
        super.viewDidLoad()
        
        // Set up UI
        view.backgroundColor = UIColor(red: 0.12, green: 0.23, blue: 0.54, alpha: 1.0) // #1E3A8A
        
        let titleLabel = UILabel()
        titleLabel.text = "VoiceGuard"
        titleLabel.textColor = .white
        titleLabel.font = UIFont.systemFont(ofSize: 22, weight: .bold)
        titleLabel.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(titleLabel)
        
        let messageLabel = UILabel()
        messageLabel.text = "Processing voicemail..."
        messageLabel.textColor = .white
        messageLabel.font = UIFont.systemFont(ofSize: 16)
        messageLabel.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(messageLabel)
        
        let activityIndicator = UIActivityIndicatorView(style: .large)
        activityIndicator.color = .white
        activityIndicator.translatesAutoresizingMaskIntoConstraints = false
        activityIndicator.startAnimating()
        view.addSubview(activityIndicator)
        
        NSLayoutConstraint.activate([
            titleLabel.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            titleLabel.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor, constant: 40),
            
            messageLabel.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            messageLabel.centerYAnchor.constraint(equalTo: view.centerYAnchor),
            
            activityIndicator.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            activityIndicator.topAnchor.constraint(equalTo: messageLabel.bottomAnchor, constant: 20)
        ])
        
        // Process the shared item
        processSharedItem()
    }
    
    func processSharedItem() {
        guard let extensionItems = extensionContext?.inputItems as? [NSExtensionItem] else {
            completeRequest()
            return
        }
        
        for extensionItem in extensionItems {
            guard let attachments = extensionItem.attachments else { continue }
            
            for attachment in attachments {
                let audioTypes = [UTType.audio.identifier, "public.audio", "public.mp3", "public.m4a", "public.wav"]
                
                if attachment.hasItemConformingToTypeIdentifier(UTType.audio.identifier) ||
                   audioTypes.contains(where: { attachment.hasItemConformingToTypeIdentifier($0) }) {
                    
                    attachment.loadItem(forTypeIdentifier: UTType.audio.identifier, options: nil) { [weak self] (data, error) in
                        guard let self = self else { return }
                        
                        if let error = error {
                            print("Error loading audio: \(error.localizedDescription)")
                            self.showError(message: "Could not load audio file")
                            return
                        }
                        
                        // Handle the audio file
                        if let url = data as? URL {
                            self.saveSharedAudioFile(from: url)
                        } else {
                            self.showError(message: "Unsupported file format")
                        }
                    }
                    return
                }
            }
        }
        
        // If we get here, we didn't find any audio attachments
        showError(message: "No audio file found")
    }
    
    func saveSharedAudioFile(from sourceURL: URL) {
        // Create a unique filename
        let fileName = "shared_voicemail_\(Int(Date().timeIntervalSince1970)).m4a"
        
        // Get the shared container URL
        guard let sharedContainerURL = FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: "group.org.reactjs.native.example.voiceguard")?.appendingPathComponent("SharedVoicemails") else {
            showError(message: "Could not access shared storage")
            return
        }
        
        // Create directory if it doesn't exist
        try? FileManager.default.createDirectory(at: sharedContainerURL, withIntermediateDirectories: true)
        
        let destinationURL = sharedContainerURL.appendingPathComponent(fileName)
        
        do {
            // Copy the file to the shared container
            try FileManager.default.copyItem(at: sourceURL, to: destinationURL)
            
            // Save the file path to UserDefaults in the shared container
            let sharedDefaults = UserDefaults(suiteName: "group.org.reactjs.native.example.voiceguard")
            sharedDefaults?.set(destinationURL.path, forKey: "LastSharedVoicemailPath")
            sharedDefaults?.set(Date().timeIntervalSince1970, forKey: "LastSharedVoicemailTimestamp")
            sharedDefaults?.synchronize()
            
            // Open the main app
            openMainApp()
        } catch {
            print("Error copying file: \(error.localizedDescription)")
            showError(message: "Could not save audio file")
        }
    }
    
    func openMainApp() {
        // Get the URL scheme for the main app
        let urlScheme = "voiceguard://"
        let url = URL(string: "\(urlScheme)sharedVoicemail")!
        
        var responder: UIResponder? = self
        while responder != nil {
            if let application = responder as? UIApplication {
                application.open(url, options: [:], completionHandler: nil)
                break
            }
            responder = responder?.next
        }
        
        // Complete the request to dismiss the extension
        completeRequest()
    }
    
    func showError(message: String) {
        let alert = UIAlertController(title: "Error", message: message, preferredStyle: .alert)
        alert.addAction(UIAlertAction(title: "OK", style: .default) { [weak self] _ in
            self?.completeRequest()
        })
        present(alert, animated: true)
    }
    
    func completeRequest() {
        extensionContext?.completeRequest(returningItems: nil, completionHandler: nil)
    }
}
