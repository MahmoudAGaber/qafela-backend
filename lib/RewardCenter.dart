import 'package:flutter/material.dart';

class RewardCenterScreen extends StatelessWidget {
  RewardCenterScreen({super.key});

  final List<Map<String, dynamic>> rewards = [
    {
      "id": 1,
      "title": "جائزة المركز الثالث",
      "amount": 500,
      "status": "claimed",
      "date": "2024-01-14",
      "description": "ترتيب أسبوعي - الأسبوع الثاني من يناير"
    },
    {
      "id": 2,
      "title": "جائزة أسبوعية",
      "amount": 1000,
      "status": "pending",
      "date": "2024-01-21",
      "description": "فوز في القافلة الذهبية"
    },
    {
      "id": 3,
      "title": "مكافأة النشاط",
      "amount": 250,
      "status": "available",
      "date": "2024-01-20",
      "description": "إكمال 10 قوافل بنجاح"
    }
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
          label: const Text("في الانتظار"),
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

  @override
  Widget build(BuildContext context) {
    final int totalPending = rewards
        .where((r) => r["status"] == "pending" || r["status"] == "available")
        .fold(0, (sum, r) => sum + r["amount"] as int);

    return Scaffold(
      appBar: AppBar(
        title: const Text("مركز الجوائز"),
        centerTitle: true,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Summary Card
            Card(
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16)),
              elevation: 4,
              color: Colors.amber.shade100,
              child: Padding(
                padding: const EdgeInsets.all(20),
                child: Column(
                  children: [
                    const Icon(Icons.emoji_events,
                        size: 40, color: Colors.orange),
                    const SizedBox(height: 8),
                    Text(
                      "$totalPending دينار",
                      style: const TextStyle(
                          fontSize: 24, fontWeight: FontWeight.bold),
                    ),
                    const Text("جوائز في الانتظار"),
                    if (totalPending > 0) ...[
                      const SizedBox(height: 12),
                      OutlinedButton.icon(
                        onPressed: () {},
                        icon: const Icon(Icons.download),
                        label: const Text("استلام الكل"),
                      )
                    ]
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),

            // Rewards List
            const Text("جوائز هذا الأسبوع",
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 12),
            Column(
              children: rewards.map((reward) {
                return Card(
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16)),
                  margin: const EdgeInsets.only(bottom: 12),
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      children: [
                        Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            CircleAvatar(
                              radius: 28,
                              backgroundColor: Colors.blue.shade100,
                              child: getStatusIcon(reward["status"]),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(reward["title"],
                                      style: const TextStyle(
                                          fontWeight: FontWeight.bold)),
                                  Text(reward["description"]),
                                  Text(
                                    reward["date"],
                                    style: TextStyle(
                                        color: Colors.grey.shade600,
                                        fontSize: 12),
                                  ),
                                ],
                              ),
                            ),
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.end,
                              children: [
                                Text("${reward["amount"]} دينار",
                                    style: const TextStyle(
                                        fontSize: 16,
                                        fontWeight: FontWeight.bold)),
                                getStatusBadge(reward["status"]),
                              ],
                            ),
                          ],
                        ),
                        if (reward["status"] == "available") ...[
                          const SizedBox(height: 12),
                          ElevatedButton.icon(
                            onPressed: () {},
                            icon: const Icon(Icons.download),
                            label: const Text("استلام الجائزة"),
                          )
                        ]
                      ],
                    ),
                  ),
                );
              }).toList(),
            ),

            const SizedBox(height: 24),

            // Previous Winners
            const Text("الفائزون السابقون",
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 12),
            Card(
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16)),
              child: Column(
                children: [
                  ListTile(
                    leading: const CircleAvatar(
                      backgroundColor: Colors.orangeAccent,
                      child: Icon(Icons.emoji_events, color: Colors.white),
                    ),
                    title: const Text("أحمد الفائز"),
                    subtitle: const Text("الأسبوع الأول من يناير"),
                    trailing: Column(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: const [
                        Text("2000 دينار",
                            style: TextStyle(fontWeight: FontWeight.bold)),
                        Text("المركز الأول",
                            style: TextStyle(fontSize: 12, color: Colors.grey))
                      ],
                    ),
                  ),
                  ListTile(
                    leading: const CircleAvatar(
                      backgroundColor: Colors.blue,
                      child: Icon(Icons.emoji_events, color: Colors.white),
                    ),
                    title: const Text("فاطمة النجمة"),
                    subtitle: const Text("الأسبوع الماضي"),
                    trailing: Column(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: const [
                        Text("1500 دينار",
                            style: TextStyle(fontWeight: FontWeight.bold)),
                        Text("المركز الثاني",
                            style: TextStyle(fontSize: 12, color: Colors.grey))
                      ],
                    ),
                  ),
                  ListTile(
                    leading: const CircleAvatar(
                      backgroundColor: Colors.green,
                      child: Icon(Icons.star, color: Colors.white),
                    ),
                    title: const Text("عبدالله السريع"),
                    subtitle: const Text("أسبوعين مضت"),
                    trailing: Column(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: const [
                        Text("1000 دينار",
                            style: TextStyle(fontWeight: FontWeight.bold)),
                        Text("المركز الثالث",
                            style: TextStyle(fontSize: 12, color: Colors.grey))
                      ],
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 24),

            // Help Section
            Card(
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16)),
              color: Colors.blue.shade50,
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  children: [
                    const Text("❓", style: TextStyle(fontSize: 28)),
                    const SizedBox(height: 8),
                    const Text("تحتاج مساعدة؟",
                        style: TextStyle(fontWeight: FontWeight.bold)),
                    const Text("راجع تعليمات السحب أو تواصل مع الدعم"),
                    const SizedBox(height: 12),
                    OutlinedButton(
                      onPressed: () {},
                      child: const Text("مركز المساعدة"),
                    )
                  ],
                ),
              ),
            )
          ],
        ),
      ),
    );
  }
}
