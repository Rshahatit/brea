//
//  ContentView.swift
//  Brea
//
//  Created by Rami Shahatit on 1/24/26.
//

import SwiftUI

struct ContentView: View {
    @EnvironmentObject var authService: AuthService

    var body: some View {
        Group {
            if authService.isLoading {
                // Loading state
                ZStack {
                    Color.black.ignoresSafeArea()

                    VStack(spacing: 20) {
                        ProgressView()
                            .tint(.white)
                            .scaleEffect(1.5)

                        Text("Loading...")
                            .foregroundColor(.white.opacity(0.6))
                    }
                }
            } else if authService.isAuthenticated {
                // Main voice room
                VoiceRoomView()
            } else {
                // Auth error state
                ZStack {
                    Color.black.ignoresSafeArea()

                    VStack(spacing: 20) {
                        Image(systemName: "exclamationmark.triangle")
                            .font(.system(size: 50))
                            .foregroundColor(.orange)

                        Text("Authentication Failed")
                            .font(.headline)
                            .foregroundColor(.white)

                        Button("Retry") {
                            Task {
                                await authService.refreshAuth()
                            }
                        }
                        .buttonStyle(.borderedProminent)
                    }
                }
            }
        }
    }
}

#Preview {
    ContentView()
        .environmentObject(AuthService())
}
