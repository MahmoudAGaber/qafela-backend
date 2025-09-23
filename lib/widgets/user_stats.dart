import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:qafela/widgets/wallet_service.dart';


class UserStats extends StatefulWidget {
  final String username;
  final int points;
  final int localRank;
  final String? avatar;

  const UserStats({
    Key? key,
    required this.username,
    required this.points,
    required this.localRank,
    this.avatar,
  }) : super(key: key);

  @override
  State<UserStats> createState() => _UserStatsState();
}

class _UserStatsState extends State<UserStats> {
  bool _showBalance = false;

  void _toggleBalance() {
    setState(() {
      _showBalance = !_showBalance;
    });
  }

  @override
  Widget build(BuildContext context) {
    final wallet = Provider.of<WalletService>(context); // ربط الرصيد بالمحفظة

    return Container(
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFFFFFAF3), Color(0xFFFFF1DC)],
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
                  border: Border.all(color: Colors.orange.shade200, width: 2),
                  gradient: const LinearGradient(
                    colors: [Color(0xFFFFE0B2), Color(0xFFFFCC80)],
                  ),
                ),
                child: widget.avatar != null
                    ? ClipOval(
                  child: Image.network(
                    widget.avatar!,
                    width: 56,
                    height: 56,
                    fit: BoxFit.cover,
                  ),
                )
                    : Center(
                  child: Text(
                    widget.username[0].toUpperCase(),
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
                      widget.username,
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 18,
                        color: Color(0xFF5D4037),
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
                          "${widget.points} نقطة",
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
                            color: Color(0xFF81C784), size: 18),
                        const SizedBox(width: 6),
                        Text(
                          _showBalance
                              ? "${wallet.balance.toStringAsFixed(2)} ر.ص"
                              : "****",
                          style: const TextStyle(
                            fontWeight: FontWeight.w600,
                            color: Color(0xFF6D4C41),
                          ),
                        ),
                        IconButton(
                          icon: Icon(
                            _showBalance
                                ? Icons.visibility_off
                                : Icons.visibility,
                            color: Colors.grey.shade500,
                            size: 18,
                          ),
                          onPressed: _toggleBalance,
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
                    Icon(Icons.emoji_events, size: 20, color: Color(0xFFFFA000)),
                    SizedBox(width: 6),
                    Text(
                      "ترتيبك الآن",
                      style: TextStyle(
                        fontSize: 14,
                        color: Color(0xFF8D6E63),
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                Text(
                  "#${widget.localRank}",
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
