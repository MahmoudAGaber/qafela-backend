import 'package:flutter/material.dart';

class BarterItem {
  final String id;
  final String name;
  final String icon;
  final int quantity;
  final String rarity;

  BarterItem({
    required this.id,
    required this.name,
    required this.icon,
    required this.quantity,
    required this.rarity,
  });
}

class BarterRecipe {
  final String id;
  final List<Map<String, dynamic>> inputs;
  final BarterItem output;
  final String description;

  BarterRecipe({
    required this.id,
    required this.inputs,
    required this.output,
    required this.description,
  });
}

class BarterCenter extends StatefulWidget {
  const BarterCenter({super.key});

  @override
  State<BarterCenter> createState() => _BarterCenterState();
}

class _BarterCenterState extends State<BarterCenter> {
  BarterItem? selectedItem1;
  BarterItem? selectedItem2;
  BarterItem? resultItem;

  // Mock user items
  final List<BarterItem> userItems = [
    BarterItem(id: "oil", name: "براميل نفط", icon: "🛢️", quantity: 5, rarity: "common"),
    BarterItem(id: "gems", name: "أحجار كريمة", icon: "💎", quantity: 3, rarity: "rare"),
    BarterItem(id: "copper", name: "صندوق نحاسي", icon: "🟫", quantity: 4, rarity: "rare"),
    BarterItem(id: "dates", name: "كيس تمر", icon: "🌰", quantity: 7, rarity: "common"),
    BarterItem(id: "silver", name: "سبيكة فضة", icon: "⚪", quantity: 2, rarity: "rare"),
    BarterItem(id: "wood", name: "خشب نادر", icon: "🪵", quantity: 6, rarity: "common"),
    BarterItem(id: "pearl", name: "لؤلؤ طبيعي", icon: "🦪", quantity: 1, rarity: "legendary"),
    BarterItem(id: "spices", name: "توابل شرقية", icon: "🌶️", quantity: 8, rarity: "common"),
    BarterItem(id: "golden_sword", name: "سيف ذهبي", icon: "⚔️", quantity: 0, rarity: "legendary"),
  ];

  // TODO: add recipes and barter history مثل الكود الأصلي

  void handleItemSelect(BarterItem item, int slot) {
    setState(() {
      if (slot == 1) {
        selectedItem1 = item;
      } else {
        selectedItem2 = item;
      }
      checkBarterResult();
    });
  }

  void checkBarterResult() {
    if (selectedItem1 == null || selectedItem2 == null) {
      resultItem = null;
      return;
    }

    // TODO: logic for checking recipe
    resultItem = BarterItem(
      id: "mystery",
      name: "صندوق غامض",
      icon: "❓",
      quantity: 1,
      rarity: "common",
    );
  }

  void handleConfirmBarter() {
    if (resultItem != null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text("🎉 حصلت على ${resultItem!.name}")),
      );
      setState(() {
        selectedItem1 = null;
        selectedItem2 = null;
        resultItem = null;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.amber.shade50,
      appBar: AppBar(
        title: const Text("💱 مركز المقايضات"),
        backgroundColor: Colors.orange,
      ),
      body: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          children: [
            const Text("اختر سلعتين للمقايضة", style: TextStyle(fontWeight: FontWeight.bold)),
            const SizedBox(height: 12),

            Row(
              children: [
                Expanded(
                  child: selectedItem1 == null
                      ? placeholderSlot("السلعة الأولى")
                      : itemCard(selectedItem1!, () {
                    setState(() => selectedItem1 = null);
                  }),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: selectedItem2 == null
                      ? placeholderSlot("السلعة الثانية")
                      : itemCard(selectedItem2!, () {
                    setState(() => selectedItem2 = null);
                  }),
                ),
              ],
            ),

            const SizedBox(height: 16),
            const Icon(Icons.arrow_downward, size: 30, color: Colors.orange),

            const SizedBox(height: 16),
            resultItem == null
                ? placeholderSlot("اختر سلعتين لرؤية النتيجة")
                : itemCard(resultItem!, () {}),

            const SizedBox(height: 20),
            Row(
              children: [
                Expanded(
                  child: ElevatedButton(
                    onPressed: handleConfirmBarter,
                    child: const Text("✅ تأكيد المقايضة"),
                  ),
                ),
                const SizedBox(width: 12),
                OutlinedButton(
                  onPressed: () {
                    setState(() {
                      selectedItem1 = null;
                      selectedItem2 = null;
                      resultItem = null;
                    });
                  },
                  child: const Text("❌ إلغاء"),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget placeholderSlot(String text) {
    return Card(
      child: Container(
        height: 100,
        alignment: Alignment.center,
        child: Text(text, style: const TextStyle(color: Colors.grey)),
      ),
    );
  }

  Widget itemCard(BarterItem item, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Card(
        color: Colors.white,
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Column(
            children: [
              Text(item.icon, style: const TextStyle(fontSize: 28)),
              const SizedBox(height: 6),
              Text(item.name, style: const TextStyle(fontWeight: FontWeight.bold)),
              Text("الكمية: ${item.quantity}", style: const TextStyle(fontSize: 12)),
            ],
          ),
        ),
      ),
    );
  }
}
