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
    if (!isActive) {
      return Container(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(20),
          gradient: const LinearGradient(
            colors: [Color(0xFFf8f9fa), Color(0xFFe9ecef)],
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.05),
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
                color: Colors.grey,
              ),
              child: const Icon(Icons.inventory, size: 32, color: Colors.black54),
            ),
            const SizedBox(height: 8),
            const Text(
              "القافلة القادمة",
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 4),
            const Text(
              "استعد للقافلة القادمة المليئة بالجوائز المميزة",
              style: TextStyle(fontSize: 14, color: Colors.black54),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 12),
            CountdownTimer(title: "تبدأ خلال", targetTime: nextDropTime),
          ],
        ),
      );
    }

    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
        gradient: const LinearGradient(
          colors: [Color(0xFFf1f8ff), Color(0xFFe3f2fd)],
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 6,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          /// Header
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: const [
                  CircleAvatar(
                    radius: 16,
                    backgroundColor: Colors.blue,
                    child: Icon(Icons.inventory, size: 16, color: Colors.white),
                  ),
                  SizedBox(width: 8),
                  Text(
                    "القافلة النشطة",
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                ],
              ),
              Row(
                children: [
                  const Icon(Icons.people, size: 16, color: Colors.green),
                  const SizedBox(width: 4),
                  Text(
                    "${(10 + (50 * (new DateTime.now().second / 60))).toInt()} متسابق",
                    style: const TextStyle(fontSize: 14, color: Colors.green),
                  ),
                ],
              ),
            ],
          ),

          const SizedBox(height: 12),

          /// Items Grid
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              mainAxisSpacing: 8,
              crossAxisSpacing: 8,
              childAspectRatio: 1.2,
            ),
            itemCount: currentItems.length,
            itemBuilder: (context, index) {
              final item = currentItems[index];
              return Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.7),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(item.icon, style: const TextStyle(fontSize: 24)),
                    const SizedBox(height: 4),
                    Text(item.name,
                        style: const TextStyle(
                            fontSize: 14, fontWeight: FontWeight.w600)),
                    const SizedBox(height: 6),
                    if (item.type == "points") ...[
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(Icons.monetization_on,
                              size: 14, color: Colors.green),
                          const SizedBox(width: 4),
                          Text(
                            "+${item.pointsValue ?? item.price} نقطة",
                            style: const TextStyle(
                              fontWeight: FontWeight.bold,
                              color: Colors.green,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 6),
                      LinearProgressIndicator(
                        value: (item.maxStock - item.stock) / item.maxStock,
                        backgroundColor: Colors.grey[300],
                        valueColor:
                        const AlwaysStoppedAnimation<Color>(Colors.orange),
                      ),
                      const SizedBox(height: 4),
                      Text("متاح x${item.stock}",
                          style: const TextStyle(fontSize: 12)),
                    ] else ...[
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: const [
                          Icon(Icons.lock, size: 14, color: Colors.orange),
                          SizedBox(width: 4),
                          Text("عنصر نادر",
                              style: TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.bold,
                                  color: Colors.orange)),
                        ],
                      ),
                      const SizedBox(height: 4),
                      Text(
                        item.isRare == true
                            ? "شراء مرة واحدة فقط"
                            : "للمقايضة",
                        style: const TextStyle(
                            fontSize: 12, color: Colors.orange),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        "متبقي ${item.stock} من ${item.maxStock}",
                        style: const TextStyle(fontSize: 12),
                      ),
                    ]
                  ],
                ),
              );
            },
          ),

          const SizedBox(height: 12),

          CountdownTimer(
            title: "تنتهي خلال",
            targetTime: DateTime.now().add(const Duration(hours: 2)),
          ),

          const SizedBox(height: 12),

          ElevatedButton.icon(
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.blue,
              minimumSize: const Size(double.infinity, 48),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
            onPressed: () {},
            icon: const Icon(Icons.inventory),
            label: const Text("دخول القافلة"),
          ),
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
  late Duration _timeLeft;
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _updateTime();
    _timer = Timer.periodic(const Duration(seconds: 1), (_) => _updateTime());
  }

  void _updateTime() {
    final now = DateTime.now();
    setState(() {
      _timeLeft = widget.targetTime.difference(now).isNegative
          ? Duration.zero
          : widget.targetTime.difference(now);
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final hours = _timeLeft.inHours.toString().padLeft(2, "0");
    final minutes = (_timeLeft.inMinutes % 60).toString().padLeft(2, "0");
    final seconds = (_timeLeft.inSeconds % 60).toString().padLeft(2, "0");

    return Column(
      children: [
        Text(widget.title,
            style: const TextStyle(fontSize: 14, color: Colors.black54)),
        const SizedBox(height: 4),
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
        color: Colors.blue.withOpacity(0.1),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Column(
        children: [
          Text(value,
              style: const TextStyle(
                  fontSize: 18, fontWeight: FontWeight.bold, color: Colors.blue)),
          Text(label, style: const TextStyle(fontSize: 12, color: Colors.blue)),
        ],
      ),
    );
  }
}
