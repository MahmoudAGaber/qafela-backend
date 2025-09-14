import 'package:flutter/material.dart';

class DropHistoryScreen extends StatelessWidget {
  final List<Map<String, dynamic>> dropHistory = [
    {
      "id": 1,
      "name": "القافلة الذهبية",
      "date": "2024-01-15",
      "time": "15:00",
      "status": "completed",
      "items": [
        {"name": "أموال", "price": 100, "participants": 45, "stock": 50},
        {"name": "زيت", "price": 200, "participants": 23, "stock": 25},
        {"name": "ذهب", "price": 500, "participants": 12, "stock": 15},
      ],
      "totalParticipants": 80,
      "userParticipated": true,
      "userPurchases": ["أموال", "زيت"]
    },
    {
      "id": 2,
      "name": "قافلة السرعة",
      "date": "2024-01-12",
      "time": "20:00",
      "status": "completed",
      "items": [
        {"name": "جواهر", "price": 300, "participants": 35, "stock": 40},
        {"name": "أموال", "price": 150, "participants": 28, "stock": 30},
      ],
      "totalParticipants": 63,
      "userParticipated": false,
      "userPurchases": []
    },
    {
      "id": 3,
      "name": "قافلة المحاربين",
      "date": "2024-01-08",
      "time": "18:30",
      "status": "completed",
      "items": [
        {"name": "سيوف", "price": 400, "participants": 20, "stock": 20},
        {"name": "دروع", "price": 350, "participants": 15, "stock": 20},
        {"name": "أموال", "price": 100, "participants": 40, "stock": 50},
      ],
      "totalParticipants": 75,
      "userParticipated": true,
      "userPurchases": ["أموال"]
    }
  ];

  String getItemIcon(String name) {
    final icons = {
      "أموال": "💰",
      "زيت": "🛢️",
      "ذهب": "🥇",
      "جواهر": "💎",
      "سيوف": "⚔️",
      "دروع": "🛡️",
    };
    return icons[name] ?? "📦";
  }

  Widget getStatusBadge(String status) {
    switch (status) {
      case "completed":
        return _badge("مكتملة", Colors.green);
      case "active":
        return _badge("نشطة", Colors.orange);
      case "upcoming":
        return _badge("قادمة", Colors.grey);
      default:
        return SizedBox.shrink();
    }
  }

  static Widget _badge(String text, Color color) {
    return Container(
      padding: EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      decoration: BoxDecoration(
        color: color.withOpacity(0.2),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(text, style: TextStyle(fontSize: 12, color: color, fontWeight: FontWeight.bold)),
    );
  }

  @override
  Widget build(BuildContext context) {
    final userParticipations =
        dropHistory.where((d) => d["userParticipated"] == true).length;
    final totalPurchases = dropHistory.fold<int>(
        0, (sum, d) => sum + (d["userPurchases"] as List).length);

    return Scaffold(
      appBar: AppBar(
        title: Text("📜 سجل القوافل"),
        backgroundColor: Colors.brown[300],
      ),
      body: ListView(
        padding: EdgeInsets.all(16),
        children: [
          // Stats
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              _statCard("قافلة إجمالية", dropHistory.length.toString(), Icons.local_shipping),
              _statCard("مشاركة", userParticipations.toString(), Icons.people, color: Colors.green),
              _statCard("عملية شراء", totalPurchases.toString(), Icons.shopping_bag, color: Colors.amber),
            ],
          ),
          SizedBox(height: 16),
          // Drop list
          ...dropHistory.map((drop) {
            final userPurchases = List<String>.from(drop["userPurchases"] ?? []);
            return Card(
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              margin: EdgeInsets.only(bottom: 12),
              child: Padding(
                padding: EdgeInsets.all(12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // الباقي زي ما هو ...

                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                          Text(drop["name"], style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                          SizedBox(height: 4),
                          Row(children: [
                            Icon(Icons.calendar_today, size: 14, color: Colors.grey),
                            SizedBox(width: 4),
                            Text("${drop["date"]} ${drop["time"]}", style: TextStyle(color: Colors.grey, fontSize: 12)),
                          ]),
                        ]),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: [
                            getStatusBadge(drop["status"]),
                            if (drop["userParticipated"])
                              _badge("شاركت", Colors.blue),
                          ],
                        )
                      ],
                    ),
                    SizedBox(height: 12),
                    // Purchases
                    if (userPurchases.isNotEmpty)
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text("مشترياتك:", style: TextStyle(fontWeight: FontWeight.w500)),
                          ...userPurchases.map((purchase) {
                            return Container(
                              margin: EdgeInsets.symmetric(vertical: 4),
                              padding: EdgeInsets.all(8),
                              decoration: BoxDecoration(
                                color: Colors.green.withOpacity(0.1),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Row(children: [
                                    Text(getItemIcon(purchase), style: TextStyle(fontSize: 18)),
                                    SizedBox(width: 8),
                                    Text(purchase, style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
                                  ]),
                                  Text("1x", style: TextStyle(color: Colors.grey[700])),
                                ],
                              ),
                            );
                          }).toList()
                        ],
                      )
                    else
                      Container(
                        padding: EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: Colors.grey[200],
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Center(child: Text("لم تشارك في هذه القافلة", style: TextStyle(color: Colors.grey))),
                      ),
                    Divider(),
                    // Stats
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text("${drop["totalParticipants"]} مشارك إجمالي", style: TextStyle(fontSize: 12, color: Colors.grey)),
                        if (userPurchases.isNotEmpty)
                          Text("اشتريت ${userPurchases.length} عنصر", style: TextStyle(fontSize: 12, color: Colors.green)),
                      ],
                    )
                  ],
                ),
              ),
            );
          }).toList(),
          SizedBox(height: 16),
          ElevatedButton(
            onPressed: () {},
            child: Text("تحميل المزيد من التاريخ"),
          )
        ],
      ),
    );
  }

  Widget _statCard(String title, String value, IconData icon, {Color color = Colors.blue}) {
    return Expanded(
      child: Container(
        margin: EdgeInsets.symmetric(horizontal: 4),
        padding: EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: color.withOpacity(0.1),
          borderRadius: BorderRadius.circular(16),
        ),
        child: Column(
          children: [
            Icon(icon, color: color),
            SizedBox(height: 8),
            Text(value, style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            Text(title, style: TextStyle(fontSize: 12, color: Colors.grey[700])),
          ],
        ),
      ),
    );
  }
}
