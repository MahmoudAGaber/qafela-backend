import 'package:flutter/material.dart';
import 'package:flutter/cupertino.dart';

class LeaderboardEntry {
  final int rank;
  final String username;
  final int points;
  final String? avatar;

  LeaderboardEntry({
    required this.rank,
    required this.username,
    required this.points,
    this.avatar,
  });
}

class LeaderboardPreview extends StatelessWidget {
  final List<LeaderboardEntry> entries;
  final int? currentUserRank;

  const LeaderboardPreview({
    super.key,
    required this.entries,
    this.currentUserRank,
  });

  Widget getRankIcon(int rank) {
    switch (rank) {
      case 1:
        return  Icon(CupertinoIcons.app_fill,
            color: Colors.amber, size: 20);
      case 2:
        return const Icon(CupertinoIcons.star_circle_fill,
            color: Colors.grey, size: 20);
      case 3:
        return const Icon(CupertinoIcons.star_circle_fill,
            color: Colors.orange, size: 20);
      default:
        return Text(
          "#$rank",
          style: const TextStyle(
              fontSize: 12, fontWeight: FontWeight.bold, color: Colors.grey),
        );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF3A3D98), Color(0xFF6F86D6)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(18),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.15),
            blurRadius: 6,
            offset: const Offset(0, 3),
          )
        ],
      ),
      child: Column(
        children: [
          // العنوان
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: const [
              Row(
                children: [
                  Icon(CupertinoIcons.alt,
                      color: Colors.amber, size: 22),
                  SizedBox(width: 6),
                  Text(
                    "المتصدرون",
                    style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: Colors.white),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 12),

          // أول 5 متسابقين
          Column(
            children: entries.take(5).map((entry) {
              return Container(
                margin: const EdgeInsets.symmetric(vertical: 4),
                padding: const EdgeInsets.all(6),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Row(
                  children: [
                    SizedBox(width: 28, child: getRankIcon(entry.rank)),
                    const SizedBox(width: 6),
                    CircleAvatar(
                      radius: 16,
                      backgroundColor: Colors.deepPurpleAccent,
                      backgroundImage:
                      entry.avatar != null ? NetworkImage(entry.avatar!) : null,
                      child: entry.avatar == null
                          ? Text(
                        entry.username[0].toUpperCase(),
                        style: const TextStyle(
                            color: Colors.white,
                            fontSize: 12,
                            fontWeight: FontWeight.bold),
                      )
                          : null,
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            entry.username,
                            style: const TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.w600,
                                color: Colors.white),
                            overflow: TextOverflow.ellipsis,
                          ),
                          Text(
                            "${entry.points} نقطة",
                            style: TextStyle(
                                fontSize: 11,
                                color: Colors.white.withOpacity(0.7)),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              );
            }).toList(),
          ),

          // ترتيب المستخدم لو مش من أول 5
          if (currentUserRank != null && currentUserRank! > 5) ...[
            const SizedBox(height: 10),
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: Colors.blue.withOpacity(0.15),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Row(
                children: [
                  Text(
                    "#$currentUserRank",
                    style: const TextStyle(
                        fontWeight: FontWeight.bold, color: Colors.blue),
                  ),
                  const SizedBox(width: 8),
                  const Text(
                    "موقعك الحالي",
                    style: TextStyle(fontSize: 12, color: Colors.white),
                  )
                ],
              ),
            )
          ],

          const SizedBox(height: 14),

          // زرار عرض القائمة الكاملة
          SizedBox(
            width: double.infinity,
            child: OutlinedButton(
              onPressed: () {},
              style: OutlinedButton.styleFrom(
                side: const BorderSide(color: Colors.white),
                foregroundColor: Colors.white,
              ),
              child: const Text("عرض القائمة الكاملة"),
            ),
          )
        ],
      ),
    );
  }
}
