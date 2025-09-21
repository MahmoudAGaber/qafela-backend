// reward_center.dart
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:qafela/widgets/wallet_service.dart';



class RewardCenterScreen extends StatefulWidget {
  const RewardCenterScreen({super.key});

  @override
  State<RewardCenterScreen> createState() => _RewardCenterScreenState();
}

class _RewardCenterScreenState extends State<RewardCenterScreen> {
  List<Map<String, dynamic>> rewards = [
    {
      "id": 1,
      "title": "جائزة المركز الأول",
      "amount": 1000,
      "status": "claimed",
      "date": "2024-09-14",
      "description": "الفوز بالمركز الأول في الأسبوع الماضي"
    },
    {
      "id": 2,
      "title": "جائزة المركز الثاني",
      "amount": 500,
      "status": "pending",
      "date": "2024-09-21",
      "description": "جاري مراجعة الجائزة قبل التحويل"
    },
    {
      "id": 3,
      "title": "جائزة النشاط",
      "amount": 200,
      "status": "available",
      "date": "2024-09-21",
      "description": "لإكمال 10 قوافل ناجحة"
    },
  ];

  Widget getStatusIcon(String status) {
    switch (status) {
      case "claimed":
        return const Icon(Icons.check_circle, color: Colors.green, size: 28);
      case "pending":
        return const Icon(Icons.access_time, color: Colors.orange, size: 28);
      case "available":
        return const Icon(Icons.card_giftcard, color: Colors.blue, size: 28);
      default:
        return const Icon(Icons.help, color: Colors.grey);
    }
  }

  Widget getStatusBadge(String status) {
    switch (status) {
      case "claimed":
        return Chip(
          label: const Text("تم الاستلام"),
          backgroundColor: Colors.green.shade100,
          labelStyle: const TextStyle(color: Colors.green),
        );
      case "pending":
        return Chip(
          label: const Text("قيد المراجعة"),
          backgroundColor: Colors.orange.shade100,
          labelStyle: const TextStyle(color: Colors.orange),
        );
      case "available":
        return Chip(
          label: const Text("متاح"),
          backgroundColor: Colors.blue.shade100,
          labelStyle: const TextStyle(color: Colors.blue),
        );
      default:
        return const SizedBox.shrink();
    }
  }

  int get totalAvailable => rewards
      .where((r) => r["status"] == "available")
      .fold(0, (s, r) => s + (r["amount"] as int));

  // --- عندما يتم استلام جائزة واحدة:
  void claimReward(int rewardId) {
    final idx = rewards.indexWhere((r) => r["id"] == rewardId);
    if (idx == -1) return;

    if (rewards[idx]["status"] != "available") {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("هذه الجائزة غير متاحة للاستلام")),
      );
      return;
    }

    // اضافة للمحفظة عبر WalletService
    final wallet = Provider.of<WalletService>(context, listen: false);
    final int amount = rewards[idx]["amount"] as int;
    wallet.credit(amount, source: 'reward_${rewards[idx]["id"]}');

    setState(() {
      rewards[idx]["status"] = "claimed";
    });

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text("${rewards[idx]["title"]} تم استلامها ($amount درهم)")),
    );
  }

  // --- استلام جميع المتاحة
  void claimAllAvailable() {
    final wallet = Provider.of<WalletService>(context, listen: false);
    final available = rewards.where((r) => r["status"] == "available").toList();
    if (available.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text("لا توجد جوائز متاحة للاستلام")));
      return;
    }

    int total = 0;
    setState(() {
      for (var r in available) {
        total += (r["amount"] as int);
        r["status"] = "claimed";
        wallet.credit(r["amount"] as int, source: 'reward_${r["id"]}');
      }
    });

    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text("تم استلام جميع الجوائز: $total درهم")));
  }

  @override
  Widget build(BuildContext context) {
    final totalPending = rewards.where((r) => r["status"] == "pending").fold(0, (s, r) => s + (r["amount"] as int));
    final totalClaimed = rewards.where((r) => r["status"] == "claimed").fold(0, (s, r) => s + (r["amount"] as int));

    return Scaffold(
      appBar: AppBar(title: const Text("مركز الجوائز"), centerTitle: true),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Summary
            Card(
              color: Colors.amber.shade100,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(children: [
                  const Icon(Icons.account_balance_wallet, size: 36, color: Colors.orange),
                  const SizedBox(height: 8),
                  Text("$totalAvailable درهم", style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
                  const Text("رصيد الجوائز المتاحة"),
                  const SizedBox(height: 8),
                  Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                    Text("قيد المراجعة: $totalPending درهم", style: const TextStyle(color: Colors.orange)),
                    const SizedBox(width: 12),
                    Text("مستلمة: $totalClaimed درهم", style: const TextStyle(color: Colors.green)),
                  ]),
                  const SizedBox(height: 12),
                  ElevatedButton.icon(
                    onPressed: totalAvailable > 0 ? claimAllAvailable : null,
                    icon: const Icon(Icons.download),
                    label: const Text("استلام الكل"),
                  ),
                ]),
              ),
            ),

            const SizedBox(height: 18),
            const Text("جوائزك", style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 12),

            // Rewards list
            Column(
              children: rewards.map((reward) {
                return Card(
                  margin: const EdgeInsets.only(bottom: 12),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  child: Padding(
                    padding: const EdgeInsets.all(12),
                    child: Column(children: [
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          CircleAvatar(radius: 26, backgroundColor: Colors.blue.shade50, child: getStatusIcon(reward["status"] as String)),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                              Text(reward["title"] as String, style: const TextStyle(fontWeight: FontWeight.bold)),
                              const SizedBox(height: 4),
                              Text(reward["description"] as String),
                              const SizedBox(height: 6),
                              Text(reward["date"] as String, style: TextStyle(color: Colors.grey.shade600, fontSize: 12)),
                            ]),
                          ),
                          Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
                            Text("${reward["amount"]} درهم", style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                            const SizedBox(height: 8),
                            getStatusBadge(reward["status"] as String),
                          ]),
                        ],
                      ),

                      if (reward["status"] == "available") ...[
                        const SizedBox(height: 12),
                        SizedBox(
                          width: double.infinity,
                          child: ElevatedButton.icon(
                            onPressed: () => claimReward(reward["id"] as int),
                            icon: const Icon(Icons.download),
                            label: const Text("استلام الجائزة"),
                          ),
                        ),
                      ],
                    ]),
                  ),
                );
              }).toList(),
            ),
          ],
        ),
      ),
    );
  }
}
