import 'dart:async';
import 'package:flutter/material.dart';
import 'package:qafela/register_page.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    Timer(const Duration(seconds: 2), () {
      setState(() => _isLoading = false);
    });
  }

  void _handleLogin() {
    Navigator.pushReplacementNamed(context, "/home");
  }

  void _handleGuestLogin() {
    Navigator.pushReplacementNamed(context, "/home");
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      // 👇 شاشة البداية
      return Scaffold(
        backgroundColor: Colors.white,
        body: Center(
          child: Image.asset(
            "lib/Assets/images/Logo.jpg",
            width: 300,
            height: 300,
            fit: BoxFit.contain,
          ),
        ),
      );
    }

    // 👇 بعد انتهاء التحميل
    return Scaffold(
      backgroundColor: Colors.white,
      body: Center(
        child: Container(
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(24),
            boxShadow: const [
              BoxShadow(
                blurRadius: 12,
                color: Colors.black26,
                offset: Offset(0, 6),
              ),
            ],
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Image.asset(
                "lib/Assets/images/Logo.jpg",
                width: 90,
                height: 90,
                fit: BoxFit.contain,
              ),
              const SizedBox(height: 16),
              const Text(
                "مرحباً بك",
                style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 8),
              const Text("انضم إلى مغامرة الجوائز والإثارة"),
              const SizedBox(height: 24),
              ElevatedButton.icon(
                onPressed: _handleLogin,
                icon: const Icon(Icons.play_arrow),
                label: const Text("تسجيل الدخول"),
                style: ElevatedButton.styleFrom(
                  minimumSize: const Size(double.infinity, 50),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
              ),
              const SizedBox(height: 12),
              OutlinedButton(
                onPressed: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(builder: (context) => const RegisterPage()),
                  );
                },
                style: OutlinedButton.styleFrom(
                  minimumSize: const Size(double.infinity, 50),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                child: const Text("تسجيل حساب جديد"),
              ),

              const SizedBox(height: 16),
              const Text(
                "بالمتابعة، أنت توافق على الشروط والأحكام",
                style: TextStyle(fontSize: 12, color: Colors.grey),
                textAlign: TextAlign.center,
              )
            ],
          ),
        ),
      ),
    );
  }
}
