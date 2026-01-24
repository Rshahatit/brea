//
//  User.swift
//  Brea
//

import Foundation

struct BreaUser: Identifiable, Codable {
    let id: String
    let isAnonymous: Bool

    init(id: String, isAnonymous: Bool = true) {
        self.id = id
        self.isAnonymous = isAnonymous
    }
}
