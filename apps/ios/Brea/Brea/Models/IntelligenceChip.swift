//
//  IntelligenceChip.swift
//  Brea
//

import Foundation
import SwiftUI

enum ChipCategory: String, Codable, CaseIterable {
    case dealbreaker = "Dealbreaker"
    case value = "Value"
    case hobby = "Hobby"
    case energy = "Energy"
    case style = "Style"
    case preference = "Preference"
    case unknown = "Unknown"

    // Also handle uppercase versions from old format
    init(from decoder: Decoder) throws {
        let container = try decoder.singleValueContainer()
        let rawValue = try container.decode(String.self)

        // Try exact match first
        if let category = ChipCategory(rawValue: rawValue) {
            self = category
            return
        }

        // Try case-insensitive match
        let lowercased = rawValue.lowercased()
        switch lowercased {
        case "dealbreaker": self = .dealbreaker
        case "value": self = .value
        case "hobby": self = .hobby
        case "energy": self = .energy
        case "style": self = .style
        case "preference": self = .preference
        default: self = .unknown
        }
    }

    var color: Color {
        switch self {
        case .dealbreaker: return Color(red: 0.9, green: 0.3, blue: 0.3)
        case .value: return Color(red: 0.4, green: 0.6, blue: 0.9)
        case .hobby: return Color(red: 0.3, green: 0.8, blue: 0.5)
        case .energy: return Color(red: 1.0, green: 0.7, blue: 0.3)
        case .style: return Color(red: 0.7, green: 0.5, blue: 0.9)
        case .preference: return Color(red: 0.5, green: 0.8, blue: 0.9)
        case .unknown: return .gray
        }
    }

    var icon: String {
        switch self {
        case .dealbreaker: return "xmark.circle.fill"
        case .value: return "heart.fill"
        case .hobby: return "star.fill"
        case .energy: return "bolt.fill"
        case .style: return "paintpalette.fill"
        case .preference: return "hand.thumbsup.fill"
        case .unknown: return "questionmark.circle"
        }
    }
}

struct IntelligenceChip: Identifiable, Codable {
    let id: UUID
    let label: String
    let category: ChipCategory
    let emoji: String
    let confidence: Double
    let timestamp: Date

    init(label: String, category: ChipCategory, emoji: String = "", confidence: Double = 1.0) {
        self.id = UUID()
        self.label = label
        self.category = category
        self.emoji = emoji
        self.confidence = confidence
        self.timestamp = Date()
    }

    init(id: String?, label: String, category: ChipCategory, emoji: String = "", confidence: Double = 1.0) {
        self.id = id.flatMap { UUID(uuidString: $0) } ?? UUID()
        self.label = label
        self.category = category
        self.emoji = emoji
        self.confidence = confidence
        self.timestamp = Date()
    }

    var displayText: String {
        if emoji.isEmpty {
            return label
        }
        return "\(emoji) \(label)"
    }

    var isConfirmed: Bool {
        confidence > 0.7
    }
}
