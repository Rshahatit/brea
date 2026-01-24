//
//  VoiceOrbView.swift
//  Brea
//
//  Animated orb that visualizes the voice session state.
//

import SwiftUI

struct VoiceOrbView: View {
    let state: VoiceState
    let size: CGFloat

    @State private var scale: CGFloat = 1.0
    @State private var innerScale: CGFloat = 0.8
    @State private var rotation: Double = 0
    @State private var glowOpacity: Double = 0.3

    init(state: VoiceState, size: CGFloat = 200) {
        self.state = state
        self.size = size
    }

    var body: some View {
        ZStack {
            // Outer glow
            Circle()
                .fill(state.glowColor.opacity(glowOpacity))
                .frame(width: size * 1.4, height: size * 1.4)
                .blur(radius: 30)

            // Main orb with gradient
            Circle()
                .fill(
                    RadialGradient(
                        colors: [state.primaryColor, state.secondaryColor],
                        center: .center,
                        startRadius: 0,
                        endRadius: size / 2
                    )
                )
                .frame(width: size, height: size)
                .scaleEffect(scale)
                .shadow(color: state.glowColor.opacity(0.5), radius: 20)

            // Inner pulse circle
            Circle()
                .stroke(state.primaryColor.opacity(0.3), lineWidth: 2)
                .frame(width: size * innerScale, height: size * innerScale)
                .scaleEffect(innerScale)

            // Rotating ring for active states
            if state.isActive {
                Circle()
                    .trim(from: 0, to: 0.3)
                    .stroke(
                        LinearGradient(
                            colors: [state.glowColor, state.glowColor.opacity(0)],
                            startPoint: .leading,
                            endPoint: .trailing
                        ),
                        style: StrokeStyle(lineWidth: 3, lineCap: .round)
                    )
                    .frame(width: size * 1.1, height: size * 1.1)
                    .rotationEffect(.degrees(rotation))
            }
        }
        .onAppear {
            startAnimations()
        }
        .onChange(of: state) { _, _ in
            startAnimations()
        }
    }

    private func startAnimations() {
        // Scale animation based on state
        let targetScale: CGFloat
        let duration: Double

        switch state {
        case .idle:
            targetScale = 1.0
            duration = 2.0
        case .connecting:
            targetScale = 1.05
            duration = 0.8
        case .connected, .listening:
            targetScale = 1.1
            duration = 1.5
        case .speaking:
            targetScale = 1.25
            duration = 0.6
        case .error:
            targetScale = 0.95
            duration = 0.3
        }

        withAnimation(.easeInOut(duration: duration).repeatForever(autoreverses: true)) {
            scale = targetScale
        }

        // Inner pulse
        withAnimation(.easeInOut(duration: 1.2).repeatForever(autoreverses: true)) {
            innerScale = state == .speaking ? 0.9 : 0.75
        }

        // Glow animation
        withAnimation(.easeInOut(duration: 1.5).repeatForever(autoreverses: true)) {
            glowOpacity = state == .speaking ? 0.6 : 0.3
        }

        // Rotation for active states
        if state.isActive {
            withAnimation(.linear(duration: 3).repeatForever(autoreverses: false)) {
                rotation = 360
            }
        } else {
            rotation = 0
        }
    }
}

#Preview {
    ZStack {
        Color.black.ignoresSafeArea()

        VStack(spacing: 40) {
            VoiceOrbView(state: .idle, size: 150)
            Text("Idle")
                .foregroundColor(.white)
        }
    }
}

#Preview("Speaking") {
    ZStack {
        Color.black.ignoresSafeArea()

        VStack(spacing: 40) {
            VoiceOrbView(state: .speaking, size: 200)
            Text("Speaking")
                .foregroundColor(.white)
        }
    }
}
