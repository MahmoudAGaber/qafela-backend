import 'dart:async';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'dart:math';

import 'package:qafela/widgets/wallet_service.dart';

class DropVisual {
  final String shape;
  final String primaryColor;
  final String secondaryColor;
  final String symbol;
  final String animation;

  DropVisual({
    required this.shape,
    required this.primaryColor,
    required this.secondaryColor,
    required this.symbol,
    required this.animation,
  });
}

final Map<String, DropVisual> dropVisualMap = {
  "i1": DropVisual(shape: 'rectangle', primaryColor: '#FFD700', secondaryColor: '#FFE066', symbol: '🎁', animation: 'glow'),
  "i2": DropVisual(shape: 'rectangle', primaryColor: '#800080', secondaryColor: '#D8BFD8', symbol: '⚔️', animation: 'shake'),
  "i3": DropVisual(shape: 'circle', primaryColor: '#C0C0C0', secondaryColor: '#FFFFFF', symbol: '💍', animation: 'rotate'),
  "i4": DropVisual(shape: 'rectangle', primaryColor: '#87CEFA', secondaryColor: '#B0E0E6', symbol: '🧪', animation: 'bounce'),
  "i5": DropVisual(shape: 'multiFacet', primaryColor: '#1E90FF', secondaryColor: '#ADD8E6', symbol: '💎', animation: 'glow'),
  "i6": DropVisual(shape: 'rectangle', primaryColor: '#FFA500', secondaryColor: '#FFD580', symbol: '💳', animation: 'shake'),
};

class DropScreen extends StatefulWidget {
  const DropScreen({super.key});

  @override
  State<DropScreen> createState() => _DropScreenState();
}

class _DropScreenState extends State<DropScreen> with TickerProviderStateMixin {

  int points = 2550;
  late DateTime targetTime;
  late Timer _timer;
  Duration remaining = Duration.zero;
  final List<Map<String, dynamic>> purchaseHistory = [];

  late AnimationController _glowController;
  late AnimationController _rotateController;
  late AnimationController _shakeController;
  late AnimationController _bounceController;

  final List<Map<String, dynamic>> items = [
    {
      "id": "i1",
      "name": "صندوق ذهبي",
      "price": 120.0,
      "points": 50,
      "barter": false,
      "stock": 5,
      "maxStock": 5,
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
      "rarity": "legendary",
      "description": "سيف ذو قوة عالية"
    },
    {
      "id": "i3",
      "name": "خاتم أثري",
      "price": 80.0,
      "points": 0,
      "barter": true,
      "stock": 3,
      "maxStock": 3,
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
      "rarity": "rare",
      "description": "بطاقة خاصة للمقايضة"
    },
  ];

  @override
  void initState() {
    super.initState();
    targetTime = DateTime.now().add(const Duration(hours: 1, minutes: 30));
    remaining = targetTime.difference(DateTime.now());
    _timer = Timer.periodic(const Duration(seconds: 1), (_) {
      final diff = targetTime.difference(DateTime.now());
      setState(() {
        remaining = diff.isNegative ? Duration.zero : diff;
      });
    });

    _glowController = AnimationController(vsync: this, duration: const Duration(seconds: 1))..repeat(reverse: true);
    _rotateController = AnimationController(vsync: this, duration: const Duration(seconds: 3))..repeat();
    _shakeController = AnimationController(vsync: this, duration: const Duration(milliseconds: 500))..repeat(reverse: true);
    _bounceController = AnimationController(vsync: this, duration: const Duration(milliseconds: 800))..repeat(reverse: true);
  }

  @override
  void dispose() {
    _timer.cancel();
    _glowController.dispose();
    _rotateController.dispose();
    _shakeController.dispose();
    _bounceController.dispose();
    super.dispose();
  }

  bool isBarter(Map<String, dynamic> item) => (item["barter"] as bool?) ?? false;

  void _showMsg(String txt) => ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(txt)));

  Future<void> handlePurchaseConfirm(int index) async {
    final item = items[index];
    final price = (item["price"] as num).toDouble();
    final stock = (item["stock"] as num?)?.toInt() ?? 0;
    final pointsGain = (item["points"] as num?)?.toInt() ?? 0;

    if (remaining.inSeconds <= 0 || stock <= 0 ||
        Provider.of<WalletService>(context, listen: false).getBalance() < price) {
      _showMsg(stock <= 0 ? "العنصر غير متوفر" : "رصيدك غير كافٍ أو انتهت القافلة");
      return;
    }


    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text("تأكيد شراء ${item["name"]}"),
        content: Text(isBarter(item) ? "قابل للمقايضة" : "تكسب +$pointsGain نقطة"),
        actions: [
          TextButton(onPressed: () => Navigator.of(ctx).pop(false), child: const Text("إلغاء")),
          ElevatedButton(onPressed: () => Navigator.of(ctx).pop(true), child: const Text("تأكيد")),
        ],
      ),
    );

    if (confirmed == true) {
      setState(() {
        Provider.of<WalletService>(context, listen: false).deductBalance(price, note: item["name"]);

        items[index]["stock"] = stock - 1;
        if (!isBarter(item)) points += pointsGain;
        purchaseHistory.insert(0, {
          "time": DateTime.now(),
          "name": item["name"],
          "price": price,
          "points": isBarter(item) ? 0 : pointsGain,
        });
      });
      _showMsg("${item["name"]} تم الشراء بنجاح ✅");
    }
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

  Widget animatedSymbol(DropVisual visual) {
    switch (visual.animation) {
      case 'glow':
        return FadeTransition(
          opacity: _glowController.drive(Tween(begin: 0.5, end: 1.0)),
          child: Text(visual.symbol, style: const TextStyle(fontSize: 36)),
        );
      case 'rotate':
        return RotationTransition(
          turns: _rotateController,
          child: Text(visual.symbol, style: const TextStyle(fontSize: 36)),
        );
      case 'shake':
        return AnimatedBuilder(
          animation: _shakeController,
          builder: (context, child) {
            double offset = sin(_shakeController.value * pi * 4) * 4;
            return Transform.translate(offset: Offset(offset, 0), child: child);
          },
          child: Text(visual.symbol, style: const TextStyle(fontSize: 36)),
        );
      case 'bounce':
        return SlideTransition(
          position: _bounceController.drive(Tween(begin: const Offset(0,0.1), end: const Offset(0,-0.1))),
          child: Text(visual.symbol, style: const TextStyle(fontSize: 36)),
        );
      default:
        return Text(visual.symbol, style: const TextStyle(fontSize: 36));
    }
  }


  Widget _buildHeaderCard() {
    return Padding(
      padding: const EdgeInsets.all(12.0),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 16),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(16),
          gradient: const LinearGradient(
            colors: [Color(0xFFFFF3E0), Color(0xFFFFE0B2)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.08),
              blurRadius: 8,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            // الرصيد والنقاط
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text("رصيدك", style: TextStyle(fontWeight: FontWeight.bold)),
                    const SizedBox(height: 4),
                    Consumer<WalletService>(
                      builder: (context, wallet, child) {
                        return Text(
                          "${wallet.getBalance().toStringAsFixed(2)} د.ع",
                          key: ValueKey(wallet.getBalance()), // هيتحدث تلقائياً عند تغير الرصيد
                          style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                        );
                      },
                    ),
                  ],
                ),

                const SizedBox(height: 12),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text("نقاطك", style: TextStyle(fontWeight: FontWeight.bold)),
                    const SizedBox(height: 4),
                    Text("$points", style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                  ],
                ),
              ],
            ),

            // الدائرة مع الوقت المتبقي
            Stack(
              alignment: Alignment.center,
              children: [
                SizedBox(
                  width: 70,
                  height: 70,
                  child: CircularProgressIndicator(
                    value: remaining.inSeconds / (1.5 * 3600), // نسبة الوقت المتبقي من 1.5 ساعة
                    strokeWidth: 6,
                    backgroundColor: Colors.grey.shade300,
                    color: remaining.inSeconds > 60 ? Colors.green : Colors.redAccent,
                  ),
                ),
                Text(
                  "${remaining.inHours.toString().padLeft(2,'0')}:${remaining.inMinutes.remainder(60).toString().padLeft(2,'0')}:${remaining.inSeconds.remainder(60).toString().padLeft(2,'0')}",
                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }






  @override
  Widget build(BuildContext context) {
    final bool active = remaining.inSeconds > 0;

    return Scaffold(
      appBar: AppBar(title: const Text("⚡ قافلة"), centerTitle: true),
      body: CustomScrollView(
        slivers: [
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(12.0),
              child: Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFFFFF3E0), Color(0xFFFFC107)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(20),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.15),
                      blurRadius: 12,
                      offset: const Offset(0, 6),
                    ),
                  ],
                ),
                child: Row(
                  children: [
                    // اليسار: الرصيد والنقاط جنب بعض
                    Expanded(
                      flex: 2,
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.start,
                        children: [
                          // الرصيد
                          Container(
                            padding: const EdgeInsets.symmetric(vertical: 6, horizontal: 12),
                            decoration: BoxDecoration(
                              color: Colors.amberAccent.shade100,
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text("رصيدك", style: TextStyle(fontWeight: FontWeight.bold)),
                                const SizedBox(height: 4),
                                Consumer<WalletService>(
                                  builder: (context, wallet, child) {
                                    return AnimatedSwitcher(
                                      duration: const Duration(milliseconds: 400),
                                      transitionBuilder: (child, anim) => ScaleTransition(scale: anim, child: child),
                                      child: Text(
                                        "${wallet.getBalance().toStringAsFixed(2)} د.ع",
                                        key: ValueKey(wallet.getBalance()),
                                        style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                                      ),
                                    );
                                  },
                                ),

                              ],
                            ),
                          ),
                          const SizedBox(width: 12),
                          // النقاط
                          Container(
                            padding: const EdgeInsets.symmetric(vertical: 6, horizontal: 12),
                            decoration: BoxDecoration(
                              color: Colors.amberAccent.shade100,
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text("نقاطك", style: TextStyle(fontWeight: FontWeight.bold)),
                                const SizedBox(height: 4),
                                AnimatedSwitcher(
                                  duration: const Duration(milliseconds: 400),
                                  transitionBuilder: (child, anim) => ScaleTransition(scale: anim, child: child),
                                  child: Text(
                                    "$points",
                                    key: ValueKey(points),
                                    style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),

                    // اليمين: دائرة الوقت
                    Expanded(
                      flex: 1,
                      child: SizedBox(
                        width: 110,
                        height: 110,
                        child: Stack(
                          alignment: Alignment.center,
                          children: [
                            // خلفية الدائرة: تدرج عصري
                            Container(
                              width: 110,
                              height: 110,
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                gradient: LinearGradient(
                                  colors: [Colors.white, Colors.white30],
                                  begin: Alignment.topLeft,
                                  end: Alignment.bottomRight,
                                ),
                                boxShadow: [
                                  BoxShadow(
                                    color: Colors.purple.shade200.withOpacity(0.5),
                                    blurRadius: 10,
                                    offset: const Offset(0, 4),
                                  ),
                                ],
                              ),
                            ),

                            // الدائرة المتحركة حسب الوقت
                            SizedBox(
                              width: 95,
                              height: 95,
                              child: CircularProgressIndicator(
                                value: remaining.inSeconds / (1.5 * 3600),
                                strokeWidth: 10,
                                backgroundColor: Colors.white.withOpacity(0.2),
                                valueColor: AlwaysStoppedAnimation(
                                  remaining.inSeconds > 300 ? Colors.amber: Colors.redAccent,
                                ),
                              ),
                            ),

                            // محتوى الدائرة: أيقونة + الوقت المتبقي
                            Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                const Icon(Icons.timer, size: 28, color: Colors.black),
                                const SizedBox(height: 4),
                                Text(
                                  "${remaining.inHours.toString().padLeft(2, '0')}:${remaining.inMinutes.remainder(60).toString().padLeft(2, '0')}:${remaining.inSeconds.remainder(60).toString().padLeft(2, '0')}",
                                  style: const TextStyle(
                                    fontWeight: FontWeight.bold,
                                    fontSize: 14,
                                    color: Colors.black87,
                                    shadows: [
                                      Shadow(
                                        color: Colors.black26,
                                        offset: Offset(1, 1),
                                        blurRadius: 2,
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ),


                  ],
                ),
              ),
            ),
          )
          ,




          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              child: Text(
                "🛒 سجل المشتريات",
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: Colors.grey[800],
                ),
              ),
            ),
          ),
          purchaseHistory.isEmpty
              ? SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(16.0),
              child: Center(
                child: Text(
                  "لا توجد مشتريات بعد",
                  style: TextStyle(
                    fontSize: 14,
                    color: Colors.grey[600],
                    fontStyle: FontStyle.italic,
                  ),
                ),
              ),
            ),
          )
              : SliverList(
            delegate: SliverChildBuilderDelegate(
                  (context, index) {
                final purchase = purchaseHistory[index];
                final time = purchase["time"] as DateTime;
                return Card(
                  elevation: 2,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                  child: ListTile(
                    leading: Icon(Icons.shopping_bag, color: Colors.orangeAccent),
                    title: Text(
                      purchase["name"],
                      style: const TextStyle(fontWeight: FontWeight.bold),
                    ),
                    subtitle: Text(
                      purchase["points"] > 0
                          ? "السعر: ${purchase["price"].toStringAsFixed(0)} د.ع | نقاط: ${purchase["points"]}"
                          : "السعر: ${purchase["price"].toStringAsFixed(0)} د.ع | قابل للمقايضة",
                    ),
                    trailing: Text(
                      "${time.hour.toString().padLeft(2,'0')}:${time.minute.toString().padLeft(2,'0')}:${time.second.toString().padLeft(2,'0')}",
                      style: const TextStyle(fontSize: 12, color: Colors.black54),
                    ),
                  ),
                );
              },
              childCount: purchaseHistory.length,
            ),
          ),



          // --- Grid العناصر ---
          SliverPadding(
            padding: const EdgeInsets.all(12),
            sliver: SliverGrid(
              delegate: SliverChildBuilderDelegate(
                    (context, index) {
                  final item = items[index];
                  final stock = (item["stock"] as num?)?.toInt() ?? 0;
                  final maxStock = (item["maxStock"] as num?)?.toInt() ?? 0;
                  final visual = dropVisualMap[item["id"]]!;
                  final wallet = Provider.of<WalletService>(context);
                  final canBuy = active && stock > 0 && wallet.getBalance() >= (item["price"] as num).toDouble();

                  final price = (item["price"] as num).toDouble();
                  final pointsGain = (item["points"] as num?)?.toInt() ?? 0;
                  final barter = isBarter(item);

                  return Card(
                    elevation: 3,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    child: Padding(
                      padding: const EdgeInsets.all(8.0),
                      child: Column(
                        children: [
                          animatedSymbol(visual),
                          const SizedBox(height: 6),
                          Text(item["name"], textAlign: TextAlign.center, style: const TextStyle(fontWeight: FontWeight.bold)),
                          Text(item["description"] ?? "", textAlign: TextAlign.center, style: const TextStyle(fontSize: 12)),
                          const SizedBox(height: 6),

                          // السعر والنقاط
                          Text(
                            barter ? "قابل للمقايضة" : "السعر: ${price.toStringAsFixed(0)} د.ع  +$pointsGain نقطة",
                            style: TextStyle(
                              color: barter ? Colors.deepOrange : Colors.green,
                              fontWeight: FontWeight.bold,
                              fontSize: 13,
                            ),
                            textAlign: TextAlign.center,
                          ),

                          const Spacer(),
                          LinearProgressIndicator(
                            value: maxStock > 0 ? stock / maxStock : 0,
                            color: rarityColor(item["rarity"] as String?),
                            backgroundColor: Colors.grey[200],
                          ),
                          Text("المخزون: $stock / $maxStock", style: const TextStyle(fontSize: 12)),
                          const SizedBox(height: 6),
                          SizedBox(
                            width: double.infinity,
                            child: ElevatedButton(
                              onPressed: canBuy ? () => handlePurchaseConfirm(index) : null,
                              style: ElevatedButton.styleFrom(
                                backgroundColor: canBuy ? Colors.orange : Colors.grey,
                              ),
                              child: Text(canBuy ? "شراء" : stock <= 0 ? "غير متوفر" : "رصيد غير كافٍ"),
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
        ],
      ),
    );
  }
}

// --- HalfCirclePainter ---
class HalfCirclePainter extends CustomPainter {
  final double progress; // 0.0 to 1.0
  final Color color;

  HalfCirclePainter({required this.progress, required this.color});

  @override
  void paint(Canvas canvas, Size size) {
    final rect = Rect.fromLTWH(0, 0, size.width, size.height * 2);
    final startAngle = pi; // البداية من اليسار
    final sweepAngle = pi * progress; // نصف دائرة
    final paint = Paint()
      ..color = color
      ..strokeWidth = 6
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round;

    canvas.drawArc(rect, startAngle, sweepAngle, false, paint);
  }

  @override
  bool shouldRepaint(covariant HalfCirclePainter oldDelegate) {
    return oldDelegate.progress != progress || oldDelegate.color != color;
  }
}
