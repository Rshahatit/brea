//
//  VoiceState.swift
//  Brea
//

import Foundation
import SwiftUI

enum VoiceState: String, CaseIterable {
    case idle
    case connecting
    case connected
    case listening
    case speaking
    case error

    var displayText: String {
        switch self {
        case .idle: return "Tap to start"
        case .connecting: return "Connecting..."
        case .connected: return "Connected"
        case .listening: return "Listening..."
        case .speaking: return "Brea is speaking"
        case .error: return "Connection error"
        }
    }

    var primaryColor: Color {
        switch self {
        case .idle: return Color(red: 0.3, green: 0.3, blue: 0.4)
        case .connecting: return Color(red: 0.4, green: 0.4, blue: 0.6)
        case .connected, .listening: return Color(red: 0.4, green: 0.6, blue: 0.9)
        case .speaking: return Color(red: 0.9, green: 0.5, blue: 0.7)
        case .error: return Color(red: 0.9, green: 0.3, blue: 0.3)
        }
    }

    var secondaryColor: Color {
        switch self {
        case .idle: return Color(red: 0.2, green: 0.2, blue: 0.3)
        case .connecting: return Color(red: 0.3, green: 0.3, blue: 0.5)
        case .connected, .listening: return Color(red: 0.2, green: 0.4, blue: 0.7)
        case .speaking: return Color(red: 0.7, green: 0.3, blue: 0.5)
        case .error: return Color(red: 0.7, green: 0.2, blue: 0.2)
        }
    }

    var glowColor: Color {
        switch self {
        case .idle: return .gray
        case .connecting: return .blue.opacity(0.5)
        case .connected, .listening: return .cyan
        case .speaking: return .pink
        case .error: return .red
        }
    }

    var isActive: Bool {
        switch self {
        case .connected, .listening, .speaking: return true
        default: return false
        }
    }
}
