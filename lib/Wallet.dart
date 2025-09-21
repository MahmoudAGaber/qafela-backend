import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:qafela/widgets/wallet_service.dart';
import 'theme/desert_theme.dart';

class WalletPage extends StatefulWidget {
  const WalletPage({super.key});

  @override
  State<WalletPage> createState() => _WalletPageState();
}

class _WalletPageState extends State<WalletPage> {
  bool showBalance = true;

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

  void _showMethodsDialog(List<Map<String, String>> methods, String title,
      {bool isWithdraw = false}) {
    final wallet = Provider.of<WalletService>(context, listen: false);
    TextEditingController amountCtrl = TextEditingController();

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
          children: [
            // خانة إدخال المبلغ لكل من السحب والإيداع
            TextField(
              controller: amountCtrl,
              keyboardType: TextInputType.number,
              decoration: InputDecoration(
                labelText: isWithdraw ? "المبلغ المطلوب" : "المبلغ للإيداع",
                border: const OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 12),
            ...methods.map((m) {
              return ListTile(
                leading: Text(m["icon"] ?? "", style: const TextStyle(fontSize: 22)),
                title: Text(m["name"] ?? "",
                    style: const TextStyle(color: DesertTheme.oliveBlack)),
                subtitle: Text("مدة المعالجة: ${m["processing"]}"),
                trailing: Text(m["fee"] ?? "",
                    style: const TextStyle(color: DesertTheme.palmGreen)),
                onTap: () {
                  final amount = double.tryParse(amountCtrl.text);
                  if (amount == null || amount <= 0) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text("الرجاء إدخال مبلغ صالح")),
                    );
                    return;
                  }

                  if (isWithdraw) {
                    final int withdrawAmount = amount.toInt();

                    if (withdrawAmount > wallet.balance) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text("رصيدك غير كافٍ لإتمام السحب")),
                      );
                      return; // يمنع تنفيذ أي شيء آخر
                    }

                    wallet.addWithdrawRequest(withdrawAmount, method: m["name"] ?? "");
                    Navigator.pop(context);
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                          content: Text(
                              "تم إنشاء طلب سحب $withdrawAmount دينار عبر ${m["name"]}")),
                    );
                  }
                  else {
                    wallet.credit(amount.toInt()); // تحديث الرصيد مباشرة
                    Navigator.pop(context);
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                          content: Text(
                              "تم إضافة ${amount.toStringAsFixed(2)} دينار عبر ${m["name"]}")),
                    );
                  }
                },
              );
            }).toList(),
          ],
        ),
      ),
    );
  }

  Icon _getTransactionIcon(String type) {
    switch (type) {
      case "purchase":
        return const Icon(Icons.north_east, color: Colors.red);
      case "reward":
        return const Icon(Icons.card_giftcard, color: Colors.green);
      case "withdraw_request":
        return const Icon(Icons.download, color: Colors.orange);
      default:
        return const Icon(Icons.swap_horiz, color: Colors.grey);
    }
  }

  Color _getTransactionColor(String type) {
    return type == "purchase"
        ? Colors.red
        : type == "withdraw_request"
        ? Colors.orange
        : Colors.green;
  }

  @override
  Widget build(BuildContext context) {
    final wallet = Provider.of<WalletService>(context);

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
          // Balance Card
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
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: const [
                      Icon(Icons.account_balance_wallet_rounded,
                          color: Colors.white70, size: 22),
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
                  Text(
                    showBalance ? "${wallet.balance.toStringAsFixed(2)} دينار" : "••••••",
                    style: const TextStyle(
                      fontSize: 34,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                      letterSpacing: 1.2,
                    ),
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
                        Text(showBalance ? "${wallet.totalEarned}" : "•••••",
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
                        Text("${wallet.transactions.length}",
                            style: const TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.bold,
                                color: DesertTheme.oliveBlack)),
                        const Text("عملية",
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
                  onPressed: () =>
                      _showMethodsDialog(withdrawalMethods, "طرق السحب", isWithdraw: true),
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

          wallet.transactions.isEmpty
              ? Center(
            child: Padding(
              padding: const EdgeInsets.all(20.0),
              child: Text("لا توجد معاملات حتى الآن 🏜️",
                  style: TextStyle(
                      color: DesertTheme.palmGreen, fontSize: 16)),
            ),
          )
              : Column(
            children: wallet.transactions.map((t) {
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
                        title: Text(t["item"] ?? "",
                            style: const TextStyle(
                                color: DesertTheme.oliveBlack)),
                        subtitle: Text(t["date"] ?? "",
                            style: const TextStyle(
                                color: DesertTheme.palmGreen)),
                        trailing: Text(
                          "${t["amount"]} دينار",
                          style: TextStyle(
                            fontWeight: FontWeight.bold,
                            color:
                            _getTransactionColor(t["type"] as String),
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
