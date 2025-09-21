import 'package:flutter/material.dart';
import 'theme/desert_theme.dart';

class WalletPage extends StatefulWidget {
  const WalletPage({super.key});

  @override
  State<WalletPage> createState() => _WalletPageState();
}

class _WalletPageState extends State<WalletPage> {
  bool showBalance = true;

  final walletData = {
    "balance": 2850.50,
    "currency": "دينار",
    "pendingRewards": 150.00,
    "totalEarned": 15420.75
  };

  final transactions = [
    {"type": "purchase", "amount": -100, "item": "أموال - قافلة الخميس", "date": "2024-01-15", "time": "14:30"},
    {"type": "reward", "amount": 500, "item": "جائزة المركز الثالث", "date": "2024-01-14", "time": "20:15"},
    {"type": "purchase", "amount": -200, "item": "زيت - قافلة الأربعاء", "date": "2024-01-13", "time": "16:45"},
    {"type": "reward", "amount": 1000, "item": "جائزة أسبوعية", "date": "2024-01-12", "time": "12:00"},
    {"type": "purchase", "amount": -150, "item": "ذهب - قافلة الثلاثاء", "date": "2024-01-11", "time": "18:20"},
  ];

  final withdrawalMethods = [
    {"name": "التحويل البنكي", "icon": "🏦", "processing": "1-3 أيام عمل", "fee": "مجاني"},
    {"name": "STC Pay", "icon": "📱", "processing": "فوري", "fee": "5 دينار"},
    {"name": "Apple Pay", "icon": "🍎", "processing": "فوري", "fee": "3 دينار"},
  ];

  final depositMethods = [
    {"name": "التحويل البنكي", "icon": "🏦", "processing": "1-3 أيام عمل", "fee": "مجاني"},
    {"name": "فيزا كارد", "icon": "💳", "processing": "فوري", "fee": "2.5%"},
    {"name": "ماستركارد", "icon": "💳", "processing": "فوري", "fee": "2.5%"},
    {"name": "STC Pay", "icon": "📱", "processing": "فوري", "fee": "مجاني"},
  ];

  void _showMethodsDialog(List<Map<String, String>> methods, String title) {
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        backgroundColor: DesertTheme.desertSand,
        title: Center(
          child: Text(title,
              style: const TextStyle(
                  fontWeight: FontWeight.bold, color: DesertTheme.dateBrown)),
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: methods.map((m) {
            return ListTile(
              leading: Text(m["icon"] ?? "", style: const TextStyle(fontSize: 22)),
              title: Text(m["name"] ?? "",
                  style: const TextStyle(color: DesertTheme.oliveBlack)),
              subtitle: Text("مدة المعالجة: ${m["processing"]}"),
              trailing: Text(m["fee"] ?? "",
                  style: const TextStyle(color: DesertTheme.palmGreen)),
            );
          }).toList(),
        ),
      ),
    );
  }

  Icon _getTransactionIcon(String type) {
    return type == "purchase"
        ? const Icon(Icons.north_east, color: Colors.red)
        : const Icon(Icons.south_west, color: Colors.green);
  }

  Color _getTransactionColor(String type) {
    return type == "purchase" ? Colors.red : Colors.green;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: DesertTheme.desertSand,
      appBar: AppBar(
        title: const Text("المحفظة"),
        leading: IconButton(
          icon: Icon(showBalance ? Icons.visibility_off : Icons.visibility),
          onPressed: () {
            setState(() {
              showBalance = !showBalance;
            });
          },
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Balance Card with Gradient
          Container(
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [DesertTheme.sandGold, DesertTheme.dateBrown],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(20),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.25),
                  blurRadius: 12,
                  offset: const Offset(0, 6),
                ),
              ],
            ),
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  // عنوان مع الأيقونة
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: const [
                      Icon(Icons.account_balance_wallet_rounded, color: Colors.white70, size: 22),
                      SizedBox(width: 8),
                      Text(
                        "الرصيد المتاح",
                        style: TextStyle(
                          fontSize: 16,
                          color: Colors.white70,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),

                  // الرصيد
                  Text(
                    showBalance
                        ? "${walletData["balance"]} ${walletData["currency"]}"
                        : "••••••",
                    style: const TextStyle(
                      fontSize: 34,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                      letterSpacing: 1.2,
                    ),
                  ),

                  // الرصيد المعلّق (إن وجد)
                  if ((walletData["pendingRewards"] as double) > 0)
                    Padding(
                      padding: const EdgeInsets.only(top: 12.0),
                      /*child: Text(
                        "${walletData["pendingRewards"]} دينار في الانتظار",
                        style: const TextStyle(
                          color: Colors.white70,
                          fontSize: 14,
                          fontStyle: FontStyle.italic,
                        ),
                      ),*/
                    ),
                ],
              ),
            ),
          ),

          const SizedBox(height: 20),

          // Stats
          Row(
            children: [
              Expanded(
                child: Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      children: [
                        const Icon(Icons.trending_up,
                            color: DesertTheme.palmGreen, size: 40),
                        const SizedBox(height: 8),
                        Text(showBalance ? "${walletData["totalEarned"]}" : "•••••",
                            style: const TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.bold,
                                color: DesertTheme.oliveBlack)),
                        const Text("إجمالي الأرباح",
                            style: TextStyle(color: DesertTheme.palmGreen)),
                      ],
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      children: [
                        const Icon(Icons.receipt_long,
                            color: DesertTheme.dateBrown, size: 40),
                        const SizedBox(height: 8),
                        Text("${transactions.length}",
                            style: const TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.bold,
                                color: DesertTheme.oliveBlack)),
                        const Text("عملية هذا الشهر",
                            style: TextStyle(color: DesertTheme.palmGreen)),
                      ],
                    ),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),

          // Action Buttons
          Row(
            children: [
              Expanded(
                child: ElevatedButton.icon(
                  onPressed: () => _showMethodsDialog(withdrawalMethods, "طرق السحب"),
                  icon: const Icon(Icons.download),
                  label: const Text("سحب الأموال"),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: DesertTheme.dateBrown,
                    padding: const EdgeInsets.all(16),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: () => _showMethodsDialog(depositMethods, "طرق الإيداع"),
                  icon: const Icon(Icons.upload),
                  label: const Text("إيداع الأموال"),
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.all(16),
                    side: const BorderSide(color: DesertTheme.dateBrown),
                    foregroundColor: DesertTheme.dateBrown,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),

          // Transaction History
          const Text("📋 سجل المعاملات",
              style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: DesertTheme.oliveBlack)),
          const SizedBox(height: 12),

          transactions.isEmpty
              ? Center(
            child: Padding(
              padding: const EdgeInsets.all(20.0),
              child: Text("لا توجد معاملات حتى الآن 🏜️",
                  style: TextStyle(
                      color: DesertTheme.palmGreen, fontSize: 16)),
            ),
          )
              : Column(
            children: transactions.map((t) {
              return Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Column(
                    children: [
                      CircleAvatar(
                        backgroundColor: t["type"] == "purchase"
                            ? Colors.red[100]
                            : Colors.green[100],
                        child: _getTransactionIcon(t["type"] as String),
                      ),
                      Container(
                        width: 2,
                        height: 40,
                        color: Colors.grey.shade300,
                      ),
                    ],
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Card(
                      child: ListTile(
                        title: Text(t["item"] as String,
                            style: const TextStyle(
                                color: DesertTheme.oliveBlack)),
                        subtitle: Text("${t["date"]} • ${t["time"]}",
                            style: const TextStyle(
                                color: DesertTheme.palmGreen)),
                        trailing: Text(
                          "${t["amount"]} دينار",
                          style: TextStyle(
                            fontWeight: FontWeight.bold,
                            color: _getTransactionColor(t["type"] as String),
                          ),
                        ),
                      ),
                    ),
                  ),
                ],
              );
            }).toList(),
          ),
        ],
      ),
    );
  }
}
