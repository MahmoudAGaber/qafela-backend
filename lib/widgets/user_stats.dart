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
          colors: [Color(0xFFFFFAF3), Color(0xFFFFF1DC)], // بيج كريمي هادي
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.orange.withOpacity(0.15),
            blurRadius: 8,
            offset: const Offset(0, 4),
          ),
        ],
        border: Border.all(color: Colors.orange.shade100),
      ),
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          /// صورة + بيانات المستخدم
          Row(
            children: [
              // Avatar
              Container(
                width: 64,
                height: 64,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border:
                  Border.all(color: Colors.orange.shade200, width: 2),
                  gradient: const LinearGradient(
                    colors: [Color(0xFFFFE0B2), Color(0xFFFFCC80)], // برتقالي فاتح هادي
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
                  child: Text(
                    username[0].toUpperCase(),
                    style: const TextStyle(
                      fontSize: 22,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 12),

              /// اسم + النقاط + الرصيد
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      username,
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 18,
                        color: Color(0xFF5D4037), // بني ناعم
                      ),
                    ),

                    // النقاط
                    Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.star,
                            color: Color(0xFFFFC107), size: 18),
                        const SizedBox(width: 4),
                        Text(
                          "$points نقطة",
                          style: const TextStyle(
                            fontWeight: FontWeight.w600,
                            color: Color(0xFF6D4C41),
                          ),
                        ),
                      ],
                    ),

                    const SizedBox(height: 6),

                    // الرصيد + زر إظهار/إخفاء
                    Row(
                      children: [
                        const Icon(Icons.account_balance_wallet,
                            color: Color(0xFF81C784), size: 18), // أخضر باستيل
                        const SizedBox(width: 6),
                        Text(
                          showBalance
                              ? "${balance.toStringAsFixed(2)} ر.ص"
                              : "****",
                          style: const TextStyle(
                            fontWeight: FontWeight.w600,
                            color: Color(0xFF6D4C41),
                          ),
                        ),
                        IconButton(
                          icon: Icon(
                            showBalance
                                ? Icons.visibility_off
                                : Icons.visibility,
                            color: Colors.grey.shade500,
                            size: 18,
                          ),
                          onPressed: toggleBalance,
                        ),
                      ],
                    ),
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
              color: Colors.orange.shade50,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Colors.orange.shade100),
            ),
            child: Column(
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: const [
                    Icon(Icons.emoji_events,
                        size: 20, color: Color(0xFFFFA000)), // ذهبي فاتح
                    SizedBox(width: 6),
                    Text(
                      "ترتيبك الآن",
                      style: TextStyle(
                        fontSize: 14,
                        color: Color(0xFF8D6E63), // بني رملي
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                Text(
                  "#$localRank",
                  style: const TextStyle(
                    fontSize: 22,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF5D4037),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
