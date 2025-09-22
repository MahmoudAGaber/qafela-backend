import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:qafela/widgets/wallet_service.dart';

/// 🟢 نموذج عنصر المقايضة
class BarterItem {
  final String id; // معرف فريد للنوع
  final String name; // اسم العنصر
  final String icon; // رمز العنصر (Emoji أو صورة)
  int quantity; // عدد العناصر المتوفرة
  final String rarity; // ندرة العنصر
  final int points; // النقاط عند استخدام العنصر

  BarterItem({
    required this.id,
    required this.name,
    required this.icon,
    required this.quantity,
    required this.rarity,
    required this.points,
  });

  /// 👇 إنشاء نسخة مستقلة (clone) مع إمكانية تعديل الكمية
  BarterItem copyWith({int? quantity}) {
    return BarterItem(
      id: id,
      name: name,
      icon: icon,
      quantity: quantity ?? this.quantity,
      rarity: rarity,
      points: points,
    );
  }
}

/// 🟢 شاشة مركز المقايضات
class BarterCenter extends StatefulWidget {
  const BarterCenter({super.key});

  @override
  State<BarterCenter> createState() => _BarterCenterState();
}

class _BarterCenterState extends State<BarterCenter> {
  BarterItem? selectedItem1;
  BarterItem? selectedItem2;
  BarterItem? tempResultItem; // عرض مؤقت للنتيجة قبل التأكيد


  String historyFilter = "all"; // فلتر سجل المقايضات: all / used / unused

  List<Map<String, dynamic>> barterHistory = [];

  final List<BarterItem> userItems = [
    BarterItem(id: "oil", name: "براميل نفط", icon: "🛢️", quantity: 5, rarity: "common", points: 10),
    BarterItem(id: "gems", name: "أحجار كريمة", icon: "💎", quantity: 3, rarity: "rare", points: 30),
    BarterItem(id: "copper", name: "صندوق نحاسي", icon: "🟫", quantity: 4, rarity: "rare", points: 25),
    BarterItem(id: "dates", name: "كيس تمر", icon: "🌰", quantity: 7, rarity: "common", points: 8),
    BarterItem(id: "silver", name: "سبيكة فضة", icon: "⚪", quantity: 2, rarity: "rare", points: 40),
    BarterItem(id: "wood", name: "خشب نادر", icon: "🪵", quantity: 6, rarity: "common", points: 12),
    BarterItem(id: "pearl", name: "لؤلؤ طبيعي", icon: "🦪", quantity: 1, rarity: "legendary", points: 100),
    BarterItem(id: "spices", name: "توابل شرقية", icon: "🌶️", quantity: 8, rarity: "common", points: 15),
    BarterItem(id: "golden_sword", name: "سيف ذهبي", icon: "⚔️", quantity: 0, rarity: "legendary", points: 200),
  ];

  final Map<Set<String>, BarterItem> barterRecipes = {
    {"oil", "spices"}: BarterItem(id: "perfume", name: "بخور شرقي فاخر", icon: "🪔", quantity: 1, rarity: "rare", points: 60),
    {"gems", "silver"}: BarterItem(id: "royal_jewel", name: "جوهرة ملكية", icon: "👑", quantity: 1, rarity: "legendary", points: 120),
    {"dates", "wood"}: BarterItem(id: "carved_box", name: "صندوق محفور", icon: "🗳️", quantity: 1, rarity: "rare", points: 45),
    {"copper", "silver"}: BarterItem(id: "ornament", name: "زخرفة معدنية", icon: "⚙️", quantity: 1, rarity: "epic", points: 90),
    {"pearl", "golden_sword"}: BarterItem(id: "royal_treasure", name: "كنز ملكي", icon: "💰", quantity: 1, rarity: "legendary", points: 200),
  };

  bool _isAlreadySelected(BarterItem item) {
    return (selectedItem1 != null && selectedItem1!.id == item.id) || (selectedItem2 != null && selectedItem2!.id == item.id);
  }

  void handleItemSelect(BarterItem item, int slot) {
    if (_isAlreadySelected(item)) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("🚫 لا يمكنك اختيار نفس السلعة مرتين")),
      );
      return;
    }

    if (item.quantity <= 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("⚠️ هذه السلعة لا توجد منها كميات")),
      );
      return;
    }

    setState(() {
      if (slot == 1) selectedItem1 = item;
      if (slot == 2) selectedItem2 = item;
      checkBarterResult();
    });
  }

  void checkBarterResult() {
    if (selectedItem1 == null || selectedItem2 == null) {
      tempResultItem = null;
      return;
    }
    tempResultItem = generateResult(selectedItem1!, selectedItem2!);
  }

  BarterItem generateResult(BarterItem item1, BarterItem item2) {
    final Set<String> key = {item1.id, item2.id};
    if (barterRecipes.containsKey(key)) return barterRecipes[key]!.copyWith(quantity: 1);

    String rarity, name, icon;
    int points;

    if (item1.rarity == "legendary" || item2.rarity == "legendary") {
      rarity = "legendary";
      name = "كنز أسطوري";
      icon = "🏆";
      points = 150;
    } else if (item1.rarity == "rare" && item2.rarity == "rare") {
      rarity = "epic";
      name = "صندوق ملحمي";
      icon = "📦";
      points = 80;
    } else if ((item1.rarity == "common" && item2.rarity == "rare") || (item1.rarity == "rare" && item2.rarity == "common")) {
      rarity = "rare";
      name = "صندوق نادر";
      icon = "🎁";
      points = 40;
    } else {
      rarity = "common";
      name = "صندوق عادي";
      icon = "📦";
      points = 20;
    }

    return BarterItem(
      id: "result_${DateTime.now().millisecondsSinceEpoch}",
      name: name,
      icon: icon,
      quantity: 1,
      rarity: rarity,
      points: points,
    );
  }

  void handleConfirmBarter() {
    if (selectedItem1 == null || selectedItem2 == null) return;

    if (selectedItem1!.quantity <= 0 || selectedItem2!.quantity <= 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("⚠️ لا يمكن المقايضة بسلعة كميتها صفر")),
      );
      return;
    }

    setState(() {
      selectedItem1!.quantity -= 1;
      selectedItem2!.quantity -= 1;

      // حذف أي عنصر انتهت كميته
      userItems.removeWhere((i) => i.quantity <= 0);

      BarterItem result = generateResult(selectedItem1!, selectedItem2!);

     /* int index = userItems.indexWhere((i) => i.name == result.name && i.rarity == result.rarity);
      if (index != -1) {
        userItems[index].quantity += 1;
        result = userItems[index];
      } else {
        userItems.add(result);
      }*/

      barterHistory.add({
        "id": DateTime.now().millisecondsSinceEpoch,
        "result": result.copyWith(quantity: 1),
        "item1": selectedItem1!,
        "item2": selectedItem2!,
        "date": DateTime.now(),
        "used": false,
      });

      selectedItem1 = null;
      selectedItem2 = null;
      tempResultItem = null;
    });

    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text("🎉 تمت المقايضة وتم تحديث المخزون والسجل")),
    );
  }

  void handleUseResult(BarterItem item, int recordId) {
    final wallet = Provider.of<WalletService>(context, listen: false);

    setState(() {
      // ✅ أضف النقاط إلى المحفظة مباشرة
      wallet.addPoints(item.points.toDouble());

      // قلل الكمية من عناصر المستخدم
      final index = userItems.indexWhere((i) => i.id == item.id);
      if (index != -1) {
        userItems[index].quantity -= 1;
        if (userItems[index].quantity <= 0) userItems.removeAt(index);
      }

      // عدل السجل (mark as used)
      final historyIndex = barterHistory.indexWhere((r) => r["id"] == recordId);
      if (historyIndex != -1) {
        barterHistory[historyIndex]["used"] = true;
      }
    });

    // ✅ إشعار للمستخدم بعد التحويل
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text("✅ تم تحويل ${item.name} إلى ${item.points} نقطة")),
    );
  }


  @override
  Widget build(BuildContext context) {
    final wallet = Provider.of<WalletService>(context);
    int userPoints = wallet.points.toInt();
    return Scaffold(
      backgroundColor: Colors.amber.shade50,
      appBar: AppBar(
        title: const Text("💱 مركز المقايضات"),
        backgroundColor: Colors.orange,
        actions: [
          Padding(
            padding: const EdgeInsets.all(12),
            child: Center(
              child: Text("نقاطك: $userPoints ⭐", style: const TextStyle(fontWeight: FontWeight.bold)),
            ),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text("اختر سلعتين للمقايضة", style: TextStyle(fontWeight: FontWeight.bold)),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(child: placeholderOrItem(selectedItem1, "السلعة الأولى", () => setState(() => selectedItem1 = null))),
                const SizedBox(width: 12),
                Expanded(child: placeholderOrItem(selectedItem2, "السلعة الثانية", () => setState(() => selectedItem2 = null))),
              ],
            ),
            const SizedBox(height: 16),
            const Icon(Icons.arrow_downward, size: 30, color: Colors.orange),
            const SizedBox(height: 16),
            if (tempResultItem != null)
              Column(
                children: [
                  itemCard(tempResultItem!, showPoints: true),
                  const SizedBox(height: 8),
                  Text("هذه نتيجة مقترحة بناءً على الوصفة أو النُدرة", style: TextStyle(color: Colors.grey.shade700)),
                ],
              )
            else
              placeholderOrItem(null, "اختر سلعتين لرؤية النتيجة", () {}),
            const SizedBox(height: 20),
            Row(
              children: [
                Expanded(child: ElevatedButton(onPressed: handleConfirmBarter, child: const Text("✅ تأكيد المقايضة"))),
                const SizedBox(width: 12),
                OutlinedButton(
                  onPressed: () {
                    setState(() {
                      selectedItem1 = null;
                      selectedItem2 = null;
                      tempResultItem = null;
                    });
                  },
                  child: const Text("❌ إلغاء"),
                ),
              ],
            ),
            const SizedBox(height: 24),
            const Divider(),

            // --- سجل المقايضات مع Dropdown Filter ---
            if (barterHistory.isNotEmpty) ...[
              const Text("📜 سجل المقايضة", style: TextStyle(fontWeight: FontWeight.bold)),
              const SizedBox(height: 12),

              DropdownButton<String>(
                value: historyFilter,
                items: const [
                  DropdownMenuItem(value: "all", child: Text("كل العناصر")),
                  DropdownMenuItem(value: "unused", child: Text("غير مستخدمة")),
                  DropdownMenuItem(value: "used", child: Text("تم استخدامها")),
                ],
                onChanged: (value) {
                  if (value != null) setState(() => historyFilter = value);
                },
              ),
              const SizedBox(height: 12),

              Column(
                children: barterHistory
                    .where((record) {
                  if (historyFilter == "all") return true;
                  if (historyFilter == "used") return record["used"] == true;
                  if (historyFilter == "unused") return record["used"] == false;
                  return true;
                })
                    .map((record) {
                  final BarterItem result = record["result"];
                  final BarterItem item1 = record["item1"];
                  final BarterItem item2 = record["item2"];
                  final DateTime date = record["date"];
                  final bool used = record["used"];

                  return Card(
                    color: used ? Colors.grey.shade300 : Colors.white,
                    child: ListTile(
                      leading: Text(result.icon, style: const TextStyle(fontSize: 28)),
                      title: Text(result.name),
                      subtitle: Text("نتيجة: ${item1.name} + ${item2.name}\n📅 ${date.day}/${date.month}/${date.year} - ${date.hour}:${date.minute}"),
                      trailing: used
                          ? const Text("تم الاستخدام ✅", style: TextStyle(color: Colors.green))
                          : ElevatedButton(
                        onPressed: () => handleUseResult(result, record["id"]),
                        child: Text("استخدام (${result.points}⭐)"),
                      ),
                    ),
                  );
                }).toList(),
              ),
              const SizedBox(height: 12),
            ],

            const Text("📦 مخزونك", style: TextStyle(fontWeight: FontWeight.bold)),
            const SizedBox(height: 12),
            GridView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: userItems.length,
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 3,
                childAspectRatio: 1,
                crossAxisSpacing: 8,
                mainAxisSpacing: 8,
              ),
              itemBuilder: (context, index) {
                final item = userItems[index];
                return GestureDetector(
                  onTap: () {
                    if (_isAlreadySelected(item)) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text("🚫 لا يمكنك اختيار نفس السلعة مرتين")),
                      );
                      return;
                    }
                    if (selectedItem1 == null) handleItemSelect(item, 1);
                    else if (selectedItem2 == null) handleItemSelect(item, 2);
                  },
                  child: itemCard(item, showPoints: false),
                );
              },
            ),
          ],
        ),
      ),
    );
  }

  Widget placeholderOrItem(BarterItem? item, String placeholderText, VoidCallback onTap) {
    return Card(
      child: Container(
        height: 100,
        alignment: Alignment.center,
        child: FittedBox(
          child: item == null
              ? Text(placeholderText, style: const TextStyle(color: Colors.grey), textAlign: TextAlign.center)
              : GestureDetector(onTap: onTap, child: itemCard(item, showPoints: item.id.startsWith("mystery"))),
        ),
      ),
    );
  }

  Widget itemCard(BarterItem item, {bool showPoints = false}) {
    return Card(
      color: item.quantity == 0 ? Colors.grey.shade200 : Colors.white,
      child: Padding(
        padding: const EdgeInsets.all(8),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(item.icon, style: const TextStyle(fontSize: 28)),
            const SizedBox(height: 6),
            Text(item.name, style: const TextStyle(fontWeight: FontWeight.bold)),
            if (item.quantity > 0) Text("الكمية: ${item.quantity}", style: const TextStyle(fontSize: 12)),
            if (showPoints && item.points > 0) Text("⭐ ${item.points} نقطة", style: const TextStyle(color: Colors.orange)),
          ],
        ),
      ),
    );
  }
}
