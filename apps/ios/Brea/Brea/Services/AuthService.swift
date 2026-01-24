//
//  AuthService.swift
//  Brea
//
//  Handles anonymous authentication for Brea users.
//  Uses Firebase Auth when available, falls back to local UUID storage.
//

import Foundation
import SwiftUI
import Combine

@MainActor
class AuthService: ObservableObject {
    @Published var user: BreaUser?
    @Published var isAuthenticated: Bool = false
    @Published var isLoading: Bool = true
    @Published var error: String?

    private let userIdKey = "brea_user_id"

    init() {
        Task {
            await initializeAuth()
        }
    }

    func initializeAuth() async {
        isLoading = true
        error = nil

        do {
            // Try Firebase Auth first
            if let firebaseUser = try await signInWithFirebase() {
                self.user = firebaseUser
                self.isAuthenticated = true
            } else {
                // Fall back to local auth
                let localUser = getOrCreateLocalUser()
                self.user = localUser
                self.isAuthenticated = true
            }
        } catch {
            // Firebase failed, use local auth
            print("[AuthService] Firebase auth failed, using local: \(error.localizedDescription)")
            let localUser = getOrCreateLocalUser()
            self.user = localUser
            self.isAuthenticated = true
        }

        isLoading = false
    }

    private func signInWithFirebase() async throws -> BreaUser? {
        // Firebase Auth integration
        // Uncomment when Firebase SDK is added:
        /*
        import FirebaseAuth

        let result = try await Auth.auth().signInAnonymously()
        return BreaUser(
            id: result.user.uid,
            isAnonymous: result.user.isAnonymous
        )
        */

        // For now, return nil to trigger local auth fallback
        return nil
    }

    private func getOrCreateLocalUser() -> BreaUser {
        if let existingId = UserDefaults.standard.string(forKey: userIdKey) {
            return BreaUser(id: existingId, isAnonymous: true)
        }

        let newId = UUID().uuidString
        UserDefaults.standard.set(newId, forKey: userIdKey)
        return BreaUser(id: newId, isAnonymous: true)
    }

    func signOut() {
        // Clear local storage
        UserDefaults.standard.removeObject(forKey: userIdKey)

        // Clear Firebase if configured
        // try? Auth.auth().signOut()

        user = nil
        isAuthenticated = false
    }

    func refreshAuth() async {
        await initializeAuth()
    }
}
