//
//  BreaApp.swift
//  Brea
//
//  Created by Rami Shahatit on 1/24/26.
//

import SwiftUI

// Uncomment when Firebase is added via SPM:
// import FirebaseCore

@main
struct BreaApp: App {
    @StateObject private var authService = AuthService()

    init() {
        // Configure Firebase - uncomment when SDK is added:
        // FirebaseApp.configure()
    }

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(authService)
                .preferredColorScheme(.dark)
        }
    }
}
