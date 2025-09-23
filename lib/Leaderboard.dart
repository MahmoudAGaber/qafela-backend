import 'dart:async';
import 'package:flutter/material.dart';
import 'package:qafela/theme/desert_theme.dart';
import 'package:provider/provider.dart';
import 'package:qafela/widgets/wallet_service.dart';

class LeaderboardScreen extends StatefulWidget {
  const LeaderboardScreen({super.key});

  @override
  State<LeaderboardScreen> createState() => _LeaderboardScreenState();
}

class _LeaderboardScreenState extends State<LeaderboardScreen> with TickerProviderStateMixin {
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

  // current logged-in user (example)

  // countdown
  late DateTime weekEndTime;
  late Timer _timer;
  Duration remaining = Duration.zero;
  final Duration totalDuration = const Duration(days: 4); // الثابت الذي بدأنا منه

  // animation controller for subtle pulses when time low
  late AnimationController _pulseController;

  @override
  void initState() {
    super.initState();
    weekEndTime = DateTime.now().add(totalDuration);
    remaining = weekEndTime.difference(DateTime.now()).isNegative ? Duration.zero : weekEndTime.difference(DateTime.now());

    _timer = Timer.periodic(const Duration(seconds: 1), (_) {
      final diff = weekEndTime.difference(DateTime.now());
      setState(() {
        remaining = diff.isNegative ? Duration.zero : diff;
      });
    });

    _pulseController = AnimationController(vsync: this, duration: const Duration(seconds: 1))
      ..repeat(reverse: true);
  }

  @override
  void dispose() {
    _timer.cancel();
    _pulseController.dispose();
    super.dispose();
  }

  String formatTimeLeftShort() {
    if (remaining.inSeconds <= 0) return "انتهى";
    final days = remaining.inDays;
    final hours = remaining.inHours.remainder(24);
    final mins = remaining.inMinutes.remainder(60);
    if (days > 0) return "$days يوم $hours س";
    if (hours > 0) return "$hours س $mins د";
    return "$mins د ${remaining.inSeconds.remainder(60)} ث";
  }

  double getTopPoints(List<Map<String, dynamic>> source) {
    if (source.isEmpty) return 1.0;
    return (source.first["points"] as int).toDouble();
  }

  List<Color> gradientForRank(int rank) {
    switch (rank) {
      case 1:
        return [const Color(0xFFFFF3C4), const Color(0xFFFFD54A)]; // ذهبى هادئ
      case 2:
        return [const Color(0xFFEFEFEF), const Color(0xFFBDBDBD)]; // فضي هادئ
      case 3:
        return [const Color(0xFFF4E6D1), const Color(0xFFDE9A4A)]; // برونزي/خوخي
      default:
        return [const Color(0xFFEAF2F8), const Color(0xFFD7E7F2)]; // خلفية هادئة عامة
    }
  }

  @override
  Widget build(BuildContext context) {


    final wallet = Provider.of<WalletService>(context);
    int currentUserPoints = wallet.points.toInt();
    int currentUserRank = leaderboardData
        .where((e) => e["points"] > currentUserPoints)
        .length + 1;
    String currentUserName = "أنت";


    List<Map<String, dynamic>> fullData = leaderboardData.map((e) => Map<String, dynamic>.from(e)).toList();


    fullData.removeWhere((p) => p["username"] == currentUserName);
    fullData.add({
      "username": currentUserName,
      "points": currentUserPoints,
      "avatar": "👤",
    });

    // ---- 3) ترتيب تنازلي حسب النقاط ----
    fullData.sort((a, b) => (b["points"] as int).compareTo(a["points"] as int));

    // ---- 4) إعادة حساب الرتب (standard dense/simple) ----
    for (int i = 0; i < fullData.length; i++) {
      fullData[i]["rank"] = i + 1;
    }

    // ---- 5) استخراج top3 و others ----
    final List<Map<String, dynamic>> top3 = fullData.length >= 3 ? fullData.sublist(0, 3) : fullData.toList();
    final List<Map<String, dynamic>> others = fullData.length > 3 ? fullData.sublist(3) : <Map<String, dynamic>>[];

    // ---- 6) تحديد ترتيب المستخدم الحالي ----
    final currentUser = fullData.firstWhere((p) => p["username"] == currentUserName, orElse: () => {});
    if (currentUser.isNotEmpty) {
      currentUserRank = currentUser["rank"] as int;
    } else {
      currentUserRank = -1;
    }

    // ---- 7) topPoints لاحتساب النسب ----
    final double topPoints = getTopPoints(fullData);

    // === واجهة المستخدم ===
    return Scaffold(
      backgroundColor: DesertTheme.desertSand,
      appBar: AppBar(
        title: const Text("الترتيب الأسبوعي"),
        centerTitle: true,
        elevation: 0,
        backgroundColor: DesertTheme.dateBrown,
        foregroundColor: Colors.white,
        actions: [
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 8.0),
            child: Row(
              children: [
                // circular small timer in appbar
                SizedBox(
                  width: 42,
                  height: 42,
                  child: Stack(
                    alignment: Alignment.center,
                    children: [
                      CircularProgressIndicator(
                        value: remaining.inSeconds / totalDuration.inSeconds,
                        strokeWidth: 3,
                        backgroundColor: Colors.grey.shade200,
                        valueColor: AlwaysStoppedAnimation(
                          remaining.inSeconds > 3600 ? const Color(0xFF6FB3D2) : (remaining.inSeconds > 300 ? const Color(0xFFF0A202) : const Color(0xFFE25858)),
                        ),
                      ),
                      Text(
                        // show minutes remaining if < 1 day
                        remaining.inDays > 0 ? "${remaining.inDays}d" : "${remaining.inHours.remainder(24).toString().padLeft(2,'0')}:${remaining.inMinutes.remainder(60).toString().padLeft(2,'0')}",
                        style: const TextStyle(fontSize: 10, color: DesertTheme.oliveBlack),
                      )
                    ],
                  ),
                ),
                const SizedBox(width: 8),
              ],
            ),
          )
        ],
      ),
      body: SingleChildScrollView(
        physics: const BouncingScrollPhysics(),
        padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 16),
        child: Column(
          children: [
            // ===== current user card (prominent) =====
            _buildCurrentUserCard(currentUserPoints, currentUserRank),

            const SizedBox(height: 16),

            // ===== Podium (Top 3) =====
            _buildPodium(top3),

            const SizedBox(height: 18),

            // ===== list title =====
            Align(
              alignment: Alignment.centerRight,
              child: Text(
                "قائمة المتسابقين",
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: Colors.grey.shade800),
              ),
            ),

            const SizedBox(height: 8),

            // ===== remaining players list (rank 4+) =====
            Column(
              children: others.map((player) {
                final int rank = player["rank"] as int;
                final String name = player["username"] as String;
                final int pts = player["points"] as int;
                final double relative = topPoints > 0 ? (pts / topPoints).clamp(0.0, 1.0) : 0.0;

                return Padding(
                  padding: const EdgeInsets.only(bottom: 10),
                  child: _playerCard(
                    rank: rank,
                    username: name,
                    points: pts,
                    avatarEmoji: player["avatar"] as String,
                    progress: relative,
                  ),
                );
              }).toList(),
            ),

            const SizedBox(height: 22),

            // ===== weekly prize card =====
            _buildWeeklyPrizeCard(),

            const SizedBox(height: 30),
          ],
        ),
      ),
    );
  }

  Widget _buildCurrentUserCard(int currentUserPoints, int currentUserRank) {
    String currentUserName = "أنت"; // تقدر تجيبها من صفحة البروفايل
    return Card(
      elevation: 4,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 12),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(16),
          gradient: const LinearGradient(colors: [Color(0xFFFFFFFF), Color(0xFFF5F8FB)], begin: Alignment.topLeft, end: Alignment.bottomRight),
        ),
        child: Row(
          children: [
            // avatar
            CircleAvatar(
              radius: 26,
              backgroundColor: const Color(0xFF90A4AE),
              child: Text(currentUserName[0], style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 20)),
            ),
            const SizedBox(width: 12),
            // details
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text("ترتيبك الحالي", style: TextStyle(fontWeight: FontWeight.bold)),
                  const SizedBox(height: 4),
                  Text("$currentUserPoints نقطة", style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Color(0xFF37474F))),
                ],
              ),
            ),
            // rank badge
            Container(
              padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 12),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(12),
                color: DesertTheme.sandGold.withOpacity(0.2),

                boxShadow: [BoxShadow(color: DesertTheme.oliveBlack.withOpacity(0.04), blurRadius: 6)],
              ),
              child: Column(
                children: [
                  const Text("موقعك", style: TextStyle(fontSize: 12, color: DesertTheme.oliveBlack)),
                  const SizedBox(height: 4),
                  Text("#$currentUserRank", style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPodium(List<Map<String, dynamic>> top3) {
    // ensure we have at least 3 entries
    final List<Map<String, dynamic>> podium = top3;

    // determine heights for visual podium
    double h1 = 130, h2 = 100, h3 = 90;
    // arrange positions: [2,1,3]
    final left = podium.length >= 2 ? podium[1] : null;
    final center = podium.isNotEmpty ? podium[0] : null;
    final right = podium.length >= 3 ? podium[2] : null;

    return Row(
      crossAxisAlignment: CrossAxisAlignment.end,
      mainAxisAlignment: MainAxisAlignment.spaceEvenly,
      children: [
        // rank 2
        _podiumPlaceWidget(player: left, height: h2, accent: 2),
        // rank 1 (center)
        _podiumPlaceWidget(player: center, height: h1, accent: 1),
        // rank 3
        _podiumPlaceWidget(player: right, height: h3, accent: 3),
      ],
    );
  }

  Widget _podiumPlaceWidget({Map<String, dynamic>? player, required double height, required int accent}) {
    if (player == null) {
      return SizedBox(width: 100, height: height);
    }

    final int rank = player["rank"] as int;
    final String name = player["username"] as String;
    final int pts = player["points"] as int;
    final String avatar = player["avatar"] as String;

    final List<Color> grad = gradientForRank(rank);
    final double width = accent == 1 ? 120 : 100;

    return Column(
      mainAxisAlignment: MainAxisAlignment.end,
      children: [
        // avatar bubble
        Container(
          width: width,
          height: width,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            gradient: LinearGradient(colors: grad, begin: Alignment.topLeft, end: Alignment.bottomRight),
            boxShadow: [
              BoxShadow(color: DesertTheme.oliveBlack.withOpacity(0.12), blurRadius: 10, offset: const Offset(0, 6)),
            ],
          ),
          child: Center(
            child: Text(avatar, style: TextStyle(fontSize: accent == 1 ? 36 : 28)),
          ),
        ),
        const SizedBox(height: 8),
        // name
        Text(name, style: TextStyle(fontWeight: FontWeight.bold, color: Colors.grey.shade800)),
        const SizedBox(height: 6),
        // points
        Text("$pts نقطة", style: TextStyle(color: Colors.grey.shade600)),
        const SizedBox(height: 8),
        // podium block
        Container(
          width: width,
          height: height / 3,
          decoration: BoxDecoration(
            color: gradientForRank(rank).last.withOpacity(0.12),
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: DesertTheme.oliveBlack),
          ),
          child: Center(child: Text("#$rank", style: const TextStyle(fontWeight: FontWeight.bold))),
        ),
      ],
    );
  }

  Widget _playerCard({
    required int rank,
    required String username,
    required int points,
    required String avatarEmoji,
    required double progress,
  }) {
    final List<Color> grad = gradientForRank(rank);
    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(14),
        gradient: LinearGradient(colors: grad, begin: Alignment.topLeft, end: Alignment.bottomRight),
        boxShadow: [BoxShadow(color: DesertTheme.oliveBlack.withOpacity(0.05), blurRadius: 8, offset: const Offset(0, 4))],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(14),
        child: Material(
          color: Colors.white.withOpacity(0.0),
          child: InkWell(
            onTap: () {
              // future: فتح بروفايل اللاعب
            },
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              child: Row(
                children: [
                  CircleAvatar(
                    radius: 22,
                    backgroundColor: Colors.white,
                    child: Text(avatarEmoji, style: const TextStyle(fontSize: 20)),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(username, style: TextStyle(fontWeight: FontWeight.bold, color: Colors.grey.shade900)),
                        const SizedBox(height: 6),
                        Row(
                          children: [
                            Text("$points نقطة", style: TextStyle(color: Colors.grey.shade700, fontSize: 12)),
                            const SizedBox(width: 8),
                            Expanded(
                              child: ClipRRect(
                                borderRadius: BorderRadius.circular(6),
                                child: LinearProgressIndicator(
                                  minHeight: 8,
                                  value: progress,
                                  backgroundColor: Colors.white.withOpacity(0.6),
                                  valueColor: AlwaysStoppedAnimation(Colors.blue.shade700),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 12),
                  Text("#$rank", style: const TextStyle(fontWeight: FontWeight.bold, color: DesertTheme.oliveBlack)),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildWeeklyPrizeCard() {
    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        gradient: const LinearGradient(colors: [Color(0xFF4A90E2), Color(0xFF2A6FB7)], begin: Alignment.topLeft, end: Alignment.bottomRight),
        borderRadius: BorderRadius.circular(16),
        boxShadow: [BoxShadow(color: DesertTheme.oliveBlack.withOpacity(0.12), blurRadius: 12, offset: const Offset(0, 6))],
      ),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 16),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(color: Colors.white.withOpacity(0.12), shape: BoxShape.circle),
              child: const Icon(Icons.emoji_events, color: Colors.white, size: 28),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text("جائزة الأسبوع", style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
                  const SizedBox(height: 6),
                  const Text("المركز الأول يحصل على 10,000 ر.س", style: TextStyle(color: Colors.white70)),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      const Icon(Icons.timer, size: 14, color: Colors.white70),
                      const SizedBox(width: 6),
                      Text(formatTimeLeftShort(), style: const TextStyle(color: Colors.white70, fontSize: 12)),
                    ],
                  )
                ],
              ),
            ),
            ElevatedButton(
              onPressed: () {
                // فتح صفحة التفاصيل أو القواعد
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.white,
                foregroundColor: const Color(0xFF2A6FB7),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              child: const Text("التفاصيل"),
            )
          ],
        ),
      ),
    );
  }
}
