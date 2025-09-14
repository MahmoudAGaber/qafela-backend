import 'package:flutter/material.dart';

class UserStats extends StatelessWidget {
  final String username;
  final int points;
  final int worldRank;
  final int localRank;
  final double balance;
  final bool showBalance;
  final VoidCallback toggleBalance;
  final String? avatar;

  const UserStats({
    Key? key,
    required this.username,
    required this.points,
    required this.worldRank,
    required this.localRank,
    required this.balance,
    required this.showBalance,
    required this.toggleBalance,
    this.avatar,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF3F51B5), Color(0xFF5C6BC0)],
        ),
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.15),
            blurRadius: 8,
            offset: const Offset(0, 4),
          ),
        ],
        border: Border.all(color: Colors.white.withOpacity(0.3)),
      ),
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          /// صورة + بيانات المستخدم
          Row(
            children: [
              Stack(
                clipBehavior: Clip.none,
                children: [
                  Container(
                    width: 64,
                    height: 64,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      gradient: const LinearGradient(
                        colors: [Color(0xFF2196F3), Color(0xFF42A5F5)],
                      ),
                    ),
                    child: avatar != null
                        ? ClipOval(
                      child: Image.network(
                        avatar!,
                        width: 56,
                        height: 56,
                        fit: BoxFit.cover,
                      ),
                    )
                        : Center(
                      child: Container(
                        width: 56,
                        height: 56,
                        decoration: const BoxDecoration(
                          shape: BoxShape.circle,
                          color: Colors.grey,
                        ),
                        child: Center(
                          child: Text(
                            username[0].toUpperCase(),
                            style: const TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                              color: Colors.white,
                            ),
                          ),
                        ),
                      ),
                    ),
                  ),

                  /// أيقونة التاج
                  Positioned(
                    bottom: -4,
                    right: -4,
                    child: Container(
                      width: 24,
                      height: 24,
                      decoration: const BoxDecoration(
                        shape: BoxShape.circle,
                        color: Colors.amber,
                      ),
                      child: const Icon(
                        Icons.emoji_events,
                        size: 14,
                        color: Colors.white,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(width: 12),

              /// اسم المستخدم + النقاط + الرصيد
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      username,
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 18,
                        color: Colors.white,
                      ),
                    ),

                    // النقاط
                    InkWell(
                      onTap: () {
                        // هنا ممكن تفتح صفحة history
                      },
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(Icons.star, color: Colors.amber, size: 16),
                          const SizedBox(width: 4),
                          Text(
                            points.toString(),
                            style: const TextStyle(
                              fontWeight: FontWeight.bold,
                              color: Colors.amber,
                            ),
                          ),
                          const SizedBox(width: 4),
                          const Text(
                            "نقطة",
                            style: TextStyle(
                              fontSize: 12,
                              color: Colors.white70,
                            ),
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 6),

                    // الرصيد + زر الإظهار/الإخفاء
                    Row(
                      children: [
                        Icon(
                          Icons.account_balance_wallet,
                          color: Colors.greenAccent.shade100,
                          size: 18,
                        ),
                        const SizedBox(width: 6),
                        Text(
                          showBalance ? "${balance.toStringAsFixed(2)} \$" : "****",
                          style: const TextStyle(
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
                          ),
                        ),
                        IconButton(
                          icon: Icon(
                            showBalance ? Icons.visibility_off : Icons.visibility,
                            color: Colors.white70,
                            size: 18,
                          ),
                          onPressed: toggleBalance,
                        )
                      ],
                    )
                  ],
                ),
              ),
            ],
          ),

          const SizedBox(height: 16),

          /// ترتيب المستخدم المحلي
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.blue.withOpacity(0.15),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Colors.blue.withOpacity(0.3)),
            ),
            child: Column(
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: const [
                    Icon(Icons.emoji_events, size: 16, color: Colors.blue),
                    SizedBox(width: 4),
                    Text(
                      "ترتيبك الآن",
                      style: TextStyle(
                        fontSize: 12,
                        color: Colors.blue,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      "#$localRank",
                      style: const TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: Colors.blue,
                      ),
                    ),
                    const SizedBox(width: 4),
                    const Icon(Icons.trending_up, size: 14, color: Colors.blue),
                  ],
                ),
              ],
            ),
          )
        ],
      ),
    );
  }
}
