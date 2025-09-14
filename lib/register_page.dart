import 'package:flutter/material.dart';

class RegisterPage extends StatelessWidget {
  const RegisterPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text("تسجيل حساب جديد")),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            TextField(
              decoration: const InputDecoration(labelText: "الاسم"),
            ),
            TextField(
              decoration: const InputDecoration(labelText: "البريد الإلكتروني"),
            ),
            TextField(
              decoration: const InputDecoration(labelText: "كلمة المرور"),
              obscureText: true,
            ),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: () {
                // هنا تقدر تضيف كود التسجيل بالـ API أو Firebase
                Navigator.pushReplacementNamed(context, "/home");
              },
              child: const Text("تسجيل"),
            ),
          ],
        ),
      ),
    );
  }
}
