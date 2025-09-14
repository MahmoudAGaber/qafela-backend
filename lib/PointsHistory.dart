import 'package:flutter/material.dart';

class PointsHistoryScreen extends StatelessWidget {
  const PointsHistoryScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final pointsData = {
      "totalPoints": 3520,
      "sourceFilter": "الكل",
      "dateFilter": "آخر 7 أيام"
    };

    final pointsHistory = [
      {
        "id": 1,
        "type": "caravan_purchase",
        "title": "شراء من القافلة",
        "item": "صندوق ذهب نادر",
        "date": "14 يوليو",
        "time": "3:01م",
        "caravan": "قافلة #12",
        "points": 100,
        "icon": "🟢"
      },
      {
        "id": 2,
        "type": "barter_success",
        "title": "مقايضة ناجحة",
        "item": "تم تسليم: 3 × سيف ذهبي",
        "receivedItem": "تم استلام: حجر كريم",
        "date": "13 يوليو",
        "time": "9:22م",
        "points": 300,
        "icon": "🟡"
      },
      {
        "id": 3,
        "type": "caravan_purchase",
        "title": "شراء من القافلة",
        "item": "برميل نفط خام",
        "date": "13 يوليو",
        "time": "8:50م",
        "caravan": "قافلة #11",
        "points": 60,
        "icon": "🟢"
      },
      {
        "id": 4,
        "type": "caravan_purchase",
        "title": "شراء من القافلة",
        "item": "أحجار كريمة زرقاء",
        "date": "12 يوليو",
        "time": "2:15م",
        "caravan": "قافلة #10",
        "points": 150,
        "icon": "🟢"
      },
      {
        "id": 5,
        "type": "barter_success",
        "title": "مقايضة ناجحة",
        "item": "تم تسليم: 5 × برميل نفط",
        "receivedItem": "تم استلام: سيف ذهبي",
        "date": "11 يوليو",
        "time": "6:45م",
        "points": 200,
        "icon": "🟡"
      },
      {
        "id": 6,
        "type": "caravan_purchase",
        "title": "شراء من القافلة",
        "item": "خشب نادر",
        "date": "11 يوليو",
        "time": "4:30م",
        "caravan": "قافلة #9",
        "points": 80,
        "icon": "🟢"
      },
    ];

    return Scaffold(
      backgroundColor: Colors.grey.shade100,
      appBar: AppBar(
        title: const Text("📒 سجل النقاط"),
        backgroundColor: Colors.deepPurple,
        centerTitle: true,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            // Total points & filters
            Card(
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
              ),
              elevation: 4,
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.star, color: Colors.amber),
                        const SizedBox(width: 8),
                        Text(
                          "إجمالي النقاط: ${pointsData["totalPoints"]}",
                          style: const TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(width: 8),
                        const Text("🏅"),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Expanded(
                          child: OutlinedButton(
                            onPressed: () {},
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                const Text("🔽 المصدر:"),
                                Text("${pointsData["sourceFilter"]}"),
                              ],
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: OutlinedButton(
                            onPressed: () {},
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                const Text("📅 التاريخ:"),
                                Text("${pointsData["dateFilter"]}"),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 20),

            // Points History list
            Column(
              children: pointsHistory.map((entry) {
                return Container(
                  margin: const EdgeInsets.only(bottom: 12),
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    border: Border(
                      right: BorderSide(color: Colors.deepPurple.shade200, width: 4),
                    ),
                    boxShadow: const [
                      BoxShadow(
                        color: Colors.black12,
                        blurRadius: 4,
                        offset: Offset(0, 2),
                      ),
                    ],
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Header
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Row(
                            children: [
                              Text(entry["icon"].toString(), style: const TextStyle(fontSize: 18)),
                              const SizedBox(width: 8),
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    "[${entry["title"]}]",
                                    style: const TextStyle(fontWeight: FontWeight.bold),
                                  ),
                                  Text(
                                    "${entry["date"]} - ${entry["time"]}",
                                    style: TextStyle(color: Colors.grey.shade600, fontSize: 12),
                                  ),
                                ],
                              ),
                            ],
                          ),
                          Row(
                            children: [
                              const Icon(Icons.star, size: 16, color: Colors.deepPurple),
                              const SizedBox(width: 4),
                              Text("+${entry["points"]} نقطة",
                                  style: const TextStyle(
                                      color: Colors.deepPurple,
                                      fontWeight: FontWeight.bold)),
                            ],
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),

                      // Details
                      if (entry["type"] == "caravan_purchase") ...[
                        Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: Colors.grey.shade200,
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Row(
                            children: [
                              const Text("📦"),
                              const SizedBox(width: 8),
                              Text("العنصر: ${entry["item"]}"),
                            ],
                          ),
                        ),
                        const SizedBox(height: 6),
                        Row(
                          children: [
                            const Text("🚛"),
                            const SizedBox(width: 6),
                            Text("${entry["caravan"]}"),
                          ],
                        ),
                      ] else ...[
                        Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: Colors.grey.shade200,
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(entry["item"].toString()),
                              if (entry["receivedItem"] != null)
                                Text(entry["receivedItem"].toString(),
                                    style: const TextStyle(color: Colors.green)),
                            ],
                          ),
                        ),
                      ]
                    ],
                  ),
                );
              }).toList(),
            ),

            const SizedBox(height: 20),
            OutlinedButton(
              onPressed: () {},
              child: const Text("تحميل المزيد من السجل"),
            ),
          ],
        ),
      ),
    );
  }
}
