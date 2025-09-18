import 'dart:async';
import 'package:flutter/material.dart';

class DropScreen extends StatefulWidget {
  const DropScreen({super.key});

  @override
  State<DropScreen> createState() => _DropScreenState();
}

class _DropScreenState extends State<DropScreen> {
  // حالة المستخدم
  double balance = 200.0; // رصيد بالدينار (double)
  int points = 50; // نقاط (int)

  // معلومات القافلة
  int participants = 234;
  late DateTime targetTime;
  late Timer _timer;
  Duration remaining = Duration.zero;

  // سجل مشتريات بسيط
  final List<Map<String, dynamic>> purchaseHistory = [];

  // عناصر القافلة — كل عنصر له سعر stock points barter إلزاميًا
  final List<Map<String, dynamic>> items = [
    {
      "id": "i1",
      "name": "صندوق ذهبي",
      "price": 120.0,
      "points": 50,
      "barter": false,
      "stock": 5,
      "maxStock": 5,
      "icon": Icons.workspace_premium,
      "rarity": "rare",
      "description": "صندوق يحتوي على مكافآت"
    },
    {
      "id": "i2",
      "name": "سيف نادر",
      "price": 200.0,
      "points": 100,
      "barter": false,
      "stock": 2,
      "maxStock": 2,
      "icon": Icons.security,
      "rarity": "legendary",
      "description": "سيف ذو قوة عالية"
    },
    {
      "id": "i3",
      "name": "خاتم أثري",
      "price": 80.0,
      "points": 0,
      "barter": true, // قابل للمقايضة: يخصم رصيد لكن لا يعطي نقاط
      "stock": 3,
      "maxStock": 3,
      "icon": Icons.circle,
      "rarity": "legendary",
      "description": "عنصر نادر للمقايضة"
    },
    {
      "id": "i4",
      "name": "جرعة سحرية",
      "price": 50.0,
      "points": 20,
      "barter": false,
      "stock": 10,
      "maxStock": 10,
      "icon": Icons.local_drink,
      "rarity": "common",
      "description": "تعزيز سريع للنقاط"
    },
    {
      "id": "i5",
      "name": "جوهرة زرقاء",
      "price": 150.0,
      "points": 70,
      "barter": false,
      "stock": 4,
      "maxStock": 4,
      "icon": Icons.diamond,
      "rarity": "rare",
      "description": "جوهرة ثمينة"
    },
    {
      "id": "i6",
      "name": "بطاقة نادرة (مقايضة)",
      "price": 60.0,
      "points": 0,
      "barter": true,
      "stock": 6,
      "maxStock": 6,
      "icon": Icons.card_giftcard,
      "rarity": "rare",
      "description": "بطاقة خاصة للمقايضة"
    },
  ];

  @override
  void initState() {
    super.initState();
    // اضبط وقت القافلة — مثال: ساعة ونصف من الآن
    targetTime = DateTime.now().add(const Duration(hours: 1, minutes: 30));
    remaining = targetTime.difference(DateTime.now());
    _timer = Timer.periodic(const Duration(seconds: 1), (_) {
      final diff = targetTime.difference(DateTime.now());
      setState(() {
        remaining = diff.isNegative ? Duration.zero : diff;
      });
    });
  }

  @override
  void dispose() {
    _timer.cancel();
    super.dispose();
  }

  String formatDuration(Duration d) {
    if (d.inSeconds <= 0) return "00:00:00";
    String two(int n) => n.toString().padLeft(2, "0");
    return "${two(d.inHours)}:${two(d.inMinutes.remainder(60))}:${two(d.inSeconds.remainder(60))}";
  }

  // تحقق آمن من قابلية المقايضة
  bool isBarter(Map<String, dynamic> item) {
    return (item["barter"] as bool?) ?? false;
  }

  // عملية الشراء مع تأكيد وحفظ سجل
  Future<void> handlePurchaseConfirm(int index) async {
    final item = items[index];
    final price = (item["price"] as num).toDouble();
    final stock = (item["stock"] as num?)?.toInt() ?? 0;
    final pointsGain = (item["points"] as num?)?.toInt() ?? 0;

    // قاعدة: إذا انتهت القافلة لا يمكن الشراء
    if (remaining.inSeconds <= 0) {
      _showMsg("انتهت القافلة ولا يمكن الشراء الآن.");
      return;
    }

    if (stock <= 0) {
      _showMsg("العنصر غير متوفر حالياً.");
      return;
    }

    if (balance < price) {
      _showMsg("رصيدك غير كافٍ.");
      return;
    }

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) {
        return AlertDialog(
          title: const Text("تأكيد الشراء"),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text("${item["name"]}"),
              const SizedBox(height: 8),
              Text("السعر: ${price.toStringAsFixed(2)} ر.ص"),
              isBarter(item)
                  ? const Text("نوع: قابل للمقايضة (لا يعطي نقاط)")
                  : Text("تكسب: +${pointsGain} نقطة"),
            ],
          ),
          actions: [
            TextButton(onPressed: () => Navigator.of(ctx).pop(false), child: const Text("إلغاء")),
            ElevatedButton(onPressed: () => Navigator.of(ctx).pop(true), child: const Text("تأكيد")),
          ],
        );
      },
    );

    if (confirmed == true) {
      // تنفيذ الشراء
      setState(() {
        balance = (balance - price);
        items[index]["stock"] = stock - 1;
        if (!isBarter(item)) {
          points += pointsGain;
        }
        // سجل الشراء
        purchaseHistory.insert(0, {
          "time": DateTime.now(),
          "name": item["name"],
          "price": price,
          "points": isBarter(item) ? 0 : pointsGain,
        });
      });

      // رسالة نجاح
      showDialog(
        context: context,
        builder: (ctx) => AlertDialog(
          title: const Text("تم الشراء ✅"),
          content: Text(
            isBarter(item)
                ? "${item["name"]} اشتريت بنجاح (قابل للمقايضة). -${price.toStringAsFixed(2)} ر.ص"
                : "${item["name"]} اشتريت بنجاح. -${price.toStringAsFixed(2)} ر.ص  +$pointsGain نقاط",
          ),
          actions: [TextButton(onPressed: () => Navigator.pop(ctx), child: const Text("حسناً"))],
        ),
      );
    }
  }

  void _showMsg(String txt) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(txt)));
  }

  Color rarityColor(String? r) {
    switch (r) {
      case "common":
        return Colors.grey.shade600;
      case "rare":
        return Colors.orange.shade700;
      case "legendary":
        return Colors.purple;
      default:
        return Colors.blueGrey;
    }
  }

  @override
  Widget build(BuildContext context) {
    final bool active = remaining.inSeconds > 0;
    return Scaffold(
      appBar: AppBar(
        title: const Text("⚡ قافلة"),
        centerTitle: true,
        actions: [
          Row(
            children: [
              const Icon(Icons.group, size: 20),
              const SizedBox(width: 6),
              Text("$participants"),
              const SizedBox(width: 12),
            ],
          )
        ],
      ),
      body: CustomScrollView(
        slivers: [
          // Header: رصيد ونقاط وعداد
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(12.0),
              child: Container(
                padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 12),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(colors: [Color(0xFFFFF3E0), Color(0xFFFFE0B2)]),
                  borderRadius: BorderRadius.circular(12),
                  boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 6)],
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceAround,
                  children: [
                    // Balance
                    Column(
                      children: [
                        const Text("رصيدك", style: TextStyle(fontWeight: FontWeight.bold)),
                        const SizedBox(height: 6),
                        Text("${balance.toStringAsFixed(2)} د.ع", style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                      ],
                    ),

                    // Points
                    Column(
                      children: [
                        const Text("نقاطك", style: TextStyle(fontWeight: FontWeight.bold)),
                        const SizedBox(height: 6),
                        Text("$points", style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                      ],
                    ),

                    // Countdown
                    Column(
                      children: [
                        const Text("الوقت المتبقي", style: TextStyle(fontWeight: FontWeight.bold)),
                        const SizedBox(height: 6),
                        Text(formatDuration(remaining), style: TextStyle(fontSize: 14, color: active ? Colors.black : Colors.redAccent)),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ),

          // Title
          SliverPadding(
            padding: const EdgeInsets.symmetric(horizontal: 12),
            sliver: SliverToBoxAdapter(
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text("المتجر", style: Theme.of(context).textTheme.titleLarge),
                  Text(active ? "قافلة نشطة" : "انتهت القافلة", style: TextStyle(color: active ? Colors.green : Colors.red)),
                ],
              ),
            ),
          ),

          // Grid: العناصر
          SliverPadding(
            padding: const EdgeInsets.all(12),
            sliver: SliverGrid(
              delegate: SliverChildBuilderDelegate(
                    (context, index) {
                  final item = items[index];
                  final stock = (item["stock"] as num?)?.toInt() ?? 0;
                  final maxStock = (item["maxStock"] as num?)?.toInt() ?? 0;
                  final price = (item["price"] as num).toDouble();
                  final pointsGain = (item["points"] as num?)?.toInt() ?? 0;
                  final barter = isBarter(item);
                  final canBuy = active && stock > 0 && balance >= price;

                  return Card(
                    elevation: 3,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    child: Padding(
                      padding: const EdgeInsets.all(1),//كانت 12
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.center,
                        children: [
                          Icon(item["icon"] as IconData, size: 36, color: rarityColor(item["rarity"] as String?)),
                          const SizedBox(height: 8),
                          Text(item["name"], textAlign: TextAlign.center, style: const TextStyle(fontWeight: FontWeight.bold)),
                          const SizedBox(height: 6),
                          Text(item["description"] ?? "", textAlign: TextAlign.center, style: TextStyle(fontSize: 12, color: Colors.grey[700])),
                          const SizedBox(height: 8),

                          // price & type
                          Text("السعر: ${price.toStringAsFixed(0)} د.ع", style: const TextStyle(fontWeight: FontWeight.w600)),
                          const SizedBox(height: 6),
                          barter
                              ? const Text("قابل للمقايضة", style: TextStyle(color: Colors.deepOrange, fontWeight: FontWeight.bold))
                              : Text("+${pointsGain} نقطة", style: const TextStyle(color: Colors.green, fontWeight: FontWeight.bold)),

                          const SizedBox(height: 8),
                          // stock progress
                          LinearProgressIndicator(
                            value: maxStock > 0 ? stock / maxStock : 0,
                            minHeight: 8,
                            color: rarityColor(item["rarity"] as String?),
                            backgroundColor: Colors.grey[200],
                          ),
                          const SizedBox(height: 6),
                          Text("المخزون: $stock / $maxStock", style: const TextStyle(fontSize: 12, color: Colors.black54)),

                          const Spacer(),
                          SizedBox(
                            width: double.infinity,
                            child: ElevatedButton(
                              onPressed: canBuy ? () => handlePurchaseConfirm(index) : null,
                              style: ElevatedButton.styleFrom(
                                backgroundColor: canBuy ? Colors.orange : Colors.grey,
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                              ),
                              child: Text(canBuy ? "شراء ${price.toStringAsFixed(0)} د.ع" : (stock <= 0 ? "غير متوفر" : (active ? "رصيد غير كافٍ" : "انتهت القافلة"))),
                            ),
                          ),
                        ],
                      ),
                    ),
                  );
                },
                childCount: items.length,
              ),
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                mainAxisSpacing: 12,
                crossAxisSpacing: 12,
                childAspectRatio: 0.68,
              ),
            ),
          ),

          // Rules + purchase history section
          SliverPadding(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            sliver: SliverToBoxAdapter(
              child: Column(
                children: [
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(12),
                      child: Column(
                        children: const [
                          Text("📜 قواعد القافلة", style: TextStyle(fontWeight: FontWeight.bold)),
                          SizedBox(height: 6),
                          Text("• كل عنصر له كمية محدودة"),
                          Text("• الشراء يتم بترتيب الوصول"),
                          Text("• لا يمكن إلغاء أو استرداد المشتريات"),
                          Text("• تنتهي القافلة عند انتهاء الوقت"),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 8),
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(12),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text("🧾 سجل المشتريات الأخير", style: TextStyle(fontWeight: FontWeight.bold)),
                          const SizedBox(height: 8),
                          if (purchaseHistory.isEmpty)
                            const Text("لا توجد عمليات شراء بعد.")
                          else
                            ...purchaseHistory.take(5).map((h) {
                              final dt = h["time"] as DateTime;
                              final name = h["name"] as String;
                              final price = (h["price"] as num).toDouble();
                              final pts = (h["points"] as num).toInt();
                              return ListTile(
                                dense: true,
                                leading: const Icon(Icons.shopping_bag, size: 20),
                                title: Text(name),
                                subtitle: Text("${dt.hour.toString().padLeft(2,'0')}:${dt.minute.toString().padLeft(2,'0')}"),
                                trailing: Text("-${price.toStringAsFixed(0)} د.ع${pts>0? '  +$pts نقطة':''}"),
                              );
                            }),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),

          // bottom spacing
          SliverToBoxAdapter(child: const SizedBox(height: 40)),
        ],
      ),
    );
  }
}
