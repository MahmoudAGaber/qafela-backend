import 'package:flutter/foundation.dart';

class WalletService extends ChangeNotifier {
  double balance = 2850.50;
  double totalEarned = 15420.75;
  double points = 2500; // إضافة النقاط الموحدة

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

  /// جلب الرصيد الحالي
  double getBalance() => balance;

  /// إضافة طلب سحب
  void addWithdrawRequest(num amount, {String method = ""}) {
    double amt = amount.toDouble();
    if (amt <= 0 || amt > balance) return;

    balance -= amt;
    transactions.insert(0, {
      "type": "withdraw_request",
      "amount": -amt,
      "item": "طلب سحب عبر $method",
      "date": DateTime.now().toString().substring(0, 16),
    });
    notifyListeners();
  }

  /// إضافة رصيد (إيداع / جائزة)
  void addBalance(num amount, {String note = "إيداع"}) {
    double amt = amount.toDouble();
    balance += amt;
    totalEarned += amt;
    transactions.insert(0, {
      "type": "reward",
      "amount": amt,
      "item": note,
      "date": DateTime.now().toString().substring(0, 16),
    });
    notifyListeners();
  }

  /// خصم رصيد (شراء)
  void deductBalance(num amount, {String note = "شراء"}) {
    double amt = amount.toDouble();
    if (amt <= 0 || amt > balance) return;

    balance -= amt;
    transactions.insert(0, {
      "type": "purchase",
      "amount": -amt,
      "item": note,
      "date": DateTime.now().toString().substring(0, 16),
    });
    notifyListeners();
  }

  /// دالة `debit` (شراء مباشر)
  void debit(num amount) {
    double amt = amount.toDouble();
    if (balance >= amt) {
      balance -= amt;
      transactions.insert(0, {
        "type": "purchase",
        "amount": -amt,
        "item": "شراء من القافلة",
        "date": DateTime.now().toString(),
      });
      notifyListeners();
    }
  }

  /// دالة `credit` (مكافأة / إيداع) متوافقة مع int و double
  void credit(num amount, {String source = 'unknown'}) {
    addBalance(amount, note: source);
  }

// --- إدارة النقاط ---
  void addPoints(double p) {
    points += p;
    notifyListeners();
  }

  void deductPoints(double p) {
    if (p > points) return;
    points -= p;
    notifyListeners();
  }

  double getPoints() => points;


}





