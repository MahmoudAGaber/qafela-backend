import 'dart:async';
import 'package:flutter/material.dart';

class DropItem {
  final String id;
  final String name;
  final int price;
  final int stock;
  final int maxStock;
  final String icon;
  final String type; // "points" or "barter"
  final int? pointsValue;
  final bool? isRare;
  final int? purchaseLimit;

  DropItem({
    required this.id,
    required this.name,
    required this.price,
    required this.stock,
    required this.maxStock,
    required this.icon,
    required this.type,
    this.pointsValue,
    this.isRare,
    this.purchaseLimit,
  });
}

class DropSection extends StatelessWidget {
  final bool isActive;
  final DateTime nextDropTime;
  final List<DropItem> currentItems;

  const DropSection({
    Key? key,
    required this.isActive,
    required this.nextDropTime,
    required this.currentItems,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    // حالة القافلة غير نشطة
    if (!isActive) {
      return Container(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(20),
          gradient: const LinearGradient(
            colors: [Color(0xFFFFF9F0), Color(0xFFFFF3E0)], // بيج هادي
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.orange.withOpacity(0.1),
              blurRadius: 6,
              offset: const Offset(0, 3),
            ),
          ],
        ),
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            Container(
              width: 64,
              height: 64,
              decoration: const BoxDecoration(
                shape: BoxShape.circle,
                color: Color(0xFFFFCC80), // أورانج فاتح
              ),
              child: const Icon(Icons.inventory,
                  size: 32, color: Color(0xFF6D4C41)), // بني
            ),
            const SizedBox(height: 8),
            const Text(
              "القافلة القادمة",
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Color(0xFF5D4037)),
            ),
            const SizedBox(height: 4),
            const Text(
              "استعد للقافلة القادمة المليئة بالجوائز المميزة",
              style: TextStyle(fontSize: 14, color: Colors.brown),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 12),
            CountdownTimer(title: "تبدأ خلال", targetTime: nextDropTime),
          ],
        ),
      );
    }

    // حالة القافلة نشطة
    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
        gradient: const LinearGradient(
          colors: [Color(0xFFFFFDE7), Color(0xFFFFF9C4)], // أصفر باهت × بيج
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.orange.withOpacity(0.15),
            blurRadius: 6,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      padding: const EdgeInsets.all(16),
      child: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // ترويسة
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: const [
                    CircleAvatar(
                      radius: 16,
                      backgroundColor: Color(0xFFFFB74D),
                      child: Icon(Icons.inventory, size: 16, color: Colors.white),
                    ),
                    SizedBox(width: 8),
                    Text(
                      "القافلة النشطة",
                      style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Color(0xFF5D4037)),
                    ),
                  ],
                ),
                Row(
                  children: [
                    const Icon(Icons.people, size: 16, color: Colors.green),
                    const SizedBox(width: 4),
                    Text(
                      "${(10 + (50 * (DateTime.now().second / 60))).toInt()} متسابق",
                      style: const TextStyle(fontSize: 14, color: Colors.green),
                    ),
                  ],
                ),
              ],
            ),

            const SizedBox(height: 12),

            if (currentItems.isEmpty)
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.7),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Center(
                  child: Text("لا توجد عناصر حالياً"),
                ),
              )
            else
              ConstrainedBox(
                constraints: BoxConstraints(
                  maxHeight: (currentItems.length <= 4) ? 400.0 : 520.0,
                ),
                child: GridView.builder(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 2,
                    mainAxisSpacing: 8,
                    crossAxisSpacing: 8,
                    childAspectRatio: 0.95,
                  ),
                  itemCount: currentItems.length,
                  itemBuilder: (context, index) {
                    final item = currentItems[index];
                    return _buildItemCard(item);
                  },
                ),
              ),

            const SizedBox(height: 12),

            CountdownTimer(
              title: "تنتهي خلال",
              targetTime: DateTime.now().add(const Duration(hours: 2)),
            ),

            const SizedBox(height: 12),

            ElevatedButton.icon(
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.orange.shade400,
                minimumSize: const Size(double.infinity, 48),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                elevation: 2,
              ),
              onPressed: () {},
              icon: const Icon(Icons.inventory),
              label: const Text("دخول القافلة"),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildItemCard(DropItem item) {
    double progress = 0.0;
    if (item.maxStock > 0) {
      progress = (item.maxStock - item.stock) / item.maxStock;
      if (progress.isNaN) progress = 0.0;
      progress = progress.clamp(0.0, 1.0);
    }

    return Container(
      padding: const EdgeInsets.all(8),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.95),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.orange.shade100),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(item.icon, style: const TextStyle(fontSize: 26)),
          const SizedBox(height: 6),
          Text(item.name,
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
          const SizedBox(height: 6),
          if (item.type == "points") ...[
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.monetization_on, size: 14, color: Colors.green),
                const SizedBox(width: 4),
                Text("+${item.pointsValue ?? item.price} نقطة",
                    style: const TextStyle(
                        fontWeight: FontWeight.bold, color: Colors.green)),
              ],
            ),
            const SizedBox(height: 6),
            LinearProgressIndicator(
              value: progress,
              backgroundColor: Colors.grey[300],
              valueColor: AlwaysStoppedAnimation<Color>(Colors.orange.shade400),
              minHeight: 6,
            ),
            const SizedBox(height: 6),
            Text("متاح x${item.stock}", style: const TextStyle(fontSize: 12)),
          ] else ...[
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: const [
                Icon(Icons.lock, size: 14, color: Colors.deepOrange),
                SizedBox(width: 4),
                Text("عنصر نادر",
                    style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                        color: Colors.deepOrange)),
              ],
            ),
            const SizedBox(height: 6),
            Text(item.isRare == true ? "شراء مرة واحدة فقط" : "للمقايضة",
                style: const TextStyle(fontSize: 12, color: Colors.brown)),
            const SizedBox(height: 6),
            Text("متبقي ${item.stock} من ${item.maxStock}",
                style: const TextStyle(fontSize: 12)),
          ]
        ],
      ),
    );
  }
}

class CountdownTimer extends StatefulWidget {
  final String title;
  final DateTime targetTime;

  const CountdownTimer({
    Key? key,
    required this.title,
    required this.targetTime,
  }) : super(key: key);

  @override
  State<CountdownTimer> createState() => _CountdownTimerState();
}

class _CountdownTimerState extends State<CountdownTimer> {
  Duration _timeLeft = Duration.zero;
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _updateTime();
    _timer = Timer.periodic(const Duration(seconds: 1), (_) => _updateTime());
  }

  void _updateTime() {
    final now = DateTime.now();
    final diff = widget.targetTime.difference(now);
    setState(() {
      _timeLeft = diff.isNegative ? Duration.zero : diff;
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    String two(int n) => n.toString().padLeft(2, '0');
    final hours = two(_timeLeft.inHours);
    final minutes = two(_timeLeft.inMinutes.remainder(60));
    final seconds = two(_timeLeft.inSeconds.remainder(60));

    return Column(
      children: [
        Text(widget.title,
            style: const TextStyle(fontSize: 14, color: Colors.brown)),
        const SizedBox(height: 6),
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            _timeBox(hours, "ساعة"),
            const SizedBox(width: 6),
            _timeBox(minutes, "دقيقة"),
            const SizedBox(width: 6),
            _timeBox(seconds, "ثانية"),
          ],
        ),
      ],
    );
  }

  Widget _timeBox(String value, String label) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
      decoration: BoxDecoration(
        color: Colors.orange.shade50,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Column(
        children: [
          Text(value,
              style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: Colors.orange.shade700)),
          Text(label,
              style:
              TextStyle(fontSize: 12, color: Colors.orange.shade700)),
        ],
      ),
    );
  }
}
