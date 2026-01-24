//
//  VoiceService.swift
//  Brea
//
//  Manages voice connections to the Brea agent via Daily/Pipecat.
//

import Foundation
import SwiftUI
import Combine
import PipecatClientIOSDaily
import PipecatClientIOS

@MainActor
class VoiceService: ObservableObject {
    @Published var state: VoiceState = .idle
    @Published var chips: [IntelligenceChip] = []
    @Published var error: String?

    // Agent server URL - update for production
    private let agentURL: String

    // Pipecat Client
    private var client: PipecatClient?

    // TODO: For production, use your deployed agent URL
    init(agentURL: String = "https://isomorphic-hilda-transdiaphragmatic.ngrok-free.dev") {
        self.agentURL = agentURL
    }

    // MARK: - Public API

    func connect(userId: String) async {
        guard state == .idle || state == .error else {
            print("[VoiceService] Already connecting or connected")
            return
        }

        state = .connecting
        error = nil
        chips = []

        do {
            try await connectWithPipecat(userId: userId)
        } catch {
            print("[VoiceService] Connection error: \(error.localizedDescription)")
            self.error = error.localizedDescription
            state = .error
        }
    }

    func disconnect() async {
        print("[VoiceService] Disconnecting...")

        do {
            try await client?.disconnect()
        } catch {
            print("[VoiceService] Disconnect error: \(error)")
        }
        client = nil
        state = .idle
    }

    func clearChips() {
        chips = []
    }

    // MARK: - Pipecat Connection

    private func connectWithPipecat(userId: String) async throws {
        // Create Daily transport
        let transport = DailyTransport()

        // Create client options
        let options = PipecatClientOptions(
            transport: transport,
            enableMic: true,
            enableCam: false
        )

        // Create client
        client = PipecatClient(options: options)
        client?.delegate = self

        // Build the API request to our agent server
        guard let endpoint = URL(string: "\(agentURL)/connect?user_id=\(userId)") else {
            throw VoiceError.invalidURL
        }

        let request = APIRequest(
            endpoint: endpoint,
            headers: [["Content-Type": "application/json"]],
            requestData: nil
        )

        // Start bot and connect - this calls our agent server which returns room_url and token
        print("[VoiceService] Connecting to agent at \(endpoint)...")
        let _: DailyTransportConnectionParams = try await client!.startBotAndConnect(startBotParams: request)
        print("[VoiceService] Connected successfully")
    }

    // MARK: - Chip Handling

    private func handleServerMessage(_ data: Any) {
        print("[VoiceService] Received server message: \(type(of: data))")
        print("[VoiceService] Data: \(data)")

        // Try to parse as chip data from Value type
        if let value = data as? Value {
            print("[VoiceService] Data is Value type")
            if case .object(let dict) = value {
                print("[VoiceService] Value is object with keys: \(dict.keys)")
                if let typeValue = dict["type"],
                   case .string(let typeStr) = typeValue {
                    print("[VoiceService] Message type: \(typeStr)")

                    if typeStr == "CHIP",
                       let payloadValue = dict["payload"],
                       case .object(let payload) = payloadValue,
                       let labelValue = payload["label"],
                       case .string(let label) = labelValue,
                       let categoryValue = payload["category"],
                       case .string(let categoryStr) = categoryValue {

                        // Parse optional fields
                        var emoji = ""
                        if let emojiValue = payload["emoji"], case .string(let e) = emojiValue {
                            emoji = e
                        }

                        var chipId: String? = nil
                        if let idValue = payload["id"], case .string(let id) = idValue {
                            chipId = id
                        }

                        var confidence = 1.0
                        if let confValue = payload["confidence"], case .number(let conf) = confValue {
                            confidence = conf
                        }

                        print("[VoiceService] Parsed chip: \(emoji) \(label) (\(categoryStr))")
                        let category = parseCategory(categoryStr)
                        let chip = IntelligenceChip(id: chipId, label: label, category: category, emoji: emoji, confidence: confidence)
                        addChip(chip)
                    }
                }
            }
        } else {
            print("[VoiceService] Data is NOT Value type")
            // Try other formats (native Swift dictionary)
            if let dict = data as? [String: Any] {
                print("[VoiceService] Data is [String: Any] with keys: \(dict.keys)")
                if let type = dict["type"] as? String, type == "CHIP",
                   let payload = dict["payload"] as? [String: Any],
                   let label = payload["label"] as? String,
                   let categoryStr = payload["category"] as? String {

                    let emoji = payload["emoji"] as? String ?? ""
                    let chipId = payload["id"] as? String
                    let confidence = payload["confidence"] as? Double ?? 1.0

                    print("[VoiceService] Parsed chip from dict: \(emoji) \(label) (\(categoryStr))")
                    let category = parseCategory(categoryStr)
                    let chip = IntelligenceChip(id: chipId, label: label, category: category, emoji: emoji, confidence: confidence)
                    addChip(chip)
                }
            }
        }
    }

    private func parseCategory(_ str: String) -> ChipCategory {
        // Handle both old uppercase format and new title case format
        let lowercased = str.lowercased()
        switch lowercased {
        case "dealbreaker": return .dealbreaker
        case "value": return .value
        case "hobby": return .hobby
        case "energy": return .energy
        case "style": return .style
        case "preference": return .preference
        default: return .unknown
        }
    }

    private func addChip(_ chip: IntelligenceChip) {
        // Avoid duplicates
        if !chips.contains(where: { $0.label == chip.label && $0.category == chip.category }) {
            chips.append(chip)
        }
    }
}

// MARK: - PipecatClientDelegate

extension VoiceService: PipecatClientDelegate {

    nonisolated func onConnected() {
        Task { @MainActor in
            print("[VoiceService] Connected")
            self.state = .connected
        }
    }

    nonisolated func onDisconnected() {
        Task { @MainActor in
            print("[VoiceService] Disconnected")
            self.state = .idle
        }
    }

    nonisolated func onBotReady(botReadyData: BotReadyData) {
        Task { @MainActor in
            print("[VoiceService] Bot ready")
            self.state = .listening
        }
    }

    nonisolated func onBotStartedSpeaking() {
        Task { @MainActor in
            print("[VoiceService] Bot started speaking")
            self.state = .speaking
        }
    }

    nonisolated func onBotStoppedSpeaking() {
        Task { @MainActor in
            print("[VoiceService] Bot stopped speaking")
            self.state = .listening
        }
    }

    nonisolated func onUserStartedSpeaking() {
        Task { @MainActor in
            print("[VoiceService] User started speaking")
        }
    }

    nonisolated func onUserStoppedSpeaking() {
        Task { @MainActor in
            print("[VoiceService] User stopped speaking")
        }
    }

    nonisolated func onRemoteAudioLevel(level: Float, participant: Participant) {
        // Audio level updates - could animate orb intensity
    }

    nonisolated func onLocalAudioLevel(level: Float) {
        // User audio level - could show speaking indicator
    }

    nonisolated func onError(message: RTVIMessageInbound) {
        Task { @MainActor in
            print("[VoiceService] Error: \(message)")
            self.error = "Connection error"
            self.state = .error
        }
    }

    nonisolated func onServerMessage(data: Any) {
        // Handle server messages including chip data
        Task { @MainActor in
            self.handleServerMessage(data)
        }
    }

    nonisolated func onTransportStateChanged(state: TransportState) {
        Task { @MainActor in
            print("[VoiceService] Transport state: \(state)")
        }
    }

    nonisolated func onBotConnected(participant: Participant) {
        Task { @MainActor in
            print("[VoiceService] Bot connected: \(participant)")
        }
    }

    nonisolated func onBotDisconnected(participant: Participant) {
        Task { @MainActor in
            print("[VoiceService] Bot disconnected")
            // Auto-disconnect when bot leaves
            await self.disconnect()
        }
    }
}

// MARK: - Errors

enum VoiceError: LocalizedError {
    case invalidURL
    case serverError(String)
    case connectionFailed(String)

    var errorDescription: String? {
        switch self {
        case .invalidURL:
            return "Invalid server URL"
        case .serverError(let message):
            return "Server error: \(message)"
        case .connectionFailed(let message):
            return "Connection failed: \(message)"
        }
    }
}
