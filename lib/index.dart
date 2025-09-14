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
    "worldRank": 1438,
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
      backgroundColor: Colors.grey.shade100,
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
                  worldRank: mockUser["worldRank"] as int,
                  localRank: mockUser["localRank"] as int,
                  balance: (mockUser["balance"] as num).toDouble(),
                  showBalance: showBalance,
                  toggleBalance: () {
                    setState(() => showBalance = !showBalance);
                  },
                ),

                const SizedBox(height: 20),
                // ✅ أزرار الدخول والترتيب
                Row(
                  children: [
                    Expanded(
                      child: _ActionButton(
                        icon: "🐪",
                        label: "دخول القافلة",
                        onTap: () => Navigator.pushNamed(context, "/drop"),
                        color: Colors.blue.shade400,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: _ActionButton(
                        icon: "🏆",
                        label: "الترتيب",
                        onTap: () => Navigator.pushNamed(context, "/leaderboard"),
                        color: Colors.grey.shade300,
                        textColor: Colors.black87,
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: 20),
                // ✅ المربعات كلها متساوية
                GridView.count(
                  crossAxisCount: 2,
                  shrinkWrap: true,
                  crossAxisSpacing: 12,
                  mainAxisSpacing: 12,
                  physics: const NeverScrollableScrollPhysics(),
                  children: const [
                    _NavCard(icon: "⛺", label: "الخيمة", route: "/profile"),
                    _NavCard(icon: "💼", label: "المحفظة", route: "/wallet"),
                    _NavCard(icon: "🏺", label: "مركز المقايضات", route: "/barter"),
                    _NavCard(icon: "🎁", label: "مركز الجوائز", route: "/reward-center"),
                    _NavCard(icon: "📜", label: "سجل القوافل", route: "/drop-history"),
                    _NavCard(icon: "⚙️", label: "الإعدادات", route: "/settings"),
                  ],
                ),

                const SizedBox(height: 20),
                DropSection(
                  isActive: isDropActive,
                  nextDropTime: nextDropTime,
                  currentItems: mockDropItems,
                ),

                const SizedBox(height: 20),
                LeaderboardPreview(
                  entries: mockLeaderboard,
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

/// ✅ زرار actions (مظبوط بدون شادو)
class _ActionButton extends StatelessWidget {
  final String icon;
  final String label;
  final VoidCallback onTap;
  final Color color;
  final Color textColor;

  const _ActionButton({
    required this.icon,
    required this.label,
    required this.onTap,
    this.color = Colors.blue,
    this.textColor = Colors.white,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 20),
        decoration: BoxDecoration(
          color: color,
          borderRadius: BorderRadius.circular(16),
        ),
        child: Column(
          children: [
            Text(icon, style: const TextStyle(fontSize: 22)),
            const SizedBox(height: 6),
            Text(label,
                style: TextStyle(fontWeight: FontWeight.bold, color: textColor)),
          ],
        ),
      ),
    );
  }
}

/// ✅ كل كارت مربع متساوي
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
    return AspectRatio(
      aspectRatio: 1, // 👈 يخليها مربع
      child: InkWell(
        onTap: () => Navigator.pushNamed(context, route),
        borderRadius: BorderRadius.circular(16),
        child: Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [Colors.white, Color(0xFFF7F7F7)],
            ),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: Colors.grey.shade300),
          ),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(icon, style: const TextStyle(fontSize: 20)),
              const SizedBox(height: 6),
              Text(label, textAlign: TextAlign.center),
            ],
          ),
        ),
      ),
    );
  }
}

/// ✅ قسم الفائز الأسبوعي زي ما هو
class _WeeklyWinnerSection extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: const LinearGradient(colors: [Colors.orange, Colors.amber]),
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
            child: const Icon(Icons.flash_on, color: Colors.white),
          ),
          const SizedBox(height: 12),
          const Text("فائز كل أسبوع",
              style: TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 18,
                  color: Colors.white)),
          const SizedBox(height: 8),
          const Text("كن من أفضل المتسابقين واربح جوائز قيمة كل أسبوع",
              textAlign: TextAlign.center,
              style: TextStyle(color: Colors.white70, fontSize: 14)),
          const SizedBox(height: 12),
          OutlinedButton(
            onPressed: () {},
            style: OutlinedButton.styleFrom(
              side: const BorderSide(color: Colors.white70),
              foregroundColor: Colors.white,
              elevation: 0,
              shadowColor: Colors.transparent,
            ),
            child: const Text("تفاصيل أكثر"),
          )
        ],
      ),
    );
  }
}
