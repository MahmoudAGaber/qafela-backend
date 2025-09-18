import 'dart:math';
import 'package:flutter/material.dart';
import '../widgets/game_header.dart';
import '../widgets/user_stats.dart';
import '../widgets/leaderboard_preview.dart';
import '../widgets/drop_section.dart';

class IndexPage extends StatefulWidget {
  const IndexPage({super.key});

  @override
  State<IndexPage> createState() => _IndexPageState();
}

class _IndexPageState extends State<IndexPage> {
  bool showBalance = true;

  final mockUser = {
    "username": "محمد جابر",
    "points": 2550,
    "localRank": 86,
    "balance": 1420.50
  };

  final mockLeaderboard = [
    LeaderboardEntry(rank: 1, username: "أحمد الفائز", points: 5500),
    LeaderboardEntry(rank: 2, username: "فاطمة النجمة", points: 4200),
    LeaderboardEntry(rank: 3, username: "عبدالله السريع", points: 3800),
    LeaderboardEntry(rank: 4, username: "نورا المتميزة", points: 3200),
    LeaderboardEntry(rank: 5, username: "خالد البطل", points: 2900),
  ];

  final mockDropItems = [
    DropItem(
      id: "1",
      name: "صندوق ذهبي",
      price: 100,
      stock: 3,
      maxStock: 50,
      icon: "📦",
      type: "points",
      pointsValue: 200,
    ),
    DropItem(
      id: "2",
      name: "سيف ذهبي",
      price: 200,
      stock: 1,
      maxStock: 1,
      icon: "⚔️",
      type: "barter",
      isRare: true,
    ),
  ];

  @override
  Widget build(BuildContext context) {
    final nextDropTime = DateTime.now().add(const Duration(hours: 3));
    final isDropActive = Random().nextBool();

    return Scaffold(
      backgroundColor: const Color(0xFFFDF6EC), // 🎨 خلفية رملية
      body: SafeArea(
        child: SingleChildScrollView(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              children: [
                const GameHeader(logoPath: "lib/Assets/images/Logo.jpg"),

                const SizedBox(height: 16),
                UserStats(
                  username: mockUser["username"] as String,
                  points: mockUser["points"] as int,
                  localRank: mockUser["localRank"] as int,
                  balance: (mockUser["balance"] as num).toDouble(),
                ),

                const SizedBox(height: 20),

                // ✅ سلايدر أفقي للأزرار
                SizedBox(
                  height: 140,
                  child: ListView(
                    scrollDirection: Axis.horizontal,
                    children: const [
                      _NavCard(icon: "🐪", label: "القافلة", route: "/drop"),
                      _NavCard(icon: "🏆", label: "الترتيب", route: "/leaderboard"),
                      _NavCard(icon: "⛺", label: "صفحتي", route: "/profile"),
                      _NavCard(icon: "💼", label: "رصيدك", route: "/wallet"),
                      _NavCard(icon: "🏺", label: "المقايضات", route: "/barter"),
                      _NavCard(icon: "🎁", label: "الجوائز", route: "/reward-center"),
                      _NavCard(icon: "📜", label: "سجل القوافل", route: "/drop-history"),
                      _NavCard(icon: "⚙️", label: "الإعدادات", route: "/settings"),
                    ],
                  ),
                ),

                const SizedBox(height: 20),

                // ✅ Drop Section مع حالة العد التنازلي
                DropSection(
                  isActive: isDropActive,
                  nextDropTime: nextDropTime,
                  currentItems: mockDropItems,
                ),

                const SizedBox(height: 20),

                // ✅ Leaderboard Preview يظهر Top 3 فقط
                LeaderboardPreview(
                  entries: mockLeaderboard.take(3).toList(),
                  currentUserRank: mockUser["localRank"] as int,
                ),



                const SizedBox(height: 20),

                _WeeklyWinnerSection(),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

/// ✅ كارت مربع للسلايدر
class _NavCard extends StatelessWidget {
  final String icon;
  final String label;
  final String route;

  const _NavCard({
    required this.icon,
    required this.label,
    required this.route,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 120,
      margin: const EdgeInsets.only(right: 12),
      child: AspectRatio(
        aspectRatio: 1,
        child: InkWell(
          onTap: () => Navigator.pushNamed(context, route),
          borderRadius: BorderRadius.circular(16),
          child: Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFFFBE6C2), Color(0xFFF9D29D)], // 🎨 تدرج رملي
              ),
              borderRadius: BorderRadius.circular(16),
              boxShadow: const [
                BoxShadow(color: Colors.black26, blurRadius: 6, offset: Offset(2, 3))
              ],
            ),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(icon, style: const TextStyle(fontSize: 22)),
                const SizedBox(height: 6),
                Text(
                  label,
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF5D4037), // بني غامق
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

/// ✅ قسم الفائز الأسبوعي
class _WeeklyWinnerSection extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFFD1913C), Color(0xFFFFD194)], // ذهبي رملي
        ),
        borderRadius: BorderRadius.circular(20),
        boxShadow: const [BoxShadow(color: Colors.black26, blurRadius: 8)],
      ),
      child: Column(
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.3),
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.star, color: Colors.white),
          ),
          const SizedBox(height: 12),
          const Text("فائز كل أسبوع",
              style: TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 18,
                  color: Colors.white)),
          const SizedBox(height: 8),
          const Text("شارك وكن من أفضل المتسابقين واربح جوائز قيمة",
              textAlign: TextAlign.center,
              style: TextStyle(color: Colors.white70, fontSize: 14)),
          const SizedBox(height: 12),
          OutlinedButton(
            onPressed: () => Navigator.pushNamed(context, "/weekly-winner"),
            style: OutlinedButton.styleFrom(
              side: const BorderSide(color: Colors.white70),
              foregroundColor: Colors.white,
            ),
            child: const Text("تفاصيل أكثر"),
          )
        ],
      ),
    );
  }
}
