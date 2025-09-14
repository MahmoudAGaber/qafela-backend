import 'package:flutter/material.dart';
import 'dart:async';

class DropScreen extends StatefulWidget {
  const DropScreen({super.key});

  @override
  State<DropScreen> createState() => _DropScreenState();
}

class _DropScreenState extends State<DropScreen> {
  int userPoints = 2550;
  late DateTime targetTime;
  late Timer _timer;
  Duration remaining = Duration.zero;

  final dropData = {
    "name": "القافلة الذهبية",
    "isActive": true,
    "timeLeft": DateTime.now().add(const Duration(hours: 2)),
    "totalParticipants": 234,
    "items": [
      {
        "id": "1",
        "name": "أموال",
        "dinarPrice": 50,
        "pointsValue": 100,
        "stock": 12,
        "maxStock": 50,
        "icon": "💰",
        "description": "مكافأة نقدية فورية",
        "rarity": "common",
        "type": "points"
      },
      {
        "id": "2",
        "name": "ذهب",
        "dinarPrice": 300,
        "pointsValue": 500,
        "stock": 2,
        "maxStock": 10,
        "icon": "🥇",
        "description": "ذهب خالص 24 قيراط",
        "rarity": "rare",
        "type": "points"
      },
      {
        "id": "3",
        "name": "سيف ذهبي",
        "dinarPrice": 500,
        "stock": 1,
        "maxStock": 1,
        "icon": "⚔️",
        "description": "سيف نادر للمحاربين",
        "rarity": "legendary",
        "type": "barter",
        "isRare": true
      }
    ]
  };

  @override
  void initState() {
    super.initState();
    targetTime = dropData["timeLeft"] as DateTime;
    _timer = Timer.periodic(const Duration(seconds: 1), (_) {
      setState(() {
        remaining = targetTime.difference(DateTime.now());
      });
    });
  }

  @override
  void dispose() {
    _timer.cancel();
    super.dispose();
  }

  String formatDuration(Duration d) {
    String twoDigits(int n) => n.toString().padLeft(2, "0");
    final h = twoDigits(d.inHours);
    final m = twoDigits(d.inMinutes.remainder(60));
    final s = twoDigits(d.inSeconds.remainder(60));
    return "$h:$m:$s";
  }

  Color rarityColor(String rarity) {
    switch (rarity) {
      case "common":
        return Colors.grey;
      case "rare":
        return Colors.orange;
      case "legendary":
        return Colors.purple;
      default:
        return Colors.blueGrey;
    }
  }

  void handlePurchase(Map<String, dynamic> item) {
    if (userPoints < item["dinarPrice"]) {
      _showMsg("رصيدك غير كافي لشراء ${item["name"]}!");
      return;
    }
    if (item["stock"] <= 0) {
      _showMsg("العنصر غير متوفر حالياً!");
      return;
    }
    setState(() {
      userPoints -= item["dinarPrice"] as int;
      item["stock"] = (item["stock"] as int) - 1;
    });
    _showMsg("تم شراء ${item["name"]} بنجاح ✅");
  }

  void _showMsg(String msg) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg)));
  }

  @override
  Widget build(BuildContext context) {
    if (!(dropData["isActive"] as bool)) {
      return Scaffold(
        body: Center(child: Text("لا توجد قافلة نشطة حالياً")),
      );
    }

    final items = List<Map<String, dynamic>>.from(dropData["items"] as List);

    return Scaffold(
      appBar: AppBar(
        title: Text(dropData["name"] as String),
        actions: [
          Row(
            children: [
              const Icon(Icons.group),
              const SizedBox(width: 4),
              Text("${dropData["totalParticipants"]}")
            ],
          ),
          const SizedBox(width: 12)
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            // countdown
            Card(
              child: ListTile(
                leading: const Icon(Icons.timer),
                title: const Text("الوقت المتبقي"),
                subtitle: Text(formatDuration(remaining)),
              ),
            ),
            const SizedBox(height: 12),

            // user points
            Card(
              child: ListTile(
                leading: const Icon(Icons.star, color: Colors.amber),
                title: const Text("نقاطك"),
                trailing: Text(
                  "$userPoints",
                  style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                ),
              ),
            ),
            const SizedBox(height: 20),

            // items
            Align(
              alignment: Alignment.centerRight,
              child: Text("السلع المتاحة", style: Theme.of(context).textTheme.titleMedium),
            ),
            const SizedBox(height: 12),
            ...items.map((item) {
              final stock = item["stock"] as int;
              final maxStock = item["maxStock"] as int;
              final progress = stock / maxStock;
              final canAfford = userPoints >= (item["dinarPrice"] as int);
              return Card(
                margin: const EdgeInsets.only(bottom: 12),
                child: Padding(
                  padding: const EdgeInsets.all(12),
                  child: Column(
                    children: [
                      Row(
                        children: [
                          Text(item["icon"], style: const TextStyle(fontSize: 30)),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(item["name"],
                                    style: TextStyle(
                                        fontWeight: FontWeight.bold,
                                        color: rarityColor(item["rarity"]))),
                                Text(item["description"]),
                              ],
                            ),
                          ),
                          Column(
                            children: [
                              Text("${item["dinarPrice"]} دينار",
                                  style: const TextStyle(fontWeight: FontWeight.bold)),
                              Text("المخزون: $stock/$maxStock"),
                            ],
                          )
                        ],
                      ),
                      const SizedBox(height: 10),
                      LinearProgressIndicator(value: progress),
                      const SizedBox(height: 10),
                      ElevatedButton(
                        onPressed: canAfford && stock > 0
                            ? () => handlePurchase(item)
                            : null,
                        child: Text("شراء بـ ${item["dinarPrice"]} دينار"),
                      )
                    ],
                  ),
                ),
              );
            }),
            const SizedBox(height: 20),

            // rules
            Card(
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: const [
                    Text("قواعد القافلة", style: TextStyle(fontWeight: FontWeight.bold)),
                    SizedBox(height: 6),
                    Text("• كل عنصر له كمية محدودة"),
                    Text("• الشراء يتم بترتيب الوصول"),
                    Text("• لا يمكن إلغاء أو استرداد المشتريات"),
                    Text("• تنتهي القافلة عند انتهاء الوقت"),
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
