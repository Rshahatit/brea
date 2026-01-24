//
//  VoiceRoomView.swift
//  Brea
//
//  Main voice session interface with orb and controls.
//

import SwiftUI

struct VoiceRoomView: View {
    @StateObject private var voiceService = VoiceService()
    @EnvironmentObject var authService: AuthService

    @State private var showingError = false

    var body: some View {
        ZStack {
            // Background
            LinearGradient(
                colors: [
                    Color.black,
                    Color(red: 0.05, green: 0.05, blue: 0.1)
                ],
                startPoint: .top,
                endPoint: .bottom
            )
            .ignoresSafeArea()

            VStack(spacing: 0) {
                // Header
                header
                    .padding(.top, 20)

                Spacer()

                // Voice Orb
                VoiceOrbView(state: voiceService.state, size: 220)
                    .padding(.bottom, 20)

                // Status text
                Text(voiceService.state.displayText)
                    .font(.system(size: 18, weight: .medium))
                    .foregroundColor(.white.opacity(0.8))
                    .padding(.bottom, 30)

                // Intelligence chips
                if !voiceService.chips.isEmpty {
                    ChipsView(chips: voiceService.chips)
                        .frame(height: 50)
                        .padding(.bottom, 20)
                }

                Spacer()

                // Control button
                controlButton
                    .padding(.bottom, 50)
            }
        }
        .alert("Connection Error", isPresented: $showingError) {
            Button("Try Again") {
                Task { await connect() }
            }
            Button("Cancel", role: .cancel) { }
        } message: {
            Text(voiceService.error ?? "An unknown error occurred")
        }
        .onChange(of: voiceService.error) { _, newError in
            showingError = newError != nil
        }
    }

    private var header: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text("Brea")
                    .font(.system(size: 28, weight: .bold))
                    .foregroundColor(.white)

                Text("Your dating liaison")
                    .font(.system(size: 14))
                    .foregroundColor(.white.opacity(0.6))
            }

            Spacer()

            // Session indicator
            if voiceService.state.isActive {
                HStack(spacing: 6) {
                    Circle()
                        .fill(.green)
                        .frame(width: 8, height: 8)

                    Text("Live")
                        .font(.system(size: 12, weight: .medium))
                        .foregroundColor(.green)
                }
                .padding(.horizontal, 12)
                .padding(.vertical, 6)
                .background(
                    Capsule()
                        .fill(.green.opacity(0.15))
                )
            }
        }
        .padding(.horizontal, 24)
    }

    private var controlButton: some View {
        Button(action: {
            Task {
                if voiceService.state == .idle || voiceService.state == .error {
                    await connect()
                } else {
                    await voiceService.disconnect()
                }
            }
        }) {
            HStack(spacing: 10) {
                Image(systemName: buttonIcon)
                    .font(.system(size: 18, weight: .medium))

                Text(buttonText)
                    .font(.system(size: 16, weight: .semibold))
            }
            .foregroundColor(buttonForegroundColor)
            .frame(width: 200, height: 56)
            .background(
                RoundedRectangle(cornerRadius: 28)
                    .fill(buttonBackgroundColor)
            )
            .overlay(
                RoundedRectangle(cornerRadius: 28)
                    .stroke(buttonBorderColor, lineWidth: 1)
            )
        }
        .disabled(voiceService.state == .connecting)
    }

    private var buttonIcon: String {
        switch voiceService.state {
        case .idle, .error:
            return "mic.fill"
        case .connecting:
            return "ellipsis"
        default:
            return "xmark"
        }
    }

    private var buttonText: String {
        switch voiceService.state {
        case .idle:
            return "Start Session"
        case .connecting:
            return "Connecting..."
        case .error:
            return "Try Again"
        default:
            return "End Session"
        }
    }

    private var buttonBackgroundColor: Color {
        switch voiceService.state {
        case .idle:
            return Color(red: 0.9, green: 0.4, blue: 0.6)
        case .connecting:
            return Color.gray.opacity(0.3)
        case .error:
            return Color.red.opacity(0.3)
        default:
            return Color.white.opacity(0.1)
        }
    }

    private var buttonForegroundColor: Color {
        switch voiceService.state {
        case .idle:
            return .white
        case .connecting:
            return .gray
        default:
            return .white.opacity(0.8)
        }
    }

    private var buttonBorderColor: Color {
        switch voiceService.state {
        case .idle:
            return Color(red: 0.9, green: 0.4, blue: 0.6).opacity(0.5)
        default:
            return Color.white.opacity(0.2)
        }
    }

    private func connect() async {
        guard let userId = authService.user?.id else {
            voiceService.error = "Not authenticated"
            return
        }
        await voiceService.connect(userId: userId)
    }
}

#Preview {
    VoiceRoomView()
        .environmentObject(AuthService())
}
