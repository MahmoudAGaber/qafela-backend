import 'package:flutter/foundation.dart';

class WalletService extends ChangeNotifier {
  double balance = 2850.50;
  double totalEarned = 15420.75;

  final List<Map<String, dynamic>> transactions = [
    {
      "type": "purchase",
      "amount": -100,
      "item": "أموال - قافلة الخميس",
      "date": "2024-01-15 14:30"
    },
    {
      "type": "reward",
      "amount": 500,
      "item": "جائزة المركز الثالث",
      "date": "2024-01-14 20:15"
    },
    {
      "type": "purchase",
      "amount": -200,
      "item": "زيت - قافلة الأربعاء",
      "date": "2024-01-13 16:45"
    },
    {
      "type": "reward",
      "amount": 1000,
      "item": "جائزة أسبوعية",
      "date": "2024-01-12 12:00"
    },
    {
      "type": "purchase",
      "amount": -150,
      "item": "ذهب - قافلة الثلاثاء",
      "date": "2024-01-11 18:20"
    },
  ];

  /// إضافة طلب سحب
  void addWithdrawRequest(int amount, {String method = ""}) {
    if (amount <= 0 || amount > balance) return;

    balance -= amount;
    transactions.insert(0, {
      "type": "withdraw_request",
      "amount": -amount,
      "item": "طلب سحب عبر $method",
      "date": DateTime.now().toString().substring(0, 16),
    });
    notifyListeners();
  }

  /// إضافة رصيد (إيداع / جائزة)
  void addBalance(double amount, {String note = "إيداع"}) {
    balance += amount;
    totalEarned += amount;
    transactions.insert(0, {
      "type": "reward",
      "amount": amount,
      "item": note,
      "date": DateTime.now().toString().substring(0, 16),
    });
    notifyListeners();
  }

  /// خصم رصيد (شراء)
  void deductBalance(double amount, {String note = "شراء"}) {
    if (amount <= 0 || amount > balance) return;
    balance -= amount;
    transactions.insert(0, {
      "type": "purchase",
      "amount": -amount,
      "item": note,
      "date": DateTime.now().toString().substring(0, 16),
    });
    notifyListeners();
  }

  /// ---- إضافة دالة `credit` كـ واجهة متوافقة مع كود RewardCenter ----
  /// RewardCenter ينادي wallet.credit(amount, source: 'reward_1')
  void credit(int amount, {String source = 'unknown'}) {
    // نحول int الى double ونمرّر المصدر كنوت (note)
    addBalance(amount.toDouble(), note: source);
  }
}
