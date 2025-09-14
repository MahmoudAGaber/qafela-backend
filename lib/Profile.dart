import 'package:flutter/material.dart';

class ProfilePage extends StatelessWidget {
  final userProfile = {
    "username": "محمد جابر",
    "avatar": "🎮",
    "joinDate": "يناير 2024",
    "city": "الرياض",
    "totalPoints": 25500,
    "worldRank": 1438,
    "localRank": 86,
    "dropsParticipated": 23,
    "achievements": [
      {"name": "لاعب نشط", "icon": "⚡", "earned": true},
      {"name": "صياد الجوائز", "icon": "🏆", "earned": true},
      {"name": "متسابق سريع", "icon": "🚀", "earned": false},
      {"name": "بطل الأسبوع", "icon": "👑", "earned": false},
    ]
  };

  @override
  Widget build(BuildContext context) {
    return Directionality( // يدعم العربية
      textDirection: TextDirection.rtl,
      child: Scaffold(
        backgroundColor: Colors.grey[100],
        body: Column(
          children: [
            // ====== Header ======
            Container(
              padding: const EdgeInsets.all(16),
              width: double.infinity,
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [Colors.blue, Colors.indigo],
                ),
              ),
              child: Column(
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      TextButton(
                        onPressed: () => Navigator.pop(context),
                        child: const Text("← العودة",
                            style: TextStyle(color: Colors.white)),
                      ),
                      IconButton(
                        icon: const Icon(Icons.edit, color: Colors.white),
                        onPressed: () {},
                      )
                    ],
                  ),
                  Text(
                    userProfile["avatar"] as String,
                    style: const TextStyle(fontSize: 48),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    userProfile["username"] as String,
                    style: const TextStyle(
                        fontSize: 22,
                        fontWeight: FontWeight.bold,
                        color: Colors.white),
                  ),
                  const SizedBox(height: 6),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.location_on,
                          color: Colors.white70, size: 16),
                      Text("${userProfile["city"]} • ",
                          style: const TextStyle(color: Colors.white70)),
                      const Icon(Icons.calendar_today,
                          color: Colors.white70, size: 16),
                      Text("انضم في ${userProfile["joinDate"]}",
                          style: const TextStyle(color: Colors.white70)),
                    ],
                  ),
                  const SizedBox(height: 12),
                ],
              ),
            ),

            // ====== Content ======
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(16),
                child: Column(
                  children: [
                    // ====== Stats Grid ======
                    GridView(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      gridDelegate:
                      const SliverGridDelegateWithFixedCrossAxisCount(
                          crossAxisCount: 2,
                          mainAxisSpacing: 12,
                          crossAxisSpacing: 12,
                          childAspectRatio: 1.2),
                      children: [
                        _statCard("النقاط الإجمالية",
                            "${userProfile["totalPoints"]}", Icons.emoji_events),
                        _statCard(
                            "الترتيب العالمي",
                            "#${userProfile["worldRank"]}",
                            Icons.star_border),
                        _statCard("الترتيب المحلي",
                            "#${userProfile["localRank"]}", Icons.location_city),
                        _statCard("قافلة مشتركة",
                            "${userProfile["dropsParticipated"]}", Icons.flag),
                      ],
                    ),

                    const SizedBox(height: 16),

                    // ====== Achievements ======
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(16),
                        boxShadow: [
                          BoxShadow(
                              blurRadius: 5,
                              spreadRadius: 1,
                              color: Colors.black12)
                        ],
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Row(
                            children: [
                              Icon(Icons.star, color: Colors.orange),
                              SizedBox(width: 6),
                              Text("الإنجازات",
                                  style: TextStyle(
                                      fontWeight: FontWeight.bold,
                                      fontSize: 16)),
                            ],
                          ),
                          const SizedBox(height: 12),
                          GridView.builder(
                            shrinkWrap: true,
                            physics: const NeverScrollableScrollPhysics(),
                            itemCount:
                            (userProfile["achievements"] as List).length,
                            gridDelegate:
                            const SliverGridDelegateWithFixedCrossAxisCount(
                                crossAxisCount: 2,
                                crossAxisSpacing: 10,
                                mainAxisSpacing: 10,
                                childAspectRatio: 2),
                            itemBuilder: (context, index) {
                              final ach = (userProfile["achievements"]
                              as List)[index];
                              final earned = ach["earned"] as bool;
                              return Container(
                                padding: const EdgeInsets.all(8),
                                decoration: BoxDecoration(
                                  color: earned
                                      ? Colors.amber[200]
                                      : Colors.grey[200],
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: Column(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    Text(ach["icon"] as String,
                                        style: const TextStyle(fontSize: 20)),
                                    const SizedBox(height: 4),
                                    Text(ach["name"] as String,
                                        style: TextStyle(
                                            fontSize: 12,
                                            color: earned
                                                ? Colors.black
                                                : Colors.grey)),
                                  ],
                                ),
                              );
                            },
                          )
                        ],
                      ),
                    ),

                    const SizedBox(height: 16),

                    // ====== Action Buttons ======
                    _actionButton(Icons.account_balance_wallet, "المحفظة",
                        "عرض الرصيد والمعاملات", () {}),
                    _actionButton(Icons.settings, "الإعدادات",
                        "تخصيص التطبيق", () {}),
                    _actionButton(Icons.logout, "تسجيل الخروج",
                        "الخروج من الحساب", () {}),
                  ],
                ),
              ),
            )
          ],
        ),
      ),
    );
  }

  Widget _statCard(String title, String value, IconData icon) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(color: Colors.black12, blurRadius: 4, spreadRadius: 1)
        ],
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(icon, size: 32, color: Colors.blueAccent),
          const SizedBox(height: 8),
          Text(value,
              style:
              const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
          Text(title, style: const TextStyle(color: Colors.grey, fontSize: 12)),
        ],
      ),
    );
  }

  Widget _actionButton(
      IconData icon, String title, String subtitle, VoidCallback onTap) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      child: ElevatedButton(
        style: ElevatedButton.styleFrom(
          backgroundColor: Colors.white,
          foregroundColor: Colors.black,
          shadowColor: Colors.black12,
          padding: const EdgeInsets.all(12),
          shape:
          RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        ),
        onPressed: onTap,
        child: Row(
          children: [
            CircleAvatar(
              backgroundColor: Colors.blue.withOpacity(0.2),
              child: Icon(icon, color: Colors.blue),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title,
                      style: const TextStyle(fontWeight: FontWeight.bold)),
                  Text(subtitle,
                      style: const TextStyle(color: Colors.grey, fontSize: 12)),
                ],
              ),
            )
          ],
        ),
      ),
    );
  }
}
