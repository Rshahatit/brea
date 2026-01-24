//
//  ChipsView.swift
//  Brea
//
//  Displays intelligence chips extracted during conversation.
//

import SwiftUI

struct ChipsView: View {
    let chips: [IntelligenceChip]

    var body: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 10) {
                ForEach(chips) { chip in
                    ChipView(chip: chip)
                        .transition(.asymmetric(
                            insertion: .scale.combined(with: .opacity),
                            removal: .opacity
                        ))
                }
            }
            .padding(.horizontal, 20)
        }
        .animation(.spring(response: 0.4, dampingFraction: 0.7), value: chips.count)
    }
}

struct ChipView: View {
    let chip: IntelligenceChip

    @State private var appeared = false

    var body: some View {
        HStack(spacing: 8) {
            // Show emoji if available, otherwise show category icon
            if !chip.emoji.isEmpty {
                Text(chip.emoji)
                    .font(.system(size: 18))
            } else {
                Image(systemName: chip.category.icon)
                    .font(.system(size: 14, weight: .medium))
            }

            VStack(alignment: .leading, spacing: 2) {
                Text(chip.category.rawValue.uppercased())
                    .font(.system(size: 9, weight: .bold))
                    .foregroundColor(chip.category.color.opacity(0.8))
                    .tracking(0.5)

                Text(chip.label)
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundColor(.white)
            }
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 10)
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(Color.white.opacity(0.12))
                .overlay(
                    RoundedRectangle(cornerRadius: 16)
                        .stroke(chip.category.color.opacity(0.4), lineWidth: 1)
                )
        )
        .shadow(color: chip.category.color.opacity(0.3), radius: 8, x: 0, y: 4)
        .scaleEffect(appeared ? 1 : 0.5)
        .opacity(appeared ? 1 : 0)
        .onAppear {
            withAnimation(.spring(response: 0.4, dampingFraction: 0.6)) {
                appeared = true
            }
        }
    }
}

// Floating overlay for chips during conversation
struct ChipsOverlay: View {
    let chips: [IntelligenceChip]

    var body: some View {
        VStack(spacing: 8) {
            ForEach(Array(chips.prefix(6).enumerated()), id: \.element.id) { index, chip in
                FloatingChipView(chip: chip, delay: Double(index) * 0.1)
            }
        }
        .padding(.horizontal, 20)
    }
}

struct FloatingChipView: View {
    let chip: IntelligenceChip
    let delay: Double

    @State private var appeared = false
    @State private var isVisible = true

    var body: some View {
        HStack(spacing: 10) {
            if !chip.emoji.isEmpty {
                Text(chip.emoji)
                    .font(.system(size: 20))
            }

            VStack(alignment: .leading, spacing: 2) {
                Text(chip.category.rawValue.uppercased())
                    .font(.system(size: 9, weight: .heavy))
                    .foregroundColor(chip.category.color)
                    .tracking(1)

                Text(chip.label)
                    .font(.system(size: 15, weight: .semibold))
                    .foregroundColor(Color(white: 0.15))
            }
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 12)
        .background(
            RoundedRectangle(cornerRadius: 20)
                .fill(Color.white.opacity(0.95))
                .shadow(color: .black.opacity(0.15), radius: 12, x: 0, y: 6)
        )
        .scaleEffect(appeared ? 1 : 0.8)
        .opacity(appeared && isVisible ? 1 : 0)
        .offset(y: appeared ? 0 : -20)
        .onAppear {
            withAnimation(.spring(response: 0.5, dampingFraction: 0.7).delay(delay)) {
                appeared = true
            }

            // Auto-fade after 5 seconds
            DispatchQueue.main.asyncAfter(deadline: .now() + 5 + delay) {
                withAnimation(.easeOut(duration: 0.3)) {
                    isVisible = false
                }
            }
        }
    }
}

#Preview {
    ZStack {
        Color.black.ignoresSafeArea()

        VStack(spacing: 40) {
            // Floating overlay style
            ChipsOverlay(chips: [
                IntelligenceChip(label: "No Smoking", category: .dealbreaker, emoji: "🚭"),
                IntelligenceChip(label: "Family First", category: .value, emoji: "👨‍👩‍👧‍👦"),
                IntelligenceChip(label: "Hiking", category: .hobby, emoji: "🥾"),
            ])

            Spacer()

            // Horizontal scroll style
            ChipsView(chips: [
                IntelligenceChip(label: "No Smoking", category: .dealbreaker, emoji: "🚭"),
                IntelligenceChip(label: "Family First", category: .value, emoji: "👨‍👩‍👧‍👦"),
                IntelligenceChip(label: "Chill Vibe", category: .energy, emoji: "😌"),
                IntelligenceChip(label: "Hiking", category: .hobby, emoji: "🥾"),
            ])
        }
        .padding(.vertical, 60)
    }
}
