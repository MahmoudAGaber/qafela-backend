import 'package:flutter/material.dart';
import 'package:uuid/uuid.dart';

class LoginPage extends StatefulWidget {
  const LoginPage({super.key});

  @override
  State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> {
  final TextEditingController phoneController = TextEditingController();
  final TextEditingController nameController = TextEditingController();
  String? userId;
  String? avatarUrl; // رابط الصورة أو أفاتار

  bool otpSent = false;
  final otpController = TextEditingController();
  String generatedOTP = "";

  void sendOTP() {
    // توليد OTP عشوائي
    generatedOTP = (1000 + (9999 - 1000) * (new DateTime.now().millisecondsSinceEpoch % 1000) / 1000).toInt().toString();
    setState(() {
      otpSent = true;
    });
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text("OTP تم إرساله: $generatedOTP")),
    );
  }

  void verifyOTP() {
    if (otpController.text == generatedOTP) {
      _createUser();
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("OTP غير صحيح")),
      );
    }
  }

  void _createUser() {
    // توليد User ID فريد
    userId = const Uuid().v4();

    // إذا لم يختار المستخدم صورة، نضع افتراضية
    avatarUrl ??= "https://via.placeholder.com/150";

    // اسم اللاعب
    final playerName = nameController.text.isEmpty ? "لاعب" : nameController.text;

    // الانتقال للشاشة الرئيسية بعد تسجيل الدخول
    Navigator.pushReplacementNamed(context, "/home");

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text("مرحباً $playerName! تم تسجيل الدخول بنجاح.")),
    );
  }

  // دوال تسجيل الدخول عبر Google/Facebook (محاكاة فقط)
  void loginWithGoogle() {
    userId = const Uuid().v4();
    avatarUrl = "https://via.placeholder.com/150/4285F4/FFFFFF?text=G"; // مثال Google
    Navigator.pushReplacementNamed(context, "/home");
  }

  void loginWithFacebook() {
    userId = const Uuid().v4();
    avatarUrl = "https://via.placeholder.com/150/1877F2/FFFFFF?text=F"; // مثال Facebook
    Navigator.pushReplacementNamed(context, "/home");
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text("تسجيل الدخول")),
      body: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          children: [
            // رقم الهاتف + OTP
            TextField(
              controller: phoneController,
              keyboardType: TextInputType.phone,
              decoration: const InputDecoration(
                labelText: "رقم الهاتف",
                prefixText: "+20 ",
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 12),
            otpSent
                ? Column(
              children: [
                TextField(
                  controller: otpController,
                  keyboardType: TextInputType.number,
                  decoration: const InputDecoration(
                    labelText: "أدخل OTP",
                    border: OutlineInputBorder(),
                  ),
                ),
                const SizedBox(height: 8),
                ElevatedButton(
                  onPressed: verifyOTP,
                  child: const Text("تأكيد OTP"),
                ),
              ],
            )
                : ElevatedButton(
              onPressed: sendOTP,
              child: const Text("إرسال OTP"),
            ),

            const SizedBox(height: 24),

            // تسجيل الدخول عبر Google / Facebook
            ElevatedButton.icon(
              onPressed: loginWithGoogle,
              icon: const Icon(Icons.account_circle),
              label: const Text("تسجيل الدخول بـ Google"),
              style: ElevatedButton.styleFrom(backgroundColor: Colors.blue),
            ),
            const SizedBox(height: 12),
            ElevatedButton.icon(
              onPressed: loginWithFacebook,
              icon: const Icon(Icons.facebook),
              label: const Text("تسجيل الدخول بـ Facebook"),
              style: ElevatedButton.styleFrom(backgroundColor: Colors.indigo),
            ),

            const SizedBox(height: 24),

            // إنشاء حساب جديد (اسم + صورة)
            TextField(
              controller: nameController,
              decoration: const InputDecoration(
                labelText: "اسم اللاعب",
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 12),
            ElevatedButton(
              onPressed: _createUser,
              child: const Text("إنشاء حساب جديد"),
            ),
          ],
        ),
      ),
    );
  }
}
