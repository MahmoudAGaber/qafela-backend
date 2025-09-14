import 'package:flutter/material.dart';
import 'dart:async';

class LeaderboardScreen extends StatefulWidget {
  const LeaderboardScreen({super.key});

  @override
  State<LeaderboardScreen> createState() => _LeaderboardScreenState();
}

class _LeaderboardScreenState extends State<LeaderboardScreen> {
  final List<Map<String, dynamic>> leaderboardData = [
    {"rank": 1, "username": "أحمد الفائز", "points": 5500, "avatar": "🏆"},
    {"rank": 2, "username": "فاطمة النجمة", "points": 4200, "avatar": "⭐"},
    {"rank": 3, "username": "عبدالله السريع", "points": 3800, "avatar": "🚀"},
    {"rank": 4, "username": "نورا المتميزة", "points": 3200, "avatar": "💎"},
    {"rank": 5, "username": "خالد البطل", "points": 2900, "avatar": "🎯"},
    {"rank": 6, "username": "سارة الذكية", "points": 2700, "avatar": "🧠"},
    {"rank": 7, "username": "محمد الماهر", "points": 2500, "avatar": "⚡"},
    {"rank": 8, "username": "ليلى المبدعة", "points": 2300, "avatar": "🎨"},
    {"rank": 9, "username": "يوسف القوي", "points": 2100, "avatar": "💪"},
    {"rank": 10, "username": "زينب الحكيمة", "points": 1900, "avatar": "🦉"},
  ];

  int currentUserRank = 86;
  int currentUserPoints = 2550;
  late DateTime weekEndTime;
  late Timer _timer;
  Duration remaining = Duration.zero;

  @override
  void initState() {
    super.initState();
    weekEndTime = DateTime.now().add(const Duration(days: 4));
    _timer = Timer.periodic(const Duration(seconds: 1), (_) {
      setState(() {
        remaining = weekEndTime.difference(DateTime.now());
      });
    });
  }

  @override
  void dispose() {
    _timer.cancel();
    super.dispose();
  }

  String formatTimeLeft() {
    final days = remaining.inDays;
    final hours = remaining.inHours % 24;
    return "$days يوم و $hours ساعة";
  }

  Color getRankColor(int rank) {
    if (rank == 1) return Colors.amber;
    if (rank == 2) return Colors.grey;
    if (rank == 3) return Colors.orange;
    return Colors.blueGrey;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Theme.of(context).colorScheme.background,
      appBar: AppBar(
        title: const Text("الترتيب الأسبوعي"),
        actions: [
          Row(
            children: [
              const Icon(Icons.timer, size: 18),
              const SizedBox(width: 4),
              Text(formatTimeLeft(), style: const TextStyle(fontSize: 14)),
              const SizedBox(width: 12),
            ],
          )
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            // ✅ current user rank
            Card(
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
              ),
              child: ListTile(
                leading: const CircleAvatar(
                  backgroundColor: Colors.blue,
                  child: Icon(Icons.person, color: Colors.white),
                ),
                title: const Text("ترتيبك الحالي"),
                subtitle: Text("$currentUserPoints نقطة"),
                trailing: Text(
                  "#$currentUserRank",
                  style: const TextStyle(
                      fontSize: 20, fontWeight: FontWeight.bold),
                ),
              ),
            ),
            const SizedBox(height: 20),

            // ✅ leaderboard list
            Column(
              children: leaderboardData.map((player) {
                return Card(
                  margin: const EdgeInsets.symmetric(vertical: 6),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: ListTile(
                    leading: Text(
                      player["avatar"],
                      style: const TextStyle(fontSize: 26),
                    ),
                    title: Text(
                      player["username"],
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        color: getRankColor(player["rank"]),
                      ),
                    ),
                    subtitle: Text("${player["points"]} نقطة"),
                    trailing: Text(
                      "#${player["rank"]}",
                      style: const TextStyle(
                          fontSize: 20, fontWeight: FontWeight.bold),
                    ),
                  ),
                );
              }).toList(),
            ),

            const SizedBox(height: 30),

            // ✅ weekly prize
            Card(
              color: Colors.amber.shade300,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(20),
              ),
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  children: [
                    const Icon(Icons.emoji_events,
                        size: 40, color: Colors.white),
                    const SizedBox(height: 8),
                    const Text(
                      "جائزة الأسبوع",
                      style: TextStyle(
                          fontSize: 18, fontWeight: FontWeight.bold,
                          color: Colors.white),
                    ),
                    const SizedBox(height: 4),
                    const Text(
                      "المركز الأول يحصل على 10,000 ريال!",
                      style: TextStyle(color: Colors.white),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      "ينتهي في: ${formatTimeLeft()}",
                      style: const TextStyle(
                          color: Colors.white70, fontSize: 12),
                    )
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
